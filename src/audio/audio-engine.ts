/**
 * Original chiptune audio, synthesised in the browser with WebAudio.
 *
 * There are no audio files in this project. Every sound is generated from
 * oscillators and noise buffers at runtime, which means:
 *   - nothing to license, nothing to attribute, no ripped game SFX;
 *   - ~0 bytes of audio payload;
 *   - the engine cannot make a sound before it has been constructed, and it is
 *     only ever constructed inside a user-gesture handler.
 *
 * The AudioContext is created lazily on first `unlock()`. Browsers start
 * contexts in a "suspended" state without a gesture, and we never try to work
 * around that — if resume() fails, sound simply stays off.
 */

export type SoundName =
  | 'coin' // primary action
  | 'select' // nav / secondary
  | 'confirm' // dialog accept
  | 'cancel' // dialog dismiss
  | 'error' // failed / blocked
  | 'powerup' // secret unlocked
  | 'boot' // boot sequence tick

interface Voice {
  type: OscillatorType
  /** [frequency, timeOffsetSeconds] pairs describing the pitch envelope. */
  notes: readonly (readonly [number, number])[]
  duration: number
  gain: number
  /** Optional short noise burst layered underneath. */
  noise?: { duration: number; gain: number; highpass: number }
}

/**
 * Voice definitions. Written as data rather than code so the whole sonic
 * palette is visible at a glance and easy to retune.
 */
const VOICES: Record<SoundName, Voice> = {
  coin: {
    type: 'square',
    notes: [
      [988, 0],
      [1319, 0.06],
    ],
    duration: 0.22,
    gain: 0.16,
  },
  select: {
    type: 'square',
    notes: [[660, 0]],
    duration: 0.05,
    gain: 0.09,
  },
  confirm: {
    type: 'square',
    notes: [
      [523, 0],
      [659, 0.05],
      [784, 0.1],
      [1047, 0.16],
    ],
    duration: 0.34,
    gain: 0.14,
  },
  cancel: {
    type: 'square',
    notes: [
      [392, 0],
      [262, 0.07],
    ],
    duration: 0.2,
    gain: 0.12,
  },
  error: {
    type: 'sawtooth',
    notes: [
      [180, 0],
      [120, 0.08],
      [90, 0.16],
    ],
    duration: 0.3,
    gain: 0.11,
    noise: { duration: 0.12, gain: 0.05, highpass: 900 },
  },
  powerup: {
    type: 'triangle',
    notes: [
      [392, 0],
      [523, 0.05],
      [659, 0.1],
      [784, 0.15],
      [1047, 0.2],
      [1319, 0.25],
    ],
    duration: 0.46,
    gain: 0.13,
  },
  boot: {
    type: 'square',
    notes: [[1200, 0]],
    duration: 0.03,
    gain: 0.045,
  },
}

export class AudioEngine {
  #ctx: AudioContext | null = null
  #master: GainNode | null = null
  #enabled = false
  #noiseBuffer: AudioBuffer | null = null

  get enabled(): boolean {
    return this.#enabled
  }

  /**
   * Must be called from inside a user-gesture handler (click/keydown).
   * Returns whether audio is actually usable afterwards.
   */
  async unlock(): Promise<boolean> {
    try {
      if (!this.#ctx) {
        const Ctor: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return false
        this.#ctx = new Ctor()
        this.#master = this.#ctx.createGain()
        this.#master.gain.value = 0.5
        this.#master.connect(this.#ctx.destination)
      }
      if (this.#ctx.state === 'suspended') await this.#ctx.resume()
      this.#enabled = this.#ctx.state === 'running'
      return this.#enabled
    } catch {
      // Autoplay policy, no output device, or WebAudio disabled entirely.
      this.#enabled = false
      return false
    }
  }

  mute(): void {
    this.#enabled = false
    void this.#ctx?.suspend().catch(() => {})
  }

  /** Release hardware. Called on unmount. */
  dispose(): void {
    this.#enabled = false
    void this.#ctx?.close().catch(() => {})
    this.#ctx = null
    this.#master = null
    this.#noiseBuffer = null
  }

  play(name: SoundName): void {
    if (!this.#enabled || !this.#ctx || !this.#master) return
    const ctx = this.#ctx
    const voice = VOICES[name]
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = voice.type

    const first = voice.notes[0]
    if (!first) return
    osc.frequency.setValueAtTime(first[0], now)
    for (const [freq, offset] of voice.notes.slice(1)) {
      // setValueAtTime, not a ramp — stepped pitch is the whole point.
      osc.frequency.setValueAtTime(freq, now + offset)
    }

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(voice.gain, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.duration)

    osc.connect(gain).connect(this.#master)
    osc.start(now)
    osc.stop(now + voice.duration + 0.02)

    if (voice.noise) this.#playNoise(voice.noise, now)
  }

  #playNoise(spec: NonNullable<Voice['noise']>, startTime: number): void {
    const ctx = this.#ctx
    if (!ctx || !this.#master) return

    if (!this.#noiseBuffer) {
      const length = Math.floor(ctx.sampleRate * 0.4)
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      // Deterministic pseudo-noise: same fizz every time, no Math.random.
      let seed = 0x5eed
      for (let i = 0; i < length; i += 1) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        data[i] = (seed / 0x3fffffff - 1) * 0.7
      }
      this.#noiseBuffer = buffer
    }

    const source = ctx.createBufferSource()
    source.buffer = this.#noiseBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = spec.highpass

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(spec.gain, startTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + spec.duration)

    source.connect(filter).connect(gain).connect(this.#master)
    source.start(startTime)
    source.stop(startTime + spec.duration + 0.02)
  }
}

export const audioEngine = new AudioEngine()
