import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { noteId } = req.query;
  
  if (!noteId || typeof noteId !== 'string') {
    return res.status(400).json({ error: 'Note ID is required' });
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Delete the note, ensuring the user owns it
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
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get a specific note
      const { data: note, error } = await supabase
        .from('bible_notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching note:', error);
        return res.status(500).json({ error: 'Failed to fetch note' });
      }

      res.status(200).json(note);
    } catch (error) {
      console.error('Error handling GET request:', error);
      res.status(500).json({ error: 'Failed to get note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}