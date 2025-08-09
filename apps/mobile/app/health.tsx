import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export default function HealthScreen() {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        const json = await res.json();
        setStatus(`${json.status} - ${json.message}`);
      } catch (e: any) {
        setStatus(`Error: ${e?.message || 'Failed to fetch'}`);
      }
    };
    fetchHealth();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>API Health</Text>
      <Text>{status}</Text>
    </View>
  );
}


