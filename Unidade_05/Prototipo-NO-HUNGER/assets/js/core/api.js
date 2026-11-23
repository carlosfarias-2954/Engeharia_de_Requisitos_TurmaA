/* =========================================================
   NO hunger — Camada de serviços (API)
   ---------------------------------------------------------
   Todas as telas chamam apenas NH.api.<grupo>.<acao>(args).
   Cada ação é registrada com a rota REST equivalente:

     def('doacoes.reservar', 'POST /doacoes/:id/reserva', impl)

   • modo 'local' (padrão): executa impl() com os dados do navegador,
     aplicando as mesmas regras de negócio que o backend deverá ter;
   • modo 'http': ignora impl() e chama o backend (NH.http).

   A lista completa de rotas é o contrato documentado em docs/BACKEND.md.
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, S = NH.store;

  /* ---------- Erros ---------- */
  class ApiError extends Error {
    constructor(mensagem, codigo = 'regra_negocio', status = 422, campo = null) {
      super(mensagem); this.codigo = codigo; this.status = status; this.campo = campo;
    }
  }
  const falha = (msg, codigo, status, campo) => { throw new ApiError(msg, codigo, status, campo); };
  const exigir = (cond, msg, campo) => { if (!cond) falha(msg, 'validacao', 422, campo); };

  /* ---------- Sessão ---------- */
  NH.sessao = {
    obter() {
      try { return JSON.parse(sessionStorage.getItem(C.sessionKey) || localStorage.getItem(C.sessionKey)); } catch (e) { return null; }
    },
    definir(s, manter) {
      const t = JSON.stringify(s);
      try { sessionStorage.setItem(C.sessionKey, t); if (manter) localStorage.setItem(C.sessionKey, t); else localStorage.removeItem(C.sessionKey); } catch (e) { /* ignora */ }
    },
    limpar() { try { sessionStorage.removeItem(C.sessionKey); localStorage.removeItem(C.sessionKey); } catch (e) { /* ignora */ } }
  };
  function usuarioAtual() {
    const s = NH.sessao.obter();
    if (!s) return null;
    const u = S.obter('usuarios', s.userId);
    return u && u.status !== 'excluido' ? u : null;
  }
  function iniciarSessao(u, manter) {
    NH.sessao.definir({ userId: u.id, perfil: u.perfil, token: U.uid('tok'), desde: new Date().toISOString() }, manter);
  }

  /* ---------- Registro de ações ---------- */
  const registro = {};
  function def(nome, rota, impl, opcoes = {}) { registro[nome] = { nome, rota, impl, ...opcoes }; }

  async function chamar(nome, args = {}) {
    const ep = registro[nome];
    if (!ep) throw new ApiError(`Ação desconhecida: ${nome}`, 'interno', 500);
    if (C.backend.mode === 'http') return NH.http.request(ep, args);
    if (C.backend.latenciaSimuladaMs) await U.sleep(C.backend.latenciaSimuladaMs);
    const eu = usuarioAtual();
    if (!ep.publico && !eu) falha('Sua sessão terminou. Entre novamente.', 'nao_autenticado', 401);
    if (ep.perfis && (!eu || !ep.perfis.includes(eu.perfil))) falha('Seu perfil não tem acesso a esta ação.', 'proibido', 403);
    if (ep.aprovado && eu.status !== 'aprovado') falha('Seu cadastro ainda está em análise. Esta ação será liberada após a aprovação.', 'cadastro_pendente', 403);
    manutencao();
    const resultado = await ep.impl(args || {}, { eu });
    return U.clone(resultado);
  }

  /* ---------- Auxiliares de domínio ---------- */
  const hoje = () => U.isoDate();
  const agoraIso = () => new Date().toISOString();
  const usuario = (id) => S.obter('usuarios', id);
  const nomeDe = (id) => { const u = usuario(id); return u ? (u.nome || u.apelido) : 'Conta removida'; };
  const ehAprovado = (u) => u && u.status === 'aprovado';

  function mediaAvaliacoes(userId) {
    const l = S.onde('avaliacoes', (a) => a.paraId === userId);
    return { media: l.length ? Math.round((U.somar(l, (a) => a.nota) / l.length) * 10) / 10 : null, total: l.length };
  }
  /* Dados que podem ser vistos por outros usuários. Beneficiários nunca são expostos. */
  function publico(u) {
    if (!u || u.perfil === 'beneficiario' || u.perfil === 'governo') return null;
    const r = mediaAvaliacoes(u.id);
    return {
      id: u.id, perfil: u.perfil, nome: u.nome, nomeCurto: u.nomeCurto, tipo: u.tipo, telefone: u.telefone,
      endereco: u.endereco, geo: u.geo, horario: u.horario || null, status: u.status, avaliacao: r
    };
  }
  function semSegredos(u) {
    if (!u) return null;
    const { senhaHash, senhaDemo, ...resto } = u;
    resto.documentos = (u.documentos || []).map(({ dataUrl, ...d }) => ({ ...d, temArquivo: !!dataUrl }));
    return resto;
  }
  function notificar(userId, titulo, texto, link, tipo = 'info') {
    if (!userId) return;
    S.inserir('notificacoes', { userId, titulo, texto, link, tipo, em: agoraIso(), lida: false });
  }
  function msgSistema(doacaoId, texto) {
    S.inserir('mensagens', { doacaoId, deId: 'sistema', paraId: null, texto, em: agoraIso(), lida: true });
  }
  function registrarStatus(d, novo, porId, extra = {}) {
    const permitidos = C.transicoes[d.status] || [];
    if (!permitidos.includes(novo)) falha(`Não é possível mudar de "${C.status[d.status].label}" para "${C.status[novo].label}".`, 'transicao_invalida', 409);
    S.atualizar('doacoes', d.id, (x) => ({ ...extra, status: novo, historico: [...(x.historico || []), { status: novo, em: agoraIso(), por: porId }] }));
    return S.obter('doacoes', d.id);
  }
  const linkDoador = (d) => `doador.html#/doacoes/${d.id}`;
  const linkInst = (d) => `instituicao.html#/doacao/${d.id}`;
  const linkGov = () => 'governo.html#/cadastros';

  function enriquecerDoacao(d, eu) {
    const doador = usuario(d.doadorId), inst = d.instituicaoId ? usuario(d.instituicaoId) : null;
    const resp = d.responsavelId ? S.obter('voluntarios', d.responsavelId) : null;
    const out = {
      ...d, pesoKg: U.pesoKg(d),
      doador: publico(doador), instituicao: publico(inst),
      responsavel: resp ? { id: resp.id, nome: resp.nome, funcao: resp.funcao, veiculo: resp.veiculo, telefone: resp.telefone } : null,
      distanciaKm: eu && eu.geo && d.geo ? U.distanciaKm(eu.geo, d.geo) : null,
      naoLidas: eu ? S.onde('mensagens', (m) => m.doacaoId === d.id && m.paraId === eu.id && !m.lida).length : 0
    };
    if (eu) {
      out.minhaAvaliacao = S.primeiro('avaliacoes', (a) => a.doacaoId === d.id && a.deId === eu.id);
      out.avaliacaoRecebida = S.primeiro('avaliacoes', (a) => a.doacaoId === d.id && a.paraId === eu.id);
    }
    return out;
  }
  function podeVerDoacao(d, eu) {
    if (!d) return false;
    if (eu.perfil === 'governo') return true;
    if (eu.perfil === 'doador') return d.doadorId === eu.id;
    if (eu.perfil === 'instituicao') return d.instituicaoId === eu.id || (d.status === 'publicada' && ehAprovado(eu));
    return false;
  }
  function doacaoDoDoador(id, eu) {
    const d = S.obter('doacoes', id);
    if (!d || d.doadorId !== eu.id) falha('Doação não encontrada.', 'nao_encontrado', 404);
    return d;
  }
  function doacaoDaInstituicao(id, eu) {
    const d = S.obter('doacoes', id);
    if (!d || d.instituicaoId !== eu.id) falha('Esta doação não está reservada pela sua instituição.', 'nao_encontrado', 404);
    return d;
  }
  function estoqueAtualKg(instId) { return U.somar(S.onde('estoque', (e) => e.instituicaoId === instId), (e) => U.pesoKg(e)); }

  /* ---------- Manutenção automática (no backend: tarefa agendada) ----------
     • Reserva sem responsável após 30 min volta a ficar publicada.
     • Doação publicada com validade vencida expira. */
  let ultimaManutencao = 0;
  function manutencao(forcar) {
    if (!forcar && Date.now() - ultimaManutencao < 10000) return;
    ultimaManutencao = Date.now();
    const agora = Date.now(), dia = hoje();
    S.lote(() => {
      S.onde('doacoes', (d) => d.status === 'reservada' && !d.responsavelId && d.prazoResponsavel && new Date(d.prazoResponsavel).getTime() < agora)
        .forEach((d) => {
          const inst = d.instituicaoId;
          S.atualizar('doacoes', d.id, (x) => ({ status: 'publicada', instituicaoId: null, reservadaEm: null, prazoResponsavel: null,
            historico: [...x.historico, { status: 'publicada', em: agoraIso(), por: 'sistema', motivo: 'prazo da reserva encerrado' }] }));
          notificar(inst, 'Reserva cancelada pelo prazo', `A reserva de ${d.titulo} terminou porque ninguém foi definido para retirar em ${C.regras.prazoConfirmarResponsavelMin} minutos.`, 'instituicao.html#/perto', 'urgente');
          notificar(d.doadorId, 'Doação disponível de novo', `${d.titulo} voltou a ficar disponível para outras instituições.`, linkDoador(d));
        });
      S.onde('doacoes', (d) => d.status === 'publicada' && d.validade < dia).forEach((d) => {
        S.atualizar('doacoes', d.id, (x) => ({ status: 'expirada', historico: [...x.historico, { status: 'expirada', em: agoraIso(), por: 'sistema' }] }));
        notificar(d.doadorId, 'Doação expirada', `${d.titulo} passou da validade sem reserva.`, linkDoador(d));
      });
    });
  }

  /* ---------- Validações ---------- */
  function validarDoacao(x, edicao) {
    exigir(x.titulo && String(x.titulo).trim().length >= 2, 'Informe qual é o alimento.', 'titulo');
    exigir(Number(x.quantidade) > 0, 'Informe uma quantidade maior que zero.', 'quantidade');
    exigir(C.unidades.some((u) => u.id === x.unidade), 'Escolha a unidade.', 'unidade');
    exigir(C.categorias.some((c) => c.id === x.categoria), 'Escolha o tipo de alimento.', 'categoria');
    exigir(C.armazenamento.some((a) => a.id === x.armazenamento), 'Escolha como o alimento deve ser guardado.', 'armazenamento');
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(x.validade || ''), 'Informe a validade.', 'validade');
    exigir(x.validade >= hoje(), 'A validade não pode ser anterior a hoje.', 'validade');
    const j = x.janela || {};
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(j.data || ''), 'Informe o dia da retirada.', 'janela.data');
    exigir(edicao || j.data >= hoje(), 'O dia da retirada não pode ser no passado.', 'janela.data');
    exigir(j.data <= x.validade, 'A retirada precisa acontecer até a data de validade.', 'janela.data');
    exigir(j.inicio && j.fim && j.inicio < j.fim, 'O horário final da retirada deve ser depois do inicial.', 'janela.fim');
  }
  const camposDoacao = (x) => ({
    titulo: String(x.titulo).trim(), quantidade: Number(x.quantidade), unidade: x.unidade, categoria: x.categoria,
    armazenamento: x.armazenamento, validade: x.validade, janela: { data: x.janela.data, inicio: x.janela.inicio, fim: x.janela.fim },
    observacoes: String(x.observacoes || '').trim().slice(0, 500), fotos: (x.fotos || []).slice(0, 3)
  });
  function avisarInstituicoesProximas(d) {
    S.onde('usuarios', (u) => u.perfil === 'instituicao' && ehAprovado(u) && U.distanciaKm(u.geo, d.geo) <= C.regras.raioAvisoInstituicaoKm)
      .forEach((u) => notificar(u.id, 'Nova doação por perto',
        `${nomeDe(d.doadorId)} publicou ${d.titulo} (${U.quantidade(d.quantidade, d.unidade)}) a ${U.distanciaLabel(U.distanciaKm(u.geo, d.geo))}.`,
        'instituicao.html#/perto', U.diasAte(d.validade) === 0 ? 'urgente' : 'info'));
  }

  /* =========================================================
     AUTENTICAÇÃO E CADASTRO
     ========================================================= */
  def('auth.entrar', 'POST /auth/login', async ({ email, senha, perfil, manter }) => {
    exigir(U.emailValido(email), 'Informe um e-mail válido.', 'email');
    exigir(senha, 'Informe a senha.', 'senha');
    const u = S.primeiro('usuarios', (x) => x.email && x.email.toLowerCase() === String(email).trim().toLowerCase() && x.status !== 'excluido');
    const ok = u && (u.senhaDemo ? senha === 'demo123' : u.senhaHash === await U.hashSenha(senha));
    if (!ok) falha('E-mail ou senha incorretos.', 'credenciais', 401, 'senha');
    if (perfil && u.perfil !== perfil) falha(`Este e-mail está cadastrado como ${C.perfis[u.perfil].label.toLowerCase()}. Escolha o perfil correto para entrar.`, 'perfil', 403, 'email');
    iniciarSessao(u, manter);
    return { usuario: semSegredos(u), destino: C.perfis[u.perfil].pagina };
  }, { publico: true });

  def('auth.solicitarCodigo', 'POST /auth/codigo', ({ telefone }) => {
    const d = U.soDigitos(telefone);
    exigir(d.length >= 10 && d.length <= 11, 'Informe o celular com DDD.', 'telefone');
    const codigo = String(1000 + Math.floor(Math.random() * 9000));
    S.lote(() => {
      S.onde('codigos', (c) => c.telefone === d).forEach((c) => S.remover('codigos', c.id));
      S.inserir('codigos', { telefone: d, codigo, expira: new Date(Date.now() + 10 * 60000).toISOString(), tentativas: 0, verificado: false });
    });
    /* Em produção o código é enviado por SMS/WhatsApp e NUNCA retornado. */
    return { enviado: true, canal: 'sms', demoCodigo: C.demo.ativo ? codigo : undefined };
  }, { publico: true });

  def('auth.verificarCodigo', 'POST /auth/codigo/verificar', ({ telefone, codigo, manter }) => {
    const d = U.soDigitos(telefone);
    const reg = S.primeiro('codigos', (c) => c.telefone === d);
    if (!reg || new Date(reg.expira) < new Date()) falha('O código expirou. Peça um novo código.', 'codigo_expirado', 410, 'codigo');
    if (reg.tentativas >= 5) falha('Muitas tentativas. Peça um novo código.', 'tentativas', 429, 'codigo');
    if (String(codigo).trim() !== reg.codigo) {
      S.atualizar('codigos', reg.id, { tentativas: reg.tentativas + 1 });
      falha('Código incorreto. Confira a mensagem recebida.', 'codigo_incorreto', 401, 'codigo');
    }
    S.atualizar('codigos', reg.id, { verificado: true });
    const u = S.primeiro('usuarios', (x) => x.perfil === 'beneficiario' && U.soDigitos(x.telefone) === d && x.status !== 'excluido');
    if (u) { iniciarSessao(u, manter); return { novo: false, usuario: semSegredos(u), destino: C.perfis.beneficiario.pagina }; }
    return { novo: true };
  }, { publico: true });

  def('auth.cadastrar', 'POST /auth/cadastro', async (x) => {
    const perfil = x.perfil;
    exigir(['doador', 'instituicao', 'beneficiario'].includes(perfil), 'Escolha um perfil válido.', 'perfil');
    const geoAprox = (cidadeTexto) => x.geo && isFinite(x.geo.lat) ? x.geo : U.deslocar({ lat: -23.5489, lng: -46.6388 }, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);

    if (perfil === 'beneficiario') {
      const tel = U.soDigitos(x.telefone);
      const reg = S.primeiro('codigos', (c) => c.telefone === tel && c.verificado);
      exigir(reg, 'Confirme seu celular com o código antes de continuar.', 'telefone');
      exigir(x.apelido && x.apelido.trim().length >= 2, 'Diga como podemos chamar você.', 'apelido');
      exigir(x.bairro && x.bairro.trim(), 'Informe o seu bairro.', 'bairro');
      exigir(x.consentimento, 'Para continuar, aceite o uso dos dados para encontrar alimento perto de você.', 'consentimento');
      exigir(!S.primeiro('usuarios', (u) => u.perfil === 'beneficiario' && U.soDigitos(u.telefone) === tel && u.status !== 'excluido'), 'Este celular já tem cadastro. Entre com o código.', 'telefone');
      const u = S.inserir('usuarios', {
        perfil, apelido: x.apelido.trim().slice(0, 30), telefone: U.formatarTelefone(tel), whatsapp: !!x.whatsapp,
        bairro: x.bairro.trim(), cidade: (x.cidade || 'São Paulo').trim(), geo: geoAprox(), preferencia: x.preferencia || 'retirada',
        status: 'aprovado', consentimentoLGPD: agoraIso(), notificacoesNavegador: false
      });
      S.remover('codigos', reg.id);
      iniciarSessao(u, true);
      return { usuario: semSegredos(u), destino: C.perfis.beneficiario.pagina };
    }

    exigir(x.nome && x.nome.trim().length >= 3, 'Informe o nome da empresa ou instituição.', 'nome');
    exigir(U.cnpjValido(x.documento), 'CNPJ inválido. Confira os números.', 'documento');
    exigir(!S.primeiro('usuarios', (u) => U.soDigitos(u.documento) === U.soDigitos(x.documento) && u.status !== 'excluido'), 'Já existe um cadastro com este CNPJ.', 'documento');
    exigir(U.emailValido(x.email), 'Informe um e-mail válido.', 'email');
    exigir(!S.primeiro('usuarios', (u) => u.email && u.email.toLowerCase() === x.email.trim().toLowerCase() && u.status !== 'excluido'), 'Este e-mail já está em uso.', 'email');
    exigir(U.soDigitos(x.telefone).length >= 10, 'Informe um telefone com DDD.', 'telefone');
    exigir(x.responsavel && x.responsavel.trim(), 'Informe o nome do responsável.', 'responsavel');
    exigir(x.endereco && x.endereco.logradouro && x.endereco.cidade && x.endereco.uf, 'Preencha o endereço completo.', 'endereco.logradouro');
    exigir(x.senha && x.senha.length >= 8, 'A senha precisa ter pelo menos 8 caracteres.', 'senha');
    exigir(x.aceite, 'É preciso aceitar os termos de uso para continuar.', 'aceite');
    const extra = perfil === 'instituicao'
      ? { capacidadeKg: Number(x.capacidadeKg) || 0, refrigeracao: !!x.refrigeracao, horario: x.horario || { dias: [1, 2, 3, 4, 5], abre: '08:00', fecha: '17:00' } }
      : {};
    const u = S.inserir('usuarios', {
      perfil, nome: x.nome.trim(), nomeCurto: (x.nomeCurto || x.nome).trim().slice(0, 28), tipo: x.tipo, documento: U.formatarCNPJ(x.documento),
      email: x.email.trim().toLowerCase(), senhaHash: await U.hashSenha(x.senha), telefone: U.formatarTelefone(x.telefone), responsavel: x.responsavel.trim(),
      endereco: x.endereco, geo: geoAprox(), documentos: (x.documentos || []).map((d) => ({ id: U.uid('doc'), enviadoEm: agoraIso(), ...d })),
      status: 'pendente', notificacoesNavegador: false, ...extra
    });
    S.onde('usuarios', (g) => g.perfil === 'governo').forEach((g) => notificar(g.id, 'Novo cadastro para aprovar', `${u.nome} (${C.perfis[perfil].label}) enviou o cadastro.`, linkGov()));
    iniciarSessao(u, false);
    return { usuario: semSegredos(u), destino: C.perfis[perfil].pagina };
  }, { publico: true });

  def('auth.sair', 'POST /auth/logout', () => { NH.sessao.limpar(); return { ok: true }; }, { publico: true });

  def('auth.recuperarSenha', 'POST /auth/recuperar-senha', ({ email }) => {
    exigir(U.emailValido(email), 'Informe um e-mail válido.', 'email');
    /* Resposta igual para e-mail existente ou não (evita descobrir cadastros) */
    return { ok: true, mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.' };
  }, { publico: true });

  /* =========================================================
     USUÁRIO / PERFIL
     ========================================================= */
  def('usuarios.eu', 'GET /me', (a, { eu }) => ({ ...semSegredos(eu), avaliacao: mediaAvaliacoes(eu.id) }));

  def('usuarios.publico', 'GET /usuarios/:id/publico', ({ id }) => {
    const p = publico(usuario(id));
    if (!p) falha('Perfil não encontrado.', 'nao_encontrado', 404);
    return p;
  });

  def('usuarios.atualizar', 'PATCH /me', (x, { eu }) => {
    const patch = {};
    if (eu.perfil === 'beneficiario') {
      if (x.apelido != null) { exigir(x.apelido.trim().length >= 2, 'Diga como podemos chamar você.', 'apelido'); patch.apelido = x.apelido.trim().slice(0, 30); }
      if (x.bairro != null) { exigir(x.bairro.trim(), 'Informe o seu bairro.', 'bairro'); patch.bairro = x.bairro.trim(); }
      if (x.cidade != null) patch.cidade = x.cidade.trim();
      if (x.preferencia) patch.preferencia = x.preferencia;
      if (x.enderecoEntrega != null) patch.enderecoEntrega = x.enderecoEntrega.trim().slice(0, 160);
      if (x.geo && isFinite(x.geo.lat)) patch.geo = x.geo;
    } else {
      const podeDadosOficiais = eu.status !== 'aprovado';
      if (x.nome != null) {
        exigir(podeDadosOficiais || x.nome.trim() === eu.nome, 'Depois da aprovação, a razão social só muda pela Central de ajuda.', 'nome');
        exigir(x.nome.trim().length >= 3, 'Informe o nome.', 'nome'); patch.nome = x.nome.trim();
      }
      if (x.nomeCurto != null) patch.nomeCurto = x.nomeCurto.trim().slice(0, 28) || eu.nomeCurto;
      if (x.email != null) {
        exigir(U.emailValido(x.email), 'Informe um e-mail válido.', 'email');
        exigir(!S.primeiro('usuarios', (u) => u.id !== eu.id && u.email && u.email.toLowerCase() === x.email.trim().toLowerCase()), 'Este e-mail já está em uso.', 'email');
        patch.email = x.email.trim().toLowerCase();
      }
      if (x.telefone != null) { exigir(U.soDigitos(x.telefone).length >= 10, 'Informe um telefone com DDD.', 'telefone'); patch.telefone = U.formatarTelefone(x.telefone); }
      ['responsavel', 'tipo', 'cargo'].forEach((k) => { if (x[k] != null) patch[k] = String(x[k]).trim(); });
      if (x.endereco) patch.endereco = { ...eu.endereco, ...x.endereco };
      if (x.geo && isFinite(x.geo.lat)) patch.geo = x.geo;
      if (eu.perfil === 'instituicao') {
        if (x.capacidadeKg != null) patch.capacidadeKg = Math.max(0, Number(x.capacidadeKg) || 0);
        if (x.refrigeracao != null) patch.refrigeracao = !!x.refrigeracao;
        if (x.horario) {
          exigir(x.horario.dias && x.horario.dias.length, 'Escolha pelo menos um dia de atendimento.', 'horario.dias');
          exigir(x.horario.abre < x.horario.fecha, 'O horário de fechamento deve ser depois da abertura.', 'horario.fecha');
          patch.horario = { dias: x.horario.dias.map(Number), abre: x.horario.abre, fecha: x.horario.fecha };
        }
      }
    }
    if (x.notificacoesNavegador != null) patch.notificacoesNavegador = !!x.notificacoesNavegador;
    return semSegredos(S.atualizar('usuarios', eu.id, patch));
  });

  def('usuarios.reenviarAnalise', 'POST /me/reenviar-analise', (a, { eu }) => {
    exigir(eu.status === 'reprovado', 'Seu cadastro não está reprovado.');
    S.atualizar('usuarios', eu.id, { status: 'pendente', motivoReprovacao: null, reenviadoEm: agoraIso() });
    S.onde('usuarios', (g) => g.perfil === 'governo').forEach((g) => notificar(g.id, 'Cadastro reenviado', `${eu.nome} corrigiu o cadastro e pediu nova análise.`, linkGov()));
    return { ok: true };
  }, { perfis: ['doador', 'instituicao'] });

  def('usuarios.alterarSenha', 'POST /me/senha', async ({ atual, nova }, { eu }) => {
    const ok = eu.senhaDemo ? atual === 'demo123' : eu.senhaHash === await U.hashSenha(atual || '');
    exigir(ok, 'A senha atual está incorreta.', 'atual');
    exigir(nova && nova.length >= 8, 'A nova senha precisa ter pelo menos 8 caracteres.', 'nova');
    S.atualizar('usuarios', eu.id, { senhaHash: await U.hashSenha(nova), senhaDemo: false });
    return { ok: true };
  }, { perfis: ['doador', 'instituicao', 'governo'] });

  def('usuarios.adicionarDocumento', 'POST /me/documentos', ({ nome, arquivo, tipo, tamanho, dataUrl, validade }, { eu }) => {
    exigir(nome, 'Escolha qual documento está enviando.', 'nome');
    exigir(arquivo, 'Selecione o arquivo.', 'arquivo');
    exigir((tamanho || 0) <= C.regras.tamanhoMaxDocumentoMb * 1024 * 1024, `O arquivo deve ter até ${C.regras.tamanhoMaxDocumentoMb} MB.`, 'arquivo');
    const docs = (eu.documentos || []).filter((d) => d.nome !== nome);
    docs.push({ id: U.uid('doc'), nome, arquivo, tipo, tamanho, dataUrl: dataUrl || null, validade: validade || null, enviadoEm: agoraIso() });
    S.atualizar('usuarios', eu.id, { documentos: docs });
    return semSegredos(usuario(eu.id)).documentos;
  }, { perfis: ['doador', 'instituicao'] });

  def('usuarios.removerDocumento', 'DELETE /me/documentos/:id', ({ id }, { eu }) => {
    exigir(eu.status !== 'aprovado', 'Depois da aprovação, documentos só podem ser substituídos (envie a nova versão).');
    S.atualizar('usuarios', eu.id, { documentos: (eu.documentos || []).filter((d) => d.id !== id) });
    return { ok: true };
  }, { perfis: ['doador', 'instituicao'] });

  def('usuarios.excluirConta', 'DELETE /me', ({ confirmacao }, { eu }) => {
    exigir(confirmacao === 'EXCLUIR', 'Digite EXCLUIR para confirmar.', 'confirmacao');
    if (eu.perfil === 'doador') exigir(!S.primeiro('doacoes', (d) => d.doadorId === eu.id && ['reservada', 'coletada'].includes(d.status)), 'Conclua ou cancele as doações em andamento antes de excluir a conta.');
    if (eu.perfil === 'instituicao') exigir(!S.primeiro('doacoes', (d) => d.instituicaoId === eu.id && ['reservada', 'coletada'].includes(d.status)), 'Conclua as reservas em andamento antes de excluir a conta.');
    S.lote(() => {
      if (eu.perfil === 'doador') S.onde('doacoes', (d) => d.doadorId === eu.id && d.status === 'publicada').forEach((d) => S.remover('doacoes', d.id));
      if (eu.perfil === 'beneficiario') {
        S.onde('pedidos', (p) => p.beneficiarioId === eu.id).forEach((p) => S.atualizar('pedidos', p.id, { enderecoEntrega: null, status: ['concluido', 'cancelado'].includes(p.status) ? p.status : 'cancelado' }));
      }
      /* Mantém o registro mínimo para a contabilidade das doações; remove dados pessoais */
      S.atualizar('usuarios', eu.id, { status: 'excluido', excluidoEm: agoraIso(), email: null, telefone: null, apelido: 'Conta excluída', responsavel: null,
        enderecoEntrega: null, documentos: [], senhaHash: null, senhaDemo: false });
    });
    NH.sessao.limpar();
    return { ok: true };
  });

  /* =========================================================
     DOAÇÕES — DOADOR
     ========================================================= */
  def('doacoes.publicar', 'POST /doacoes', (x, { eu }) => {
    validarDoacao(x);
    const d = S.inserir('doacoes', {
      ...camposDoacao(x), doadorId: eu.id, geo: eu.geo, status: 'publicada', instituicaoId: null, responsavelId: null,
      historico: [{ status: 'publicada', em: agoraIso(), por: eu.id }]
    });
    if (x.repetir && x.dias && x.dias.length) {
      S.inserir('recorrencias', {
        doadorId: eu.id, ativa: true, dias: x.dias.map(Number), ultimaPublicacao: hoje(),
        modelo: { ...camposDoacao(x), validadeDias: Math.max(0, U.diasAte(x.validade)), janela: { inicio: x.janela.inicio, fim: x.janela.fim }, fotos: [] }
      });
    }
    avisarInstituicoesProximas(d);
    return enriquecerDoacao(d, eu);
  }, { perfis: ['doador'], aprovado: true });

  def('doacoes.editar', 'PUT /doacoes/:id', (x, { eu }) => {
    const d = doacaoDoDoador(x.id, eu);
    exigir(d.status === 'publicada', 'Só é possível alterar doações que ainda não foram reservadas. Use o chat para combinar mudanças com a instituição.');
    validarDoacao(x, true);
    return enriquecerDoacao(S.atualizar('doacoes', d.id, camposDoacao(x)), eu);
  }, { perfis: ['doador'] });

  def('doacoes.excluir', 'DELETE /doacoes/:id', ({ id }, { eu }) => {
    const d = doacaoDoDoador(id, eu);
    exigir(d.status === 'publicada' || d.status === 'expirada', 'Doações reservadas não podem ser excluídas. Cancele a doação e avise a instituição pelo chat.');
    S.remover('doacoes', d.id);
    return { ok: true };
  }, { perfis: ['doador'] });

  def('doacoes.cancelar', 'POST /doacoes/:id/cancelamento', ({ id, motivo }, { eu }) => {
    const d = doacaoDoDoador(id, eu);
    exigir(['publicada', 'reservada'].includes(d.status), 'Esta doação não pode mais ser cancelada.');
    if (d.status === 'reservada') exigir(motivo && motivo.trim().length >= 5, 'Explique o motivo para a instituição.', 'motivo');
    const inst = d.instituicaoId;
    const n = registrarStatus(d, 'cancelada', eu.id, { motivoCancelamento: (motivo || '').trim() });
    if (inst) {
      notificar(inst, 'Doação cancelada pelo doador', `${eu.nome} cancelou ${d.titulo}. Motivo: ${motivo.trim()}`, linkInst(d), 'urgente');
      msgSistema(d.id, `Doação cancelada pelo doador: ${motivo.trim()}`);
    }
    return enriquecerDoacao(n, eu);
  }, { perfis: ['doador'] });

  def('doacoes.minhas', 'GET /doacoes?doador=me', ({ status } = {}, { eu }) => {
    let l = S.onde('doacoes', (d) => d.doadorId === eu.id);
    if (status === 'andamento') l = l.filter((d) => ['publicada', 'reservada', 'coletada'].includes(d.status));
    else if (status === 'concluidas') l = l.filter((d) => ['entregue', 'cancelada', 'expirada'].includes(d.status));
    else if (status) l = l.filter((d) => d.status === status);
    return l.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || '')).map((d) => enriquecerDoacao(d, eu));
  }, { perfis: ['doador'] });

  def('doacoes.detalhe', 'GET /doacoes/:id', ({ id }, { eu }) => {
    const d = S.obter('doacoes', id);
    if (!podeVerDoacao(d, eu)) falha('Doação não encontrada ou sem acesso.', 'nao_encontrado', 404);
    return enriquecerDoacao(d, eu);
  }, { perfis: ['doador', 'instituicao', 'governo'] });

  def('doacoes.confirmarEntregaAoVoluntario', 'POST /doacoes/:id/coleta/confirmacao-doador', ({ id }, { eu }) => {
    const d = doacaoDoDoador(id, eu);
    exigir(d.status === 'reservada', 'A doação precisa estar reservada.');
    exigir(d.responsavelId, 'A instituição ainda não definiu quem vai retirar.');
    const n = registrarStatus(d, 'coletada', eu.id, { coletadaEm: agoraIso(), coleta: { ...(d.coleta || {}), concluidaEm: agoraIso() } });
    notificar(d.instituicaoId, 'Doação coletada', `${eu.nome} confirmou que entregou ${d.titulo} ao responsável da instituição.`, linkInst(d));
    return enriquecerDoacao(n, eu);
  }, { perfis: ['doador'] });

  /* ---------- Doações recorrentes ---------- */
  function pendentesRecorrencia(eu) {
    const dia = hoje(), sem = new Date().getDay();
    return S.onde('recorrencias', (r) => r.doadorId === eu.id && r.ativa && r.dias.includes(sem) && r.ultimaPublicacao !== dia && r.dispensadaEm !== dia);
  }
  def('recorrencias.listar', 'GET /recorrencias', (a, { eu }) => {
    const pend = pendentesRecorrencia(eu).map((r) => r.id);
    return S.onde('recorrencias', (r) => r.doadorId === eu.id).map((r) => ({ ...r, pendenteHoje: pend.includes(r.id) }));
  }, { perfis: ['doador'] });
  def('recorrencias.pendentes', 'GET /recorrencias/pendentes', (a, { eu }) => pendentesRecorrencia(eu), { perfis: ['doador'] });
  def('recorrencias.publicarPendentes', 'POST /recorrencias/publicar-pendentes', ({ ids } = {}, { eu }) => {
    let lista = pendentesRecorrencia(eu);
    if (ids) lista = lista.filter((r) => ids.includes(r.id));
    exigir(lista.length, 'Não há doações recorrentes para publicar hoje.');
    const criadas = [];
    S.lote(() => {
      lista.forEach((r) => {
        const m = r.modelo, dia = hoje();
        const d = S.inserir('doacoes', {
          titulo: m.titulo, quantidade: m.quantidade, unidade: m.unidade, categoria: m.categoria, armazenamento: m.armazenamento,
          validade: U.isoDate(U.addDays(new Date(), m.validadeDias || 0)), janela: { data: dia, inicio: m.janela.inicio, fim: m.janela.fim },
          observacoes: m.observacoes || '', fotos: [], doadorId: eu.id, geo: eu.geo, status: 'publicada', instituicaoId: null, responsavelId: null,
          recorrenciaId: r.id, historico: [{ status: 'publicada', em: agoraIso(), por: eu.id }]
        });
        S.atualizar('recorrencias', r.id, { ultimaPublicacao: dia });
        avisarInstituicoesProximas(d);
        criadas.push(d);
      });
    });
    return criadas.map((d) => enriquecerDoacao(d, eu));
  }, { perfis: ['doador'], aprovado: true });
  def('recorrencias.dispensarHoje', 'POST /recorrencias/:id/dispensa', ({ id }, { eu }) => {
    const r = S.obter('recorrencias', id);
    exigir(r && r.doadorId === eu.id, 'Recorrência não encontrada.');
    S.atualizar('recorrencias', id, { dispensadaEm: hoje() });
    return { ok: true };
  }, { perfis: ['doador'] });
  def('recorrencias.salvar', 'PUT /recorrencias/:id', ({ id, ativa, dias, quantidade }, { eu }) => {
    const r = S.obter('recorrencias', id);
    exigir(r && r.doadorId === eu.id, 'Recorrência não encontrada.');
    const patch = {};
    if (ativa != null) patch.ativa = !!ativa;
    if (dias) { exigir(dias.length, 'Escolha pelo menos um dia.', 'dias'); patch.dias = dias.map(Number); }
    if (quantidade != null) { exigir(Number(quantidade) > 0, 'Quantidade inválida.', 'quantidade'); patch.modelo = { ...r.modelo, quantidade: Number(quantidade) }; }
    return S.atualizar('recorrencias', id, patch);
  }, { perfis: ['doador'] });
  def('recorrencias.excluir', 'DELETE /recorrencias/:id', ({ id }, { eu }) => {
    const r = S.obter('recorrencias', id);
    exigir(r && r.doadorId === eu.id, 'Recorrência não encontrada.');
    S.remover('recorrencias', id);
    return { ok: true };
  }, { perfis: ['doador'] });

  /* =========================================================
     DOAÇÕES — INSTITUIÇÃO (reserva e coleta)
     ========================================================= */
  def('doacoes.disponiveis', 'GET /doacoes/disponiveis', (f = {}, { eu }) => {
    const livreKg = (eu.capacidadeKg || 0) - estoqueAtualKg(eu.id);
    let l = S.onde('doacoes', (d) => d.status === 'publicada' && d.validade >= hoje())
      .map((d) => enriquecerDoacao(d, eu));
    if (f.raioKm) l = l.filter((d) => d.distanciaKm <= f.raioKm);
    if (f.categoria) l = l.filter((d) => d.categoria === f.categoria);
    if (f.venceHoje) l = l.filter((d) => U.diasAte(d.validade) <= 0);
    if (f.refrigerado) l = l.filter((d) => d.armazenamento !== 'ambiente');
    if (f.cabeNoEstoque) l = l.filter((d) => d.pesoKg <= livreKg && (d.armazenamento === 'ambiente' || eu.refrigeracao));
    return l.sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, { perfis: ['instituicao'] });

  def('doacoes.reservar', 'POST /doacoes/:id/reserva', ({ id }, { eu }) => {
    const d = S.obter('doacoes', id);
    exigir(d && d.status === 'publicada', 'Esta doação não está mais disponível. Outra instituição pode ter reservado antes.');
    if (d.armazenamento !== 'ambiente') exigir(eu.refrigeracao, 'Esta doação precisa de refrigeração, e sua instituição informou que não tem. Atualize em Meu perfil, se já tiver.');
    const prazo = new Date(Date.now() + C.regras.prazoConfirmarResponsavelMin * 60000).toISOString();
    const n = registrarStatus(d, 'reservada', eu.id, { instituicaoId: eu.id, reservadaEm: agoraIso(), prazoResponsavel: prazo, responsavelId: null });
    notificar(d.doadorId, 'Doação reservada', `${eu.nome} reservou ${d.titulo} (${U.quantidade(d.quantidade, d.unidade)}).`, linkDoador(d));
    msgSistema(d.id, `${eu.nome} reservou esta doação.`);
    return enriquecerDoacao(n, eu);
  }, { perfis: ['instituicao'], aprovado: true });

  def('doacoes.definirResponsavel', 'PUT /doacoes/:id/responsavel', ({ id, voluntarioId }, { eu }) => {
    const d = doacaoDaInstituicao(id, eu);
    exigir(d.status === 'reservada', 'Só é possível definir o responsável em doações reservadas.');
    const v = S.obter('voluntarios', voluntarioId);
    exigir(v && v.instituicaoId === eu.id, 'Escolha um voluntário da sua equipe.', 'voluntarioId');
    exigir(v.disponivel, `${v.nome} está marcado como indisponível.`, 'voluntarioId');
    const n = S.atualizar('doacoes', d.id, { responsavelId: v.id, prazoResponsavel: null });
    notificar(d.doadorId, 'Retirada confirmada', `${v.nome}${v.veiculo ? ` (${v.veiculo})` : ''} vai retirar ${d.titulo} ${U.janela(d.janela)}.`, linkDoador(d));
    msgSistema(d.id, `${v.nome} foi definido para retirar a doação.`);
    return enriquecerDoacao(n, eu);
  }, { perfis: ['instituicao'] });

  def('doacoes.cancelarReserva', 'DELETE /doacoes/:id/reserva', ({ id, motivo }, { eu }) => {
    const d = doacaoDaInstituicao(id, eu);
    exigir(d.status === 'reservada', 'Só reservas ainda não coletadas podem ser canceladas.');
    exigir(motivo && motivo.trim().length >= 5, 'Explique o motivo para o doador.', 'motivo');
    const n = registrarStatus(d, 'publicada', eu.id, { instituicaoId: null, responsavelId: null, reservadaEm: null, prazoResponsavel: null, coleta: null });
    notificar(d.doadorId, 'Reserva cancelada', `${eu.nome} cancelou a reserva de ${d.titulo}. Ela voltou a ficar disponível. Motivo: ${motivo.trim()}`, linkDoador(d), 'urgente');
    msgSistema(d.id, `Reserva cancelada pela instituição: ${motivo.trim()}`);
    avisarInstituicoesProximas(n);
    return { ok: true };
  }, { perfis: ['instituicao'] });

  def('doacoes.iniciarColeta', 'POST /doacoes/:id/coleta', ({ id }, { eu }) => {
    const d = doacaoDaInstituicao(id, eu);
    exigir(d.status === 'reservada', 'A doação precisa estar reservada.');
    exigir(d.responsavelId, 'Defina quem vai retirar antes de iniciar a coleta.');
    const dist = U.distanciaKm(eu.geo, d.geo);
    const n = S.atualizar('doacoes', d.id, { coleta: { iniciadaEm: agoraIso(), duracaoSeg: C.demo.ativo ? C.demo.duracaoColetaSeg : Math.max(300, Math.round(dist * 180)), origem: eu.geo, destino: d.geo, distanciaKm: dist } });
    const v = S.obter('voluntarios', d.responsavelId);
    notificar(d.doadorId, 'Coleta a caminho', `${v ? v.nome : 'O responsável'} saiu para buscar ${d.titulo}. Acompanhe no mapa.`, linkDoador(d));
    msgSistema(d.id, `${v ? v.nome : 'O responsável'} saiu para a coleta.`);
    return enriquecerDoacao(n, eu);
  }, { perfis: ['instituicao'] });

  def('doacoes.confirmarColeta', 'POST /doacoes/:id/coleta/confirmacao', ({ id }, { eu }) => {
    const d = doacaoDaInstituicao(id, eu);
    exigir(d.status === 'reservada', 'A doação precisa estar reservada.');
    exigir(d.responsavelId, 'Defina quem retirou a doação.');
    const n = registrarStatus(d, 'coletada', eu.id, { coletadaEm: agoraIso(), coleta: { ...(d.coleta || {}), concluidaEm: agoraIso() } });
    notificar(d.doadorId, 'Doação coletada', `${eu.nome} coletou ${d.titulo}. Obrigado!`, linkDoador(d));
    return enriquecerDoacao(n, eu);
  }, { perfis: ['instituicao'] });

  def('doacoes.confirmarRecebimento', 'POST /doacoes/:id/recebimento', ({ id, quantidadeRecebida }, { eu }) => {
    const d = doacaoDaInstituicao(id, eu);
    exigir(d.status === 'coletada', 'Confirme a coleta antes do recebimento.');
    const q = quantidadeRecebida != null && quantidadeRecebida !== '' ? Number(quantidadeRecebida) : d.quantidade;
    exigir(q > 0 && q <= d.quantidade * 1.2, 'Quantidade recebida inválida.', 'quantidadeRecebida');
    const peso = U.pesoKg({ quantidade: q, unidade: d.unidade });
    const seq = (S.meta('sequenciaComprovante') || 100) + 1;
    S.meta('sequenciaComprovante', seq);
    const ano = new Date().getFullYear();
    let n;
    S.lote(() => {
      n = registrarStatus(d, 'entregue', eu.id, {
        entregueEm: agoraIso(), quantidadeRecebida: q, pesoEntregueKg: Math.round(peso * 10) / 10,
        beneficioValor: Math.round(peso * C.beneficioFiscal.valorPorKg * 100) / 100,
        comprovante: { numero: `NH-${ano}-${String(seq).padStart(6, '0')}`, codigo: Math.random().toString(36).slice(2, 8).toUpperCase() }
      });
      S.inserir('estoque', { instituicaoId: eu.id, doacaoId: d.id, origem: 'doacao', titulo: d.titulo, quantidade: q, unidade: d.unidade, categoria: d.categoria,
        validade: d.validade, armazenamento: d.armazenamento, entradaEm: agoraIso() });
      notificar(d.doadorId, 'Doação entregue', `${eu.nome} recebeu ${d.titulo}. O comprovante para o benefício fiscal já está disponível.`, 'doador.html#/beneficio');
      msgSistema(d.id, 'Recebimento confirmado. Doação concluída.');
      /* Aviso aos beneficiários da região, sem expor quem são */
      const cat = C.categorias.find((c) => c.id === d.categoria);
      const ate = eu.horario ? `Hoje, até as ${U.hora(eu.horario.fecha)}` : 'Hoje';
      S.onde('usuarios', (u) => u.perfil === 'beneficiario' && u.status === 'aprovado' && U.distanciaKm(u.geo, eu.geo) <= C.regras.raioAvisoBeneficiarioKm)
        .forEach((u) => notificar(u.id, 'Chegou alimento na sua região', `${ate}: ${cat ? cat.curto : 'alimentos'} em ${eu.nomeCurto || eu.nome}.`, 'beneficiario.html#/inicio', 'regiao'));
    });
    return enriquecerDoacao(n, eu);
  }, { perfis: ['instituicao'] });

  def('doacoes.daInstituicao', 'GET /doacoes?instituicao=me', ({ status } = {}, { eu }) => {
    let l = S.onde('doacoes', (d) => d.instituicaoId === eu.id);
    if (status === 'andamento') l = l.filter((d) => ['reservada', 'coletada'].includes(d.status));
    else if (status) l = l.filter((d) => d.status === status);
    return l.sort((a, b) => (b.reservadaEm || '').localeCompare(a.reservadaEm || '')).map((d) => enriquecerDoacao(d, eu));
  }, { perfis: ['instituicao'] });

  /* =========================================================
     ESTOQUE E DISTRIBUIÇÃO
     ========================================================= */
  def('estoque.listar', 'GET /estoque', (a, { eu }) => {
    const l = S.onde('estoque', (e) => e.instituicaoId === eu.id).map((e) => ({ ...e, pesoKg: U.pesoKg(e), diasParaVencer: U.diasAte(e.validade) }));
    return { itens: l.sort((a, b) => a.validade.localeCompare(b.validade)), totalKg: U.somar(l, (e) => e.pesoKg), capacidadeKg: eu.capacidadeKg || 0 };
  }, { perfis: ['instituicao'] });

  def('estoque.adicionar', 'POST /estoque', (x, { eu }) => {
    exigir(x.titulo && x.titulo.trim(), 'Informe o alimento.', 'titulo');
    exigir(Number(x.quantidade) > 0, 'Informe a quantidade.', 'quantidade');
    exigir(C.unidades.some((u) => u.id === x.unidade), 'Escolha a unidade.', 'unidade');
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(x.validade || ''), 'Informe a validade.', 'validade');
    return S.inserir('estoque', { instituicaoId: eu.id, origem: 'avulsa', titulo: x.titulo.trim(), quantidade: Number(x.quantidade), unidade: x.unidade,
      categoria: x.categoria || 'outros', validade: x.validade, armazenamento: x.armazenamento || 'ambiente', entradaEm: agoraIso(), observacao: (x.observacao || '').trim() });
  }, { perfis: ['instituicao'] });

  def('estoque.baixa', 'POST /estoque/:id/baixa', ({ id, quantidade, motivo }, { eu }) => {
    const e = S.obter('estoque', id);
    exigir(e && e.instituicaoId === eu.id, 'Item não encontrado.');
    const q = Number(quantidade);
    exigir(q > 0 && q <= e.quantidade, `Informe uma quantidade entre 0 e ${U.num(e.quantidade, 1)}.`, 'quantidade');
    exigir(motivo, 'Informe o motivo da baixa.', 'motivo');
    const resto = Math.round((e.quantidade - q) * 100) / 100;
    if (resto <= 0) S.remover('estoque', id); else S.atualizar('estoque', id, { quantidade: resto });
    S.inserir('distribuicoes', { instituicaoId: eu.id, em: agoraIso(), tipo: 'perda', motivo, pessoasAtendidas: 0,
      itens: [{ titulo: e.titulo, quantidade: q, unidade: e.unidade, categoria: e.categoria }], pesoKg: U.pesoKg({ quantidade: q, unidade: e.unidade }) });
    return { ok: true };
  }, { perfis: ['instituicao'] });

  def('distribuicao.registrar', 'POST /distribuicoes', ({ itens, pessoasAtendidas, tipo, pedidoId, codigo, observacao }, { eu }) => {
    exigir(itens && itens.length, 'Escolha pelo menos um item do estoque.', 'itens');
    exigir(Number(pessoasAtendidas) >= 1, 'Informe quantas pessoas foram atendidas.', 'pessoasAtendidas');
    const linhas = itens.map((i) => {
      const e = S.obter('estoque', i.estoqueId);
      exigir(e && e.instituicaoId === eu.id, 'Item de estoque não encontrado.', 'itens');
      const q = Number(i.quantidade);
      exigir(q > 0 && q <= e.quantidade, `Quantidade de ${e.titulo} maior que o estoque (${U.quantidade(e.quantidade, e.unidade)}).`, 'itens');
      return { e, q };
    });
    let pedido = null;
    if (pedidoId) {
      pedido = S.obter('pedidos', pedidoId);
      exigir(pedido && pedido.instituicaoId === eu.id && !['concluido', 'cancelado'].includes(pedido.status), 'Pedido não encontrado ou já encerrado.');
      exigir(String(codigo || '').trim() === pedido.codigo, 'O código não confere. Peça para a pessoa mostrar o código do pedido.', 'codigo');
    }
    let dist;
    S.lote(() => {
      linhas.forEach(({ e, q }) => {
        const resto = Math.round((e.quantidade - q) * 100) / 100;
        if (resto <= 0) S.remover('estoque', e.id); else S.atualizar('estoque', e.id, { quantidade: resto });
      });
      dist = S.inserir('distribuicoes', {
        instituicaoId: eu.id, em: agoraIso(), tipo: tipo || (pedido ? pedido.tipo : 'retirada'), pessoasAtendidas: Number(pessoasAtendidas), pedidoId: pedidoId || null,
        itens: linhas.map(({ e, q }) => ({ titulo: e.titulo, quantidade: q, unidade: e.unidade, categoria: e.categoria })),
        pesoKg: Math.round(U.somar(linhas, ({ e, q }) => U.pesoKg({ quantidade: q, unidade: e.unidade })) * 10) / 10, observacao: (observacao || '').trim()
      });
      if (pedido) {
        S.atualizar('pedidos', pedido.id, (p) => ({ status: 'concluido', concluidoEm: agoraIso(), enderecoEntrega: null, historico: [...(p.historico || []), { status: 'concluido', em: agoraIso() }] }));
        notificar(pedido.beneficiarioId, 'Pedido concluído', `Seu pedido na ${eu.nomeCurto || eu.nome} foi concluído. Conte como foi o atendimento.`, 'beneficiario.html#/pedidos');
      }
    });
    return dist;
  }, { perfis: ['instituicao'] });

  def('distribuicao.listar', 'GET /distribuicoes', ({ limite = 50 } = {}, { eu }) =>
    S.onde('distribuicoes', (d) => d.instituicaoId === eu.id).sort((a, b) => b.em.localeCompare(a.em)).slice(0, limite), { perfis: ['instituicao'] });

  /* =========================================================
     BENEFICIÁRIO: pontos de distribuição e pedidos
     ========================================================= */
  function ofertaDe(instId) {
    const cats = [...new Set(S.onde('estoque', (e) => e.instituicaoId === instId && e.validade >= hoje() && e.quantidade > 0).map((e) => e.categoria))];
    return cats.map((c) => (C.categorias.find((x) => x.id === c) || {}).curto).filter(Boolean);
  }
  def('beneficiario.pontos', 'GET /pontos-distribuicao', ({ geo } = {}, { eu }) => {
    const ref = geo && isFinite(geo.lat) ? geo : eu.geo;
    return S.onde('usuarios', (u) => u.perfil === 'instituicao' && ehAprovado(u) && u.horario)
      .map((u) => {
        const ab = U.aberto(u.horario);
        return { id: u.id, nome: u.nome, nomeCurto: u.nomeCurto, tipo: u.tipo, endereco: u.endereco, telefone: u.telefone, geo: u.geo, horario: u.horario,
          distanciaKm: U.distanciaKm(ref, u.geo), aberto: ab, proximaAbertura: ab ? null : U.proximaAbertura(u.horario), oferta: ofertaDe(u.id), avaliacao: mediaAvaliacoes(u.id) };
      })
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, { perfis: ['beneficiario'] });

  function pedidoParaBeneficiario(p) {
    const inst = usuario(p.instituicaoId);
    return { ...p, instituicao: inst ? { id: inst.id, nome: inst.nome, nomeCurto: inst.nomeCurto, endereco: inst.endereco, telefone: inst.telefone, horario: inst.horario, geo: inst.geo } : null,
      minhaAvaliacao: S.primeiro('avaliacoes', (a) => a.pedidoId === p.id) };
  }
  def('pedidos.criar', 'POST /pedidos', ({ instituicaoId, tipo, enderecoEntrega, observacao }, { eu }) => {
    const inst = usuario(instituicaoId);
    exigir(inst && inst.perfil === 'instituicao' && ehAprovado(inst), 'Ponto de distribuição não encontrado.');
    exigir(['retirada', 'entrega'].includes(tipo), 'Escolha retirada ou entrega.');
    const ativos = S.onde('pedidos', (p) => p.beneficiarioId === eu.id && !['concluido', 'cancelado'].includes(p.status));
    exigir(!ativos.some((p) => p.instituicaoId === instituicaoId), 'Você já tem um pedido em andamento neste local. Acompanhe em Meus pedidos.');
    exigir(ativos.length < C.regras.maxPedidosAtivosBeneficiario, `Você pode ter até ${C.regras.maxPedidosAtivosBeneficiario} pedidos em andamento.`);
    if (tipo === 'entrega') exigir(enderecoEntrega && enderecoEntrega.trim().length >= 8, 'Informe o endereço para a entrega.', 'enderecoEntrega');
    const codigo = String(1000 + Math.floor(Math.random() * 9000));
    const p = S.inserir('pedidos', { beneficiarioId: eu.id, instituicaoId, tipo, codigo, status: 'solicitado', enderecoEntrega: tipo === 'entrega' ? enderecoEntrega.trim() : null,
      observacao: (observacao || '').trim().slice(0, 200), historico: [{ status: 'solicitado', em: agoraIso() }] });
    if (tipo === 'entrega') S.atualizar('usuarios', eu.id, { enderecoEntrega: enderecoEntrega.trim() });
    notificar(instituicaoId, tipo === 'entrega' ? 'Novo pedido de entrega' : 'Novo pedido de retirada', `Pedido nº ${codigo}. Confirme em Distribuição.`, 'instituicao.html#/distribuicao');
    return pedidoParaBeneficiario(p);
  }, { perfis: ['beneficiario'] });

  def('pedidos.meus', 'GET /pedidos?beneficiario=me', (a, { eu }) =>
    S.onde('pedidos', (p) => p.beneficiarioId === eu.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map(pedidoParaBeneficiario), { perfis: ['beneficiario'] });

  def('pedidos.cancelar', 'POST /pedidos/:id/cancelamento', ({ id }, { eu }) => {
    const p = S.obter('pedidos', id);
    exigir(p && p.beneficiarioId === eu.id, 'Pedido não encontrado.');
    exigir(['solicitado', 'confirmado'].includes(p.status), 'Este pedido não pode mais ser cancelado. Fale com a instituição.');
    S.atualizar('pedidos', id, { status: 'cancelado', enderecoEntrega: null, historico: [...p.historico, { status: 'cancelado', em: agoraIso(), por: 'beneficiario' }] });
    notificar(p.instituicaoId, 'Pedido cancelado', `O pedido nº ${p.codigo} foi cancelado pela pessoa.`, 'instituicao.html#/distribuicao');
    return { ok: true };
  }, { perfis: ['beneficiario'] });

  /* A instituição vê só o necessário para atender (LGPD: minimização) */
  def('pedidos.daInstituicao', 'GET /pedidos?instituicao=me', ({ status } = {}, { eu }) => {
    let l = S.onde('pedidos', (p) => p.instituicaoId === eu.id);
    if (status === 'abertos') l = l.filter((p) => !['concluido', 'cancelado'].includes(p.status));
    return l.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map((p) => {
      const b = usuario(p.beneficiarioId) || {};
      const ativo = !['concluido', 'cancelado'].includes(p.status);
      return { id: p.id, codigo: p.codigo, tipo: p.tipo, status: p.status, criadoEm: p.criadoEm, observacao: p.observacao, historico: p.historico,
        apelido: b.apelido || 'Pessoa atendida', bairro: b.bairro || '',
        telefone: ativo && p.tipo === 'entrega' ? b.telefone : U.mascararTelefone(b.telefone),
        enderecoEntrega: ativo && p.tipo === 'entrega' ? p.enderecoEntrega : null };
    });
  }, { perfis: ['instituicao'] });

  def('pedidos.atualizar', 'PATCH /pedidos/:id', ({ id, status }, { eu }) => {
    const p = S.obter('pedidos', id);
    exigir(p && p.instituicaoId === eu.id, 'Pedido não encontrado.');
    const fluxo = { solicitado: ['confirmado', 'cancelado'], confirmado: ['pronto', 'saiu_entrega', 'cancelado'], pronto: ['cancelado'], saiu_entrega: ['cancelado'] };
    exigir((fluxo[p.status] || []).includes(status), 'Mudança de situação não permitida para este pedido.');
    S.atualizar('pedidos', id, { status, enderecoEntrega: status === 'cancelado' ? null : p.enderecoEntrega, historico: [...(p.historico || []), { status, em: agoraIso(), por: eu.id }] });
    const nome = eu.nomeCurto || eu.nome;
    const textos = {
      confirmado: `${nome} confirmou seu pedido nº ${p.codigo}. Avisaremos quando estiver pronto.`,
      pronto: `Seu pedido está pronto na ${nome}. Mostre o código ${p.codigo} na retirada.`,
      saiu_entrega: `Seu pedido saiu para entrega. Tenha o código ${p.codigo} em mãos.`,
      cancelado: `${nome} não conseguiu atender o pedido nº ${p.codigo}. Procure outro ponto no mapa.`
    };
    notificar(p.beneficiarioId, C.statusPedido[status].label, textos[status], 'beneficiario.html#/pedidos', status === 'pronto' ? 'urgente' : 'info');
    return { ok: true };
  }, { perfis: ['instituicao'] });

  /* =========================================================
     VOLUNTÁRIOS E ENTREGADORES
     ========================================================= */
  def('voluntarios.listar', 'GET /voluntarios', (a, { eu }) => S.onde('voluntarios', (v) => v.instituicaoId === eu.id)
    .map((v) => ({ ...v, emColeta: S.onde('doacoes', (d) => d.responsavelId === v.id && d.status === 'reservada').length }))
    .sort((a, b) => a.nome.localeCompare(b.nome)), { perfis: ['instituicao'] });

  def('voluntarios.salvar', 'PUT /voluntarios/:id', (x, { eu }) => {
    exigir(x.nome && x.nome.trim().length >= 3, 'Informe o nome completo.', 'nome');
    exigir(U.soDigitos(x.telefone).length >= 10, 'Informe um celular com DDD.', 'telefone');
    exigir(C.funcoesVoluntario.includes(x.funcao), 'Escolha a função.', 'funcao');
    const dados = { nome: x.nome.trim(), telefone: U.formatarTelefone(x.telefone), funcao: x.funcao, disponivel: !!x.disponivel, veiculo: (x.veiculo || '').trim() };
    if (x.id) {
      const v = S.obter('voluntarios', x.id);
      exigir(v && v.instituicaoId === eu.id, 'Voluntário não encontrado.');
      return S.atualizar('voluntarios', x.id, dados);
    }
    return S.inserir('voluntarios', { ...dados, instituicaoId: eu.id });
  }, { perfis: ['instituicao'] });

  def('voluntarios.remover', 'DELETE /voluntarios/:id', ({ id }, { eu }) => {
    const v = S.obter('voluntarios', id);
    exigir(v && v.instituicaoId === eu.id, 'Voluntário não encontrado.');
    exigir(!S.primeiro('doacoes', (d) => d.responsavelId === id && d.status === 'reservada'), `${v.nome} está responsável por uma coleta em andamento. Troque o responsável antes.`);
    S.remover('voluntarios', id);
    return { ok: true };
  }, { perfis: ['instituicao'] });

  /* =========================================================
     MENSAGENS (somente entre doador e instituição da mesma doação)
     ========================================================= */
  function participante(d, eu) { return d && (d.doadorId === eu.id || d.instituicaoId === eu.id); }
  def('chat.conversas', 'GET /conversas', (a, { eu }) => {
    const minhas = S.onde('doacoes', (d) => d.instituicaoId && participante(d, eu));
    return minhas.map((d) => {
      const msgs = S.onde('mensagens', (m) => m.doacaoId === d.id).sort((a, b) => a.em.localeCompare(b.em));
      const ultima = msgs[msgs.length - 1];
      const outroId = eu.id === d.doadorId ? d.instituicaoId : d.doadorId;
      return { doacaoId: d.id, titulo: d.titulo, quantidade: d.quantidade, unidade: d.unidade, status: d.status,
        outro: { id: outroId, nome: nomeDe(outroId) }, ultima: ultima ? { texto: ultima.texto, em: ultima.em, deMim: ultima.deId === eu.id } : null,
        naoLidas: msgs.filter((m) => m.paraId === eu.id && !m.lida).length, ordem: ultima ? ultima.em : d.reservadaEm || d.criadoEm };
    }).filter((c) => c.ultima || ['reservada', 'coletada'].includes(c.status))
      .sort((a, b) => (b.ordem || '').localeCompare(a.ordem || ''));
  }, { perfis: ['doador', 'instituicao'] });

  def('chat.mensagens', 'GET /conversas/:doacaoId/mensagens', ({ doacaoId }, { eu }) => {
    const d = S.obter('doacoes', doacaoId);
    exigir(participante(d, eu), 'Conversa não encontrada.');
    const naoLidas = S.onde('mensagens', (m) => m.doacaoId === doacaoId && m.paraId === eu.id && !m.lida);
    if (naoLidas.length) S.lote(() => naoLidas.forEach((m) => S.atualizar('mensagens', m.id, { lida: true })));
    return S.onde('mensagens', (m) => m.doacaoId === doacaoId).sort((a, b) => a.em.localeCompare(b.em))
      .map((m) => ({ ...m, deMim: m.deId === eu.id, sistema: m.deId === 'sistema', autor: m.deId === 'sistema' ? 'No Hunger' : nomeDe(m.deId) }));
  }, { perfis: ['doador', 'instituicao'] });

  def('chat.enviar', 'POST /conversas/:doacaoId/mensagens', ({ doacaoId, texto }, { eu }) => {
    const d = S.obter('doacoes', doacaoId);
    exigir(participante(d, eu) && d.instituicaoId, 'Conversa não encontrada.');
    const t = String(texto || '').trim();
    exigir(t.length >= 1, 'Escreva uma mensagem.', 'texto');
    exigir(t.length <= 1000, 'A mensagem pode ter até 1.000 caracteres.', 'texto');
    const paraId = eu.id === d.doadorId ? d.instituicaoId : d.doadorId;
    const m = S.inserir('mensagens', { doacaoId, deId: eu.id, paraId, texto: t, em: agoraIso(), lida: false });
    const pagina = usuario(paraId).perfil === 'doador' ? 'doador.html' : 'instituicao.html';
    const jaAvisado = S.primeiro('notificacoes', (n) => n.userId === paraId && !n.lida && n.tipo === 'mensagem' && n.ref === doacaoId);
    if (!jaAvisado) S.inserir('notificacoes', { userId: paraId, titulo: `Mensagem de ${eu.nomeCurto || eu.nome}`, texto: t.slice(0, 120), link: `${pagina}#/mensagens/${doacaoId}`, tipo: 'mensagem', ref: doacaoId, em: agoraIso(), lida: false });
    return { ...m, deMim: true, autor: eu.nome };
  }, { perfis: ['doador', 'instituicao'] });

  /* =========================================================
     NOTIFICAÇÕES
     ========================================================= */
  def('notificacoes.listar', 'GET /notificacoes', ({ limite = 30 } = {}, { eu }) => {
    const l = S.onde('notificacoes', (n) => n.userId === eu.id).sort((a, b) => b.em.localeCompare(a.em));
    return { itens: l.slice(0, limite), naoLidas: l.filter((n) => !n.lida).length };
  });
  def('notificacoes.marcarLida', 'POST /notificacoes/:id/lida', ({ id }, { eu }) => {
    const n = S.obter('notificacoes', id);
    if (n && n.userId === eu.id && !n.lida) S.atualizar('notificacoes', id, { lida: true });
    return { ok: true };
  });
  def('notificacoes.marcarTodas', 'POST /notificacoes/lidas', (a, { eu }) => {
    const l = S.onde('notificacoes', (n) => n.userId === eu.id && !n.lida);
    if (l.length) S.lote(() => l.forEach((n) => S.atualizar('notificacoes', n.id, { lida: true })));
    return { ok: true };
  });

  /* =========================================================
     AVALIAÇÕES
     ========================================================= */
  def('avaliacoes.criar', 'POST /avaliacoes', ({ doacaoId, pedidoId, nota, comentario }, { eu }) => {
    exigir([1, 2, 3, 4, 5].includes(Number(nota)), 'Escolha de 1 a 5 estrelas.', 'nota');
    let paraId, ref;
    if (pedidoId) {
      const p = S.obter('pedidos', pedidoId);
      exigir(p && p.beneficiarioId === eu.id && p.status === 'concluido', 'Só é possível avaliar pedidos concluídos.');
      exigir(!S.primeiro('avaliacoes', (a) => a.pedidoId === pedidoId), 'Você já avaliou este atendimento.');
      paraId = p.instituicaoId; ref = { pedidoId };
    } else {
      const d = S.obter('doacoes', doacaoId);
      exigir(participante(d, eu) && d.status === 'entregue', 'Só é possível avaliar doações entregues.');
      exigir(!S.primeiro('avaliacoes', (a) => a.doacaoId === doacaoId && a.deId === eu.id), 'Você já avaliou esta doação.');
      paraId = eu.id === d.doadorId ? d.instituicaoId : d.doadorId; ref = { doacaoId };
    }
    const a = S.inserir('avaliacoes', { deId: eu.id, paraId, nota: Number(nota), comentario: String(comentario || '').trim().slice(0, 500), em: agoraIso(), ...ref });
    const dest = usuario(paraId);
    const autor = eu.perfil === 'beneficiario' ? 'Uma pessoa atendida' : (eu.nomeCurto || eu.nome);
    notificar(paraId, 'Nova avaliação', `${autor} avaliou com ${nota} ${Number(nota) === 1 ? 'estrela' : 'estrelas'}.`, `${C.perfis[dest.perfil].pagina}#/${dest.perfil === 'doador' ? 'avaliacoes' : 'perfil'}`);
    return a;
  }, { perfis: ['doador', 'instituicao', 'beneficiario'] });

  def('avaliacoes.recebidas', 'GET /usuarios/:usuarioId/avaliacoes', ({ usuarioId } = {}, { eu }) => {
    const alvo = usuarioId || eu.id;
    const l = S.onde('avaliacoes', (a) => a.paraId === alvo).sort((a, b) => b.em.localeCompare(a.em));
    const dist = [5, 4, 3, 2, 1].map((n) => ({ nota: n, total: l.filter((a) => a.nota === n).length }));
    return { ...mediaAvaliacoes(alvo), distribuicao: dist,
      itens: l.map((a) => {
        const autor = usuario(a.deId);
        const d = a.doacaoId ? S.obter('doacoes', a.doacaoId) : null;
        return { ...a, autor: autor && autor.perfil === 'beneficiario' ? 'Pessoa atendida' : nomeDe(a.deId), referencia: d ? d.titulo : 'Atendimento' };
      }) };
  });

  def('avaliacoes.pendentes', 'GET /avaliacoes/pendentes', (a, { eu }) => {
    if (eu.perfil === 'beneficiario') {
      return S.onde('pedidos', (p) => p.beneficiarioId === eu.id && p.status === 'concluido' && !S.primeiro('avaliacoes', (x) => x.pedidoId === p.id))
        .map((p) => ({ pedidoId: p.id, titulo: `Atendimento em ${nomeDe(p.instituicaoId)}`, em: p.concluidoEm }));
    }
    const campo = eu.perfil === 'doador' ? 'doadorId' : 'instituicaoId';
    return S.onde('doacoes', (d) => d[campo] === eu.id && d.status === 'entregue' && !S.primeiro('avaliacoes', (x) => x.doacaoId === d.id && x.deId === eu.id))
      .sort((a, b) => (b.entregueEm || '').localeCompare(a.entregueEm || ''))
      .map((d) => ({ doacaoId: d.id, titulo: d.titulo, quantidade: d.quantidade, unidade: d.unidade, em: d.entregueEm,
        outro: nomeDe(eu.perfil === 'doador' ? d.instituicaoId : d.doadorId) }));
  }, { perfis: ['doador', 'instituicao', 'beneficiario'] });

  /* =========================================================
     RELATÓRIOS DE IMPACTO E BENEFÍCIO FISCAL
     ========================================================= */
  function porMes(lista, campoData, valorFn, ano) {
    const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i, label: U.MESES[i], valor: 0, quantidade: 0 }));
    lista.forEach((x) => {
      const d = new Date(x[campoData]);
      if (d.getFullYear() !== ano) return;
      meses[d.getMonth()].valor += valorFn(x); meses[d.getMonth()].quantidade += 1;
    });
    return meses;
  }
  def('relatorios.doador', 'GET /relatorios/doador', ({ ano } = {}, { eu }) => {
    ano = Number(ano) || new Date().getFullYear();
    const todas = S.onde('doacoes', (d) => d.doadorId === eu.id);
    const entregues = todas.filter((d) => d.status === 'entregue' && new Date(d.entregueEm).getFullYear() === ano);
    const totalKg = U.somar(entregues, (d) => d.pesoEntregueKg || U.pesoKg(d));
    const porInst = U.agrupar(entregues, (d) => d.instituicaoId);
    return {
      ano, totalKg: Math.round(totalKg), refeicoes: Math.round(totalKg * C.regras.refeicoesPorKg), concluidas: entregues.length,
      andamento: todas.filter((d) => ['publicada', 'reservada', 'coletada'].includes(d.status)).length,
      beneficio: Math.round(U.somar(entregues, (d) => d.beneficioValor) * 100) / 100,
      porMes: porMes(entregues, 'entregueEm', (d) => d.pesoEntregueKg || U.pesoKg(d), ano),
      porInstituicao: Object.entries(porInst).map(([id, l]) => ({ id, nome: nomeDe(id), doacoes: l.length, kg: Math.round(U.somar(l, (d) => d.pesoEntregueKg || U.pesoKg(d))) })).sort((a, b) => b.kg - a.kg),
      avaliacao: mediaAvaliacoes(eu.id)
    };
  }, { perfis: ['doador'] });

  def('beneficio.resumo', 'GET /beneficio-fiscal', ({ ano } = {}, { eu }) => {
    ano = Number(ano) || new Date().getFullYear();
    const l = S.onde('doacoes', (d) => d.doadorId === eu.id && d.status === 'entregue' && new Date(d.entregueEm).getFullYear() === ano)
      .sort((a, b) => b.entregueEm.localeCompare(a.entregueEm));
    return { ano, total: Math.round(U.somar(l, (d) => d.beneficioValor) * 100) / 100, quantidade: l.length, kg: Math.round(U.somar(l, (d) => d.pesoEntregueKg || 0)),
      valorPorKg: C.beneficioFiscal.valorPorKg, observacao: C.beneficioFiscal.observacao,
      itens: l.map((d) => ({ id: d.id, titulo: d.titulo, quantidade: d.quantidade, unidade: d.unidade, entregueEm: d.entregueEm, pesoKg: d.pesoEntregueKg,
        valor: d.beneficioValor, comprovante: d.comprovante, instituicao: nomeDe(d.instituicaoId) })) };
  }, { perfis: ['doador'] });

  def('beneficio.comprovantes', 'GET /comprovantes', ({ id, ano } = {}, { eu }) => {
    let l;
    if (id) {
      const d = S.obter('doacoes', id);
      exigir(d && d.status === 'entregue', 'Comprovante disponível apenas para doações entregues.');
      exigir(eu.perfil === 'governo' || d.doadorId === eu.id || d.instituicaoId === eu.id, 'Sem acesso a este comprovante.');
      l = [d];
    } else {
      ano = Number(ano) || new Date().getFullYear();
      l = S.onde('doacoes', (d) => d.doadorId === eu.id && d.status === 'entregue' && new Date(d.entregueEm).getFullYear() === ano).sort((a, b) => a.entregueEm.localeCompare(b.entregueEm));
    }
    const doadorDe = (d) => usuario(d.doadorId), instDe = (d) => usuario(d.instituicaoId);
    return l.map((d) => ({
      id: d.id, numero: d.comprovante && d.comprovante.numero, codigo: d.comprovante && d.comprovante.codigo, titulo: d.titulo, quantidade: d.quantidadeRecebida || d.quantidade,
      unidade: d.unidade, categoria: U.categoriaLabel(d.categoria), pesoKg: d.pesoEntregueKg, valor: d.beneficioValor, entregueEm: d.entregueEm, coletadaEm: d.coletadaEm,
      doador: { nome: doadorDe(d).nome, documento: doadorDe(d).documento, endereco: doadorDe(d).endereco },
      instituicao: { nome: instDe(d).nome, documento: instDe(d).documento, endereco: instDe(d).endereco }
    }));
  }, { perfis: ['doador', 'instituicao', 'governo'] });

  def('relatorios.instituicao', 'GET /relatorios/instituicao', ({ ano } = {}, { eu }) => {
    ano = Number(ano) || new Date().getFullYear();
    const recebidas = S.onde('doacoes', (d) => d.instituicaoId === eu.id && d.status === 'entregue' && new Date(d.entregueEm).getFullYear() === ano);
    const dists = S.onde('distribuicoes', (d) => d.instituicaoId === eu.id && d.tipo !== 'perda' && new Date(d.em).getFullYear() === ano);
    const perdas = S.onde('distribuicoes', (d) => d.instituicaoId === eu.id && d.tipo === 'perda' && new Date(d.em).getFullYear() === ano);
    const kgRec = U.somar(recebidas, (d) => d.pesoEntregueKg || U.pesoKg(d));
    const porDoador = U.agrupar(recebidas, (d) => d.doadorId);
    return {
      ano, kgRecebidos: Math.round(kgRec), doacoesRecebidas: recebidas.length, pessoasAtendidas: U.somar(dists, (d) => d.pessoasAtendidas),
      distribuicoes: dists.length, kgDistribuidos: Math.round(U.somar(dists, (d) => d.pesoKg)), kgPerdidos: Math.round(U.somar(perdas, (d) => d.pesoKg)),
      refeicoes: Math.round(kgRec * C.regras.refeicoesPorKg),
      porMesRecebido: porMes(recebidas, 'entregueEm', (d) => d.pesoEntregueKg || U.pesoKg(d), ano),
      porMesPessoas: porMes(dists, 'em', (d) => d.pessoasAtendidas, ano),
      porDoador: Object.entries(porDoador).map(([id, l]) => ({ id, nome: nomeDe(id), doacoes: l.length, kg: Math.round(U.somar(l, (d) => d.pesoEntregueKg || U.pesoKg(d))) })).sort((a, b) => b.kg - a.kg),
      avaliacao: mediaAvaliacoes(eu.id)
    };
  }, { perfis: ['instituicao'] });

  /* =========================================================
     GOVERNO
     ========================================================= */
  function statusDocumentos(u) {
    const exigidos = C.documentosObrigatorios[u.perfil] || [];
    const enviados = (u.documentos || []).map((d) => d.nome);
    const faltando = exigidos.filter((n) => !enviados.includes(n));
    if (faltando.length) return { ok: false, texto: `Falta ${faltando[0].toLowerCase()}${faltando.length > 1 ? ` e mais ${faltando.length - 1}` : ''}`, faltando };
    const vencendo = (u.documentos || []).find((d) => d.validade && U.diasAte(d.validade) <= C.regras.validadeAlvaraAvisoDias);
    if (vencendo) {
      const n = U.diasAte(vencendo.validade);
      return { ok: false, aviso: true, texto: n < 0 ? `${vencendo.nome} vencido` : `${vencendo.nome.split(' ')[0]} vence em ${n} dias`, faltando: [] };
    }
    return { ok: true, texto: 'Documentos completos', faltando: [] };
  }
  function cadastroResumo(u) {
    return { id: u.id, nome: u.nome, perfil: u.perfil, tipo: u.tipo, documento: u.documento, cidade: u.endereco && u.endereco.cidade, uf: u.endereco && u.endereco.uf,
      status: u.status, criadoEm: u.criadoEm, docs: statusDocumentos(u), motivoReprovacao: u.motivoReprovacao };
  }
  function kgEntregueMes(ano, mes) {
    return U.somar(S.onde('doacoes', (d) => d.status === 'entregue' && d.entregueEm && new Date(d.entregueEm).getFullYear() === ano && new Date(d.entregueEm).getMonth() === mes), (d) => d.pesoEntregueKg || U.pesoKg(d));
  }
  function serieMensal() {
    const agora = new Date();
    const base = C.governo.consolidadoToneladas;
    return base.map((t, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (base.length - 1 - i), 1);
      const vivo = kgEntregueMes(d.getFullYear(), d.getMonth()) / 1000;
      return { label: U.MESES[d.getMonth()], ano: d.getFullYear(), mes: d.getMonth(), toneladas: Math.round((t + vivo) * 10) / 10 };
    });
  }
  function pontosCalor() {
    /* Demanda consolidada + pedidos agrupados em células de ~1 km; células com menos de N pedidos são ocultadas */
    const pontos = (S.meta('demandaRegional') || []).map((r) => ({ geo: r.geo, peso: r.peso, nome: r.nome, fonte: 'consolidado' }));
    const celulas = {};
    S.onde('pedidos', (p) => true).forEach((p) => {
      const b = usuario(p.beneficiarioId);
      if (!b || !b.geo) return;
      const k = `${Math.round(b.geo.lat * 100)}:${Math.round(b.geo.lng * 100)}`;
      (celulas[k] = celulas[k] || { lat: 0, lng: 0, n: 0 });
      celulas[k].lat += b.geo.lat; celulas[k].lng += b.geo.lng; celulas[k].n += 1;
    });
    const max = Math.max(1, ...Object.values(celulas).map((c) => c.n));
    Object.values(celulas).filter((c) => c.n >= C.governo.minimoPorCelulaMapa)
      .forEach((c) => pontos.push({ geo: { lat: Math.round((c.lat / c.n) * 100) / 100, lng: Math.round((c.lng / c.n) * 100) / 100 }, peso: 0.4 + 0.5 * (c.n / max), pedidos: c.n, fonte: 'pedidos' }));
    return pontos;
  }
  def('governo.painel', 'GET /governo/painel', () => {
    const anoAtual = new Date().getFullYear();
    const serie = serieMensal();
    const doadores = S.onde('usuarios', (u) => u.perfil === 'doador' && u.status === 'aprovado').length;
    const insts = S.onde('usuarios', (u) => u.perfil === 'instituicao' && u.status === 'aprovado').length;
    const kgAno = U.somar(S.onde('doacoes', (d) => d.status === 'entregue' && new Date(d.entregueEm).getFullYear() === anoAtual), (d) => d.pesoEntregueKg || U.pesoKg(d));
    const pend = S.onde('usuarios', (u) => u.status === 'pendente').sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    const repassado = U.somar(S.onde('repasses', (r) => r.data.startsWith(String(anoAtual))), (r) => r.valor);
    return {
      kpis: {
        toneladasMes: serie[serie.length - 1].toneladas,
        refeicoesAno: C.governo.base.refeicoes + Math.round(kgAno * C.regras.refeicoesPorKg),
        doadores: C.governo.base.doadores + doadores,
        instituicoes: C.governo.base.instituicoes + insts
      },
      serie, pendentes: pend.map(cadastroResumo), totalPendentes: pend.length,
      repasses: { total: repassado, orcamento: C.governo.orcamentoAnual, ano: anoAtual },
      calor: pontosCalor(), estado: C.governo.estado, ano: anoAtual
    };
  }, { perfis: ['governo'] });

  def('governo.cadastros', 'GET /governo/cadastros', ({ status = 'pendente', perfil } = {}) =>
    S.onde('usuarios', (u) => ['doador', 'instituicao'].includes(u.perfil) && (status === 'todos' || u.status === status) && (!perfil || u.perfil === perfil))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map(cadastroResumo), { perfis: ['governo'] });

  def('governo.cadastro', 'GET /governo/cadastros/:id', ({ id }) => {
    const u = usuario(id);
    exigir(u && ['doador', 'instituicao'].includes(u.perfil), 'Cadastro não encontrado.');
    const s = semSegredos(u);
    return { ...s, docs: statusDocumentos(u), documentos: (u.documentos || []).map((d) => ({ ...d })), exigidos: C.documentosObrigatorios[u.perfil],
      doacoes: S.onde('doacoes', (d) => d.doadorId === id || d.instituicaoId === id).length, avaliacao: mediaAvaliacoes(id) };
  }, { perfis: ['governo'] });

  def('governo.revisar', 'POST /governo/cadastros/:id/decisao', ({ id, decisao, motivo }, { eu }) => {
    const u = usuario(id);
    exigir(u && ['doador', 'instituicao'].includes(u.perfil), 'Cadastro não encontrado.');
    exigir(['aprovar', 'reprovar', 'suspender'].includes(decisao), 'Decisão inválida.');
    if (decisao !== 'aprovar') exigir(motivo && motivo.trim().length >= 10, 'Explique o motivo (será enviado ao solicitante).', 'motivo');
    const pagina = C.perfis[u.perfil].pagina;
    if (decisao === 'aprovar') {
      S.atualizar('usuarios', id, { status: 'aprovado', aprovadoEm: agoraIso(), aprovadoPor: eu.id, motivoReprovacao: null });
      notificar(id, 'Cadastro aprovado', u.perfil === 'doador' ? 'Tudo certo! Você já pode publicar doações.' : 'Tudo certo! Você já pode reservar doações.', `${pagina}#/inicio`);
    } else {
      S.atualizar('usuarios', id, { status: decisao === 'suspender' ? 'suspenso' : 'reprovado', motivoReprovacao: motivo.trim(), revisadoEm: agoraIso(), revisadoPor: eu.id });
      notificar(id, decisao === 'suspender' ? 'Cadastro suspenso' : 'Cadastro precisa de ajustes', motivo.trim(), `${pagina}#/perfil`, 'urgente');
    }
    return cadastroResumo(usuario(id));
  }, { perfis: ['governo'] });

  def('governo.mapaCalor', 'GET /governo/mapa-calor', () => ({ pontos: pontosCalor(),
    pontosDistribuicao: S.onde('usuarios', (u) => u.perfil === 'instituicao' && u.status === 'aprovado').map((u) => ({ id: u.id, nome: u.nome, geo: u.geo })) }), { perfis: ['governo'] });

  def('governo.relatorio', 'GET /governo/relatorio', ({ ano } = {}) => {
    ano = Number(ano) || new Date().getFullYear();
    const ent = S.onde('doacoes', (d) => d.status === 'entregue' && new Date(d.entregueEm).getFullYear() === ano);
    const kgF = (d) => d.pesoEntregueKg || U.pesoKg(d);
    const porCat = U.agrupar(ent, (d) => d.categoria);
    const porCidade = U.agrupar(ent, (d) => { const u = usuario(d.doadorId); return u && u.endereco ? u.endereco.cidade : '—'; });
    const porInst = U.agrupar(ent, (d) => d.instituicaoId);
    const dists = S.onde('distribuicoes', (d) => d.tipo !== 'perda' && new Date(d.em).getFullYear() === ano);
    return {
      ano, totalKg: Math.round(U.somar(ent, kgF)), doacoes: ent.length, pessoasAtendidas: U.somar(dists, (d) => d.pessoasAtendidas),
      beneficioConcedido: Math.round(U.somar(ent, (d) => d.beneficioValor || 0)),
      porMes: porMes(ent, 'entregueEm', kgF, ano),
      porCategoria: Object.entries(porCat).map(([c, l]) => ({ categoria: U.categoriaLabel(c), doacoes: l.length, kg: Math.round(U.somar(l, kgF)) })).sort((a, b) => b.kg - a.kg),
      porCidade: Object.entries(porCidade).map(([c, l]) => ({ cidade: c, doacoes: l.length, kg: Math.round(U.somar(l, kgF)) })).sort((a, b) => b.kg - a.kg),
      porInstituicao: Object.entries(porInst).map(([id, l]) => ({ nome: nomeDe(id), doacoes: l.length, kg: Math.round(U.somar(l, kgF)),
        pessoas: U.somar(dists.filter((x) => x.instituicaoId === id), (x) => x.pessoasAtendidas) })).sort((a, b) => b.kg - a.kg)
    };
  }, { perfis: ['governo'] });

  def('governo.repasses', 'GET /governo/repasses', ({ ano } = {}) => {
    ano = Number(ano) || new Date().getFullYear();
    const l = S.onde('repasses', (r) => r.data.startsWith(String(ano))).sort((a, b) => b.data.localeCompare(a.data)).map((r) => ({ ...r, instituicao: nomeDe(r.instituicaoId) }));
    return { ano, itens: l, total: U.somar(l, (r) => r.valor), orcamento: C.governo.orcamentoAnual,
      instituicoes: S.onde('usuarios', (u) => u.perfil === 'instituicao' && u.status === 'aprovado').map((u) => ({ id: u.id, nome: u.nome })) };
  }, { perfis: ['governo'] });

  def('governo.criarRepasse', 'POST /governo/repasses', ({ instituicaoId, valor, data, descricao }, { eu }) => {
    const inst = usuario(instituicaoId);
    exigir(inst && inst.perfil === 'instituicao' && inst.status === 'aprovado', 'Escolha uma instituição aprovada.', 'instituicaoId');
    exigir(Number(valor) > 0, 'Informe o valor.', 'valor');
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(data || ''), 'Informe a data.', 'data');
    exigir(descricao && descricao.trim().length >= 5, 'Descreva a finalidade do repasse.', 'descricao');
    const ano = data.slice(0, 4);
    const usado = U.somar(S.onde('repasses', (r) => r.data.startsWith(ano)), (r) => r.valor);
    exigir(usado + Number(valor) <= C.governo.orcamentoAnual, `O valor ultrapassa o orçamento disponível (${U.dinheiro(C.governo.orcamentoAnual - usado)}).`, 'valor');
    const r = S.inserir('repasses', { instituicaoId, valor: Math.round(Number(valor) * 100) / 100, data, descricao: descricao.trim(), registradoPor: eu.id });
    notificar(instituicaoId, 'Repasse registrado', `Repasse de ${U.dinheiro(r.valor)}: ${r.descricao}.`, 'instituicao.html#/relatorios');
    return r;
  }, { perfis: ['governo'] });

  /* Conjuntos anonimizados para dados abertos (sem nomes de beneficiários, sem telefones, sem endereços pessoais) */
  def('governo.dadosAbertos', 'GET /dados-abertos/:conjunto', ({ conjunto }) => {
    const kgF = (d) => d.pesoEntregueKg || U.pesoKg(d);
    if (conjunto === 'doacoes') {
      return S.onde('doacoes', (d) => d.status === 'entregue').map((d) => {
        const doa = usuario(d.doadorId) || {}, ins = usuario(d.instituicaoId) || {};
        return { data_entrega: (d.entregueEm || '').slice(0, 10), categoria: U.categoriaLabel(d.categoria), peso_kg: kgF(d),
          tipo_doador: doa.tipo || '', municipio_doador: (doa.endereco || {}).cidade || '', instituicao: ins.nome || '', municipio_instituicao: (ins.endereco || {}).cidade || '' };
      });
    }
    if (conjunto === 'distribuicoes') {
      return S.onde('distribuicoes', (d) => d.tipo !== 'perda').map((d) => ({ data: d.em.slice(0, 10), instituicao: nomeDe(d.instituicaoId), tipo: d.tipo, pessoas_atendidas: d.pessoasAtendidas, peso_kg: d.pesoKg }));
    }
    if (conjunto === 'instituicoes') {
      return S.onde('usuarios', (u) => u.perfil === 'instituicao' && u.status === 'aprovado').map((u) => ({ nome: u.nome, tipo: u.tipo, cnpj: u.documento, municipio: u.endereco.cidade, uf: u.endereco.uf, bairro: u.endereco.bairro, horario: U.horarioTexto(u.horario) }));
    }
    if (conjunto === 'repasses') {
      return S.todos('repasses').map((r) => ({ data: r.data, instituicao: nomeDe(r.instituicaoId), valor: r.valor, finalidade: r.descricao }));
    }
    falha('Conjunto de dados desconhecido.', 'nao_encontrado', 404);
  }, { perfis: ['governo'] });

  /* =========================================================
     CENTRAL DE AJUDA E CONTADORES
     ========================================================= */
  def('ajuda.abrirChamado', 'POST /chamados', ({ assunto, mensagem, contato }, { eu }) => {
    exigir(assunto && assunto.trim().length >= 3, 'Informe o assunto.', 'assunto');
    exigir(mensagem && mensagem.trim().length >= 10, 'Descreva o que aconteceu (pelo menos 10 letras).', 'mensagem');
    if (!eu) exigir(contato && contato.trim().length >= 8, 'Informe um e-mail ou telefone para respondermos.', 'contato');
    const protocolo = `${new Date().getFullYear()}${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
    return S.inserir('chamados', { userId: eu ? eu.id : null, assunto: assunto.trim(), mensagem: mensagem.trim(), contato: (contato || '').trim(), status: 'aberto', protocolo });
  }, { publico: true });
  def('ajuda.meusChamados', 'GET /chamados', (a, { eu }) => S.onde('chamados', (c) => c.userId === eu.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)));

  def('painel.contadores', 'GET /me/contadores', (a, { eu }) => {
    const notif = S.onde('notificacoes', (n) => n.userId === eu.id && !n.lida).length;
    const msgs = S.onde('mensagens', (m) => m.paraId === eu.id && !m.lida).length;
    if (eu.perfil === 'doador') {
      return { notificacoes: notif, mensagens: msgs, andamento: S.onde('doacoes', (d) => d.doadorId === eu.id && ['publicada', 'reservada', 'coletada'].includes(d.status)).length,
        recorrentesHoje: pendentesRecorrencia(eu).length };
    }
    if (eu.perfil === 'instituicao') {
      return { notificacoes: notif, mensagens: msgs,
        perto: S.onde('doacoes', (d) => d.status === 'publicada' && d.validade >= hoje() && U.distanciaKm(eu.geo, d.geo) <= C.regras.raioPadraoKm).length,
        reservas: S.onde('doacoes', (d) => d.instituicaoId === eu.id && ['reservada', 'coletada'].includes(d.status)).length,
        pedidos: S.onde('pedidos', (p) => p.instituicaoId === eu.id && p.status === 'solicitado').length };
    }
    if (eu.perfil === 'beneficiario') {
      return { notificacoes: notif, pedidos: S.onde('pedidos', (p) => p.beneficiarioId === eu.id && ['pronto', 'saiu_entrega'].includes(p.status)).length };
    }
    return { notificacoes: notif, cadastros: S.onde('usuarios', (u) => u.status === 'pendente').length };
  });

  def('demo.reiniciar', 'POST /demo/reiniciar', () => { NH.store.reiniciar(); NH.sessao.limpar(); return { ok: true }; }, { publico: true });

  /* ---------- Monta NH.api.<grupo>.<acao> ---------- */
  const api = { ApiError, rotas: () => Object.values(registro).map((e) => ({ nome: e.nome, rota: e.rota, perfis: e.perfis || (e.publico ? ['público'] : ['autenticado']) })) };
  Object.keys(registro).forEach((nome) => {
    const [grupo, acao] = nome.split('.');
    api[grupo] = api[grupo] || {};
    api[grupo][acao] = (args) => chamar(nome, args);
  });
  api.usuarioAtual = () => semSegredos(usuarioAtual());
  api.manutencao = () => manutencao(true);
  NH.api = api;
})();
