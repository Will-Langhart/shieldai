import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Church {
  id: string;
  name: string;
  address: string;
  distance: string;
  denomination: string;
  serviceTime?: string;
}

export default function ChurchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // TODO: wire up to /api/churches/search with geocode + radius
      Alert.alert('Coming soon', 'Church finder is under construction.');
    } catch (e) {
      console.error('Church search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderChurch = ({ item }: { item: Church }) => (
    <View className="mx-4 mb-3 bg-white rounded-xl border border-gray-100 p-4">
      <Text className="font-semibold text-base text-gray-900">{item.name}</Text>
      <Text className="text-sm text-gray-500 mt-1">{item.denomination} · {item.distance}</Text>
      <Text className="text-sm text-gray-500">{item.address}</Text>
      {item.serviceTime && (
        <Text className="text-sm text-blue-600 mt-1">{item.serviceTime}</Text>
      )}
      <View className="flex-row mt-3 gap-2">
        <TouchableOpacity className="flex-1 bg-blue-600 rounded-lg py-2 items-center">
          <Text className="text-white text-sm font-medium">Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 border border-gray-200 rounded-lg py-2 items-center">
          <Text className="text-gray-700 text-sm font-medium">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Church Finder</Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <FontAwesome name="search" size={16} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="City, state, or zip code"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          className="mt-3 bg-blue-600 rounded-xl py-3 items-center"
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderChurch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-12">
            <FontAwesome name="map-marker" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-center mt-4">
              Search for churches near you
            </Text>
          </View>
        }
      />
    </View>
  );
}
