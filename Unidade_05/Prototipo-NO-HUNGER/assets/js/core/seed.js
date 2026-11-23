/* =========================================================
   NO hunger — Dados de demonstração
   Criados na primeira abertura e relativos à data atual, para que
   a demonstração sempre mostre doações "de hoje".
   Contas de acesso: ver NH.config.demo.contas.
   ========================================================= */
(function () {
  'use strict';
  const U = NH.utils;

  /* Gerador previsível (os mesmos dados a cada reinício) */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cnpj(base12) {
    const d = base12.split('').map(Number);
    const dv = (arr, pesos) => { const r = arr.reduce((a, x, i) => a + x * pesos[i], 0) % 11; return r < 2 ? 0 : 11 - r; };
    d.push(dv(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
    d.push(dv(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
    return U.formatarCNPJ(d.join(''));
  }

  function criar() {
    const r = rng(20261123);
    const agora = new Date();
    const hoje = U.isoDate(agora);
    const ano = agora.getFullYear();
    const em = (diasAtras, h = 12, m = 0) => { const d = U.addDays(agora, -diasAtras); d.setHours(h, m, 0, 0); return d.toISOString(); };
    const minAtras = (min) => new Date(agora.getTime() - min * 60000).toISOString();
    const diaIso = (n) => U.isoDate(U.addDays(agora, n));

    /* ---------- Localização (São Paulo, região central) ---------- */
    const O = { lat: -23.5489, lng: -46.6388 };
    const P = (e, n) => U.deslocar(O, e, n);
    const B = P(-0.42, -0.42); // beneficiária de demonstração

    const doc = (nome, extra = {}) => ({ id: U.uid('doc'), nome, arquivo: `${nome.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-')}.pdf`, tipo: 'application/pdf', tamanho: 120000 + Math.round(r() * 300000), enviadoEm: em(200), ...extra });
    const docsDoador = () => [doc('Cartão CNPJ'), doc('Alvará de funcionamento', { validade: diaIso(240) })];
    const docsInst = () => [doc('Cartão CNPJ'), doc('Estatuto ou ata'), doc('Comprovante de atuação')];
    const end = (logradouro, bairro, cidade = 'São Paulo', cep = '01000-000') => ({ logradouro, bairro, cidade, uf: 'SP', cep });
    const base = (o) => ({ criadoEm: em(260), status: 'aprovado', aprovadoEm: em(250), notificacoesNavegador: false, ...o });

    const usuarios = [
      /* Doadores aprovados */
      base({ id: 'u_padaria', perfil: 'doador', nome: 'Padaria Pão Quente', nomeCurto: 'Pão Quente', tipo: 'Padaria', documento: cnpj('123456780001'),
        email: 'padaria@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-1001', responsavel: 'Rogério Martins',
        endereco: end('Rua Treze de Maio, 410', 'Bela Vista', 'São Paulo', '01327-000'), geo: P(-0.8, 0.9), documentos: docsDoador() }),
      base({ id: 'u_mercado', perfil: 'doador', nome: 'Mercado Bom Preço', nomeCurto: 'Bom Preço', tipo: 'Mercado', documento: cnpj('234567890001'),
        email: 'mercado@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-1002', responsavel: 'Luciana Prado',
        endereco: end('Rua do Gasômetro, 120', 'Brás', 'São Paulo', '03004-000'), geo: P(2.2, -1.0), documentos: docsDoador() }),
      base({ id: 'u_restaurante', perfil: 'doador', nome: 'Restaurante Sabor da Casa', nomeCurto: 'Sabor da Casa', tipo: 'Restaurante', documento: cnpj('345678900001'),
        email: 'restaurante@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-1003', responsavel: 'Jorge Nakamura',
        endereco: end('Rua Vergueiro, 1500', 'Paraíso', 'São Paulo', '04101-000'), geo: P(-2.0, -2.4), documentos: docsDoador() }),
      base({ id: 'u_hortifruti', perfil: 'doador', nome: 'Hortifruti Vila Verde', nomeCurto: 'Vila Verde', tipo: 'Hortifruti', documento: cnpj('456789010001'),
        email: 'hortifruti@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-1004', responsavel: 'Sandra Costa',
        endereco: end('Rua da Mooca, 900', 'Mooca', 'São Paulo', '03104-000'), geo: P(2.5, 2.9), documentos: docsDoador() }),

      /* Cadastros aguardando aprovação do governo */
      base({ id: 'u_super_bp', perfil: 'doador', nome: 'Supermercado Bom Preço', nomeCurto: 'Super Bom Preço', tipo: 'Supermercado', documento: cnpj('567890120001'),
        email: 'super@nohunger.demo', senhaDemo: true, telefone: '(19) 3333-2001', responsavel: 'Fábio Antunes', status: 'pendente', aprovadoEm: null, criadoEm: em(3),
        endereco: end('Av. Brasil, 800', 'Guanabara', 'Campinas', '13073-000'), geo: { lat: -22.9099, lng: -47.0626 }, documentos: docsDoador() }),
      base({ id: 'u_igreja', perfil: 'instituicao', nome: 'Igreja Batista Esperança', nomeCurto: 'Batista Esperança', tipo: 'Igreja', documento: cnpj('678901230001'),
        email: 'igreja@nohunger.demo', senhaDemo: true, telefone: '(13) 3333-3001', responsavel: 'Pr. Daniel Rocha', status: 'pendente', aprovadoEm: null, criadoEm: em(2),
        endereco: end('Rua Brás Cubas, 55', 'Vila Mathias', 'Santos', '11013-000'), geo: { lat: -23.9608, lng: -46.3336 },
        documentos: [doc('Cartão CNPJ'), doc('Estatuto ou ata')], capacidadeKg: 300, refrigeracao: false,
        horario: { dias: [2, 4, 6], abre: '09:00', fecha: '17:00' } }),
      base({ id: 'u_rest_moema', perfil: 'doador', nome: 'Restaurante Sabor da Casa (Moema)', nomeCurto: 'Sabor da Casa Moema', tipo: 'Restaurante', documento: cnpj('789012340001'),
        email: 'moema@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-4001', responsavel: 'Jorge Nakamura', status: 'pendente', aprovadoEm: null, criadoEm: em(1),
        endereco: end('Av. Ibirapuera, 2100', 'Moema', 'São Paulo', '04028-000'), geo: P(-1.5, -6.5),
        documentos: [doc('Cartão CNPJ'), doc('Alvará de funcionamento', { validade: diaIso(30) })] }),
      base({ id: 'u_mesa', perfil: 'instituicao', nome: 'ONG Mesa Cheia', nomeCurto: 'Mesa Cheia', tipo: 'ONG', documento: cnpj('890123450001'),
        email: 'mesacheia@nohunger.demo', senhaDemo: true, telefone: '(15) 3333-5001', responsavel: 'Beatriz Lemos', status: 'pendente', aprovadoEm: null, criadoEm: em(1, 9),
        endereco: end('Rua XV de Novembro, 300', 'Centro', 'Sorocaba', '18010-000'), geo: { lat: -23.5015, lng: -47.4526 }, documentos: docsInst(),
        capacidadeKg: 400, refrigeracao: true, horario: { dias: [1, 2, 3, 4, 5], abre: '08:00', fecha: '17:00' } }),

      /* Instituições aprovadas (também são pontos de distribuição) */
      base({ id: 'u_maos', perfil: 'instituicao', nome: 'Associação Mãos Solidárias', nomeCurto: 'Mãos Solidárias', tipo: 'Associação', documento: cnpj('901234560001'),
        email: 'maos@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-6001', responsavel: 'Helena Duarte',
        endereco: end('Rua dos Estudantes, 200', 'Liberdade', 'São Paulo', '01505-000'), geo: O, documentos: docsInst(),
        capacidadeKg: 900, refrigeracao: true, horario: { dias: [1, 2, 3, 4, 5, 6], abre: '08:00', fecha: '20:00' } }),
      base({ id: 'u_casa_pao', perfil: 'instituicao', nome: 'Casa do Pão Solidário', nomeCurto: 'Casa do Pão', tipo: 'Instituição de caridade', documento: cnpj('112233440001'),
        email: 'casadopao@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-6002', responsavel: 'Irmã Teresa',
        endereco: end('Rua Florêncio de Abreu, 70', 'Centro', 'São Paulo', '01029-000'), geo: P(1.5, 2.0), documentos: docsInst(),
        capacidadeKg: 400, refrigeracao: false, horario: { dias: [1, 2, 3, 4, 5], abre: '09:00', fecha: '18:00' } }),
      base({ id: 'u_paroquia', perfil: 'instituicao', nome: 'Paróquia São José', nomeCurto: 'São José', tipo: 'Igreja', documento: cnpj('223344550001'),
        email: 'paroquia@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-6003', responsavel: 'Pe. Antônio',
        endereco: end('Rua Conselheiro Furtado, 900', 'Liberdade', 'São Paulo', '01511-000'), geo: U.deslocar(B, 1.0, -1.0), documentos: docsInst(),
        capacidadeKg: 300, refrigeracao: true, horario: { dias: [0, 1, 2, 3, 4, 5, 6], abre: '09:00', fecha: '19:00' } }),
      base({ id: 'u_cozinha', perfil: 'instituicao', nome: 'Cozinha Solidária Noturna', nomeCurto: 'Cozinha Noturna', tipo: 'Cozinha comunitária', documento: cnpj('334455660001'),
        email: 'cozinha@nohunger.demo', senhaDemo: true, telefone: '(11) 3333-6004', responsavel: 'Marcos Vieira',
        endereco: end('Rua Barão de Iguape, 310', 'Liberdade', 'São Paulo', '01507-000'), geo: P(-1.8, 1.2), documentos: docsInst(),
        capacidadeKg: 250, refrigeracao: true, horario: { dias: [0, 1, 2, 3, 4, 5, 6], abre: '18:00', fecha: '23:00' } }),

      /* Beneficiária de demonstração (cadastro mínimo) */
      { id: 'u_maria', perfil: 'beneficiario', apelido: 'Maria', telefone: '(11) 98888-0000', bairro: 'Liberdade', cidade: 'São Paulo', geo: B,
        status: 'aprovado', consentimentoLGPD: em(120), criadoEm: em(120), preferencia: 'retirada', notificacoesNavegador: false },

      /* Governo */
      { id: 'u_gestor', perfil: 'governo', nome: 'Secretaria de Desenvolvimento Social', nomeCurto: 'Ana Ribeiro', cargo: 'Gestora do programa',
        email: 'gestor@nohunger.demo', senhaDemo: true, status: 'aprovado', criadoEm: em(300), orgao: 'SEDS · Estado de São Paulo' }
    ];

    /* Outros beneficiários (anônimos para o governo; usados no mapa de calor) */
    const clusters = [{ c: P(6, -1), b: 'Brás' }, { c: P(1, -5), b: 'Cambuci' }, { c: P(-4, 3), b: 'Bom Retiro' }];
    clusters.forEach((cl, ci) => {
      for (let i = 0; i < 5; i++) {
        usuarios.push({ id: `u_ben_${ci}_${i}`, perfil: 'beneficiario', apelido: `Pessoa ${ci * 5 + i + 1}`, telefone: `(11) 97${ci}${i}0-00${ci}${i}`,
          bairro: cl.b, cidade: 'São Paulo', geo: U.deslocar(cl.c, (r() - 0.5) * 1.2, (r() - 0.5) * 1.2), status: 'aprovado',
          consentimentoLGPD: em(90), criadoEm: em(90), preferencia: 'retirada' });
      }
    });

    /* ---------- Voluntários ---------- */
    const vol = (id, instituicaoId, nome, funcao, disponivel, telefone, veiculo = '') => ({ id, instituicaoId, nome, funcao, disponivel, telefone, veiculo, criadoEm: em(100) });
    const voluntarios = [
      vol('v_carlos', 'u_maos', 'Carlos Lima', 'Motorista', true, '(11) 97777-1001', 'Fiorino branca'),
      vol('v_joana', 'u_maos', 'Joana Reis', 'Voluntário', true, '(11) 97777-1002'),
      vol('v_pedro', 'u_maos', 'Pedro Alves', 'Entregador', true, '(11) 97777-1003', 'Moto'),
      vol('v_rita', 'u_maos', 'Rita Souza', 'Voluntário', true, '(11) 97777-1004'),
      vol('v_marcos', 'u_maos', 'Marcos Tavares', 'Motorista', false, '(11) 97777-1005', 'Kombi'),
      vol('v_tere', 'u_casa_pao', 'Luís Batista', 'Motorista', true, '(11) 97777-2001', 'Van')
    ];

    /* ---------- Doações em andamento ---------- */
    const geoDe = (id) => usuarios.find((u) => u.id === id).geo;
    const hist = (...passos) => passos.map(([status, quando, por]) => ({ status, em: quando, por }));
    const doacao = (o) => ({ fotos: [], observacoes: '', categoria: 'padaria', armazenamento: 'ambiente', validade: hoje, ...o, geo: geoDe(o.doadorId) });
    const doacoes = [
      doacao({ id: 'd_paes', doadorId: 'u_padaria', titulo: 'Pães franceses', quantidade: 25, unidade: 'kg', status: 'reservada', instituicaoId: 'u_maos', responsavelId: 'v_carlos',
        janela: { data: hoje, inicio: '19:00', fim: '20:00' }, criadoEm: minAtras(180), reservadaEm: minAtras(150), prazoResponsavel: minAtras(120),
        historico: hist(['publicada', minAtras(180), 'u_padaria'], ['reservada', minAtras(150), 'u_maos']) }),
      doacao({ id: 'd_bolos', doadorId: 'u_padaria', titulo: 'Bolos e roscas', quantidade: 12, unidade: 'kg', status: 'publicada',
        janela: { data: hoje, inicio: '20:00', fim: '21:00' }, criadoEm: minAtras(60), historico: hist(['publicada', minAtras(60), 'u_padaria']) }),
      doacao({ id: 'd_forma', doadorId: 'u_padaria', titulo: 'Pães de forma', quantidade: 40, unidade: 'un', status: 'coletada', instituicaoId: 'u_casa_pao', responsavelId: 'v_tere',
        janela: { data: hoje, inicio: '17:00', fim: '18:00' }, criadoEm: minAtras(300), reservadaEm: minAtras(280), coletadaEm: em(0, 17, 40), validade: diaIso(1),
        historico: hist(['publicada', minAtras(300), 'u_padaria'], ['reservada', minAtras(280), 'u_casa_pao'], ['coletada', em(0, 17, 40), 'u_casa_pao']) }),
      doacao({ id: 'd_frutas', doadorId: 'u_mercado', titulo: 'Frutas e legumes', quantidade: 30, unidade: 'kg', categoria: 'hortifruti', armazenamento: 'refrigerado', validade: diaIso(2), status: 'publicada',
        janela: { data: hoje, inicio: '18:00', fim: '21:00' }, criadoEm: minAtras(90), observacoes: 'Banana, maçã, tomate e alface. Trazer caixas vazadas.', historico: hist(['publicada', minAtras(90), 'u_mercado']) }),
      doacao({ id: 'd_marmitas', doadorId: 'u_restaurante', titulo: 'Marmitas prontas', quantidade: 40, unidade: 'un', categoria: 'refeicao', armazenamento: 'refrigerado', validade: diaIso(1), status: 'publicada',
        janela: { data: hoje, inicio: '21:00', fim: '22:00' }, criadoEm: minAtras(40), observacoes: 'Arroz, feijão, frango e legumes. Embaladas individualmente.', historico: hist(['publicada', minAtras(40), 'u_restaurante']) }),
      doacao({ id: 'd_iogurte', doadorId: 'u_hortifruti', titulo: 'Iogurte natural', quantidade: 24, unidade: 'un', categoria: 'laticinios', armazenamento: 'refrigerado', validade: diaIso(3), status: 'publicada',
        janela: { data: diaIso(1), inicio: '08:00', fim: '11:00' }, criadoEm: minAtras(30), historico: hist(['publicada', minAtras(30), 'u_hortifruti']) }),
      doacao({ id: 'd_arroz', doadorId: 'u_mercado', titulo: 'Arroz e feijão', quantidade: 15, unidade: 'kg', categoria: 'mercearia', validade: diaIso(60), status: 'reservada', instituicaoId: 'u_maos', responsavelId: null,
        janela: { data: hoje, inicio: '18:00', fim: '21:00' }, criadoEm: minAtras(70), reservadaEm: minAtras(6), prazoResponsavel: new Date(agora.getTime() + 24 * 60000).toISOString(),
        observacoes: 'Embalagens com avaria leve, produto intacto.', historico: hist(['publicada', minAtras(70), 'u_mercado'], ['reservada', minAtras(6), 'u_maos']) })
    ];

    /* ---------- Histórico entregue ---------- */
    const ini = new Date(ano, 0, 5);
    const fim = U.addDays(agora, -1);
    const inicioHist = fim > ini ? ini : U.addDays(agora, -300);
    const span = Math.max(1, Math.round((fim - inicioHist) / U.DIA_MS));
    function historico(doadorId, total, totalKg, titulos, categoria, destinos, beneficioTotal) {
      const pesos = Array.from({ length: total }, () => 0.5 + r());
      const soma = pesos.reduce((a, b) => a + b, 0);
      let acumKg = 0, acumBen = 0;
      const lista = [];
      for (let i = 0; i < total; i++) {
        const ultimo = i === total - 1;
        const q = ultimo ? Math.round((totalKg - acumKg) * 10) / 10 : Math.round((pesos[i] / soma) * totalKg * 10) / 10;
        acumKg += q;
        let ben = null;
        if (beneficioTotal != null) { ben = ultimo ? Math.round((beneficioTotal - acumBen) * 100) / 100 : Math.round(q * (beneficioTotal / totalKg) * 100) / 100; acumBen += ben; }
        const dia = U.addDays(inicioHist, Math.round((i / total) * span));
        const diasAtras = Math.max(1, Math.round((agora - dia) / U.DIA_MS));
        const destino = destinos[i % destinos.length];
        const num = String(lista.length + 1).padStart(3, '0');
        lista.push(doacao({
          id: `d_h_${doadorId}_${i}`, doadorId, titulo: titulos[i % titulos.length], quantidade: q, unidade: 'kg', categoria,
          status: 'entregue', instituicaoId: destino, validade: U.isoDate(U.addDays(agora, -diasAtras + 1)),
          janela: { data: U.isoDate(U.addDays(agora, -diasAtras)), inicio: '18:00', fim: '20:00' },
          criadoEm: em(diasAtras, 15), reservadaEm: em(diasAtras, 16), coletadaEm: em(diasAtras, 19), entregueEm: em(diasAtras, 20),
          pesoEntregueKg: q, beneficioValor: ben != null ? ben : Math.round(q * NH.config.beneficioFiscal.valorPorKg * 100) / 100,
          comprovante: { numero: `NH-${ano}-${doadorId.slice(2, 5).toUpperCase()}${num}`, codigo: Math.floor(r() * 1e8).toString(36).toUpperCase().padStart(6, '0') },
          historico: hist(['publicada', em(diasAtras, 15), doadorId], ['reservada', em(diasAtras, 16), destino], ['coletada', em(diasAtras, 19), destino], ['entregue', em(diasAtras, 20), destino])
        }));
      }
      return lista;
    }
    doacoes.push(
      ...historico('u_padaria', 38, 1240, ['Pães franceses', 'Pães de forma', 'Bolos e roscas', 'Salgados assados', 'Pão doce'], 'padaria', ['u_maos', 'u_casa_pao', 'u_maos'], 4280),
      ...historico('u_mercado', 24, 860, ['Frutas e legumes', 'Verduras', 'Frutas da estação'], 'hortifruti', ['u_maos', 'u_paroquia'], null),
      ...historico('u_restaurante', 16, 380, ['Marmitas prontas', 'Refeições congeladas'], 'refeicao', ['u_paroquia', 'u_cozinha', 'u_maos'], null),
      ...historico('u_hortifruti', 12, 420, ['Legumes', 'Frutas'], 'hortifruti', ['u_maos', 'u_cozinha'], null)
    );

    /* ---------- Doações recorrentes ---------- */
    const recorrencias = [
      { id: 'r_forma', doadorId: 'u_padaria', ativa: true, dias: [0, 1, 2, 3, 4, 5, 6], ultimaPublicacao: null, criadoEm: em(40),
        modelo: { titulo: 'Pão de forma', quantidade: 12, unidade: 'un', categoria: 'padaria', armazenamento: 'ambiente', validadeDias: 0, janela: { inicio: '19:00', fim: '20:00' }, observacoes: '' } },
      { id: 'r_bolo', doadorId: 'u_padaria', ativa: true, dias: [0, 1, 2, 3, 4, 5, 6], ultimaPublicacao: null, criadoEm: em(40),
        modelo: { titulo: 'Bolo simples', quantidade: 6, unidade: 'un', categoria: 'padaria', armazenamento: 'ambiente', validadeDias: 0, janela: { inicio: '19:00', fim: '20:00' }, observacoes: '' } }
    ];

    /* ---------- Estoque das instituições ---------- */
    const est = (instituicaoId, titulo, quantidade, unidade, categoria, validadeDias, armazenamento = 'ambiente', doacaoId = null) =>
      ({ id: U.uid('est'), instituicaoId, titulo, quantidade, unidade, categoria, validade: diaIso(validadeDias), armazenamento, doacaoId, origem: doacaoId ? 'doacao' : 'avulsa', entradaEm: em(Math.max(0, 3 - validadeDias > 0 ? 1 : 2)) });
    const estoque = [
      est('u_maos', 'Pães franceses', 10, 'kg', 'padaria', 0),
      est('u_maos', 'Cestas básicas', 18, 'cx', 'mercearia', 120),
      est('u_maos', 'Arroz', 40, 'kg', 'mercearia', 150),
      est('u_maos', 'Feijão', 25, 'kg', 'mercearia', 150),
      est('u_maos', 'Leite UHT', 30, 'l', 'laticinios', 45, 'ambiente'),
      est('u_maos', 'Frutas', 12, 'kg', 'hortifruti', 3, 'refrigerado'),
      est('u_paroquia', 'Marmitas prontas', 35, 'un', 'refeicao', 1, 'refrigerado'),
      est('u_casa_pao', 'Pães de forma', 20, 'un', 'padaria', 1),
      est('u_cozinha', 'Sopa congelada', 50, 'un', 'refeicao', 20, 'congelado'),
      est('u_cozinha', 'Pães', 8, 'kg', 'padaria', 0)
    ];

    /* ---------- Distribuições (sem dados pessoais) ---------- */
    const distribuicoes = [];
    ['u_maos', 'u_paroquia', 'u_casa_pao', 'u_cozinha'].forEach((inst, k) => {
      const n = [46, 30, 22, 26][k];
      for (let i = 0; i < n; i++) {
        const diasAtras = Math.max(1, Math.round(span - (i / n) * span));
        const pessoas = 8 + Math.round(r() * 30);
        const kgDist = Math.round((pessoas * (0.8 + r())) * 10) / 10;
        distribuicoes.push({ id: U.uid('dis'), instituicaoId: inst, em: em(diasAtras, 11), tipo: r() > 0.8 ? 'entrega' : 'retirada', pessoasAtendidas: pessoas,
          itens: [{ titulo: 'Alimentos diversos', quantidade: kgDist, unidade: 'kg', categoria: 'mercearia' }], pesoKg: kgDist, observacao: '' });
      }
    });

    /* ---------- Pedidos de beneficiários ---------- */
    const pedidos = [];
    const codigo = () => String(1000 + Math.floor(r() * 9000));
    const pedido = (o) => ({ id: U.uid('ped'), codigo: codigo(), historico: [], ...o });
    pedidos.push(pedido({ beneficiarioId: 'u_maria', instituicaoId: 'u_paroquia', tipo: 'retirada', status: 'concluido', criadoEm: em(6, 10), concluidoEm: em(6, 12),
      historico: [{ status: 'solicitado', em: em(6, 10) }, { status: 'confirmado', em: em(6, 10, 20) }, { status: 'pronto', em: em(6, 11) }, { status: 'concluido', em: em(6, 12) }] }));
    usuarios.filter((u) => u.id.startsWith('u_ben_')).forEach((u, i) => {
      const inst = ['u_maos', 'u_paroquia', 'u_cozinha'][i % 3];
      pedidos.push(pedido({ beneficiarioId: u.id, instituicaoId: inst, tipo: 'retirada', status: 'concluido', criadoEm: em(10 + i, 10), concluidoEm: em(10 + i, 12) }));
      if (i < 3) {
        pedidos.push(pedido({ beneficiarioId: u.id, instituicaoId: 'u_maos', tipo: i === 2 ? 'entrega' : 'retirada', status: 'solicitado', criadoEm: minAtras(20 + i * 15),
          enderecoEntrega: i === 2 ? 'Rua Glicério, 400, apto 12 — Liberdade' : null, historico: [{ status: 'solicitado', em: minAtras(20 + i * 15) }] }));
      }
    });

    /* ---------- Mensagens ---------- */
    const msg = (doacaoId, deId, paraId, texto, quando, lida = true) => ({ id: U.uid('msg'), doacaoId, deId, paraId, texto, em: quando, lida, criadoEm: quando });
    const mensagens = [
      msg('d_paes', 'u_maos', 'u_padaria', 'Boa tarde! Reservamos os pães franceses. Muito obrigada!', minAtras(148)),
      msg('d_paes', 'u_padaria', 'u_maos', 'Nós que agradecemos. Estarão separados no balcão dos fundos.', minAtras(140)),
      msg('d_paes', 'u_maos', 'u_padaria', 'O Carlos vai buscar, de Fiorino branca, entre 19h e 19h15.', minAtras(30), false),
      msg('d_paes', 'u_maos', 'u_padaria', 'Podem deixar em sacos de 5 kg? Facilita a distribuição.', minAtras(28), false),
      msg('d_arroz', 'u_mercado', 'u_maos', 'Olá! As embalagens estão na doca 2. É só chamar o Sr. Antônio.', minAtras(4), false),
      msg('d_forma', 'u_casa_pao', 'u_padaria', 'Coletamos agora. Obrigado, pessoal!', em(0, 17, 41))
    ];

    /* ---------- Notificações ---------- */
    const nt = (userId, titulo, texto, link, quando, lida = false, tipo = 'info') => ({ id: U.uid('not'), userId, titulo, texto, link, em: quando, lida, tipo, criadoEm: quando });
    const notificacoes = [
      nt('u_padaria', 'Doação reservada', 'Associação Mãos Solidárias reservou Pães franceses (25 kg).', 'doador.html#/doacoes/d_paes', minAtras(150)),
      nt('u_padaria', 'Doação coletada', 'Casa do Pão Solidário coletou Pães de forma às 17h40.', 'doador.html#/doacoes/d_forma', em(0, 17, 40)),
      nt('u_padaria', 'Nova avaliação', 'Casa do Pão Solidário avaliou sua doação com 5 estrelas.', 'doador.html#/avaliacoes', minAtras(1440)),
      nt('u_maos', 'Nova doação por perto', 'Mercado Bom Preço publicou Frutas e legumes (30 kg) a 2,4 km.', 'instituicao.html#/perto', minAtras(90)),
      nt('u_maos', 'Nova doação por perto', 'Restaurante Sabor da Casa publicou Marmitas prontas (40 un.).', 'instituicao.html#/perto', minAtras(40)),
      nt('u_maos', 'Defina quem vai retirar', 'Você reservou Arroz e feijão. Confirme o responsável em até 30 minutos.', 'instituicao.html#/reservas', minAtras(6), false, 'urgente'),
      nt('u_maos', 'Novos pedidos de alimento', '3 pessoas pediram alimento hoje.', 'instituicao.html#/distribuicao', minAtras(20)),
      nt('u_maria', 'Chegou alimento na sua região', 'Hoje, até as 20h: pães e frutas.', 'beneficiario.html#/inicio', minAtras(50), false, 'regiao'),
      nt('u_gestor', 'Novos cadastros', '4 cadastros aguardam aprovação.', 'governo.html#/cadastros', minAtras(120))
    ];

    /* ---------- Avaliações ---------- */
    const av = (deId, paraId, nota, comentario, diasAtras, ref = {}) => ({ id: U.uid('ava'), deId, paraId, nota, comentario, em: em(diasAtras, 14), criadoEm: em(diasAtras, 14), ...ref });
    const entreguesPadaria = doacoes.filter((d) => d.doadorId === 'u_padaria' && d.status === 'entregue');
    const avaliacoes = [];
    const comentarios = ['Pães fresquinhos e bem embalados.', 'Sempre pontuais na retirada.', 'Muito organizados, obrigado!', '', 'Ótima parceria.', 'Tudo certo, como combinado.'];
    entreguesPadaria.slice(0, 34).forEach((d, i) => {
      avaliacoes.push(av(d.instituicaoId, 'u_padaria', i % 7 === 3 ? 4 : 5, comentarios[i % comentarios.length], Math.max(1, Math.round((agora - new Date(d.entregueEm)) / U.DIA_MS)), { doacaoId: d.id }));
      avaliacoes.push(av('u_padaria', d.instituicaoId, i % 5 === 2 ? 4 : 5, i % 3 ? '' : 'Equipe muito atenciosa.', Math.max(1, Math.round((agora - new Date(d.entregueEm)) / U.DIA_MS)), { doacaoId: d.id }));
    });
    avaliacoes.push(av('u_maria', 'u_paroquia', 5, 'Fui muito bem atendida.', 6, { pedidoId: pedidos[0].id }));

    /* ---------- Repasses do governo ---------- */
    const repasses = [];
    const instAprov = ['u_maos', 'u_casa_pao', 'u_paroquia', 'u_cozinha'];
    const valores = [320000, 180000, 210000, 150000, 260000, 140000, 230000, 170000, 240000, 160000, 190000, 150000];
    valores.forEach((v, i) => repasses.push({ id: U.uid('rep'), instituicaoId: instAprov[i % 4], valor: v, data: U.isoDate(U.addDays(inicioHist, Math.round((i / valores.length) * span))),
      descricao: i % 2 ? 'Custeio de logística e transporte' : 'Equipamentos de refrigeração e armazenamento', criadoEm: em(Math.round(span - (i / valores.length) * span)) }));

    /* ---------- Demanda consolidada por região (dados oficiais importados) ---------- */
    const demandaRegional = [
      { nome: 'Zona Leste', geo: P(12, 2), peso: 1 },
      { nome: 'Zona Sul', geo: P(-5, -12), peso: 0.9 },
      { nome: 'Zona Norte', geo: P(-9, 8), peso: 0.7 },
      { nome: 'Zona Sudeste', geo: P(11, -9), peso: 0.65 }
    ];

    return {
      versao: NH.config.storageVersion,
      criadoEm: agora.toISOString(),
      meta: { demandaRegional, sequenciaComprovante: 100 },
      usuarios, doacoes, recorrencias, estoque, distribuicoes, pedidos, voluntarios, mensagens, notificacoes, avaliacoes, repasses,
      chamados: [], codigos: []
    };
  }

  NH.seed = { criar };
})();
