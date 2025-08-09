import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { reference, userId } = req.query;

      if (!reference || typeof reference !== 'string') {
        return res.status(400).json({ error: 'Reference parameter is required' });
      }

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get notes for the reference and user with enhanced fields
      const { data: notes, error } = await supabase
        .from('bible_notes')
        .select(`
          id,
          user_id,
          reference,
          text,
          note,
          tags,
          category,
          visibility,
          color,
          is_favorite,
          cross_references,
          related_verses,
          audio_note_url,
          attachments,
          created_at,
          last_modified
        `)
        .eq('reference', reference)
        .eq('user_id', userId)
        .order('last_modified', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      // Transform the data to match the frontend expectations
      const transformedNotes = (notes || []).map(note => ({
        id: note.id,
        reference: note.reference,
        text: note.text || '',
        note: note.note,
        tags: note.tags || [],
        category: note.category || 'Personal Study',
        visibility: note.visibility || 'private',
        color: note.color || '#3B82F6',
        isFavorite: note.is_favorite || false,
        crossReferences: note.cross_references || [],
        relatedVerses: note.related_verses || [],
        audioNoteUrl: note.audio_note_url,
        attachments: note.attachments || [],
        dateCreated: note.created_at,
        lastModified: note.last_modified,
        userId: note.user_id
      }));

      res.status(200).json({ notes: transformedNotes });
    } catch (error) {
      console.error('Error handling GET request:', error);
      res.status(500).json({ error: 'Failed to get notes' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        reference, 
        text = '',
        note, 
        tags = [], 
        category = 'Personal Study',
        visibility = 'private',
        color = '#3B82F6',
        isFavorite = false,
        crossReferences = [],
        relatedVerses = [],
        userId 
      } = req.body;

      if (!reference || !note || !userId) {
        return res.status(400).json({ error: 'Reference, note, and user ID are required' });
      }

      // Validate visibility
      if (!['private', 'shared', 'public'].includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility value' });
      }

      // Insert new note with enhanced fields
      const { data, error } = await supabase
        .from('bible_notes')
        .insert([
          {
            user_id: userId,
            reference,
            text,
            note: note.trim(),
            tags: Array.isArray(tags) ? tags : [],
            category,
            visibility,
            color,
            is_favorite: isFavorite,
            cross_references: Array.isArray(crossReferences) ? crossReferences : [],
            related_verses: Array.isArray(relatedVerses) ? relatedVerses : [],
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString()
          }
        ])
        .select(`
          id,
          user_id,
          reference,
          text,
          note,
          tags,
          category,
          visibility,
          color,
          is_favorite,
          cross_references,
          related_verses,
          audio_note_url,
          attachments,
          created_at,
          last_modified
        `)
        .single();

      if (error) {
        console.error('Error creating note:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      // Transform the response to match frontend expectations
      const transformedNote = {
        id: data.id,
        reference: data.reference,
        text: data.text || '',
        note: data.note,
        tags: data.tags || [],
        category: data.category || 'Personal Study',
        visibility: data.visibility || 'private',
        color: data.color || '#3B82F6',
        isFavorite: data.is_favorite || false,
        crossReferences: data.cross_references || [],
        relatedVerses: data.related_verses || [],
        audioNoteUrl: data.audio_note_url,
        attachments: data.attachments || [],
        dateCreated: data.created_at,
        lastModified: data.last_modified,
        userId: data.user_id
      };

      res.status(201).json(transformedNote);
    } catch (error) {
      console.error('Error handling POST request:', error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { 
        id,
        reference, 
        text = '',
        note, 
        tags = [], 
        category = 'Personal Study',
        visibility = 'private',
        color = '#3B82F6',
        isFavorite = false,
        crossReferences = [],
        relatedVerses = [],
        userId 
      } = req.body;

      if (!id || !reference || !note || !userId) {
        return res.status(400).json({ error: 'ID, reference, note, and user ID are required' });
      }

      // Validate visibility
      if (!['private', 'shared', 'public'].includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility value' });
      }

      // Update note with enhanced fields
      const { data, error } = await supabase
        .from('bible_notes')
        .update({
          reference,
          text,
          note: note.trim(),
          tags: Array.isArray(tags) ? tags : [],
          category,
          visibility,
          color,
          is_favorite: isFavorite,
          cross_references: Array.isArray(crossReferences) ? crossReferences : [],
          related_verses: Array.isArray(relatedVerses) ? relatedVerses : [],
          last_modified: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
          id,
          user_id,
          reference,
          text,
          note,
          tags,
          category,
          visibility,
          color,
          is_favorite,
          cross_references,
          related_verses,
          audio_note_url,
          attachments,
          created_at,
          last_modified
        `)
        .single();

      if (error) {
        console.error('Error updating note:', error);
        return res.status(500).json({ error: 'Failed to update note' });
      }

      // Transform the response to match frontend expectations
      const transformedNote = {
        id: data.id,
        reference: data.reference,
        text: data.text || '',
        note: data.note,
        tags: data.tags || [],
        category: data.category || 'Personal Study',
        visibility: data.visibility || 'private',
        color: data.color || '#3B82F6',
        isFavorite: data.is_favorite || false,
        crossReferences: data.cross_references || [],
        relatedVerses: data.related_verses || [],
        audioNoteUrl: data.audio_note_url,
        attachments: data.attachments || [],
        dateCreated: data.created_at,
        lastModified: data.last_modified,
        userId: data.user_id
      };

      res.status(200).json(transformedNote);
    } catch (error) {
      console.error('Error handling PUT request:', error);
      res.status(500).json({ error: 'Failed to update note' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { noteId, userId } = req.query;

      if (!noteId || !userId) {
        return res.status(400).json({ error: 'Note ID and user ID are required' });
      }

      const { error } = await supabase
        .from('bible_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({ error: 'Failed to delete note' });
      }

      res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error handling DELETE request:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 