import { describe, expect, it } from 'vitest'
import { addressesEqual, checkAddress, isValidAddress, shortenAddress } from './address'
import { GME_STOCK_TOKEN_ADDRESS } from '@/config/chain.config'

const GME_LOWER = GME_STOCK_TOKEN_ADDRESS.toLowerCase()

describe('checkAddress', () => {
  it('accepts a checksummed address and returns it unchanged', () => {
    const result = checkAddress(GME_STOCK_TOKEN_ADDRESS)
    expect(result).toEqual({ ok: true, address: GME_STOCK_TOKEN_ADDRESS })
  })

  it('accepts a lower-case address and normalises it to EIP-55', () => {
    const result = checkAddress(GME_LOWER)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.address).toBe(GME_STOCK_TOKEN_ADDRESS)
  })

  it('reports missing values distinctly from malformed ones', () => {
    expect(checkAddress(null)).toEqual({ ok: false, reason: 'missing' })
    expect(checkAddress(undefined)).toEqual({ ok: false, reason: 'missing' })
    expect(checkAddress('   ')).toEqual({ ok: false, reason: 'missing' })
  })

  it('rejects malformed input', () => {
    expect(checkAddress('0x123')).toEqual({ ok: false, reason: 'malformed' })
    expect(checkAddress('not an address')).toEqual({ ok: false, reason: 'malformed' })
    // 39 hex chars, one short
    expect(checkAddress('0x1b0E319c6A659F002271B69dB8A7df2F911c153')).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })

  it('rejects the zero address on its own branch — the classic unset-config value', () => {
    expect(checkAddress('0x0000000000000000000000000000000000000000')).toEqual({
      ok: false,
      reason: 'zero',
    })
  })

  it('never throws, whatever it is given', () => {
    expect(() => checkAddress('0xZZZZ')).not.toThrow()
    expect(() => checkAddress('')).not.toThrow()
  })
})

describe('addressesEqual', () => {
  it('is case-insensitive', () => {
    expect(addressesEqual(GME_STOCK_TOKEN_ADDRESS, GME_LOWER)).toBe(true)
    expect(
      addressesEqual(GME_STOCK_TOKEN_ADDRESS, GME_STOCK_TOKEN_ADDRESS.toUpperCase().replace('0X', '0x')),
    ).toBe(true)
  })

  it('is false for different addresses', () => {
    expect(addressesEqual(GME_STOCK_TOKEN_ADDRESS, '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e')).toBe(false)
  })

  it('is false when either side is invalid — never accidentally "equal by absence"', () => {
    expect(addressesEqual(null, null)).toBe(false)
    expect(addressesEqual(GME_STOCK_TOKEN_ADDRESS, null)).toBe(false)
    expect(
      addressesEqual(
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
      ),
    ).toBe(false)
  })
})

describe('isValidAddress', () => {
  it('agrees with checkAddress', () => {
    expect(isValidAddress(GME_STOCK_TOKEN_ADDRESS)).toBe(true)
    expect(isValidAddress('0xnope')).toBe(false)
  })
})

describe('shortenAddress', () => {
  it('shortens for display', () => {
    expect(shortenAddress(GME_STOCK_TOKEN_ADDRESS)).toBe('0x1b0E…153E')
  })

  it('leaves short strings alone', () => {
    expect(shortenAddress('0x1234')).toBe('0x1234')
  })
})
