import { describe, expect, it } from 'vitest';
import {
  PENDING_MESSAGE_KEY,
  browserSessionStorage,
  clearPendingMessage,
  savePendingMessage,
  takePendingMessage,
} from '../pending-message';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('PENDING_MESSAGE_KEY', () => {
  it('keeps the existing storage key', () => {
    expect(PENDING_MESSAGE_KEY).toBe('shieldai-pending-message');
  });
});

describe('save / take', () => {
  it('returns the saved text once and removes the key', () => {
    const storage = fakeStorage();
    savePendingMessage(storage, 'Is the resurrection historical?');
    expect(storage.data.get(PENDING_MESSAGE_KEY)).toBe('Is the resurrection historical?');
    expect(takePendingMessage(storage)).toBe('Is the resurrection historical?');
    expect(storage.data.has(PENDING_MESSAGE_KEY)).toBe(false);
    expect(takePendingMessage(storage)).toBeNull();
  });

  it('returns the text untrimmed when it has content', () => {
    const storage = fakeStorage({ [PENDING_MESSAGE_KEY]: '  hello \n' });
    expect(takePendingMessage(storage)).toBe('  hello \n');
  });

  it('returns null for a missing value', () => {
    expect(takePendingMessage(fakeStorage())).toBeNull();
  });

  it.each(['', '   ', '\n\t '])('returns null for %j and still removes the key', (value) => {
    const storage = fakeStorage({ [PENDING_MESSAGE_KEY]: value });
    expect(takePendingMessage(storage)).toBeNull();
    expect(storage.data.has(PENDING_MESSAGE_KEY)).toBe(false);
  });

  it('leaves other keys alone', () => {
    const storage = fakeStorage({ other: 'x', [PENDING_MESSAGE_KEY]: 'hi' });
    takePendingMessage(storage);
    expect(storage.data.get('other')).toBe('x');
  });
});

describe('clearPendingMessage', () => {
  it('removes the saved message', () => {
    const storage = fakeStorage({ [PENDING_MESSAGE_KEY]: 'hi' });
    clearPendingMessage(storage);
    expect(storage.data.has(PENDING_MESSAGE_KEY)).toBe(false);
  });
});

describe('missing or failing storage', () => {
  it('handles undefined storage', () => {
    expect(() => savePendingMessage(undefined, 'hi')).not.toThrow();
    expect(takePendingMessage(undefined)).toBeNull();
    expect(() => clearPendingMessage(undefined)).not.toThrow();
  });

  it('handles storage whose methods throw', () => {
    expect(() => savePendingMessage(throwing, 'hi')).not.toThrow();
    expect(takePendingMessage(throwing)).toBeNull();
    expect(() => clearPendingMessage(throwing)).not.toThrow();
  });

  it('returns null when only removeItem throws', () => {
    const storage = { ...fakeStorage({ [PENDING_MESSAGE_KEY]: 'hi' }), removeItem: throwing.removeItem };
    expect(takePendingMessage(storage)).toBeNull();
  });
});

describe('browserSessionStorage', () => {
  it('returns undefined when there is no window (SSR)', () => {
    expect(typeof window).toBe('undefined');
    expect(browserSessionStorage()).toBeUndefined();
  });
});
