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

  it('disables TRADE / LAUNCH when no venue is configured, rather than linking nowhere', () => {
    renderWithProviders(<NavBar />)
    const trade = screen.getAllByText('TRADE / LAUNCH')[0]!.closest('[aria-disabled], a')
    expect(trade).toHaveAttribute('aria-disabled', 'true')
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
