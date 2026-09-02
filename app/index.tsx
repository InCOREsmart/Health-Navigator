import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { createEpisodeWithSymptoms, extractSymptoms, getTraditionalEvidence, listEpisodes, searchTraditional, submitAnswer, EpisodeHistoryItem, EpisodeQuestion, EpisodeResult, TraditionalEvidence, TraditionalPractice } from '../lib/healthNavigator';

type Mode = 'home' | 'check' | 'history' | 'knowledge';

export default function HomeScreen() {
  const [session, setSession] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('home');
  const [text, setText] = useState('');
  const [episode, setEpisode] = useState<EpisodeResult | null>(null);
  const [question, setQuestion] = useState<EpisodeQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<EpisodeHistoryItem[]>([]);
  const [practices, setPractices] = useState<TraditionalPractice[]>([]);
  const [selected, setSelected] = useState<TraditionalPractice | null>(null);
  const [evidence, setEvidence] = useState<TraditionalEvidence[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(Boolean(current)));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function authenticate() {
    setError('');
    if (!email.trim() || !password) { setError('Нужны email и пароль.'); return; }
    setAuthLoading(true);
    try {
      const result = authMode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (authMode === 'signup' && !result.data.session) setError('Аккаунт создан. Подтверди email, если подтверждение включено, затем войди.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось выполнить вход'); }
    finally { setAuthLoading(false); }
  }

  async function beginCheck() {
    setError('');
    const description = text.trim();
    if (!description) { setError('Опиши хотя бы один симптом.'); return; }
    const symptoms = extractSymptoms(description);
    if (!symptoms.length) { setError('Не распознал симптом. Опиши конкретнее, например: «второй день болит живот и тошнит».'); return; }
    setLoading(true);
    try {
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

  async function loadHistory() {
    setLoading(true); setError('');
    try { setHistory(await listEpisodes()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить историю'); }
    finally { setLoading(false); }
  }

  async function runSearch() {
    setLoading(true); setError('');
    try { setPractices(await searchTraditional(search)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить знания'); }
    finally { setLoading(false); }
  }

  async function openPractice(practice: TraditionalPractice) {
    setSelected(practice); setLoading(true); setError('');
    try { setEvidence(await getTraditionalEvidence(practice.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить доказательства'); }
    finally { setLoading(false); }
  }

  function navigate(next: Mode) {
    setError('');
    setMode(next);
    if (next === 'history') void loadHistory();
  }

  if (!session) return <AuthScreen email={email} password={password} setEmail={setEmail} setPassword={setPassword} authMode={authMode} setAuthMode={setAuthMode} loading={authLoading} error={error} onSubmit={authenticate} />;

  return <View style={styles.container}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><View><Text style={styles.kicker}>HEALTH NAVIGATOR</Text><Text style={styles.title}>Твоё состояние</Text></View><View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>CORE ACTIVE</Text></View></View>
      <View style={styles.nav}><Nav label="Главная" active={mode==='home'} onPress={()=>navigate('home')} /><Nav label="Проверка" active={mode==='check'} onPress={()=>navigate('check')} /><Nav label="История" active={mode==='history'} onPress={()=>navigate('history')} /><Nav label="Знания" active={mode==='knowledge'} onPress={()=>navigate('knowledge')} /></View>

      {mode==='home' && <Home onCheck={()=>navigate('check')} onKnowledge={()=>navigate('knowledge')} />}

      {mode==='check' && <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Что происходит?</Text>
        <Text style={styles.sectionHint}>Опиши симптомы обычными словами. Система проверяет опасные признаки, задаёт уточняющие вопросы и сохраняет эпизод.</Text>
        {!episode && <><TextInput value={text} onChangeText={setText} placeholder="Например: второй день болит живот и тошнит" placeholderTextColor="#607572" multiline style={styles.input}/><Pressable style={styles.primary} onPress={beginCheck} disabled={loading}><Text style={styles.primaryText}>{loading?'Анализирую…':'Начать оценку'}</Text></Pressable></>}
        {loading && <ActivityIndicator style={{margin:18}} />}{error?<Text style={styles.error}>{error}</Text>:null}
        {episode && <EpisodePanel episode={episode} question={question} answer={answer} setAnswer={setAnswer} sendAnswer={sendAnswer} loading={loading} onNew={()=>{setEpisode(null);setQuestion(null);setText('');setAnswer('')}}/>}
        <Text style={styles.safety}>Это не диагноз. При экстренных признаках приложение не заменяет медицинскую помощь.</Text>
      </View>}

      {mode==='history' && <View style={styles.panel}>
        <Text style={styles.sectionTitle}>История состояния</Text><Text style={styles.sectionHint}>Сохранённые эпизоды и их текущий статус.</Text>
        {loading&&<ActivityIndicator style={{margin:20}}/>}{error?<Text style={styles.error}>{error}</Text>:null}{!loading&&!history.length&&<Text style={styles.body}>История пока пустая.</Text>}
        {history.map(item=><Pressable key={item.id} style={styles.card} onPress={()=>navigate('check')}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.meta}>{statusLabel(item.status)} · {new Date(item.updated_at).toLocaleDateString('ru-RU')}</Text>{item.completeness_score!=null&&<Text style={styles.statusLine}>Заполненность: {item.completeness_score}%</Text>}</Pressable>)}
      </View>}

      {mode==='knowledge' && <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Медицинские знания</Text><Text style={styles.sectionHint}>Традиционное применение, доказательства и безопасность разделены. «Натуральное» не означает безопасное.</Text>
        <View style={styles.searchRow}><TextInput value={search} onChangeText={setSearch} onSubmitEditing={runSearch} placeholder="Например: имбирь, мёд, мята" placeholderTextColor="#607572" style={styles.searchInput}/><Pressable style={styles.searchButton} onPress={runSearch}><Text style={styles.searchButtonText}>Найти</Text></Pressable></View>
        {loading&&<ActivityIndicator style={{margin:20}}/>}{error?<Text style={styles.error}>{error}</Text>:null}
        {selected?<View style={styles.evidenceBox}><Pressable onPress={()=>setSelected(null)}><Text style={styles.back}>← Все практики</Text></Pressable><Text style={styles.cardTitle}>{selected.name}</Text><Text style={styles.meta}>{selected.system||'Традиционная практика'} · {selected.origin_country||'разные страны'}</Text>{!evidence.length&&!loading&&<Text style={styles.body}>Для этой практики пока нет проверенной записи по конкретному показанию.</Text>}{evidence.map(item=><View key={item.id} style={styles.evidenceCard}><Text style={styles.badge}>{item.evidence_level||'не оценено'} · {item.certainty||'не указано'}</Text><Text style={styles.question}>{item.clinical_question}</Text><Text style={styles.body}>{item.finding}</Text>{item.safety_notes&&<Text style={styles.warning}>Безопасность: {item.safety_notes}</Text>}{item.contraindications&&<Text style={styles.warning}>Ограничения: {item.contraindications}</Text>}{item.interactions&&<Text style={styles.warning}>Взаимодействия: {item.interactions}</Text>}</View>)}</View>:practices.map(p=><Pressable key={p.id} style={styles.card} onPress={()=>openPractice(p)}><Text style={styles.cardTitle}>{p.name}</Text><Text style={styles.meta}>{p.system||'Традиционная практика'} · {p.category||'другое'}</Text><Text style={styles.statusLine}>Доказательства: {p.evidence_status} · Безопасность: {p.safety_status}</Text></Pressable>)}
      </View>}
      <Pressable style={styles.signOut} onPress={()=>supabase.auth.signOut()}><Text style={styles.signOutText}>Выйти</Text></Pressable>
    </ScrollView>
  </View>;
}

function AuthScreen({email,password,setEmail,setPassword,authMode,setAuthMode,loading,error,onSubmit}:any){return <View style={styles.container}><StatusBar style="light"/><ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled"><Text style={styles.kicker}>HEALTH NAVIGATOR</Text><Text style={styles.authTitle}>Здоровье без догадок</Text><Text style={styles.sectionHint}>Профиль нужен для сохранения эпизодов, динамики и персональных маршрутов.</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#607572" style={styles.authInput}/><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Пароль" placeholderTextColor="#607572" style={styles.authInput}/><Pressable style={styles.primary} onPress={onSubmit} disabled={loading}><Text style={styles.primaryText}>{loading?'Подождите…':authMode==='login'?'Войти':'Создать аккаунт'}</Text></Pressable>{error?<Text style={styles.error}>{error}</Text>:null}<Pressable style={styles.secondary} onPress={()=>setAuthMode(authMode==='login'?'signup':'login')}><Text style={styles.secondaryText}>{authMode==='login'?'Нет аккаунта? Создать':'Уже есть аккаунт? Войти'}</Text></Pressable></ScrollView></View>}
function Home({onCheck,onKnowledge}:{onCheck:()=>void;onKnowledge:()=>void}){return <><View style={styles.coreWrap}><View style={styles.orbit}/><View style={styles.core}><Text style={styles.coreLabel}>HEALTH</Text><Text style={styles.coreValue}>—</Text><Text style={styles.coreUnit}>CORE INDEX</Text></View><Text style={styles.coreHint}>Индекс собирается из реальных данных</Text></View><View style={styles.metrics}>{['Сон','Энергия','Восстановление','Активность','Стресс'].map(x=><View key={x} style={styles.metric}><Text style={styles.metricLabel}>{x}</Text><Text style={styles.metricValue}>нет данных</Text><View style={styles.track}/></View>)}</View><Pressable style={styles.primary} onPress={onCheck}><Text style={styles.primaryIcon}>◉</Text><Text style={styles.primaryText}>Расскажи, что происходит</Text></Pressable><Pressable style={styles.secondary} onPress={onKnowledge}><Text style={styles.secondaryText}>Посмотреть медицинские знания</Text></Pressable></>}
function EpisodePanel({episode,question,answer,setAnswer,sendAnswer,loading,onNew}:{episode:EpisodeResult;question:EpisodeQuestion|null;answer:string;setAnswer:(v:string)=>void;sendAnswer:()=>void;loading:boolean;onNew:()=>void}){const urgent=episode.status==='urgent'||episode.safety?.severity==='urgent'||episode.safety?.severity===3;const medical=episode.status==='medical_review'||episode.safety?.severity==='medical_review'||episode.safety?.severity===2;const done=!question||question.done;return <View style={styles.resultBox}><Text style={[styles.resultStatus,urgent&&styles.urgent,medical&&styles.medical]}>{urgent?'НУЖНА СРОЧНАЯ ПОМОЩЬ':medical?'НУЖНА МЕДИЦИНСКАЯ ОЦЕНКА':episode.status==='plan_active'?'ПЛАН НАБЛЮДЕНИЯ':done?'ОЦЕНКА ЗАВЕРШЕНА':'УТОЧНЯЕМ СОСТОЯНИЕ'}</Text><Text style={styles.resultText}>{urgent?'Обнаружен признак, который нельзя откладывать. Не жди следующего вопроса приложения.':medical?'По текущим данным нужна очная медицинская оценка.':done?'Основные вопросы пройдены. Состояние можно наблюдать по динамике.':'Нужно уточнить ещё один важный момент.'}</Text>{episode.completeness_score!=null&&<Text style={styles.completeness}>Заполненность данных: {episode.completeness_score}%</Text>}{!urgent&&!medical&&!done&&question?.question&&<><Text style={styles.questionLabel}>{question.question}</Text><TextInput value={answer} onChangeText={setAnswer} placeholder="Твой ответ" placeholderTextColor="#607572" multiline style={styles.answerInput}/><Pressable style={styles.primary} onPress={sendAnswer} disabled={loading}><Text style={styles.primaryText}>{loading?'Сохраняю…':'Ответить'}</Text></Pressable></>}</View>}
function Nav({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.navItem,active&&styles.navItemActive]}><Text style={[styles.navText,active&&styles.navTextActive]}>{label}</Text></Pressable>}
function statusLabel(x:string){return ({urgent:'Срочно',medical_review:'Нужна медоценка',plan_active:'Наблюдение',collecting:'Сбор данных',ready:'Готово'} as Record<string,string>)[x]||x}

const styles=StyleSheet.create({container:{flex:1,backgroundColor:'#081014'},scroll:{paddingHorizontal:20,paddingTop:58,paddingBottom:36},authScroll:{padding:24,paddingTop:80,paddingBottom:40,flexGrow:1,justifyContent:'center'},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},kicker:{color:'#7FA7A2',fontSize:11,letterSpacing:2.2,fontWeight:'700'},title:{color:'#F2F7F5',fontSize:27,fontWeight:'700',marginTop:6},authTitle:{color:'#F2F7F5',fontSize:31,fontWeight:'700',marginTop:10,marginBottom:10},status:{flexDirection:'row',alignItems:'center',marginTop:4},dot:{width:7,height:7,borderRadius:4,backgroundColor:'#72D5A3',marginRight:7},statusText:{color:'#8EA5A3',fontSize:9,letterSpacing:1},nav:{flexDirection:'row',marginTop:24,gap:6,flexWrap:'wrap'},navItem:{paddingVertical:9,paddingHorizontal:11,borderRadius:18,backgroundColor:'#10201F'},navItemActive:{backgroundColor:'#DDF2EA'},navText:{color:'#78908C',fontSize:10,fontWeight:'600'},navTextActive:{color:'#102522'},coreWrap:{height:340,alignItems:'center',justifyContent:'center'},orbit:{position:'absolute',width:260,height:260,borderRadius:130,borderWidth:1,borderColor:'#29443F'},core:{width:178,height:178,borderRadius:89,backgroundColor:'#102522',borderWidth:1,borderColor:'#467C70',alignItems:'center',justifyContent:'center'},coreLabel:{color:'#8FB7B0',fontSize:11,letterSpacing:2},coreValue:{color:'#F3FBF8',fontSize:60,fontWeight:'300',lineHeight:68},coreUnit:{color:'#648681',fontSize:9,letterSpacing:1.5},coreHint:{position:'absolute',bottom:4,color:'#718784',fontSize:11},metrics:{gap:10},metric:{flexDirection:'row',alignItems:'center'},metricLabel:{color:'#829693',width:92,fontSize:12},metricValue:{color:'#829693',width:65,fontSize:11},track:{flex:1,height:4,borderRadius:2,backgroundColor:'#1A2A29',overflow:'hidden'},primary:{minHeight:58,borderRadius:29,backgroundColor:'#DDF2EA',flexDirection:'row',alignItems:'center',justifyContent:'center',marginTop:24,paddingHorizontal:20},primaryIcon:{color:'#102522',fontSize:18,marginRight:10},primaryText:{color:'#102522',fontSize:16,fontWeight:'700'},secondary:{padding:18,alignItems:'center'},secondaryText:{color:'#8FB7B0',fontSize:12},panel:{marginTop:28},sectionTitle:{color:'#F2F7F5',fontSize:23,fontWeight:'700'},sectionHint:{color:'#718784',fontSize:12,lineHeight:18,marginTop:8},input:{minHeight:150,marginTop:18,padding:16,borderRadius:18,backgroundColor:'#10201F',color:'#E7F1EE',fontSize:15,textAlignVertical:'top'},authInput:{height:54,marginTop:12,paddingHorizontal:16,borderRadius:17,backgroundColor:'#10201F',color:'#E7F1EE',fontSize:15},answerInput:{minHeight:100,marginTop:12,padding:15,borderRadius:17,backgroundColor:'#10201F',color:'#E7F1EE',fontSize:14,textAlignVertical:'top'},safety:{color:'#607572',textAlign:'center',fontSize:10,lineHeight:15,marginTop:12},error:{color:'#D89A9A',marginTop:14,fontSize:11,lineHeight:17},resultBox:{marginTop:18,padding:17,borderRadius:19,backgroundColor:'#10201F'},resultStatus:{color:'#72D5A3',fontSize:12,fontWeight:'800',letterSpacing:.8},urgent:{color:'#F0A0A0'},medical:{color:'#E2BF7C'},resultText:{color:'#C6D7D3',fontSize:13,lineHeight:19,marginTop:10},completeness:{color:'#78908C',fontSize:10,marginTop:12},questionLabel:{color:'#EAF4F1',fontSize:14,fontWeight:'700',lineHeight:19,marginTop:18},question:{color:'#DCEAE6',fontSize:13,fontWeight:'600',marginTop:8,lineHeight:18},card:{marginTop:10,padding:16,borderRadius:17,backgroundColor:'#10201F'},cardTitle:{color:'#EAF4F1',fontSize:15,fontWeight:'700'},meta:{color:'#78908C',fontSize:11,marginTop:5},statusLine:{color:'#607572',fontSize:10,marginTop:9},body:{color:'#A9BCB8',fontSize:12,lineHeight:18,marginTop:12},searchRow:{flexDirection:'row',gap:8,marginTop:18},searchInput:{flex:1,height:48,paddingHorizontal:14,borderRadius:16,backgroundColor:'#10201F',color:'#E7F1EE'},searchButton:{height:48,paddingHorizontal:17,borderRadius:16,backgroundColor:'#DDF2EA',alignItems:'center',justifyContent:'center'},searchButtonText:{color:'#102522',fontWeight:'700'},evidenceBox:{marginTop:16},back:{color:'#8FB7B0',fontSize:12,marginBottom:14},evidenceCard:{marginTop:12,padding:15,borderRadius:17,backgroundColor:'#10201F'},badge:{color:'#72D5A3',fontSize:10,textTransform:'uppercase',letterSpacing:.7},warning:{color:'#C9A875',fontSize:11,lineHeight:17,marginTop:9},signOut:{padding:18,alignItems:'center',marginTop:8},signOutText:{color:'#607572',fontSize:11}});