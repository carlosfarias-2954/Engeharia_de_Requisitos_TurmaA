/* =========================================================
   NO hunger — Componentes de interface reutilizáveis
   Geram o mesmo HTML/classes das interfaces originais.
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils;
  const { html, raw } = U;

  /* ---------- Ícones (traço 2px, mesmos do design) ---------- */
  const ICONES = {
    home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
    plus: 'M12 5v14M5 12h14',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    hist: 'M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 3v5h-5',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8',
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    star: 'M12 2l3 7 7 .6-5.3 4.6 1.6 7L12 17.8 5.7 21.2l1.6-7L2 9.6 9 9z',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
    map: 'M9 3L3 5v16l6-2 6 2 6-2V3l-6 2zM9 3v16M15 5v16',
    check: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4L12 14l-3-3',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    chart: 'M18 20V10M12 20V4M6 20v-6',
    coin: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v12M9 9.5a2.5 2 0 0 1 2.5-1.5h1a2.5 2 0 0 1 0 4h-2a2.5 2 0 0 0 0 4h1a2.5 2 0 0 0 2.5-1.5',
    data: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
    camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    x: 'M18 6L6 18M6 6l12 12',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
    pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    back: 'M19 12H5M12 19l-7-7 7-7',
    menu: 'M3 12h18M3 6h18M3 18h18',
    repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
    alert: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    store: 'M3 9l1-5h16l1 5M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0',
    building: 'M3 21h18M5 21V10M19 21V10M9 21v-6h6v6M2 10l10-7 10 7',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
    printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z'
  };
  function icone(nome, { tam = 22, cor = 'currentColor', traco = 2, cls = '', estilo = '' } = {}) {
    return raw(`<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="${traco}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${cls ? ` class="${cls}"` : ''}${estilo ? ` style="${estilo}"` : ''}><path d="${ICONES[nome] || ICONES.help}"></path></svg>`);
  }
  /* Marca do No Hunger (coração com garfo e folha) */
  function marca(tam = 44) {
    const c = C.cores;
    return raw(`<svg width="${tam}" height="${tam}" viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M24 42C10 31 6 23 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 6-4 14-18 25z" stroke="${c.orange}" stroke-width="3"></path><path d="M20 15v9M24 15v9M28 15v9M20 24h8M24 24v9" stroke="${c.orange}" stroke-width="3"></path><path d="M32 32c6-1 9-5 9-10-6 0-9 4-9 10z" fill="${c.green}" stroke="none"></path></svg>`);
  }

  /* ---------- Status ---------- */
  function tag(status, { tam = '' } = {}) {
    const s = C.status[status] || { label: status };
    const cls = ['cancelada', 'expirada'].includes(status) ? 'neutra' : status;
    return html`<span class="tag tag--${cls}${tam ? ` tag--${tam}` : ''}">${s.label}</span>`;
  }
  function tagPedido(status) {
    const s = C.statusPedido[status] || { label: status, tag: 'neutra' };
    return html`<span class="tag tag--${s.tag}">${s.label}</span>`;
  }
  function tagValidade(validade, { tam = 'sm' } = {}) {
    const n = U.diasAte(validade);
    return html`<span class="tag tag--${tam} ${n <= 0 ? 'tag--aviso' : 'tag--neutra'}">${U.vencimentoLabel(validade)}</span>`;
  }
  function etapas(status) {
    const etapa = (C.status[status] || {}).etapa || 0;
    const nomes = ['Publicada', 'Reservada', 'Coletada', 'Entregue'];
    const texto = etapa ? `Etapa ${etapa} de 4: ${nomes[etapa - 1]}` : `Situação: ${C.status[status].label}`;
    return html`<div class="stepper" role="img" aria-label="${texto}">
      ${nomes.map((_, i) => html`<div class="stepper__bar${i < etapa ? ' is-done' : ''}"></div>`)}
      ${nomes.map((n) => html`<div class="stepper__label" aria-hidden="true">${n}</div>`)}
    </div>`;
  }

  /* ---------- Avaliação ---------- */
  function estrelas(nota, tam = 18) {
    const n = Math.round(nota || 0);
    const c = C.cores;
    return html`<span class="stars" role="img" aria-label="${nota ? `${U.num(nota, 1)} de 5 estrelas` : 'Sem avaliações'}">${[1, 2, 3, 4, 5].map((i) =>
      raw(`<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONES.star}" fill="${i <= n ? c.orange : 'none'}" stroke="${i <= n ? c.brown : c.line}" stroke-width="1.6" stroke-linejoin="round"></path></svg>`))}</span>`;
  }
  function entradaEstrelas(nome = 'nota', valor = 0) {
    return html`<fieldset class="fieldset field" data-campo="${nome}"><legend>Sua nota</legend><div class="star-input">${[1, 2, 3, 4, 5].map((i) => html`
      <label title="${i} ${i === 1 ? 'estrela' : 'estrelas'}"><input type="radio" name="${nome}" value="${i}" ${i === valor ? raw('checked') : ''}><span class="sr-only">${i} ${i === 1 ? 'estrela' : 'estrelas'}</span>${raw(`<svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true" data-estrela="${i}"><path d="${ICONES.star}" fill="${i <= valor ? C.cores.orange : 'none'}" stroke="${C.cores.brown}" stroke-width="1.4" stroke-linejoin="round"></path></svg>`)}</label>`)}</div></fieldset>`;
  }
  function ligarEstrelas(raiz) {
    raiz.querySelectorAll('.star-input').forEach((grupo) => {
      const pintar = () => {
        const v = Number((grupo.querySelector('input:checked') || {}).value || 0);
        grupo.querySelectorAll('[data-estrela] path').forEach((p, i) => p.setAttribute('fill', i < v ? C.cores.orange : 'none'));
      };
      grupo.addEventListener('change', pintar);
    });
  }

  /* ---------- Outros blocos ---------- */
  const avatar = (nome) => html`<div class="avatar" aria-hidden="true">${U.iniciais(nome)}</div>`;
  function vazio(titulo, texto = '', acao = '') {
    return html`<div class="empty"><div class="empty__title">${titulo}</div>${texto ? html`<div>${texto}</div>` : ''}${acao}</div>`;
  }
  const carregando = () => html`<div class="empty empty--plain" role="status">Carregando…</div>`;
  function alerta(titulo, texto, { icone: ic = 'bell', tipo = '' } = {}) {
    return html`<div class="alert${tipo ? ` alert--${tipo}` : ''}" role="status">${icone(ic, { tam: 24, cls: 'alert__icon' })}<div><div class="alert__title">${titulo}</div>${texto ? html`<div class="alert__text">${texto}</div>` : ''}</div></div>`;
  }

  /* ---------- Campos de formulário ---------- */
  let seqCampo = 0;
  function campo({ label, name, tipo = 'text', valor = '', obrigatorio = false, dica = '', opcoes = null, placeholder = '', attrs = '', classe = '', classeInput = '', opcional = false, linhas = 0 }) {
    const id = `f_${name.replace(/\W/g, '_')}_${++seqCampo}`;
    const idDica = dica ? `${id}_dica` : '';
    const comuns = raw(`id="${id}" name="${U.esc(name)}"${obrigatorio ? ' required' : ''}${idDica ? ` aria-describedby="${idDica}"` : ''} ${attrs}`);
    let controle;
    if (opcoes) {
      controle = html`<select class="input ${classeInput}" ${comuns}>${placeholder ? html`<option value="">${placeholder}</option>` : ''}${opcoes.map((o) => {
        const v = typeof o === 'object' ? o.id : o, l = typeof o === 'object' ? o.label : o;
        return html`<option value="${v}" ${String(v) === String(valor) ? raw('selected') : ''}>${l}</option>`;
      })}</select>`;
    } else if (tipo === 'textarea') {
      controle = html`<textarea class="input ${classeInput}" ${comuns} placeholder="${placeholder}"${linhas ? raw(` rows="${linhas}"`) : ''}>${valor}</textarea>`;
    } else {
      controle = html`<input class="input ${classeInput}" type="${tipo}" value="${valor}" placeholder="${placeholder}" ${comuns}>`;
    }
    return html`<div class="field ${classe}" data-campo="${name}">
      <label class="field__label" for="${id}">${label}${opcional ? html` <small>(opcional)</small>` : ''}</label>
      ${controle}
      ${dica ? html`<div class="field__hint" id="${idDica}">${dica}</div>` : ''}
    </div>`;
  }
  function checkbox({ label, name, valor = 'on', marcado = false, attrs = '' }) {
    return html`<label class="check"><input type="checkbox" name="${name}" value="${valor}" ${marcado ? raw('checked') : ''} ${raw(attrs)}><span>${label}</span></label>`;
  }
  function chipsEscolha({ legenda, name, opcoes, valores = [], tipo = 'checkbox' }) {
    return html`<fieldset class="fieldset field" data-campo="${name}"><legend>${legenda}</legend><div class="chips">${opcoes.map((o) => html`
      <label class="chip"><input type="${tipo}" name="${name}" value="${o.id}" ${valores.map(String).includes(String(o.id)) ? raw('checked') : ''}>${o.label}</label>`)}</div></fieldset>`;
  }

  /* Lê o formulário em objeto. "janela.data" vira { janela: { data } }; nomes terminados em [] viram listas. */
  function lerForm(form) {
    const out = {};
    const definir = (caminho, v) => {
      const partes = caminho.split('.');
      let o = out;
      partes.slice(0, -1).forEach((p) => { o[p] = o[p] || {}; o = o[p]; });
      o[partes[partes.length - 1]] = v;
    };
    const obter = (caminho) => caminho.split('.').reduce((o, p) => (o ? o[p] : undefined), out);
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.disabled || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
      if (el.name.endsWith('[]')) {
        const nome = el.name.slice(0, -2);
        if (obter(nome) === undefined) definir(nome, []);
        if (el.checked || (el.type !== 'checkbox' && el.type !== 'radio')) obter(nome).push(el.value);
        return;
      }
      if (el.type === 'checkbox') { definir(el.name, el.checked); return; }
      if (el.type === 'radio') { if (el.checked) definir(el.name, el.value); else if (obter(el.name) === undefined) definir(el.name, null); return; }
      definir(el.name, el.value);
    });
    return out;
  }
  function limparErros(form) {
    form.querySelectorAll('.field--error').forEach((f) => f.classList.remove('field--error'));
    form.querySelectorAll('.field__error').forEach((e) => e.remove());
    form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  }
  function mostrarErro(form, err) {
    const msg = (err && err.message) || 'Algo deu errado. Tente de novo.';
    const campoEl = err && err.campo && form ? form.querySelector(`[data-campo="${CSS.escape(err.campo)}"]`) : null;
    if (!campoEl) { toast(msg, 'aviso'); return; }
    campoEl.classList.add('field--error');
    const idErro = `erro_${Math.random().toString(36).slice(2, 8)}`;
    campoEl.insertAdjacentHTML('beforeend', `<div class="field__error" id="${idErro}" role="alert">${icone('alert', { tam: 18 })}<span>${U.esc(msg)}</span></div>`);
    const ctrl = campoEl.querySelector('input:not([type=hidden]), select, textarea');
    if (ctrl) { ctrl.setAttribute('aria-invalid', 'true'); ctrl.setAttribute('aria-describedby', `${ctrl.getAttribute('aria-describedby') || ''} ${idErro}`.trim()); ctrl.focus(); }
    campoEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  /* Envio com proteção contra clique duplo e exibição de erros no campo certo */
  function aoEnviar(form, fn) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.dataset.enviando) return;
      limparErros(form);
      const botoes = form.querySelectorAll('button[type=submit]');
      form.dataset.enviando = '1';
      botoes.forEach((b) => { b.disabled = true; b.setAttribute('aria-busy', 'true'); });
      try { await fn(lerForm(form), form, e.submitter); } catch (err) { console.warn(err); mostrarErro(form, err); } finally {
        delete form.dataset.enviando;
        botoes.forEach((b) => { b.disabled = false; b.removeAttribute('aria-busy'); });
      }
    });
  }
  async function executar(botao, fn) {
    if (botao && botao.disabled) return;
    if (botao) { botao.disabled = true; botao.setAttribute('aria-busy', 'true'); }
    try { return await fn(); } catch (err) { console.warn(err); toast(err.message || 'Algo deu errado.', 'aviso'); return undefined; } finally {
      if (botao && botao.isConnected) { botao.disabled = false; botao.removeAttribute('aria-busy'); }
    }
  }
  /* Delegação de eventos: data-acao="nome" */
  function delegar(raiz, mapa) {
    raiz.addEventListener('click', (e) => {
      const alvo = e.target.closest('[data-acao]');
      if (!alvo || !raiz.contains(alvo)) return;
      const fn = mapa[alvo.dataset.acao];
      if (fn) { e.preventDefault(); fn(alvo, e); }
    });
  }

  /* ---------- Avisos rápidos (lidos por leitores de tela) ---------- */
  let caixaToasts = null;
  function toast(msg, tipo = 'ok', ms = 4200) {
    if (!caixaToasts) {
      caixaToasts = document.createElement('div');
      caixaToasts.className = 'toasts'; caixaToasts.setAttribute('role', 'status'); caixaToasts.setAttribute('aria-live', 'polite');
      document.body.appendChild(caixaToasts);
    }
    const t = document.createElement('div');
    t.className = `toast${tipo === 'ok' ? ' toast--ok' : ''}`;
    t.textContent = msg;
    caixaToasts.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  /* ---------- Modal acessível ---------- */
  function modal({ titulo, sub = '', corpo = '', grande = false, aoMontar = null, rotulo = '' }) {
    return new Promise((resolve) => {
      const anterior = document.activeElement;
      const fundo = document.createElement('div');
      fundo.className = 'modal-backdrop';
      const idT = `mt_${Math.random().toString(36).slice(2, 8)}`;
      fundo.innerHTML = String(html`<div class="modal${grande ? ' modal--lg' : ''}" role="dialog" aria-modal="true" aria-labelledby="${idT}" ${rotulo ? raw(`aria-label="${U.esc(rotulo)}"`) : ''}>
        <div class="modal__head"><div><h2 class="modal__title" id="${idT}" tabindex="-1">${titulo}</h2>${sub ? html`<p class="modal__sub">${sub}</p>` : ''}</div>
          <button type="button" class="icon-btn icon-btn--sm" data-fechar aria-label="Fechar">${icone('x')}</button></div>
        <div class="modal__body col gap-16">${corpo}</div></div>`);
      document.body.appendChild(fundo);
      document.body.style.overflow = 'hidden';
      const caixa = fundo.querySelector('.modal');
      let fechado = false;
      const fechar = (valor = null) => {
        if (fechado) return; fechado = true;
        fundo.remove(); document.body.style.overflow = '';
        document.removeEventListener('keydown', teclas, true);
        if (anterior && anterior.focus && anterior.isConnected) anterior.focus();
        resolve(valor);
      };
      const teclas = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); fechar(null); }
        if (e.key === 'Tab') {
          const foc = Array.from(caixa.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter((x) => x.offsetParent !== null);
          if (!foc.length) return;
          const prim = foc[0], ult = foc[foc.length - 1];
          if (e.shiftKey && document.activeElement === prim) { e.preventDefault(); ult.focus(); } else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); prim.focus(); }
        }
      };
      document.addEventListener('keydown', teclas, true);
      fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(null); });
      fundo.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => fechar(null)));
      ligarEstrelas(caixa);
      if (aoMontar) aoMontar(caixa, fechar);
      const foco = caixa.querySelector('[autofocus]') || caixa.querySelector('.modal__title');
      setTimeout(() => foco && foco.focus(), 20);
    });
  }
  function confirmar({ titulo, texto = '', ok = 'Confirmar', cancelar = 'Voltar', classeOk = 'btn-primary' }) {
    return modal({
      titulo, corpo: html`${texto ? html`<p class="auth-text">${texto}</p>` : ''}<div class="modal__actions">
        <button type="button" class="btn btn-outline" data-fechar>${cancelar}</button>
        <button type="button" class="btn ${classeOk}" data-ok autofocus>${ok}</button></div>`,
      aoMontar: (el, fechar) => el.querySelector('[data-ok]').addEventListener('click', () => fechar(true))
    }).then(Boolean);
  }
  /* Modal com formulário: onSubmit(dados) deve retornar um valor para fechar */
  function modalForm({ titulo, sub, campos, ok = 'Salvar', cancelar = 'Cancelar', classeOk = 'btn-primary', grande, aoEnviar: fn, aoMontar: extra }) {
    return modal({
      titulo, sub, grande,
      corpo: html`<form class="form" novalidate>${campos}<div class="modal__actions"><button type="button" class="btn btn-outline" data-fechar>${cancelar}</button>
        <button type="submit" class="btn ${classeOk}">${ok}</button></div></form>`,
      aoMontar: (el, fechar) => {
        const form = el.querySelector('form');
        aoEnviar(form, async (dados) => { const r = await fn(dados, form); if (r !== undefined && r !== false) fechar(r); });
        if (extra) extra(el, fechar);
      }
    });
  }
  function pedirMotivo({ titulo, texto, label = 'Motivo', ok = 'Confirmar', minimo = 5 }) {
    return modalForm({
      titulo, sub: texto, ok,
      campos: campo({ label, name: 'motivo', tipo: 'textarea', obrigatorio: true, attrs: `minlength="${minimo}" autofocus` }),
      aoEnviar: async ({ motivo }) => {
        if (!motivo || motivo.trim().length < minimo) throw new NH.api.ApiError(`Escreva pelo menos ${minimo} letras.`, 'validacao', 422, 'motivo');
        return motivo.trim();
      }
    });
  }

  /* ---------- Menu suspenso ---------- */
  let popAberto = null;
  function popover(ancora, conteudo, { aoMontar, largura } = {}) {
    if (popAberto) { const mesmo = popAberto.ancora === ancora; popAberto.fechar(); if (mesmo) return null; }
    const pop = document.createElement('div');
    pop.className = 'popover';
    if (largura) pop.style.width = largura;
    pop.innerHTML = String(conteudo);
    document.body.appendChild(pop);
    const r = ancora.getBoundingClientRect();
    const w = pop.offsetWidth;
    pop.style.top = `${window.scrollY + r.bottom + 8}px`;
    pop.style.left = `${Math.max(12, Math.min(window.scrollX + r.right - w, window.scrollX + document.documentElement.clientWidth - w - 12))}px`;
    ancora.setAttribute('aria-expanded', 'true');
    const fechar = () => {
      pop.remove(); ancora.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', fora, true); document.removeEventListener('keydown', tecla, true);
      popAberto = null;
    };
    const fora = (e) => { if (!pop.contains(e.target) && !ancora.contains(e.target)) fechar(); };
    const tecla = (e) => { if (e.key === 'Escape') { fechar(); ancora.focus(); } };
    document.addEventListener('mousedown', fora, true); document.addEventListener('keydown', tecla, true);
    popAberto = { ancora, fechar, el: pop };
    if (aoMontar) aoMontar(pop, fechar);
    const prim = pop.querySelector('button, a[href]');
    if (prim) prim.focus();
    return popAberto;
  }
  function fecharPopover() { if (popAberto) popAberto.fechar(); }

  /* ---------- Gráfico de barras (mesmo do painel do governo) ---------- */
  function barras(serie, { rotulo, formatar = (v) => U.num(v), altura = 230, destacarUltima = true } = {}) {
    const max = Math.max(1, ...serie.map((s) => s.valor));
    const util = altura - 40;
    return html`<div class="bars" style="height:${altura}px" role="img" aria-label="${rotulo || ''}">
      ${serie.map((s, i) => html`<div class="bars__col"><div class="bars__v">${formatar(s.valor)}</div><div class="bars__bar${destacarUltima && i === serie.length - 1 ? ' is-last' : ''}" style="height:${Math.round((s.valor / max) * util)}px"></div></div>`)}
    </div><div class="bars__labels" aria-hidden="true">${serie.map((s) => html`<div>${s.label}</div>`)}</div>`;
  }

  NH.ui = {
    html, raw, icone, marca, ICONES, tag, tagPedido, tagValidade, etapas, estrelas, entradaEstrelas, ligarEstrelas, avatar, vazio, carregando, alerta,
    campo, checkbox, chipsEscolha, lerForm, limparErros, mostrarErro, aoEnviar, executar, delegar, toast,
    modal, confirmar, modalForm, pedirMotivo, popover, fecharPopover, barras
  };
})();
