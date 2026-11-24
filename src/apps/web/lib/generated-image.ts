export interface GeneratedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  unoptimized: true;
}

/**
 * Props for rendering an AI-generated passage image with next/image.
 * `unoptimized` because the URLs come from the image provider's domain (or
 * are data URLs), which isn't in next.config.js `images.remotePatterns`.
 */
export function generatedImageProps(url: string, reference: string): GeneratedImageProps {
  const trimmed = (reference ?? '').trim();
  return {
    src: url,
    alt: trimmed ? `Visual representation of ${trimmed}` : 'Visual representation of the passage',
    width: 1024,
    height: 1024,
    unoptimized: true,
  };
}
