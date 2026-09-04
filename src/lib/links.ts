import { EXPLORER_URL } from '@/config/chain.config'
import { checkAddress } from './address'

/**
 * Link builders.
 *
 * Every outbound URL in the app goes through here so that (a) we never emit a
 * link to an invalid address, and (b) the external-link security attributes are
 * applied in exactly one place.
 */

/** Attributes required on every external anchor. Prevents reverse tabnabbing. */
export const EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer nofollow',
} as const

export function explorerAddressUrl(address: string | null | undefined): string | null {
  const check = checkAddress(address)
  if (!check.ok) return null
  return `${EXPLORER_URL}/address/${check.address}`
}

export function explorerTokenUrl(address: string | null | undefined): string | null {
  const check = checkAddress(address)
  if (!check.ok) return null
  return `${EXPLORER_URL}/token/${check.address}`
}

export function explorerTxUrl(hash: string | null | undefined): string | null {
  if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash.trim())) return null
  return `${EXPLORER_URL}/tx/${hash.trim()}`
}

/**
 * Only http(s) URLs are allowed out of configuration. This blocks a
 * `javascript:` or `data:` URL smuggled in through an env var from ever
 * reaching an href.
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (trimmed === '') return null
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  return parsed.toString()
}
