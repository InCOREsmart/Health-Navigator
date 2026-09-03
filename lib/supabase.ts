import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Keep the public web shell renderable even if the deployment secret is missing.
// Authenticated API calls will show a clear configuration error instead of blanking the app.
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Сервис авторизации временно не настроен. Web-интерфейс загружен, но вход пока недоступен.');
  }
  return supabase;
}
