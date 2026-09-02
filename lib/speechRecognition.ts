import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export async function startRussianRecognition(onText:(text:string)=>void,onState:(active:boolean)=>void){
  const permission=await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if(!permission.granted)throw new Error('Нет доступа к микрофону и распознаванию речи.');
  const resultListener=ExpoSpeechRecognitionModule.addListener('result',(event:any)=>{const text=event?.results?.[0]?.transcript;if(text)onText(text)});
  const endListener=ExpoSpeechRecognitionModule.addListener('end',()=>onState(false));
  const errorListener=ExpoSpeechRecognitionModule.addListener('error',()=>onState(false));
  onState(true);
  ExpoSpeechRecognitionModule.start({lang:'ru-RU',interimResults:true,continuous:false});
  return {stop:()=>ExpoSpeechRecognitionModule.stop(),remove:()=>{resultListener.remove();endListener.remove();errorListener.remove()}};
}
