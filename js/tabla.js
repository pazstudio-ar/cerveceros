/* ===== TABLAS DE POSICIONES (torneo y anual, divisiones A, B y C) ===== */
iniciarPagina(d => {
  const $ = id => document.getElementById(id);
  const c = d.config;
  const tablas = d.posiciones;

  if (!tablas.length) {
    $('barra').hidden = true;
    $('contenido').innerHTML = vacio('Arranca en ' + (c.temporada || '2027'),
      'Después de cada fecha se carga la tabla oficial. Vas a poder ver la del torneo y la anual, que es la que define el descenso, de las divisiones A, B y C.');
    return;
  }

  // Opciones: cada torneo (y la anual) por separado; las divisiones aparte
  const nombres = [];
  tablas.forEach(t => { if (!nombres.some(n => clave(n) === clave(t.torneo))) nombres.push(t.torneo); });
  const divisiones = [...new Set(tablas.map(t => String(t.division || '').toUpperCase()).filter(Boolean))].sort();

  $('sel-torneo').innerHTML = nombres.map(n => `<option value="${esc(clave(n))}">${esc(n)}</option>`).join('');
  $('sel-div').innerHTML = divisiones.map(v => `<option value="${esc(v)}">División ${esc(v)}</option>`).join('');

  // Por defecto: la última tabla de nuestra división que no sea anual
  const nuestras = tablas.filter(t => clave(t.division) === clave(c.division));
  const def = nuestras.filter(t => !t.anual).slice(-1)[0] || nuestras.slice(-1)[0] || tablas[tablas.length - 1];
  const q = new URLSearchParams(location.search);
  $('sel-torneo').value = q.get('torneo') && nombres.some(n => clave(n) === q.get('torneo')) ? q.get('torneo') : clave(def.torneo);
  $('sel-div').value = q.get('div') && divisiones.includes(q.get('div')) ? q.get('div') : String(def.division || '').toUpperCase();

  function dibujar() {
    const tor = $('sel-torneo').value, div = $('sel-div').value;
    // Si hay varias fechas cargadas del mismo torneo, se muestra la última
    const t = tablas.filter(x => clave(x.torneo) === tor && String(x.division || '').toUpperCase() === div).slice(-1)[0];
    history.replaceState(null, '', `?torneo=${encodeURIComponent(tor)}&div=${encodeURIComponent(div)}`);
    if (!t) {
      $('contenido').innerHTML = vacio('Sin datos', 'Esta tabla todavía no está cargada.');
      return;
    }
    const desc = Number((c.descienden || {})[t.division] || 0);
    $('contenido').innerHTML = `
      <div class="title"><h2 class="A">${esc(t.anual ? 'Anual' : 'Tabla')}</h2><p>${esc(nombreTabla(t))}</p></div>
      ${htmlTabla(t, d, true)}
      <p class="note">${t.anual ? 'La tabla anual suma los dos torneos del año y define el descenso.' + (desc && t.anual ? ` Los últimos ${desc} descienden.` : '') : 'Tabla oficial del torneo.'}
      ${t.nota ? ' ' + esc(t.nota) : ''}</p>`;
  }
  $('sel-torneo').addEventListener('change', dibujar);
  $('sel-div').addEventListener('change', dibujar);
  dibujar();
});
