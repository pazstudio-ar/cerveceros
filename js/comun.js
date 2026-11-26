/* ===== CERVECEROS · funciones compartidas =====
   Los datos viven en la carpeta /data. Las páginas se arman solas. */

async function cargarJSON(ruta, porDefecto) {
  try {
    const r = await fetch(ruta, { cache: 'no-cache' });
    if (!r.ok) throw new Error('No se pudo cargar ' + ruta);
    return await r.json();
  } catch (e) {
    console.error(e);
    if (porDefecto !== undefined) return porDefecto;
    throw e;
  }
}

function cargarTodo() {
  return Promise.all([
    cargarJSON('data/config.json', {}),
    cargarJSON('data/partidos.json', []),
    cargarJSON('data/jugadores.json', []),
    cargarJSON('data/posiciones.json', []),
    cargarJSON('data/noticias.json', []),
    cargarJSON('data/convocados.json', {})
  ]).then(([config, partidos, jugadores, posiciones, noticias, convocados]) =>
    ({ config, partidos, jugadores, posiciones, noticias, convocados }));
}

// Evita que un texto con símbolos raros rompa la página
function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const clave = t => String(t || '').trim().toLowerCase();

/* ----- fechas ----- */
function parsearDia(iso) {
  if (!iso) return null;
  const [a, m, d] = String(iso).split('-').map(Number);
  return new Date(a, m - 1, d);
}
function diaLargo(iso) {
  const d = parsearDia(iso);
  if (!d) return '';
  const t = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function diaCorto(iso) {
  const d = parsearDia(iso);
  return d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}

/* ----- partidos ----- */
const jugado = p => p.estado === 'jugado';
function resultadoDe(p) {
  if (p.golesFavor > p.golesContra) return 'V';
  if (p.golesFavor < p.golesContra) return 'D';
  return 'E';
}
const TEXTO_RES = { V: 'Victoria', E: 'Empate', D: 'Derrota' };

// Torneos en el orden en que aparecen en partidos.json (el último es el actual)
function listarTorneos(partidos) {
  const vistos = [];
  partidos.forEach(p => {
    const nombre = String(p.torneo || 'Sin torneo').trim();
    if (!vistos.some(t => clave(t) === clave(nombre))) vistos.push(nombre);
  });
  return vistos;
}
function torneoActual(partidos, config) {
  const lista = listarTorneos(partidos);
  if (config && config.torneoActual && lista.some(t => clave(t) === clave(config.torneoActual))) return config.torneoActual;
  return lista[lista.length - 1] || '';
}
function delTorneo(partidos, torneo) {
  return partidos.filter(p => clave(p.torneo || 'Sin torneo') === clave(torneo));
}
// Ordena por número de fecha (y por día si lo hay)
function ordenarPartidos(lista, desc) {
  const v = p => (p.dia ? parsearDia(p.dia).getTime() : 0) + (Number(p.fecha) || 0);
  return [...lista].sort((a, b) => {
    const n = (Number(a.fecha) || 0) - (Number(b.fecha) || 0) || v(a) - v(b);
    return desc ? -n : n;
  });
}

// Local y visitante, con Cerveceros en su lugar
function ladosDe(p, nombre) {
  const visitante = p.local === false;
  return visitante
    ? { izq: p.rival, der: nombre, gi: p.golesContra, gd: p.golesFavor }
    : { izq: nombre, der: p.rival, gi: p.golesFavor, gd: p.golesContra };
}

function calcularStats(partidos) {
  const s = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  partidos.filter(jugado).forEach(p => {
    s.pj++; s.gf += Number(p.golesFavor) || 0; s.gc += Number(p.golesContra) || 0;
    const r = resultadoDe(p);
    if (r === 'V') s.pg++; else if (r === 'D') s.pp++; else s.pe++;
  });
  s.pts = s.pg * 3 + s.pe;
  return s;
}

/* ----- jugadores ----- */
function mapaJugadores(jugadores) {
  const m = {};
  jugadores.forEach(j => { m[j.id] = j; });
  return m;
}
const nombreDe = (id, mapa) => (mapa[id] ? mapa[id].nombre : id);
function apellidoDe(id, mapa) {
  const j = mapa[id];
  if (!j) return id;
  if (j.apodo) return j.apodo;
  const partes = j.nombre.trim().split(/\s+/);
  return partes.length > 1 ? partes.slice(1).join(' ') : j.nombre;
}
function textoGoles(p, mapa) {
  const g = p.goles || {};
  return Object.entries(g).map(([id, n]) => apellidoDe(id, mapa) + (n > 1 ? ` (${n})` : '')).join(', ');
}

// Suma las estadísticas de cada jugador a partir de los partidos jugados
function estadisticasJugadores(partidos) {
  const m = {};
  const get = id => m[id] || (m[id] = { pj: 0, g: 0, a: 0, am: 0, ro: 0, fig: 0, arq: 0, gc: 0, vi: 0 });
  partidos.filter(jugado).forEach(p => {
    const goles = p.goles || {}, asist = p.asistencias || {};
    const presentes = new Set([...(p.jugaron || []), ...Object.keys(goles), ...Object.keys(asist),
      ...(p.amarillas || []), ...(p.rojas || [])]);
    if (p.arquero) presentes.add(p.arquero);
    if (p.figura) presentes.add(p.figura);
    presentes.forEach(id => { get(id).pj++; });
    Object.entries(goles).forEach(([id, n]) => { get(id).g += Number(n) || 0; });
    Object.entries(asist).forEach(([id, n]) => { get(id).a += Number(n) || 0; });
    (p.amarillas || []).forEach(id => { get(id).am++; });
    (p.rojas || []).forEach(id => { get(id).ro++; });
    if (p.figura) get(p.figura).fig++;
    if (p.arquero) {
      const s = get(p.arquero), gc = Number(p.golesContra) || 0;
      s.arq++; s.gc += gc; if (gc === 0) s.vi++;
    }
  });
  return m;
}

function iniciales(nombre) {
  const pal = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  return (pal.length > 1 ? pal[0][0] + pal[pal.length - 1][0] : String(nombre || '?').slice(0, 2)).toUpperCase();
}

/* ----- tablas de posiciones ----- */
// Cada tabla: { torneo, division, fecha, equipos: [{ equipo, pts, pj, g, e, p, gf, gc }] }
// Se respeta el orden oficial tal como se carga (por descuentos de puntos, etc.)
function filasTabla(t) {
  return (t.equipos || []).map((e, i) => {
    const g = Number(e.g) || 0, em = Number(e.e) || 0, pe = Number(e.p) || 0;
    const gf = e.gf, gc = e.gc;
    const dg = e.dg !== undefined ? Number(e.dg) : (gf !== undefined && gc !== undefined ? gf - gc : 0);
    return {
      pos: e.pos || i + 1, equipo: e.equipo,
      pts: e.pts !== undefined ? Number(e.pts) : g * 3 + em,
      pj: e.pj !== undefined ? Number(e.pj) : g + em + pe,
      g, e: em, p: pe, gf: gf ?? '', gc: gc ?? '', dg
    };
  });
}
const esNuestro = (nombre, config) => clave(nombre) === clave((config && config.nombre) || 'Cerveceros');
const signo = n => (n > 0 ? '+' : '') + n;

/* ----- íconos ----- */
const ICONOS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
function icono(n) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">${ICONOS[n] || ''}</svg>`;
}

/* ----- menú, ticker y pie (iguales en todas las páginas) ----- */
const PAGINAS = [
  { id: 'inicio', texto: 'Inicio', url: './' },
  { id: 'partidos', texto: 'Fixture', url: 'partidos.html' },
  { id: 'tabla', texto: 'Tabla', url: 'tabla.html' },
  { id: 'plantel', texto: 'Plantel', url: 'plantel.html' },
  { id: 'estadisticas', texto: 'Estadísticas', url: 'estadisticas.html' },
  { id: 'noticias', texto: 'Noticias', url: 'noticias.html' }
];

function armarTicker(d) {
  const el = document.getElementById('ticker');
  if (!el) return;
  const c = d.config, nombre = c.nombre || 'Cerveceros';
  const items = [`${esc(c.torneo || 'Torneo Abierto UTN')} · <b>${esc(divTxt(c))}</b>`];
  const torneo = torneoActual(d.partidos, c);
  const lista = delTorneo(d.partidos, torneo);
  const ult = ordenarPartidos(lista.filter(jugado), true)[0];
  const prox = ordenarPartidos(lista.filter(p => !jugado(p)))[0];
  items.push(esc(torneo || `Temporada ${c.temporada || ''}`));
  if (ult) {
    const l = ladosDe(ult, nombre);
    items.push(`Fecha ${esc(ult.fecha)} · ${esc(l.izq)} ${l.gi} — ${esc(l.der)} ${l.gd}`);
  }
  if (prox) items.push(`Próxima: <b>${esc(prox.rival)}</b>${prox.dia ? ' · ' + esc(diaLargo(prox.dia)) : ''}${prox.hora ? ' · ' + esc(prox.hora) + ' h' : ''}`);
  if (!ult && !prox) items.push(c.inicio ? `Arranca el ${esc(diaLargo(c.inicio))}` : 'Se viene la temporada');
  (c.ticker || []).forEach(t => items.push(esc(t)));
  items.push('Todos pagamos por jugar', 'CRVC');
  const fila = items.map(t => `<span>${t}</span>`).join('');
  el.innerHTML = `<div>${fila}${fila}</div>`;
}

function armarMenu(c) {
  const el = document.getElementById('nav');
  if (!el) return;
  const actual = document.body.dataset.pagina;
  el.innerHTML = `
    <div class="wrap">
      <a href="./" class="marca"><img src="img/escudo.jpg" alt=""><span>${esc(c.nombre || 'Cerveceros')}</span></a>
      <button class="menu-btn" id="menu-btn" aria-label="Abrir menú" aria-expanded="false">${icono('menu')}</button>
      <div class="links" id="links">${PAGINAS.map(p =>
        `<a href="${p.url}" class="${p.id === actual ? 'on' : ''}">${p.texto}</a>`).join('')}</div>
    </div>`;
  const btn = document.getElementById('menu-btn'), links = document.getElementById('links');
  btn.addEventListener('click', () => {
    const abierto = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', abierto);
  });
}

function armarPie(c) {
  const el = document.getElementById('pie');
  if (!el) return;
  el.innerHTML = `
    <div class="wrap">
      <span>${esc(c.nombre || 'Cerveceros')} · ${esc(c.torneo || '')} · ${esc(divTxt(c))}</span>
      <nav>${PAGINAS.map(p => `<a href="${p.url}">${p.texto}</a>`).join('')}
        ${c.instagram ? `<a href="${esc(c.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}</nav>
      <span class="firma">Diseño web: <a href="https://www.instagram.com/pazstudio.ar/" target="_blank" rel="noopener">Paz Studio</a></span>
    </div>`;
}

function animarAlVer(raiz) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const contar = el => {
    const n = +el.dataset.n;
    if (reduce || !n) return;
    let i = 0; el.textContent = '0';
    const t = setInterval(() => { i++; el.textContent = i; if (i >= n) clearInterval(t); }, Math.max(20, 600 / n));
  };
  const els = (raiz || document).querySelectorAll('.rv:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-n]').forEach(contar);
    io.unobserve(e.target);
  }), { threshold: .12 });
  els.forEach(el => io.observe(el));
}

// Arranque común: carga los datos, arma menú, ticker y pie, y llama a la página
function iniciarPagina(dibujar) {
  document.addEventListener('DOMContentLoaded', async () => {
    const d = await cargarTodo();
    armarMenu(d.config);
    armarTicker(d);
    armarPie(d.config);
    try { dibujar(d); } catch (e) { console.error(e); }
    animarAlVer();
  });
}

/* ----- piezas que se repiten entre páginas ----- */
function vacio(titulo, texto) {
  return `<div class="vacio"><b>${esc(titulo)}</b>${esc(texto)}</div>`;
}

// Tarjeta de "Marcador final"
function tarjetaMarcador(p, d, mapa) {
  const nombre = d.config.nombre || 'Cerveceros';
  const l = ladosDe(p, nombre), r = resultadoDe(p);
  const goles = textoGoles(p, mapa);
  const extra = [];
  if (goles) extra.push(`Goles: ${esc(goles)}`);
  if (p.figura) extra.push(`Figura: ${esc(apellidoDe(p.figura, mapa))}`);
  if (p.noticia) extra.push(`<a href="noticia.html?id=${encodeURIComponent(p.noticia)}">Leer la crónica</a>`);
  return `
    <article class="mk ${r}">
      <span class="f">Fecha ${esc(p.fecha)}${p.dia ? ' · ' + esc(diaCorto(p.dia)) : ''}</span>
      <div class="res"><b>${esc(l.izq)}</b><span class="n">${l.gi}-${l.gd}</span><b>${esc(l.der)}</b></div>
      <span class="badge">${TEXTO_RES[r]}</span>
      ${extra.length ? `<p class="gol">${extra.join(' · ')}</p>` : ''}
    </article>`;
}

// Renglón del fixture (jugado o por jugar)
function itemFixture(p, d) {
  const nombre = d.config.nombre || 'Cerveceros';
  const l = ladosDe(p, nombre);
  const datos = [`Fecha ${esc(p.fecha)}`];
  if (p.dia) datos.push(esc(diaLargo(p.dia)));
  if (p.hora) datos.push(esc(p.hora) + ' h');
  if (p.cancha) datos.push(esc(p.cancha));
  const clase = jugado(p) ? resultadoDe(p) : 'prox';
  const centro = jugado(p) ? `${esc(l.izq)} ${l.gi} <em>—</em> ${l.gd} ${esc(l.der)}` : `${esc(l.izq)} <em class="vs">vs</em> ${esc(l.der)}`;
  const nota = [p.nota ? esc(p.nota) : '', p.noticia ? `<a href="noticia.html?id=${encodeURIComponent(p.noticia)}">Leer la crónica</a>` : '']
    .filter(Boolean).join(' · ');
  return `<li class="${clase}"><span class="f">${datos.join(' · ')}</span><div class="m A">${centro}</div>${nota ? `<span class="d">${nota}</span>` : ''}</li>`;
}

function htmlNums(s) {
  return [[s.pj, 'Jugados'], [s.pg, 'Ganados', 'hl'], [s.pe, 'Empatados'], [s.pp, 'Perdidos'],
    [s.gf, 'Goles a favor'], [s.gc, 'Goles en contra']]
    .map(([n, t, c]) => `<div class="${c || ''}"><b data-n="${n}">${n}</b><span>${t}</span></div>`).join('');
}

// Tabla de posiciones (la de fondo azul)
function htmlTabla(t, d, completa) {
  const filas = filasTabla(t);
  const desc = Number(((d.config.descienden || {})[t.division]) || 0);
  const marcarDescenso = desc > 0 && t.anual;
  const cab = `<tr><th>Pos</th><th class="izq">Equipo</th><th>Pts</th><th>PJ</th>
    <th class="hide">G</th><th class="hide">E</th><th class="hide">P</th>
    ${completa ? '<th class="hide">GF</th><th class="hide">GC</th>' : ''}<th>DG</th></tr>`;
  const cuerpo = filas.map((f, i) => {
    const cl = [];
    if (esNuestro(f.equipo, d.config)) cl.push('cv');
    if (marcarDescenso && i >= filas.length - desc) cl.push('desc');
    if (marcarDescenso && i === filas.length - desc) cl.push('corte');
    return `<tr class="${cl.join(' ')}"><td>${esc(f.pos)}</td><td class="izq">${esc(f.equipo)}</td><td class="p">${f.pts}</td><td>${f.pj}</td>
      <td class="hide">${f.g}</td><td class="hide">${f.e}</td><td class="hide">${f.p}</td>
      ${completa ? `<td class="hide">${f.gf}</td><td class="hide">${f.gc}</td>` : ''}<td>${signo(f.dg)}</td></tr>`;
  }).join('');
  return `<div class="tbl-wrap"><table class="tbl"><thead>${cab}</thead><tbody>${cuerpo}</tbody></table></div>`;
}

function nombreTabla(t) {
  return `${t.torneo}${t.division ? ' · División ' + t.division : ''}${t.fecha ? ' · Fecha ' + t.fecha : ''}`;
}

// Tarjeta de noticia
function tarjetaNoticia(n) {
  const img = n.imagen
    ? `<div class="img"><img src="${esc(n.imagen)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('sin');this.src='img/escudo.jpg'"></div>`
    : `<div class="img sin"><img src="img/escudo.jpg" alt=""></div>`;
  return `
    <a class="not" href="noticia.html?id=${encodeURIComponent(n.id)}">
      ${img}
      <div class="c"><span class="cat">${esc(n.categoria || 'Noticia')} · ${esc(diaCorto(n.fecha))}</span>
        <h3>${esc(n.titulo)}</h3>${n.resumen ? `<p>${esc(n.resumen)}</p>` : ''}</div>
    </a>`;
}
const noticiasOrdenadas = lista => [...lista].sort((a, b) => (parsearDia(b.fecha) || 0) - (parsearDia(a.fecha) || 0));
const divTxt = c => (c && c.division ? 'División ' + c.division : '');
