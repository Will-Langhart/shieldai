import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/auth';
import { searchChurches } from '@services/mobile-api';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Church {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  distance?: number;
  denomination?: string;
}

export default function ChurchScreen() {
  const [searchLocation, setSearchLocation] = useState('');
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to find nearby churches.');
      return false;
    }
    return true;
  };

  const handleUseMyLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setLocationLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Search churches using coordinates
      await searchChurchesByLocation(latitude, longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLocationLoading(false);
    }
  };

  const searchChurchesByLocation = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await searchChurches(
        {
          latitude: lat,
          longitude: lng,
          radius: 5000, // 5km radius
        },
        token || undefined
      );
      
      if (response.ok && response.data) {
        setChurches((response.data as any).results || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search churches');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchLocation.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await searchChurches(
        {
          location: searchLocation,
          radius: 5000,
        },
        token || undefined
      );
      
      if (response.ok && response.data) {
        setChurches((response.data as any).results || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search churches');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i < fullStars ? 'star' : 'star-o'}
          size={12}
          color="#FFC107"
        />
      );
    }
    
    return <View className="flex-row items-center">{stars}</View>;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Search Section */}
      <View className="p-4 border-b border-gray-200">
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 mb-3 flex-row justify-center items-center"
          onPress={handleUseMyLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <FontAwesome name="location-arrow" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Use My Location</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2"
            placeholder="City, State or Zip"
            value={searchLocation}
            onChangeText={setSearchLocation}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            className="bg-gray-600 px-4 py-2 rounded-lg justify-center"
            onPress={handleSearch}
          >
            <FontAwesome name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView className="flex-1">
          {churches.length === 0 ? (
            <View className="flex-1 justify-center items-center p-8 mt-20">
              <FontAwesome name="map-marker" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                Search for churches in your area{'\n'}or use your current location
              </Text>
            </View>
          ) : (
            churches.map((church, index) => (
              <TouchableOpacity
                key={church.place_id}
                className="p-4 border-b border-gray-100"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-base mb-1">
                      {church.name}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-2">
                      {church.formatted_address}
                    </Text>
                    
                    {church.rating && (
                      <View className="flex-row items-center space-x-2">
                        {renderStars(church.rating)}
                        <Text className="text-xs text-gray-500">
                          ({church.user_ratings_total || 0})
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {church.distance && (
                    <Text className="text-sm text-gray-500">
                      {(church.distance / 1000).toFixed(1)} km
                    </Text>
                  )}
                </View>

                <View className="flex-row mt-3 space-x-2">
                  <TouchableOpacity className="bg-blue-600 px-3 py-1 rounded">
                    <Text className="text-white text-sm">Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-gray-200 px-3 py-1 rounded">
                    <Text className="text-gray-700 text-sm">Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-gray-200 px-3 py-1 rounded">
                    <Text className="text-gray-700 text-sm">Website</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
