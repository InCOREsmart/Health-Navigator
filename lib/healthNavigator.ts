import { supabase } from './supabase';

export type TraditionalPractice = {
  id: string;
  code: string;
  name: string;
  system: string | null;
  origin_country: string | null;
  category: string | null;
  evidence_status: string;
  safety_status: string;
  requires_clinical_context: boolean;
};

export type TraditionalEvidence = {
  id: string;
  practice_id: string;
  clinical_question: string;
  population: string | null;
  outcome: string | null;
  evidence_level: string | null;
  certainty: string | null;
  finding: string | null;
  safety_notes: string | null;
  contraindications: string | null;
  interactions: string | null;
  jurisdiction: string | null;
  version: string | null;
};

export async function searchTraditional(query: string) {
  const clean = query.trim();
  if (!clean) return [] as TraditionalPractice[];
  const { data, error } = await supabase
    .from('hos_traditional_practices')
    .select('id,code,name,system,origin_country,category,evidence_status,safety_status,requires_clinical_context')
    .eq('active', true)
    .or(`name.ilike.%${clean}%,code.ilike.%${clean}%,category.ilike.%${clean}%,system.ilike.%${clean}%`)
    .order('name')
    .limit(20);
  if (error) throw error;
  return (data ?? []) as TraditionalPractice[];
}

export async function getTraditionalEvidence(practiceId: string) {
  const { data, error } = await supabase
    .from('hos_traditional_evidence')
    .select('id,practice_id,clinical_question,population,outcome,evidence_level,certainty,finding,safety_notes,contraindications,interactions,jurisdiction,version')
    .eq('practice_id', practiceId)
    .eq('active', true)
    .order('reviewed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TraditionalEvidence[];
}

export async function startEpisode(title = 'Новый эпизод') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Требуется вход в аккаунт');
  const { data, error } = await supabase.rpc('hos_start_episode', { p_user_id: user.id, p_title: title });
  if (error) throw error;
  return data;
}
