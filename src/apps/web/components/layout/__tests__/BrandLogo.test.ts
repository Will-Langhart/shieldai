import { describe, expect, it } from 'vitest';
import { brandLogoProps } from '../BrandLogo';

describe('brandLogoProps', () => {
  it('defaults to the decorative local logo at 32px', () => {
    const props = brandLogoProps();
    expect(props.src).toBe('/logo.png');
    expect(props.alt).toBe('');
    expect(props.width).toBe(32);
    expect(props.height).toBe(32);
  });

  it('uses the given size for width and height and passes the className through', () => {
    expect(brandLogoProps(28, 'h-7 w-7')).toEqual({
      src: '/logo.png',
      alt: '',
      width: 28,
      height: 28,
      className: 'h-7 w-7',
    });
  });
});
