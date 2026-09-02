export type ImportedHealth = { type:string; value:number; unit:string; measuredAt:string; source:string; metadata:Record<string,unknown> };

export async function importHealthConnect():Promise<ImportedHealth[]> {
  try {
    const hc = await import('react-native-health-connect') as any;
    const initialized = await hc.initialize();
    if (!initialized) return [];
    await hc.requestPermission([
      { accessType:'read', recordType:'Steps' },
      { accessType:'read', recordType:'HeartRate' },
      { accessType:'read', recordType:'SleepSession' },
      { accessType:'read', recordType:'RestingHeartRate' },
    ]);
    const end = new Date();
    const start = new Date(end.getTime()-24*60*60*1000);
    const result:ImportedHealth[]=[];
    const read = async(recordType:string,type:string,unit:string)=>{
      try {
        const r=await hc.readRecords(recordType,{timeRangeFilter:{operator:'between',startTime:start.toISOString(),endTime:end.toISOString()}});
        for(const item of (r?.records??[])){
          const numeric=Number(item.count ?? item.beatsPerMinute ?? item.rate ?? item.value ?? item.total?.inMeters ?? item.total?.inKilometers ?? 0);
          if(Number.isFinite(numeric)&&numeric>0) result.push({type,value:numeric,unit,measuredAt:String(item.startTime??item.time??end.toISOString()),source:'health_connect',metadata:item});
        }
      }catch{}
    };
    await read('Steps','steps','count');
    await read('HeartRate','heart_rate','bpm');
    await read('RestingHeartRate','resting_heart_rate','bpm');
    return result;
  } catch { return []; }
}
