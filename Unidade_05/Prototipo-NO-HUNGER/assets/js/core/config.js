/* =========================================================
   NO hunger — Configuração central
   Regras de negócio, listas e parâmetros ficam aqui para que
   possam ser ajustados sem mexer na lógica das telas.
   ========================================================= */
window.NH = window.NH || {};

NH.config = {
  appName: 'No Hunger',

  /* ---------- Integração ----------
     mode: 'local' usa o armazenamento do navegador (demonstração).
     mode: 'http'  envia cada chamada para o backend em baseUrl
                   (ver docs/BACKEND.md para o contrato completo). */
  backend: {
    mode: 'local',
    baseUrl: '/api/v1',
    timeoutMs: 15000,
    latenciaSimuladaMs: 0
  },
  storageKey: 'nohunger:db',
  storageVersion: 3,
  sessionKey: 'nohunger:sessao',

  /* ---------- Cores usadas em SVG gerado por JS (mesmas do design) ---------- */
  cores: {
    brown: '#4A260D', brown700: '#754016', orange: '#F28C0B', orange700: '#C76A0A', green: '#64851B',
    green900: '#3F5712', green100: '#E5EBC2', beige: '#FFF4E5', sand: '#F3E4D0', line: '#EBD9C4', peach: '#FDE6C8', white: '#FFFFFF'
  },

  /* ---------- Perfis ---------- */
  perfis: {
    doador:       { label: 'Doador', pagina: 'doador.html', papel: 'Doador verificado', papelPendente: 'Cadastro em análise' },
    instituicao:  { label: 'Instituição', pagina: 'instituicao.html', papel: 'Instituição verificada', papelPendente: 'Cadastro em análise' },
    beneficiario: { label: 'Beneficiário', pagina: 'beneficiario.html' },
    governo:      { label: 'Governo', pagina: 'governo.html', papel: 'Gestor público' }
  },

  /* ---------- Fluxo da doação ----------
     Doador publica → Instituição reserva → Coleta → Instituição recebe (entregue)
     → Estoque → Distribuição ao beneficiário. */
  status: {
    publicada: { label: 'Publicada', etapa: 1 },
    reservada: { label: 'Reservada', etapa: 2 },
    coletada:  { label: 'Coletada',  etapa: 3 },
    entregue:  { label: 'Entregue',  etapa: 4 },
    cancelada: { label: 'Cancelada', etapa: 0 },
    expirada:  { label: 'Expirada',  etapa: 0 }
  },
  transicoes: {
    publicada: ['reservada', 'cancelada', 'expirada'],
    reservada: ['publicada', 'coletada', 'cancelada'],
    coletada:  ['entregue'],
    entregue:  [],
    cancelada: [],
    expirada:  []
  },
  statusPedido: {
    solicitado:   { label: 'Aguardando a instituição', tag: 'publicada' },
    confirmado:   { label: 'Confirmado', tag: 'reservada' },
    pronto:       { label: 'Pronto para retirar', tag: 'coletada' },
    saiu_entrega: { label: 'Saiu para entrega', tag: 'coletada' },
    concluido:    { label: 'Concluído', tag: 'entregue' },
    cancelado:    { label: 'Cancelado', tag: 'neutra' }
  },

  /* "curto" é o texto mostrado ao beneficiário ("Tem pães e cestas básicas") */
  categorias: [
    { id: 'padaria', label: 'Pães e bolos', curto: 'pães' },
    { id: 'hortifruti', label: 'Frutas e legumes', curto: 'frutas e legumes' },
    { id: 'refeicao', label: 'Refeições prontas', curto: 'refeições prontas' },
    { id: 'laticinios', label: 'Laticínios', curto: 'leite e laticínios' },
    { id: 'mercearia', label: 'Mercearia e cestas', curto: 'cestas básicas' },
    { id: 'carnes', label: 'Carnes e ovos', curto: 'carnes e ovos' },
    { id: 'bebidas', label: 'Bebidas', curto: 'bebidas' },
    { id: 'outros', label: 'Outros', curto: 'outros alimentos' }
  ],
  unidades: [
    { id: 'kg', label: 'kg', curto: 'kg' },
    { id: 'un', label: 'unidades', curto: 'un.' },
    { id: 'l', label: 'litros', curto: 'L' },
    { id: 'cx', label: 'caixas', curto: 'cx.' }
  ],
  /* Peso médio estimado por unidade, usado só para impacto e benefício */
  pesoPorUnidadeKg: { kg: 1, un: 0.4, l: 1, cx: 8 },
  armazenamento: [
    { id: 'ambiente', label: 'ambiente' },
    { id: 'refrigerado', label: 'refrigerado' },
    { id: 'congelado', label: 'congelado' }
  ],
  tiposDoador: ['Padaria', 'Supermercado', 'Mercado', 'Restaurante', 'Hortifruti', 'Indústria de alimentos', 'Distribuidora', 'Outro'],
  tiposInstituicao: ['ONG', 'Igreja', 'Associação', 'Banco de alimentos', 'Cozinha comunitária', 'Instituição de caridade', 'Outra'],
  funcoesVoluntario: ['Voluntário', 'Entregador', 'Motorista'],
  diasSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],

  documentosObrigatorios: {
    doador: ['Cartão CNPJ', 'Alvará de funcionamento'],
    instituicao: ['Cartão CNPJ', 'Estatuto ou ata', 'Comprovante de atuação']
  },

  /* ---------- Regras de negócio ---------- */
  regras: {
    prazoConfirmarResponsavelMin: 30,   // após reservar, a instituição define quem vai retirar
    raiosMapaKm: [2, 5, 10, 20],
    raioPadraoKm: 5,
    raioAvisoInstituicaoKm: 10,          // instituições avisadas de nova doação
    raioAvisoBeneficiarioKm: 3,          // beneficiários avisados de alimento na região
    refeicoesPorKg: 2.5,
    maxPedidosAtivosBeneficiario: 2,
    validadeAlvaraAvisoDias: 30,
    tamanhoMaxFotoPx: 900,
    tamanhoMaxDocumentoMb: 5
  },

  /* ---------- Benefício fiscal (estimativa) ----------
     A regra de cálculo depende da norma que instituir o incentivo.
     O valor por kg é um parâmetro provisório para o painel do doador. */
  beneficioFiscal: {
    valorPorKg: 3.45,
    observacao: 'Valor estimado a partir do peso doado e entregue. O benefício efetivo depende da regulamentação do incentivo e do regime tributário de cada empresa.'
  },

  /* ---------- Demonstração ---------- */
  demo: {
    ativo: true,
    duracaoColetaSeg: 120,   // simula o deslocamento do voluntário até o doador
    contas: {
      doador: { email: 'padaria@nohunger.demo', senha: 'demo123' },
      instituicao: { email: 'maos@nohunger.demo', senha: 'demo123' },
      beneficiario: { telefone: '(11) 98888-0000' },
      governo: { email: 'gestor@nohunger.demo', senha: 'demo123' }
    }
  },

  /* ---------- Painel do governo ----------
     Base consolidada de outros municípios (importada), somada aos dados vivos. */
  governo: {
    estado: 'Estado de São Paulo',
    orcamentoAnual: 3000000,
    consolidadoToneladas: [8, 11, 14, 17, 21, 24, 29, 33],   // últimos 8 meses, terminando no mês atual
    base: { doadores: 1476, instituicoes: 322, refeicoes: 75000 },
    minimoPorCelulaMapa: 3                                    // anonimização do mapa de calor
  },

  suporte: {
    telefone: '0800 000 0000',
    whatsapp: '(11) 90000-0000',
    email: 'suporte@nohunger.gov.br',
    horario: 'de segunda a sábado, das 8h às 20h'
  }
};
