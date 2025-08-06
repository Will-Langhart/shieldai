export interface BibleVerse {
  reference: string;
  text: string;
  version: string;
}

export interface NoteData {
  id: string;
  reference: string;
  text: string;
  note: string;
  tags: string[];
  category: string;
  visibility: 'private' | 'public' | 'shared';
  dateCreated: string;
  lastModified: string;
  userId: string;
  color?: string;
  isFavorite?: boolean;
  crossReferences?: string[];
  relatedVerses?: BibleVerse[];
  audioNoteUrl?: string;
  attachments?: string[];
}

export interface CreateNoteData extends Omit<NoteData, 'id' | 'dateCreated' | 'lastModified' | 'userId'> {
  id?: string;
}