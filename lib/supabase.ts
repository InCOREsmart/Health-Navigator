import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gtlajttecydbjkswichv.supabase.co';

// Supabase publishable keys are explicitly safe for browser/mobile clients.
// Keep a known-valid project key as the client fallback so a stale GitHub secret
// cannot break authentication in the public build.
const publishableKey = 'sb_publishable_t25Jwzl9T675xSM4s1WUtQ_kM9CyHEI';

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

export const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : unavailableSupabase;
