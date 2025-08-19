import React, { useEffect, useState } from 'react';
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
import { listConversations } from '@services/mobile-api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Conversation {
  id: string;
  title: string;
  last_message?: string;
  updated_at: string;
}

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getAccessToken } = useAuth();
  const router = useRouter();

  const fetchConversations = async () => {
    try {
      const token = getAccessToken();
      const response = await listConversations(token || undefined);
      if (response.ok && response.data) {
        setConversations(response.data as Conversation[]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-200"
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View className="flex-row justify-between">
        <Text className="font-semibold text-base flex-1 mr-2" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-gray-500 text-sm">
          {formatDate(item.updated_at)}
        </Text>
      </View>
      {item.last_message && (
        <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
          {item.last_message}
        </Text>
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
    <View className="flex-1 bg-white">
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-8">
            <FontAwesome name="comments-o" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4">
              No conversations yet.{'\n'}Start a new chat to get started!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/chat/new')}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
