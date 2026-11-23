/* =========================================================
   NO hunger — Telas e blocos compartilhados entre perfis
   Perfil, Central de ajuda, Mensagens, Avaliações, linha do tempo.
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui;
  const { html, raw } = U;
  const api = () => NH.api;

  /* ---------- Blocos ---------- */
  function linhaDoTempo(historico = []) {
    const nomes = { publicada: 'Publicada', reservada: 'Reservada', coletada: 'Coletada', entregue: 'Entregue à instituição', cancelada: 'Cancelada', expirada: 'Expirada',
      solicitado: 'Pedido enviado', confirmado: 'Confirmado', pronto: 'Pronto para retirar', saiu_entrega: 'Saiu para entrega', concluido: 'Concluído', cancelado: 'Cancelado' };
    return html`<ol class="timeline">${historico.map((h) => html`<li class="timeline__item"><span class="timeline__dot" aria-hidden="true"></span>
      <div><div class="timeline__title">${nomes[h.status] || h.status}${h.motivo ? html` <span class="text-muted">· ${h.motivo}</span>` : ''}</div><div class="timeline__time">${U.dataHora(h.em)}</div></div></li>`)}</ol>`;
  }
  function blocoAvaliacoes(r, { limite = 6 } = {}) {
    if (!r.total) return ui.vazio('Ainda sem avaliações', 'As avaliações aparecem depois das primeiras entregas.');
    return html`<div class="row gap-20 items-center">
        <div><div class="big-money">${U.num(r.media, 1)}</div>${ui.estrelas(r.media, 22)}<div class="note">${U.plural(r.total, 'avaliação', 'avaliações')}</div></div>
        <div class="col gap-4 grow" aria-label="Distribuição das notas">${r.distribuicao.map((d) => html`<div class="row items-center gap-8"><span class="note nowrap" style="width:16px">${d.nota}</span>
          <div class="progress grow"><div class="progress__fill" style="width:${r.total ? Math.round((d.total / r.total) * 100) : 0}%"></div></div><span class="note nowrap" style="width:28px;text-align:right">${d.total}</span></div>`)}</div>
      </div>
      <div class="col">${r.itens.slice(0, limite).map((a) => html`<div class="list-row"><div class="grow"><div class="row items-center gap-8"><span class="list-row__title">${a.autor}</span>${ui.estrelas(a.nota, 16)}</div>
        ${a.comentario ? html`<div class="auth-text" style="font-size:15px;line-height:22px">“${a.comentario}”</div>` : ''}<div class="list-row__sub">${a.referencia} · ${U.dataLonga(a.em)}</div></div></div>`)}</div>`;
  }
  async function avaliar({ doacaoId, pedidoId, titulo, sub }) {
    const r = await ui.modalForm({
      titulo: titulo || 'Avaliar', sub, ok: 'Enviar avaliação',
      campos: html`${ui.entradaEstrelas('nota')}${ui.campo({ label: 'Comentário', name: 'comentario', tipo: 'textarea', opcional: true, placeholder: 'Conte como foi (opcional)' })}`,
      aoEnviar: async (d) => {
        if (!d.nota) throw new NH.api.ApiError('Escolha de 1 a 5 estrelas.', 'validacao', 422, 'nota');
        return api().avaliacoes.criar({ doacaoId, pedidoId, nota: Number(d.nota), comentario: d.comentario });
      }
    });
    if (r) ui.toast('Obrigado! Sua avaliação foi enviada.');
    return r;
  }
  function exportarCSV(nome, linhas, colunas) {
    U.baixar(nome, U.csv(linhas, colunas), 'text/csv;charset=utf-8');
    ui.toast('Arquivo baixado.');
  }
  function usarLocalizacao() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Seu navegador não permite localização.')); return; }
      navigator.geolocation.getCurrentPosition((p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => reject(new Error('Não conseguimos sua localização. Verifique a permissão do navegador.')), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });
  }
  /* Busca de endereço pelo CEP (ViaCEP, serviço público) */
  async function buscarCEP(cep) {
    const d = U.soDigitos(cep);
    if (d.length !== 8) return null;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      return j.erro ? null : { logradouro: j.logradouro, bairro: j.bairro, cidade: j.localidade, uf: j.uf };
    } catch (e) { return null; }
  }
  function ligarCEP(raiz) {
    const cep = raiz.querySelector('[name="endereco.cep"]');
    if (!cep) return;
    cep.addEventListener('input', () => { cep.value = U.formatarCEP(cep.value); });
    cep.addEventListener('change', async () => {
      const e = await buscarCEP(cep.value);
      if (!e) return;
      ['logradouro', 'bairro', 'cidade', 'uf'].forEach((k) => { const el = raiz.querySelector(`[name="endereco.${k}"]`); if (el && e[k] && !el.value) el.value = e[k]; });
      ui.toast('Endereço preenchido pelo CEP. Confira o número.');
    });
  }
  function ligarMascaras(raiz) {
    raiz.querySelectorAll('[data-mascara="telefone"]').forEach((el) => el.addEventListener('input', () => { el.value = U.formatarTelefone(el.value); }));
    raiz.querySelectorAll('[data-mascara="cnpj"]').forEach((el) => el.addEventListener('input', () => { el.value = U.formatarCNPJ(el.value); }));
    ligarCEP(raiz);
  }
  function camposEndereco(e = {}) {
    return html`${ui.campo({ label: 'CEP', name: 'endereco.cep', valor: e.cep || '', attrs: 'inputmode="numeric" autocomplete="postal-code"', dica: 'Preenchemos o resto pelo CEP.' })}
      ${ui.campo({ label: 'Rua e número', name: 'endereco.logradouro', valor: e.logradouro || '', obrigatorio: true, attrs: 'autocomplete="street-address"' })}
      ${ui.campo({ label: 'Bairro', name: 'endereco.bairro', valor: e.bairro || '', obrigatorio: true })}
      ${ui.campo({ label: 'Cidade', name: 'endereco.cidade', valor: e.cidade || '', obrigatorio: true, attrs: 'autocomplete="address-level2"' })}
      ${ui.campo({ label: 'UF', name: 'endereco.uf', valor: e.uf || 'SP', obrigatorio: true, attrs: 'maxlength="2" autocomplete="address-level1"' })}`;
  }
  function camposHorario(h = { dias: [1, 2, 3, 4, 5], abre: '08:00', fecha: '17:00' }) {
    return html`<div class="span-all">${ui.chipsEscolha({ legenda: 'Dias de atendimento', name: 'horario.dias[]', opcoes: C.diasSemana.map((d, i) => ({ id: i, label: d })), valores: h.dias })}</div>
      ${ui.campo({ label: 'Abre às', name: 'horario.abre', tipo: 'time', valor: h.abre, obrigatorio: true })}
      ${ui.campo({ label: 'Fecha às', name: 'horario.fecha', tipo: 'time', valor: h.fecha, obrigatorio: true })}`;
  }

  /* ---------- Documentos ---------- */
  function blocoDocumentos(eu) {
    const exigidos = C.documentosObrigatorios[eu.perfil] || [];
    const docs = eu.documentos || [];
    return html`<div class="doc-list">${exigidos.map((nome) => {
      const d = docs.find((x) => x.nome === nome);
      const vence = d && d.validade ? U.diasAte(d.validade) : null;
      const situacao = !d ? html`<span class="tag tag--xs tag--aviso">Falta enviar</span>`
        : vence != null && vence <= C.regras.validadeAlvaraAvisoDias ? html`<span class="tag tag--xs tag--aviso">${vence < 0 ? 'Vencido' : `Vence em ${vence} dias`}</span>`
          : html`<span class="tag tag--xs tag--ok">Enviado</span>`;
      return html`<div class="list-row"><div><div class="list-row__title">${nome}</div><div class="list-row__sub">${d ? `${d.arquivo} · enviado em ${U.dataLonga(d.enviadoEm)}${d.validade ? ` · validade ${U.dataLonga(d.validade)}` : ''}` : 'Obrigatório para aprovação'}</div></div>
        <div class="list-row__actions">${situacao}<button type="button" class="btn btn-outline btn-sm" data-acao="enviar-doc" data-nome="${nome}">${d ? 'Substituir' : 'Enviar'}</button></div></div>`;
    })}</div>`;
  }
  async function enviarDocumento(nome, aoConcluir) {
    const pedeValidade = /alvar|licen/i.test(nome);
    await ui.modalForm({
      titulo: `Enviar ${nome.toLowerCase()}`, sub: `PDF ou foto, até ${C.regras.tamanhoMaxDocumentoMb} MB.`, ok: 'Enviar documento',
      campos: html`<div class="field" data-campo="arquivo"><span class="field__label">Arquivo</span><label class="upload">${ui.icone('upload', { tam: 28 })}<span class="col"><strong data-nome-arquivo>Escolher arquivo</strong><span class="note">PDF, JPG ou PNG</span></span>
        <input type="file" name="arquivoFile" accept="application/pdf,image/*" required></label></div>
        ${pedeValidade ? ui.campo({ label: 'Validade do documento', name: 'validade', tipo: 'date' }) : ''}`,
      aoMontar: (el) => {
        const inp = el.querySelector('input[type=file]');
        inp.addEventListener('change', () => { el.querySelector('[data-nome-arquivo]').textContent = inp.files[0] ? inp.files[0].name : 'Escolher arquivo'; });
      },
      aoEnviar: async (dados, form) => {
        const f = form.querySelector('input[type=file]').files[0];
        if (!f) throw new NH.api.ApiError('Selecione o arquivo.', 'validacao', 422, 'arquivo');
        /* Em produção o arquivo vai para o armazenamento do backend (upload multipart). Aqui guardamos só imagens pequenas. */
        const dataUrl = f.type.startsWith('image/') ? await U.reduzirImagem(f, 1200, 0.7) : null;
        return api().usuarios.adicionarDocumento({ nome, arquivo: f.name, tipo: f.type, tamanho: f.size, dataUrl, validade: dados.validade || null });
      }
    }).then((r) => { if (r) { ui.toast('Documento enviado.'); if (aoConcluir) aoConcluir(); } });
  }

  /* =========================================================
     TELA: MEU PERFIL
     ========================================================= */
  async function perfil(ctx) {
    const eu = await api().usuarios.eu();
    NH.app.eu = eu;
    const ehEmpresa = ['doador', 'instituicao'].includes(eu.perfil);
    const ehBen = eu.perfil === 'beneficiario';
    const aprovado = eu.status === 'aprovado';
    const avals = eu.perfil === 'instituicao' ? await api().avaliacoes.recebidas() : null;
    const tipos = eu.perfil === 'doador' ? C.tiposDoador : C.tiposInstituicao;
    const suportaNotif = 'Notification' in window;

    const dados = ehBen
      ? html`<div class="form-grid">
          ${ui.campo({ label: 'Como podemos chamar você', name: 'apelido', valor: eu.apelido, obrigatorio: true })}
          ${ui.campo({ label: 'Celular', name: 'telefoneSoLeitura', valor: eu.telefone, attrs: 'readonly', dica: 'Para trocar o número, crie um novo acesso.' })}
          ${ui.campo({ label: 'Bairro', name: 'bairro', valor: eu.bairro, obrigatorio: true })}
          ${ui.campo({ label: 'Cidade', name: 'cidade', valor: eu.cidade })}
          ${ui.campo({ label: 'Prefere', name: 'preferencia', valor: eu.preferencia, opcoes: [{ id: 'retirada', label: 'Retirar no local' }, { id: 'entrega', label: 'Receber em casa' }] })}
          ${ui.campo({ label: 'Endereço para entrega', name: 'enderecoEntrega', valor: eu.enderecoEntrega || '', opcional: true, classe: 'span-all', dica: 'Só a instituição que fizer a entrega vê este endereço, e só durante a entrega.' })}
        </div>`
      : eu.perfil === 'governo'
        ? html`<div class="form-grid">${ui.campo({ label: 'Seu nome', name: 'nomeCurto', valor: eu.nomeCurto, obrigatorio: true })}${ui.campo({ label: 'Cargo', name: 'cargo', valor: eu.cargo || '' })}
            ${ui.campo({ label: 'E-mail', name: 'email', tipo: 'email', valor: eu.email, obrigatorio: true })}${ui.campo({ label: 'Órgão', name: 'orgaoSoLeitura', valor: eu.orgao || eu.nome, attrs: 'readonly' })}</div>`
        : html`<div class="form-grid">
          ${ui.campo({ label: eu.perfil === 'doador' ? 'Razão social' : 'Nome da instituição', name: 'nome', valor: eu.nome, obrigatorio: true, attrs: aprovado ? 'readonly' : '', dica: aprovado ? 'Para alterar, fale com a Central de ajuda.' : '' })}
          ${ui.campo({ label: 'Nome curto', name: 'nomeCurto', valor: eu.nomeCurto, dica: 'Aparece no topo e nas mensagens.' })}
          ${ui.campo({ label: 'CNPJ', name: 'cnpjSoLeitura', valor: eu.documento, attrs: 'readonly' })}
          ${ui.campo({ label: 'Tipo', name: 'tipo', valor: eu.tipo, opcoes: tipos })}
          ${ui.campo({ label: 'Responsável', name: 'responsavel', valor: eu.responsavel || '', obrigatorio: true })}
          ${ui.campo({ label: 'Telefone', name: 'telefone', valor: eu.telefone, obrigatorio: true, attrs: 'data-mascara="telefone" inputmode="tel"' })}
          ${ui.campo({ label: 'E-mail de acesso', name: 'email', tipo: 'email', valor: eu.email, obrigatorio: true, classe: 'span-all' })}
          ${eu.perfil === 'instituicao' ? html`${ui.campo({ label: 'Capacidade do estoque (kg)', name: 'capacidadeKg', tipo: 'number', valor: eu.capacidadeKg || 0, attrs: 'min="0" step="10"', dica: 'Usada no filtro "Cabe no meu estoque".' })}
            <div class="field"><span class="field__label">Refrigeração</span>${ui.checkbox({ label: 'Temos geladeira ou câmara fria', name: 'refrigeracao', marcado: eu.refrigeracao })}</div>` : ''}
        </div>`;

    const corpo = html`
      ${eu.status === 'reprovado' ? html`<div class="alert">${ui.icone('alert', { tam: 24, cls: 'alert__icon' })}<div class="col gap-8"><div class="alert__title">O governo pediu ajustes no cadastro</div>
        <div class="alert__text">${eu.motivoReprovacao}</div><div><button type="button" class="btn btn-primary" data-acao="reenviar">Reenviar para análise</button></div></div></div>` : ''}
      <div class="section-row section-row--start">
        <div class="col-2 col gap-20">
          <form class="card form" data-form="dados" novalidate><h2 class="card-title">Dados ${ehBen ? 'do cadastro' : 'da conta'}</h2>${dados}
            <div class="form-actions"><button type="submit" class="btn btn-primary">Salvar alterações</button></div></form>
          ${ehEmpresa ? html`<form class="card form" data-form="endereco" novalidate><div class="card-head"><h2 class="card-title">Endereço</h2>
              <button type="button" class="link" data-acao="localizacao">Usar minha localização no mapa</button></div>
            <div class="form-grid">${camposEndereco(eu.endereco)}</div>
            <div class="form-actions"><button type="submit" class="btn btn-primary">Salvar endereço</button></div></form>` : ''}
          ${eu.perfil === 'instituicao' ? html`<form class="card form" data-form="horario" novalidate><div><h2 class="card-title">Horário de atendimento</h2>
              <p class="card-sub">Aparece para as pessoas no mapa de pontos de distribuição.</p></div>
            <div class="form-grid">${camposHorario(eu.horario)}</div><div class="form-actions"><button type="submit" class="btn btn-primary">Salvar horário</button></div></form>` : ''}
          ${ehEmpresa ? html`<section class="card gap-6" aria-label="Documentos"><div class="card-head"><h2 class="card-title">Documentos</h2>${eu.status === 'aprovado' ? html`<span class="tag tag--sm tag--ok">Cadastro aprovado</span>` : html`<span class="tag tag--sm tag--aviso">Em análise</span>`}</div>
            <p class="card-sub" style="margin-bottom:6px">Conferidos pelo governo para liberar o benefício fiscal e a participação no programa.</p>${blocoDocumentos(eu)}</section>` : ''}
          ${avals ? html`<section class="card gap-16"><h2 class="card-title">Avaliações recebidas</h2>${blocoAvaliacoes(avals)}</section>` : ''}
        </div>
        <div class="col-1 col gap-20">
          <section class="card gap-10"><h2 class="card-title">Avisos no aparelho</h2>
            <p class="card-sub">Receba um aviso do navegador quando houver doação nova, reserva ou mensagem, mesmo com a aba em segundo plano.</p>
            ${suportaNotif ? ui.checkbox({ label: 'Mostrar avisos do navegador', name: 'notifNavegador', marcado: eu.notificacoesNavegador && Notification.permission === 'granted', attrs: 'data-notif-navegador' })
              : html`<p class="note">Este navegador não oferece avisos.</p>`}</section>
          ${eu.perfil !== 'beneficiario' ? html`<form class="card form" data-form="senha" novalidate><h2 class="card-title">Alterar senha</h2>
            ${ui.campo({ label: 'Senha atual', name: 'atual', tipo: 'password', obrigatorio: true, attrs: 'autocomplete="current-password"' })}
            ${ui.campo({ label: 'Nova senha', name: 'nova', tipo: 'password', obrigatorio: true, attrs: 'autocomplete="new-password" minlength="8"', dica: 'Pelo menos 8 caracteres.' })}
            <div class="form-actions"><button type="submit" class="btn btn-outline">Alterar senha</button></div></form>` : ''}
          <section class="card gap-10"><h2 class="card-title">Conta</h2>
            <p class="card-sub">${ehBen ? 'Você pode apagar seus dados a qualquer momento. Os pedidos em andamento serão cancelados.' : 'A exclusão remove seus dados pessoais. O histórico de doações é mantido de forma anônima para a prestação de contas.'}</p>
            <div class="form-actions"><button type="button" class="btn btn-outline" data-sair>Sair</button><button type="button" class="link" data-acao="excluir">Excluir minha conta</button></div></section>
        </div>
      </div>`;

    return {
      titulo: 'Meu perfil', subtitulo: ehBen ? '' : `${C.perfis[eu.perfil].label} · desde ${U.dataLonga(eu.criadoEm)}`, nav: 'perfil', vivo: false, corpo,
      montar(main, c) {
        ligarMascaras(main);
        const salvar = (sel, transformar) => {
          const f = main.querySelector(`[data-form="${sel}"]`);
          if (f) ui.aoEnviar(f, async (d) => { NH.app.eu = await api().usuarios.atualizar(transformar(d)); ui.toast('Alterações salvas.'); c.recarregar(); });
        };
        salvar('dados', (d) => {
          const out = { ...d }; delete out.cnpjSoLeitura; delete out.telefoneSoLeitura; delete out.orgaoSoLeitura;
          if (aprovado) delete out.nome;
          return out;
        });
        salvar('endereco', (d) => ({ endereco: d.endereco }));
        salvar('horario', (d) => ({ horario: { dias: (d.horario.dias || []).map(Number), abre: d.horario.abre, fecha: d.horario.fecha } }));
        const fs = main.querySelector('[data-form="senha"]');
        if (fs) ui.aoEnviar(fs, async (d) => { await api().usuarios.alterarSenha(d); fs.reset(); ui.toast('Senha alterada.'); });
        const cb = main.querySelector('[data-notif-navegador]');
        if (cb) cb.addEventListener('change', async () => {
          let ativo = cb.checked;
          if (ativo && Notification.permission !== 'granted') {
            const p = await Notification.requestPermission();
            if (p !== 'granted') { ativo = false; cb.checked = false; ui.toast('O navegador bloqueou os avisos. Libere nas configurações do site.', 'aviso'); }
          }
          NH.app.eu = await api().usuarios.atualizar({ notificacoesNavegador: ativo });
          if (ativo) ui.toast('Pronto! Você receberá avisos do navegador.');
        });
        ui.delegar(main, {
          'enviar-doc': (b) => enviarDocumento(b.dataset.nome, c.recarregar),
          reenviar: (b) => ui.executar(b, async () => { await api().usuarios.reenviarAnalise(); ui.toast('Cadastro reenviado para análise.'); c.recarregar(); }),
          localizacao: (b) => ui.executar(b, async () => { const geo = await usarLocalizacao(); NH.app.eu = await api().usuarios.atualizar({ geo }); ui.toast('Localização atualizada no mapa.'); }),
          excluir: async () => {
            const r = await ui.modalForm({
              titulo: 'Excluir conta', sub: 'Esta ação não pode ser desfeita. Digite EXCLUIR para confirmar.', ok: 'Excluir conta',
              campos: ui.campo({ label: 'Confirmação', name: 'confirmacao', obrigatorio: true, attrs: 'autocomplete="off" autofocus' }),
              aoEnviar: (d) => api().usuarios.excluirConta({ confirmacao: d.confirmacao.trim().toUpperCase() })
            });
            if (r) location.href = 'index.html';
          }
        });
      }
    };
  }

  /* =========================================================
     TELA: CENTRAL DE AJUDA
     ========================================================= */
  const FAQ = {
    geral: [
      ['Como funciona o No Hunger?', 'Supermercados, padarias, restaurantes e outros doadores publicam alimentos que sobraram e ainda estão bons para consumo. ONGs, igrejas e instituições de caridade reservam, buscam e distribuem para as pessoas que precisam.'],
      ['Quem pode participar?', 'Empresas do setor de alimentos (doadores), instituições sem fins lucrativos (que recebem e distribuem) e pessoas em situação de vulnerabilidade (beneficiários). Doadores e instituições passam por aprovação do governo.'],
      ['Meus dados ficam públicos?', 'Não. Os dados de quem recebe alimento nunca aparecem para doadores nem no painel público. A instituição vê apenas o necessário para atender o pedido, e o governo vê somente números agregados.']
    ],
    doador: [
      ['Como publico uma doação?', 'Clique em "Publicar excedente", informe o alimento, a quantidade, a validade e o horário de retirada. Instituições a até 10 km recebem o aviso na hora.'],
      ['Posso alterar ou excluir uma doação?', 'Sim, enquanto ela estiver como "Publicada". Depois da reserva, combine mudanças pelo chat ou cancele informando o motivo.'],
      ['O que são doações recorrentes?', 'Se você sempre tem sobra parecida (por exemplo, pães no fim do dia), marque "Repetir esta doação". Nos dias escolhidos, ela aparece no início para você publicar com um clique.'],
      ['Como funciona o benefício fiscal?', 'Cada doação entregue gera um comprovante com número e código de verificação. O painel mostra uma estimativa; o valor efetivo depende da regulamentação do incentivo e do regime tributário da empresa.']
    ],
    instituicao: [
      ['Como reservo uma doação?', 'Em "Doações por perto", escolha a doação e clique em "Reservar". Depois, defina em até 30 minutos quem vai buscar; se ninguém for definido, a reserva é liberada para outras instituições.'],
      ['Como confirmo o recebimento?', 'Em "Minhas reservas", confirme a coleta quando o responsável buscar e depois o recebimento na sede. O alimento entra automaticamente no estoque e o doador recebe o comprovante.'],
      ['Como atendo os pedidos das pessoas?', 'Em "Distribuição", confirme o pedido, avise quando estiver pronto e registre a entrega com os itens do estoque. A pessoa recebe os avisos pelo celular.']
    ],
    beneficiario: [
      ['Preciso pagar alguma coisa?', 'Não. O alimento é gratuito.'],
      ['Como retiro o alimento?', 'Escolha um ponto aberto perto de você e toque em "Reservar retirada". Quando estiver pronto, você recebe um aviso. Mostre o código do pedido no local.'],
      ['Posso receber em casa?', 'Algumas instituições fazem entrega. Toque em "Pedir entrega" e informe o endereço. Só a instituição que vai entregar vê esse endereço.']
    ],
    governo: [
      ['Como aprovo um cadastro?', 'Em "Cadastros", abra o pedido, confira os documentos e escolha aprovar ou pedir ajustes. O motivo é enviado ao solicitante.'],
      ['Os dados exportados são anônimos?', 'Sim. As exportações e os dados abertos não incluem nomes, telefones ou endereços de beneficiários. O mapa de calor oculta áreas com poucos pedidos.']
    ]
  };
  function conteudoAjuda(perfilId, { publico = false } = {}) {
    const perguntas = [...(FAQ[perfilId] || []), ...FAQ.geral];
    const s = C.suporte;
    return html`<div class="section-row section-row--start">
      <section class="col-2 card gap-4" aria-label="Perguntas frequentes"><h2 class="card-title" style="margin-bottom:8px">Perguntas frequentes</h2>
        ${perguntas.map(([p, r]) => html`<details class="faq"><summary>${p}</summary><div class="faq__body">${r}</div></details>`)}</section>
      <div class="col-1 col gap-20">
        <section class="card card--green gap-10"><div class="card-label">${ui.icone('phone')}Fale com o suporte</div>
          <div class="auth-text" style="font-size:16px;line-height:24px">Telefone: <strong>${s.telefone}</strong><br>WhatsApp: <strong>${s.whatsapp}</strong><br>E-mail: <strong>${s.email}</strong></div>
          <div class="note">Atendimento ${s.horario}.</div></section>
        <form class="card form" data-form="chamado" novalidate><h2 class="card-title">Enviar uma mensagem</h2>
          ${ui.campo({ label: 'Assunto', name: 'assunto', obrigatorio: true, opcoes: ['Dúvida', 'Problema no sistema', 'Cadastro e documentos', 'Sugestão', 'Denúncia'], placeholder: 'Escolha' })}
          ${ui.campo({ label: 'Mensagem', name: 'mensagem', tipo: 'textarea', obrigatorio: true })}
          ${publico ? ui.campo({ label: 'E-mail ou telefone para resposta', name: 'contato', obrigatorio: true }) : ''}
          <div class="form-actions"><button type="submit" class="btn btn-primary">Enviar</button></div></form>
        ${C.demo.ativo ? html`<section class="card gap-10"><h2 class="card-title">Demonstração</h2><p class="card-sub">Volta todos os dados ao estado inicial de exemplo (as alterações feitas serão perdidas).</p>
          <div><button type="button" class="btn btn-outline" data-acao="reiniciar-demo">Reiniciar dados de demonstração</button></div></section>` : ''}
      </div></div>`;
  }
  function ligarAjuda(main) {
    const f = main.querySelector('[data-form="chamado"]');
    if (f) ui.aoEnviar(f, async (d) => { const c = await api().ajuda.abrirChamado(d); f.reset(); ui.toast(`Mensagem enviada. Protocolo ${c.protocolo}.`); });
    ui.delegar(main, {
      'reiniciar-demo': async () => {
        if (!(await ui.confirmar({ titulo: 'Reiniciar a demonstração?', texto: 'Todos os dados voltam ao exemplo inicial e você precisará entrar de novo.', ok: 'Reiniciar' }))) return;
        await api().demo.reiniciar(); location.href = 'index.html';
      }
    });
  }
  async function ajuda(ctx) {
    return { titulo: 'Central de ajuda', subtitulo: `Dúvidas sobre o No Hunger e contato com o suporte, ${C.suporte.horario}.`, nav: 'ajuda', vivo: false,
      corpo: conteudoAjuda(ctx.eu.perfil), montar: (main) => ligarAjuda(main) };
  }

  /* =========================================================
     TELA: MENSAGENS (doador ↔ instituição)
     ========================================================= */
  function bolhas(msgs) {
    if (!msgs.length) return html`<div class="msg msg--sys">Nenhuma mensagem ainda. Combine aqui os detalhes da retirada.</div>`;
    return msgs.map((m) => m.sistema ? html`<div class="msg msg--sys">${m.texto}</div>`
      : html`<div class="msg ${m.deMim ? 'msg--me' : 'msg--them'}"><span class="sr-only">${m.deMim ? 'Você' : m.autor}: </span>${m.texto}<span class="msg__time">${U.diaRelativo(m.em.slice(0, 10)) === 'hoje' ? U.horaDe(m.em) : U.dataHora(m.em)}</span></div>`);
  }
  async function mensagens(ctx) {
    const pagina = ctx.eu.perfil === 'doador' ? 'doador' : 'instituicao';
    const conversas = await api().chat.conversas();
    const ativoId = ctx.params.id || (window.innerWidth > 900 && conversas[0] ? conversas[0].doacaoId : null);
    const ativa = conversas.find((c) => c.doacaoId === ativoId);
    const msgs = ativa ? await api().chat.mensagens({ doacaoId: ativoId }) : [];
    if (ativa && ativa.naoLidas) NH.app.atualizarContadores();
    const linkDetalhe = (id) => (pagina === 'doador' ? `#/doacoes/${id}` : `#/doacao/${id}`);
    const lista = html`<section class="card chat__threads" aria-label="Conversas">
      ${conversas.length ? conversas.map((c) => html`<a class="thread${c.doacaoId === ativoId ? ' is-active' : ''}" href="#/mensagens/${c.doacaoId}" ${c.doacaoId === ativoId ? raw('aria-current="true"') : ''}>
        <span class="thread__top"><span class="thread__name">${c.outro.nome}</span>${c.naoLidas ? html`<span class="nav-badge" style="background:${C.cores.orange}" aria-label="${c.naoLidas} não lidas">${c.naoLidas}</span>` : ''}</span>
        <span class="thread__sub">${c.titulo} · ${U.quantidade(c.quantidade, c.unidade)}</span>
        <span class="thread__sub">${c.ultima ? `${c.ultima.deMim ? 'Você: ' : ''}${c.ultima.texto}` : 'Sem mensagens'}</span></a>`)
        : ui.vazio('Nenhuma conversa', pagina === 'doador' ? 'As conversas começam quando uma instituição reserva sua doação.' : 'As conversas começam quando você reserva uma doação.')}</section>`;
    const painel = ativa ? html`<section class="card chat__panel" aria-label="Conversa com ${ativa.outro.nome}">
        <div class="chat__head"><div><div class="list-row__title">${ativa.outro.nome}</div><div class="list-row__sub">${ativa.titulo} · ${U.quantidade(ativa.quantidade, ativa.unidade)}</div></div>
          <div class="row items-center gap-12">${ui.tag(ativa.status, { tam: 'sm' })}<a class="link" href="${linkDetalhe(ativa.doacaoId)}">Ver doação</a></div></div>
        <div class="chat__msgs" data-msgs aria-live="polite">${bolhas(msgs)}</div>
        <form class="chat__form" novalidate><div class="field grow" data-campo="texto"><label class="sr-only" for="chat_texto">Mensagem</label>
          <textarea class="input" id="chat_texto" name="texto" placeholder="Escreva uma mensagem" maxlength="1000"></textarea></div>
          <button type="submit" class="btn btn-primary" aria-label="Enviar mensagem">${ui.icone('send', { tam: 20 })}<span>Enviar</span></button></form></section>`
      : html`<section class="card chat__panel">${ui.vazio('Escolha uma conversa', 'Selecione uma conversa ao lado para ver as mensagens.')}</section>`;
    const celular = window.innerWidth <= 900;
    let off = null, intervalo = null;
    return {
      titulo: 'Mensagens', subtitulo: 'Converse com quem participa de cada doação.', nav: 'mensagens', vivo: false,
      voltar: celular && ativa ? { href: '#/mensagens', label: 'Todas as conversas' } : null,
      corpo: html`<div class="chat">${celular && ativa ? '' : lista}${celular && !ativa ? '' : painel}</div>`,
      montar(main) {
        const caixa = main.querySelector('[data-msgs]');
        if (!caixa) return;
        caixa.scrollTop = caixa.scrollHeight;
        const form = main.querySelector('.chat__form');
        const ta = form.querySelector('textarea');
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
        ui.aoEnviar(form, async (d) => {
          await api().chat.enviar({ doacaoId: ativoId, texto: d.texto });
          ta.value = ''; ta.focus();
          await atualizar();
        });
        const atualizar = async () => {
          const novas = await api().chat.mensagens({ doacaoId: ativoId });
          const fim = caixa.scrollHeight - caixa.scrollTop - caixa.clientHeight < 40;
          caixa.innerHTML = String(bolhas(novas));
          if (fim) caixa.scrollTop = caixa.scrollHeight;
        };
        off = NH.bus.on('db:change', U.debounce(() => { if (caixa.isConnected) atualizar(); }, 200));
        /* Com backend real: consulta novas mensagens a cada 5 s (ou troque por WebSocket) */
        if (C.backend.mode === 'http') intervalo = setInterval(() => { if (caixa.isConnected) atualizar(); }, 5000);
      },
      desmontar() { if (off) off(); clearInterval(intervalo); }
    };
  }

  NH.comum = { linhaDoTempo, blocoAvaliacoes, avaliar, exportarCSV, usarLocalizacao, ligarMascaras, camposEndereco, camposHorario, perfil, ajuda, conteudoAjuda, ligarAjuda, mensagens, enviarDocumento };
})();
