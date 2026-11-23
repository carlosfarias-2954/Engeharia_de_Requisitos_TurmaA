/* =========================================================
   NO hunger — Painel do governo
   Visão geral · Cadastros · Mapa de calor · Relatórios
   Repasses · Dados abertos · Ajuda
   Somente dados agregados: nenhum dado pessoal de beneficiário.
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui, api = NH.api;
  const { html, raw } = U;
  const CENTRO = { lat: -23.5489, lng: -46.6388 };

  function linhaCadastro(p) {
    return html`<div class="list-row"><div><div class="list-row__title">${p.nome}</div><div class="list-row__sub">${C.perfis[p.perfil].label} · ${p.cidade || '—'}${p.tipo ? ` · ${p.tipo}` : ''}</div></div>
      <div class="list-row__actions"><span class="tag tag--xs ${p.docs.ok ? 'tag--ok' : 'tag--aviso'}">${p.docs.texto}</span>
        <button type="button" class="btn btn-primary btn-sm" data-acao="revisar" data-id="${p.id}">Revisar</button></div></div>`;
  }
  async function revisar(id) {
    const u = await api.governo.cadastro({ id });
    const docs = u.exigidos.map((nome) => {
      const d = u.documentos.find((x) => x.nome === nome);
      return html`<div class="list-row"><div><div class="list-row__title">${nome}</div><div class="list-row__sub">${d ? `${d.arquivo} · ${U.num((d.tamanho || 0) / 1024)} KB · ${U.dataLonga(d.enviadoEm)}${d.validade ? ` · validade ${U.dataLonga(d.validade)}` : ''}` : 'Não enviado'}</div></div>
        <div class="list-row__actions">${d ? (d.dataUrl ? html`<button type="button" class="link" data-ver="${d.id}">Ver arquivo</button>` : html`<span class="note">Arquivo no servidor</span>`) : html`<span class="tag tag--xs tag--aviso">Falta</span>`}</div></div>`;
    });
    const decisao = await ui.modal({
      titulo: u.nome, sub: `${C.perfis[u.perfil].label} · cadastro enviado em ${U.dataLonga(u.criadoEm)}`, grande: true,
      corpo: html`<div class="section-row section-row--start">
          <dl class="dl col-1"><dt>CNPJ</dt><dd>${u.documento}</dd><dt>Tipo</dt><dd>${u.tipo || '—'}</dd><dt>Responsável</dt><dd>${u.responsavel || '—'}</dd>
            <dt>Telefone</dt><dd>${u.telefone || '—'}</dd><dt>E-mail</dt><dd>${u.email || '—'}</dd>
            <dt>Endereço</dt><dd>${u.endereco ? `${u.endereco.logradouro}, ${u.endereco.bairro}, ${u.endereco.cidade}/${u.endereco.uf}` : '—'}</dd>
            ${u.perfil === 'instituicao' ? html`<dt>Atendimento</dt><dd>${U.horarioTexto(u.horario)}</dd><dt>Estoque</dt><dd>${U.num(u.capacidadeKg || 0)} kg${u.refrigeracao ? ' · com refrigeração' : ''}</dd>` : ''}
            <dt>Situação</dt><dd>${{ pendente: 'Aguardando análise', aprovado: 'Aprovado', reprovado: 'Ajustes pedidos', suspenso: 'Suspenso' }[u.status] || u.status}</dd></dl>
          <div class="col-1 col"><div class="list-row__title" style="margin-bottom:4px">Documentos <span class="tag tag--xs ${u.docs.ok ? 'tag--ok' : 'tag--aviso'}">${u.docs.texto}</span></div>${docs}</div></div>
        ${u.motivoReprovacao ? ui.alerta('Último pedido de ajuste', u.motivoReprovacao, { icone: 'alert' }) : ''}
        <p class="note">Confira se o CNPJ está ativo e se a atividade é compatível com o programa. A decisão é enviada ao solicitante.</p>
        <div class="modal__actions"><button type="button" class="btn btn-outline" data-fechar>Fechar</button>
          ${u.status === 'aprovado' ? html`<button type="button" class="btn btn-outline" data-decisao="suspender">Suspender</button>`
            : html`<button type="button" class="btn btn-outline" data-decisao="reprovar">Pedir ajustes</button><button type="button" class="btn btn-success" data-decisao="aprovar">Aprovar cadastro</button>`}</div>`,
      aoMontar: (el, fechar) => {
        el.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => {
          const d = u.documentos.find((x) => x.id === b.dataset.ver);
          const w = window.open(); if (w) w.document.write(`<title>${U.esc(d.arquivo)}</title><img src="${d.dataUrl}" style="max-width:100%">`);
        }));
        el.querySelectorAll('[data-decisao]').forEach((b) => b.addEventListener('click', () => fechar(b.dataset.decisao)));
      }
    });
    if (!decisao) return false;
    if (decisao === 'aprovar') {
      if (!u.docs.ok && !(await ui.confirmar({ titulo: 'Aprovar com pendência?', texto: `${u.docs.texto}. Deseja aprovar mesmo assim?`, ok: 'Aprovar' }))) return false;
      await api.governo.revisar({ id, decisao });
      ui.toast(`${u.nome} aprovado. O solicitante foi avisado.`);
      return true;
    }
    const motivo = await ui.pedirMotivo({ titulo: decisao === 'suspender' ? 'Suspender cadastro' : 'Pedir ajustes no cadastro', texto: 'O texto é enviado ao solicitante.', label: 'O que precisa ser feito', minimo: 10, ok: decisao === 'suspender' ? 'Suspender' : 'Enviar pedido de ajuste' });
    if (!motivo) return false;
    await api.governo.revisar({ id, decisao, motivo });
    ui.toast(decisao === 'suspender' ? 'Cadastro suspenso.' : 'Pedido de ajuste enviado.');
    return true;
  }
  const botaoExportar = html`<button type="button" class="btn btn-outline" data-acao="exportar">${ui.icone('download', { tam: 20 })}Exportar dados</button>`;

  /* =========================================================
     VISÃO GERAL (interface original)
     ========================================================= */
  async function visaoGeral() {
    const p = await api.governo.painel();
    const serie = p.serie;
    const mesAtual = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const primeiro = serie[0], ultimo = serie[serie.length - 1];
    const pct = p.repasses.orcamento ? Math.round((p.repasses.total / p.repasses.orcamento) * 100) : 0;
    const corpo = html`
      <section aria-label="Indicadores" class="row gap-16">
        <div class="kpi"><div class="kpi__n">${U.num(ultimo.toneladas)} t</div><div class="kpi__l">de alimento aproveitado em ${mesAtual[ultimo.mes]}</div></div>
        <div class="kpi"><div class="kpi__n">${U.numCurto(p.kpis.refeicoesAno)}</div><div class="kpi__l">refeições geradas no ano</div></div>
        <div class="kpi"><div class="kpi__n">${U.num(p.kpis.doadores)}</div><div class="kpi__l">doadores cadastrados</div></div>
        <div class="kpi"><div class="kpi__n">${U.num(p.kpis.instituicoes)}</div><div class="kpi__l">instituições ativas</div></div>
      </section>
      <section class="section-row section-row--stretch">
        <div class="card gap-14" style="flex:1.2 1 440px"><div><h2 class="card-title">Alimento aproveitado por mês</h2><div class="card-sub">Toneladas doadas, de ${mesAtual[primeiro.mes]} a ${mesAtual[ultimo.mes]}</div></div>
          ${ui.barras(serie.map((s) => ({ label: s.label, valor: s.toneladas })), { formatar: (v) => U.num(v), rotulo: `Gráfico de barras: as doações foram de ${U.num(primeiro.toneladas)} toneladas em ${mesAtual[primeiro.mes]} para ${U.num(ultimo.toneladas)} toneladas em ${mesAtual[ultimo.mes]}` })}</div>
        <div class="card gap-14" style="flex:1 1 380px"><div class="card-head"><div><h2 class="card-title">Onde há mais necessidade</h2><div class="card-sub">Regiões com mais pedidos de alimento</div></div><a class="link" href="#/mapa">Ampliar</a></div>
          ${NH.mapa.calor({ pontos: p.calor, centro: CENTRO })}</div>
      </section>
      <section class="section-row section-row--start">
        <div class="card gap-4" style="flex:1.6 1 480px"><div class="card-head" style="margin-bottom:6px"><h2 class="card-title">Cadastros para aprovar</h2>
            <span class="tag ${p.totalPendentes ? 'tag--aviso' : 'tag--ok'}">${p.totalPendentes} ${p.totalPendentes === 1 ? 'pendente' : 'pendentes'}</span></div>
          ${p.pendentes.length ? p.pendentes.slice(0, 4).map(linhaCadastro) : ui.vazio('Nenhum cadastro pendente', 'Tudo em dia.')}
          ${p.totalPendentes > 4 ? html`<a class="link" href="#/cadastros">Ver todos os ${p.totalPendentes}</a>` : ''}</div>
        <div class="card card--green col-1 gap-10"><div class="card-label">Investimentos e repasses</div>
          <div class="big-money big-money--md">${U.dinheiroCurto(p.repasses.total)}</div>
          <div class="card-sub" style="line-height:22px">repassados a instituições em ${p.repasses.ano}, de ${U.dinheiroCurto(p.repasses.orcamento)} previstos.</div>
          <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Orçamento utilizado"><div class="progress__fill" style="width:${Math.min(100, pct)}%"></div></div>
          <div class="note">${pct}% do orçamento utilizado</div>
          <a class="btn btn-outline" style="margin-top:6px" href="#/repasses">Ver repasses</a></div>
      </section>`;
    return {
      titulo: 'Visão geral', subtitulo: `Painel do governo · ${p.estado} · ${p.ano}`, nav: 'inicio', acoes: botaoExportar, corpo,
      montar(main, c) {
        ui.delegar(main, {
          revisar: async (b) => { if (await revisar(b.dataset.id)) c.recarregar(); },
          exportar: () => NH.comum.exportarCSV(`no-hunger-indicadores-${p.ano}.csv`, [
            ...serie.map((s) => ({ indicador: `Alimento aproveitado (t) · ${s.label}/${s.ano}`, valor: U.num(s.toneladas, 1) })),
            { indicador: 'Refeições geradas no ano', valor: p.kpis.refeicoesAno }, { indicador: 'Doadores cadastrados', valor: p.kpis.doadores },
            { indicador: 'Instituições ativas', valor: p.kpis.instituicoes }, { indicador: 'Cadastros pendentes', valor: p.totalPendentes },
            { indicador: 'Repasses no ano (R$)', valor: U.num(p.repasses.total, 2) }, { indicador: 'Orçamento anual (R$)', valor: U.num(p.repasses.orcamento, 2) }
          ], [{ label: 'Indicador', valor: 'indicador' }, { label: 'Valor', valor: 'valor' }])
        });
      }
    };
  }

  /* =========================================================
     CADASTROS
     ========================================================= */
  async function cadastros({ query }) {
    const status = query.status || 'pendente', perfil = query.perfil || '';
    const lista = await api.governo.cadastros({ status, perfil: perfil || undefined });
    const link = (m) => { const q = new URLSearchParams({ status, ...(perfil ? { perfil } : {}), ...m }); if (!q.get('perfil')) q.delete('perfil'); return `#/cadastros?${q}`; };
    const chip = (chave, val, label) => html`<a class="chip${(chave === 'status' ? status : perfil) === val ? ' is-on' : ''}" href="${link({ [chave]: val })}">${label}</a>`;
    return {
      titulo: 'Cadastros', subtitulo: 'Aprovação de doadores e instituições.', nav: 'cadastros',
      corpo: html`<section class="chips" aria-label="Situação">${chip('status', 'pendente', 'Pendentes')}${chip('status', 'aprovado', 'Aprovados')}${chip('status', 'reprovado', 'Com ajustes pedidos')}${chip('status', 'todos', 'Todos')}</section>
        <section class="chips" aria-label="Perfil">${chip('perfil', '', 'Doadores e instituições')}${chip('perfil', 'doador', 'Doadores')}${chip('perfil', 'instituicao', 'Instituições')}</section>
        <section class="card gap-4"><h2 class="card-title" style="margin-bottom:6px">${lista.length} ${lista.length === 1 ? 'cadastro' : 'cadastros'}</h2>
          ${lista.length ? lista.map(linhaCadastro) : ui.vazio('Nenhum cadastro aqui')}</section>`,
      montar(main, c) { ui.delegar(main, { revisar: async (b) => { if (await revisar(b.dataset.id)) c.recarregar(); } }); }
    };
  }

  /* =========================================================
     MAPA DE CALOR
     ========================================================= */
  async function mapaCalor() {
    const m = await api.governo.mapaCalor();
    const regioes = m.pontos.filter((p) => p.nome).sort((a, b) => b.peso - a.peso);
    const areas = m.pontos.filter((p) => p.fonte === 'pedidos');
    return {
      titulo: 'Mapa de calor', subtitulo: 'Onde a necessidade de alimento é maior, para orientar novos pontos e repasses.', nav: 'mapa',
      corpo: html`<section class="section-row section-row--stretch">
          <div class="card gap-14" style="flex:2 1 520px">${NH.mapa.calor({ pontos: m.pontos, centro: CENTRO, classe: 'heat--lg', pontosDistribuicao: m.pontosDistribuicao })}
            <p class="note">Pontos verdes: ${U.plural(m.pontosDistribuicao.length, 'ponto de distribuição ativo', 'pontos de distribuição ativos')}. Áreas com menos de ${C.governo.minimoPorCelulaMapa} pedidos não aparecem, para proteger a identidade das pessoas.</p></div>
          <div class="card col-1 gap-6"><h2 class="card-title">Regiões prioritárias</h2>
            ${regioes.map((r, i) => html`<div class="list-row"><div class="row items-center gap-12"><span class="pin${i === 0 ? ' pin--urgente' : ''}" aria-hidden="true">${i + 1}</span><div class="list-row__title">${r.nome}</div></div>
              <div class="progress" style="width:110px" role="img" aria-label="Intensidade ${Math.round(r.peso * 100)}%"><div class="progress__fill" style="width:${Math.round(r.peso * 100)}%;background:${C.cores.orange700}"></div></div></div>`)}
            <div class="list-row"><div><div class="list-row__title">Áreas com pedidos no app</div><div class="list-row__sub">${U.plural(areas.length, 'área', 'áreas')} com ${C.governo.minimoPorCelulaMapa} ou mais pedidos</div></div></div>
          </div></section>`
    };
  }

  /* =========================================================
     RELATÓRIOS
     ========================================================= */
  async function relatorios({ query }) {
    const anoAtual = new Date().getFullYear();
    const ano = Number(query.ano) || anoAtual;
    const r = await api.governo.relatorio({ ano });
    const meses = ano === anoAtual ? new Date().getMonth() + 1 : 12;
    const tabela = (titulo, linhas, colunas, chave) => html`<section class="card gap-10"><div class="card-head"><h2 class="card-title">${titulo}</h2>
        <button type="button" class="btn btn-outline btn-sm" data-acao="csv" data-chave="${chave}">${ui.icone('download', { tam: 18 })}Exportar</button></div>
      ${linhas.length ? html`<div class="table-wrap"><table class="table"><thead><tr>${colunas.map((c) => html`<th class="${c.num ? 'num' : ''}">${c.label}</th>`)}</tr></thead><tbody>
        ${linhas.map((l) => html`<tr>${colunas.map((c) => html`<td class="${c.num ? 'num' : ''}">${c.fmt ? c.fmt(l[c.valor]) : l[c.valor]}</td>`)}</tr>`)}</tbody></table></div>` : ui.vazio('Sem dados neste ano')}</section>`;
    const cols = {
      porCategoria: [{ label: 'Categoria', valor: 'categoria' }, { label: 'Doações', valor: 'doacoes', num: true, fmt: U.num }, { label: 'Peso (kg)', valor: 'kg', num: true, fmt: U.num }],
      porCidade: [{ label: 'Município', valor: 'cidade' }, { label: 'Doações', valor: 'doacoes', num: true, fmt: U.num }, { label: 'Peso (kg)', valor: 'kg', num: true, fmt: U.num }],
      porInstituicao: [{ label: 'Instituição', valor: 'nome' }, { label: 'Doações recebidas', valor: 'doacoes', num: true, fmt: U.num }, { label: 'Peso (kg)', valor: 'kg', num: true, fmt: U.num }, { label: 'Atendimentos', valor: 'pessoas', num: true, fmt: U.num }]
    };
    return {
      titulo: 'Relatórios', subtitulo: `Relatórios de impacto do programa em ${ano}. Dados registrados no aplicativo.`, nav: 'relatorios', acoes: botaoExportar,
      corpo: html`<section class="chips"><label class="sr-only" for="gov_ano">Ano</label><select class="chip is-on" id="gov_ano" data-ano>${[anoAtual, anoAtual - 1].map((a) => html`<option ${a === ano ? raw('selected') : ''}>${a}</option>`)}</select></section>
        <section class="row gap-16">
          <div class="kpi"><div class="kpi__n">${U.kg(r.totalKg)}</div><div class="kpi__l">de alimento entregue a instituições</div></div>
          <div class="kpi"><div class="kpi__n">${U.num(r.doacoes)}</div><div class="kpi__l">doações concluídas</div></div>
          <div class="kpi"><div class="kpi__n">${U.num(r.pessoasAtendidas)}</div><div class="kpi__l">atendimentos a pessoas</div></div>
          <div class="kpi"><div class="kpi__n">${U.dinheiroCurto(r.beneficioConcedido)}</div><div class="kpi__l">em benefício fiscal estimado</div></div></section>
        <section class="card gap-14"><div><h2 class="card-title">Alimento entregue por mês</h2><div class="card-sub">Quilos, ${ano}</div></div>
          ${ui.barras(r.porMes.slice(0, meses).map((m) => ({ label: m.label, valor: Math.round(m.valor) })), { rotulo: `Gráfico de barras: quilos entregues por mês em ${ano}` })}</section>
        <div class="section-row section-row--start"><div class="col-1">${tabela('Por tipo de alimento', r.porCategoria, cols.porCategoria, 'porCategoria')}</div>
          <div class="col-1">${tabela('Por município do doador', r.porCidade, cols.porCidade, 'porCidade')}</div></div>
        ${tabela('Por instituição', r.porInstituicao, cols.porInstituicao, 'porInstituicao')}`,
      montar(main) {
        main.querySelector('[data-ano]').addEventListener('change', (e) => NH.app.navegar(`#/relatorios?ano=${e.target.value}`));
        ui.delegar(main, {
          csv: (b) => NH.comum.exportarCSV(`no-hunger-${b.dataset.chave}-${ano}.csv`, r[b.dataset.chave], cols[b.dataset.chave].map((c) => ({ label: c.label, valor: c.valor }))),
          exportar: () => NH.comum.exportarCSV(`no-hunger-mensal-${ano}.csv`, r.porMes.slice(0, meses), [{ label: 'Mês', valor: 'label' }, { label: 'Doações', valor: 'quantidade' }, { label: 'Peso (kg)', valor: (m) => U.num(m.valor, 1) }])
        });
      }
    };
  }

  /* =========================================================
     REPASSES
     ========================================================= */
  async function repasses() {
    const r = await api.governo.repasses({});
    const pct = r.orcamento ? Math.round((r.total / r.orcamento) * 100) : 0;
    return {
      titulo: 'Repasses', subtitulo: `Investimentos do programa nas instituições em ${r.ano}.`, nav: 'repasses',
      acoes: html`<button type="button" class="btn btn-primary" data-acao="novo">${ui.icone('plus', { cor: C.cores.brown, traco: 2.5 })}Registrar repasse</button>`,
      corpo: html`<section class="section-row section-row--stretch">
          <div class="card card--green col-1 gap-10"><div class="card-label">Investimentos e repasses</div><div class="big-money big-money--md">${U.dinheiroCurto(r.total)}</div>
            <div class="card-sub">repassados a instituições em ${r.ano}, de ${U.dinheiroCurto(r.orcamento)} previstos.</div>
            <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Orçamento utilizado"><div class="progress__fill" style="width:${Math.min(100, pct)}%"></div></div>
            <div class="note">${pct}% do orçamento utilizado · saldo ${U.dinheiro(r.orcamento - r.total)}</div></div>
          <div class="card col-2 gap-6"><h2 class="card-title">Por instituição</h2>
            ${Object.entries(U.agrupar(r.itens, (x) => x.instituicao)).map(([nome, l]) => html`<div class="list-row"><div class="list-row__title">${nome}</div><strong>${U.dinheiro(U.somar(l, (x) => x.valor))}</strong></div>`)}</div></section>
        <section class="card gap-10"><div class="card-head"><h2 class="card-title">Repasses de ${r.ano}</h2><button type="button" class="btn btn-outline btn-sm" data-acao="csv">${ui.icone('download', { tam: 18 })}Exportar</button></div>
          ${r.itens.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Instituição</th><th>Finalidade</th><th class="num">Valor</th></tr></thead><tbody>
            ${r.itens.map((x) => html`<tr><td class="nowrap">${U.dataLonga(x.data)}</td><td>${x.instituicao}</td><td>${x.descricao}</td><td class="num nowrap">${U.dinheiro(x.valor)}</td></tr>`)}</tbody></table></div>` : ui.vazio('Nenhum repasse registrado')}</section>`,
      montar(main, c) {
        ui.delegar(main, {
          novo: async () => {
            const ok = await ui.modalForm({ titulo: 'Registrar repasse', sub: `Saldo disponível: ${U.dinheiro(r.orcamento - r.total)}`, ok: 'Registrar',
              campos: html`<div class="form-grid">${ui.campo({ label: 'Instituição', name: 'instituicaoId', opcoes: r.instituicoes.map((i) => ({ id: i.id, label: i.nome })), placeholder: 'Escolha', obrigatorio: true, classe: 'span-all' })}
                ${ui.campo({ label: 'Valor (R$)', name: 'valor', tipo: 'number', obrigatorio: true, attrs: 'min="1" step="0.01"' })}${ui.campo({ label: 'Data', name: 'data', tipo: 'date', valor: U.isoDate(), obrigatorio: true })}
                ${ui.campo({ label: 'Finalidade', name: 'descricao', obrigatorio: true, classe: 'span-all', placeholder: 'Ex.: compra de câmara fria' })}</div>`,
              aoEnviar: (d) => api.governo.criarRepasse(d) });
            if (ok) { ui.toast('Repasse registrado. A instituição foi avisada.'); c.recarregar(); }
          },
          csv: () => NH.comum.exportarCSV(`no-hunger-repasses-${r.ano}.csv`, r.itens, [{ label: 'Data', valor: (x) => U.dataLonga(x.data) }, { label: 'Instituição', valor: 'instituicao' }, { label: 'Finalidade', valor: 'descricao' }, { label: 'Valor (R$)', valor: (x) => U.num(x.valor, 2) }])
        });
      }
    };
  }

  /* =========================================================
     DADOS ABERTOS
     ========================================================= */
  const CONJUNTOS = [
    { id: 'doacoes', titulo: 'Doações entregues', texto: 'Data, tipo de alimento, peso, tipo e município do doador e instituição recebedora.' },
    { id: 'distribuicoes', titulo: 'Distribuições às pessoas', texto: 'Data, instituição, forma de atendimento, número de pessoas e peso. Sem identificação de quem recebeu.' },
    { id: 'instituicoes', titulo: 'Pontos de distribuição', texto: 'Instituições ativas, município, bairro e horário de atendimento.' },
    { id: 'repasses', titulo: 'Repasses', texto: 'Data, instituição, finalidade e valor dos repasses do programa.' }
  ];
  async function dadosAbertos() {
    return {
      titulo: 'Dados abertos', subtitulo: 'Conjuntos de dados anonimizados para transparência e pesquisa.', nav: 'dados',
      corpo: html`${ui.alerta('Proteção de dados pessoais', 'Os arquivos não têm nomes, telefones ou endereços de beneficiários (LGPD). Endereços aparecem só para instituições, que são pontos públicos de atendimento.', { icone: 'shield', tipo: 'info' })}
        <div class="row gap-20">${CONJUNTOS.map((c) => html`<section class="card gap-10" style="flex:1 1 320px"><div class="card-label">${ui.icone('data')}${c.titulo}</div><p class="card-sub" style="line-height:22px">${c.texto}</p>
          <div class="form-actions mt-auto"><button type="button" class="btn btn-outline btn-sm" data-acao="baixar" data-id="${c.id}" data-formato="csv">Baixar CSV</button>
            <button type="button" class="btn btn-outline btn-sm" data-acao="baixar" data-id="${c.id}" data-formato="json">Baixar JSON</button></div></section>`)}</div>`,
      montar(main) {
        ui.delegar(main, {
          baixar: (b) => ui.executar(b, async () => {
            const dados = await api.governo.dadosAbertos({ conjunto: b.dataset.id });
            const nome = `no-hunger-${b.dataset.id}-${U.isoDate()}`;
            if (b.dataset.formato === 'json') { U.baixar(`${nome}.json`, JSON.stringify(dados, null, 2), 'application/json'); ui.toast('Arquivo baixado.'); return; }
            const chaves = dados.length ? Object.keys(dados[0]) : [];
            NH.comum.exportarCSV(`${nome}.csv`, dados, chaves.map((k) => ({ label: k, valor: k })));
          })
        });
      }
    };
  }

  NH.app.iniciar({
    perfil: 'governo', padrao: '/inicio', cabecalho: 'governo',
    nav: [
      { id: 'inicio', label: 'Visão geral', icone: 'home', rota: '/inicio' },
      { id: 'cadastros', label: 'Cadastros', icone: 'check', rota: '/cadastros', contador: (c) => c.cadastros },
      { id: 'mapa', label: 'Mapa de calor', icone: 'map', rota: '/mapa' },
      { id: 'relatorios', label: 'Relatórios', icone: 'chart', rota: '/relatorios' },
      { id: 'repasses', label: 'Repasses', icone: 'coin', rota: '/repasses' },
      { id: 'dados', label: 'Dados abertos', icone: 'data', rota: '/dados' },
      { id: 'ajuda', label: 'Ajuda', icone: 'help', rota: '/ajuda' }
    ],
    rotas: { '/inicio': visaoGeral, '/cadastros': cadastros, '/mapa': mapaCalor, '/relatorios': relatorios, '/repasses': repasses, '/dados': dadosAbertos, '/ajuda': NH.comum.ajuda, '/perfil': NH.comum.perfil }
  });
})();
