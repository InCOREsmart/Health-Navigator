import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

const metrics = [
  { label: 'Сон', value: '7ч 42м', level: 82 },
  { label: 'Энергия', value: '76%', level: 76 },
  { label: 'Восстановление', value: '68%', level: 68 },
  { label: 'Активность', value: '6 420', level: 64 },
  { label: 'Стресс', value: '32%', level: 32 },
];

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('Расскажи, что происходит');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setConnected(Boolean(data.session)));
  }, []);

  const coreState = useMemo(() => (connected ? 'CORE ACTIVE' : 'READY TO LISTEN'), [connected]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>HEALTH NAVIGATOR</Text>
          <Text style={styles.title}>Твоё состояние</Text>
        </View>
        <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>{coreState}</Text></View>
      </View>

      <View style={styles.coreWrap}>
        <View style={styles.orbit} />
        <View style={styles.core}>
          <Text style={styles.coreLabel}>HEALTH</Text>
          <Text style={styles.coreValue}>76</Text>
          <Text style={styles.coreUnit}>CORE INDEX</Text>
        </View>
        <Text style={styles.coreHint}>Состояние меняется вместе с тобой</Text>
      </View>

      <View style={styles.metrics}>
        {metrics.map((item) => (
          <View key={item.label} style={styles.metric}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${item.level}%` }]} /></View>
          </View>
        ))}
      </View>

      <Pressable style={styles.primary} onPress={() => setMessage('Слушаю тебя…')}>
        <Text style={styles.primaryIcon}>◉</Text>
        <Text style={styles.primaryText}>{message}</Text>
      </Pressable>
      <Text style={styles.footer}>AI задаст только необходимые вопросы. Красные флаги проверяются отдельно.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#081014', paddingHorizontal: 20, paddingTop: 58 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { color: '#7FA7A2', fontSize: 11, letterSpacing: 2.2, fontWeight: '700' },
  title: { color: '#F2F7F5', fontSize: 27, fontWeight: '700', marginTop: 6 },
  status: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#72D5A3', marginRight: 7 },
  statusText: { color: '#8EA5A3', fontSize: 9, letterSpacing: 1 },
  coreWrap: { height: 350, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: '#29443F' },
  core: { width: 178, height: 178, borderRadius: 89, backgroundColor: '#102522', borderWidth: 1, borderColor: '#467C70', alignItems: 'center', justifyContent: 'center', shadowColor: '#59B89D', shadowOpacity: 0.25, shadowRadius: 30 },
  coreLabel: { color: '#8FB7B0', fontSize: 11, letterSpacing: 2 },
  coreValue: { color: '#F3FBF8', fontSize: 60, fontWeight: '300', lineHeight: 68 },
  coreUnit: { color: '#648681', fontSize: 9, letterSpacing: 1.5 },
  coreHint: { position: 'absolute', bottom: 8, color: '#718784', fontSize: 12 },
  metrics: { gap: 10 },
  metric: { flexDirection: 'row', alignItems: 'center' },
  metricLabel: { color: '#829693', width: 92, fontSize: 12 },
  metricValue: { color: '#D9E8E4', width: 65, fontSize: 12, fontWeight: '600' },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#1A2A29', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#67B89E', borderRadius: 2 },
  primary: { height: 58, borderRadius: 29, backgroundColor: '#DDF2EA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryIcon: { color: '#102522', fontSize: 18, marginRight: 10 },
  primaryText: { color: '#102522', fontSize: 16, fontWeight: '700' },
  footer: { color: '#607572', textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: 12, paddingHorizontal: 15 },
});
