/**
 * Server-side JSON-RPC proxy.
 *
 * WHY THIS EXISTS
 * ---------------
 * A `VITE_*` variable is inlined into the public JS bundle, so a provider URL
 * configured that way is readable by anyone. There is no way to hide a URL the
 * browser calls directly — it is visible in the network panel no matter how the
 * bundle stores it. Obfuscation would be theatre.
 *
 * So the browser calls this endpoint on our own origin instead, and the real
 * provider URL lives in `RPC_URL` — deliberately WITHOUT the `VITE_` prefix, so
 * the bundler cannot inline it even by accident.
 *
 * WHAT THIS DOES AND DOES NOT PROTECT
 * -----------------------------------
 * It stops the upstream key leaking. It does not make the endpoint private:
 * anyone can still POST here. The real defence is the method allow-list below —
 * this proxy will only ever forward the three read-only calls the site actually
 * makes, so it cannot be repurposed as a general-purpose RPC. Combine it with
 * origin restriction at the provider for defence in depth.
 */

/**
 * The only methods the site issues.
 *
 * `readContract` is the sole viem action used anywhere in the app (13 call
 * sites), which is `eth_call`. The other two are handshake calls viem makes on
 * its own. Anything else is rejected — no logs, no history, no traces, no
 * archive queries, nothing that could run up a bill.
 */
const ALLOWED_METHODS = new Set(['eth_call', 'eth_chainId', 'eth_blockNumber'])

/** Guard rails. The site's real batches are ~13 calls and a few KB. */
const MAX_BODY_BYTES = 64 * 1024
const MAX_BATCH_SIZE = 32
const UPSTREAM_TIMEOUT_MS = 12_000

interface JsonRpcRequest {
  jsonrpc?: unknown
  id?: unknown
  method?: unknown
  params?: unknown
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      // Responses carry live chain state; never let a CDN hold on to them.
      'cache-control': 'no-store',
      // No CORS headers: a browser on another origin cannot read the response.
      'x-content-type-options': 'nosniff',
    },
  })
}

/** A JSON-RPC error shaped so viem surfaces it as a normal RPC failure. */
function rpcError(id: unknown, code: number, message: string, status = 400): Response {
  return jsonResponse({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status)
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. This endpoint accepts POST only.' }, 405)
  }

  const upstream = process.env.RPC_URL
  if (!upstream) {
    // Misconfiguration, not a client error — and we say so without echoing config.
    return rpcError(null, -32603, 'RPC proxy is not configured.', 503)
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return rpcError(null, -32600, 'Request body too large.', 413)
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return rpcError(null, -32700, 'Parse error.')
  }

  const calls: JsonRpcRequest[] = Array.isArray(payload) ? payload : [payload as JsonRpcRequest]

  if (calls.length === 0) return rpcError(null, -32600, 'Empty request.')
  if (calls.length > MAX_BATCH_SIZE) {
    return rpcError(null, -32600, `Batch too large. Maximum ${MAX_BATCH_SIZE} calls.`)
  }

  for (const call of calls) {
    if (typeof call?.method !== 'string' || !ALLOWED_METHODS.has(call.method)) {
      // Name the method so a legitimate integration error is debuggable, but
      // reveal nothing about the upstream provider.
      return rpcError(
        call?.id ?? null,
        -32601,
        `Method not supported by this proxy: ${typeof call?.method === 'string' ? call.method : 'unknown'}`,
      )
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: raw,
      signal: controller.signal,
    })

    const text = await response.text()
    return new Response(text, {
      status: response.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    // The upstream URL can appear inside provider error messages, so we never
    // forward the original text.
    return rpcError(
      null,
      -32603,
      aborted ? 'Upstream RPC timed out.' : 'Upstream RPC request failed.',
      502,
    )
  } finally {
    clearTimeout(timer)
  }
}
