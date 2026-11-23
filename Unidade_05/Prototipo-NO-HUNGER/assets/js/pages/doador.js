/* =========================================================
   NO hunger — Área do doador
   Início · Publicar excedente · Minhas doações · Histórico
   Benefício fiscal · Mensagens · Avaliações · Ajuda · Perfil
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui, api = NH.api;
  const { html, raw } = U;

  /* ---------- Blocos da área ---------- */
  function subLinha(d) {
    if (d.status === 'publicada') return `Retirada ${U.janela(d.janela)} · aguardando reserva`;
    if (d.status === 'reservada') return `Retirada ${U.janela(d.janela)} · ${d.instituicao ? d.instituicao.nome : ''}`;
    if (d.status === 'coletada') return `Coletada às ${U.hora(U.horaDe(d.coletadaEm))} · ${d.instituicao ? d.instituicao.nome : ''}`;
    if (d.status === 'entregue') return `Entregue em ${U.dataLonga(d.entregueEm)} · ${d.instituicao ? d.instituicao.nome : ''}`;
    if (d.status === 'cancelada') return `Cancelada${d.motivoCancelamento ? ` · ${d.motivoCancelamento}` : ''}`;
    return `Validade ${U.dataLonga(d.validade)} · sem reserva`;
  }
  function linhaDoacao(d, { acoes = false } = {}) {
    return html`<div class="don-row">
      <div class="don-row__top"><div><a class="don-row__title" href="#/doacoes/${d.id}">${d.titulo} <span>· ${U.quantidade(d.quantidade, d.unidade)}</span></a>
        <div class="don-row__sub">${subLinha(d)}</div></div>${ui.tag(d.status)}</div>
      ${['cancelada', 'expirada'].includes(d.status) ? '' : ui.etapas(d.status)}
      ${acoes ? html`<div class="don-row__actions">
        <a class="link" href="#/doacoes/${d.id}">Ver detalhes</a>
        ${d.status === 'publicada' ? html`<a class="link" href="#/doacoes/${d.id}/editar">Editar</a>` : ''}
        ${d.instituicao && ['reservada', 'coletada', 'entregue'].includes(d.status) ? html`<a class="link" href="#/mensagens/${d.id}">Conversar${d.naoLidas ? ` (${d.naoLidas})` : ''}</a>` : ''}
        ${['publicada', 'expirada'].includes(d.status) ? html`<button type="button" class="link" data-acao="excluir" data-id="${d.id}">Excluir</button>` : ''}
        ${d.status === 'reservada' ? html`<button type="button" class="link" data-acao="cancelar" data-id="${d.id}">Cancelar</button>` : ''}
        ${d.status === 'entregue' && !d.minhaAvaliacao ? html`<button type="button" class="link" data-acao="avaliar" data-id="${d.id}" data-titulo="${d.titulo}">Avaliar instituição</button>` : ''}
      </div>` : ''}
    </div>`;
  }
  /* Ações comuns de doação (excluir, cancelar, avaliar) */
  function acoesDoacao(recarregar) {
    return {
      excluir: async (b) => {
        if (!(await ui.confirmar({ titulo: 'Excluir esta doação?', texto: 'Ela deixa de aparecer para as instituições. Esta ação não pode ser desfeita.', ok: 'Excluir' }))) return;
        await ui.executar(b, async () => { await api.doacoes.excluir({ id: b.dataset.id }); ui.toast('Doação excluída.'); if (location.hash.startsWith('#/doacoes/')) NH.app.navegar('#/doacoes'); else recarregar(); });
      },
      cancelar: async (b) => {
        const motivo = await ui.pedirMotivo({ titulo: 'Cancelar doação reservada', texto: 'A instituição será avisada. Explique o motivo.', ok: 'Cancelar doação' });
        if (!motivo) return;
        await ui.executar(b, async () => { await api.doacoes.cancelar({ id: b.dataset.id, motivo }); ui.toast('Doação cancelada. A instituição foi avisada.'); recarregar(); });
      },
      'cancelar-publicada': async (b) => {
        if (!(await ui.confirmar({ titulo: 'Cancelar esta doação?', texto: 'Ela fica no seu histórico como cancelada.', ok: 'Cancelar doação' }))) return;
        await ui.executar(b, async () => { await api.doacoes.cancelar({ id: b.dataset.id }); ui.toast('Doação cancelada.'); recarregar(); });
      },
      avaliar: async (b) => { if (await NH.comum.avaliar({ doacaoId: b.dataset.id, titulo: 'Avaliar a instituição', sub: b.dataset.titulo })) recarregar(); }
    };
  }

  /* =========================================================
     INÍCIO (interface original)
     ========================================================= */
  async function inicio({ eu }) {
    const [andamento, pendRec, rel] = await Promise.all([
      api.doacoes.minhas({ status: 'andamento' }), api.recorrencias.pendentes(), api.relatorios.doador({})
    ]);
    const ordem = { reservada: 0, publicada: 1, coletada: 2 };
    const lista = andamento.slice().sort((a, b) => ordem[a.status] - ordem[b.status] || (a.janela.data + a.janela.inicio).localeCompare(b.janela.data + b.janela.inicio));
    const hojeAnd = andamento.filter((d) => d.janela && d.janela.data === U.isoDate()).length || andamento.length;
    const atencao = pendRec.length
      ? html`<div class="attention">
          <div class="attention__label">${ui.icone('clock', { tam: 20, cor: C.cores.brown })}Atenção ao vencimento</div>
          <div class="attention__title">${pendRec.length === 1 ? '1 produto vence hoje' : `${pendRec.length} produtos vencem hoje`}</div>
          <div class="attention__text">${U.listaTexto(pendRec.map((r, i) => `${i ? r.modelo.titulo.toLowerCase() : r.modelo.titulo} (${U.quantidade(r.modelo.quantidade, r.modelo.unidade)})`))}</div>
          <button type="button" class="btn btn-primary mt-auto" data-acao="doar-agora">Doar agora</button>
        </div>`
      : html`<div class="attention attention--calm">
          <div class="attention__label">${ui.icone('repeat', { tam: 20, cor: C.cores.brown })}Doações recorrentes</div>
          <div class="attention__title">Nada vencendo hoje</div>
          <div class="attention__text">Sobra parecida todo dia? Crie uma doação recorrente e publique com um clique.</div>
          <a class="btn btn-outline mt-auto" href="#/publicar?repetir=1">Criar recorrente</a>
        </div>`;
    const corpo = html`
      <section aria-label="Ações principais" class="row gap-20">
        <div class="hero">
          <h2 class="hero__title">Tem alimento sobrando?</h2>
          <p class="hero__text">Publique em menos de 1 minuto. As instituições perto de você recebem o aviso na hora.</p>
          <a class="btn btn-primary-lg" href="#/publicar">${ui.icone('plus', { cor: C.cores.brown, traco: 2.5 })}Publicar excedente</a>
        </div>
        ${atencao}
      </section>

      <section class="section-row section-row--start">
        <div class="card col-2 gap-6">
          <div class="card-head"><h2 class="card-title">Suas doações em andamento</h2><a class="link" href="#/doacoes">Ver todas</a></div>
          ${lista.length ? lista.slice(0, 3).map((d) => linhaDoacao(d)) : ui.vazio('Nenhuma doação em andamento', 'Quando você publicar, o andamento aparece aqui.')}
        </div>
        <div class="card card--green col-1 gap-10">
          <div class="card-label">${ui.icone('doc')}Benefício fiscal</div>
          <div class="card-sub">Acumulado em ${rel.ano}</div>
          <div class="big-money">${U.dinheiro(rel.beneficio)}</div>
          <div class="card-sub" style="line-height:22px">de redução de impostos, com base em ${U.plural(rel.concluidas, 'doação comprovada', 'doações comprovadas')}.</div>
          <a class="btn btn-outline" style="margin-top:8px" href="comprovante.html?ano=${rel.ano}">Baixar comprovantes</a>
          <a class="link text-center" href="#/beneficio">Ver detalhes do benefício</a>
        </div>
      </section>

      <section aria-label="Seu impacto" class="card gap-16">
        <div class="card-head"><h2 class="card-title">Seu impacto em ${rel.ano}</h2><a class="link" href="#/historico">Ver relatório completo</a></div>
        <div class="row gap-16">
          <div class="metric"><div class="metric__n">${U.num(rel.totalKg)} kg</div><div class="metric__l">de alimentos doados</div></div>
          <div class="metric"><div class="metric__n">${U.num(rel.refeicoes)}</div><div class="metric__l">refeições geradas</div></div>
          <div class="metric"><div class="metric__n">${U.num(rel.concluidas)}</div><div class="metric__l">doações concluídas</div></div>
        </div>
      </section>`;
    return {
      titulo: `Olá, ${eu.nome}`,
      tituloAba: 'Início',
      subtitulo: andamento.length ? `Você tem ${U.plural(hojeAnd, 'doação', 'doações')} em andamento hoje.` : 'Nenhuma doação em andamento agora.',
      nav: 'inicio', corpo,
      montar(main, c) {
        ui.delegar(main, {
          'doar-agora': (b) => ui.executar(b, async () => {
            const criadas = await api.recorrencias.publicarPendentes();
            ui.toast(`${U.plural(criadas.length, 'doação publicada', 'doações publicadas')}. As instituições próximas foram avisadas.`);
            c.recarregar();
          })
        });
      }
    };
  }

  /* =========================================================
     PUBLICAR / EDITAR
     ========================================================= */
  function formDoacao(d, { repetir = false } = {}) {
    const hoje = U.isoDate();
    const v = d || { titulo: '', quantidade: '', unidade: 'kg', categoria: 'padaria', armazenamento: 'ambiente', validade: hoje, janela: { data: hoje, inicio: '19:00', fim: '20:00' }, observacoes: '', fotos: [] };
    const foto = v.fotos && v.fotos[0];
    return html`<form class="card form" data-form-doacao novalidate>
      <h2 class="card-title">O que você vai doar?</h2>
      <div class="form-grid">
        ${ui.campo({ label: 'Alimento', name: 'titulo', valor: v.titulo, obrigatorio: true, placeholder: 'Ex.: Pães franceses', attrs: 'maxlength="60" autofocus', classe: 'span-all' })}
        ${ui.campo({ label: 'Tipo de alimento', name: 'categoria', valor: v.categoria, opcoes: C.categorias })}
        ${ui.campo({ label: 'Quantidade', name: 'quantidade', tipo: 'number', valor: v.quantidade, obrigatorio: true, attrs: 'min="0.1" step="0.1" inputmode="decimal"' })}
        ${ui.campo({ label: 'Unidade', name: 'unidade', valor: v.unidade, opcoes: C.unidades.map((u) => ({ id: u.id, label: u.label })) })}
        ${ui.campo({ label: 'Validade', name: 'validade', tipo: 'date', valor: v.validade, obrigatorio: true, attrs: `min="${hoje}"` })}
        <div class="span-all">${ui.chipsEscolha({ legenda: 'Como guardar', name: 'armazenamento', tipo: 'radio', opcoes: C.armazenamento.map((a) => ({ id: a.id, label: a.label[0].toUpperCase() + a.label.slice(1) })), valores: [v.armazenamento] })}</div>
      </div>
      <h2 class="card-title">Retirada</h2>
      <div class="form-grid">
        ${ui.campo({ label: 'Dia', name: 'janela.data', tipo: 'date', valor: v.janela.data, obrigatorio: true, attrs: `min="${hoje}"` })}
        ${ui.campo({ label: 'Das', name: 'janela.inicio', tipo: 'time', valor: v.janela.inicio, obrigatorio: true })}
        ${ui.campo({ label: 'Até', name: 'janela.fim', tipo: 'time', valor: v.janela.fim, obrigatorio: true })}
        ${ui.campo({ label: 'Observações para quem vai buscar', name: 'observacoes', tipo: 'textarea', valor: v.observacoes, opcional: true, classe: 'span-all', placeholder: 'Ex.: retirar pela porta dos fundos; trazer caixas.' })}
      </div>
      <div class="field" data-campo="foto"><span class="field__label">Foto <small>(opcional)</small></span>
        <label class="upload"><span class="upload__thumb" data-foto-preview>${foto ? raw(`<img src="${U.esc(foto)}" alt="" class="upload__thumb">`) : ui.icone('camera', { tam: 28, cor: C.cores.brown700 })}</span>
          <span class="col"><strong data-foto-nome>${foto ? 'Trocar foto' : 'Adicionar foto'}</strong><span class="note">Ajuda a instituição a se organizar.</span></span>
          <input type="file" accept="image/*" capture="environment" data-foto></label>
        ${foto ? html`<button type="button" class="link" data-acao="remover-foto" style="align-self:flex-start">Remover foto</button>` : ''}
      </div>
      ${d ? '' : html`<div class="col gap-10">${ui.checkbox({ label: 'Repetir esta doação (doação recorrente)', name: 'repetir', marcado: repetir, attrs: 'data-repetir' })}
        <div data-dias ${repetir ? '' : raw('hidden')}>${ui.chipsEscolha({ legenda: 'Em quais dias?', name: 'dias[]', opcoes: C.diasSemana.map((n, i) => ({ id: i, label: n })), valores: [1, 2, 3, 4, 5, 6] })}
          <p class="note" style="margin-top:6px">Nos dias marcados, a doação aparece no seu início para publicar com um clique.</p></div></div>`}
      <div class="form-actions">
        <button type="submit" class="btn btn-primary-lg">${d ? 'Salvar alterações' : html`${ui.icone('plus', { cor: C.cores.brown, traco: 2.5 })}Publicar excedente`}</button>
        <a class="link link--pad" href="${d ? `#/doacoes/${d.id}` : '#/inicio'}">Cancelar</a>
      </div>
    </form>`;
  }
  function ligarFormDoacao(main, { aoSalvar, fotoInicial }) {
    const form = main.querySelector('[data-form-doacao]');
    let foto = fotoInicial || null;
    const inp = form.querySelector('[data-foto]');
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      try {
        foto = await U.reduzirImagem(f);
        form.querySelector('[data-foto-preview]').innerHTML = `<img src="${foto}" alt="Prévia da foto" class="upload__thumb">`;
        form.querySelector('[data-foto-nome]').textContent = 'Trocar foto';
      } catch (e) { ui.toast(e.message, 'aviso'); }
    });
    const rem = form.querySelector('[data-acao="remover-foto"]');
    if (rem) rem.addEventListener('click', () => { foto = null; form.querySelector('[data-foto-preview]').innerHTML = String(ui.icone('camera', { tam: 28, cor: C.cores.brown700 })); rem.remove(); });
    const rep = form.querySelector('[data-repetir]');
    if (rep) rep.addEventListener('change', () => { form.querySelector('[data-dias]').hidden = !rep.checked; });
    /* Validade acompanha o dia da retirada, se ficar antes */
    const dia = form.querySelector('[name="janela.data"]'), val = form.querySelector('[name="validade"]');
    dia.addEventListener('change', () => { if (val.value && dia.value > val.value) val.value = dia.value; });
    ui.aoEnviar(form, async (d) => aoSalvar({ ...d, fotos: foto ? [foto] : [] }));
  }
  function painelComoFunciona() {
    const passos = [
      ['Você publica', 'Instituições a até 10 km recebem o aviso na hora.'],
      ['Uma instituição reserva', 'Ela tem 30 minutos para dizer quem vai buscar.'],
      ['Coleta', 'Acompanhe no mapa quem está vindo buscar.'],
      ['Entregue', 'A instituição confirma o recebimento e o comprovante fica disponível.']
    ];
    return html`<aside class="card card--green col-1 gap-14" aria-label="Como funciona">
      <h2 class="card-title">Como funciona</h2>
      <ol class="col gap-14">${passos.map(([t, d], i) => html`<li class="row gap-12" style="flex-wrap:nowrap"><span class="pin" aria-hidden="true">${i + 1}</span><div><div class="list-row__title">${t}</div><div class="list-row__sub">${d}</div></div></li>`)}</ol>
      <p class="note">Doe apenas alimentos próprios para consumo, dentro da validade e bem acondicionados.</p>
    </aside>`;
  }
  async function publicar({ query }) {
    return {
      titulo: 'Publicar excedente', subtitulo: 'Leva menos de 1 minuto. Você pode editar até alguém reservar.', nav: 'publicar', vivo: false,
      corpo: html`<div class="section-row section-row--start"><div class="col-2">${formDoacao(null, { repetir: query.repetir === '1' })}</div>${painelComoFunciona()}</div>`,
      montar(main) {
        ligarFormDoacao(main, {
          aoSalvar: async (d) => {
            const n = await api.doacoes.publicar(d);
            ui.toast(d.repetir ? 'Doação publicada e recorrência criada.' : 'Doação publicada! As instituições próximas foram avisadas.');
            NH.app.navegar(`#/doacoes/${n.id}`);
          }
        });
      }
    };
  }
  async function editar({ params }) {
    const d = await api.doacoes.detalhe({ id: params.id });
    if (d.status !== 'publicada') {
      return { titulo: 'Esta doação não pode mais ser editada', nav: 'doacoes', voltar: { href: `#/doacoes/${d.id}`, label: 'Voltar para a doação' },
        corpo: html`<div class="card">${ui.vazio('A doação já foi reservada', 'Combine mudanças com a instituição pelo chat ou cancele informando o motivo.', html`<a class="btn btn-primary" href="#/mensagens/${d.id}">Abrir conversa</a>`)}</div>` };
    }
    return {
      titulo: `Editar: ${d.titulo}`, nav: 'doacoes', vivo: false, voltar: { href: `#/doacoes/${d.id}`, label: 'Voltar para a doação' },
      corpo: html`<div class="section-row section-row--start"><div class="col-2">${formDoacao(d)}</div>${painelComoFunciona()}</div>`,
      montar(main) {
        ligarFormDoacao(main, { fotoInicial: d.fotos && d.fotos[0], aoSalvar: async (x) => { await api.doacoes.editar({ ...x, id: d.id }); ui.toast('Alterações salvas.'); NH.app.navegar(`#/doacoes/${d.id}`); } });
      }
    };
  }

  /* =========================================================
     MINHAS DOAÇÕES
     ========================================================= */
  const FILTROS = [
    { id: 'andamento', label: 'Em andamento' }, { id: 'publicada', label: 'Publicadas' }, { id: 'reservada', label: 'Reservadas' },
    { id: 'coletada', label: 'Coletadas' }, { id: 'entregue', label: 'Entregues' }, { id: 'recorrentes', label: 'Recorrentes' }
  ];
  async function minhas({ query }) {
    const filtro = query.filtro || 'andamento';
    const chips = html`<section aria-label="Filtros" class="chips">${FILTROS.map((f) => html`<a class="chip${f.id === filtro ? ' is-on' : ''}" href="#/doacoes?filtro=${f.id}" ${f.id === filtro ? raw('aria-current="true"') : ''}>${f.label}</a>`)}</section>`;
    if (filtro === 'recorrentes') {
      const recs = await api.recorrencias.listar();
      return {
        titulo: 'Minhas doações', subtitulo: 'Doações que se repetem nos dias escolhidos.', nav: 'doacoes',
        corpo: html`${chips}<section class="card gap-6"><div class="card-head"><h2 class="card-title">Doações recorrentes</h2><a class="link" href="#/publicar?repetir=1">Criar recorrente</a></div>
          ${recs.length ? recs.map((r) => html`<div class="list-row"><div><div class="list-row__title">${r.modelo.titulo} <span class="text-muted" style="font-weight:500">· ${U.quantidade(r.modelo.quantidade, r.modelo.unidade)}</span></div>
            <div class="list-row__sub">${r.dias.length === 7 ? 'Todos os dias' : r.dias.map((x) => C.diasSemana[x]).join(', ')} · retirada ${U.hora(r.modelo.janela.inicio)} às ${U.hora(r.modelo.janela.fim)}${r.ultimaPublicacao ? ` · última publicação ${U.diaRelativo(r.ultimaPublicacao)}` : ''}</div></div>
            <div class="list-row__actions">${r.ativa ? (r.pendenteHoje ? html`<span class="tag tag--xs tag--aviso">Pendente hoje</span>` : html`<span class="tag tag--xs tag--ok">Ativa</span>`) : html`<span class="tag tag--xs tag--neutra">Pausada</span>`}
              ${r.pendenteHoje ? html`<button type="button" class="btn btn-primary btn-sm" data-acao="publicar-rec" data-id="${r.id}">Publicar hoje</button>` : ''}
              <button type="button" class="link" data-acao="editar-rec" data-id="${r.id}">Editar</button>
              <button type="button" class="link" data-acao="pausar-rec" data-id="${r.id}" data-ativa="${r.ativa ? '1' : ''}">${r.ativa ? 'Pausar' : 'Retomar'}</button>
              <button type="button" class="link" data-acao="excluir-rec" data-id="${r.id}">Excluir</button></div></div>`)
            : ui.vazio('Nenhuma doação recorrente', 'Marque "Repetir esta doação" ao publicar.', html`<a class="btn btn-primary" href="#/publicar?repetir=1">Criar recorrente</a>`)}</section>`,
        montar(main, c) {
          const achar = (id) => recs.find((r) => r.id === id);
          ui.delegar(main, {
            'publicar-rec': (b) => ui.executar(b, async () => { await api.recorrencias.publicarPendentes({ ids: [b.dataset.id] }); ui.toast('Doação publicada.'); c.recarregar(); }),
            'pausar-rec': (b) => ui.executar(b, async () => { await api.recorrencias.salvar({ id: b.dataset.id, ativa: !b.dataset.ativa }); ui.toast(b.dataset.ativa ? 'Recorrência pausada.' : 'Recorrência retomada.'); c.recarregar(); }),
            'excluir-rec': async (b) => { if (await ui.confirmar({ titulo: 'Excluir recorrência?', texto: 'As doações já publicadas não são afetadas.', ok: 'Excluir' })) { await api.recorrencias.excluir({ id: b.dataset.id }); ui.toast('Recorrência excluída.'); c.recarregar(); } },
            'editar-rec': async (b) => {
              const r = achar(b.dataset.id);
              const ok = await ui.modalForm({
                titulo: `Editar: ${r.modelo.titulo}`, ok: 'Salvar',
                campos: html`${ui.campo({ label: `Quantidade (${C.unidades.find((u) => u.id === r.modelo.unidade).label})`, name: 'quantidade', tipo: 'number', valor: r.modelo.quantidade, obrigatorio: true, attrs: 'min="0.1" step="0.1"' })}
                  ${ui.chipsEscolha({ legenda: 'Dias', name: 'dias[]', opcoes: C.diasSemana.map((n, i) => ({ id: i, label: n })), valores: r.dias })}`,
                aoEnviar: (d) => api.recorrencias.salvar({ id: r.id, quantidade: d.quantidade, dias: (d.dias || []).map(Number) })
              });
              if (ok) { ui.toast('Recorrência atualizada.'); c.recarregar(); }
            }
          });
        }
      };
    }
    const lista = await api.doacoes.minhas({ status: filtro === 'andamento' ? 'andamento' : filtro });
    return {
      titulo: 'Minhas doações', subtitulo: 'Acompanhe, altere ou exclua suas doações.', nav: 'doacoes',
      acoes: html`<a class="btn btn-primary" href="#/publicar">${ui.icone('plus', { cor: C.cores.brown, traco: 2.5 })}Publicar excedente</a>`,
      corpo: html`${chips}<section class="card gap-6"><h2 class="card-title">${FILTROS.find((f) => f.id === filtro).label} <span class="text-muted" style="font-weight:600">(${lista.length})</span></h2>
        ${lista.length ? lista.map((d) => linhaDoacao(d, { acoes: true })) : ui.vazio('Nenhuma doação aqui', filtro === 'andamento' ? 'Publique um excedente para começar.' : 'Tente outro filtro.')}</section>`,
      montar(main, c) { ui.delegar(main, acoesDoacao(c.recarregar)); }
    };
  }

  /* =========================================================
     DETALHE DA DOAÇÃO
     ========================================================= */
  async function detalhe({ params }) {
    const d = await api.doacoes.detalhe({ id: params.id });
    const foto = d.fotos && d.fotos[0];
    const coletaAtiva = d.status === 'reservada' && d.coleta && d.coleta.iniciadaEm;
    const rel = d.status === 'entregue' ? d : null;
    const corpo = html`<div class="section-row section-row--start">
      <div class="col-2 col gap-20">
        <section class="card gap-16">
          <div class="card-head"><div><div class="card-title">${d.titulo} <span class="text-muted" style="font-weight:500">· ${U.quantidade(d.quantidade, d.unidade)}</span></div>
            <div class="card-sub">${U.categoriaLabel(d.categoria)} · publicada ${U.tempoRelativo(d.criadoEm)}</div></div>${ui.tag(d.status)}</div>
          ${['cancelada', 'expirada'].includes(d.status) ? '' : ui.etapas(d.status)}
          ${foto ? raw(`<img class="photo" src="${U.esc(foto)}" alt="Foto da doação: ${U.esc(d.titulo)}">`) : ''}
          <dl class="dl">
            <dt>Retirada</dt><dd>${U.janela(d.janela)}</dd>
            <dt>Validade</dt><dd>${U.dataLonga(d.validade)} · ${U.vencimentoLabel(d.validade)}</dd>
            <dt>Armazenamento</dt><dd>${d.armazenamento}</dd>
            <dt>Peso estimado</dt><dd>${U.kg(d.pesoKg)}</dd>
            ${d.observacoes ? html`<dt>Observações</dt><dd>${d.observacoes}</dd>` : ''}
            ${d.motivoCancelamento ? html`<dt>Motivo do cancelamento</dt><dd>${d.motivoCancelamento}</dd>` : ''}
          </dl>
          <div class="form-actions">
            ${d.status === 'publicada' ? html`<a class="btn btn-primary" href="#/doacoes/${d.id}/editar">${ui.icone('edit', { tam: 20 })}Editar</a>
              <button type="button" class="btn btn-outline" data-acao="cancelar-publicada" data-id="${d.id}">Cancelar doação</button>
              <button type="button" class="link" data-acao="excluir" data-id="${d.id}">Excluir</button>` : ''}
            ${d.status === 'expirada' ? html`<button type="button" class="btn btn-outline" data-acao="excluir" data-id="${d.id}">Excluir</button>` : ''}
            ${d.status === 'reservada' ? html`<button type="button" class="btn btn-outline" data-acao="cancelar" data-id="${d.id}">Cancelar doação</button>` : ''}
          </div>
        </section>
        ${coletaAtiva || d.status === 'reservada' ? html`<section class="card gap-14" aria-label="Coleta">
          <div class="card-head"><h2 class="card-title">Coleta</h2>${coletaAtiva ? html`<span class="tag tag--sm tag--reservada" data-eta>A caminho</span>` : ''}</div>
          ${coletaAtiva ? html`${NH.mapa.rota({ origem: d.coleta.origem, destino: d.coleta.destino, coleta: d.coleta, nomeOrigem: d.instituicao.nomeCurto || d.instituicao.nome, nomeDestino: 'Você' })}
            <p class="note" aria-live="polite" data-eta-texto></p>`
            : html`<p class="card-sub">${d.responsavel ? `${d.responsavel.nome} vai retirar ${U.janela(d.janela)}. Quando sair, você acompanha o trajeto aqui.` : `A instituição tem até ${C.regras.prazoConfirmarResponsavelMin} minutos para dizer quem vai buscar.`}</p>`}
          ${d.responsavel ? html`<div class="form-actions"><button type="button" class="btn btn-success" data-acao="entreguei" data-id="${d.id}">Confirmar que entreguei ao responsável</button></div>` : ''}
        </section>` : ''}
        <section class="card gap-10"><h2 class="card-title">Histórico</h2>${NH.comum.linhaDoTempo(d.historico)}</section>
      </div>
      <div class="col-1 col gap-20">
        ${d.instituicao ? html`<section class="card gap-10"><div class="card-label">${ui.icone('building')}Instituição</div>
          <div class="list-row__title" style="font-size:18px">${d.instituicao.nome}</div>
          <div class="row items-center gap-8">${ui.estrelas(d.instituicao.avaliacao.media)}<span class="note">${d.instituicao.avaliacao.total ? `${U.num(d.instituicao.avaliacao.media, 1)} (${d.instituicao.avaliacao.total})` : 'Sem avaliações'}</span></div>
          <div class="card-sub">${d.instituicao.endereco ? `${d.instituicao.endereco.bairro}, ${d.instituicao.endereco.cidade}` : ''} · ${d.instituicao.telefone}</div>
          ${d.responsavel ? html`<div class="alert alert--info" style="margin-top:6px">${ui.icone('truck', { tam: 24, cls: 'alert__icon' })}<div><div class="alert__title">${d.responsavel.nome}</div><div class="alert__text">${d.responsavel.funcao}${d.responsavel.veiculo ? ` · ${d.responsavel.veiculo}` : ''}</div></div></div>` : ''}
          <a class="btn btn-outline" href="#/mensagens/${d.id}">${ui.icone('chat', { tam: 20 })}Conversar${d.naoLidas ? ` (${d.naoLidas})` : ''}</a>
        </section>` : html`<section class="card gap-10"><div class="card-label">${ui.icone('building')}Instituição</div>
          <p class="card-sub">${d.status === 'publicada' ? 'Aguardando reserva. Avisamos as instituições perto de você.' : 'Nenhuma instituição vinculada.'}</p></section>`}
        ${rel ? html`<section class="card card--green gap-10"><div class="card-label">${ui.icone('doc')}Comprovante</div>
          <div class="big-money big-money--md">${U.dinheiro(rel.beneficioValor)}</div><div class="card-sub">estimativa de benefício · ${U.kg(rel.pesoEntregueKg)}</div>
          <div class="note">Nº ${rel.comprovante.numero}</div>
          <a class="btn btn-outline" href="comprovante.html?id=${rel.id}">${ui.icone('printer', { tam: 20 })}Abrir comprovante</a></section>` : ''}
        ${d.status === 'entregue' ? html`<section class="card gap-10"><h2 class="card-title">Avaliação</h2>
          ${d.minhaAvaliacao ? html`<div class="card-sub">Você avaliou a instituição:</div>${ui.estrelas(d.minhaAvaliacao.nota, 22)}${d.minhaAvaliacao.comentario ? html`<p class="card-sub">“${d.minhaAvaliacao.comentario}”</p>` : ''}`
            : html`<p class="card-sub">Como foi a experiência com ${d.instituicao.nome}?</p><button type="button" class="btn btn-primary" data-acao="avaliar" data-id="${d.id}" data-titulo="${d.titulo}">Avaliar instituição</button>`}
          ${d.avaliacaoRecebida ? html`<div class="card-sub" style="margin-top:8px">A instituição avaliou você:</div>${ui.estrelas(d.avaliacaoRecebida.nota, 22)}` : ''}</section>` : ''}
      </div></div>`;
    let timer = null;
    return {
      titulo: 'Detalhes da doação', nav: 'doacoes', voltar: { href: '#/doacoes', label: 'Minhas doações' }, corpo,
      montar(main, c) {
        ui.delegar(main, {
          ...acoesDoacao(c.recarregar),
          entreguei: async (b) => {
            if (!(await ui.confirmar({ titulo: 'Confirmar a entrega?', texto: `Confirme apenas se ${d.responsavel.nome} já retirou os alimentos.`, ok: 'Sim, entreguei', classeOk: 'btn-success' }))) return;
            await ui.executar(b, async () => { await api.doacoes.confirmarEntregaAoVoluntario({ id: d.id }); ui.toast('Coleta confirmada. Obrigado!'); c.recarregar(); });
          }
        });
        if (coletaAtiva) {
          const tick = () => {
            const p = NH.mapa.atualizarRota(main, d.coleta);
            const t = main.querySelector('[data-eta-texto]'), tg = main.querySelector('[data-eta]');
            if (!p || !t) return;
            t.textContent = p.chegou ? `${d.responsavel.nome} chegou ao local de retirada.` : `${d.responsavel.nome} está a caminho. Chega em cerca de ${p.minutos} min.`;
            if (tg) tg.textContent = p.chegou ? 'Chegou' : `Chega em ${p.minutos} min`;
          };
          tick(); timer = setInterval(tick, 1000);
        }
      },
      desmontar() { clearInterval(timer); }
    };
  }

  /* =========================================================
     HISTÓRICO E RELATÓRIO DE IMPACTO
     ========================================================= */
  async function historico({ query }) {
    const anoAtual = new Date().getFullYear();
    const ano = Number(query.ano) || anoAtual;
    const filtro = query.filtro || 'entregue';
    const [rel, concl] = await Promise.all([api.relatorios.doador({ ano }), api.doacoes.minhas({ status: 'concluidas' })]);
    const doAno = concl.filter((d) => new Date(d.entregueEm || d.atualizadoEm || d.criadoEm).getFullYear() === ano);
    const lista = filtro === 'todas' ? doAno : doAno.filter((d) => (filtro === 'outras' ? d.status !== 'entregue' : d.status === filtro));
    const mesesAte = ano === anoAtual ? new Date().getMonth() + 1 : 12;
    const serie = rel.porMes.slice(0, mesesAte).map((m) => ({ label: m.label, valor: Math.round(m.valor) }));
    const chip = (id, label) => html`<a class="chip${filtro === id ? ' is-on' : ''}" href="#/historico?ano=${ano}&filtro=${id}">${label}</a>`;
    const corpo = html`
      <section aria-label="Filtros" class="chips">
        <label class="sr-only" for="hist_ano">Ano</label>
        <select class="chip is-on" id="hist_ano" data-ano>${[anoAtual, anoAtual - 1].map((a) => html`<option value="${a}" ${a === ano ? raw('selected') : ''}>${a}</option>`)}</select>
        ${chip('entregue', 'Entregues')}${chip('outras', 'Canceladas e expiradas')}${chip('todas', 'Todas')}
      </section>
      <section class="row gap-16" aria-label="Impacto">
        <div class="metric"><div class="metric__n">${U.num(rel.totalKg)} kg</div><div class="metric__l">de alimentos doados</div></div>
        <div class="metric"><div class="metric__n">${U.num(rel.refeicoes)}</div><div class="metric__l">refeições geradas</div></div>
        <div class="metric"><div class="metric__n">${U.num(rel.concluidas)}</div><div class="metric__l">doações concluídas</div></div>
        <div class="metric"><div class="metric__n">${rel.porInstituicao.length}</div><div class="metric__l">instituições atendidas</div></div>
      </section>
      <section class="section-row section-row--stretch">
        <div class="card col-2 gap-14"><div><h2 class="card-title">Alimento doado por mês</h2><div class="card-sub">Quilos entregues em ${ano}</div></div>
          ${ui.barras(serie, { rotulo: `Gráfico de barras: quilos doados por mês em ${ano}`, formatar: (v) => U.num(v) })}</div>
        <div class="card col-1 gap-6"><h2 class="card-title">Para onde foi</h2>
          ${rel.porInstituicao.length ? rel.porInstituicao.map((i) => html`<div class="list-row"><div><div class="list-row__title">${i.nome}</div><div class="list-row__sub">${U.plural(i.doacoes, 'doação', 'doações')}</div></div><strong>${U.num(i.kg)} kg</strong></div>`) : ui.vazio('Sem entregas neste ano')}</div>
      </section>
      <section class="card gap-10">
        <div class="card-head"><h2 class="card-title">Doações (${lista.length})</h2><button type="button" class="btn btn-outline btn-sm" data-acao="csv">${ui.icone('download', { tam: 18 })}Exportar planilha</button></div>
        ${lista.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Alimento</th><th class="num">Quantidade</th><th>Instituição</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>
          ${lista.map((d) => html`<tr><td class="nowrap">${U.dataLonga(d.entregueEm || d.atualizadoEm || d.criadoEm)}</td><td><a href="#/doacoes/${d.id}" style="text-decoration:underline">${d.titulo}</a></td>
            <td class="num nowrap">${U.quantidade(d.quantidade, d.unidade)}</td><td>${d.instituicao ? d.instituicao.nome : '—'}</td><td>${ui.tag(d.status, { tam: 'xs' })}</td>
            <td>${d.status === 'entregue' ? html`<a class="link" href="comprovante.html?id=${d.id}">Comprovante</a>` : ''}</td></tr>`)}
        </tbody></table></div>` : ui.vazio('Nenhuma doação neste filtro')}
      </section>`;
    return {
      titulo: 'Histórico', subtitulo: `Relatório de impacto das suas doações em ${ano}.`, nav: 'historico', corpo,
      montar(main) {
        main.querySelector('[data-ano]').addEventListener('change', (e) => NH.app.navegar(`#/historico?ano=${e.target.value}&filtro=${filtro}`));
        ui.delegar(main, {
          csv: () => NH.comum.exportarCSV(`no-hunger-historico-${ano}.csv`, lista, [
            { label: 'Data', valor: (d) => U.dataLonga(d.entregueEm || d.atualizadoEm || d.criadoEm) }, { label: 'Alimento', valor: 'titulo' },
            { label: 'Quantidade', valor: (d) => U.num(d.quantidade, 1) }, { label: 'Unidade', valor: 'unidade' }, { label: 'Peso (kg)', valor: (d) => U.num(d.pesoEntregueKg || d.pesoKg, 1) },
            { label: 'Instituição', valor: (d) => (d.instituicao ? d.instituicao.nome : '') }, { label: 'Situação', valor: (d) => C.status[d.status].label },
            { label: 'Comprovante', valor: (d) => (d.comprovante ? d.comprovante.numero : '') }])
        });
      }
    };
  }

  /* =========================================================
     BENEFÍCIO FISCAL
     ========================================================= */
  async function beneficio({ query }) {
    const anoAtual = new Date().getFullYear();
    const ano = Number(query.ano) || anoAtual;
    const b = await api.beneficio.resumo({ ano });
    const corpo = html`
      <section class="section-row section-row--stretch">
        <div class="card card--green col-1 gap-10">
          <div class="card-label">${ui.icone('doc')}Benefício fiscal</div>
          <div class="card-sub">Acumulado em ${ano}</div>
          <div class="big-money">${U.dinheiro(b.total)}</div>
          <div class="card-sub" style="line-height:22px">de redução de impostos, com base em ${U.plural(b.quantidade, 'doação comprovada', 'doações comprovadas')} (${U.num(b.kg)} kg).</div>
          <a class="btn btn-outline" style="margin-top:8px" href="comprovante.html?ano=${ano}">Baixar comprovantes</a>
        </div>
        <div class="card col-2 gap-10"><h2 class="card-title">Como o valor é calculado</h2>
          <p class="auth-text" style="font-size:16px;line-height:24px">Cada doação conta depois que a instituição confirma o recebimento. O painel estima o benefício pelo peso entregue (${U.dinheiro(b.valorPorKg)} por kg).</p>
          <p class="note">${b.observacao}</p>
          <p class="note">Cada comprovante tem número e código de verificação, e pode ser conferido pela Receita e pelo órgão gestor do programa.</p>
          <label class="field" style="max-width:200px"><span class="field__label">Ano</span><select class="input" data-ano>${[anoAtual, anoAtual - 1].map((a) => html`<option ${a === ano ? raw('selected') : ''}>${a}</option>`)}</select></label>
        </div>
      </section>
      <section class="card gap-10">
        <div class="card-head"><h2 class="card-title">Comprovantes de ${ano}</h2><button type="button" class="btn btn-outline btn-sm" data-acao="csv">${ui.icone('download', { tam: 18 })}Exportar planilha</button></div>
        ${b.itens.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Nº do comprovante</th><th>Entrega</th><th>Alimento</th><th class="num">Peso</th><th>Instituição</th><th class="num">Valor estimado</th><th><span class="sr-only">Abrir</span></th></tr></thead><tbody>
          ${b.itens.map((i) => html`<tr><td class="nowrap">${i.comprovante ? i.comprovante.numero : '—'}</td><td class="nowrap">${U.dataLonga(i.entregueEm)}</td><td>${i.titulo}</td><td class="num nowrap">${U.kg(i.pesoKg)}</td>
            <td>${i.instituicao}</td><td class="num nowrap">${U.dinheiro(i.valor)}</td><td><a class="link" href="comprovante.html?id=${i.id}">Abrir</a></td></tr>`)}
        </tbody></table></div>` : ui.vazio('Nenhum comprovante neste ano', 'Os comprovantes aparecem quando a instituição confirma o recebimento.')}
      </section>`;
    return {
      titulo: 'Benefício fiscal', subtitulo: 'Comprovantes das doações entregues e estimativa de redução de impostos.', nav: 'beneficio', corpo,
      montar(main) {
        main.querySelector('[data-ano]').addEventListener('change', (e) => NH.app.navegar(`#/beneficio?ano=${e.target.value}`));
        ui.delegar(main, {
          csv: () => NH.comum.exportarCSV(`no-hunger-beneficio-${ano}.csv`, b.itens, [
            { label: 'Comprovante', valor: (i) => (i.comprovante ? i.comprovante.numero : '') }, { label: 'Código de verificação', valor: (i) => (i.comprovante ? i.comprovante.codigo : '') },
            { label: 'Data da entrega', valor: (i) => U.dataLonga(i.entregueEm) }, { label: 'Alimento', valor: 'titulo' }, { label: 'Peso (kg)', valor: (i) => U.num(i.pesoKg, 1) },
            { label: 'Instituição', valor: 'instituicao' }, { label: 'Valor estimado (R$)', valor: (i) => U.num(i.valor, 2) }])
        });
      }
    };
  }

  /* =========================================================
     AVALIAÇÕES
     ========================================================= */
  async function avaliacoes() {
    const [rec, pend] = await Promise.all([api.avaliacoes.recebidas(), api.avaliacoes.pendentes()]);
    return {
      titulo: 'Avaliações', subtitulo: 'O que as instituições dizem sobre suas doações.', nav: 'avaliacoes',
      corpo: html`<div class="section-row section-row--start">
        <section class="card col-2 gap-16"><h2 class="card-title">Avaliações recebidas</h2>${NH.comum.blocoAvaliacoes(rec, { limite: 20 })}</section>
        <section class="card col-1 gap-6"><h2 class="card-title">Para você avaliar</h2>
          ${pend.length ? pend.slice(0, 8).map((p) => html`<div class="list-row"><div><div class="list-row__title">${p.outro}</div><div class="list-row__sub">${p.titulo} · ${U.dataLonga(p.em)}</div></div>
            <button type="button" class="btn btn-primary btn-sm" data-acao="avaliar" data-id="${p.doacaoId}" data-titulo="${p.titulo} · ${p.outro}">Avaliar</button></div>`)
            : ui.vazio('Tudo avaliado', 'Obrigado por ajudar a manter a rede confiável.')}</section></div>`,
      montar(main, c) { ui.delegar(main, acoesDoacao(c.recarregar)); }
    };
  }

  /* ---------- Inicialização ---------- */
  NH.app.iniciar({
    perfil: 'doador', padrao: '/inicio',
    nav: [
      { id: 'inicio', label: 'Início', icone: 'home', rota: '/inicio' },
      { id: 'publicar', label: 'Publicar excedente', icone: 'plus', rota: '/publicar' },
      { id: 'doacoes', label: 'Minhas doações', icone: 'box', rota: '/doacoes', contador: (c) => c.andamento },
      { id: 'historico', label: 'Histórico', icone: 'hist', rota: '/historico' },
      { id: 'beneficio', label: 'Benefício fiscal', icone: 'doc', rota: '/beneficio' },
      { id: 'mensagens', label: 'Mensagens', icone: 'chat', rota: '/mensagens', contador: (c) => c.mensagens },
      { id: 'avaliacoes', label: 'Avaliações', icone: 'star', rota: '/avaliacoes' },
      { id: 'ajuda', label: 'Ajuda', icone: 'help', rota: '/ajuda' }
    ],
    rotas: {
      '/inicio': inicio, '/publicar': publicar, '/doacoes': minhas, '/doacoes/:id': detalhe, '/doacoes/:id/editar': editar,
      '/historico': historico, '/beneficio': beneficio, '/mensagens': NH.comum.mensagens, '/mensagens/:id': NH.comum.mensagens,
      '/avaliacoes': avaliacoes, '/ajuda': NH.comum.ajuda, '/perfil': NH.comum.perfil
    }
  });
})();
