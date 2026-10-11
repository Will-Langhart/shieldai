import { Redirect } from 'expo-router';

// Target of the OAuth redirect (shieldai://auth-callback). The auth session
// browser normally intercepts it, but if the OS opens the app via the deep
// link instead, send the user on; the root layout handles unauthenticated users.
export default function AuthCallback() {
  return <Redirect href="/(tabs)" />;
}
