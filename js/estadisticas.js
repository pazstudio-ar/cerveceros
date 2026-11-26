/* ===== ESTADÍSTICAS DEL PLANTEL ===== */
iniciarPagina(d => {
  const $ = id => document.getElementById(id);
  const mapa = mapaJugadores(d.jugadores);
  const torneos = listarTorneos(d.partidos);
  const COLS = [['pj', 'PJ', 'Partidos jugados'], ['g', 'G', 'Goles'], ['a', 'A', 'Asistencias'],
    ['fig', 'Fig', 'Figura del partido'], ['am', 'TA', 'Amarillas'], ['ro', 'TR', 'Rojas']];
  let orden = 'g';

  const sel = $('sel-torneo');
  sel.innerHTML = torneos.map(t => `<option value="${esc(clave(t))}">${esc(t)}</option>`).join('') +
    (torneos.length > 1 ? '<option value="*">Todo el año</option>' : '');
  if (!torneos.length) $('barra').hidden = true;
  else sel.value = clave(torneoActual(d.partidos, d.config));

  const foto = f => `<span class="ft">${f.foto ? `<img src="${esc(f.foto)}" alt="" onerror="this.remove()">` : ''}${f.foto ? '' : esc(f.num ?? iniciales(f.nombre))}</span>`;

  function dibujar() {
    const lista = sel.value === '*' ? d.partidos : delTorneo(d.partidos, sel.value);
    const filas = Object.entries(estadisticasJugadores(lista)).map(([id, s]) => {
      const j = mapa[id];
      if (!j) console.warn(`El id "${id}" no está en jugadores.json`);
      return { id, nombre: j ? j.nombre : id, foto: j && j.foto, num: j && j.numero, pos: j ? j.posicion : '', ...s };
    });
    if (!filas.length) {
      $('contenido').innerHTML = vacio('Arranca en ' + (d.config.temporada || '2027'),
        'Goleadores, asistencias, figuras y tarjetas. Se van a ir sumando solos con cada partido que se carga.');
      return;
    }
    const top = (k, tit, u) => {
      const o = [...filas].sort((x, y) => y[k] - x[k])[0];
      return o && o[k] > 0 ? `<div class="lider"><small>${tit}</small><b>${esc(o.nombre)}</b><span class="v">${o[k]}</span><span class="u">${u}</span></div>` : '';
    };
    const ord = [...filas].sort((x, y) => y[orden] - x[orden] || y.g - x.g || x.nombre.localeCompare(y.nombre));
    const arq = filas.filter(f => f.arq > 0).sort((a, b) => a.gc / a.arq - b.gc / b.arq || b.vi - a.vi);
    $('contenido').innerHTML = `
      <div class="lideres">${top('g', 'Goleador', 'goles')}${top('a', 'Asistidor', 'asist.')}${top('pj', 'Más partidos', 'PJ')}${top('fig', 'Más veces figura', 'veces')}</div>
      <h2 class="sub A">Todo el plantel</h2>
      <div class="tbl-wrap"><table class="tbl clara"><thead><tr><th>#</th><th class="izq">Jugador</th>
        ${COLS.map(([k, t, desc]) => `<th class="ord ${k === orden ? 'on' : ''}" data-k="${k}" title="${desc}">${t}</th>`).join('')}</tr></thead>
      <tbody>${ord.map((f, i) => `<tr><td>${i + 1}</td><td class="izq"><div class="jug">${foto(f)}<div><b>${esc(f.nombre)}</b>${f.pos ? `<small>${esc(f.pos)}</small>` : ''}</div></div></td>
        ${COLS.map(([k]) => `<td class="${k === orden ? 'on' : ''}">${f[k]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="note" style="color:var(--soft)">Tocá una columna para ordenar.</p>
      ${arq.length ? `<h2 class="sub A">Arqueros</h2><div class="tbl-wrap"><table class="tbl clara"><thead><tr><th class="izq">Arquero</th><th>PJ</th><th>GC</th><th>Promedio</th><th>Vallas invictas</th></tr></thead>
        <tbody>${arq.map(f => `<tr><td class="izq"><div class="jug">${foto(f)}<b>${esc(f.nombre)}</b></div></td><td>${f.arq}</td><td>${f.gc}</td><td class="on">${(f.gc / f.arq).toFixed(2)}</td><td>${f.vi}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  }
  $('contenido').addEventListener('click', e => {
    const th = e.target.closest('th.ord'); if (!th) return;
    orden = th.dataset.k; dibujar();
  });
  sel.addEventListener('change', dibujar);
  dibujar();
});
