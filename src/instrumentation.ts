// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Solo ejecutar en servidor Node.js, no durante build
    const { initBillingScheduler } = await import('./lib/billing-scheduler')
    const { initAlarmScheduler } = await import('./lib/alarm-scheduler')
    
    await initBillingScheduler()
    await initAlarmScheduler()
    
    console.log('✅ Schedulers iniciados en runtime')
  }
}