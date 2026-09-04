import generated from './gallery.generated.json'

/**
 * The EVIDENCE REEL conveyor.
 *
 * Items come from `gallery.generated.json`, which `npm run assets` writes from
 * the poster definitions in scripts/generate-assets.mjs. That keeps the artwork
 * and its alt text in one place — a poster cannot be added to the reel without
 * also getting a description.
 *
 * To add a poster: add it to POSTERS in the generator, run `npm run assets`.
 */
export interface GalleryItem {
  readonly id: string
  readonly src: string
  readonly title: string
  readonly kicker: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export const GALLERY_ITEMS: readonly GalleryItem[] = generated as GalleryItem[]
