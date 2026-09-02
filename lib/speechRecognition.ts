import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export async function startRussianRecognition(
  onText: (text: string) => void,
  onState: (active: boolean) => void,
) {
  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Нет доступа к микрофону и распознаванию речи.');

  let cleaned = false;
  let resultListener: { remove: () => void } | undefined;
  let endListener: { remove: () => void } | undefined;
  let errorListener: { remove: () => void } | undefined;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    resultListener?.remove();
    endListener?.remove();
    errorListener?.remove();
    onState(false);
  };

  resultListener = ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
    const text = event?.results?.[0]?.transcript;
    if (typeof text === 'string' && text.trim()) onText(text.trim());
  });
  endListener = ExpoSpeechRecognitionModule.addListener('end', cleanup);
  errorListener = ExpoSpeechRecognitionModule.addListener('error', cleanup);

  onState(true);
  try {
    ExpoSpeechRecognitionModule.start({ lang: 'ru-RU', interimResults: true, continuous: false });
  } catch (error) {
    cleanup();
    throw error;
  }

  return { stop: () => ExpoSpeechRecognitionModule.stop(), remove: cleanup };
}
