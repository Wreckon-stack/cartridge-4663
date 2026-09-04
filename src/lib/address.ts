import { getAddress, isAddress } from 'viem'

/** A 0x-prefixed, EIP-55 checksummed address. */
export type ChecksumAddress = `0x${string}`

export type AddressCheck =
  { ok: true; address: ChecksumAddress } | { ok: false; reason: 'missing' | 'malformed' | 'zero' }

/**
 * Validate an address without ever throwing.
 *
 * Deliberately strict: we accept any casing on input (users paste from all
 * sorts of places) but always return the EIP-55 checksummed form, so two
 * differently-cased spellings of the same contract compare equal downstream.
 * The zero address is rejected on its own branch because it is the single most
 * common "unset config" value and must never render as a real contract.
 */
export function checkAddress(value: string | null | undefined): AddressCheck {
  if (value == null) return { ok: false, reason: 'missing' }
  const trimmed = value.trim()
  if (trimmed === '') return { ok: false, reason: 'missing' }
  if (!isAddress(trimmed, { strict: false })) return { ok: false, reason: 'malformed' }
  const checksummed = getAddress(trimmed)
  if (/^0x0{40}$/i.test(checksummed)) return { ok: false, reason: 'zero' }
  return { ok: true, address: checksummed }
}

/** Convenience predicate. */
export function isValidAddress(value: string | null | undefined): boolean {
  return checkAddress(value).ok
}

/** Case-insensitive address equality that tolerates unchecksummed input. */
export function addressesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = checkAddress(a)
  const right = checkAddress(b)
  return left.ok && right.ok && left.address === right.address
}

/**
 * Shorten for display: 0x1b0E…153E.
 * Never used where the user needs to verify a contract — those get the full
 * string plus a copy control, because a truncated address is exactly how
 * address-spoofing scams work.
 */
export function shortenAddress(value: string, lead = 6, tail = 4): string {
  const check = checkAddress(value)
  const address = check.ok ? check.address : value
  if (address.length <= lead + tail + 1) return address
  return `${address.slice(0, lead)}…${address.slice(-tail)}`
}
