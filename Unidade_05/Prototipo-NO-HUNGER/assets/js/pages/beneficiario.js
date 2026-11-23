/* =========================================================
   NO hunger — App do beneficiário (celular)
   Início · Mapa · Meus pedidos · Ajuda
   Cadastro mínimo, linguagem simples, botões grandes.
   ========================================================= */
(function () {
  'use strict';
  const C = NH.config, U = NH.utils, ui = NH.ui, api = NH.api;
  const { html, raw } = U;

  function infoPonto(p) {
    const oferta = p.oferta.length ? ` Tem ${U.listaTexto(p.oferta.slice(0, 2))}.` : '';
    if (p.aberto) return `Aberto até as ${U.hora(p.horario.fecha)}.${oferta}`;
    if (p.proximaAbertura) return `Fechado agora. Abre ${U.diaRelativo(p.proximaAbertura.dia)} às ${U.hora(p.proximaAbertura.hora)}.${oferta}`;
    return `Fechado.${oferta}`;
  }
  function cartaoPonto(p) {
    return html`<article class="spot" aria-labelledby="pt-${p.id}">
      <div class="spot__head"><div class="spot__name" id="pt-${p.id}">${p.nome}</div><div class="spot__dist">${U.distanciaLabel(p.distanciaKm)}</div></div>
      <div class="spot__info">${infoPonto(p)}</div>
      <div class="spot__actions">
        <button type="button" class="btn btn-primary" data-acao="retirada" data-id="${p.id}">Reservar retirada</button>
        <button type="button" class="btn btn-outline" data-acao="entrega" data-id="${p.id}">Pedir entrega</button>
      </div></article>`;
  }
  function acoesPontos(pontos, eu) {
    const achar = (id) => pontos.find((p) => p.id === id);
    const criar = async (p, tipo) => {
      const r = await ui.modalForm({
        titulo: tipo === 'entrega' ? 'Pedir entrega' : 'Reservar retirada', sub: p.nome,
        ok: tipo === 'entrega' ? 'Pedir entrega' : 'Reservar retirada',
        campos: html`<dl class="dl"><dt>Endereço</dt><dd>${p.endereco.logradouro}, ${p.endereco.bairro}</dd><dt>Horário</dt><dd>${U.horarioTexto(p.horario)}</dd>${p.telefone ? html`<dt>Telefone</dt><dd>${p.telefone}</dd>` : ''}</dl>
          ${tipo === 'entrega' ? ui.campo({ label: 'Endereço para entrega', name: 'enderecoEntrega', valor: eu.enderecoEntrega || '', obrigatorio: true, attrs: 'autocomplete="street-address" autofocus', dica: 'Só esta instituição vê o endereço, e só durante a entrega.' }) : ''}
          ${ui.campo({ label: 'Recado para a instituição', name: 'observacao', opcional: true, placeholder: 'Ex.: somos 4 pessoas em casa' })}
          <p class="note">Você recebe um aviso quando ${tipo === 'entrega' ? 'sair para entrega' : 'estiver pronto'}. Guarde o código do pedido.</p>`,
        aoEnviar: (d) => api.pedidos.criar({ instituicaoId: p.id, tipo, enderecoEntrega: d.enderecoEntrega, observacao: d.observacao })
      });
      if (r) { ui.toast(`Pedido enviado! Seu código é ${r.codigo}.`); NH.app.navegar('#/pedidos'); }
    };
    return { retirada: (b) => criar(achar(b.dataset.id), 'retirada'), entrega: (b) => criar(achar(b.dataset.id), 'entrega') };
  }

  /* =========================================================
     INÍCIO (interface original)
     ========================================================= */
  async function inicio({ eu }) {
    const [pontos, notifs, pedidos] = await Promise.all([api.beneficiario.pontos(), api.notificacoes.listar({ limite: 20 }), api.pedidos.meus()]);
    const abertos = pontos.filter((p) => p.aberto);
    const regiao = notifs.itens.find((n) => n.tipo === 'regiao' && Date.now() - new Date(n.em) < U.DIA_MS);
    const prontos = pedidos.filter((p) => ['pronto', 'saiu_entrega'].includes(p.status));
    const corpo = html`
      <h1 class="m-title" tabindex="-1">Olá${eu.apelido ? `, ${eu.apelido}` : ''}! Vamos achar comida perto de você?</h1>
      ${prontos.map((p) => html`<a class="alert" href="#/pedidos">${ui.icone('check', { tam: 24, cls: 'alert__icon' })}<div><div class="alert__title">${p.status === 'pronto' ? 'Seu pedido está pronto' : 'Seu pedido saiu para entrega'}</div>
        <div class="alert__text">${p.instituicao.nome} · código <strong>${p.codigo}</strong></div></div></a>`)}
      ${regiao ? ui.alerta(regiao.titulo, regiao.texto) : ''}
      <h2 class="m-subtitle">${abertos.length ? 'Abertos agora, perto de você' : 'Nenhum ponto aberto agora'}</h2>
      ${abertos.length ? abertos.slice(0, 3).map(cartaoPonto) : html`<p class="spot__info">Você pode reservar agora para retirar quando abrir.</p>${pontos.slice(0, 3).map(cartaoPonto)}`}
      ${pontos.length > 3 ? html`<a class="link text-center" href="#/mapa">Ver todos os pontos no mapa</a>` : ''}`;
    return { titulo: 'Início', semTitulo: true, nav: 'inicio', corpo, montar(main) { ui.delegar(main, acoesPontos(pontos, eu)); } };
  }

  /* =========================================================
     MAPA DOS PONTOS DE DISTRIBUIÇÃO
     ========================================================= */
  async function mapa({ eu, query }) {
    const zoom = C.regras.raiosMapaKm.includes(Number(query.zoom)) ? Number(query.zoom) : C.regras.raioPadraoKm;
    const pontos = await api.beneficiario.pontos();
    const pins = pontos.map((p, i) => ({ id: p.id, geo: p.geo, rotulo: String(i + 1), tipo: p.aberto ? 'disp' : 'fechado', titulo: `${i + 1}: ${p.nome}, ${p.aberto ? 'aberto' : 'fechado'}, a ${U.distanciaLabel(p.distanciaKm)}` }));
    const corpo = html`
      ${NH.mapa.render({ centro: eu.geo, raioKm: zoom, pontos: pins, voce: 'ponto', classe: 'map--md', label: `Pontos em até ${zoom} km`,
        legenda: [{ classe: 'map__dot--disp', texto: 'Aberto agora' }, { classe: '', estilo: `background:#fff;border:2px solid ${C.cores.brown}`, texto: 'Fechado' }, { classe: 'map__dot--voce', texto: 'Você' }] })}
      <button type="button" class="btn btn-outline btn--block" data-acao="local">${ui.icone('pin', { tam: 20 })}Usar minha localização</button>
      ${pontos.map((p, i) => html`<article class="spot" id="ponto-${p.id}" tabindex="-1">
        <div class="spot__head"><div class="spot__name"><span class="pin" style="display:inline-flex;width:28px;height:28px;font-size:14px;margin-right:6px;vertical-align:middle" aria-hidden="true">${i + 1}</span>${p.nome}</div><div class="spot__dist">${U.distanciaLabel(p.distanciaKm)}</div></div>
        <div class="row items-center gap-8">${p.aberto ? html`<span class="tag tag--xs tag--ok">Aberto agora</span>` : html`<span class="tag tag--xs tag--neutra">Fechado</span>`}<span class="spot__info">${U.horarioTexto(p.horario)}</span></div>
        <div class="spot__info">${p.endereco.logradouro}, ${p.endereco.bairro}${p.oferta.length ? ` · Tem ${U.listaTexto(p.oferta)}.` : ''}</div>
        <div class="spot__actions"><button type="button" class="btn btn-primary" data-acao="retirada" data-id="${p.id}">Reservar retirada</button>
          <button type="button" class="btn btn-outline" data-acao="entrega" data-id="${p.id}">Pedir entrega</button></div></article>`)}`;
    return {
      titulo: 'Pontos de distribuição', subtitulo: 'Horários e distância de cada local.', nav: 'mapa', corpo,
      montar(main, c) {
        ui.delegar(main, {
          ...acoesPontos(pontos, eu),
          local: (b) => ui.executar(b, async () => { const geo = await NH.comum.usarLocalizacao(); NH.app.eu = await api.usuarios.atualizar({ geo }); ui.toast('Localização atualizada.'); c.recarregar(); })
        });
        NH.mapa.ligar(main, {
          aoZoom: (dir) => NH.app.navegar(`#/mapa?zoom=${NH.mapa.proximoRaio(zoom, dir)}`),
          aoPino: (id) => { const el = main.querySelector(`#ponto-${CSS.escape(id)}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); } }
        });
      }
    };
  }

  /* =========================================================
     MEUS PEDIDOS
     ========================================================= */
  async function pedidos() {
    const lista = await api.pedidos.meus();
    const ativos = lista.filter((p) => !['concluido', 'cancelado'].includes(p.status));
    const antigos = lista.filter((p) => ['concluido', 'cancelado'].includes(p.status));
    const cartao = (p) => html`<article class="m-card">
      <div class="spot__head"><div class="spot__name">${p.instituicao.nome}</div>${ui.tagPedido(p.status)}</div>
      ${!['concluido', 'cancelado'].includes(p.status) ? html`<div class="alert alert--info" style="align-items:center"><div class="grow"><div class="alert__text">Código do pedido</div>
        <div style="font-size:34px;line-height:40px;font-weight:800;letter-spacing:6px">${p.codigo}</div></div><div class="spot__info" style="text-align:right">${p.tipo === 'entrega' ? 'Entrega em casa' : 'Retirada no local'}</div></div>` : ''}
      <div class="spot__info">${p.tipo === 'entrega' ? `Entrega em: ${p.enderecoEntrega || 'endereço informado'}` : `${p.instituicao.endereco.logradouro}, ${p.instituicao.endereco.bairro}`} · ${U.horarioTexto(p.instituicao.horario)}</div>
      <details><summary class="link" style="padding:6px 0">Ver andamento</summary>${NH.comum.linhaDoTempo(p.historico && p.historico.length ? p.historico : [{ status: p.status, em: p.criadoEm }])}</details>
      <div class="spot__actions">
        ${['solicitado', 'confirmado'].includes(p.status) ? html`<button type="button" class="btn btn-outline" data-acao="cancelar" data-id="${p.id}">Cancelar pedido</button>` : ''}
        ${p.instituicao.telefone && !['concluido', 'cancelado'].includes(p.status) ? html`<a class="btn btn-outline" href="tel:${U.soDigitos(p.instituicao.telefone)}">${ui.icone('phone', { tam: 20 })}Ligar</a>` : ''}
        ${p.status === 'concluido' && !p.minhaAvaliacao ? html`<button type="button" class="btn btn-primary" data-acao="avaliar" data-id="${p.id}" data-nome="${p.instituicao.nome}">Avaliar atendimento</button>` : ''}
        ${p.minhaAvaliacao ? html`<span class="spot__info">Sua avaliação: ${ui.estrelas(p.minhaAvaliacao.nota, 18)}</span>` : ''}
      </div></article>`;
    return {
      titulo: 'Meus pedidos', nav: 'pedidos',
      corpo: html`${ativos.length ? ativos.map(cartao) : html`<div class="m-card">${ui.vazio('Nenhum pedido em andamento', 'Escolha um ponto perto de você para reservar.', html`<a class="btn btn-primary" href="#/inicio">Ver pontos abertos</a>`)}</div>`}
        ${antigos.length ? html`<h2 class="m-subtitle">Anteriores</h2>${antigos.slice(0, 10).map(cartao)}` : ''}`,
      montar(main, c) {
        ui.delegar(main, {
          cancelar: async (b) => {
            if (!(await ui.confirmar({ titulo: 'Cancelar pedido?', texto: 'A instituição será avisada.', ok: 'Cancelar pedido', cancelar: 'Manter pedido' }))) return;
            await ui.executar(b, async () => { await api.pedidos.cancelar({ id: b.dataset.id }); ui.toast('Pedido cancelado.'); c.recarregar(); });
          },
          avaliar: async (b) => { if (await NH.comum.avaliar({ pedidoId: b.dataset.id, titulo: 'Como foi o atendimento?', sub: b.dataset.nome })) c.recarregar(); }
        });
      }
    };
  }

  /* =========================================================
     AJUDA (com acesso ao cadastro)
     ========================================================= */
  async function ajuda({ eu }) {
    return {
      titulo: 'Ajuda', nav: 'ajuda', vivo: false,
      corpo: html`<section class="m-card"><div class="spot__head"><div class="spot__name">Meu cadastro</div></div>
          <div class="spot__info">${eu.apelido} · ${eu.telefone} · ${eu.bairro}</div>
          <div class="spot__actions"><a class="btn btn-outline" href="#/perfil">Ver e editar</a><button type="button" class="btn btn-outline" data-sair>Sair</button></div></section>
        ${NH.comum.conteudoAjuda('beneficiario')}`,
      montar: (main) => NH.comum.ligarAjuda(main)
    };
  }

  NH.app.iniciar({
    perfil: 'beneficiario', padrao: '/inicio', layout: 'celular',
    nav: [
      { id: 'inicio', label: 'Início', icone: 'home', rota: '/inicio' },
      { id: 'mapa', label: 'Mapa', icone: 'map', rota: '/mapa' },
      { id: 'pedidos', label: 'Meus pedidos', icone: 'box', rota: '/pedidos', contador: (c) => c.pedidos },
      { id: 'ajuda', label: 'Ajuda', icone: 'help', rota: '/ajuda' }
    ],
    rotas: { '/inicio': inicio, '/mapa': mapa, '/pedidos': pedidos, '/ajuda': ajuda, '/perfil': NH.comum.perfil }
  });
})();
