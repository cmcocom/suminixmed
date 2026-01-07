(async () => {
  try {
    const url = 'http://localhost:3000/api/reportes/salidas-cliente/consolidado?fechaInicio=2025-11-01&fechaFin=2025-11-03&agruparPor=producto&productoId=PROD-00431';
    console.log('[DEBUG] Fetching (JSON) ', url);
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, redirect: 'manual' });
    console.log('[HTTP_STATUS]', res.status);
    const ct = res.headers.get('content-type') || '';
    console.log('[CONTENT_TYPE]', ct);
    const text = await res.text();
    console.log('[BODY]');
    console.log(text);
  } catch (e) {
    console.error('[ERROR]', e && e.message ? e.message : e);
    if (e && e.stack) console.error(e.stack);
    process.exit(1);
  }
})();
