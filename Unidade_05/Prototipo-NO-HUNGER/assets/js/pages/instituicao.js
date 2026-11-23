/* =========================================================
   NO hunger — Área da instituição (ONGs, igrejas, caridade)
   Início · Doações por perto · Minhas reservas · Estoque
   Distribuição · Voluntários · Mensagens · Relatórios · Ajuda
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui, api = NH.api;
  const { html, raw } = U;

  /* ---------- Ações de reserva e coleta (reutilizadas em várias telas) ---------- */
  async function escolherResponsavel(doacao, { aposReserva = false } = {}) {
    const vols = (await api.voluntarios.listar()).filter((v) => v.disponivel);
    const prazo = doacao.prazoResponsavel ? U.horaDe(doacao.prazoResponsavel) : null;
    if (!vols.length) {
      await ui.modal({ titulo: aposReserva ? 'Reserva feita!' : 'Definir quem vai retirar', corpo: html`
        ${ui.alerta('Nenhum voluntário disponível', `Cadastre ou marque alguém como disponível em Voluntários${prazo ? ` até as ${U.hora(prazo)}` : ''}.`, { icone: 'users' })}
        <div class="modal__actions"><button type="button" class="btn btn-outline" data-fechar>Depois</button><a class="btn btn-primary" href="#/voluntarios" data-fechar>Ir para Voluntários</a></div>` });
      return null;
    }
    const r = await ui.modalForm({
      titulo: aposReserva ? 'Reserva feita! Quem vai retirar?' : 'Quem vai retirar?',
      sub: `${doacao.titulo} · ${U.quantidade(doacao.quantidade, doacao.unidade)} · retirada ${U.janela(doacao.janela)}${prazo && !doacao.responsavelId ? `. Confirme até as ${U.hora(prazo)}, ou a reserva é liberada.` : ''}`,
      ok: 'Confirmar responsável', cancelar: aposReserva ? 'Definir depois' : 'Cancelar',
      campos: html`<fieldset class="fieldset field" data-campo="voluntarioId"><legend>Escolha uma pessoa da equipe</legend><div class="col gap-8">${vols.map((v, i) => html`
        <label class="choice"><input type="radio" name="voluntarioId" value="${v.id}" ${v.id === doacao.responsavelId || (!doacao.responsavelId && i === 0) ? raw('checked') : ''} style="width:22px;height:22px;accent-color:${C.cores.brown}">
          <span><span class="choice__title" style="display:block;font-size:16px">${v.nome}</span><span class="choice__text">${v.funcao}${v.veiculo ? ` · ${v.veiculo}` : ''}${v.emColeta ? ` · ${U.plural(v.emColeta, 'coleta', 'coletas')} hoje` : ''}</span></span></label>`)}</div></fieldset>`,
      aoEnviar: (d) => api.doacoes.definirResponsavel({ id: doacao.id, voluntarioId: d.voluntarioId })
    });
    if (r) ui.toast(`${r.responsavel.nome} vai retirar. O doador foi avisado.`);
    return r;
  }
  async function acompanharColeta(doacaoId, recarregar) {
    let d = await api.doacoes.detalhe({ id: doacaoId });
    let timer;
    await ui.modal({
      titulo: 'Acompanhar coleta', grande: true, sub: `${d.titulo} · ${d.doador.nome}`,
      corpo: html`${NH.mapa.rota({ origem: d.coleta.origem, destino: d.coleta.destino, coleta: d.coleta, nomeOrigem: 'Instituição', nomeDestino: d.doador.nomeCurto || d.doador.nome })}
        <p class="auth-text" aria-live="polite" data-eta-texto></p>
        <dl class="dl"><dt>Responsável</dt><dd>${d.responsavel.nome} · ${d.responsavel.funcao}${d.responsavel.veiculo ? ` · ${d.responsavel.veiculo}` : ''}</dd><dt>Telefone</dt><dd>${d.responsavel.telefone}</dd>
          <dt>Endereço de retirada</dt><dd>${d.doador.endereco.logradouro}, ${d.doador.endereco.bairro}</dd><dt>Janela</dt><dd>${U.janela(d.janela)}</dd></dl>
        <div class="modal__actions"><button type="button" class="btn btn-outline" data-fechar>Fechar</button><button type="button" class="btn btn-success" data-confirmar>Confirmar coleta</button></div>`,
      aoMontar: (el, fechar) => {
        const tick = () => {
          const p = NH.mapa.atualizarRota(el, d.coleta);
          const t = el.querySelector('[data-eta-texto]');
          if (p && t) t.textContent = p.chegou ? `${d.responsavel.nome} chegou ao doador. Confirme quando os alimentos estiverem no veículo.` : `${d.responsavel.nome} está a caminho. Chega em cerca de ${p.minutos} min.`;
        };
        tick(); timer = setInterval(tick, 1000);
        el.querySelector('[data-confirmar]').addEventListener('click', (e) => ui.executar(e.currentTarget, async () => {
          await api.doacoes.confirmarColeta({ id: d.id }); ui.toast('Coleta confirmada. Agora confirme o recebimento na sede.'); fechar(true);
        }));
      }
    });
    clearInterval(timer);
    if (recarregar) recarregar();
  }
  async function confirmarRecebimento(d) {
    const r = await ui.modalForm({
      titulo: 'Confirmar recebimento', sub: `${d.titulo} chegou à instituição? Os alimentos entram no estoque e o doador recebe o comprovante.`,
      ok: 'Confirmar recebimento', classeOk: 'btn-success',
      campos: ui.campo({ label: `Quantidade recebida (${(C.unidades.find((u) => u.id === d.unidade) || {}).label})`, name: 'quantidadeRecebida', tipo: 'number', valor: d.quantidade, obrigatorio: true, attrs: 'min="0.1" step="0.1"', dica: 'Altere se chegou menos do que o combinado.' }),
      aoEnviar: (x) => api.doacoes.confirmarRecebimento({ id: d.id, quantidadeRecebida: x.quantidadeRecebida })
    });
    if (r) ui.toast('Recebimento confirmado. Os alimentos estão no estoque.');
    return r;
  }
  function acoesReserva(lista, recarregar) {
    const achar = (id) => lista.find((d) => d.id === id);
    return {
      reservar: (b) => ui.executar(b, async () => {
        const d = await api.doacoes.reservar({ id: b.dataset.id });
        await escolherResponsavel(d, { aposReserva: true });
        recarregar();
      }),
      responsavel: async (b) => { if (await escolherResponsavel(achar(b.dataset.id))) recarregar(); },
      'iniciar-coleta': (b) => ui.executar(b, async () => { await api.doacoes.iniciarColeta({ id: b.dataset.id }); ui.toast('Coleta iniciada. O doador acompanha pelo mapa.'); await acompanharColeta(b.dataset.id, recarregar); }),
      acompanhar: (b) => acompanharColeta(b.dataset.id, recarregar),
      'confirmar-coleta': async (b) => {
        if (!(await ui.confirmar({ titulo: 'Confirmar coleta?', texto: 'Confirme quando os alimentos já estiverem com o responsável.', ok: 'Confirmar coleta', classeOk: 'btn-success' }))) return;
        await ui.executar(b, async () => { await api.doacoes.confirmarColeta({ id: b.dataset.id }); ui.toast('Coleta confirmada.'); recarregar(); });
      },
      receber: async (b) => { if (await confirmarRecebimento(achar(b.dataset.id))) recarregar(); },
      'cancelar-reserva': async (b) => {
        const motivo = await ui.pedirMotivo({ titulo: 'Cancelar reserva', texto: 'A doação volta a ficar disponível e o doador é avisado.', ok: 'Cancelar reserva' });
        if (!motivo) return;
        await ui.executar(b, async () => { await api.doacoes.cancelarReserva({ id: b.dataset.id, motivo }); ui.toast('Reserva cancelada.'); recarregar(); });
      },
      avaliar: async (b) => { if (await NH.comum.avaliar({ doacaoId: b.dataset.id, titulo: 'Avaliar o doador', sub: b.dataset.titulo })) recarregar(); }
    };
  }
  function prazoTexto(d) {
    const min = Math.max(0, Math.ceil((new Date(d.prazoResponsavel) - Date.now()) / 60000));
    return `Defina quem vai retirar até as ${U.hora(U.horaDe(d.prazoResponsavel))} (${min} min)`;
  }
  function botoesReserva(d) {
    const coletaIniciada = d.coleta && d.coleta.iniciadaEm;
    if (d.status === 'reservada' && !d.responsavelId) return html`<button type="button" class="btn btn-primary" data-acao="responsavel" data-id="${d.id}">Definir quem vai retirar</button>`;
    if (d.status === 'reservada' && !coletaIniciada) return html`<button type="button" class="btn btn-primary" data-acao="iniciar-coleta" data-id="${d.id}">${ui.icone('truck', { tam: 20 })}Iniciar coleta</button>
      <button type="button" class="link link--pad" data-acao="responsavel" data-id="${d.id}">Trocar responsável</button>`;
    if (d.status === 'reservada') return html`<button type="button" class="btn btn-outline" data-acao="acompanhar" data-id="${d.id}">${ui.icone('map', { tam: 20 })}Acompanhar coleta</button>
      <button type="button" class="btn btn-success" data-acao="confirmar-coleta" data-id="${d.id}">Confirmar coleta</button>`;
    if (d.status === 'coletada') return html`<button type="button" class="btn btn-success" data-acao="receber" data-id="${d.id}">Confirmar recebimento</button>`;
    if (d.status === 'entregue' && !d.minhaAvaliacao) return html`<button type="button" class="btn btn-outline" data-acao="avaliar" data-id="${d.id}" data-titulo="${d.titulo} · ${d.doador.nome}">Avaliar doador</button>`;
    return '';
  }
  function linhaReserva(d) {
    const sub = d.status === 'coletada' ? `Coletada às ${U.hora(U.horaDe(d.coletadaEm))} · aguardando recebimento na sede`
      : d.status === 'entregue' ? `Recebida em ${U.dataLonga(d.entregueEm)}` : `Retirada ${U.janela(d.janela)}`;
    return html`<div class="don-row">
      <div class="don-row__top"><div><a class="don-row__title" href="#/doacao/${d.id}">${d.titulo} <span>· ${U.quantidade(d.quantidade, d.unidade)}</span></a>
        <div class="don-row__sub">${d.doador.nome} · ${sub}${d.responsavel ? ` · ${d.responsavel.nome}` : ''}</div></div>${ui.tag(d.status)}</div>
      ${ui.etapas(d.status)}
      ${d.status === 'reservada' && !d.responsavelId && d.prazoResponsavel ? html`<div class="note" style="font-weight:700;color:${C.cores.brown}">${ui.icone('clock', { tam: 16, estilo: 'vertical-align:-3px;margin-right:4px' })}${prazoTexto(d)}</div>` : ''}
      <div class="offer__actions">${botoesReserva(d)}
        <a class="link link--pad" href="#/mensagens/${d.id}">Conversar${d.naoLidas ? ` (${d.naoLidas})` : ''}</a>
        ${d.status === 'reservada' ? html`<button type="button" class="link link--pad" data-acao="cancelar-reserva" data-id="${d.id}">Cancelar reserva</button>` : ''}</div>
    </div>`;
  }

  /* =========================================================
     INÍCIO
     ========================================================= */
  async function tilesResumo() {
    const [perto, reservas, vols] = await Promise.all([api.doacoes.disponiveis({ raioKm: C.regras.raioPadraoKm }), api.doacoes.daInstituicao({ status: 'andamento' }), api.voluntarios.listar()]);
    const hoje = reservas.filter((d) => d.status === 'reservada' && d.janela.data === U.isoDate());
    return { perto, reservas, vols, hoje,
      html: html`<section aria-label="Resumo" class="row gap-16">
        <div class="tile"><div class="tile__n">${perto.length}</div><div class="tile__l">${perto.length === 1 ? 'doação disponível agora' : 'doações disponíveis agora'}</div></div>
        <div class="tile"><div class="tile__n">${hoje.length}</div><div class="tile__l">${hoje.length === 1 ? 'reserva para retirar hoje' : 'reservas para retirar hoje'}</div></div>
        <div class="tile"><div class="tile__n">${vols.filter((v) => v.disponivel).length}</div><div class="tile__l">voluntários disponíveis</div></div></section>` };
  }
  async function inicio({ eu }) {
    const [t, pedidos, est, rel] = await Promise.all([tilesResumo(), api.pedidos.daInstituicao({ status: 'abertos' }), api.estoque.listar(), api.relatorios.instituicao({})]);
    const semResp = t.reservas.filter((d) => d.status === 'reservada' && !d.responsavelId);
    const vencendo = est.itens.filter((i) => i.diasParaVencer <= 1);
    const novos = pedidos.filter((p) => p.status === 'solicitado');
    const corpo = html`${t.html}
      ${semResp.map((d) => html`<div class="alert" role="status">${ui.icone('clock', { tam: 24, cls: 'alert__icon' })}<div class="col gap-8 grow"><div class="alert__title">${d.titulo} · ${d.doador.nome}</div>
        <div class="alert__text">${prazoTexto(d)}. Sem responsável, a reserva é liberada para outras instituições.</div><div><button type="button" class="btn btn-primary" data-acao="responsavel" data-id="${d.id}">Definir quem vai retirar</button></div></div></div>`)}
      <section class="section-row section-row--start">
        <div class="card col-2 gap-6"><div class="card-head"><h2 class="card-title">Reservas em andamento</h2><a class="link" href="#/reservas">Ver todas</a></div>
          ${t.reservas.length ? t.reservas.slice(0, 3).map(linhaReserva) : ui.vazio('Nenhuma reserva em andamento', 'Veja as doações disponíveis perto de você.', html`<a class="btn btn-primary" href="#/perto">Ver doações por perto</a>`)}</div>
        <div class="col-1 col gap-20">
          <div class="card card--green gap-10"><div class="card-label">${ui.icone('users')}Pedidos de alimento</div>
            <div class="big-money big-money--md">${novos.length}</div><div class="card-sub">${novos.length === 1 ? 'pedido novo aguardando confirmação' : 'pedidos novos aguardando confirmação'} · ${pedidos.length} em aberto</div>
            <a class="btn btn-outline" href="#/distribuicao">Atender pedidos</a></div>
          <div class="card gap-6"><div class="card-head"><h2 class="card-title">Vence logo</h2><a class="link" href="#/estoque">Estoque</a></div>
            ${vencendo.length ? vencendo.map((i) => html`<div class="list-row"><div><div class="list-row__title">${i.titulo}</div><div class="list-row__sub">${U.quantidade(i.quantidade, i.unidade)}</div></div>${ui.tagValidade(i.validade, { tam: 'xs' })}</div>`)
              : ui.vazio('Nada vencendo', 'Nenhum item vence hoje ou amanhã.')}</div>
        </div>
      </section>
      <section aria-label="Seu impacto" class="card gap-16"><div class="card-head"><h2 class="card-title">Impacto em ${rel.ano}</h2><a class="link" href="#/relatorios">Ver relatório completo</a></div>
        <div class="row gap-16"><div class="metric"><div class="metric__n">${U.num(rel.kgRecebidos)} kg</div><div class="metric__l">de alimentos recebidos</div></div>
          <div class="metric"><div class="metric__n">${U.num(rel.pessoasAtendidas)}</div><div class="metric__l">atendimentos a pessoas</div></div>
          <div class="metric"><div class="metric__n">${U.num(rel.refeicoes)}</div><div class="metric__l">refeições geradas</div></div></div></section>`;
    return {
      titulo: `Olá, ${eu.nomeCurto || eu.nome}`, tituloAba: 'Início', subtitulo: `${eu.nome} · ${U.plural(t.perto.length, 'doação disponível', 'doações disponíveis')} perto de você.`,
      nav: 'inicio', corpo, montar(main, c) { ui.delegar(main, acoesReserva(t.reservas, c.recarregar)); }
    };
  }

  /* =========================================================
     DOAÇÕES POR PERTO (interface original)
     ========================================================= */
  async function perto({ query, eu }) {
    const f = { cat: query.cat || '', raio: query.raio === '1', hoje: query.hoje === '1', refri: query.refri === '1', cabe: query.cabe === '1' };
    const zoom = C.regras.raiosMapaKm.includes(Number(query.zoom)) ? Number(query.zoom) : C.regras.raioPadraoKm;
    const [t, lista] = await Promise.all([tilesResumo(), api.doacoes.disponiveis({ categoria: f.cat || undefined, raioKm: f.raio ? zoom : undefined, venceHoje: f.hoje, refrigerado: f.refri, cabeNoEstoque: f.cabe })]);
    const link = (mud) => {
      const q = { ...f, zoom, ...mud };
      const p = new URLSearchParams();
      if (q.cat) p.set('cat', q.cat); ['raio', 'hoje', 'refri', 'cabe'].forEach((k) => { if (q[k]) p.set(k, '1'); });
      if (q.zoom !== C.regras.raioPadraoKm) p.set('zoom', q.zoom);
      return `#/perto${[...p].length ? `?${p}` : ''}`;
    };
    const chip = (chave, label) => html`<a class="chip${f[chave] ? ' is-on' : ''}" href="${link({ [chave]: !f[chave] })}" aria-pressed="${f[chave] ? 'true' : 'false'}" role="button">${label}</a>`;
    const urgente = (d) => U.diasAte(d.validade) <= 0;
    const pontos = lista.map((d, i) => ({ id: d.id, geo: d.geo, rotulo: String(i + 1), tipo: urgente(d) ? 'urgente' : 'disp', titulo: `${i + 1}: ${d.titulo}, ${d.doador.nome}, a ${U.distanciaLabel(d.distanciaKm)}` }));
    const corpo = html`
      ${t.html}
      <section aria-label="Filtros" class="chips">
        <label class="sr-only" for="filtro_cat">Tipo de alimento</label>
        <select class="chip is-on" id="filtro_cat" data-cat><option value="">Todos os alimentos</option>${C.categorias.map((c) => html`<option value="${c.id}" ${c.id === f.cat ? raw('selected') : ''}>${c.label}</option>`)}</select>
        ${chip('raio', `Até ${zoom} km`)}${chip('hoje', 'Vence hoje')}${chip('refri', 'Refrigerado')}${chip('cabe', 'Cabe no meu estoque')}
      </section>
      <section class="section-row section-row--stretch">
        <div class="col gap-14" style="flex:1 1 420px;min-width:0">
          ${lista.length ? lista.map((d, i) => html`<article class="offer" id="oferta-${d.id}" tabindex="-1" aria-labelledby="oferta-t-${d.id}">
            <div class="offer__head"><div class="pin${urgente(d) ? ' pin--urgente' : ''}" aria-hidden="true">${i + 1}</div>
              <div class="grow"><div class="offer__title" id="oferta-t-${d.id}">${d.titulo} <span>· ${U.quantidade(d.quantidade, d.unidade)}</span></div>
                <div class="offer__meta">${d.doador.nome} · a ${U.distanciaLabel(d.distanciaKm)}</div></div>
              <span class="tag tag--sm ${urgente(d) ? 'tag--aviso' : 'tag--neutra'}" style="flex:0 0 auto">${U.vencimentoLabel(d.validade)}</span></div>
            <div class="offer__info"><span>Retirada: ${U.janela(d.janela)}</span><span>Armazenamento: ${d.armazenamento}</span></div>
            <div class="offer__actions"><button type="button" class="btn btn-primary btn--wide" data-acao="reservar" data-id="${d.id}" ${eu.status !== 'aprovado' ? raw('aria-disabled="true"') : ''}>Reservar</button>
              <a class="link link--pad" href="#/doacao/${d.id}">Ver detalhes</a></div>
          </article>`) : html`<div class="card">${ui.vazio('Nenhuma doação com esses filtros', 'Tente tirar algum filtro ou aumentar a distância no mapa.', html`<a class="btn btn-outline" href="#/perto">Limpar filtros</a>`)}</div>`}
          <p class="note">Depois de reservar, você tem ${C.regras.prazoConfirmarResponsavelMin} minutos para confirmar quem vai retirar.</p>
        </div>
        ${NH.mapa.render({ centro: eu.geo, raioKm: zoom, pontos, label: `Mostrando doações em até ${zoom} km`, descricao: `Mapa com a sua instituição e ${pontos.filter((p) => U.distanciaKm(eu.geo, p.geo) <= zoom).length} pontos de doação por perto`,
          legenda: [{ classe: 'map__dot--urgente', texto: 'Vence hoje' }, { classe: 'map__dot--disp', texto: 'Disponível' }, { classe: 'map__dot--voce', texto: 'Você' }] })}
      </section>`;
    return {
      titulo: 'Doações por perto', subtitulo: `${eu.nome} · ${U.plural(t.perto.length, 'doação disponível', 'doações disponíveis')} agora.`, nav: 'perto', corpo,
      montar(main, c) {
        main.querySelector('[data-cat]').addEventListener('change', (e) => NH.app.navegar(link({ cat: e.target.value })));
        NH.mapa.ligar(main, {
          aoZoom: (dir) => NH.app.navegar(link({ zoom: NH.mapa.proximoRaio(zoom, dir) })),
          aoPino: (id) => {
            const card = main.querySelector(`#oferta-${CSS.escape(id)}`);
            if (!card) return;
            main.querySelectorAll('.offer.is-highlight').forEach((x) => x.classList.remove('is-highlight'));
            card.classList.add('is-highlight'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.focus({ preventScroll: true });
          }
        });
        ui.delegar(main, acoesReserva(lista, c.recarregar));
      }
    };
  }

  /* =========================================================
     DETALHE DE UMA DOAÇÃO
     ========================================================= */
  async function detalhe({ params, eu }) {
    const d = await api.doacoes.detalhe({ id: params.id });
    const minha = d.instituicaoId === eu.id;
    const foto = d.fotos && d.fotos[0];
    const corpo = html`<div class="section-row section-row--start">
      <div class="col-2 col gap-20">
        <section class="card gap-16">
          <div class="card-head"><div><div class="card-title">${d.titulo} <span class="text-muted" style="font-weight:500">· ${U.quantidade(d.quantidade, d.unidade)}</span></div>
            <div class="card-sub">${U.categoriaLabel(d.categoria)} · ${d.doador.nome} · a ${U.distanciaLabel(d.distanciaKm)}</div></div>${minha ? ui.tag(d.status) : ui.tagValidade(d.validade)}</div>
          ${minha ? ui.etapas(d.status) : ''}
          ${foto ? raw(`<img class="photo" src="${U.esc(foto)}" alt="Foto da doação: ${U.esc(d.titulo)}">`) : ''}
          <dl class="dl"><dt>Retirada</dt><dd>${U.janela(d.janela)}</dd><dt>Validade</dt><dd>${U.dataLonga(d.validade)} · ${U.vencimentoLabel(d.validade)}</dd>
            <dt>Armazenamento</dt><dd>${d.armazenamento}</dd><dt>Peso estimado</dt><dd>${U.kg(d.pesoKg)}</dd>
            <dt>Endereço</dt><dd>${d.doador.endereco.logradouro}, ${d.doador.endereco.bairro}, ${d.doador.endereco.cidade}</dd>
            ${d.observacoes ? html`<dt>Observações</dt><dd>${d.observacoes}</dd>` : ''}</dl>
          <div class="offer__actions">
            ${d.status === 'publicada' ? html`<button type="button" class="btn btn-primary-lg" data-acao="reservar" data-id="${d.id}">Reservar</button>` : ''}
            ${minha ? botoesReserva(d) : ''}
            ${minha ? html`<a class="link link--pad" href="#/mensagens/${d.id}">Conversar com o doador</a>` : ''}
            ${minha && d.status === 'reservada' ? html`<button type="button" class="link link--pad" data-acao="cancelar-reserva" data-id="${d.id}">Cancelar reserva</button>` : ''}
          </div>
        </section>
        <section class="card gap-14"><h2 class="card-title">Rota de coleta</h2>
          ${NH.mapa.rota({ origem: eu.geo, destino: d.geo, coleta: minha ? d.coleta : null, nomeOrigem: 'Instituição', nomeDestino: d.doador.nomeCurto || d.doador.nome })}</section>
        ${minha ? html`<section class="card gap-10"><h2 class="card-title">Histórico</h2>${NH.comum.linhaDoTempo(d.historico)}</section>` : ''}
      </div>
      <div class="col-1 col gap-20">
        <section class="card gap-10"><div class="card-label">${ui.icone('store')}Doador</div><div class="list-row__title" style="font-size:18px">${d.doador.nome}</div>
          <div class="card-sub">${d.doador.tipo} · ${d.doador.telefone}</div>
          <div class="row items-center gap-8">${ui.estrelas(d.doador.avaliacao.media)}<span class="note">${d.doador.avaliacao.total ? `${U.num(d.doador.avaliacao.media, 1)} (${d.doador.avaliacao.total})` : 'Sem avaliações'}</span></div></section>
        ${minha && d.responsavel ? html`<section class="card gap-10"><div class="card-label">${ui.icone('truck')}Responsável pela retirada</div>
          <div class="list-row__title">${d.responsavel.nome}</div><div class="card-sub">${d.responsavel.funcao}${d.responsavel.veiculo ? ` · ${d.responsavel.veiculo}` : ''} · ${d.responsavel.telefone}</div>
          ${d.status === 'reservada' ? html`<button type="button" class="link" data-acao="responsavel" data-id="${d.id}" style="align-self:flex-start">Trocar responsável</button>` : ''}</section>` : ''}
        ${minha && d.status === 'entregue' ? html`<section class="card card--green gap-10"><div class="card-label">${ui.icone('doc')}Comprovante emitido</div>
          <div class="card-sub">Nº ${d.comprovante.numero} · ${U.kg(d.pesoEntregueKg)}</div><a class="btn btn-outline" href="comprovante.html?id=${d.id}">Ver comprovante</a></section>` : ''}
      </div></div>`;
    return {
      titulo: d.status === 'publicada' ? 'Doação disponível' : 'Detalhes da doação', nav: minha ? 'reservas' : 'perto',
      voltar: minha ? { href: '#/reservas', label: 'Minhas reservas' } : { href: '#/perto', label: 'Doações por perto' }, corpo,
      montar(main, c) {
        ui.delegar(main, {
          ...acoesReserva([d], c.recarregar),
          reservar: (b) => ui.executar(b, async () => { const r = await api.doacoes.reservar({ id: d.id }); await escolherResponsavel(r, { aposReserva: true }); c.recarregar(); })
        });
      }
    };
  }

  /* =========================================================
     MINHAS RESERVAS
     ========================================================= */
  async function reservas({ query }) {
    const filtro = query.filtro || 'andamento';
    const lista = await api.doacoes.daInstituicao({ status: filtro === 'andamento' ? 'andamento' : filtro });
    const chip = (id, label) => html`<a class="chip${filtro === id ? ' is-on' : ''}" href="#/reservas?filtro=${id}">${label}</a>`;
    return {
      titulo: 'Minhas reservas', subtitulo: 'Defina quem retira, acompanhe a coleta e confirme o recebimento.', nav: 'reservas',
      corpo: html`<section class="chips" aria-label="Filtros">${chip('andamento', 'Em andamento')}${chip('reservada', 'Reservadas')}${chip('coletada', 'Coletadas')}${chip('entregue', 'Recebidas')}</section>
        <section class="card gap-6"><h2 class="card-title">${{ andamento: 'Em andamento', reservada: 'Reservadas', coletada: 'Coletadas', entregue: 'Recebidas' }[filtro]} <span class="text-muted" style="font-weight:600">(${lista.length})</span></h2>
        ${lista.length ? lista.slice(0, 60).map(linhaReserva) : ui.vazio('Nenhuma reserva aqui', 'Reserve doações na tela Doações por perto.', html`<a class="btn btn-primary" href="#/perto">Ver doações por perto</a>`)}</section>`,
      montar(main, c) { ui.delegar(main, acoesReserva(lista, c.recarregar)); }
    };
  }

  /* =========================================================
     ESTOQUE
     ========================================================= */
  async function registrarDistribuicao({ pedido = null, itemInicial = null } = {}) {
    const est = await api.estoque.listar();
    if (!est.itens.length) { ui.toast('O estoque está vazio.', 'aviso'); return null; }
    const r = await ui.modalForm({
      titulo: pedido ? `Entregar pedido nº ${pedido.codigo}` : 'Registrar distribuição', grande: true,
      sub: pedido ? `${pedido.apelido} · ${pedido.tipo === 'entrega' ? 'entrega em casa' : 'retirada no local'}` : 'Informe o que saiu do estoque e quantas pessoas foram atendidas.',
      ok: 'Registrar', classeOk: 'btn-success',
      campos: html`<div class="field" data-campo="itens"><span class="field__label">Itens entregues</span><div class="table-wrap"><table class="table"><thead><tr><th>Alimento</th><th>Em estoque</th><th>Validade</th><th style="width:140px">Quantidade</th></tr></thead><tbody>
        ${est.itens.map((i) => html`<tr><td>${i.titulo}</td><td class="nowrap">${U.quantidade(i.quantidade, i.unidade)}</td><td>${ui.tagValidade(i.validade, { tam: 'xs' })}</td>
          <td><label class="sr-only" for="q_${i.id}">Quantidade de ${i.titulo}</label><input class="input" id="q_${i.id}" type="number" min="0" max="${i.quantidade}" step="0.1" name="q_${i.id}" value="${itemInicial === i.id ? i.quantidade : ''}" placeholder="0"></td></tr>`)}
        </tbody></table></div></div>
        <div class="form-grid">${ui.campo({ label: 'Pessoas atendidas', name: 'pessoasAtendidas', tipo: 'number', valor: pedido ? 1 : '', obrigatorio: true, attrs: 'min="1" step="1"' })}
          ${pedido ? ui.campo({ label: 'Código do pedido', name: 'codigo', obrigatorio: true, attrs: 'inputmode="numeric" maxlength="4" autocomplete="off"', dica: 'A pessoa mostra o código no celular.' })
            : ui.campo({ label: 'Forma', name: 'tipo', opcoes: [{ id: 'retirada', label: 'Retirada no local' }, { id: 'entrega', label: 'Entrega em casa' }] })}
          ${ui.campo({ label: 'Observação', name: 'observacao', opcional: true, classe: 'span-all' })}</div>`,
      aoEnviar: (d) => {
        const itens = est.itens.map((i) => ({ estoqueId: i.id, quantidade: Number(d[`q_${i.id}`] || 0) })).filter((x) => x.quantidade > 0);
        return api.distribuicao.registrar({ itens, pessoasAtendidas: d.pessoasAtendidas, tipo: pedido ? pedido.tipo : d.tipo, pedidoId: pedido ? pedido.id : null, codigo: d.codigo, observacao: d.observacao });
      }
    });
    if (r) ui.toast(pedido ? 'Pedido concluído. Obrigado!' : 'Distribuição registrada.');
    return r;
  }
  async function estoque() {
    const est = await api.estoque.listar();
    const pct = est.capacidadeKg ? Math.min(100, Math.round((est.totalKg / est.capacidadeKg) * 100)) : 0;
    const corpo = html`
      <section class="section-row section-row--stretch">
        <div class="kpi"><div class="kpi__n">${U.kg(est.totalKg)}</div><div class="kpi__l">em estoque (estimado)</div></div>
        <div class="kpi"><div class="kpi__n">${est.itens.length}</div><div class="kpi__l">itens diferentes</div></div>
        <div class="kpi"><div class="kpi__n">${est.itens.filter((i) => i.diasParaVencer <= 1).length}</div><div class="kpi__l">vencem hoje ou amanhã</div></div>
        <div class="kpi col gap-8"><div class="kpi__l">Capacidade usada · ${pct}%</div><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Capacidade do estoque usada"><div class="progress__fill" style="width:${pct}%"></div></div>
          <div class="note">${U.kg(est.totalKg)} de ${U.kg(est.capacidadeKg)}</div></div>
      </section>
      <section class="card gap-10"><div class="card-head"><h2 class="card-title">Itens em estoque</h2><div class="row gap-10">
          <button type="button" class="btn btn-outline btn-sm" data-acao="adicionar">${ui.icone('plus', { tam: 18 })}Adicionar item</button>
          <button type="button" class="btn btn-success btn-sm" data-acao="distribuir">Registrar distribuição</button></div></div>
        ${est.itens.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Alimento</th><th class="num">Quantidade</th><th>Validade</th><th>Armazenamento</th><th>Origem</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>
          ${est.itens.map((i) => html`<tr><td><strong>${i.titulo}</strong><div class="note">${U.categoriaLabel(i.categoria)}</div></td><td class="num nowrap">${U.quantidade(i.quantidade, i.unidade)}</td>
            <td>${ui.tagValidade(i.validade, { tam: 'xs' })}</td><td>${i.armazenamento}</td><td>${i.origem === 'doacao' ? 'Doação' : 'Entrada avulsa'}<div class="note">${U.dataLonga(i.entradaEm)}</div></td>
            <td class="nowrap"><button type="button" class="link" data-acao="distribuir" data-id="${i.id}">Distribuir</button> · <button type="button" class="link" data-acao="baixa" data-id="${i.id}">Dar baixa</button></td></tr>`)}
        </tbody></table></div>` : ui.vazio('Estoque vazio', 'Os alimentos entram aqui quando você confirma o recebimento de uma doação.')}
      </section>`;
    return {
      titulo: 'Estoque', subtitulo: 'Alimentos recebidos e prontos para distribuir. Use primeiro o que vence antes.', nav: 'estoque', corpo,
      montar(main, c) {
        ui.delegar(main, {
          distribuir: async (b) => { if (await registrarDistribuicao({ itemInicial: b.dataset.id })) c.recarregar(); },
          adicionar: async () => {
            const r = await ui.modalForm({ titulo: 'Adicionar item ao estoque', sub: 'Para alimentos recebidos fora do aplicativo.', ok: 'Adicionar',
              campos: html`<div class="form-grid">${ui.campo({ label: 'Alimento', name: 'titulo', obrigatorio: true, classe: 'span-all', attrs: 'autofocus' })}
                ${ui.campo({ label: 'Tipo', name: 'categoria', opcoes: C.categorias })}${ui.campo({ label: 'Quantidade', name: 'quantidade', tipo: 'number', obrigatorio: true, attrs: 'min="0.1" step="0.1"' })}
                ${ui.campo({ label: 'Unidade', name: 'unidade', opcoes: C.unidades.map((u) => ({ id: u.id, label: u.label })) })}${ui.campo({ label: 'Validade', name: 'validade', tipo: 'date', obrigatorio: true, valor: U.isoDate(U.addDays(new Date(), 7)) })}
                ${ui.campo({ label: 'Armazenamento', name: 'armazenamento', opcoes: C.armazenamento })}</div>`,
              aoEnviar: (d) => api.estoque.adicionar(d) });
            if (r) { ui.toast('Item adicionado.'); c.recarregar(); }
          },
          baixa: async (b) => {
            const item = est.itens.find((i) => i.id === b.dataset.id);
            const r = await ui.modalForm({ titulo: `Dar baixa: ${item.titulo}`, sub: 'Use quando o alimento se perdeu (venceu, estragou, avariou).', ok: 'Dar baixa',
              campos: html`${ui.campo({ label: `Quantidade (${C.unidades.find((u) => u.id === item.unidade).label})`, name: 'quantidade', tipo: 'number', valor: item.quantidade, obrigatorio: true, attrs: `min="0.1" max="${item.quantidade}" step="0.1"` })}
                ${ui.campo({ label: 'Motivo', name: 'motivo', obrigatorio: true, opcoes: ['Venceu', 'Estragou', 'Embalagem danificada', 'Outro'], placeholder: 'Escolha' })}`,
              aoEnviar: (d) => api.estoque.baixa({ id: item.id, ...d }) });
            if (r) { ui.toast('Baixa registrada.'); c.recarregar(); }
          }
        });
      }
    };
  }

  /* =========================================================
     DISTRIBUIÇÃO (pedidos de beneficiários e entregas)
     ========================================================= */
  async function distribuicao({ eu }) {
    const [pedidos, dists] = await Promise.all([api.pedidos.daInstituicao({ status: 'abertos' }), api.distribuicao.listar({ limite: 15 })]);
    const aberto = U.aberto(eu.horario);
    const botoes = (p) => {
      if (p.status === 'solicitado') return html`<button type="button" class="btn btn-primary btn-sm" data-acao="ped" data-st="confirmado" data-id="${p.id}">Confirmar</button><button type="button" class="link" data-acao="ped" data-st="cancelado" data-id="${p.id}">Não consigo atender</button>`;
      if (p.status === 'confirmado') return p.tipo === 'entrega'
        ? html`<button type="button" class="btn btn-primary btn-sm" data-acao="ped" data-st="saiu_entrega" data-id="${p.id}">Saiu para entrega</button>`
        : html`<button type="button" class="btn btn-primary btn-sm" data-acao="ped" data-st="pronto" data-id="${p.id}">Avisar que está pronto</button>`;
      return html`<button type="button" class="btn btn-success btn-sm" data-acao="entregar" data-id="${p.id}">Registrar entrega</button>`;
    };
    const corpo = html`
      <section class="section-row section-row--start">
        <div class="card col-2 gap-6"><div class="card-head"><h2 class="card-title">Pedidos de alimento (${pedidos.length})</h2>
            <button type="button" class="btn btn-success btn-sm" data-acao="balcao">Registrar distribuição</button></div>
          <p class="note">Por privacidade, você vê só o necessário para atender. Endereço e telefone aparecem apenas em entregas em andamento.</p>
          ${pedidos.length ? pedidos.map((p) => html`<div class="list-row"><div class="grow"><div class="list-row__title">Pedido nº ${p.codigo} · ${p.tipo === 'entrega' ? 'Entrega' : 'Retirada'}</div>
              <div class="list-row__sub">${p.apelido} · ${p.bairro} · ${U.tempoRelativo(p.criadoEm)}${p.tipo === 'entrega' && p.enderecoEntrega ? html`<br>${ui.icone('pin', { tam: 14, estilo: 'vertical-align:-2px' })} ${p.enderecoEntrega} · ${p.telefone}` : ''}${p.observacao ? html`<br>“${p.observacao}”` : ''}</div></div>
            <div class="list-row__actions">${ui.tagPedido(p.status)}${botoes(p)}</div></div>`) : ui.vazio('Nenhum pedido em aberto', 'Quando alguém pedir alimento ao seu ponto, aparece aqui.')}
        </div>
        <div class="col-1 col gap-20">
          <div class="card card--green gap-10"><div class="card-label">${ui.icone('pin')}Ponto de distribuição</div>
            <div class="list-row__title">${aberto ? 'Aberto agora' : 'Fechado agora'}</div><div class="card-sub">${U.horarioTexto(eu.horario)}</div>
            <div class="card-sub">${eu.endereco.logradouro}, ${eu.endereco.bairro}</div><a class="btn btn-outline" href="#/perfil">Alterar horário</a></div>
        </div>
      </section>
      <section class="card gap-10"><h2 class="card-title">Distribuições recentes</h2>
        ${dists.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Forma</th><th class="num">Pessoas</th><th>Itens</th><th class="num">Peso</th></tr></thead><tbody>
          ${dists.map((d) => html`<tr><td class="nowrap">${U.dataHora(d.em)}</td><td>${d.tipo === 'perda' ? `Baixa (${d.motivo})` : d.tipo === 'entrega' ? 'Entrega' : 'Retirada'}</td><td class="num">${d.pessoasAtendidas || '—'}</td>
            <td>${d.itens.map((i) => `${i.titulo} (${U.quantidade(i.quantidade, i.unidade)})`).join(', ')}</td><td class="num nowrap">${U.kg(d.pesoKg)}</td></tr>`)}</tbody></table></div>` : ui.vazio('Nenhuma distribuição registrada')}
      </section>`;
    return {
      titulo: 'Distribuição', subtitulo: 'Atenda os pedidos e registre o que foi entregue às pessoas.', nav: 'distribuicao', corpo,
      montar(main, c) {
        ui.delegar(main, {
          ped: async (b) => {
            if (b.dataset.st === 'cancelado' && !(await ui.confirmar({ titulo: 'Recusar este pedido?', texto: 'A pessoa será avisada para procurar outro ponto.', ok: 'Recusar pedido' }))) return;
            await ui.executar(b, async () => { await api.pedidos.atualizar({ id: b.dataset.id, status: b.dataset.st }); ui.toast('Pedido atualizado. A pessoa foi avisada.'); c.recarregar(); });
          },
          entregar: async (b) => { if (await registrarDistribuicao({ pedido: pedidos.find((p) => p.id === b.dataset.id) })) c.recarregar(); },
          balcao: async () => { if (await registrarDistribuicao()) c.recarregar(); }
        });
      }
    };
  }

  /* =========================================================
     VOLUNTÁRIOS E ENTREGADORES
     ========================================================= */
  async function voluntarios() {
    const vols = await api.voluntarios.listar();
    const form = (v = {}) => html`<div class="form-grid">${ui.campo({ label: 'Nome completo', name: 'nome', valor: v.nome || '', obrigatorio: true, classe: 'span-all', attrs: 'autofocus autocomplete="off"' })}
      ${ui.campo({ label: 'Celular', name: 'telefone', valor: v.telefone || '', obrigatorio: true, attrs: 'data-mascara="telefone" inputmode="tel"' })}
      ${ui.campo({ label: 'Função', name: 'funcao', valor: v.funcao || 'Voluntário', opcoes: C.funcoesVoluntario })}
      ${ui.campo({ label: 'Veículo', name: 'veiculo', valor: v.veiculo || '', opcional: true, placeholder: 'Ex.: Fiorino branca' })}
      <div class="field"><span class="field__label">Disponibilidade</span>${ui.checkbox({ label: 'Disponível para coletas', name: 'disponivel', marcado: v.id ? v.disponivel : true })}</div></div>`;
    const abrir = async (v) => {
      const r = await ui.modalForm({ titulo: v ? `Editar ${v.nome}` : 'Novo voluntário ou entregador', ok: 'Salvar', campos: form(v),
        aoMontar: (el) => NH.comum.ligarMascaras(el), aoEnviar: (d) => api.voluntarios.salvar({ ...d, id: v ? v.id : undefined }) });
      return r;
    };
    return {
      titulo: 'Voluntários', subtitulo: 'Equipe que busca as doações e entrega às pessoas.', nav: 'voluntarios',
      acoes: html`<button type="button" class="btn btn-primary" data-acao="novo">${ui.icone('plus', { cor: C.cores.brown, traco: 2.5 })}Adicionar pessoa</button>`,
      corpo: html`<section class="row gap-16"><div class="tile"><div class="tile__n">${vols.filter((v) => v.disponivel).length}</div><div class="tile__l">disponíveis</div></div>
          <div class="tile"><div class="tile__n">${vols.filter((v) => v.funcao !== 'Voluntário').length}</div><div class="tile__l">motoristas e entregadores</div></div>
          <div class="tile"><div class="tile__n">${vols.reduce((a, v) => a + v.emColeta, 0)}</div><div class="tile__l">coletas atribuídas</div></div></section>
        <section class="card gap-6"><h2 class="card-title">Equipe (${vols.length})</h2>
        ${vols.length ? vols.map((v) => html`<div class="list-row"><div class="row items-center gap-12">${ui.avatar(v.nome)}<div><div class="list-row__title">${v.nome}</div>
            <div class="list-row__sub">${v.funcao} · ${v.telefone}${v.veiculo ? ` · ${v.veiculo}` : ''}${v.emColeta ? ` · ${U.plural(v.emColeta, 'coleta atribuída', 'coletas atribuídas')}` : ''}</div></div></div>
          <div class="list-row__actions"><button type="button" class="chip${v.disponivel ? ' is-on' : ''}" aria-pressed="${v.disponivel ? 'true' : 'false'}" data-acao="disp" data-id="${v.id}">${v.disponivel ? 'Disponível' : 'Indisponível'}</button>
            <button type="button" class="link" data-acao="editar" data-id="${v.id}">Editar</button><button type="button" class="link" data-acao="remover" data-id="${v.id}">Remover</button></div></div>`)
          : ui.vazio('Nenhuma pessoa cadastrada', 'Cadastre quem vai buscar as doações.')}</section>`,
      montar(main, c) {
        const achar = (id) => vols.find((v) => v.id === id);
        ui.delegar(main, {
          novo: async () => { if (await abrir()) { ui.toast('Pessoa adicionada.'); c.recarregar(); } },
          editar: async (b) => { if (await abrir(achar(b.dataset.id))) { ui.toast('Dados atualizados.'); c.recarregar(); } },
          disp: (b) => ui.executar(b, async () => { const v = achar(b.dataset.id); await api.voluntarios.salvar({ ...v, disponivel: !v.disponivel }); c.recarregar(); }),
          remover: async (b) => {
            const v = achar(b.dataset.id);
            if (!(await ui.confirmar({ titulo: `Remover ${v.nome}?`, texto: 'A pessoa deixa de aparecer na escolha de responsável.', ok: 'Remover' }))) return;
            await ui.executar(b, async () => { await api.voluntarios.remover({ id: v.id }); ui.toast('Pessoa removida.'); c.recarregar(); });
          }
        });
      }
    };
  }

  /* =========================================================
     RELATÓRIOS DE IMPACTO
     ========================================================= */
  async function relatorios({ query }) {
    const anoAtual = new Date().getFullYear();
    const ano = Number(query.ano) || anoAtual;
    const [rel, dists, receb] = await Promise.all([api.relatorios.instituicao({ ano }), api.distribuicao.listar({ limite: 1000 }), api.doacoes.daInstituicao({ status: 'entregue' })]);
    const meses = ano === anoAtual ? new Date().getMonth() + 1 : 12;
    const corpo = html`
      <section class="chips" aria-label="Ano"><label class="sr-only" for="rel_ano">Ano</label><select class="chip is-on" id="rel_ano" data-ano>${[anoAtual, anoAtual - 1].map((a) => html`<option ${a === ano ? raw('selected') : ''}>${a}</option>`)}</select></section>
      <section class="row gap-16" aria-label="Indicadores">
        <div class="kpi"><div class="kpi__n">${U.num(rel.kgRecebidos)} kg</div><div class="kpi__l">recebidos em ${U.plural(rel.doacoesRecebidas, 'doação', 'doações')}</div></div>
        <div class="kpi"><div class="kpi__n">${U.num(rel.pessoasAtendidas)}</div><div class="kpi__l">atendimentos a pessoas</div></div>
        <div class="kpi"><div class="kpi__n">${U.num(rel.refeicoes)}</div><div class="kpi__l">refeições geradas</div></div>
        <div class="kpi"><div class="kpi__n">${U.num(rel.kgPerdidos)} kg</div><div class="kpi__l">perdidos (baixas)</div></div>
      </section>
      <section class="section-row section-row--stretch">
        <div class="card col-2 gap-14"><div><h2 class="card-title">Alimento recebido por mês</h2><div class="card-sub">Quilos recebidos em ${ano}</div></div>
          ${ui.barras(rel.porMesRecebido.slice(0, meses).map((m) => ({ label: m.label, valor: Math.round(m.valor) })), { rotulo: `Gráfico de barras: quilos recebidos por mês em ${ano}` })}</div>
        <div class="card col-1 gap-6"><h2 class="card-title">Principais doadores</h2>
          ${rel.porDoador.length ? rel.porDoador.slice(0, 6).map((d) => html`<div class="list-row"><div><div class="list-row__title">${d.nome}</div><div class="list-row__sub">${U.plural(d.doacoes, 'doação', 'doações')}</div></div><strong>${U.num(d.kg)} kg</strong></div>`) : ui.vazio('Sem doações neste ano')}
          ${rel.avaliacao.total ? html`<div class="list-row"><div class="list-row__title">Sua avaliação</div><div class="row items-center gap-8">${ui.estrelas(rel.avaliacao.media)}<strong>${U.num(rel.avaliacao.media, 1)}</strong></div></div>` : ''}</div>
      </section>
      <section class="card gap-10"><div class="card-head"><h2 class="card-title">Exportar dados</h2></div>
        <p class="card-sub">Planilhas para prestação de contas. Não incluem dados pessoais das pessoas atendidas.</p>
        <div class="form-actions"><button type="button" class="btn btn-outline" data-acao="csv-receb">${ui.icone('download', { tam: 20 })}Doações recebidas</button>
          <button type="button" class="btn btn-outline" data-acao="csv-dist">${ui.icone('download', { tam: 20 })}Distribuições</button></div></section>`;
    return {
      titulo: 'Relatórios', subtitulo: `Relatório de impacto da instituição em ${ano}.`, nav: 'relatorios', corpo,
      montar(main) {
        main.querySelector('[data-ano]').addEventListener('change', (e) => NH.app.navegar(`#/relatorios?ano=${e.target.value}`));
        ui.delegar(main, {
          'csv-receb': () => NH.comum.exportarCSV(`no-hunger-recebidas-${ano}.csv`, receb.filter((d) => new Date(d.entregueEm).getFullYear() === ano), [
            { label: 'Data', valor: (d) => U.dataLonga(d.entregueEm) }, { label: 'Doador', valor: (d) => d.doador.nome }, { label: 'Alimento', valor: 'titulo' },
            { label: 'Quantidade', valor: (d) => U.num(d.quantidadeRecebida || d.quantidade, 1) }, { label: 'Unidade', valor: 'unidade' }, { label: 'Peso (kg)', valor: (d) => U.num(d.pesoEntregueKg, 1) },
            { label: 'Comprovante', valor: (d) => (d.comprovante ? d.comprovante.numero : '') }]),
          'csv-dist': () => NH.comum.exportarCSV(`no-hunger-distribuicoes-${ano}.csv`, dists.filter((d) => new Date(d.em).getFullYear() === ano), [
            { label: 'Data', valor: (d) => U.dataHora(d.em) }, { label: 'Forma', valor: 'tipo' }, { label: 'Pessoas atendidas', valor: 'pessoasAtendidas' },
            { label: 'Itens', valor: (d) => d.itens.map((i) => `${i.titulo} (${U.quantidade(i.quantidade, i.unidade)})`).join(', ') }, { label: 'Peso (kg)', valor: (d) => U.num(d.pesoKg, 1) }])
        });
      }
    };
  }

  /* ---------- Inicialização ---------- */
  NH.app.iniciar({
    perfil: 'instituicao', padrao: '/perto',
    nav: [
      { id: 'inicio', label: 'Início', icone: 'home', rota: '/inicio' },
      { id: 'perto', label: 'Doações por perto', icone: 'map', rota: '/perto', contador: (c) => c.perto },
      { id: 'reservas', label: 'Minhas reservas', icone: 'check', rota: '/reservas', contador: (c) => c.reservas },
      { id: 'estoque', label: 'Estoque', icone: 'box', rota: '/estoque' },
      { id: 'distribuicao', label: 'Distribuição', icone: 'truck', rota: '/distribuicao', contador: (c) => c.pedidos },
      { id: 'voluntarios', label: 'Voluntários', icone: 'users', rota: '/voluntarios' },
      { id: 'mensagens', label: 'Mensagens', icone: 'chat', rota: '/mensagens', contador: (c) => c.mensagens },
      { id: 'relatorios', label: 'Relatórios', icone: 'chart', rota: '/relatorios' },
      { id: 'ajuda', label: 'Ajuda', icone: 'help', rota: '/ajuda' }
    ],
    rotas: {
      '/inicio': inicio, '/perto': perto, '/doacao/:id': detalhe, '/reservas': reservas, '/estoque': estoque, '/distribuicao': distribuicao,
      '/voluntarios': voluntarios, '/mensagens': NH.comum.mensagens, '/mensagens/:id': NH.comum.mensagens, '/relatorios': relatorios,
      '/ajuda': NH.comum.ajuda, '/perfil': NH.comum.perfil
    }
  });
})();
