import React from 'react'
import NextImage from 'next/image'
import { generatedImageProps } from '../../../lib/generated-image'

interface GeneratedImageProps {
  url: string
  reference: string
  className?: string
}

export function GeneratedImage({ url, reference, className = 'w-full h-auto rounded-lg' }: GeneratedImageProps) {
  const { src, alt, width, height, unoptimized } = generatedImageProps(url, reference)
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized={unoptimized}
      className={className}
      sizes="100vw"
    />
  )
}

export default GeneratedImage
