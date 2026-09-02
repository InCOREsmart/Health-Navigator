import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { createEpisodeWithSymptoms, extractSymptoms, getTraditionalEvidence, searchTraditional, submitAnswer, TraditionalEvidence, TraditionalPractice, EpisodeQuestion, EpisodeResult } from '../lib/healthNavigator';

const metrics = [
  { label: 'Сон', value: '7ч 42м', level: 82 },
  { label: 'Энергия', value: '76%', level: 76 },
  { label: 'Восстановление', value: '68%', level: 68 },
  { label: 'Активность', value: '6 420', level: 64 },
  { label: 'Стресс', value: '32%', level: 32 },
];

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<'home' | 'check' | 'evidence'>('home');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [practices, setPractices] = useState<TraditionalPractice[]>([]);
  const [selected, setSelected] = useState<TraditionalPractice | null>(null);
  const [evidence, setEvidence] = useState<TraditionalEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [episode, setEpisode] = useState<EpisodeResult | null>(null);
  const [question, setQuestion] = useState<EpisodeQuestion | null>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setConnected(Boolean(data.session))); }, []);

  async function beginCheck() {
    setError('');
    const description = text.trim();
    if (!description) { setError('Опиши хотя бы один симптом.'); return; }
    if (!connected) { setError('Для сохранения эпизода нужен вход в аккаунт.'); return; }
    setLoading(true);
    try {
      const symptoms = extractSymptoms(description);
      if (!symptoms.length) {
        setError('Я пока не распознал симптом. Опиши его подробнее, например: «второй день болит живот и тошнит».');
        return;
      }
      const result = await createEpisodeWithSymptoms('Проверка состояния', symptoms);
      setEpisode(result);
      setQuestion(result.next_question ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось начать оценку'); }
    finally { setLoading(false); }
  }

  async function sendAnswer() {
    if (!episode?.episode_id || !question?.code || !question.question || !answer.trim()) return;
    setLoading(true); setError('');
    try {
      const result = await submitAnswer(episode.episode_id, question, answer.trim());
      setEpisode(result);
      setQuestion(result.next_question ?? null);
      setAnswer('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить ответ'); }
    finally { setLoading(false); }
  }

  async function runSearch() {
    setError(''); setLoading(true);
    try { setPractices(await searchTraditional(search)); } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить данные'); }
    finally { setLoading(false); }
  }

  async function openPractice(practice: TraditionalPractice) {
    setSelected(practice); setLoading(true); setError('');
    try { setEvidence(await getTraditionalEvidence(practice.id)); } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить доказательства'); }
    finally { setLoading(false); }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View><Text style={styles.kicker}>HEALTH NAVIGATOR</Text><Text style={styles.title}>Твоё состояние</Text></View>
          <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>{connected ? 'CORE ACTIVE' : 'READY'}</Text></View>
        </View>
        <View style={styles.nav}>
          <Nav label="Главная" active={mode === 'home'} onPress={() => setMode('home')} />
          <Nav label="Проверка" active={mode === 'check'} onPress={() => setMode('check')} />
          <Nav label="Знания" active={mode === 'evidence'} onPress={() => setMode('evidence')} />
        </View>

        {mode === 'home' && <>
          <View style={styles.coreWrap}><View style={styles.orbit} /><View style={styles.core}><Text style={styles.coreLabel}>HEALTH</Text><Text style={styles.coreValue}>76</Text><Text style={styles.coreUnit}>CORE INDEX</Text></View><Text style={styles.coreHint}>Индекс будет собираться из реальных данных</Text></View>
          <View style={styles.metrics}>{metrics.map(item => <View key={item.label} style={styles.metric}><Text style={styles.metricLabel}>{item.label}</Text><Text style={styles.metricValue}>{item.value}</Text><View style={styles.track}><View style={[styles.fill, { width: `${item.level}%` }]} /></View></View>)}</View>
          <Pressable style={styles.primary} onPress={() => setMode('check')}><Text style={styles.primaryIcon}>◉</Text><Text style={styles.primaryText}>Расскажи, что происходит</Text></Pressable>
          <Pressable style={styles.secondary} onPress={() => setMode('evidence')}><Text style={styles.secondaryText}>Посмотреть медицинские знания</Text></Pressable>
        </>}

        {mode === 'check' && <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Что происходит?</Text>
          <Text style={styles.sectionHint}>Опиши симптомы обычными словами. Система выделит распознанные признаки, проверит безопасность и задаст следующий вопрос.</Text>
          {!episode && <>
            <TextInput value={text} onChangeText={setText} placeholder="Например: второй день болит живот и тошнит" placeholderTextColor="#607572" multiline style={styles.input} />
            <Pressable style={styles.primary} onPress={beginCheck} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Анализирую…' : 'Начать оценку'}</Text></Pressable>
          </>}
          {loading && <ActivityIndicator style={{ margin: 18 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {episode && <EpisodePanel episode={episode} question={question} answer={answer} setAnswer={setAnswer} sendAnswer={sendAnswer} loading={loading} />}
          <Text style={styles.safety}>Это не диагноз. При признаках экстренного состояния приложение не заменяет медицинскую помощь.</Text>
        </View>}

        {mode === 'evidence' && <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Медицинские знания</Text>
          <Text style={styles.sectionHint}>Традиционное применение, доказательства и безопасность хранятся отдельно. «Натуральное» не означает безопасное.</Text>
          <View style={styles.searchRow}><TextInput value={search} onChangeText={setSearch} onSubmitEditing={runSearch} placeholder="Например: имбирь, мёд, мята" placeholderTextColor="#607572" style={styles.searchInput} /><Pressable style={styles.searchButton} onPress={runSearch}><Text style={styles.searchButtonText}>Найти</Text></Pressable></View>
          {loading && <ActivityIndicator style={{ margin: 20 }} />}{error ? <Text style={styles.error}>{error}</Text> : null}
          {selected ? <View style={styles.evidenceBox}><Pressable onPress={() => setSelected(null)}><Text style={styles.back}>← Все практики</Text></Pressable><Text style={styles.cardTitle}>{selected.name}</Text><Text style={styles.meta}>{selected.system || 'Традиционная практика'} · {selected.origin_country || 'разные страны'}</Text>{evidence.length === 0 && !loading && <Text style={styles.body}>Для этой практики пока нет проверенной записи по конкретному показанию.</Text>}{evidence.map(item => <View key={item.id} style={styles.evidenceCard}><Text style={styles.badge}>{item.evidence_level || 'не оценено'} · {item.certainty || 'не указано'}</Text><Text style={styles.question}>{item.clinical_question}</Text><Text style={styles.body}>{item.finding}</Text>{item.safety_notes ? <Text style={styles.warning}>Безопасность: {item.safety_notes}</Text> : null}{item.contraindications ? <Text style={styles.warning}>Ограничения: {item.contraindications}</Text> : null}{item.interactions ? <Text style={styles.warning}>Взаимодействия: {item.interactions}</Text> : null}</View>)}</View> : practices.map(p => <Pressable key={p.id} style={styles.practice} onPress={() => openPractice(p)}><Text style={styles.cardTitle}>{p.name}</Text><Text style={styles.meta}>{p.system || 'Традиционная практика'} · {p.category || 'другое'}</Text><Text style={styles.statusLine}>Доказательства: {p.evidence_status} · Безопасность: {p.safety_status}</Text></Pressable>)}
        </View>}
      </ScrollView>
    </View>
  );
}

function EpisodePanel({ episode, question, answer, setAnswer, sendAnswer, loading }: { episode: EpisodeResult; question: EpisodeQuestion | null; answer: string; setAnswer: (v: string) => void; sendAnswer: () => void; loading: boolean }) {
  const urgent = episode.status === 'urgent' || episode.safety?.severity === 'urgent';
  const medical = episode.status === 'medical_review' || episode.safety?.severity === 'medical_review';
  const done = !question || question.done;
  return <View style={styles.resultBox}>
    <Text style={[styles.resultStatus, urgent && styles.urgent, medical && styles.medical]}>{urgent ? 'НУЖНА СРОЧНАЯ ПОМОЩЬ' : medical ? 'НУЖНА МЕДИЦИНСКАЯ ОЦЕНКА' : episode.status === 'plan_active' ? 'ПЛАН НАБЛЮДЕНИЯ' : 'ОЦЕНКА ПРОДОЛЖАЕТСЯ'}</Text>
    <Text style={styles.resultText}>{urgent ? 'Обнаружен признак, который нельзя откладывать. Не жди следующего вопроса приложения.' : medical ? 'По текущим данным нужна очная медицинская оценка.' : done ? 'Основные вопросы пройдены. Состояние можно наблюдать по динамике.' : 'Мне нужно уточнить ещё один важный момент.'}</Text>
    {episode.completeness_score != null && <Text style={styles.completeness}>Заполненность данных: {episode.completeness_score}%</Text>}
    {!urgent && !medical && !done && question?.question && <><Text style={styles.questionLabel}>{question.question}</Text><TextInput value={answer} onChangeText={setAnswer} placeholder="Твой ответ" placeholderTextColor="#607572" multiline style={styles.answerInput} /><Pressable style={styles.primary} onPress={sendAnswer} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Сохраняю…' : 'Ответить'}</Text></Pressable></>}
  </View>;
}

function Nav({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}><Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#081014' }, scroll: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 36 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, kicker: { color: '#7FA7A2', fontSize: 11, letterSpacing: 2.2, fontWeight: '700' }, title: { color: '#F2F7F5', fontSize: 27, fontWeight: '700', marginTop: 6 }, status: { flexDirection: 'row', alignItems: 'center', marginTop: 4 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#72D5A3', marginRight: 7 }, statusText: { color: '#8EA5A3', fontSize: 9, letterSpacing: 1 }, nav: { flexDirection: 'row', marginTop: 24, gap: 8 }, navItem: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18, backgroundColor: '#10201F' }, navItemActive: { backgroundColor: '#DDF2EA' }, navText: { color: '#78908C', fontSize: 11, fontWeight: '600' }, navTextActive: { color: '#102522' }, coreWrap: { height: 340, alignItems: 'center', justifyContent: 'center' }, orbit: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: '#29443F' }, core: { width: 178, height: 178, borderRadius: 89, backgroundColor: '#102522', borderWidth: 1, borderColor: '#467C70', alignItems: 'center', justifyContent: 'center' }, coreLabel: { color: '#8FB7B0', fontSize: 11, letterSpacing: 2 }, coreValue: { color: '#F3FBF8', fontSize: 60, fontWeight: '300', lineHeight: 68 }, coreUnit: { color: '#648681', fontSize: 9, letterSpacing: 1.5 }, coreHint: { position: 'absolute', bottom: 4, color: '#718784', fontSize: 11 }, metrics: { gap: 10 }, metric: { flexDirection: 'row', alignItems: 'center' }, metricLabel: { color: '#829693', width: 92, fontSize: 12 }, metricValue: { color: '#D9E8E4', width: 65, fontSize: 12, fontWeight: '600' }, track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#1A2A29', overflow: 'hidden' }, fill: { height: '100%', backgroundColor: '#67B89E', borderRadius: 2 }, primary: { minHeight: 58, borderRadius: 29, backgroundColor: '#DDF2EA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 20 }, primaryIcon: { color: '#102522', fontSize: 18, marginRight: 10 }, primaryText: { color: '#102522', fontSize: 16, fontWeight: '700' }, secondary: { padding: 18, alignItems: 'center' }, secondaryText: { color: '#8FB7B0', fontSize: 12 }, panel: { marginTop: 28 }, sectionTitle: { color: '#F2F7F5', fontSize: 23, fontWeight: '700' }, sectionHint: { color: '#718784', fontSize: 12, lineHeight: 18, marginTop: 8 }, input: { minHeight: 150, marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#10201F', color: '#E7F1EE', fontSize: 15, textAlignVertical: 'top' }, answerInput: { minHeight: 90, marginTop: 12, padding: 15, borderRadius: 17, backgroundColor: '#10201F', color: '#E7F1EE', fontSize: 14, textAlignVertical: 'top' }, safety: { color: '#607572', textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: 12 }, searchRow: { flexDirection: 'row', gap: 8, marginTop: 18 }, searchInput: { flex: 1, height: 48, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#10201F', color: '#E7F1EE' }, searchButton: { height: 48, paddingHorizontal: 17, borderRadius: 16, backgroundColor: '#DDF2EA', alignItems: 'center', justifyContent: 'center' }, searchButtonText: { color: '#102522', fontWeight: '700' }, practice: { marginTop: 10, padding: 16, borderRadius: 17, backgroundColor: '#10201F' }, cardTitle: { color: '#EAF4F1', fontSize: 15, fontWeight: '700' }, meta: { color: '#78908C', fontSize: 11, marginTop: 5 }, statusLine: { color: '#607572', fontSize: 10, marginTop: 9 }, evidenceBox: { marginTop: 16 }, back: { color: '#8FB7B0', fontSize: 12, marginBottom: 14 }, evidenceCard: { marginTop: 12, padding: 15, borderRadius: 17, backgroundColor: '#10201F' }, badge: { color: '#72D5A3', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 }, question: { color: '#DCEAE6', fontSize: 13, fontWeight: '600', marginTop: 8, lineHeight: 18 }, body: { color: '#A9BCB8', fontSize: 12, lineHeight: 18, marginTop: 8 }, warning: { color: '#C9A875', fontSize: 11, lineHeight: 17, marginTop: 9 }, error: { color: '#D89A9A', marginTop: 14, fontSize: 11, lineHeight: 17 }, resultBox: { marginTop: 18, padding: 17, borderRadius: 18, backgroundColor: '#10201F', borderWidth: 1, borderColor: '#29443F' }, resultStatus: { color: '#72D5A3', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, urgent: { color: '#F09A9A' }, medical: { color: '#E2BD79' }, resultText: { color: '#DCEAE6', fontSize: 14, lineHeight: 20, marginTop: 9 }, completeness: { color: '#78908C', fontSize: 11, marginTop: 10 }, questionLabel: { color: '#F0F6F4', fontSize: 15, fontWeight: '700', lineHeight: 21, marginTop: 18 }, questionLabel: { color: '#F0F6F4', fontSize: 15, fontWeight: '700', lineHeight: 21, marginTop: 18 },
});
