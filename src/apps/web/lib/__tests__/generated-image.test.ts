import { describe, expect, it } from 'vitest';
import { generatedImageProps } from '../generated-image';

describe('generatedImageProps', () => {
  it('returns src, alt, 1024 dimensions and unoptimized', () => {
    expect(generatedImageProps('https://img.example.com/a.png', 'John 3:16')).toEqual({
      src: 'https://img.example.com/a.png',
      alt: 'Visual representation of John 3:16',
      width: 1024,
      height: 1024,
      unoptimized: true,
    });
  });

  it('trims the reference', () => {
    expect(generatedImageProps('data:image/png;base64,AAA', '  Psalm 23  ').alt).toBe(
      'Visual representation of Psalm 23'
    );
  });

  it('falls back when the reference is empty or whitespace', () => {
    expect(generatedImageProps('u', '').alt).toBe('Visual representation of the passage');
    expect(generatedImageProps('u', '   ').alt).toBe('Visual representation of the passage');
  });
});
