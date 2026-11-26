/* ===== UNA NOTICIA ===== */
iniciarPagina(d => {
  const cont = document.getElementById('articulo');
  const id = new URLSearchParams(location.search).get('id');
  const n = d.noticias.find(x => x.id === id);
  if (!n) {
    cont.innerHTML = vacio('No la encontramos', 'Puede que el link esté mal escrito.') +
      '<p style="margin-top:18px"><a class="more" href="noticias.html">Ver todas las noticias</a></p>';
    return;
  }
  const nombre = d.config.nombre || 'Cerveceros';
  document.title = `${n.titulo} · ${nombre}`;
  const parrafos = (Array.isArray(n.contenido) ? n.contenido : [n.contenido]).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
  const texto = encodeURIComponent(`${n.titulo} · ${nombre}\n${location.href}`);
  cont.innerHTML = `
    <a href="noticias.html" class="volver">← Todas las noticias</a>
    <span class="cat">${esc(n.categoria || 'Noticia')}</span>
    <h1 class="A">${esc(n.titulo)}</h1>
    <p class="meta">${esc(diaLargo(n.fecha))}${n.autor ? ' · ' + esc(n.autor) : ''}</p>
    ${n.imagen ? `<img class="portada" src="${esc(n.imagen)}" alt="" onerror="this.remove()">` : ''}
    <div class="texto">${parrafos}</div>
    <div class="compartir"><span>Compartir</span>
      <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${texto}">WhatsApp</a>
      <button class="btn sec" id="copiar" type="button">Copiar link</button></div>`;
  document.getElementById('copiar').addEventListener('click', e => {
    const b = e.target;
    (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())
      .then(() => { b.textContent = 'Link copiado'; setTimeout(() => (b.textContent = 'Copiar link'), 2000); })
      .catch(() => prompt('Copiá este link:', location.href));
  });
});
