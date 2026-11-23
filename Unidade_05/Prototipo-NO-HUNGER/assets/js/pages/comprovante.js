/* =========================================================
   NO hunger — Comprovante de doação (para impressão ou PDF)
   comprovante.html?id=<doação>  → um comprovante
   comprovante.html?ano=2026      → resumo anual + todos os comprovantes
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui, api = NH.api;
  const { html } = U;
  if (C.backend.mode === 'local') NH.store.carregar();
  const raiz = document.getElementById('app');
  const q = U.query();

  const endereco = (e) => (e ? `${e.logradouro}, ${e.bairro}, ${e.cidade}/${e.uf}` : '—');
  const marcaTopo = html`<div class="row items-center gap-10">${ui.marca(40)}<div class="m-brand__word">NO <span>hunger</span></div></div>`;
  const aviso = C.demo.ativo ? html`<p class="note"><strong>Documento de demonstração, sem validade fiscal.</strong></p>` : '';

  function recibo(r) {
    return html`<article class="receipt">
      <div class="receipt__head">${marcaTopo}<div class="text-center"><div class="note">Comprovante nº</div><div class="receipt__code"><strong>${r.numero}</strong></div></div></div>
      <div><h1 class="receipt__title">Comprovante de doação de alimentos</h1><p class="card-sub">Emitido após a confirmação de recebimento pela instituição.</p></div>
      <div class="section-row section-row--start">
        <section class="col-1 col gap-6"><div class="card-label">Doador</div><dl class="dl"><dt>Razão social</dt><dd>${r.doador.nome}</dd><dt>CNPJ</dt><dd>${r.doador.documento}</dd><dt>Endereço</dt><dd>${endereco(r.doador.endereco)}</dd></dl></section>
        <section class="col-1 col gap-6"><div class="card-label">Instituição recebedora</div><dl class="dl"><dt>Nome</dt><dd>${r.instituicao.nome}</dd><dt>CNPJ</dt><dd>${r.instituicao.documento}</dd><dt>Endereço</dt><dd>${endereco(r.instituicao.endereco)}</dd></dl></section>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Alimento</th><th>Tipo</th><th class="num">Quantidade</th><th class="num">Peso</th><th>Coleta</th><th>Recebimento</th></tr></thead>
        <tbody><tr><td>${r.titulo}</td><td>${r.categoria}</td><td class="num nowrap">${U.quantidade(r.quantidade, r.unidade)}</td><td class="num nowrap">${U.kg(r.pesoKg)}</td>
          <td class="nowrap">${r.coletadaEm ? U.dataHora(r.coletadaEm) : '—'}</td><td class="nowrap">${U.dataHora(r.entregueEm)}</td></tr></tbody></table></div>
      <div class="row justify-between items-center gap-16"><div><div class="card-sub">Valor estimado para fins de benefício fiscal</div><div class="big-money big-money--md">${U.dinheiro(r.valor)}</div></div>
        <div class="text-center"><div class="note">Código de verificação</div><div class="receipt__code"><strong>${r.codigo}</strong></div></div></div>
      <p class="note">A instituição recebedora declara ter recebido os alimentos acima em condições de consumo. ${C.beneficioFiscal.observacao} A autenticidade pode ser conferida pelo órgão gestor do programa com o número e o código de verificação.</p>
      ${aviso}
    </article>`;
  }

  async function iniciar() {
    if (!NH.sessao.obter()) { location.replace('index.html'); return; }
    let lista;
    try { lista = await api.beneficio.comprovantes(q.id ? { id: q.id } : { ano: q.ano }); } catch (e) {
      raiz.innerHTML = String(html`<main class="auth"><div class="auth-card">${ui.vazio('Comprovante indisponível', e.message, html`<a class="btn btn-primary" href="javascript:history.back()">Voltar</a>`)}</div></main>`);
      return;
    }
    const ano = q.ano || (lista[0] ? new Date(lista[0].entregueEm).getFullYear() : new Date().getFullYear());
    const total = U.somar(lista, (r) => r.valor), kg = U.somar(lista, (r) => r.pesoKg);
    const resumo = !q.id ? html`<article class="receipt">
        <div class="receipt__head">${marcaTopo}<div class="note">Emitido em ${U.dataHora(new Date())}</div></div>
        <div><h1 class="receipt__title">Demonstrativo anual de doações · ${ano}</h1><p class="card-sub">${lista[0] ? `${lista[0].doador.nome} · CNPJ ${lista[0].doador.documento}` : ''}</p></div>
        <div class="row gap-16"><div class="metric"><div class="metric__n">${U.num(lista.length)}</div><div class="metric__l">doações comprovadas</div></div>
          <div class="metric"><div class="metric__n">${U.kg(kg)}</div><div class="metric__l">de alimentos entregues</div></div>
          <div class="metric"><div class="metric__n">${U.dinheiro(total)}</div><div class="metric__l">valor estimado total</div></div></div>
        ${lista.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Comprovante</th><th>Recebimento</th><th>Alimento</th><th>Instituição</th><th class="num">Peso</th><th class="num">Valor</th></tr></thead><tbody>
          ${lista.map((r) => html`<tr><td class="nowrap">${r.numero}</td><td class="nowrap">${U.dataLonga(r.entregueEm)}</td><td>${r.titulo}</td><td>${r.instituicao.nome}</td><td class="num nowrap">${U.kg(r.pesoKg)}</td><td class="num nowrap">${U.dinheiro(r.valor)}</td></tr>`)}
          </tbody></table></div>` : ui.vazio('Nenhuma doação entregue neste ano')}
        ${aviso}</article>` : '';
    raiz.innerHTML = String(html`<div class="receipt__toolbar no-print"><a class="btn btn-outline" href="javascript:history.back()">${ui.icone('back', { tam: 20 })}Voltar</a>
        <button type="button" class="btn btn-primary" data-imprimir>${ui.icone('printer', { tam: 20, cor: C.cores.brown })}Imprimir ou salvar em PDF</button></div>
      <main id="conteudo">${resumo}${lista.map(recibo)}</main>`);
    document.title = q.id && lista[0] ? `Comprovante ${lista[0].numero} · No Hunger` : `Demonstrativo ${ano} · No Hunger`;
    raiz.querySelector('[data-imprimir]').addEventListener('click', () => window.print());
  }
  iniciar();
})();
