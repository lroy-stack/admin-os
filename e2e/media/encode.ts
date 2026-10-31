import sharp from "sharp";

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

/** A screencast frame: Playwright sends one per repaint, stamped in epoch milliseconds. */
export interface Frame {
  readonly data: Buffer;
  readonly timestamp: number;
}

/** GIF and WebP players clamp delays under 20 ms to 100 ms, so shorter frames would slow the motion down. */
const MIN_DELAY_MS = 20;

/** Still screens as WebP: UI text stays sharp at a fraction of the PNG size, and GitHub renders it inline. */
export async function writeStill(path: string, png: Buffer, width: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await sharp(png).resize({ width }).webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(path);
}

/** A social preview card (Open Graph, X): the top of a screen, cropped to the card's aspect ratio. */
export async function writeCard(path: string, png: Buffer, width: number, height: number): Promise<void> {
  await sharp(png).resize({ width, height, fit: "cover", position: "top" }).png({ compressionLevel: 9 }).toFile(path);
}

/**
 * Animated WebP from screencast frames. Each frame lasts until the next repaint, so a still stretch stays one frame;
 * the last one lasts `holdMs` before the loop restarts. WebP keeps the glass gradients that a 256-colour GIF bands.
 * Quality stays at 100: below it the animation encoder keeps "similar" blocks of earlier frames, which leaves stale
 * patches on the dark glass gradients after a page change.
 */
export async function writeAnimation(path: string, frames: readonly Frame[], width: number, holdMs: number) {
  const delays = frames.map((frame, index) => {
    const next = frames[index + 1];
    const delay = next ? next.timestamp - frame.timestamp : holdMs;
    return Math.max(MIN_DELAY_MS, Math.round(delay / 10) * 10);
  });
  const resized = await Promise.all(frames.map((frame) => sharp(frame.data).resize({ width }).png().toBuffer()));
  await mkdir(dirname(path), { recursive: true });
  await sharp(resized, { join: { animated: true } })
    .webp({ quality: 100, effort: 4, loop: 0, delay: delays, smartSubsample: true })
    .toFile(path);
}
