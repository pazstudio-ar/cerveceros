/* ===== FIXTURE Y RESULTADOS ===== */
iniciarPagina(d => {
  const $ = id => document.getElementById(id);
  const mapa = mapaJugadores(d.jugadores);
  const torneos = listarTorneos(d.partidos);
  const sel = $('sel-torneo');

  if (!torneos.length) {
    $('barra').hidden = true;
    $('contenido').innerHTML = vacio('Fixture a confirmar',
      'Cuando la organización publique el fixture de ' + (d.config.temporada || 'la temporada') +
      ', acá van a estar todas las fechas con día, horario y cancha. Después de cada partido se carga el resultado.');
    return;
  }

  sel.innerHTML = torneos.map(t => `<option value="${esc(clave(t))}">${esc(t)}</option>`).join('');
  const pedido = new URLSearchParams(location.search).get('torneo');
  sel.value = pedido && torneos.some(t => clave(t) === clave(pedido)) ? clave(pedido) : clave(torneoActual(d.partidos, d.config));

  function dibujar() {
    const lista = delTorneo(d.partidos, sel.value);
    const jugados = ordenarPartidos(lista.filter(jugado), true);
    const proximos = ordenarPartidos(lista.filter(p => !jugado(p)));
    const ult5 = ordenarPartidos(lista.filter(jugado)).slice(-5);
    $('racha').innerHTML = ult5.length ? '<small>Últimos ' + ult5.length + '</small>' +
      ult5.map(p => `<span class="${resultadoDe(p)}" title="Fecha ${esc(p.fecha)}: ${TEXTO_RES[resultadoDe(p)]}">${resultadoDe(p)}</span>`).join('') : '';

    $('contenido').innerHTML = `
      <div class="nums rv">${htmlNums(calcularStats(lista))}</div>
      ${jugados.length ? `<h2 class="sub A">Marcador final</h2><div class="rail">${jugados.map(p => tarjetaMarcador(p, d, mapa)).join('')}</div>` : ''}
      <h2 class="sub A">Fixture completo</h2>
      <ol class="time">${ordenarPartidos(lista).map(p => itemFixture(p, d)).join('')}</ol>
      ${!proximos.length && !jugados.length ? vacio('Sin partidos', 'Todavía no hay partidos cargados para este torneo.') : ''}`;
    animarAlVer($('contenido'));
  }
  sel.addEventListener('change', () => { history.replaceState(null, '', '?torneo=' + encodeURIComponent(sel.value)); dibujar(); });
  dibujar();
});
