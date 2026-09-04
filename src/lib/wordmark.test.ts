import { describe, expect, it } from 'vitest'
import { longestWordLength, splitWordmark, wordmarkStyle } from './wordmark'

describe('longestWordLength', () => {
  it('returns the longest word, not the total length', () => {
    // This is the whole point: the name renders one word per line, so the
    // widest single word decides how large the type can be.
    expect(longestWordLength('CARTRIDGE 4663')).toBe(9)
  })

  it('handles a single word', () => {
    expect(longestWordLength('BONK')).toBe(4)
  })

  it('handles three words', () => {
    expect(longestWordLength('THE LAST CARTRIDGE')).toBe(9)
  })

  it('collapses irregular whitespace', () => {
    expect(longestWordLength('  CARTRIDGE   4663  ')).toBe(9)
  })

  it('never returns 0, which would divide by zero in the CSS fit rule', () => {
    expect(longestWordLength('')).toBe(1)
    expect(longestWordLength('   ')).toBe(1)
  })

  it('scales for a very long name', () => {
    expect(longestWordLength('SUPERCALIFRAGILISTIC COIN')).toBe(20)
  })
})

describe('splitWordmark', () => {
  it('splits into first word and remainder', () => {
    expect(splitWordmark('CARTRIDGE 4663')).toEqual({ first: 'CARTRIDGE', rest: '4663' })
  })

  it('leaves rest empty for a single word', () => {
    expect(splitWordmark('BONK')).toEqual({ first: 'BONK', rest: '' })
  })

  it('keeps everything after the first word together', () => {
    expect(splitWordmark('THE LAST CARTRIDGE')).toEqual({ first: 'THE', rest: 'LAST CARTRIDGE' })
  })

  it('survives an empty name', () => {
    expect(splitWordmark('')).toEqual({ first: '', rest: '' })
  })
})

describe('wordmarkStyle', () => {
  it('exposes the character count as a CSS custom property', () => {
    expect(wordmarkStyle('CARTRIDGE 4663')).toEqual({ '--wm-chars': 9 })
  })

  it('adapts to a rebrand without any CSS change', () => {
    expect(wordmarkStyle('DEADMALL')).toEqual({ '--wm-chars': 8 })
    expect(wordmarkStyle('EXTRAORDINARILY LONG NAME')).toEqual({ '--wm-chars': 15 })
  })
})
