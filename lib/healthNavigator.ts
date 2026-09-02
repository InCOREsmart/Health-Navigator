import { supabase } from './supabase';

export type TraditionalPractice = {
  id: string; code: string; name: string; system: string | null; origin_country: string | null; category: string | null;
  evidence_status: string; safety_status: string; requires_clinical_context: boolean;
};
export type TraditionalEvidence = {
  id: string; practice_id: string; clinical_question: string; population: string | null; outcome: string | null;
  evidence_level: string | null; certainty: string | null; finding: string | null; safety_notes: string | null;
  contraindications: string | null; interactions: string | null; jurisdiction: string | null; version: string | null;
};
export type EpisodeQuestion = {
  done: boolean; code?: string; domain?: string; question?: string; answer_type?: string; options?: unknown;
  required?: boolean; safety_relevant?: boolean; next_action?: string;
};
export type EpisodeResult = {
  status: string; episode_id?: string; next_action?: string; current_step?: string;
  safety?: { severity?: string | number; action?: string };
  snapshot?: Record<string, unknown>; clinical_snapshot?: Record<string, unknown>;
  next_question?: EpisodeQuestion; completeness_score?: number; safety_flag_count?: number;
};
export type EpisodeHistoryItem = {
  id: string; title: string; status: string; current_step: string | null; next_action: string | null;
  completeness_score: number | null; created_at: string; updated_at: string;
};

export async function searchTraditional(query: string) {
  const clean = query.trim(); if (!clean) return [] as TraditionalPractice[];
  const safe = clean.replace(/[%_,]/g, ' ');
  const { data, error } = await supabase.from('hos_traditional_practices')
    .select('id,code,name,system,origin_country,category,evidence_status,safety_status,requires_clinical_context')
    .eq('active', true).or(`name.ilike.%${safe}%,code.ilike.%${safe}%,category.ilike.%${safe}%,system.ilike.%${safe}%`)
    .order('name').limit(20);
  if (error) throw error; return (data ?? []) as TraditionalPractice[];
}
export async function getTraditionalEvidence(practiceId: string) {
  const { data, error } = await supabase.from('hos_traditional_evidence')
    .select('id,practice_id,clinical_question,population,outcome,evidence_level,certainty,finding,safety_notes,contraindications,interactions,jurisdiction,version')
    .eq('practice_id', practiceId).eq('active', true).order('reviewed_at', { ascending: false });
  if (error) throw error; return (data ?? []) as TraditionalEvidence[];
}
export async function startEpisode(title = 'Новый эпизод') {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Требуется вход в аккаунт');
  const { data, error } = await supabase.rpc('hos_start_episode', { p_user_id: user.id, p_title: title });
  if (error) throw error; return data as EpisodeResult;
}
export async function createEpisodeWithSymptoms(title: string, symptoms: Array<{ code: string; severity?: number; frequency?: string; notes?: string }>) {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Требуется вход в аккаунт');
  const { data, error } = await supabase.rpc('hos_create_episode_with_symptoms', { p_user_id: user.id, p_title: title || 'Новый эпизод', p_symptoms: symptoms });
  if (error) throw error; return data as EpisodeResult;
}
export async function submitAnswer(episodeId: string, question: EpisodeQuestion, answer: unknown) {
  const { data, error } = await supabase.rpc('hos_submit_answer', {
    p_episode_id: episodeId, p_question_code: question.code, p_question: question.question, p_answer: answer, p_source: 'user',
  });
  if (error) throw error; return data as EpisodeResult;
}
export async function getEpisode(episodeId: string) {
  const { data, error } = await supabase.rpc('hos_get_episode', { p_episode_id: episodeId });
  if (error) throw error; return data as Record<string, unknown>;
}
export async function listEpisodes(limit = 30) {
  const { data, error } = await supabase.from('hos_episodes')
    .select('id,title,status,current_step,next_action,completeness_score,created_at,updated_at')
    .order('updated_at', { ascending: false }).limit(limit);
  if (error) throw error; return (data ?? []) as EpisodeHistoryItem[];
}
export function extractSymptoms(text: string) {
  const value = text.toLowerCase();
  const rules: Array<{ code: string; words: string[] }> = [
    { code: 'abdominal_pain', words: ['болит живот', 'боль в животе', 'живот болит'] }, { code: 'nausea', words: ['тошнит', 'тошнота'] },
    { code: 'vomiting', words: ['рвота', 'рвало', 'вырвало'] }, { code: 'diarrhea', words: ['диарея', 'понос'] }, { code: 'constipation', words: ['запор'] },
    { code: 'heartburn', words: ['изжога'] }, { code: 'chest_discomfort', words: ['болит в груди', 'боль в груди', 'дискомфорт в груди'] },
    { code: 'palpitations', words: ['сердце колотится', 'сердцебиение', 'сердце бьется'] }, { code: 'shortness_of_breath', words: ['одышка', 'не хватает воздуха', 'тяжело дышать'] },
    { code: 'cough', words: ['кашель', 'кашляю'] }, { code: 'sore_throat', words: ['болит горло', 'боль в горле'] }, { code: 'fever', words: ['температура', 'жар', 'лихорадка'] },
    { code: 'headache', words: ['головная боль', 'болит голова'] }, { code: 'dizziness', words: ['головокружение', 'кружится голова'] }, { code: 'itching', words: ['зуд', 'чешется'] },
    { code: 'rash', words: ['сыпь', 'высыпания'] }, { code: 'back_pain', words: ['болит спина', 'боль в спине'] }, { code: 'joint_pain', words: ['болят суставы', 'боль в суставах'] },
    { code: 'weakness', words: ['слабость'] }, { code: 'fatigue', words: ['усталость', 'утомляемость'] }, { code: 'anxiety', words: ['тревога', 'тревожно'] },
    { code: 'low_mood', words: ['подавленность', 'плохое настроение'] }, { code: 'sleep_problem', words: ['не сплю', 'бессонница', 'плохо сплю'] },
    { code: 'frequent_urination', words: ['часто мочусь', 'частое мочеиспускание'] }, { code: 'urinary_pain', words: ['жжет при мочеиспускании', 'жжение при мочеиспускании', 'больно мочиться'] },
  ];
  return rules.filter(rule => rule.words.some(word => value.includes(word))).map(rule => ({ code: rule.code, severity: 0, notes: text.trim() }));
}
