import { describe, expect, it } from 'vitest'
import {
  EXTERNAL_LINK_PROPS,
  explorerAddressUrl,
  explorerTokenUrl,
  explorerTxUrl,
  safeExternalUrl,
} from './links'
import { GME_STOCK_TOKEN_ADDRESS } from '@/config/chain.config'

describe('EXTERNAL_LINK_PROPS', () => {
  it('always carries the anti-tabnabbing attributes', () => {
    expect(EXTERNAL_LINK_PROPS.rel).toContain('noopener')
    expect(EXTERNAL_LINK_PROPS.rel).toContain('noreferrer')
    expect(EXTERNAL_LINK_PROPS.target).toBe('_blank')
  })
})

describe('explorer link builders', () => {
  it('builds an address link', () => {
    expect(explorerAddressUrl(GME_STOCK_TOKEN_ADDRESS)).toBe(
      `https://robinhoodchain.blockscout.com/address/${GME_STOCK_TOKEN_ADDRESS}`,
    )
  })

  it('builds a token link', () => {
    expect(explorerTokenUrl(GME_STOCK_TOKEN_ADDRESS)).toContain('/token/')
  })

  it('returns null rather than a broken link for bad input', () => {
    expect(explorerAddressUrl(null)).toBeNull()
    expect(explorerAddressUrl('0xnope')).toBeNull()
    expect(explorerAddressUrl('0x0000000000000000000000000000000000000000')).toBeNull()
  })

  it('validates transaction hashes', () => {
    const hash = '0x' + 'a'.repeat(64)
    expect(explorerTxUrl(hash)).toContain(`/tx/${hash}`)
    expect(explorerTxUrl('0xtooshort')).toBeNull()
    expect(explorerTxUrl(null)).toBeNull()
  })
})

describe('safeExternalUrl', () => {
  it('allows http and https', () => {
    expect(safeExternalUrl('https://example.com/x')).toBe('https://example.com/x')
    expect(safeExternalUrl('http://example.com/')).toBe('http://example.com/')
  })

  it('blocks javascript: URLs smuggled in through configuration', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
  })

  it('blocks data: URLs', () => {
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('blocks other schemes', () => {
    expect(safeExternalUrl('file:///etc/passwd')).toBeNull()
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('returns null for blank or unparseable values', () => {
    expect(safeExternalUrl('')).toBeNull()
    expect(safeExternalUrl('   ')).toBeNull()
    expect(safeExternalUrl('not a url')).toBeNull()
    expect(safeExternalUrl(undefined)).toBeNull()
  })
})
