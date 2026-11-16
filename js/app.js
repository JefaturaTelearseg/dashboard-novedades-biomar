/* Dashboard de Novedades BioMar — TeleArseg
   Todo se calcula en el navegador a partir de data/novedades.js (no necesita servidor). */
(function () {
  'use strict';

  const META = window.NOVEDADES_META || { categorias: {} };
  const NIVELES = ['ALTO', 'MEDIO', 'BAJO'];
  const NIVEL_INFO = {
    ALTO: { nombre: 'Alto', clase: 'alto', desc: 'Riesgo directo para la seguridad: rondas no realizadas, vehículos sospechosos y fallas de procedimiento que exponen al personal.' },
    MEDIO: { nombre: 'Medio', clase: 'medio', desc: 'Requieren verificación: agentes en descanso, personas o vehículos en el perímetro y unidades fuera de cobertura.' },
    BAJO: { nombre: 'Bajo', clase: 'bajo', desc: 'Preventivas u operativas: llamados de atención menores, infraestructura y logística de vehículos.' }
  };
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const MES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const ICO = {
    ALTO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    MEDIO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5M12 16.5h.01"/></svg>',
    BAJO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    total: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>',
    luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    camara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>'
  };

  // ---------- Preparar datos ----------
  const DATOS = (window.NOVEDADES || []).slice().sort((a, b) =>
    (a.fecha + (a.hora || '99:99')).localeCompare(b.fecha + (b.hora || '99:99')));
  DATOS.forEach((n, i) => {
    n.id = 'N-' + String(i + 1).padStart(3, '0');
    n.mes = Number(n.fecha.slice(5, 7)) - 1;
    n.horaNum = n.hora ? Number(n.hora.slice(0, 2)) : null;
    n.fotos = n.fotos || [];
    n.catNombre = META.categorias[n.categoria] || n.categoria;
    n.operadorNombre = n.operador ? titulo(n.operador) : 'Sin registro';
    n.grupoInv = grupoInvolucrado(n.involucrado || '');
    n.texto = [n.titulo, n.detalle, n.zona, n.involucrado, n.operador, n.catNombre, n.codigo].join(' ').toLowerCase();
  });

  const estado = { nivel: 'TODOS', mes: '', zona: '', cat: '', q: '', vista: 'tiempo', orden: { campo: 'fecha', asc: false } };
  let listaActual = [];

  // ---------- Utilidades ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function titulo(s) { return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()); }
  function fechaTxt(f, larga) {
    const [y, m, d] = f.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return larga ? `${DIAS[dt.getDay()]} ${d} de ${MESES[m - 1].toLowerCase()} de ${y}` : `${DIAS[dt.getDay()]} ${d} ${MES_CORTO[m - 1].toLowerCase()}`;
  }
  function grupoInvolucrado(s) {
    const t = s.toLowerCase();
    if (t.includes('patrulla')) return 'Patrulla de Reacción';
    if (t.includes('jefe de campo')) return 'Personal de campo';
    if (t.includes('supervisor') && !t.includes('agente')) return 'Garita / Supervisor interno';
    if (t.includes('agente') || t.includes('grupo de seguridad') || t.includes('garita')) return 'Agente de Seguridad';
    return s || 'Sin registro';
  }
  function contar(lista, clave) {
    const m = new Map();
    lista.forEach((n) => {
      const k = typeof clave === 'function' ? clave(n) : n[clave];
      if (!m.has(k)) m.set(k, { clave: k, total: 0, ALTO: 0, MEDIO: 0, BAJO: 0 });
      const o = m.get(k); o.total++; o[n.nivel]++;
    });
    return [...m.values()].sort((a, b) => b.total - a.total || String(a.clave).localeCompare(String(b.clave)));
  }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function ttNiveles(tituloTt, o) {
    return `<strong>${esc(tituloTt)}</strong>` + NIVELES.map((nv) =>
      `<div class="tt-fila"><i style="background:var(--${NIVEL_INFO[nv].clase})"></i><span>${NIVEL_INFO[nv].nombre}</span><b>${o[nv] || 0}</b></div>`).join('') +
      `<div class="tt-fila" style="margin-top:4px"><i></i><span>Total</span><b>${o.total || 0}</b></div>`;
  }
  const $ = (s) => document.querySelector(s);

  // ---------- Filtros ----------
  function filtrar(omitir) {
    const q = estado.q.trim().toLowerCase();
    return DATOS.filter((n) =>
      (omitir === 'nivel' || estado.nivel === 'TODOS' || n.nivel === estado.nivel) &&
      (omitir === 'mes' || estado.mes === '' || n.mes === Number(estado.mes)) &&
      (omitir === 'zona' || !estado.zona || n.zona === estado.zona) &&
      (omitir === 'cat' || !estado.cat || n.categoria === estado.cat) &&
      (!q || q.split(/\s+/).every((p) => n.texto.includes(p))));
  }

  function llenarSelects() {
    const meses = [...new Set(DATOS.map((n) => n.mes))].sort((a, b) => a - b);
    $('#f-mes').innerHTML = '<option value="">Todos</option>' + meses.map((m) => `<option value="${m}">${MESES[m]}</option>`).join('');
    const zonas = contar(DATOS, 'zona').map((z) => z.clave).sort((a, b) => a.localeCompare(b));
    $('#f-zona').innerHTML = '<option value="">Todas</option>' + zonas.map((z) => `<option>${esc(z)}</option>`).join('');
    $('#f-cat').innerHTML = '<option value="">Todos</option>' + Object.entries(META.categorias).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  }

  function sincronizarControles() {
    document.querySelectorAll('.chips-nivel .chip').forEach((b) => b.classList.toggle('activo', b.dataset.nivel === estado.nivel));
    $('#f-mes').value = estado.mes;
    $('#f-zona').value = estado.zona;
    $('#f-cat').value = estado.cat;
    if ($('#f-buscar').value !== estado.q) $('#f-buscar').value = estado.q;
  }

  function cambiar(cambios) { Object.assign(estado, cambios); render(); }

  // ---------- Portada ----------
  function renderPortada() {
    const tes = [
      ['c2-edificio-gerencia', 'C2 · EDIFICIO GERENCIA'],
      ['c6-p-moto-2', 'C6 · P MOTO 2'],
      ['c9-ingreso-personal', 'C9 · INGRESO PERSONAL'],
      ['c8-contenedor-basura', 'C8 · CONTENEDOR BASURA'],
      ['c12-calle-lateral', 'C12 · CALLE LATERAL'],
      ['c17-subestacion', 'C17 · SUBESTACIÓN · DETECCIÓN']
    ];
    $('#mosaico').innerHTML = tes.map(([f, t], i) =>
      `<div class="tesela t${i + 1}${i === 5 ? ' deteccion' : ''}" style="background-image:url('img/camaras/${f}.webp')"><span class="tesela-tag"><i></i>${t}</span></div>`).join('');
    const meses = [...new Set(DATOS.map((n) => n.mes))].sort((a, b) => a - b);
    const desde = MESES[meses[0]], hasta = MESES[meses[meses.length - 1]];
    $('#portada-sub').textContent = `Matriz de incidentes ${META.anio || ''} · ${desde} a ${hasta} · ${DATOS.length} novedades`;
    if (META.actualizado) $('#pie-act').textContent = 'Actualizado: ' + fechaTxt(META.actualizado, true) + '.';
  }

  // ---------- KPIs ----------
  function renderKpis(lista) {
    const total = lista.length;
    const c = { ALTO: 0, MEDIO: 0, BAJO: 0 };
    lista.forEach((n) => c[n.nivel]++);
    const conHora = lista.filter((n) => n.horaNum != null);
    const madrugada = conHora.filter((n) => n.horaNum < 6).length;
    const conFoto = lista.filter((n) => n.fotos.length).length;
    const fotosUnicas = new Set(lista.flatMap((n) => n.fotos)).size;
    const tarjeta = (cls, ico, tit, valor, sub, barra, nivel) => `
      <${nivel ? 'button' : 'div'} class="tarjeta ${cls}" ${nivel ? `data-ir-nivel="${nivel}" title="Ver solo nivel ${NIVEL_INFO[nivel].nombre}"` : ''}>
        <div class="tarjeta-cab"><span class="tarjeta-ico">${ico}</span><h3>${tit}</h3></div>
        <div class="valor">${valor}</div>
        <div class="sub">${sub}</div>
        <div class="mini-barra"><span style="width:${barra}%"></span></div>
      </${nivel ? 'button' : 'div'}>`;
    $('#kpis').innerHTML =
      tarjeta('', ICO.total, 'Total novedades', total, `${lista.filter((n) => n.fuente !== 'informe').length} en la matriz`, 100) +
      NIVELES.map((nv) => tarjeta(NIVEL_INFO[nv].clase, ICO[nv], 'Nivel ' + NIVEL_INFO[nv].nombre.toLowerCase(),
        `${c[nv]}<small>${pct(c[nv], total)}%</small>`, nv === 'ALTO' ? 'Atención inmediata' : nv === 'MEDIO' ? 'Requieren verificación' : 'Preventivas', pct(c[nv], total), nv)).join('') +
      tarjeta('', ICO.luna, 'De madrugada', `${pct(madrugada, conHora.length)}<small>%</small>`, `${madrugada} de ${conHora.length} entre 00h y 06h`, pct(madrugada, conHora.length)) +
      tarjeta('', ICO.camara, 'Con evidencia', conFoto, `${fotosUnicas} fotos de cámaras`, pct(conFoto, total));
  }

  // ---------- Niveles ----------
  function renderNiveles() {
    const lista = filtrar('nivel');
    const total = lista.length;
    const R = 46, C = 2 * Math.PI * R;
    $('#niveles-grid').innerHTML = NIVELES.map((nv) => {
      const inf = NIVEL_INFO[nv];
      const de = lista.filter((n) => n.nivel === nv);
      const p = pct(de.length, total);
      const top = contar(de, 'catNombre').slice(0, 3);
      const zonaTop = contar(de, 'zona')[0];
      return `<button class="nivel ${inf.clase}${estado.nivel === nv ? ' activo' : ''}" data-ir-nivel="${nv}">
        <div class="anillo">
          <svg viewBox="0 0 112 112"><circle class="pista" cx="56" cy="56" r="${R}" fill="none" stroke-width="10"/>
          <circle class="arco" cx="56" cy="56" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${(C * p) / 100} ${C}"/></svg>
          <div class="anillo-txt"><b>${de.length}</b><small>${p}% del total</small></div>
        </div>
        <div class="nivel-nombre">${ICO[nv]} Nivel ${inf.nombre}</div>
        <div class="nivel-desc">${inf.desc}</div>
        <div class="nivel-top">
          <span class="t">Tipos más frecuentes${zonaTop ? ` · Zona principal: <b>${esc(zonaTop.clave)}</b>` : ''}</span>
          ${top.length ? top.map((t) => `<div><span>${esc(t.clave)}</span><b>${t.total}</b><i><span style="width:${pct(t.total, de.length)}%"></span></i></div>`).join('') : '<div><span>Sin novedades con los filtros actuales</span></div>'}
        </div>
      </button>`;
    }).join('');
  }

  // ---------- Gráfico por mes ----------
  function escala(max) {
    const paso = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : 10;
    const tope = Math.max(paso, Math.ceil(max / paso) * paso);
    const ticks = []; for (let v = 0; v <= tope; v += paso) ticks.push(v);
    return { tope, ticks };
  }
  function renderMes() {
    const lista = filtrar('mes');
    const por = MESES.map((_, m) => {
      const o = { total: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
      lista.filter((n) => n.mes === m).forEach((n) => { o.total++; o[n.nivel]++; });
      return o;
    });
    const { tope, ticks } = escala(Math.max(1, ...por.map((o) => o.total)));
    const alto = 226; // alto útil en px (250 - 24 de etiquetas)
    const pico = por.reduce((a, o, i) => (o.total > por[a].total ? i : a), 0);
    $('#nota-mes').textContent = por[pico].total ? `Mes con más novedades: ${MESES[pico]} (${por[pico].total})` : '';
    $('#g-mes').innerHTML =
      `<div class="eje-y">${ticks.map((t) => `<span style="bottom:${24 + (t / tope) * alto}px">${t}</span>`).join('')}</div>
       <div class="columnas">
         ${ticks.map((t) => `<span class="guia" style="bottom:${24 + (t / tope) * alto}px"></span>`).join('')}
         ${por.map((o, m) => `<div class="col${o.total ? '' : ' sin'}${estado.mes === String(m) ? ' sel' : ''}" data-mes="${m}" data-tt="${esc(ttNiveles(MESES[m], o))}" style="cursor:${o.total ? 'pointer' : 'default'}">
            ${o.total ? `<span class="num">${o.total}</span>` : ''}
            <div class="pila">${NIVELES.filter((nv) => o[nv]).map((nv) => `<span class="seg ${NIVEL_INFO[nv].clase}" style="height:${(o[nv] / tope) * alto - 2}px"></span>`).join('')}</div>
            <span class="lbl">${MES_CORTO[m]}</span>
          </div>`).join('')}
       </div>`;
  }

  // ---------- Hora del día ----------
  function renderHora() {
    const lista = filtrar().filter((n) => n.horaNum != null);
    const h = Array.from({ length: 24 }, () => ({ total: 0, ALTO: 0, MEDIO: 0, BAJO: 0 }));
    lista.forEach((n) => { h[n.horaNum].total++; h[n.horaNum][n.nivel]++; });
    const max = Math.max(1, ...h.map((o) => o.total));
    const franjas = [['Madrugada', 0, 6], ['Mañana', 6, 12], ['Tarde', 12, 18], ['Noche', 18, 24]].map(([nom, a, b]) => ({ nom, a, b, n: h.slice(a, b).reduce((s, o) => s + o.total, 0) }));
    const fmax = Math.max(...franjas.map((f) => f.n));
    $('#g-hora').innerHTML =
      `<div class="horas">${h.map((o, i) => `<div class="hora" data-tt="${esc(ttNiveles(`${String(i).padStart(2, '0')}:00 – ${String(i).padStart(2, '0')}:59`, o))}">
          <div class="celda${o.total ? '' : ' cero'}" style="--a:${(0.12 + 0.78 * (o.total / max)).toFixed(2)}">${o.total || ''}</div>
          <small>${String(i).padStart(2, '0')}h</small></div>`).join('')}</div>
       <div class="franjas">${franjas.map((f) => `<div class="${f.n && f.n === fmax ? 'max' : ''}"><b>${f.n}</b>${f.nom} · ${String(f.a).padStart(2, '0')}h–${String(f.b).padStart(2, '0')}h · ${pct(f.n, lista.length)}%</div>`).join('')}</div>`;
  }

  // ---------- Barras horizontales ----------
  function barrasH(sel, filas, max, tipo, activo) {
    $(sel).innerHTML = filas.length ? filas.map((o) => `
      <div class="fila-h${activo === o.valor ? ' sel' : ''}" ${tipo ? `data-${tipo}="${esc(o.valor)}"` : ''} data-tt="${esc(ttNiveles(o.clave, o))}">
        <span class="nom">${esc(o.clave)}</span>
        <span class="pista-h">${NIVELES.filter((nv) => o[nv]).map((nv) => `<span class="seg ${NIVEL_INFO[nv].clase}" style="width:${(o[nv] / max) * 100}%"></span>`).join('')}</span>
        <span class="val">${o.total}</span>
      </div>`).join('') : '<div class="vacio">Sin datos con los filtros actuales</div>';
  }
  function renderBarras() {
    const zonas = contar(filtrar('zona'), 'zona').slice(0, 10).map((o) => ({ ...o, valor: o.clave }));
    barrasH('#g-zona', zonas, Math.max(1, ...zonas.map((o) => o.total)), 'zona', estado.zona);
    const cats = contar(filtrar('cat'), 'categoria').map((o) => ({ ...o, valor: o.clave, clave: META.categorias[o.clave] || o.clave }));
    barrasH('#g-cat', cats, Math.max(1, ...cats.map((o) => o.total)), 'cat', estado.cat);
    const inv = contar(filtrar(), 'grupoInv');
    barrasH('#g-inv', inv, Math.max(1, ...inv.map((o) => o.total)), null, null);
  }

  // ---------- Operadores ----------
  function renderOperadores() {
    const lista = filtrar();
    const ops = contar(lista, 'operadorNombre');
    $('#g-oper').innerHTML = ops.length ? ops.map((o) => {
      const sin = o.clave === 'Sin registro';
      const ini = sin ? '—' : o.clave.split(' ').map((p) => p[0]).slice(0, 2).join('');
      return `<div class="oper" data-tt="${esc(ttNiveles(o.clave, o))}">
        <span class="ava${sin ? ' sin' : ''}">${ini}</span>
        <span class="n">${esc(o.clave)}${sin ? ' <small style="color:var(--suave);font-weight:500">(solo en el informe)</small>' : ''}</span>
        <span class="t">${o.total}<small>${pct(o.total, lista.length)}%</small></span>
        <span class="pista-h">${NIVELES.filter((nv) => o[nv]).map((nv) => `<span class="seg ${NIVEL_INFO[nv].clase}" style="width:${(o[nv] / o.total) * 100}%"></span>`).join('')}</span>
      </div>`;
    }).join('') : '<div class="vacio">Sin datos con los filtros actuales</div>';
  }

  // ---------- Lista de novedades ----------
  function pillNivel(nv) { return `<span class="pill ${NIVEL_INFO[nv].clase}">${ICO[nv]}${NIVEL_INFO[nv].nombre}</span>`; }
  function tarjetaNov(n) {
    const f = n.fotos[0];
    return `<button class="nov ${NIVEL_INFO[n.nivel].clase}" data-nov="${n.id}">
      <div class="nov-meta">${pillNivel(n.nivel)}<span class="f">${fechaTxt(n.fecha)}${n.fechaEstimada ? '*' : ''}</span><span>${n.hora ? n.hora + ' h' : 'Hora s/r'}</span><span>${esc(n.zona)}</span></div>
      ${f ? `<span class="nov-mini"><img loading="lazy" src="img/evidencias/mini/${f}.jpg" alt="">${n.fotos.length > 1 ? `<span>+${n.fotos.length - 1}</span>` : ''}</span>` : ''}
      <h4>${esc(n.titulo)}</h4>
      <p>${esc(n.detalle)}</p>
      <div class="nov-pie"><span class="etq">${esc(n.catNombre)}</span><span class="etq">${esc(n.operadorNombre)}</span>${n.codigo ? `<span class="etq cod">${esc(n.codigo)}</span>` : ''}${n.nivelEstimado ? '<span class="etq est" title="Solo en el informe: nivel asignado por similitud">Nivel estimado</span>' : ''}<span class="etq">${n.id}</span></div>
    </button>`;
  }
  function renderLista(lista) {
    listaActual = lista;
    const cont = $('#lista');
    if (!lista.length) { cont.innerHTML = '<div class="vacio">No hay novedades con estos filtros. Prueba con “Limpiar”.</div>'; return; }
    if (estado.vista === 'nivel') {
      cont.innerHTML = `<div class="columnas-nivel">${NIVELES.map((nv) => {
        const de = lista.filter((n) => n.nivel === nv).slice().reverse();
        return `<section class="col-nivel ${NIVEL_INFO[nv].clase}"><header><strong>${ICO[nv]} ${NIVEL_INFO[nv].nombre}</strong><span class="pill ${NIVEL_INFO[nv].clase}">${de.length}</span></header>
          <div class="pila-nov">${de.length ? de.map(tarjetaNov).join('') : '<div class="vacio">Sin novedades</div>'}</div></section>`;
      }).join('')}</div>`;
    } else if (estado.vista === 'tabla') {
      const o = estado.orden;
      const val = (n) => o.campo === 'nivel' ? NIVELES.indexOf(n.nivel) : o.campo === 'fecha' ? n.fecha + (n.hora || '') : String(n[o.campo] || '').toLowerCase();
      const ord = lista.slice().sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * (o.asc ? 1 : -1));
      const th = (campo, txt) => `<th data-orden="${campo}">${txt}${o.campo === campo ? ` <span class="ord">${o.asc ? '▲' : '▼'}</span>` : ''}</th>`;
      cont.innerHTML = `<div class="tabla-envoltura"><table><thead><tr>${th('id', 'Nº')}${th('fecha', 'Fecha')}<th>Hora</th>${th('nivel', 'Nivel')}${th('zona', 'Zona')}${th('catNombre', 'Tipo')}<th>Novedad</th>${th('grupoInv', 'Involucrado')}${th('operadorNombre', 'Operador')}<th>Fotos</th></tr></thead>
        <tbody>${ord.map((n) => `<tr data-nov="${n.id}"><td class="nowrap">${n.id}</td><td class="nowrap">${fechaTxt(n.fecha)}${n.fechaEstimada ? '*' : ''}</td><td class="nowrap">${n.hora || '—'}</td><td>${pillNivel(n.nivel)}</td><td class="nowrap">${esc(n.zona)}</td><td>${esc(n.catNombre)}</td><td class="desc">${esc(n.titulo)}</td><td>${esc(n.involucrado)}</td><td class="nowrap">${esc(n.operadorNombre)}</td><td>${n.fotos.length || ''}</td></tr>`).join('')}</tbody></table></div>`;
    } else {
      const grupos = new Map();
      lista.slice().reverse().forEach((n) => { if (!grupos.has(n.mes)) grupos.set(n.mes, []); grupos.get(n.mes).push(n); });
      cont.innerHTML = [...grupos].map(([m, ns]) => {
        const c = { ALTO: 0, MEDIO: 0, BAJO: 0 }; ns.forEach((n) => c[n.nivel]++);
        return `<div class="mes-grupo"><div class="mes-cab"><h3>${MESES[m]} ${META.anio || ''}</h3><span class="pill">${ns.length} novedades</span><span class="linea"></span>
          <span class="resumen">${NIVELES.filter((nv) => c[nv]).map((nv) => `<span class="pill ${NIVEL_INFO[nv].clase}">${ICO[nv]}${c[nv]}</span>`).join('')}</span></div>
          <div class="tarjetas-nov">${ns.map(tarjetaNov).join('')}</div></div>`;
      }).join('');
    }
  }

  // ---------- Galería ----------
  let fotosVisor = [];
  function renderGaleria(lista) {
    const vistas = new Map();
    lista.slice().reverse().forEach((n) => n.fotos.forEach((f) => { if (!vistas.has(f)) vistas.set(f, { f, n, veces: 0 }); vistas.get(f).veces++; }));
    fotosVisor = [...vistas.values()];
    $('#evid-sub').textContent = `${fotosVisor.length} capturas de cámaras adjuntas a ${lista.filter((n) => n.fotos.length).length} novedades. Toca una foto para verla en grande.`;
    $('#galeria').innerHTML = fotosVisor.length ? fotosVisor.map((o, i) => `
      <button class="foto" data-foto="${i}">
        <img loading="lazy" src="img/evidencias/mini/${o.f}.jpg" alt="${esc(o.n.titulo)}">
        ${pillNivel(o.n.nivel)}
        <span class="rec">${o.f.toUpperCase()}</span>
        <span class="cap"><b>${esc(o.n.titulo)}</b><span>${fechaTxt(o.n.fecha)} · ${o.n.hora || 's/h'} · ${esc(o.n.zona)}${o.veces > 1 ? ` · en ${o.veces} novedades` : ''}</span></span>
      </button>`).join('') : '<div class="vacio">No hay fotos para estos filtros.</div>';
  }

  // ---------- Modal de detalle ----------
  function abrirDetalle(id) {
    const n = DATOS.find((x) => x.id === id); if (!n) return;
    const i = listaActual.findIndex((x) => x.id === id);
    const ant = i > 0 ? listaActual[i - 1] : null, sig = i >= 0 && i < listaActual.length - 1 ? listaActual[i + 1] : null;
    const caja = $('#modal .modal-caja');
    caja.className = 'modal-caja ' + NIVEL_INFO[n.nivel].clase;
    $('#modal-cuerpo').innerHTML = `<div class="det">
      <div class="det-cab">${pillNivel(n.nivel)}<span class="pill">${n.id}</span><span class="pill">${esc(n.catNombre)}</span>${n.codigo ? `<span class="pill">${esc(n.codigo)}</span>` : ''}</div>
      <h2 id="modal-titulo">${esc(n.titulo)}</h2>
      ${n.fotos.length ? `<div class="det-fotos${n.fotos.length > 1 ? ' dos' : ''}">${n.fotos.map((f) => `<button data-foto-ev="${f}" data-nov-foto="${n.id}"><img src="img/evidencias/${f}.jpg" alt="Captura ${f}"></button>`).join('')}</div>` : ''}
      <div class="det-datos">
        <div><small>Fecha</small><b>${fechaTxt(n.fecha, true)}${n.fechaEstimada ? ' *' : ''}</b></div>
        <div><small>Hora</small><b>${n.hora ? n.hora + ' h' : 'Sin registro'}</b></div>
        <div><small>Zona / punto</small><b>${esc(n.zona)}</b></div>
        <div><small>Involucrado</small><b>${esc(n.involucrado || '—')}</b></div>
        <div><small>Operador CCTV</small><b>${esc(n.operadorNombre)}</b></div>
        <div><small>Fuente</small><b>${n.fuente === 'ambos' ? 'Matriz + informe' : n.fuente === 'matriz' ? 'Matriz de incidentes' : 'Informe de novedades'}</b></div>
      </div>
      <div class="det-texto"><small>Descripción y acción adoptada</small>${esc(n.detalle)}</div>
      ${n.nivelEstimado ? '<div class="det-aviso">Esta novedad solo aparece en el informe. Su nivel se asignó por similitud con novedades del mismo tipo en la matriz.</div>' : ''}
      ${n.fechaEstimada ? '<div class="det-aviso">* El informe no traía fecha; se tomó la de la novedad que comparte la misma foto.</div>' : ''}
      <div class="det-nav">
        <button class="btn" ${ant ? `data-nov="${ant.id}"` : 'disabled style="opacity:.35"'}>‹ Anterior</button>
        <button class="btn" ${sig ? `data-nov="${sig.id}"` : 'disabled style="opacity:.35"'}>Siguiente ›</button>
      </div>
    </div>`;
    $('#modal').hidden = false;
    document.body.classList.add('bloqueado');
    caja.scrollTop = 0;
    $('#modal .modal-x').focus();
  }
  function cerrarDetalle() { $('#modal').hidden = true; if ($('#visor').hidden) document.body.classList.remove('bloqueado'); }

  // ---------- Visor de fotos ----------
  let visorLista = [], visorPos = 0;
  function abrirVisor(lista, pos) {
    visorLista = lista; visorPos = pos;
    mostrarVisor();
    $('#visor').hidden = false;
    document.body.classList.add('bloqueado');
  }
  function mostrarVisor() {
    const o = visorLista[visorPos]; if (!o) return;
    $('#visor-img').src = `img/evidencias/${o.f}.jpg`;
    $('#visor-img').alt = o.n.titulo;
    $('#visor-cap').innerHTML = `${pillNivel(o.n.nivel)} <b>${esc(o.n.titulo)}</b> · ${fechaTxt(o.n.fecha)} · ${o.n.hora || 's/h'} · ${esc(o.n.zona)} <span style="opacity:.6">(${visorPos + 1}/${visorLista.length})</span>`;
    document.querySelectorAll('.visor-nav').forEach((b) => { b.style.visibility = visorLista.length > 1 ? 'visible' : 'hidden'; });
  }
  function moverVisor(d) { visorPos = (visorPos + d + visorLista.length) % visorLista.length; mostrarVisor(); }
  function cerrarVisor() { $('#visor').hidden = true; if ($('#modal').hidden) document.body.classList.remove('bloqueado'); }

  // ---------- CSV ----------
  function descargarCsv() {
    const cols = [['id', 'Nº'], ['fecha', 'Fecha'], ['hora', 'Hora'], ['nivel', 'Nivel'], ['zona', 'Zona'], ['catNombre', 'Tipo'], ['titulo', 'Novedad'], ['detalle', 'Acción adoptada'], ['involucrado', 'Involucrado'], ['operadorNombre', 'Operador CCTV'], ['codigo', 'Código'], ['fuente', 'Fuente']];
    const celda = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = '﻿' + [cols.map((c) => celda(c[1])).join(';'), ...listaActual.map((n) => cols.map((c) => celda(n[c[0]])).join(';'))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `novedades-biomar-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Render general ----------
  function render() {
    sincronizarControles();
    const lista = filtrar();
    $('#contador').innerHTML = `Mostrando <b>${lista.length}</b> de ${DATOS.length} novedades`;
    renderKpis(lista);
    renderNiveles();
    renderMes();
    renderHora();
    renderBarras();
    renderOperadores();
    renderLista(lista);
    renderGaleria(lista);
  }

  // ---------- Tooltip ----------
  const tip = $('#tooltip');
  function moverTip(e) {
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > innerHeight - 8) y = e.clientY - h - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-tt]');
    if (!el) { tip.classList.remove('ver'); return; }
    tip.innerHTML = el.dataset.tt; tip.classList.add('ver'); moverTip(e);
  });
  document.addEventListener('mousemove', (e) => { if (tip.classList.contains('ver')) moverTip(e); });
  document.addEventListener('scroll', () => tip.classList.remove('ver'), { passive: true });

  // ---------- Eventos ----------
  document.addEventListener('click', (e) => {
    const t = e.target;
    let el;
    if ((el = t.closest('.chips-nivel .chip'))) return cambiar({ nivel: el.dataset.nivel });
    if ((el = t.closest('[data-ir-nivel]'))) {
      const nv = el.dataset.irNivel;
      cambiar({ nivel: estado.nivel === nv ? 'TODOS' : nv });
      return;
    }
    if ((el = t.closest('.col[data-mes]'))) { if (!el.classList.contains('sin')) cambiar({ mes: estado.mes === el.dataset.mes ? '' : el.dataset.mes }); return; }
    if ((el = t.closest('.fila-h[data-zona]'))) return cambiar({ zona: estado.zona === el.dataset.zona ? '' : el.dataset.zona });
    if ((el = t.closest('.fila-h[data-cat]'))) return cambiar({ cat: estado.cat === el.dataset.cat ? '' : el.dataset.cat });
    if ((el = t.closest('[data-foto-ev]'))) {
      const n = DATOS.find((x) => x.id === el.dataset.novFoto);
      const lista = n.fotos.map((f) => ({ f, n }));
      return abrirVisor(lista, n.fotos.indexOf(el.dataset.fotoEv));
    }
    if ((el = t.closest('[data-nov]'))) return abrirDetalle(el.dataset.nov);
    if ((el = t.closest('[data-foto]'))) return abrirVisor(fotosVisor, Number(el.dataset.foto));
    if ((el = t.closest('.segmento button'))) {
      estado.vista = el.dataset.vista;
      document.querySelectorAll('.segmento button').forEach((b) => b.classList.toggle('activo', b === el));
      return renderLista(filtrar());
    }
    if ((el = t.closest('th[data-orden]'))) {
      const c = el.dataset.orden;
      estado.orden = { campo: c, asc: estado.orden.campo === c ? !estado.orden.asc : true };
      return renderLista(filtrar());
    }
    if (t.closest('[data-cerrar]')) return cerrarDetalle();
    if (t.closest('.visor-x') || t.id === 'visor') return cerrarVisor();
    if ((el = t.closest('.visor-nav'))) return moverVisor(el.classList.contains('prev') ? -1 : 1);
  });
  $('#f-mes').addEventListener('change', (e) => cambiar({ mes: e.target.value }));
  $('#f-zona').addEventListener('change', (e) => cambiar({ zona: e.target.value }));
  $('#f-cat').addEventListener('change', (e) => cambiar({ cat: e.target.value }));
  let espera;
  $('#f-buscar').addEventListener('input', (e) => { clearTimeout(espera); espera = setTimeout(() => cambiar({ q: e.target.value }), 180); });
  $('#f-limpiar').addEventListener('click', () => cambiar({ nivel: 'TODOS', mes: '', zona: '', cat: '', q: '' }));
  $('#btn-csv').addEventListener('click', descargarCsv);
  document.addEventListener('keydown', (e) => {
    if (!$('#visor').hidden) {
      if (e.key === 'Escape') cerrarVisor();
      else if (e.key === 'ArrowLeft') moverVisor(-1);
      else if (e.key === 'ArrowRight') moverVisor(1);
    } else if (!$('#modal').hidden && e.key === 'Escape') cerrarDetalle();
  });

  // Menú: resaltar la sección visible
  const enlaces = [...document.querySelectorAll('#menu a')];
  const secciones = enlaces.map((a) => document.querySelector(a.getAttribute('href')));
  function marcarMenu() {
    let actual = 0;
    secciones.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 160) actual = i; });
    enlaces.forEach((a, i) => a.classList.toggle('activo', i === actual));
  }
  document.addEventListener('scroll', marcarMenu, { passive: true });

  // ---------- Inicio ----------
  llenarSelects();
  renderPortada();
  render();
  marcarMenu();
})();
