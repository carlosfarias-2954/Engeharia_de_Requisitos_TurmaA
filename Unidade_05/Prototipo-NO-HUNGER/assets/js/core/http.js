/* =========================================================
   NO hunger — Adaptador HTTP para o backend
   Ativado com NH.config.backend.mode = 'http'.
   Converte cada ação registrada em NH.api na rota REST equivalente:
     'PUT /doacoes/:id' + { id: 'd1', titulo: 'Pães' }
       → PUT {baseUrl}/doacoes/d1  corpo: { "titulo": "Pães" }
   Respostas de erro esperadas: { "mensagem": "...", "codigo": "...", "campo": "..." }
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config;
  const ROTAS_DE_SESSAO = ['auth.entrar', 'auth.verificarCodigo', 'auth.cadastrar'];

  async function request(ep, args = {}) {
    const [metodo, caminho] = ep.rota.split(' ');
    const [base, qsFixa] = caminho.split('?');
    const usados = new Set();
    const path = base.replace(/:(\w+)/g, (_, k) => { usados.add(k); return encodeURIComponent(args[k] == null ? '' : args[k]); });
    const resto = Object.fromEntries(Object.entries(args).filter(([k, v]) => !usados.has(k) && v !== undefined));

    const params = new URLSearchParams(qsFixa || '');
    let body;
    if (metodo === 'GET' || metodo === 'DELETE') {
      Object.entries(resto).forEach(([k, v]) => { if (v != null) params.set(k, typeof v === 'object' ? JSON.stringify(v) : v); });
    } else {
      body = JSON.stringify(resto);
    }
    const url = C.backend.baseUrl + path + ([...params].length ? `?${params}` : '');

    const sessao = NH.sessao.obter();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), C.backend.timeoutMs);
    let res;
    try {
      res = await fetch(url, {
        method: metodo, body, signal: ctrl.signal, credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(sessao && sessao.token ? { Authorization: `Bearer ${sessao.token}` } : {}) }
      });
    } catch (e) {
      throw new NH.api.ApiError(e.name === 'AbortError' ? 'O servidor demorou para responder. Tente de novo.' : 'Sem conexão com o servidor. Verifique a internet.', 'rede', 0);
    } finally { clearTimeout(timer); }

    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) NH.sessao.limpar();
      throw new NH.api.ApiError((data && data.mensagem) || 'Não foi possível concluir a ação.', (data && data.codigo) || 'http', res.status, data && data.campo);
    }
    if (ROTAS_DE_SESSAO.includes(ep.nome) && data && data.token && data.usuario) {
      NH.sessao.definir({ userId: data.usuario.id, perfil: data.usuario.perfil, token: data.token }, !!args.manter);
    }
    if (ep.nome === 'auth.sair') NH.sessao.limpar();
    return data;
  }

  NH.http = { request };
})();
