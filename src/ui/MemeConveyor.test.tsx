import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { MemeConveyor } from './MemeConveyor'
import { GALLERY_ITEMS } from '@/config/content/gallery'

const items = GALLERY_ITEMS.slice(0, 3)

describe('the moving belt', () => {
  it('exposes each poster exactly once to assistive tech, despite the duplicated track', () => {
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    // The clone track is aria-hidden, so accessible buttons == real items.
    const buttons = within(list).getAllByRole('button')
    expect(buttons).toHaveLength(items.length)
  })

  it('gives every poster real alt text', () => {
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    for (const item of items) {
      expect(screen.getByAltText(item.alt)).toBeInTheDocument()
    }
  })

  it('offers a pause control, as moving content must', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const pause = screen.getByRole('button', { name: /pause the moving gallery/i })
    expect(pause).toHaveAttribute('aria-pressed', 'false')
    await user.click(pause)
    expect(screen.getByRole('button', { name: /resume the moving gallery/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('the lightbox', () => {
  it('opens when a poster is chosen', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes with the close control', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('restores focus to the poster that opened it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    const trigger = within(list).getAllByRole('button')[0]!
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(trigger)
  })

  it('steps forward with the right arrow key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    expect(screen.getByRole('dialog')).toHaveAccessibleName(new RegExp(items[0]!.title, 'i'))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('dialog')).toHaveAccessibleName(new RegExp(items[1]!.title, 'i'))
  })

  it('wraps around backwards from the first item', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('dialog')).toHaveAccessibleName(new RegExp(items[items.length - 1]!.title, 'i'))
  })

  it('shows the description as visible text, not just alt', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(items[0]!.alt)).toBeInTheDocument()
  })

  it('locks background scrolling while open and releases it on close', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemeConveyor items={items} label="Posters" />)
    const list = screen.getByRole('list', { name: 'Posters' })
    await user.click(within(list).getAllByRole('button')[0]!)
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})

describe('empty state', () => {
  it('renders nothing rather than an empty belt', () => {
    const { container } = renderWithProviders(<MemeConveyor items={[]} label="Posters" />)
    expect(container).toBeEmptyDOMElement()
  })
})
