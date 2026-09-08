import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { NavBar } from './NavBar'
import { NAV_ITEMS } from '@/config/content/nav'

describe('the desktop strip', () => {
  it('links to every section anchor', () => {
    renderWithProviders(<NavBar />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const item of NAV_ITEMS) {
      expect(within(nav).getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
    }
  })

  it('puts the official X link in the header, not only in the footer', () => {
    // The X account is the project's only outbound channel, so it has to be
    // reachable without scrolling to the bottom of a very long page.
    renderWithProviders(<NavBar />)
    const links = screen.getAllByRole('link', { name: /official x/i })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', 'https://x.com/cartridge_rh')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
      expect(link).toHaveAttribute('target', '_blank')
    }
  })

  it('omits TRADE / LAUNCH entirely when no venue is configured', () => {
    // This project has no hosted trade page, so the nav must not carry a
    // permanently dead button. The primary call to action lives in the hero
    // and the final section, where it falls back to copying the contract.
    renderWithProviders(<NavBar />)
    expect(screen.queryByText('TRADE / LAUNCH')).not.toBeInTheDocument()
  })

  it('exposes both preference controls', () => {
    renderWithProviders(<NavBar />)
    expect(screen.getAllByRole('button', { name: /sound is off/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /visual effects/i }).length).toBeGreaterThan(0)
  })
})

describe('the mobile drawer', () => {
  it('is closed initially', () => {
    renderWithProviders(<NavBar />)
    expect(screen.queryByRole('dialog', { name: /site menu/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menu/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens from the menu button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    await user.click(screen.getByRole('button', { name: /menu/i }))
    expect(screen.getByRole('dialog', { name: /site menu/i })).toBeInTheDocument()
  })

  it('lists every section', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    await user.click(screen.getByRole('button', { name: /menu/i }))
    const drawer = screen.getByRole('dialog', { name: /site menu/i })
    for (const item of NAV_ITEMS) {
      expect(within(drawer).getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
    }
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    await user.click(screen.getByRole('button', { name: /menu/i }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /site menu/i })).not.toBeInTheDocument()
  })

  it('closes from the resume control', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    await user.click(screen.getByRole('button', { name: /menu/i }))
    const drawer = screen.getByRole('dialog', { name: /site menu/i })
    await user.click(within(drawer).getByRole('button', { name: /resume/i }))
    expect(screen.queryByRole('dialog', { name: /site menu/i })).not.toBeInTheDocument()
  })

  it('closes when a section is chosen', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    await user.click(screen.getByRole('button', { name: /menu/i }))
    const drawer = screen.getByRole('dialog', { name: /site menu/i })
    await user.click(within(drawer).getByRole('link', { name: 'GME LINK' }))
    expect(screen.queryByRole('dialog', { name: /site menu/i })).not.toBeInTheDocument()
  })

  it('returns focus to the menu button on close', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)
    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(menuButton)
  })

  it('locks background scrolling while open', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NavBar />)
    await user.click(screen.getByRole('button', { name: /menu/i }))
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
