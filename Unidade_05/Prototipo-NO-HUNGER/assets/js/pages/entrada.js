/* =========================================================
   NO hunger — Entrada (login por perfil) e cadastro
   index.html  → escolha do perfil e login
   cadastro.html → cadastro de doador ou instituição, com documentos
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui, api = NH.api;
  const { html, raw } = U;
  NH.store.carregar();

  const PERFIS = [
    { id: 'doador', icone: 'store', titulo: 'Sou doador', texto: 'Supermercado, padaria, restaurante ou indústria' },
    { id: 'instituicao', icone: 'heart', titulo: 'Sou instituição', texto: 'ONG, igreja ou instituição de caridade' },
    { id: 'beneficiario', icone: 'home', titulo: 'Preciso de alimento', texto: 'Encontre pontos de distribuição perto de você' },
    { id: 'governo', icone: 'building', titulo: 'Governo', texto: 'Gestão do programa e aprovação de cadastros' }
  ];
  const cabecalhoPublico = (titulo, texto) => html`
    <img class="auth-logo" src="assets/img/logo-no-hunger.png" alt="No Hunger" width="200" height="173">
    <div class="col gap-6 text-center"><h1 class="auth-title">${titulo}</h1>${texto ? html`<p class="auth-text">${texto}</p>` : ''}</div>`;

  /* =========================================================
     LOGIN
     ========================================================= */
  function paginaEntrada() {
    const q = U.query();
    let perfil = PERFIS.some((p) => p.id === q.perfil) ? q.perfil : null;
    const sessao = NH.sessao.obter();
    const atual = sessao && api.usuarioAtual();
    const raiz = document.getElementById('app');

    function formEmpresa(p) {
      const demo = C.demo.ativo && C.demo.contas[p];
      return html`<form class="form" data-login novalidate>
        ${ui.campo({ label: 'E-mail', name: 'email', tipo: 'email', obrigatorio: true, attrs: 'autocomplete="username" autofocus' })}
        ${ui.campo({ label: 'Senha', name: 'senha', tipo: 'password', obrigatorio: true, attrs: 'autocomplete="current-password"' })}
        <div class="row justify-between items-center gap-8">${ui.checkbox({ label: 'Manter conectado neste aparelho', name: 'manter' })}<button type="button" class="link" data-acao="esqueci">Esqueci minha senha</button></div>
        <button type="submit" class="btn btn-primary-lg btn--block">Entrar</button>
        ${p !== 'governo' ? html`<div class="divider">ainda não tem cadastro?</div><a class="btn btn-outline-lg btn--block" href="cadastro.html?perfil=${p}">Criar cadastro de ${p === 'doador' ? 'doador' : 'instituição'}</a>`
          : html`<p class="note text-center">As contas do governo são criadas pelo órgão gestor do programa.</p>`}
        ${demo ? html`<button type="button" class="link text-center" data-acao="demo">Entrar com a conta de demonstração</button>` : ''}
      </form>`;
    }
    function formBeneficiario(etapa, tel = '', demoCodigo = '') {
      if (etapa === 'telefone') {
        return html`<form class="form" data-codigo novalidate>
          ${ui.campo({ label: 'Seu celular com DDD', name: 'telefone', tipo: 'tel', valor: tel, obrigatorio: true, placeholder: '(11) 90000-0000', attrs: 'autocomplete="tel" inputmode="tel" data-mascara="telefone" autofocus', dica: 'Vamos mandar um código por SMS ou WhatsApp. Não precisa de senha.' })}
          <button type="submit" class="btn btn-primary-lg btn--block">Receber código</button>
          ${C.demo.ativo ? html`<button type="button" class="link text-center" data-acao="demo-ben">Usar o celular de demonstração</button>` : ''}
        </form>`;
      }
      if (etapa === 'codigo') {
        return html`<form class="form" data-verificar novalidate>
          <p class="auth-text">Enviamos um código de 4 números para <strong>${tel}</strong>.</p>
          ${demoCodigo ? ui.alerta('Demonstração', `Seu código é ${demoCodigo}. Em uso real, ele chega por SMS ou WhatsApp.`, { icone: 'chat', tipo: 'info' }) : ''}
          ${ui.campo({ label: 'Código', name: 'codigo', obrigatorio: true, classeInput: 'input--code', attrs: 'inputmode="numeric" maxlength="4" autocomplete="one-time-code" autofocus' })}
          <button type="submit" class="btn btn-primary-lg btn--block">Entrar</button>
          <button type="button" class="link text-center" data-acao="trocar-tel">Trocar número</button>
        </form>`;
      }
      return html`<form class="form" data-cadastro-ben novalidate>
        ${ui.alerta('Primeira vez por aqui', 'Só precisamos de três informações. Seus dados não aparecem para ninguém além da instituição que atender você.', { icone: 'shield', tipo: 'info' })}
        ${ui.campo({ label: 'Como podemos chamar você?', name: 'apelido', obrigatorio: true, attrs: 'autocomplete="given-name" autofocus', placeholder: 'Ex.: Maria' })}
        ${ui.campo({ label: 'Bairro onde você está', name: 'bairro', obrigatorio: true })}
        ${ui.campo({ label: 'Cidade', name: 'cidade', valor: 'São Paulo', obrigatorio: true })}
        ${ui.checkbox({ label: 'Este número também é WhatsApp', name: 'whatsapp', marcado: true })}
        <div class="field" data-campo="consentimento">${ui.checkbox({ label: 'Autorizo o uso destes dados para encontrar alimento perto de mim. Posso apagar tudo quando quiser.', name: 'consentimento' })}</div>
        <button type="button" class="btn btn-outline btn--block" data-acao="localizacao">${ui.icone('pin', { tam: 20 })}Usar minha localização (mais preciso)</button>
        <button type="submit" class="btn btn-primary-lg btn--block">Começar</button>
      </form>`;
    }

    let etapaBen = 'telefone', telBen = '', codigoDemo = '', geoBen = null;
    function desenhar() {
      const escolhido = PERFIS.find((p) => p.id === perfil);
      raiz.innerHTML = String(html`<main class="auth" id="conteudo"><div class="auth-card">
        ${cabecalhoPublico(escolhido ? escolhido.titulo : 'Bem-vindo ao No Hunger', escolhido ? escolhido.texto : 'Alimento que sobraria, chegando a quem precisa.')}
        ${q.expirou ? ui.alerta('Sua sessão terminou', 'Entre novamente para continuar.', { icone: 'clock' }) : ''}
        ${atual ? html`<div class="alert alert--info">${ui.icone('user', { tam: 24, cls: 'alert__icon' })}<div class="col gap-8"><div class="alert__title">Você já entrou como ${atual.nome || atual.apelido}</div>
          <div class="row gap-10"><a class="btn btn-primary" href="${C.perfis[atual.perfil].pagina}">Continuar</a><button type="button" class="btn btn-outline" data-acao="sair">Sair</button></div></div></div>` : ''}
        ${!escolhido ? html`<div class="col gap-10"><h2 class="card-title">Como você vai usar o No Hunger?</h2>
          <div class="choice-grid" role="list">${PERFIS.map((p) => html`<button type="button" class="choice" role="listitem" data-perfil="${p.id}">
            <span class="choice__icon">${ui.icone(p.icone, { cor: C.cores.brown })}</span><span><span class="choice__title" style="display:block">${p.titulo}</span><span class="choice__text">${p.texto}</span></span></button>`)}</div></div>`
          : html`${perfil === 'beneficiario' ? formBeneficiario(etapaBen, telBen, codigoDemo) : formEmpresa(perfil)}
            <button type="button" class="link text-center" data-acao="trocar-perfil">${ui.icone('back', { tam: 18 })} Escolher outro perfil</button>`}
        <p class="note text-center"><a class="link" href="ajuda.html">Central de ajuda</a> · ${C.suporte.telefone}</p>
      </div></main>`);
      ligar();
    }
    function ligar() {
      NH.comum.ligarMascaras(raiz);
      ui.delegar(raiz, {
        'trocar-perfil': () => { perfil = null; etapaBen = 'telefone'; history.replaceState(null, '', 'index.html'); desenhar(); },
        sair: async () => { await api.auth.sair(); location.reload(); },
        esqueci: async () => {
          await ui.modalForm({ titulo: 'Recuperar senha', sub: 'Enviaremos um link para criar uma nova senha.', ok: 'Enviar link',
            campos: ui.campo({ label: 'E-mail', name: 'email', tipo: 'email', obrigatorio: true, attrs: 'autofocus' }),
            aoEnviar: async (d) => { const r = await api.auth.recuperarSenha(d); ui.toast(r.mensagem); return true; } });
        },
        demo: () => {
          const f = raiz.querySelector('[data-login]'), c = C.demo.contas[perfil];
          f.email.value = c.email; f.senha.value = c.senha; f.requestSubmit();
        },
        'demo-ben': () => { const f = raiz.querySelector('[data-codigo]'); f.telefone.value = C.demo.contas.beneficiario.telefone; f.requestSubmit(); },
        'trocar-tel': () => { etapaBen = 'telefone'; desenhar(); },
        localizacao: (b) => ui.executar(b, async () => { geoBen = await NH.comum.usarLocalizacao(); b.textContent = 'Localização registrada ✓'; })
      });
      raiz.querySelectorAll('[data-perfil]').forEach((b) => b.addEventListener('click', () => {
        perfil = b.dataset.perfil; history.replaceState(null, '', `index.html?perfil=${perfil}`); desenhar();
      }));
      const fl = raiz.querySelector('[data-login]');
      if (fl) ui.aoEnviar(fl, async (d) => { const r = await api.auth.entrar({ ...d, perfil }); location.href = r.destino; });
      const fc = raiz.querySelector('[data-codigo]');
      if (fc) ui.aoEnviar(fc, async (d) => { const r = await api.auth.solicitarCodigo(d); telBen = U.formatarTelefone(d.telefone); codigoDemo = r.demoCodigo || ''; etapaBen = 'codigo'; desenhar(); });
      const fv = raiz.querySelector('[data-verificar]');
      if (fv) ui.aoEnviar(fv, async (d) => {
        const r = await api.auth.verificarCodigo({ telefone: telBen, codigo: d.codigo, manter: true });
        if (r.novo) { etapaBen = 'cadastro'; desenhar(); } else location.href = r.destino;
      });
      const fb = raiz.querySelector('[data-cadastro-ben]');
      if (fb) ui.aoEnviar(fb, async (d) => { const r = await api.auth.cadastrar({ ...d, perfil: 'beneficiario', telefone: telBen, geo: geoBen }); location.href = r.destino; });
    }
    desenhar();
  }

  /* =========================================================
     CADASTRO DE DOADOR OU INSTITUIÇÃO
     ========================================================= */
  function paginaCadastro() {
    const q = U.query();
    const perfil = q.perfil === 'instituicao' ? 'instituicao' : q.perfil === 'beneficiario' ? null : 'doador';
    if (!perfil) { location.replace('index.html?perfil=beneficiario'); return; }
    const raiz = document.getElementById('app');
    const ETAPAS = perfil === 'instituicao' ? ['Instituição', 'Endereço e horário', 'Documentos', 'Acesso'] : ['Empresa', 'Endereço', 'Documentos', 'Acesso'];
    const dados = { perfil, endereco: { uf: 'SP' }, documentos: [], horario: { dias: [1, 2, 3, 4, 5], abre: '08:00', fecha: '17:00' }, refrigeracao: false };
    let etapa = 0;
    const tipos = perfil === 'doador' ? C.tiposDoador : C.tiposInstituicao;
    const exigidos = C.documentosObrigatorios[perfil];

    const passos = [
      () => html`<div class="form-grid">
        ${ui.campo({ label: perfil === 'doador' ? 'Razão social' : 'Nome da instituição', name: 'nome', valor: dados.nome || '', obrigatorio: true, classe: 'span-all', attrs: 'autofocus' })}
        ${ui.campo({ label: 'Nome curto', name: 'nomeCurto', valor: dados.nomeCurto || '', opcional: true, dica: 'Como aparece no topo e nas mensagens.' })}
        ${ui.campo({ label: 'CNPJ', name: 'documento', valor: dados.documento || '', obrigatorio: true, attrs: 'inputmode="numeric" data-mascara="cnpj"' })}
        ${ui.campo({ label: 'Tipo', name: 'tipo', valor: dados.tipo || '', opcoes: tipos, placeholder: 'Escolha', obrigatorio: true })}
        ${ui.campo({ label: 'Nome do responsável', name: 'responsavel', valor: dados.responsavel || '', obrigatorio: true, attrs: 'autocomplete="name"' })}
        ${ui.campo({ label: 'Telefone', name: 'telefone', valor: dados.telefone || '', obrigatorio: true, attrs: 'inputmode="tel" data-mascara="telefone" autocomplete="tel"' })}
        ${perfil === 'instituicao' ? html`${ui.campo({ label: 'Capacidade do estoque (kg)', name: 'capacidadeKg', tipo: 'number', valor: dados.capacidadeKg || '', attrs: 'min="0" step="10"', opcional: true })}
          <div class="field"><span class="field__label">Refrigeração</span>${ui.checkbox({ label: 'Temos geladeira ou câmara fria', name: 'refrigeracao', marcado: dados.refrigeracao })}</div>` : ''}
      </div>`,
      () => html`<div class="form-grid">${NH.comum.camposEndereco(dados.endereco)}</div>
        ${perfil === 'instituicao' ? html`<h2 class="card-title">Horário em que as pessoas podem buscar alimento</h2><div class="form-grid">${NH.comum.camposHorario(dados.horario)}</div>` : ''}`,
      () => html`<p class="auth-text" style="font-size:16px;line-height:24px">O governo confere estes documentos para aprovar o cadastro${perfil === 'doador' ? ' e liberar o benefício fiscal' : ''}. Você pode enviar depois, mas a aprovação só acontece com todos.</p>
        <div class="doc-list">${exigidos.map((nome) => {
          const d = dados.documentos.find((x) => x.nome === nome);
          return html`<div class="list-row" data-campo="doc_${nome}"><div><div class="list-row__title">${nome}</div><div class="list-row__sub">${d ? `${d.arquivo} · ${U.num(d.tamanho / 1024)} KB` : 'PDF, JPG ou PNG, até 5 MB'}</div></div>
            <label class="btn ${d ? 'btn-outline' : 'btn-primary'} btn-sm">${d ? 'Trocar' : 'Escolher arquivo'}<input type="file" accept="application/pdf,image/*" data-doc="${nome}" class="sr-only"></label></div>`;
        })}</div>`,
      () => html`<div class="form-grid">
        ${ui.campo({ label: 'E-mail de acesso', name: 'email', tipo: 'email', valor: dados.email || '', obrigatorio: true, classe: 'span-all', attrs: 'autocomplete="email"' })}
        ${ui.campo({ label: 'Senha', name: 'senha', tipo: 'password', obrigatorio: true, attrs: 'autocomplete="new-password" minlength="8"', dica: 'Pelo menos 8 caracteres.' })}
        ${ui.campo({ label: 'Repita a senha', name: 'senha2', tipo: 'password', obrigatorio: true, attrs: 'autocomplete="new-password"' })}
      </div>
      <div class="field" data-campo="aceite">${ui.checkbox({ label: 'Li e aceito os termos de uso e a política de privacidade do programa No Hunger.', name: 'aceite', marcado: dados.aceite })}</div>`
    ];

    function desenhar() {
      raiz.innerHTML = String(html`<main class="auth" id="conteudo"><div class="auth-card auth-card--wide">
        ${cabecalhoPublico(perfil === 'doador' ? 'Cadastro de doador' : 'Cadastro de instituição', `Etapa ${etapa + 1} de ${ETAPAS.length}: ${ETAPAS[etapa]}`)}
        <div class="stepper" role="img" aria-label="Etapa ${etapa + 1} de ${ETAPAS.length}">${ETAPAS.map((_, i) => html`<div class="stepper__bar${i <= etapa ? ' is-done' : ''}"></div>`)}${ETAPAS.map((n) => html`<div class="stepper__label" aria-hidden="true">${n}</div>`)}</div>
        <form class="form" novalidate data-etapa>${passos[etapa]()}
          <div class="form-actions" style="justify-content:space-between">
            ${etapa ? html`<button type="button" class="btn btn-outline" data-acao="voltar">${ui.icone('back', { tam: 20 })}Voltar</button>` : html`<a class="link" href="index.html?perfil=${perfil}">Já tenho cadastro</a>`}
            <button type="submit" class="btn btn-primary-lg">${etapa === ETAPAS.length - 1 ? 'Enviar cadastro' : 'Continuar'}</button>
          </div></form>
      </div></main>`);
      const form = raiz.querySelector('form');
      NH.comum.ligarMascaras(form);
      raiz.querySelectorAll('[data-doc]').forEach((inp) => inp.addEventListener('change', async () => {
        const f = inp.files[0];
        if (!f) return;
        if (f.size > C.regras.tamanhoMaxDocumentoMb * 1048576) { ui.toast(`O arquivo deve ter até ${C.regras.tamanhoMaxDocumentoMb} MB.`, 'aviso'); return; }
        const dataUrl = f.type.startsWith('image/') ? await U.reduzirImagem(f, 1200, 0.7) : null;
        dados.documentos = dados.documentos.filter((d) => d.nome !== inp.dataset.doc).concat({ nome: inp.dataset.doc, arquivo: f.name, tipo: f.type, tamanho: f.size, dataUrl });
        guardar(form); desenhar();
      }));
      ui.delegar(raiz, { voltar: () => { guardar(form); etapa--; desenhar(); } });
      ui.aoEnviar(form, async (d) => {
        guardar(form, d);
        validarEtapa(d);
        if (etapa < ETAPAS.length - 1) { etapa++; desenhar(); return; }
        try {
          const r = await api.auth.cadastrar(dados);
          location.href = `${r.destino}#/inicio`;
        } catch (err) {
          const idx = { nome: 0, documento: 0, telefone: 0, responsavel: 0, tipo: 0, 'endereco.logradouro': 1, 'horario.dias': 1 }[err.campo];
          if (idx != null && idx !== etapa) { etapa = idx; desenhar(); setTimeout(() => ui.mostrarErro(raiz.querySelector('form'), err), 50); return; }
          throw err;
        }
      });
    }
    function guardar(form, d = ui.lerForm(form)) {
      Object.entries(d).forEach(([k, v]) => {
        if (k === 'endereco') dados.endereco = { ...dados.endereco, ...v };
        else if (k === 'horario') dados.horario = { ...dados.horario, ...v, dias: (v.dias || dados.horario.dias).map(Number) };
        else dados[k] = v;
      });
    }
    function validarEtapa(d) {
      const erro = (m, campo) => { throw new NH.api.ApiError(m, 'validacao', 422, campo); };
      if (etapa === 0) {
        if (!d.nome || d.nome.trim().length < 3) erro('Informe o nome.', 'nome');
        if (!U.cnpjValido(d.documento)) erro('CNPJ inválido. Confira os números.', 'documento');
        if (!d.tipo) erro('Escolha o tipo.', 'tipo');
        if (!d.responsavel) erro('Informe o nome do responsável.', 'responsavel');
        if (U.soDigitos(d.telefone).length < 10) erro('Informe um telefone com DDD.', 'telefone');
      }
      if (etapa === 1) {
        ['logradouro', 'bairro', 'cidade', 'uf'].forEach((k) => { if (!d.endereco[k]) erro('Preencha este campo.', `endereco.${k}`); });
        if (perfil === 'instituicao' && (!d.horario.dias || !d.horario.dias.length)) erro('Escolha pelo menos um dia.', 'horario.dias');
      }
      if (etapa === 3) {
        if (!U.emailValido(d.email)) erro('Informe um e-mail válido.', 'email');
        if (!d.senha || d.senha.length < 8) erro('A senha precisa ter pelo menos 8 caracteres.', 'senha');
        if (d.senha !== d.senha2) erro('As senhas não são iguais.', 'senha2');
        if (!d.aceite) erro('É preciso aceitar os termos para continuar.', 'aceite');
      }
    }
    desenhar();
  }

  /* =========================================================
     CENTRAL DE AJUDA PÚBLICA
     ========================================================= */
  function paginaAjuda() {
    const raiz = document.getElementById('app');
    raiz.innerHTML = String(html`<header class="public-header"><a class="m-brand" href="index.html" aria-label="No Hunger, entrada">${ui.marca(44)}<div class="m-brand__word" style="font-size:22px">NO <span>hunger</span></div></a>
      <a class="btn btn-outline" href="index.html">Entrar</a></header>
      <main class="main" id="conteudo" style="max-width:1100px;margin:0 auto"><header class="page-header"><div><h1 class="page-title">Central de ajuda</h1>
        <p class="page-subtitle">Dúvidas sobre o No Hunger e contato com o suporte, ${C.suporte.horario}.</p></div></header>
        ${NH.comum.conteudoAjuda(null, { publico: true })}</main>`);
    NH.comum.ligarAjuda(raiz);
  }

  const pagina = document.body.dataset.pagina;
  if (pagina === 'cadastro') paginaCadastro();
  else if (pagina === 'ajuda') paginaAjuda();
  else paginaEntrada();
})();
