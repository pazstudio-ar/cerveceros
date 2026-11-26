/* ===== INICIO ===== */
iniciarPagina(d => {
  const c = d.config, nombre = c.nombre || 'Cerveceros';
  const mapa = mapaJugadores(d.jugadores);
  const torneo = torneoActual(d.partidos, c);
  const lista = delTorneo(d.partidos, torneo);
  const jugados = ordenarPartidos(lista.filter(jugado), true);
  const proximos = ordenarPartidos(lista.filter(p => !jugado(p)));
  const $ = id => document.getElementById(id);
  const etiquetaTorneo = torneo || `Temporada ${c.temporada || ''}`;

  /* Portada */
  $('h-sub').textContent = `${c.torneo || ''} · ${divTxt(c)}`;
  if (c.frase) $('h-frase').textContent = c.frase;
  const ult = jugados[0], prox = proximos[0];
  if (ult) {
    const l = ladosDe(ult, nombre);
    $('score').innerHTML = `<small>Último resultado · ${esc(etiquetaTorneo)} · Fecha ${esc(ult.fecha)}</small>
      <span class="t">${esc(l.izq)}</span><span class="r A">${l.gi} <span>—</span> ${l.gd}</span><span class="t">${esc(l.der)}</span>`;
  } else if (prox) {
    const l = ladosDe(prox, nombre);
    $('score').innerHTML = `<small>Próximo partido · Fecha ${esc(prox.fecha)}${prox.dia ? ' · ' + esc(diaLargo(prox.dia)) : ''}${prox.hora ? ' · ' + esc(prox.hora) + ' h' : ''}</small>
      <span class="t">${esc(l.izq)}</span><span class="r A"><span>vs</span></span><span class="t">${esc(l.der)}</span>`;
  } else {
    $('score').className = 'score solo';
    $('score').innerHTML = `<small>${esc(c.torneo || '')} · ${esc(divTxt(c))}</small>
      <span class="big A">Temporada ${esc(c.temporada || '')}</span>
      <span class="t">${c.inicio ? 'Arranca el ' + esc(diaLargo(c.inicio)) : 'Fecha de inicio a confirmar'}</span>`;
  }

  /* Marcador final */
  $('res-sub').textContent = jugados.length ? `${etiquetaTorneo} · deslizá para ver todas las fechas` : etiquetaTorneo;
  $('rail').innerHTML = jugados.length
    ? jugados.map(p => tarjetaMarcador(p, d, mapa)).join('')
    : vacio('Todavía no se jugó', 'Acá van a aparecer los resultados de cada fecha apenas termine el partido.');
  if (!jugados.length) $('rail').classList.remove('rail');

  /* Así venimos */
  $('nums-sub').textContent = jugados.length ? `${etiquetaTorneo} · ${jugados.length} ${jugados.length === 1 ? 'fecha' : 'fechas'}` : etiquetaTorneo;
  $('nums').innerHTML = htmlNums(calcularStats(lista));

  /* Convocados */
  const conv = d.convocados || {};
  const listaConv = (conv.lista || []).map(x => {
    const j = mapa[x];
    return j ? { n: j.numero, nombre: j.nombre } : (typeof x === 'object' ? x : { nombre: String(x) });
  });
  $('conv-sub').textContent = conv.titulo || 'Se publica antes de cada fecha';
  $('convocados').innerHTML = listaConv.length
    ? `<ol class="squad">${listaConv.map((j, i) => {
        const partes = String(j.nombre).trim().split(/\s+/);
        const ap = partes.length > 1 ? partes.pop() : '';
        return `<li><span>${String(j.n ?? i + 1).padStart(2, '0')}</span>${esc(partes.join(' '))} <b>${esc(ap)}</b></li>`;
      }).join('')}</ol>`
    : vacio('Lista a confirmar', 'La lista de convocados se publica antes de cada fecha.');

  /* Tabla: la última cargada de nuestra división (primero la del torneo, si no la anual) */
  const nuestras = d.posiciones.filter(t => clave(t.division) === clave(c.division));
  const tabla = nuestras.filter(t => !t.anual).slice(-1)[0] || nuestras.slice(-1)[0];
  if (tabla) {
    $('tabla-sub').textContent = nombreTabla(tabla);
    $('tabla').innerHTML = htmlTabla(tabla, d) + `<p class="note">Datos de la tabla oficial del ${esc(c.torneo || 'torneo')}.</p>`;
  } else {
    $('tabla-sub').textContent = `${divTxt(c)} · ${c.temporada || ''}`;
    $('tabla').innerHTML = vacio('Arranca en ' + (c.temporada || '2027'), 'La tabla de posiciones se actualiza después de cada fecha. Ojo: el descenso se define por la tabla anual.');
  }

  /* Fixture: lo que viene (o las últimas si ya terminó) */
  const fix = proximos.length ? proximos.slice(0, 4) : ordenarPartidos(lista).slice(-4);
  $('fixture').innerHTML = fix.length
    ? `<ol class="time">${fix.map(p => itemFixture(p, d)).join('')}</ol>`
    : vacio('Fixture a confirmar', 'Cuando la organización publique el fixture, acá van a estar los días, horarios y canchas.');

  /* Noticias */
  const nots = noticiasOrdenadas(d.noticias).slice(0, 3);
  $('noticias').innerHTML = nots.length
    ? `<div class="grid-not">${nots.map(tarjetaNoticia).join('')}</div>`
    : vacio('Pronto', 'Crónicas de cada fecha y novedades del equipo.');
  $('noticias-mas').hidden = d.noticias.length <= 3;

  if (c.instagram) $('ig').href = c.instagram;
  if (c.usuarioInstagram) $('ig-txt').textContent = c.usuarioInstagram;
});
