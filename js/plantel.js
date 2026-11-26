/* ===== PLANTEL ===== */
iniciarPagina(d => {
  const $ = id => document.getElementById(id);
  const jugadores = d.jugadores;
  if (!jugadores.length) {
    $('chips').hidden = true;
    $('plantel').innerHTML = vacio('Plantel ' + (d.config.temporada || ''),
      'La lista de jugadores, con número y puesto, se carga antes de que arranque el torneo.');
    return;
  }
  const est = estadisticasJugadores(delTorneo(d.partidos, torneoActual(d.partidos, d.config)));
  const ORDEN = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];
  const puestos = [...new Set(jugadores.map(j => j.posicion).filter(Boolean))]
    .sort((a, b) => (ORDEN.indexOf(a) + 1 || 9) - (ORDEN.indexOf(b) + 1 || 9));
  let filtro = 'Todos';

  $('chips').innerHTML = ['Todos', ...puestos].map(p => `<button type="button" data-p="${esc(p)}">${esc(p === 'Todos' ? p : p + 's')}</button>`).join('');
  $('chips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filtro = b.dataset.p; dibujar();
  });

  function tarjeta(j) {
    const s = est[j.id] || { pj: 0, g: 0 };
    const num = j.numero !== undefined && j.numero !== '' ? `<span class="num">${esc(j.numero)}</span>` : '';
    const foto = j.foto
      ? `<div class="foto"><img src="${esc(j.foto)}" alt="${esc(j.nombre)}" loading="lazy" onerror="this.parentNode.classList.add('sin');this.remove()">${num}</div>`
      : `<div class="foto sin">${num || `<span class="num">${esc(iniciales(j.nombre))}</span>`}</div>`;
    return `<article class="card-jug">${foto}
      <div class="info"><small>${esc(j.posicion || 'Jugador')}</small><h3>${esc(j.nombre)}</h3>
      ${j.apodo ? `<small>"${esc(j.apodo)}"</small>` : ''}
      <p><span><b>${s.pj}</b> PJ</span><span><b>${s.g}</b> goles</span></p></div></article>`;
  }

  function dibujar() {
    document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', b.dataset.p === filtro));
    const lista = jugadores.filter(j => filtro === 'Todos' || j.posicion === filtro)
      .sort((a, b) => (Number(a.numero) || 999) - (Number(b.numero) || 999));
    $('plantel').innerHTML = `<div class="grid-jug">${lista.map(tarjeta).join('')}</div>`;
  }
  dibujar();
});
