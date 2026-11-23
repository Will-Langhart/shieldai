import React from 'react'
import Image from 'next/image'

export interface BrandLogoImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

/**
 * Props for the decorative Shield AI logo (`public/logo.png`). The logo sits
 * next to the visible "Shield AI" text, so its alt text is empty.
 */
export function brandLogoProps(size: number = 32, className?: string): BrandLogoImageProps {
  return {
    src: '/logo.png',
    alt: '',
    width: size,
    height: size,
    className,
  }
}

interface BrandLogoProps {
  /** Rendered width and height in pixels. */
  size?: number
  className?: string
}

const BrandLogo = ({ size, className }: BrandLogoProps) => {
  const { alt, ...rest } = brandLogoProps(size, className)
  return <Image alt={alt} {...rest} />
}

export default BrandLogo
