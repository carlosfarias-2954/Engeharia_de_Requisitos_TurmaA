/* =========================================================
   NO hunger — Armazenamento local (modo demonstração)
   Simula o banco de dados no localStorage do navegador.
   Em produção este arquivo deixa de ser usado: a camada
   NH.api passa a falar com o backend (config.backend.mode = 'http').
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config;
  const KEY = `${C.storageKey}:v${C.storageVersion}`;
  const COLECOES = ['usuarios', 'doacoes', 'recorrencias', 'estoque', 'distribuicoes', 'pedidos', 'voluntarios',
    'mensagens', 'notificacoes', 'avaliacoes', 'repasses', 'chamados', 'codigos'];

  let db = null;
  let memoria = null; // usado se o navegador bloquear o localStorage

  function ler() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return memoria; }
  }
  function gravar() {
    const texto = JSON.stringify(db);
    try {
      localStorage.setItem(KEY, texto);
    } catch (e) {
      if (e && /quota/i.test(e.name + e.message)) {
        throw new Error('O espaço de armazenamento do navegador acabou. Remova fotos antigas ou reinicie os dados de demonstração na Central de ajuda.');
      }
      memoria = JSON.parse(texto);
    }
  }
  function carregar() {
    db = ler();
    if (!db || db.versao !== C.storageVersion) {
      db = NH.seed.criar();
      db.versao = C.storageVersion;
      gravar();
    }
    COLECOES.forEach((c) => { db[c] = db[c] || []; });
    db.meta = db.meta || {};
    return db;
  }
  function garantir() { if (!db) carregar(); return db; }
  let emLote = 0, pendente = false;
  function salvar() {
    if (emLote) { pendente = true; return; }
    db.meta.atualizadoEm = new Date().toISOString(); gravar(); NH.bus.emit('db:change', { local: true });
  }

  /* Outras abas (ex.: doador e instituição abertos lado a lado) */
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try { db = JSON.parse(e.newValue); NH.bus.emit('db:change', { externo: true }); } catch (err) { /* ignora */ }
  });

  NH.store = {
    colecoes: COLECOES,
    carregar,
    todos(col) { return garantir()[col]; },
    obter(col, id) { return garantir()[col].find((x) => x.id === id) || null; },
    onde(col, fn) { return garantir()[col].filter(fn); },
    primeiro(col, fn) { return garantir()[col].find(fn) || null; },
    inserir(col, obj) {
      garantir();
      const novo = { id: obj.id || NH.utils.uid(col.slice(0, 3)), criadoEm: new Date().toISOString(), ...obj };
      db[col].push(novo);
      salvar();
      return novo;
    },
    atualizar(col, id, patch) {
      garantir();
      const item = db[col].find((x) => x.id === id);
      if (!item) return null;
      Object.assign(item, typeof patch === 'function' ? patch(item) || {} : patch, { atualizadoEm: new Date().toISOString() });
      salvar();
      return item;
    },
    remover(col, id) {
      garantir();
      const antes = db[col].length;
      db[col] = db[col].filter((x) => x.id !== id);
      if (db[col].length !== antes) salvar();
    },
    /* Várias alterações seguidas, gravando uma vez só */
    lote(fn) {
      garantir();
      emLote++;
      try { return fn(); } finally {
        emLote--;
        if (!emLote && pendente) { pendente = false; salvar(); }
      }
    },
    meta(chave, valor) {
      garantir();
      if (valor === undefined) return db.meta[chave];
      db.meta[chave] = valor; salvar(); return valor;
    },
    reiniciar() {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
      memoria = null; db = null; carregar(); NH.bus.emit('db:change', { reset: true });
    },
    tamanhoKb() { try { return Math.round((localStorage.getItem(KEY) || '').length / 1024); } catch (e) { return 0; } }
  };
})();
