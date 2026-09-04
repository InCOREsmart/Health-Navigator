import { supabase } from './supabase';

export type TraditionalPractice = { id:string; code:string; name:string; system:string|null; origin_country:string|null; category:string|null; evidence_status:string; safety_status:string; requires_clinical_context:boolean };
export type TraditionalEvidence = { id:string; practice_id:string; clinical_question:string; population:string|null; outcome:string|null; evidence_level:string|null; certainty:string|null; finding:string|null; safety_notes:string|null; contraindications:string|null; interactions:string|null; jurisdiction:string|null; version:string|null };
export type EpisodeQuestion = { done:boolean; code?:string; domain?:string; question?:string; answer_type?:string; options?:unknown; required?:boolean; safety_relevant?:boolean; next_action?:string };
export type EpisodeResult = { status:string; episode_id?:string; next_action?:string; current_step?:string; safety?:{severity?:string|number;action?:string}; snapshot?:Record<string,unknown>; clinical_snapshot?:Record<string,unknown>; next_question?:EpisodeQuestion; completeness_score?:number; safety_flag_count?:number };
export type EpisodeHistoryItem = { id:string; title:string; status:string; current_step:string|null; next_action:string|null; completeness_score:number|null; created_at:string; updated_at:string };
export type HealthMeasurement = { id:string; user_id:string; type:string; value:number; unit:string; source:string; measured_at:string; metadata:Record<string,unknown>; created_at:string };
export type HealthDataItem = { id:string; user_id:string; episode_id:string|null; source:string; data_type:string; data:Record<string,unknown>; recorded_at:string; created_at:string };
export type HealthPhoto = { id:string; user_id:string; episode_id:string|null; storage_path:string; category:string; metadata:Record<string,unknown>; created_at:string };

export async function searchTraditional(query:string){const clean=query.trim();if(!clean)return[] as TraditionalPractice[];const safe=clean.replace(/[%_,]/g,' ');const{data,error}=await supabase.from('hos_traditional_practices').select('id,code,name,system,origin_country,category,evidence_status,safety_status,requires_clinical_context').eq('active',true).or(`name.ilike.%${safe}%,code.ilike.%${safe}%,category.ilike.%${safe}%,system.ilike.%${safe}%`).order('name').limit(20);if(error)throw error;return(data??[])as TraditionalPractice[]}
export async function getTraditionalEvidence(practiceId:string){const{data,error}=await supabase.from('hos_traditional_evidence').select('id,practice_id,clinical_question,population,outcome,evidence_level,certainty,finding,safety_notes,contraindications,interactions,jurisdiction,version').eq('practice_id',practiceId).eq('active',true).order('reviewed_at',{ascending:false});if(error)throw error;return(data??[])as TraditionalEvidence[]}
export async function startEpisode(title='Новый эпизод'){const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Требуется вход в аккаунт');const{data,error}=await supabase.rpc('hos_start_episode',{p_user_id:user.id,p_title:title});if(error)throw error;return data as EpisodeResult}
export async function createEpisodeWithSymptoms(title:string,symptoms:Array<{code:string;severity?:number;frequency?:string;notes?:string}>){const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Требуется вход в аккаунт');const{data,error}=await supabase.rpc('hos_create_episode_with_symptoms',{p_user_id:user.id,p_title:title||'Новый эпизод',p_symptoms:symptoms});if(error)throw error;return data as EpisodeResult}
export async function submitAnswer(episodeId:string,question:EpisodeQuestion,answer:unknown){const{data,error}=await supabase.rpc('hos_submit_answer',{p_episode_id:episodeId,p_question_code:question.code,p_question:question.question,p_answer:answer,p_source:'user'});if(error)throw error;return data as EpisodeResult}
export async function getEpisode(episodeId:string){const{data,error}=await supabase.rpc('hos_get_episode',{p_episode_id:episodeId});if(error)throw error;const payload=data as{episode?:Record<string,unknown>;next_question?:EpisodeQuestion};const e=payload.episode??{};return{...(e as EpisodeResult),episode_id:String(e.id??episodeId),status:String(e.status??'collecting'),next_question:payload.next_question,completeness_score:typeof e.completeness_score==='number'?e.completeness_score:undefined}as EpisodeResult}
export async function listEpisodes(limit=30){const{data,error}=await supabase.from('hos_episodes').select('id,title,status,current_step,next_action,completeness_score,created_at,updated_at').order('updated_at',{ascending:false}).limit(limit);if(error)throw error;return(data??[])as EpisodeHistoryItem[]}
export async function recordMeasurement(type:string,value:number,unit:string,source='manual',measuredAt=new Date().toISOString(),metadata:Record<string,unknown>={}){const{data,error}=await supabase.rpc('hos_record_measurement',{p_type:type,p_value:value,p_unit:unit,p_source:source,p_measured_at:measuredAt,p_metadata:metadata});if(error)throw error;return data as HealthMeasurement}
export async function listMeasurements(limit=100){const{data,error}=await supabase.rpc('hos_list_measurements',{p_limit:limit});if(error)throw error;return(data??[])as HealthMeasurement[]}
export async function recordHealthData(episodeId:string|null,source:string,dataType:string,data:Record<string,unknown>,recordedAt=new Date().toISOString()){const{data:result,error}=await supabase.rpc('hos_record_health_data',{p_episode_id:episodeId,p_source:source,p_data_type:dataType,p_data:data,p_recorded_at:recordedAt});if(error)throw error;return result as HealthDataItem}
export async function listHealthData(limit=100){const{data,error}=await supabase.rpc('hos_list_health_data',{p_limit:limit});if(error)throw error;return(data??[])as HealthDataItem[]}
export async function uploadPhoto(uri:string,episodeId:string|null,category='general',metadata:Record<string,unknown>={}){const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Требуется вход в аккаунт');const path=`${user.id}/${episodeId??'general'}/${Date.now()}.jpg`;const response=await fetch(uri);const body=await response.arrayBuffer();const{error:uploadError}=await supabase.storage.from('health-photos').upload(path,body,{contentType:'image/jpeg',upsert:false});if(uploadError)throw uploadError;const{data,error}=await supabase.rpc('hos_register_photo',{p_episode_id:episodeId,p_storage_path:path,p_category:category,p_metadata:metadata});if(error){await supabase.storage.from('health-photos').remove([path]);throw error}return data as HealthPhoto}
export async function listPhotos(episodeId:string|null=null,limit=50){const{data,error}=await supabase.rpc('hos_list_photos',{p_episode_id:episodeId,p_limit:limit});if(error)throw error;return(data??[])as HealthPhoto[]}

export function extractSymptoms(text:string){
 const value=text.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim();
 const rules:Array<{code:string;patterns:RegExp[]}>= [
  {code:'abdominal_pain',patterns:[/бол\w*\s+(живот|животе|животe)/,/боль\w*\s+(в\s+)?(живот|животе)/,/живот\w*\s+(бол\w*|тян\w*|реж\w*|крут\w*|но\w*|тяжел\w*)/,/желуд\w*\s+(бол\w*|тян\w*|жж\w*|но\w*)/,/боль\w*\s+в\s+желуд/]},
  {code:'nausea',patterns:[/тошн\w*/,/подташ\w*/]},
  {code:'vomiting',patterns:[/рв\w*/,/вырв\w*/]},
  {code:'diarrhea',patterns:[/диаре\w*/,/понос\w*/,/жидк\w*\s+стул/]},
  {code:'constipation',patterns:[/запор\w*/,/не\s+мог\w*\s+(сходить|покак\w*)\s+в\s+туалет/]},
  {code:'heartburn',patterns:[/изжог\w*/,/жж\w*\s+(за\s+грудиной|в\s+груд\w*\s+после\s+ед)/]},
  {code:'chest_discomfort',patterns:[/бол\w*\s+(в\s+)?груд\w*/,/боль\w*\s+в\s+груд\w*/,/дискомфорт\w*\s+в\s+груд\w*/,/дав\w*\s+в\s+груд\w*/,/сжим\w*\s+груд\w*/]},
  {code:'palpitations',patterns:[/сердц\w*\s+колот\w*/,/сердцеби\w*/,/сердце\s+(бьет|бьется|сильно\s+бьет)/,/перебо\w*\s+в\s+сердц/]},
  {code:'shortness_of_breath',patterns:[/одыш\w*/,/не\s+хват\w*\s+воздух\w*/,/тяжел\w*\s+дыш\w*/,/трудн\w*\s+дыш\w*/,/задых\w*/]},
  {code:'cough',patterns:[/кашл\w*/]},
  {code:'sore_throat',patterns:[/бол\w*\s+горл\w*/,/боль\w*\s+в\s+горл\w*/,/перш\w*\s+в\s+горл\w*/]},
  {code:'fever',patterns:[/температур\w*/,/жар\w*/,/лихорад\w*/,/озноб\w*/]},
  {code:'headache',patterns:[/головн\w*\s+бол\w*/,/бол\w*\s+голов\w*/]},
  {code:'dizziness',patterns:[/головокруж\w*/,/круж\w*\s+голов\w*/]},
  {code:'itching',patterns:[/зуд\w*/,/чеш\w*/]},
  {code:'rash',patterns:[/сып\w*/,/высыпан\w*/,/пятн\w*\s+на\s+кож/]},
  {code:'back_pain',patterns:[/бол\w*\s+спин\w*/,/боль\w*\s+в\s+спин\w*/,/спин\w*\s+(бол\w*|тян\w*)/]},
  {code:'joint_pain',patterns:[/бол\w*\s+сустав\w*/,/боль\w*\s+в\s+сустав\w*/,/сустав\w*\s+бол\w*/]},
  {code:'weakness',patterns:[/слабост\w*/,/сильно\s+слаб\w*/]},
  {code:'fatigue',patterns:[/усталост\w*/,/утомля\w*/,/постоянно\s+уста\w*/,/нет\s+сил/]},
  {code:'anxiety',patterns:[/тревог\w*/,/тревож\w*/,/паник\w*/]},
  {code:'low_mood',patterns:[/подавлен\w*/,/плох\w*\s+настроен\w*/,/ничего\s+не\s+раду\w*/]},
  {code:'sleep_problem',patterns:[/не\s+спл\w*/,/бессонниц\w*/,/плох\w*\s+спл\w*/,/не\s+мог\w*\s+уснут\w*/]},
  {code:'frequent_urination',patterns:[/часто\s+моч\w*/,/част\w*\s+мочеиспускан\w*/,/часто\s+ход\w*\s+в\s+туалет\s+по-маленькому/]},
  {code:'urinary_pain',patterns:[/жж\w*\s+при\s+мочеиспускан\w*/,/жж\w*\s+при\s+моч\w*/,/боль\w*\s+моч\w*/,/больно\s+пис\w*/]}
 ];
 return rules.filter(r=>r.patterns.some(p=>p.test(value))).map(r=>({code:r.code,severity:0,notes:text.trim()}));
}
