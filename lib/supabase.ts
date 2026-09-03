import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const configurationError = new Error('Сервис авторизации временно не настроен. Web-интерфейс загружен, но вход пока недоступен.');

const unavailableSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: configurationError }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: configurationError }),
    signUp: async () => ({ data: { session: null }, error: configurationError }),
    signOut: async () => ({ error: configurationError }),
  },
} as any;

// Keep the public web shell renderable even if the deployment secret is missing.
// Authenticated API calls return a clear configuration error instead of blanking the app.
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : unavailableSupabase;
