import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { BootSequence } from './BootSequence'
import { audioEngine } from '@/audio/audio-engine'

/** The dialog appears after the POST animation; wait for it. */
async function waitForDialog() {
  return waitFor(() => screen.getByRole('dialog'), { timeout: 4000 })
}

describe('the boot dialog', () => {
  it('eventually presents a modal dialog', async () => {
    renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    const dialog = await waitForDialog()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('offers three ways in, all of which reach the site', async () => {
    renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    await waitForDialog()
    expect(screen.getByRole('button', { name: /START GAME/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /START \(SILENT\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /STAY IN THE LOBBY/i })).toBeInTheDocument()
  })

  it('requests sound only for START GAME', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BootSequence onEnter={onEnter} />)
    await waitForDialog()
    await user.click(screen.getByRole('button', { name: /START GAME/i }))
    expect(onEnter).toHaveBeenCalledWith({ withSound: true })
  })

  it('does NOT request sound for the silent option', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BootSequence onEnter={onEnter} />)
    await waitForDialog()
    await user.click(screen.getByRole('button', { name: /START \(SILENT\)/i }))
    expect(onEnter).toHaveBeenCalledWith({ withSound: false })
  })

  it('does NOT request sound for STAY IN THE LOBBY', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BootSequence onEnter={onEnter} />)
    await waitForDialog()
    await user.click(screen.getByRole('button', { name: /STAY IN THE LOBBY/i }))
    expect(onEnter).toHaveBeenCalledWith({ withSound: false })
  })

  it('never unlocks audio on its own', async () => {
    const unlock = vi.spyOn(audioEngine, 'unlock')
    renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    await waitForDialog()
    expect(unlock).not.toHaveBeenCalled()
  })

  it('lets the visitor out with the window close control', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BootSequence onEnter={onEnter} />)
    await waitForDialog()
    await user.click(screen.getByRole('button', { name: /skip the intro/i }))
    expect(onEnter).toHaveBeenCalledWith({ withSound: false })
  })

  it('lets the visitor out with Escape — nobody is ever trapped', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<BootSequence onEnter={onEnter} />)
    await waitForDialog()
    await user.keyboard('{Escape}')
    expect(onEnter).toHaveBeenCalledWith({ withSound: false })
  })

  it('moves focus into the dialog for keyboard users', async () => {
    renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    await waitForDialog()
    await waitFor(() => {
      expect(document.activeElement?.textContent).toMatch(/START GAME/i)
    })
  })

  it('locks page scrolling while the curtain is up, and restores it after', async () => {
    const { unmount } = renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    await waitForDialog()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('exposes the system check to assistive tech even though it is decorative', async () => {
    renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    await waitForDialog()
    expect(screen.getByText(/System check complete/i)).toBeInTheDocument()
  })

  it('is labelled by its own heading', async () => {
    renderWithProviders(<BootSequence onEnter={vi.fn()} />)
    const dialog = await waitForDialog()
    expect(dialog).toHaveAttribute('aria-labelledby', 'boot-title')
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'boot-title')
  })
})
