/**
 * Tests for the server-side RPC proxy (api/rpc.ts).
 *
 * The proxy is the thing standing between a public URL and someone else's
 * bill, so the allow-list is tested harder than most of the app.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as handler } from '../../api/rpc'

const UPSTREAM = 'https://provider.example/rpc/secret-key'

function post(body: unknown, init: RequestInit = {}): Request {
  return new Request('https://site.example/api/rpc', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  })
}

const call = (method: string, id = 1) => ({ jsonrpc: '2.0', id, method, params: [] })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('RPC_URL', UPSTREAM)
  fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x1237' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('method allow-list', () => {
  it.each(['eth_call', 'eth_chainId', 'eth_blockNumber'])('forwards %s', async (method) => {
    const res = await handler(post(call(method)))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it.each([
    'eth_getLogs',
    'eth_sendRawTransaction',
    'eth_getBalance',
    'debug_traceTransaction',
    'trace_block',
    'eth_getBlockByNumber',
    'personal_sign',
    'eth_accounts',
  ])('rejects %s without contacting the provider', async (method) => {
    const res = await handler(post(call(method)))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe(-32601)
    // The critical assertion: a rejected method must never reach upstream.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a batch if even one call is not allowed', async () => {
    const res = await handler(post([call('eth_call', 1), call('eth_getLogs', 2)]))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing or non-string method', async () => {
    for (const bad of [
      { jsonrpc: '2.0', id: 1 },
      { jsonrpc: '2.0', id: 1, method: 42 },
    ]) {
      const res = await handler(post(bad))
      expect(res.status).toBe(400)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('request shape', () => {
  it('accepts a batch of allowed calls', async () => {
    const res = await handler(post([call('eth_call', 1), call('eth_call', 2)]))
    expect(res.status).toBe(200)
  })

  it('exports POST only, so the platform answers other verbs with 405', async () => {
    // Routing is the platform's job: exporting a named method means Vercel
    // rejects GET/PUT/DELETE before this module is invoked. Asserting the
    // module surface is the meaningful check here.
    const module = await import('../../api/rpc')
    expect(Object.keys(module)).toEqual(['POST'])
  })

  it('rejects an oversized body before parsing it', async () => {
    const res = await handler(post('x'.repeat(64 * 1024 + 1)))
    expect(res.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an oversized batch', async () => {
    const res = await handler(post(Array.from({ length: 33 }, (_, i) => call('eth_call', i))))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an empty batch', async () => {
    const res = await handler(post([]))
    expect(res.status).toBe(400)
  })

  it('returns a JSON-RPC parse error for malformed JSON', async () => {
    const res = await handler(post('{not json'))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe(-32700)
  })
})

describe('secret handling', () => {
  it('never puts the upstream URL in a success response', async () => {
    const res = await handler(post(call('eth_call')))
    expect(await res.text()).not.toContain('secret-key')
  })

  it('never leaks the upstream URL when the provider errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error(`connect ECONNREFUSED ${UPSTREAM}`))
    const res = await handler(post(call('eth_call')))
    expect(res.status).toBe(502)
    const text = await res.text()
    expect(text).not.toContain('secret-key')
    expect(text).not.toContain('provider.example')
  })

  it('reports a timeout without leaking the provider', async () => {
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    fetchMock.mockRejectedValueOnce(abort)
    const res = await handler(post(call('eth_call')))
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error.message).toBe('Upstream RPC timed out.')
  })

  it('fails closed when RPC_URL is not configured', async () => {
    vi.stubEnv('RPC_URL', '')
    const res = await handler(post(call('eth_call')))
    expect(res.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('response handling', () => {
  it('passes the provider response through unchanged', async () => {
    const res = await handler(post(call('eth_chainId')))
    expect(await res.json()).toEqual({ jsonrpc: '2.0', id: 1, result: '0x1237' })
  })

  it('marks responses no-store so a CDN cannot hold chain state', async () => {
    const res = await handler(post(call('eth_call')))
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('sets no CORS headers, so other origins cannot read the response', async () => {
    const res = await handler(post(call('eth_call')))
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('forwards the provider status code on an upstream failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":"rate limited"}', { status: 429 }))
    const res = await handler(post(call('eth_call')))
    expect(res.status).toBe(429)
  })
})
