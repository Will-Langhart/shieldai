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

      // Get notes for the reference and user
      const { data: notes, error } = await supabase
        .from('bible_notes')
        .select('*')
        .eq('reference', reference)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      res.status(200).json({ notes: notes || [] });
    } catch (error) {
      console.error('Error handling GET request:', error);
      res.status(500).json({ error: 'Failed to get notes' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        reference, 
        text,
        note, 
        tags = [], 
        category,
        visibility,
        color,
        isFavorite,
        crossReferences,
        relatedVerses,
        userId 
      } = req.body;

      if (!reference || !note || !userId) {
        return res.status(400).json({ error: 'Reference, note, and user ID are required' });
      }

      // Insert new note with enhanced fields
      const { data, error } = await supabase
        .from('bible_notes')
        .insert([
          {
            user_id: userId,
            reference,
            text: text || '',
            note,
            tags: tags || [],
            category: category || 'Personal Study',
            visibility: visibility || 'private',
            color: color || '#3B82F6',
            is_favorite: isFavorite || false,
            cross_references: crossReferences || [],
            related_verses: relatedVerses || [],
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Error handling POST request:', error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { 
        id,
        reference, 
        text,
        note, 
        tags = [], 
        category,
        visibility,
        color,
        isFavorite,
        crossReferences,
        relatedVerses,
        userId 
      } = req.body;

      if (!id || !reference || !note || !userId) {
        return res.status(400).json({ error: 'ID, reference, note, and user ID are required' });
      }

      // Update note with enhanced fields
      const { data, error } = await supabase
        .from('bible_notes')
        .update({
          reference,
          text: text || '',
          note,
          tags: tags || [],
          category: category || 'Personal Study',
          visibility: visibility || 'private',
          color: color || '#3B82F6',
          is_favorite: isFavorite || false,
          cross_references: crossReferences || [],
          related_verses: relatedVerses || [],
          last_modified: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        return res.status(500).json({ error: 'Failed to update note' });
      }

      res.status(200).json(data);
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