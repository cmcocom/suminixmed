(async ()=>{
  try{
    const url = 'http://localhost:3000/api/reportes/salidas-cliente/consolidado?agruparPor=cliente&fechaInicio=2025-11-01&fechaFin=2025-11-03';
    console.log('[TEST] Llamando', url);
    const res = await fetch(url, { method: 'GET' });
    console.log('[TEST] status', res.status);
    const txt = await res.text();
    try { console.log('[TEST] body JSON:\n', JSON.stringify(JSON.parse(txt), null, 2)); } catch(e){ console.log('[TEST] body text:\n', txt); }
  }catch(e){ console.error('[TEST] ERROR', e); process.exit(1); }
})();
