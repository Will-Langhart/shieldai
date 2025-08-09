import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      query, 
      category, 
      tags, 
      visibility, 
      isFavorite, 
      startDate, 
      endDate,
      limit = 50,
      offset = 0 
    } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Build the query
    let supabaseQuery = supabase
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
      .eq('user_id', userId)
      .order('last_modified', { ascending: false });

    // Apply filters
    if (category && typeof category === 'string') {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    if (visibility && typeof visibility === 'string') {
      supabaseQuery = supabaseQuery.eq('visibility', visibility);
    }

    if (isFavorite === 'true') {
      supabaseQuery = supabaseQuery.eq('is_favorite', true);
    }

    if (startDate && typeof startDate === 'string') {
      supabaseQuery = supabaseQuery.gte('created_at', startDate);
    }

    if (endDate && typeof endDate === 'string') {
      supabaseQuery = supabaseQuery.lte('created_at', endDate);
    }

    // Apply text search if query is provided
    if (query && typeof query === 'string') {
      // Use full-text search if available, otherwise fallback to ILIKE
      try {
        // Try to use the search function first
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_bible_notes', {
            p_user_id: userId,
            p_search_query: query,
            p_limit: parseInt(limit as string),
            p_offset: parseInt(offset as string)
          });

        if (!searchError && searchResults) {
          const transformedNotes = searchResults.map((note: any) => ({
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

          return res.status(200).json({ 
            notes: transformedNotes,
            total: searchResults.length,
            query,
            filters: { category, tags, visibility, isFavorite, startDate, endDate }
          });
        }
      } catch (error) {
        console.log('Full-text search not available, falling back to ILIKE');
      }

      // Fallback to ILIKE search
      supabaseQuery = supabaseQuery.or(`note.ilike.%${query}%,reference.ilike.%${query}%`);
    }

    // Apply tag filter
    if (tags && typeof tags === 'string') {
      const tagArray = tags.split(',').map(tag => tag.trim());
      supabaseQuery = supabaseQuery.overlaps('tags', tagArray);
    }

    // Apply pagination
    supabaseQuery = supabaseQuery
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    const { data: notes, error } = await supabaseQuery;

    if (error) {
      console.error('Error searching notes:', error);
      return res.status(500).json({ error: 'Failed to search notes' });
    }

    // Transform the data to match frontend expectations
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

    // Get total count for pagination
    const { count } = await supabase
      .from('bible_notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.status(200).json({ 
      notes: transformedNotes,
      total: count || 0,
      query,
      filters: { category, tags, visibility, isFavorite, startDate, endDate },
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (count || 0) > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error handling search request:', error);
    res.status(500).json({ error: 'Failed to search notes' });
  }
}
