/* =========================================================
   NO hunger — Estrutura do aplicativo
   Menu lateral (web) ou barra inferior (celular), cabeçalho,
   rotas por hash (#/inicio), notificações, menu do usuário e
   atualização automática quando os dados mudam.
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui;
  const { html, raw } = U;

  const estado = { cfg: null, eu: null, contadores: {}, rotaAtual: null, viewAtual: null, seq: 0, pendente: false, ultimaNotif: null };

  /* ---------- Rotas ---------- */
  function compilar(rotas) {
    return Object.entries(rotas).map(([padrao, view]) => {
      const nomes = [];
      const re = new RegExp(`^${padrao.replace(/:(\w+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; })}$`);
      return { padrao, view, re, nomes };
    });
  }
  function rotaDoHash() {
    const h = location.hash.replace(/^#/, '') || estado.cfg.padrao;
    const [caminho, qs] = h.split('?');
    for (const r of estado.rotas) {
      const m = caminho.match(r.re);
      if (m) return { ...r, caminho, params: Object.fromEntries(r.nomes.map((n, i) => [n, decodeURIComponent(m[i + 1])])), query: Object.fromEntries(new URLSearchParams(qs || '')) };
    }
    return null;
  }
  function navegar(hash) { if (location.hash === hash) renderizar(); else location.hash = hash; }
  function irPara(link) {
    if (!link) return;
    const [pagina, hash] = link.split('#');
    const atual = location.pathname.split('/').pop() || 'index.html';
    if (!pagina || pagina === atual) navegar(`#${hash || ''}`);
    else location.href = link;
  }

  /* ---------- Cabeçalho ---------- */
  function sino(qtd) {
    return html`<button type="button" class="icon-btn" data-notificacoes aria-haspopup="true" aria-expanded="false" aria-label="${qtd ? `Notificações, ${qtd} ${qtd === 1 ? 'nova' : 'novas'}` : 'Notificações'}">
      ${ui.icone('bell', { cor: C.cores.brown })}<span class="count-badge" data-contador="notificacoes" ${qtd ? '' : raw('hidden')}>${qtd}</span></button>`;
  }
  function pilulaUsuario(eu) {
    const p = C.perfis[eu.perfil];
    const papel = eu.status === 'aprovado' ? p.papel : eu.status === 'reprovado' ? 'Cadastro com pendências' : p.papelPendente;
    return html`<button type="button" class="user-pill" data-menu-usuario aria-haspopup="true" aria-expanded="false" aria-label="Menu da conta: ${eu.nome}">
      ${ui.avatar(eu.nomeCurto || eu.nome)}<div class="user-pill__text"><div class="user-pill__name">${eu.nomeCurto || eu.nome}</div><div class="user-pill__role">${papel}</div></div></button>`;
  }
  function cabecalho(view) {
    const eu = estado.eu;
    const acoesPadrao = estado.cfg.cabecalho === 'governo' ? '' : html`${sino(estado.contadores.notificacoes || 0)}${pilulaUsuario(eu)}`;
    return html`<header class="page-header">
      <div>${view.voltar ? html`<a class="back-link" href="${view.voltar.href}">${ui.icone('back', { tam: 18 })}${view.voltar.label}</a>` : ''}
        <h1 class="page-title" tabindex="-1">${view.titulo}</h1>${view.subtitulo ? html`<p class="page-subtitle">${view.subtitulo}</p>` : ''}</div>
      <div class="header-actions">${view.acoes || ''}${acoesPadrao}</div>
    </header>`;
  }
  function avisoCadastro(eu) {
    if (!['doador', 'instituicao'].includes(eu.perfil) || eu.status === 'aprovado') return '';
    if (eu.status === 'reprovado') {
      return html`<div class="alert" role="status">${ui.icone('alert', { tam: 24, cls: 'alert__icon' })}<div class="col gap-6"><div class="alert__title">Seu cadastro precisa de ajustes</div>
        <div class="alert__text">${eu.motivoReprovacao || 'Confira os dados e documentos.'}</div><a class="link" href="#/perfil">Corrigir e reenviar para análise</a></div></div>`;
    }
    if (eu.status === 'suspenso') return ui.alerta('Cadastro suspenso', eu.motivoReprovacao || 'Fale com a Central de ajuda.', { icone: 'alert' });
    return ui.alerta('Cadastro em análise', `O governo está conferindo seus documentos. Enquanto isso, você pode conhecer o sistema; ${eu.perfil === 'doador' ? 'publicar doações' : 'reservar doações'} fica liberado após a aprovação.`, { icone: 'clock' });
  }

  /* ---------- Molduras ---------- */
  function molduraWeb() {
    const { cfg, eu } = estado;
    const navItens = cfg.nav.map((n) => html`<a class="nav-link" href="#${n.rota}" data-nav="${n.id}">
      ${ui.icone(n.icone)}<span class="nav-link__label">${n.label}</span><span class="nav-badge" data-badge="${n.id}" hidden></span></a>`);
    const rodape = cfg.cabecalho === 'governo'
      ? html`<div class="help-card"><div class="help-card__title">${eu.nomeCurto}</div><div class="help-card__text">${eu.cargo || ''}${eu.orgao ? html`<br>${eu.orgao}` : ''}</div>
          <a class="help-card__link" href="#/perfil">Meu perfil</a><button type="button" class="help-card__link" data-sair>Sair</button></div>`
      : html`<div class="help-card"><div class="help-card__title">Precisa de ajuda?</div><div class="help-card__text">Fale com o suporte do No Hunger, ${C.suporte.horario.split(',')[0]}.</div>
          <a class="help-card__link" href="#/ajuda">Abrir a central de ajuda</a></div>`;
    return html`<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div class="app app--${eu.perfil}">
        <aside class="sidebar" aria-label="Navegação">
          <a class="brand" href="#${cfg.padrao}" aria-label="No Hunger, início">${ui.marca(44)}<div class="brand__word">NO<br><span>hunger</span></div></a>
          <button type="button" class="sidebar__toggle" aria-expanded="false" aria-controls="menu-principal" data-toggle-menu>${ui.icone('menu', { tam: 20 })}Menu</button>
          <nav class="nav" id="menu-principal" aria-label="Menu principal">${navItens}</nav>
          ${rodape}
        </aside>
        <main class="main" id="conteudo" tabindex="-1"></main>
      </div>`;
  }
  function molduraCelular() {
    const { cfg } = estado;
    return html`<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div class="m-app">
        <header class="m-header">
          <a class="m-brand" href="#/inicio" aria-label="No Hunger, início">${ui.marca(40)}<div class="m-brand__word">NO <span>hunger</span></div></a>
          <div class="header-actions">${sino(0)}</div>
        </header>
        <main class="m-main" id="conteudo" tabindex="-1"></main>
        <nav class="m-tabs" aria-label="Menu">${cfg.nav.map((n) => html`<a class="m-tab" href="#${n.rota}" data-nav="${n.id}">
          ${ui.icone(n.icone, { tam: 24 })}${n.label}<span class="count-badge" data-badge="${n.id}" hidden></span></a>`)}</nav>
      </div>`;
  }

  /* ---------- Renderização ---------- */
  function ocupado() {
    if (document.querySelector('.modal-backdrop, .popover')) return true;
    const main = document.getElementById('conteudo');
    const a = document.activeElement;
    return !!(main && a && main.contains(a) && a.matches('input, textarea, select'));
  }
  async function renderizar({ silencioso = false } = {}) {
    const main = document.getElementById('conteudo');
    const rota = rotaDoHash();
    if (!rota) { navegar(`#${estado.cfg.padrao}`); return; }
    const token = ++estado.seq;
    const mudouRota = !estado.rotaAtual || estado.rotaAtual.caminho !== rota.caminho;
    if (mudouRota && !silencioso) main.innerHTML = String(ui.carregando());
    let view;
    try {
      view = await rota.view({ params: rota.params, query: rota.query, eu: estado.eu, contadores: estado.contadores, app: NH.app });
    } catch (err) {
      console.error(err);
      if (err && err.codigo === 'nao_autenticado') { sairPara(); return; }
      view = { titulo: 'Não foi possível abrir esta página', corpo: html`<div class="card">${ui.vazio(err.message || 'Erro inesperado.', '', html`<a class="btn btn-primary" href="#${estado.cfg.padrao}">Voltar ao início</a>`)}</div>` };
    }
    if (token !== estado.seq) return;
    const scroll = window.scrollY;
    if (estado.viewAtual && estado.viewAtual.desmontar) { try { estado.viewAtual.desmontar(); } catch (e) { console.error(e); } }
    estado.rotaAtual = rota; estado.viewAtual = view;
    const celular = estado.cfg.layout === 'celular';
    const tituloCelular = view.semTitulo ? '' : html`<div>${view.voltar ? html`<a class="back-link" href="${view.voltar.href}">${ui.icone('back', { tam: 18 })}${view.voltar.label}</a>` : ''}
      <h1 class="m-title" tabindex="-1">${view.titulo}</h1>${view.subtitulo ? html`<p class="spot__info" style="margin-top:4px">${view.subtitulo}</p>` : ''}</div>`;
    /* Cada tela é montada num contêiner novo (display: contents), para que os
       eventos da tela anterior sejam descartados junto com ela. */
    const vista = document.createElement('div');
    vista.className = 'view';
    vista.innerHTML = String(html`
      ${celular ? tituloCelular : cabecalho(view)}
      ${view.semAviso ? '' : avisoCadastro(estado.eu)}
      ${view.corpo}
      ${C.demo.ativo && !celular ? html`<div class="demo-note">Dados de exemplo para demonstração.</div>` : ''}`);
    main.replaceChildren(vista);
    document.title = `${view.tituloAba || view.titulo} · No Hunger`;
    marcarNav(view.nav || rota.padrao.split('/')[1]);
    ligarCabecalho(vista);
    ui.ligarEstrelas(vista);
    if (view.montar) { try { view.montar(vista, { params: rota.params, query: rota.query, eu: estado.eu, recarregar: () => renderizar({ silencioso: true }) }); } catch (e) { console.error(e); } }
    if (mudouRota && !silencioso) {
      window.scrollTo(0, 0);
      const h1 = vista.querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    } else {
      window.scrollTo(0, scroll);
    }
    fecharMenuCelular();
  }
  function marcarNav(id) {
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const ativo = a.dataset.nav === id;
      a.classList.toggle('is-active', ativo);
      if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function fecharMenuCelular() {
    const sb = document.querySelector('.sidebar');
    if (sb && sb.classList.contains('is-open')) {
      sb.classList.remove('is-open');
      const t = sb.querySelector('[data-toggle-menu]'); if (t) t.setAttribute('aria-expanded', 'false');
    }
  }

  /* ---------- Contadores (badges) ---------- */
  async function atualizarContadores() {
    try {
      const c = await NH.api.painel.contadores();
      const antes = estado.contadores.notificacoes || 0;
      estado.contadores = c;
      estado.cfg.nav.forEach((n) => {
        const v = n.contador ? n.contador(c) : 0;
        document.querySelectorAll(`[data-badge="${n.id}"]`).forEach((b) => { b.textContent = v; b.hidden = !v; });
      });
      document.querySelectorAll('[data-contador="notificacoes"]').forEach((b) => { b.textContent = c.notificacoes; b.hidden = !c.notificacoes; });
      document.querySelectorAll('[data-notificacoes]').forEach((b) => b.setAttribute('aria-label', c.notificacoes ? `Notificações, ${c.notificacoes} ${c.notificacoes === 1 ? 'nova' : 'novas'}` : 'Notificações'));
      if (c.notificacoes > antes) avisarNavegador();
    } catch (e) { if (e && e.codigo === 'nao_autenticado') sairPara(); }
  }
  /* Notificação do sistema operacional (se o usuário permitiu no perfil) */
  async function avisarNavegador() {
    if (!estado.eu || !estado.eu.notificacoesNavegador || !('Notification' in window) || Notification.permission !== 'granted') return;
    const { itens } = await NH.api.notificacoes.listar({ limite: 1 });
    const n = itens[0];
    if (!n || n.lida || n.id === estado.ultimaNotif || document.hasFocus()) return;
    estado.ultimaNotif = n.id;
    try { const no = new Notification(n.titulo, { body: n.texto, tag: n.id }); no.onclick = () => { window.focus(); irPara(n.link); }; } catch (e) { /* ignora */ }
  }

  /* ---------- Painel de notificações e menu do usuário ---------- */
  async function abrirNotificacoes(botao) {
    const { itens, naoLidas } = await NH.api.notificacoes.listar({ limite: 30 });
    ui.popover(botao, html`<div class="notif-panel" role="region" aria-label="Notificações">
      <div class="notif-panel__head"><div class="notif-panel__title">Notificações</div>
        ${naoLidas ? html`<button type="button" class="link" data-todas>Marcar todas como lidas</button>` : ''}</div>
      <div class="notif-list">${itens.length ? itens.map((n) => html`<button type="button" class="notif${n.lida ? '' : ' is-unread'}" data-id="${n.id}" data-link="${n.link || ''}">
        <span class="notif__dot" aria-hidden="true"></span><span class="col"><span class="notif__title">${n.lida ? '' : html`<span class="sr-only">Não lida: </span>`}${n.titulo}</span>
        <span class="notif__text">${n.texto}</span><span class="notif__time">${U.tempoRelativo(n.em)}</span></span></button>`) : ui.vazio('Nada por aqui', 'Avisaremos quando houver novidades.')}</div></div>`, {
      largura: 'min(380px, calc(100vw - 24px))',
      aoMontar: (pop, fechar) => {
        pop.classList.add('notif-panel');
        pop.addEventListener('click', async (e) => {
          if (e.target.closest('[data-todas]')) { await NH.api.notificacoes.marcarTodas(); fechar(); atualizarContadores(); ui.toast('Notificações marcadas como lidas.'); return; }
          const item = e.target.closest('.notif');
          if (!item) return;
          fechar();
          await NH.api.notificacoes.marcarLida({ id: item.dataset.id });
          atualizarContadores();
          irPara(item.dataset.link);
        });
      }
    });
  }
  function abrirMenuUsuario(botao) {
    ui.popover(botao, html`<div role="menu" aria-label="Conta">
      <a class="menu-item" role="menuitem" href="#/perfil">${ui.icone('user', { tam: 20 })}Meu perfil</a>
      <a class="menu-item" role="menuitem" href="#/ajuda">${ui.icone('help', { tam: 20 })}Central de ajuda</a>
      <button type="button" class="menu-item" role="menuitem" data-sair>${ui.icone('logout', { tam: 20 })}Sair</button></div>`, {
      aoMontar: (pop, fechar) => pop.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(); })
    });
  }
  function ligarCabecalho(raiz) {
    raiz.querySelectorAll('[data-notificacoes]').forEach((b) => b.addEventListener('click', () => abrirNotificacoes(b)));
    raiz.querySelectorAll('[data-menu-usuario]').forEach((b) => b.addEventListener('click', () => abrirMenuUsuario(b)));
  }
  async function sair() {
    try { await NH.api.auth.sair(); } catch (e) { /* ignora */ }
    location.href = 'index.html';
  }
  function sairPara() {
    NH.sessao.limpar();
    location.href = `index.html?perfil=${estado.cfg ? estado.cfg.perfil : ''}&expirou=1`;
  }

  /* ---------- Inicialização ---------- */
  async function iniciar(cfg) {
    estado.cfg = { layout: 'web', cabecalho: 'completo', ...cfg };
    estado.rotas = compilar(cfg.rotas);
    if (C.backend.mode === 'local') NH.store.carregar();
    let eu;
    try { eu = await NH.api.usuarios.eu(); } catch (e) { eu = null; }
    if (!eu) { location.replace(`index.html?perfil=${cfg.perfil}`); return; }
    if (eu.perfil !== cfg.perfil) { location.replace(C.perfis[eu.perfil].pagina); return; }
    estado.eu = eu;

    document.body.innerHTML = String(estado.cfg.layout === 'celular' ? molduraCelular() : molduraWeb());
    if (estado.cfg.layout === 'celular') ligarCabecalho(document.querySelector('.m-header'));

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-sair]')) { e.preventDefault(); ui.fecharPopover(); sair(); }
      const t = e.target.closest('[data-toggle-menu]');
      if (t) {
        const sb = t.closest('.sidebar');
        const aberto = sb.classList.toggle('is-open');
        t.setAttribute('aria-expanded', String(aberto));
      }
    });
    window.addEventListener('hashchange', () => { ui.fecharPopover(); renderizar(); });

    /* Atualização automática: dados mudaram (nesta aba, em outra aba ou no servidor) */
    const aoMudar = U.debounce(async () => {
      try { estado.eu = await NH.api.usuarios.eu(); } catch (e) { sairPara(); return; }
      await atualizarContadores();
      if (estado.viewAtual && estado.viewAtual.vivo === false) return;
      if (ocupado()) { estado.pendente = true; return; }
      renderizar({ silencioso: true });
    }, 350);
    NH.bus.on('db:change', aoMudar);
    setInterval(() => {
      if (C.backend.mode === 'http') aoMudar();
      else if (estado.pendente && !ocupado()) { estado.pendente = false; renderizar({ silencioso: true }); }
    }, C.backend.mode === 'http' ? 20000 : 1500);
    /* Tarefas automáticas (ex.: fim do prazo de reserva) */
    setInterval(() => { if (C.backend.mode === 'local') NH.api.manutencao(); }, 30000);

    await atualizarContadores();
    await renderizar();
  }

  NH.app = {
    iniciar, navegar, irPara, renderizar, atualizarContadores,
    get eu() { return estado.eu; },
    set eu(v) { estado.eu = v; },
    get contadores() { return estado.contadores; }
  };
})();
