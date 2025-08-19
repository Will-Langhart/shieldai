import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { listNotes } from '@services/mobile-api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Note {
  id: string;
  title: string;
  content: string;
  reference?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getAccessToken } = useAuth();
  const router = useRouter();

  const fetchNotes = async () => {
    try {
      const token = getAccessToken();
      const response = await listNotes(token || undefined);
      if (response.ok && response.data) {
        setNotes(response.data as Note[]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      className="bg-white p-4 mx-4 mb-3 rounded-lg shadow-sm border border-gray-100"
      onPress={() => router.push(`/notes/${item.id}`)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="font-semibold text-base flex-1 mr-2" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-gray-500 text-xs">
          {formatDate(item.updated_at)}
        </Text>
      </View>
      
      {item.reference && (
        <View className="flex-row items-center mb-2">
          <FontAwesome name="book" size={12} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1">{item.reference}</Text>
        </View>
      )}
      
      <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
        {item.content}
      </Text>
      
      {item.tags && item.tags.length > 0 && (
        <View className="flex-row flex-wrap">
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
              <Text className="text-xs text-gray-600">{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-8 mt-20">
            <FontAwesome name="sticky-note-o" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4">
              No notes yet.{'\n'}Create your first Bible study note!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/notes/new')}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
