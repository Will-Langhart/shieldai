/**
 * Widget payloads the agent streams to the chat UI (as AG-UI CUSTOM "widget"
 * events) and stores on the assistant message so a reloaded conversation
 * renders the same cards. Type-only, so client components can import it.
 */
import type { Passage, Translation, VerseHit } from './types';

export interface WordStudyWord {
  surface: string;
  translit: string;
  gloss: string;
  strongs: string;
  morph: string;
  lemma?: string;
}

export interface LexiconFocus {
  strongs: string;
  lemma: string;
  translit: string;
  pos: string;
  gloss: string;
  definition: string;
}

export type Widget =
  | { type: 'passage'; data: Passage & { available: Translation[] } }
  | { type: 'translation_compare'; data: { reference: string; passages: Passage[] } }
  | {
      type: 'word_study';
      data: {
        reference: string;
        language: 'Greek' | 'Hebrew';
        verses: Array<{ verse: number; words: WordStudyWord[] }>;
        focus: LexiconFocus[];
        attribution: string;
      };
    }
  | { type: 'cross_refs'; data: { reference: string; source?: Passage; related: VerseHit[] } }
  | { type: 'verse_list'; data: { query: string; mode: 'semantic' | 'keyword'; hits: VerseHit[] } };

export type WidgetType = Widget['type'];

/** A widget as it travels on the stream and in message metadata. */
export interface WidgetEnvelope {
  /** Tool call that produced it, so the UI can place it next to that call's status row. */
  toolCallId: string;
  widget: Widget;
}
