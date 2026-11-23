/* =========================================================
   NO hunger — Utilitários compartilhados
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Eventos internos ---------- */
  const listeners = {};
  NH.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => NH.bus.off(evt, fn); },
    off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); },
    emit(evt, data) { (listeners[evt] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); }
  };

  /* ---------- HTML seguro ----------
     html`...${valor}...` escapa automaticamente todo valor interpolado.
     Use raw() apenas para HTML gerado pelo próprio sistema. */
  class SafeHtml { constructor(s) { this.s = s; } toString() { return this.s; } }
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  const esc = (s) => String(s).replace(/[&<>"'`]/g, (c) => ESC[c]);
  const raw = (s) => new SafeHtml(String(s == null ? '' : s));
  function toHtml(v) {
    if (v == null || v === false || v === true) return '';
    if (v instanceof SafeHtml) return v.s;
    if (Array.isArray(v)) return v.map(toHtml).join('');
    return esc(v);
  }
  function html(strings, ...vals) {
    let out = strings[0];
    for (let i = 0; i < vals.length; i++) out += toHtml(vals[i]) + strings[i + 1];
    return new SafeHtml(out);
  }

  /* ---------- Datas ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const DIA_MS = 86400000;
  function toDate(v) { return v instanceof Date ? v : new Date(v); }
  function isoDate(d = new Date()) { d = toDate(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function startOfDay(d = new Date()) { d = new Date(toDate(d)); d.setHours(0, 0, 0, 0); return d; }
  function addDays(d, n) { const x = new Date(toDate(d)); x.setDate(x.getDate() + n); return x; }
  function dateFromISO(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
  function diasAte(isoDia) { return Math.round((dateFromISO(isoDia) - startOfDay()) / DIA_MS); }
  function hora(s) { // '19:00' -> '19h' ; '19:30' -> '19h30'
    if (!s) return '';
    const [h, m] = s.split(':');
    return `${Number(h)}h${m && m !== '00' ? m : ''}`;
  }
  function horaDe(d) { d = toDate(d); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  function diaRelativo(isoDia) {
    const n = diasAte(isoDia);
    if (n === 0) return 'hoje';
    if (n === 1) return 'amanhã';
    if (n === -1) return 'ontem';
    return dataCurta(isoDia);
  }
  function dataCurta(v) { const d = typeof v === 'string' && v.length === 10 ? dateFromISO(v) : toDate(v); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; }
  function dataLonga(v) { const d = typeof v === 'string' && v.length === 10 ? dateFromISO(v) : toDate(v); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }
  function dataHora(v) { const d = toDate(v); return `${dataLonga(d)} às ${horaDe(d)}`; }
  function janela(j) { return j ? `${diaRelativo(j.data)}, ${hora(j.inicio)} às ${hora(j.fim)}` : 'a combinar'; }
  function tempoRelativo(v) {
    const s = Math.round((Date.now() - toDate(v)) / 1000);
    if (s < 60) return 'agora';
    if (s < 3600) return `há ${Math.floor(s / 60)} min`;
    if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
    const dias = Math.floor(s / 86400);
    return dias === 1 ? 'ontem' : dias < 7 ? `há ${dias} dias` : dataLonga(v);
  }
  function vencimentoLabel(validadeIso) {
    const n = diasAte(validadeIso);
    if (n < 0) return 'Vencido';
    if (n === 0) return 'Vence hoje';
    if (n === 1) return 'Vence em 1 dia';
    return `Vence em ${n} dias`;
  }
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  /* ---------- Números ---------- */
  const nf = (min = 0, max = 0) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
  const num = (n, casas = 0) => nf(0, casas).format(n || 0);
  const dinheiro = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
  function dinheiroCurto(n) {
    if (n >= 1e6) return `R$ ${nf(1, 1).format(n / 1e6)} mi`;
    if (n >= 1e3) return `R$ ${num(n / 1e3, 1)} mil`;
    return dinheiro(n);
  }
  function numCurto(n) {
    if (n >= 1e6) return `${num(n / 1e6, 1)} mi`;
    if (n >= 1e4) return `${num(Math.round(n / 1000))} mil`;
    return num(n);
  }
  function quantidade(q, unidadeId) {
    const u = NH.config.unidades.find((x) => x.id === unidadeId);
    return `${num(q, 1)} ${u ? u.curto : unidadeId}`;
  }
  function pesoKg(item) { return (Number(item.quantidade) || 0) * (NH.config.pesoPorUnidadeKg[item.unidade] || 1); }
  function kg(n) { return n >= 1000 ? `${num(n / 1000, 1)} t` : `${num(n, n < 10 ? 1 : 0)} kg`; }

  /* ---------- Geografia ---------- */
  function distanciaKm(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function distanciaLabel(km) {
    if (!isFinite(km)) return '';
    return km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)} m` : `${num(km, 1)} km`;
  }
  /* Desloca um ponto em km (leste, norte) */
  function deslocar(p, lesteKm, norteKm) {
    return { lat: p.lat + norteKm / 110.574, lng: p.lng + lesteKm / (111.32 * Math.cos(p.lat * Math.PI / 180)) };
  }
  /* Vetor em km de a até b (leste, norte) */
  function vetorKm(a, b) {
    return { x: (b.lng - a.lng) * 111.32 * Math.cos(a.lat * Math.PI / 180), y: (b.lat - a.lat) * 110.574 };
  }

  /* ---------- Texto e identificação ---------- */
  function uid(prefixo = 'id') { return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }
  function iniciais(nome) {
    const p = String(nome || '').replace(/\b(de|da|do|das|dos|e)\b/gi, ' ').trim().split(/\s+/).filter(Boolean);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }
  const soDigitos = (s) => String(s || '').replace(/\D/g, '');
  function formatarTelefone(s) {
    const d = soDigitos(s).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  function mascararTelefone(s) { const d = soDigitos(s); return d.length >= 4 ? `(${d.slice(0, 2)}) *****-${d.slice(-4)}` : '—'; }
  function formatarCNPJ(s) {
    const d = soDigitos(s).slice(0, 14);
    return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  function cnpjValido(s) {
    const c = soDigitos(s);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (len) => {
      const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const soma = pesos.reduce((acc, p, i) => acc + Number(c[i]) * p, 0);
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
  }
  function formatarCEP(s) { const d = soDigitos(s).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; }
  const emailValido = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  function plural(n, um, varios) { return `${num(n)} ${n === 1 ? um : varios}`; }
  function listaTexto(itens) {
    if (itens.length <= 1) return itens.join('');
    return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
  }

  /* ---------- Segurança (demonstração) ----------
     No backend real a senha nunca sai do servidor em texto: use bcrypt/argon2. */
  async function hashSenha(senha) {
    const texto = `nohunger:${senha}`;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0; for (let i = 0; i < texto.length; i++) { h = (h << 5) - h + texto.charCodeAt(i); h |= 0; }
    return `fallback${h}`;
  }

  /* ---------- Arquivos ---------- */
  function lerArquivo(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      r.readAsDataURL(file);
    });
  }
  /* Reduz fotos antes de guardar (economiza espaço e dados móveis) */
  async function reduzirImagem(file, maxPx = NH.config.regras.tamanhoMaxFotoPx, qualidade = 0.78) {
    const dataUrl = await lerArquivo(file);
    const img = await new Promise((resolve, reject) => {
      const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('Imagem inválida.')); i.src = dataUrl;
    });
    const escala = Math.min(1, maxPx / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', qualidade);
  }
  function baixar(nome, conteudo, tipo = 'text/plain;charset=utf-8') {
    const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  /* CSV com ";" e BOM, para abrir corretamente no Excel em português */
  function csv(linhas, colunas) {
    const cel = (v) => {
      const s = v == null ? '' : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cab = colunas.map((c) => cel(c.label)).join(';');
    const corpo = linhas.map((l) => colunas.map((c) => cel(typeof c.valor === 'function' ? c.valor(l) : l[c.valor])).join(';'));
    return '﻿' + [cab, ...corpo].join('\r\n');
  }

  /* ---------- Diversos ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function query() { return Object.fromEntries(new URLSearchParams(location.search)); }
  function somar(lista, fn) { return lista.reduce((acc, x) => acc + (Number(fn(x)) || 0), 0); }
  function agrupar(lista, fn) { return lista.reduce((acc, x) => { const k = fn(x); (acc[k] = acc[k] || []).push(x); return acc; }, {}); }
  function categoriaLabel(id) { return (NH.config.categorias.find((c) => c.id === id) || { label: id }).label; }
  function aberto(horario, quando = new Date()) {
    if (!horario || !horario.dias) return false;
    const agora = horaDe(quando);
    return horario.dias.includes(quando.getDay()) && agora >= horario.abre && agora < horario.fecha;
  }
  function proximaAbertura(horario, quando = new Date()) {
    if (!horario || !horario.dias || !horario.dias.length) return null;
    for (let i = 0; i < 8; i++) {
      const d = addDays(quando, i);
      if (!horario.dias.includes(d.getDay())) continue;
      if (i === 0 && horaDe(quando) >= horario.abre) continue;
      return { dia: isoDate(d), hora: horario.abre };
    }
    return null;
  }
  function horarioTexto(horario) {
    if (!horario || !horario.dias || !horario.dias.length) return 'Horário não informado';
    const d = horario.dias.slice().sort();
    const nomes = NH.config.diasSemana;
    const seq = d.length > 2 && d.every((x, i) => i === 0 || x === d[i - 1] + 1);
    const dias = seq ? `${nomes[d[0]]} a ${nomes[d[d.length - 1]]}` : d.map((x) => nomes[x]).join(', ');
    return `${dias}, ${hora(horario.abre)} às ${hora(horario.fecha)}`;
  }

  NH.utils = {
    html, raw, esc, SafeHtml,
    isoDate, startOfDay, addDays, dateFromISO, diasAte, hora, horaDe, diaRelativo, dataCurta, dataLonga, dataHora,
    janela, tempoRelativo, vencimentoLabel, MESES, DIA_MS,
    num, dinheiro, dinheiroCurto, numCurto, quantidade, pesoKg, kg,
    distanciaKm, distanciaLabel, deslocar, vetorKm,
    uid, iniciais, soDigitos, formatarTelefone, mascararTelefone, formatarCNPJ, cnpjValido, formatarCEP, emailValido, plural, listaTexto,
    hashSenha, lerArquivo, reduzirImagem, baixar, csv,
    sleep, clone, debounce, query, somar, agrupar, categoriaLabel, aberto, proximaAbertura, horarioTexto
  };
})();
