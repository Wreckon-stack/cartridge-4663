import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { EffectsToggle, SoundToggle } from './Toggles'
import { audioEngine } from '@/audio/audio-engine'

beforeEach(() => {
  document.documentElement.className = ''
  vi.restoreAllMocks()
})

describe('SoundToggle', () => {
  it('starts OFF on every visit', () => {
    renderWithProviders(<SoundToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveTextContent('OFF')
  })

  it('starts OFF even when a previous session stored "on"', () => {
    // The stored preference must never be able to start audio by itself.
    window.localStorage.setItem('c4663:sound', 'on')
    renderWithProviders(<SoundToggle />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not construct an AudioContext before a user gesture', () => {
    const unlock = vi.spyOn(audioEngine, 'unlock')
    renderWithProviders(<SoundToggle />)
    expect(unlock).not.toHaveBeenCalled()
  })

  it('turns on only after a real click', async () => {
    vi.spyOn(audioEngine, 'unlock').mockResolvedValue(true)
    const user = userEvent.setup()
    renderWithProviders(<SoundToggle />)
    const button = screen.getByRole('button')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveTextContent('ON')
  })

  it('says so when the browser refuses audio instead of showing a fake ON state', async () => {
    vi.spyOn(audioEngine, 'unlock').mockResolvedValue(false)
    const user = userEvent.setup()
    renderWithProviders(<SoundToggle />)
    const button = screen.getByRole('button')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(await screen.findByText(/BLOCKED BY BROWSER/i)).toBeInTheDocument()
  })

  it('mutes on a second click and remembers the choice', async () => {
    vi.spyOn(audioEngine, 'unlock').mockResolvedValue(true)
    const mute = vi.spyOn(audioEngine, 'mute')
    const user = userEvent.setup()
    renderWithProviders(<SoundToggle />)
    const button = screen.getByRole('button')
    await user.click(button)
    await user.click(button)
    expect(mute).toHaveBeenCalled()
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(window.localStorage.getItem('c4663:sound')).toBe('off')
  })
})

describe('EffectsToggle', () => {
  it('starts at full when the OS has no motion preference', () => {
    renderWithProviders(<EffectsToggle />)
    expect(screen.getByRole('button')).toHaveTextContent('FULL')
  })

  it('puts fx-full on the document root by default', () => {
    renderWithProviders(<EffectsToggle />)
    expect(document.documentElement.classList.contains('fx-full')).toBe(true)
    expect(document.documentElement.classList.contains('fx-reduced')).toBe(false)
  })

  it('switches to reduced and flips the root class', async () => {
    const user = userEvent.setup()
    renderWithProviders(<EffectsToggle />)
    const button = screen.getByRole('button')
    await user.click(button)
    expect(button).toHaveTextContent('REDUCED')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.classList.contains('fx-reduced')).toBe(true)
  })

  it('persists the choice', async () => {
    const user = userEvent.setup()
    renderWithProviders(<EffectsToggle />)
    await user.click(screen.getByRole('button'))
    expect(window.localStorage.getItem('c4663:fx')).toBe('reduced')
  })

  it('starts reduced when the OS asks for reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      })),
    )
    renderWithProviders(<EffectsToggle />)
    expect(screen.getByRole('button')).toHaveTextContent('REDUCED')
  })
})
