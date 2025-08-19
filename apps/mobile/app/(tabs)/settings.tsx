import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { getSubscriptionStatus } from '@services/mobile-api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SubscriptionInfo {
  status: string;
  plan: string;
  features: any;
}

export default function SettingsScreen() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [notifications, setNotifications] = useState({
    dailyVerse: true,
    motivation: false,
    chatReminders: false,
    churchReminder: true,
  });
  const [loading, setLoading] = useState(true);
  const { user, signOut, getAccessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = getAccessToken();
      const response = await getSubscriptionStatus(token || undefined);
      if (response.ok && response.data) {
        setSubscription(response.data as SubscriptionInfo);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightElement 
  }: any) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="w-8 items-center">
        <FontAwesome name={icon} size={20} color="#6B7280" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-base">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>}
      </View>
      {rightElement || (showArrow && (
        <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
      ))}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View className="px-4 py-2 bg-gray-50">
      <Text className="text-sm font-semibold text-gray-600 uppercase">{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Account Section */}
      <SectionHeader title="Account" />
      <SettingRow
        icon="user"
        title={user?.email || 'User'}
        subtitle="Manage your profile"
        onPress={() => router.push('/settings/profile')}
      />
      <SettingRow
        icon="lock"
        title="Change Password"
        onPress={() => router.push('/settings/password')}
      />

      {/* Preferences Section */}
      <SectionHeader title="Preferences" />
      <SettingRow
        icon="language"
        title="Language"
        subtitle="English"
        onPress={() => router.push('/settings/language')}
      />
      <SettingRow
        icon="book"
        title="Default Bible Version"
        subtitle="KJV"
        onPress={() => router.push('/settings/bible-version')}
      />

      {/* Notifications Section */}
      <SectionHeader title="Notifications" />
      <SettingRow
        icon="sun-o"
        title="Daily Verse"
        rightElement={
          <Switch
            value={notifications.dailyVerse}
            onValueChange={(value) => 
              setNotifications({ ...notifications, dailyVerse: value })
            }
          />
        }
        showArrow={false}
      />
      <SettingRow
        icon="heart"
        title="Motivational Messages"
        rightElement={
          <Switch
            value={notifications.motivation}
            onValueChange={(value) => 
              setNotifications({ ...notifications, motivation: value })
            }
          />
        }
        showArrow={false}
      />
      <SettingRow
        icon="comments"
        title="Chat Reminders"
        rightElement={
          <Switch
            value={notifications.chatReminders}
            onValueChange={(value) => 
              setNotifications({ ...notifications, chatReminders: value })
            }
          />
        }
        showArrow={false}
      />
      <SettingRow
        icon="calendar"
        title="Church Reminder"
        subtitle="Weekend service reminders"
        rightElement={
          <Switch
            value={notifications.churchReminder}
            onValueChange={(value) => 
              setNotifications({ ...notifications, churchReminder: value })
            }
          />
        }
        showArrow={false}
      />

      {/* Subscription Section */}
      <SectionHeader title="Subscription" />
      <SettingRow
        icon="star"
        title={subscription?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
        subtitle={subscription?.plan === 'pro' ? 'Full access' : 'Upgrade for more features'}
        onPress={() => router.push('/settings/subscription')}
      />
      <SettingRow
        icon="bar-chart"
        title="Usage"
        subtitle="Track your feature usage"
        onPress={() => router.push('/settings/usage')}
      />

      {/* Data Section */}
      <SectionHeader title="Data" />
      <SettingRow
        icon="download"
        title="Export Data"
        subtitle="Download your data"
        onPress={() => Alert.alert('Export', 'Feature coming soon!')}
      />
      <SettingRow
        icon="trash"
        title="Delete Account"
        subtitle="Permanently delete your account"
        onPress={() => Alert.alert('Delete Account', 'Please contact support to delete your account.')}
      />

      {/* Sign Out */}
      <TouchableOpacity
        className="mx-4 my-6 bg-red-600 rounded-lg py-3"
        onPress={handleSignOut}
      >
        <Text className="text-white text-center font-semibold">Sign Out</Text>
      </TouchableOpacity>

      <View className="items-center pb-8">
        <Text className="text-gray-400 text-sm">Shield AI v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
