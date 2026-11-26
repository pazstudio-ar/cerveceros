/* ===== NOTICIAS ===== */
iniciarPagina(d => {
  const $ = id => document.getElementById(id);
  const todas = noticiasOrdenadas(d.noticias);
  if (!todas.length) {
    $('herramientas').hidden = true;
    $('lista').innerHTML = vacio('Pronto', 'Acá van a estar las crónicas de cada fecha y las novedades del equipo.');
    return;
  }
  const cats = [...new Set(todas.map(n => n.categoria).filter(Boolean))];
  let cat = 'Todas';
  $('chips').innerHTML = cats.length > 1 ? ['Todas', ...cats].map(x => `<button type="button" data-c="${esc(x)}">${esc(x)}</button>`).join('') : '';
  $('chips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cat = b.dataset.c; dibujar(); } });
  $('buscar').addEventListener('input', dibujar);
  function dibujar() {
    const q = clave($('buscar').value);
    document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', b.dataset.c === cat));
    const lista = todas.filter(n => (cat === 'Todas' || n.categoria === cat) &&
      (!q || clave(n.titulo + ' ' + (n.resumen || '')).includes(q)));
    $('lista').innerHTML = lista.length ? `<div class="grid-not">${lista.map(tarjetaNoticia).join('')}</div>`
      : vacio('Nada por acá', 'No hay noticias que coincidan con la búsqueda.');
  }
  dibujar();
});
