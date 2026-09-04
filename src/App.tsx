import { useCallback, useState } from 'react'
import { BootSequence } from './sections/BootSequence'
import { NavBar } from './sections/NavBar'
import { Hero } from './sections/Hero'
import { PlayerVersus } from './sections/PlayerVersus'
import { PairEvidence } from './sections/PairEvidence'
import { MarketArcade } from './sections/MarketArcade'
import { HowPairing } from './sections/HowPairing'
import { Archives } from './sections/Archives'
import { Gallery } from './sections/Gallery'
import { HighScores } from './sections/HighScores'
import { FinalLevel } from './sections/FinalLevel'
import { Footer } from './sections/Footer'
import { PreviewBanner } from './sections/PreviewBanner'
import { BackgroundScene } from './fx/BackgroundScene'
import { useSecretCode } from './fx/useSecretCode'
import { CRTOverlay } from './ui/CRTOverlay'
import { features } from './config/project.config'
import { usePrefs } from './ui/usePrefs'

export function App() {
  const { setBooted, toggleSound } = usePrefs()
  const [showBoot, setShowBoot] = useState(true)
  const phosphor = useSecretCode(features.secretCode)

  const handleEnter = useCallback(
    ({ withSound }: { withSound: boolean }) => {
      setShowBoot(false)
      setBooted(true)
      // Sound is only ever enabled from inside this gesture handler, and only
      // if the visitor asked for it.
      if (withSound) void toggleSound()
    },
    [setBooted, toggleSound],
  )

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <BackgroundScene />

      {showBoot ? <BootSequence onEnter={handleEnter} /> : null}

      <NavBar />

      <main id="main">
        <PreviewBanner />
        <Hero />
        <PlayerVersus />
        <PairEvidence />
        <MarketArcade />
        <HowPairing />
        <Archives />
        <Gallery />
        <HighScores />
        <FinalLevel />
      </main>

      <Footer />

      <CRTOverlay />

      {/* Announced only when the easter egg is found; silent otherwise. */}
      <span role="status" aria-live="polite" className="visually-hidden">
        {phosphor ? 'Green phosphor mode unlocked.' : ''}
      </span>
    </>
  )
}
