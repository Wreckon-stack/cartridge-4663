import { useContext } from 'react'
import { PrefsContext, type PrefsValue } from './prefs-context'

/** Access sound / FX preferences. Throws if used outside the provider. */
export function usePrefs(): PrefsValue {
  const value = useContext(PrefsContext)
  if (!value) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return value
}
