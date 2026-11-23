/* =========================================================
   NO hunger — Mapa
   Desenho do mapa das interfaces originais (ruas, praças, pinos
   numerados, marcador "Você"), com os pinos posicionados a partir
   das coordenadas reais e da distância até o usuário.

   Para produção com mapa de ruas real, substitua NH.mapa.render
   por um adaptador Leaflet/MapLibre mantendo a mesma assinatura
   (ver docs/BACKEND.md › Mapas).
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils;
  const { html, raw } = U;
  const c = C.cores;

  const FORMATOS = {
    retrato: { w: 520, h: 640, cx: 260, cy: 300, raioPx: 200 },
    paisagem: { w: 800, h: 420, cx: 400, cy: 210, raioPx: 170 }
  };

  /* Fundo: ruas e praças do design original, escalados para o formato */
  function fundo(f) {
    const sx = f.w / 520, sy = f.h / 640;
    const P = (x, y) => `${Math.round(x * sx)} ${Math.round(y * sy)}`;
    const linha = (x1, y1, x2, y2) => `<path d="M${P(x1, y1)}L${P(x2, y2)}"></path>`;
    return `<rect width="${f.w}" height="${f.h}" fill="${c.sand}"></rect>
      <rect x="${30 * sx}" y="${360 * sy}" width="${150 * sx}" height="${110 * sy}" rx="14" fill="${c.green100}"></rect>
      <rect x="${340 * sx}" y="${60 * sy}" width="${140 * sx}" height="${90 * sy}" rx="14" fill="${c.green100}"></rect>
      <g stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" fill="none">${linha(-10, 120, 540, 190)}${linha(-10, 330, 540, 280)}${linha(-10, 540, 540, 500)}${linha(110, -10, 170, 650)}${linha(300, -10, 260, 650)}${linha(450, -10, 420, 650)}</g>
      <g stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none">${linha(-10, 230, 540, 400)}${linha(200, -10, 380, 650)}</g>`;
  }
  /* Escala de raiz quadrada: afasta do centro os pontos muito próximos,
     para que não fiquem escondidos atrás do marcador "Você" (o mapa é esquemático;
     a distância exata aparece sempre nos cartões). */
  function projetor(f, centro, raioKm) {
    return (geo) => {
      const v = U.vetorKm(centro, geo);
      const d = Math.hypot(v.x, v.y);
      if (!d) return { x: f.cx, y: f.cy };
      const r = f.raioPx * Math.sqrt(Math.min(d, raioKm * 1.05) / raioKm);
      return { x: f.cx + (v.x / d) * r, y: f.cy - (v.y / d) * r };
    };
  }
  function marcadorVoce(x, y, { casa = true } = {}) {
    return `<circle cx="${x}" cy="${y}" r="52" fill="${c.green}" fill-opacity="0.2"></circle>
      <circle cx="${x}" cy="${y}" r="20" fill="${c.green}"></circle>
      ${casa ? `<path d="M${x - 9} ${y + 3}l9-8 9 8v8h-18z" fill="#FFFFFF"></path>` : `<circle cx="${x}" cy="${y}" r="6" fill="#FFFFFF"></circle>`}`;
  }
  function pino(p, x, y) {
    const urg = p.tipo === 'urgente', fechado = p.tipo === 'fechado';
    const fill = urg ? c.orange : fechado ? '#FFFFFF' : c.brown;
    const txt = urg || fechado ? c.brown : '#FFFFFF';
    const borda = urg || fechado ? ` stroke="${c.brown}" stroke-width="2"` : '';
    return `<g class="map-pin" data-pin="${U.esc(p.id)}" role="button" tabindex="0" aria-label="${U.esc(p.titulo || p.rotulo)}">
      <circle cx="${x}" cy="${y}" r="19" fill="${fill}"${borda}></circle><text x="${x}" y="${y + 6}" fill="${txt}">${U.esc(p.rotulo)}</text></g>`;
  }

  /* Mapa de pontos (doações por perto, pontos de distribuição) */
  function render({ centro, raioKm, pontos = [], label = '', zoom = true, legenda = [], formato = 'retrato', classe = '', voce = 'casa', descricao = '' }) {
    const f = FORMATOS[formato];
    const proj = projetor(f, centro, raioKm);
    const visiveis = pontos.filter((p) => U.distanciaKm(centro, p.geo) <= raioKm * 1.05);
    const desenhados = visiveis.map((p) => { const { x, y } = proj(p.geo); return pino(p, Math.round(x), Math.round(y)); }).join('');
    const i = C.regras.raiosMapaKm.indexOf(raioKm);
    return html`<div class="map ${classe}" data-mapa>
      ${raw(`<svg viewBox="0 0 ${f.w} ${f.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${U.esc(descricao || `Mapa com ${visiveis.length} pontos em até ${raioKm} km`)}">
        ${fundo(f)}${voce ? marcadorVoce(f.cx, f.cy, { casa: voce === 'casa' }) : ''}
        <g font-family="Inter,sans-serif" font-size="17" font-weight="800" text-anchor="middle">${desenhados}</g></svg>`)}
      ${label ? html`<div class="map__label">${label}</div>` : ''}
      ${zoom ? html`<div class="map__zoom"><button type="button" data-zoom="in" aria-label="Aproximar" ${i <= 0 ? raw('disabled') : ''}>+</button><button type="button" data-zoom="out" aria-label="Afastar" ${i >= C.regras.raiosMapaKm.length - 1 ? raw('disabled') : ''}>−</button></div>` : ''}
      ${legenda.length ? html`<div class="map__legend">${legenda.map((l) => html`<span><span class="map__dot ${l.classe}" ${l.estilo ? raw(`style="${l.estilo}"`) : ''}></span>${l.texto}</span>`)}</div>` : ''}
    </div>`;
  }
  /* Liga cliques nos pinos e no zoom */
  function ligar(raiz, { aoPino, aoZoom }) {
    raiz.querySelectorAll('[data-mapa]').forEach((m) => {
      m.addEventListener('click', (e) => {
        const z = e.target.closest('[data-zoom]');
        if (z && aoZoom) { aoZoom(z.dataset.zoom); return; }
        const p = e.target.closest('[data-pin]');
        if (p && aoPino) aoPino(p.dataset.pin);
      });
      m.addEventListener('keydown', (e) => {
        const p = e.target.closest('[data-pin]');
        if (p && aoPino && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); aoPino(p.dataset.pin); }
      });
    });
  }
  function proximoRaio(atual, direcao) {
    const l = C.regras.raiosMapaKm, i = l.indexOf(atual);
    return l[Math.max(0, Math.min(l.length - 1, i + (direcao === 'in' ? -1 : 1)))];
  }

  /* ---------- Rota de coleta e acompanhamento ---------- */
  function progressoColeta(coleta) {
    if (!coleta || !coleta.iniciadaEm) return null;
    if (coleta.concluidaEm) return { t: 1, chegou: true, minutos: 0 };
    const dur = (coleta.duracaoSeg || 120) * 1000;
    const t = Math.min(1, (Date.now() - new Date(coleta.iniciadaEm).getTime()) / dur);
    return { t, chegou: t >= 1, minutos: Math.max(0, Math.ceil(((1 - t) * dur) / 60000)) };
  }
  function pontosRota(f, a, b) {
    // Rota em "L", acompanhando as ruas: anda na horizontal e depois na vertical
    return [a, { x: b.x, y: a.y }, b];
  }
  function noPercurso(pts, t) {
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(d); total += d; }
    let alvo = t * total;
    for (let i = 0; i < seg.length; i++) {
      if (alvo <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? Math.min(1, alvo / seg[i]) : 1;
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
      }
      alvo -= seg[i];
    }
    return pts[pts.length - 1];
  }
  function rota({ origem, destino, coleta, nomeOrigem = 'Instituição', nomeDestino = 'Doador', classe = 'map--md' }) {
    const f = FORMATOS.paisagem;
    const meio = { lat: (origem.lat + destino.lat) / 2, lng: (origem.lng + destino.lng) / 2 };
    const raio = Math.max(0.6, U.distanciaKm(origem, destino) / 2 * 1.25);
    const escala = (f.w / 2 - 80) / raio;
    const proj = (g) => { const v = U.vetorKm(meio, g); return { x: f.cx + v.x * escala, y: f.cy - v.y * escala * 0.9 }; };
    const a = proj(origem), b = proj(destino);
    const pts = pontosRota(f, a, b);
    const prog = progressoColeta(coleta);
    const pos = prog ? noPercurso(pts, prog.t) : a;
    const caminho = pts.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x)} ${Math.round(p.y)}`).join('');
    const dist = U.distanciaKm(origem, destino);
    return html`<div class="map ${classe}" data-rota>
      ${raw(`<svg viewBox="0 0 ${f.w} ${f.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Rota de coleta de ${U.esc(nomeOrigem)} até ${U.esc(nomeDestino)}, ${U.distanciaLabel(dist)}">
        ${fundo(f)}
        <path d="${caminho}" fill="none" stroke="${c.brown}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12"></path>
        ${marcadorVoce(Math.round(a.x), Math.round(a.y))}
        <g><circle cx="${Math.round(b.x)}" cy="${Math.round(b.y)}" r="22" fill="${c.orange}" stroke="${c.brown}" stroke-width="2"></circle>
          <path transform="translate(${Math.round(b.x) - 11} ${Math.round(b.y) - 11}) scale(0.92)" d="${NH.ui.ICONES.store}" fill="none" stroke="${c.brown}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></g>
        ${prog ? `<g data-veiculo transform="translate(${Math.round(pos.x)} ${Math.round(pos.y)})"><circle r="17" fill="${c.brown}" stroke="#FFFFFF" stroke-width="3"></circle>
          <path transform="translate(-9 -9) scale(0.75)" d="${NH.ui.ICONES.truck}" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></g>` : ''}
      </svg>`)}
      <div class="map__label">${U.distanciaLabel(dist)} de ${nomeOrigem} até ${nomeDestino}</div>
      <div class="map__legend"><span><span class="map__dot map__dot--voce"></span>${nomeOrigem}</span><span><span class="map__dot map__dot--urgente"></span>${nomeDestino}</span>${prog ? html`<span><span class="map__dot map__dot--disp"></span>Responsável</span>` : ''}</div>
    </div>`;
  }
  /* Atualiza só a posição do veículo, sem redesenhar o mapa */
  function atualizarRota(raiz, coleta) {
    const origem = coleta && coleta.origem, destino = coleta && coleta.destino;
    const v = raiz.querySelector('[data-veiculo]');
    if (!v || !origem || !destino) return progressoColeta(coleta);
    const f = FORMATOS.paisagem;
    const meio = { lat: (origem.lat + destino.lat) / 2, lng: (origem.lng + destino.lng) / 2 };
    const raio = Math.max(0.6, U.distanciaKm(origem, destino) / 2 * 1.25);
    const escala = (f.w / 2 - 80) / raio;
    const proj = (g) => { const vv = U.vetorKm(meio, g); return { x: f.cx + vv.x * escala, y: f.cy - vv.y * escala * 0.9 }; };
    const a = proj(origem), b = proj(destino);
    const prog = progressoColeta(coleta);
    const pos = noPercurso(pontosRota(f, a, b), prog ? prog.t : 0);
    v.setAttribute('transform', `translate(${Math.round(pos.x)} ${Math.round(pos.y)})`);
    return prog;
  }

  /* ---------- Mapa de calor (painel do governo) ---------- */
  function calor({ pontos, centro, raioKm = 18, classe = '', pontosDistribuicao = [] }) {
    const W = 400, H = 260;
    const escala = (W / 2) / raioKm;
    const proj = (g) => { const v = U.vetorKm(centro, g); return { x: W / 2 + v.x * escala, y: H / 2 - v.y * escala }; };
    const blobs = pontos.map((p) => {
      const { x, y } = proj(p.geo);
      const forte = p.peso >= 0.75;
      return `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="${Math.round(45 + 40 * p.peso)}" fill="url(#${forte ? 'nh_h1' : 'nh_h2'})"></circle>`;
    }).join('');
    const insts = pontosDistribuicao.map((p) => { const { x, y } = proj(p.geo); return `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="4" fill="${c.green}" stroke="#FFFFFF" stroke-width="1.5"><title>${U.esc(p.nome)}</title></circle>`; }).join('');
    const regioes = pontos.filter((p) => p.nome).map((p) => p.nome);
    return html`<div class="heat ${classe}">
      ${raw(`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa de calor da necessidade de alimento${regioes.length ? `. Maior necessidade: ${U.esc(U.listaTexto(regioes))}` : ''}">
        <defs><radialGradient id="nh_h1"><stop offset="0" stop-color="${c.orange700}" stop-opacity="0.85"></stop><stop offset="1" stop-color="${c.orange700}" stop-opacity="0"></stop></radialGradient>
        <radialGradient id="nh_h2"><stop offset="0" stop-color="${c.orange}" stop-opacity="0.9"></stop><stop offset="1" stop-color="${c.orange}" stop-opacity="0"></stop></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="${c.sand}"></rect>
        <g stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" fill="none"><path d="M-10 70L410 110"></path><path d="M-10 180L410 150"></path><path d="M90 -10L130 270"></path><path d="M250 -10L230 270"></path></g>
        ${blobs}${insts}</svg>`)}
      <div class="heat__legend">Menos <span class="heat__scale"></span> Mais</div>
    </div>`;
  }

  NH.mapa = { render, ligar, proximoRaio, rota, atualizarRota, progressoColeta, calor };
})();
