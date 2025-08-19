import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import { getDailyVerse, getPassage, searchBible } from '@services/mobile-api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function BibleScreen() {
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPassage, setCurrentPassage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'daily' | 'search' | 'passage'>('daily');
  const { getAccessToken } = useAuth();

  useEffect(() => {
    fetchDailyVerse();
  }, []);

  const fetchDailyVerse = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await getDailyVerse(token || undefined);
      if (response.ok && response.data) {
        setDailyVerse(response.data);
      }
    } catch (error) {
      console.error('Error fetching daily verse:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await searchBible(searchQuery, undefined, token || undefined);
      if (response.ok && response.data) {
        setSearchResults((response.data as any).passages || []);
        setActiveView('search');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search Bible');
    } finally {
      setLoading(false);
    }
  };

  const handlePassageSelect = async (reference: string) => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await getPassage(reference, undefined, token || undefined);
      if (response.ok && response.data) {
        setCurrentPassage(response.data);
        setActiveView('passage');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch passage');
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    return html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
  };

  const renderDailyVerse = () => (
    <View className="p-6">
      <Text className="text-2xl font-bold mb-4">Daily Verse</Text>
      {dailyVerse ? (
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg mb-2">{stripHtml(dailyVerse.text)}</Text>
          <Text className="text-sm text-gray-600 text-right">
            — {dailyVerse.reference}
          </Text>
          <View className="flex-row mt-4 space-x-2">
            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg flex-1">
              <Text className="text-white text-center">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-300 px-4 py-2 rounded-lg flex-1">
              <Text className="text-gray-700 text-center">Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ActivityIndicator />
      )}
    </View>
  );

  const renderSearchResults = () => (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">Search Results</Text>
      {searchResults.map((result, index) => (
        <TouchableOpacity
          key={index}
          className="bg-white p-4 mb-2 rounded-lg border border-gray-200"
          onPress={() => handlePassageSelect(result.reference)}
        >
          <Text className="font-semibold">{result.reference}</Text>
          <Text className="text-gray-600 mt-1" numberOfLines={2}>
            {stripHtml(result.text)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPassage = () => (
    <ScrollView className="p-4">
      {currentPassage && (
        <>
          <Text className="text-xl font-bold mb-4">{currentPassage.reference}</Text>
          <Text className="text-base leading-6">{stripHtml(currentPassage.text)}</Text>
          <View className="flex-row mt-6 space-x-2">
            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg flex-1">
              <Text className="text-white text-center">Save Note</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-300 px-4 py-2 rounded-lg flex-1">
              <Text className="text-gray-700 text-center">Cross Refs</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2"
            placeholder="Search verses, keywords..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            className="bg-blue-600 px-4 py-2 rounded-lg justify-center"
            onPress={handleSearch}
          >
            <FontAwesome name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View className="flex-row mt-2 space-x-2">
          <TouchableOpacity
            className={`px-3 py-1 rounded-full ${
              activeView === 'daily' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            onPress={() => setActiveView('daily')}
          >
            <Text className={activeView === 'daily' ? 'text-white' : 'text-gray-700'}>
              Daily Verse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-1 rounded-full bg-gray-200">
            <Text className="text-gray-700">Popular</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-1 rounded-full bg-gray-200">
            <Text className="text-gray-700">Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {activeView === 'daily' && renderDailyVerse()}
          {activeView === 'search' && renderSearchResults()}
          {activeView === 'passage' && renderPassage()}
        </>
      )}
    </View>
  );
}
