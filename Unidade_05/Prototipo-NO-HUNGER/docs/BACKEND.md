# NO hunger — Integração com o backend

O front-end já está pronto para trabalhar com um servidor. Hoje ele roda em **modo demonstração**: os dados ficam no navegador (localStorage) e as regras de negócio são executadas em `assets/js/core/api.js`. Para produção, basta ligar o modo HTTP e implementar no servidor as rotas abaixo, com as **mesmas regras**.

## 1. Como ligar o backend

Em `assets/js/core/config.js`:

```js
backend: {
  mode: 'http',                       // 'local' = demonstração
  baseUrl: 'https://api.seu-dominio.gov.br/api/v1',
  timeoutMs: 15000
}
```

Nada mais muda nas telas: todas chamam `NH.api.<grupo>.<ação>(args)`. Em modo HTTP, `assets/js/core/http.js` converte cada chamada na rota REST registrada:

```
PUT /doacoes/:id   + { id: 'd1', titulo: 'Pães' }   →   PUT {baseUrl}/doacoes/d1   corpo { "titulo": "Pães" }
GET /estoque       + { limite: 10 }                 →   GET {baseUrl}/estoque?limite=10
```

Com o backend ligado, `store.js` e `seed.js` deixam de ser usados (podem ser removidos das páginas), e a rota `POST /demo/reiniciar` **não deve existir** em produção.

## 2. Convenções

| Item | Padrão |
|---|---|
| Formato | JSON (`Content-Type: application/json`), datas em ISO 8601, dinheiro em número decimal (R$) |
| Autenticação | `Authorization: Bearer <token>`. As rotas de login/cadastro devolvem `{ usuario, token, destino }` |
| Erros | Código HTTP adequado e corpo `{ "mensagem": "texto para o usuário", "codigo": "slug", "campo": "nome_do_campo" }`. O `campo` faz o front marcar o campo certo do formulário |
| 401 | O front apaga a sessão e volta ao login |
| 403 | Perfil sem permissão ou cadastro ainda não aprovado (`codigo: "cadastro_pendente"`) |
| 409 | Mudança de status inválida (ex.: reservar doação já reservada) |
| 422 | Erro de validação |

## 3. Contrato da API (75 rotas)

Gerado a partir do registro em `api.js` (`NH.api.rotas()`), que é a fonte da verdade. Os nomes dos campos de entrada e saída são os usados em cada `def(...)` daquele arquivo.

#### auth

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.auth.entrar` | `POST /auth/login` | público |
| `NH.api.auth.solicitarCodigo` | `POST /auth/codigo` | público |
| `NH.api.auth.verificarCodigo` | `POST /auth/codigo/verificar` | público |
| `NH.api.auth.cadastrar` | `POST /auth/cadastro` | público |
| `NH.api.auth.sair` | `POST /auth/logout` | público |
| `NH.api.auth.recuperarSenha` | `POST /auth/recuperar-senha` | público |

#### usuarios

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.usuarios.eu` | `GET /me` | autenticado |
| `NH.api.usuarios.publico` | `GET /usuarios/:id/publico` | autenticado |
| `NH.api.usuarios.atualizar` | `PATCH /me` | autenticado |
| `NH.api.usuarios.reenviarAnalise` | `POST /me/reenviar-analise` | doador, instituicao |
| `NH.api.usuarios.alterarSenha` | `POST /me/senha` | doador, instituicao, governo |
| `NH.api.usuarios.adicionarDocumento` | `POST /me/documentos` | doador, instituicao |
| `NH.api.usuarios.removerDocumento` | `DELETE /me/documentos/:id` | doador, instituicao |
| `NH.api.usuarios.excluirConta` | `DELETE /me` | autenticado |

#### doacoes

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.doacoes.publicar` | `POST /doacoes` | doador |
| `NH.api.doacoes.editar` | `PUT /doacoes/:id` | doador |
| `NH.api.doacoes.excluir` | `DELETE /doacoes/:id` | doador |
| `NH.api.doacoes.cancelar` | `POST /doacoes/:id/cancelamento` | doador |
| `NH.api.doacoes.minhas` | `GET /doacoes?doador=me` | doador |
| `NH.api.doacoes.detalhe` | `GET /doacoes/:id` | doador, instituicao, governo |
| `NH.api.doacoes.confirmarEntregaAoVoluntario` | `POST /doacoes/:id/coleta/confirmacao-doador` | doador |
| `NH.api.doacoes.disponiveis` | `GET /doacoes/disponiveis` | instituicao |
| `NH.api.doacoes.reservar` | `POST /doacoes/:id/reserva` | instituicao |
| `NH.api.doacoes.definirResponsavel` | `PUT /doacoes/:id/responsavel` | instituicao |
| `NH.api.doacoes.cancelarReserva` | `DELETE /doacoes/:id/reserva` | instituicao |
| `NH.api.doacoes.iniciarColeta` | `POST /doacoes/:id/coleta` | instituicao |
| `NH.api.doacoes.confirmarColeta` | `POST /doacoes/:id/coleta/confirmacao` | instituicao |
| `NH.api.doacoes.confirmarRecebimento` | `POST /doacoes/:id/recebimento` | instituicao |
| `NH.api.doacoes.daInstituicao` | `GET /doacoes?instituicao=me` | instituicao |

#### recorrencias

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.recorrencias.listar` | `GET /recorrencias` | doador |
| `NH.api.recorrencias.pendentes` | `GET /recorrencias/pendentes` | doador |
| `NH.api.recorrencias.publicarPendentes` | `POST /recorrencias/publicar-pendentes` | doador |
| `NH.api.recorrencias.dispensarHoje` | `POST /recorrencias/:id/dispensa` | doador |
| `NH.api.recorrencias.salvar` | `PUT /recorrencias/:id` | doador |
| `NH.api.recorrencias.excluir` | `DELETE /recorrencias/:id` | doador |

#### estoque

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.estoque.listar` | `GET /estoque` | instituicao |
| `NH.api.estoque.adicionar` | `POST /estoque` | instituicao |
| `NH.api.estoque.baixa` | `POST /estoque/:id/baixa` | instituicao |

#### distribuicao

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.distribuicao.registrar` | `POST /distribuicoes` | instituicao |
| `NH.api.distribuicao.listar` | `GET /distribuicoes` | instituicao |

#### beneficiario

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.beneficiario.pontos` | `GET /pontos-distribuicao` | beneficiario |

#### pedidos

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.pedidos.criar` | `POST /pedidos` | beneficiario |
| `NH.api.pedidos.meus` | `GET /pedidos?beneficiario=me` | beneficiario |
| `NH.api.pedidos.cancelar` | `POST /pedidos/:id/cancelamento` | beneficiario |
| `NH.api.pedidos.daInstituicao` | `GET /pedidos?instituicao=me` | instituicao |
| `NH.api.pedidos.atualizar` | `PATCH /pedidos/:id` | instituicao |

#### voluntarios

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.voluntarios.listar` | `GET /voluntarios` | instituicao |
| `NH.api.voluntarios.salvar` | `PUT /voluntarios/:id` | instituicao |
| `NH.api.voluntarios.remover` | `DELETE /voluntarios/:id` | instituicao |

#### chat

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.chat.conversas` | `GET /conversas` | doador, instituicao |
| `NH.api.chat.mensagens` | `GET /conversas/:doacaoId/mensagens` | doador, instituicao |
| `NH.api.chat.enviar` | `POST /conversas/:doacaoId/mensagens` | doador, instituicao |

#### notificacoes

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.notificacoes.listar` | `GET /notificacoes` | autenticado |
| `NH.api.notificacoes.marcarLida` | `POST /notificacoes/:id/lida` | autenticado |
| `NH.api.notificacoes.marcarTodas` | `POST /notificacoes/lidas` | autenticado |

#### avaliacoes

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.avaliacoes.criar` | `POST /avaliacoes` | doador, instituicao, beneficiario |
| `NH.api.avaliacoes.recebidas` | `GET /usuarios/:usuarioId/avaliacoes` | autenticado |
| `NH.api.avaliacoes.pendentes` | `GET /avaliacoes/pendentes` | doador, instituicao, beneficiario |

#### relatorios

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.relatorios.doador` | `GET /relatorios/doador` | doador |
| `NH.api.relatorios.instituicao` | `GET /relatorios/instituicao` | instituicao |

#### beneficio

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.beneficio.resumo` | `GET /beneficio-fiscal` | doador |
| `NH.api.beneficio.comprovantes` | `GET /comprovantes` | doador, instituicao, governo |

#### governo

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.governo.painel` | `GET /governo/painel` | governo |
| `NH.api.governo.cadastros` | `GET /governo/cadastros` | governo |
| `NH.api.governo.cadastro` | `GET /governo/cadastros/:id` | governo |
| `NH.api.governo.revisar` | `POST /governo/cadastros/:id/decisao` | governo |
| `NH.api.governo.mapaCalor` | `GET /governo/mapa-calor` | governo |
| `NH.api.governo.relatorio` | `GET /governo/relatorio` | governo |
| `NH.api.governo.repasses` | `GET /governo/repasses` | governo |
| `NH.api.governo.criarRepasse` | `POST /governo/repasses` | governo |
| `NH.api.governo.dadosAbertos` | `GET /dados-abertos/:conjunto` | governo |

#### ajuda

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.ajuda.abrirChamado` | `POST /chamados` | público |
| `NH.api.ajuda.meusChamados` | `GET /chamados` | autenticado |

#### painel

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.painel.contadores` | `GET /me/contadores` | autenticado |

#### demo

| Ação no front-end | Rota REST | Perfis |
|---|---|---|
| `NH.api.demo.reiniciar` | `POST /demo/reiniciar` | público |


## 4. Modelo de dados

| Entidade | Campos principais |
|---|---|
| **usuarios** | id, perfil (`doador`, `instituicao`, `beneficiario`, `governo`), nome, nomeCurto, tipo, documento (CNPJ), email, senhaHash, telefone, responsavel, endereco {logradouro, bairro, cidade, uf, cep}, geo {lat, lng}, status (`pendente`, `aprovado`, `reprovado`, `suspenso`, `excluido`), motivoReprovacao, documentos[] {nome, arquivo, tipo, tamanho, url, validade}, notificacoesNavegador. Instituição: capacidadeKg, refrigeracao, horario {dias[], abre, fecha}. Beneficiário: apelido, bairro, cidade, preferencia, enderecoEntrega, consentimentoLGPD |
| **doacoes** | id, doadorId, titulo, categoria, quantidade, unidade, armazenamento, validade, janela {data, inicio, fim}, observacoes, fotos[], geo, status, instituicaoId, responsavelId, reservadaEm, prazoResponsavel, coleta {iniciadaEm, duracaoSeg, origem, destino, concluidaEm}, coletadaEm, entregueEm, quantidadeRecebida, pesoEntregueKg, beneficioValor, comprovante {numero, codigo}, recorrenciaId, motivoCancelamento, historico[] {status, em, por, motivo} |
| **recorrencias** | id, doadorId, ativa, dias[], modelo {titulo, quantidade, unidade, categoria, armazenamento, validadeDias, janela}, ultimaPublicacao, dispensadaEm |
| **estoque** | id, instituicaoId, doacaoId, origem (`doacao`/`avulsa`), titulo, categoria, quantidade, unidade, validade, armazenamento, entradaEm |
| **distribuicoes** | id, instituicaoId, em, tipo (`retirada`, `entrega`, `perda`), pessoasAtendidas, pedidoId, itens[] {titulo, quantidade, unidade, categoria}, pesoKg, motivo, observacao |
| **pedidos** | id, beneficiarioId, instituicaoId, tipo, codigo (4 dígitos), status (`solicitado`, `confirmado`, `pronto`, `saiu_entrega`, `concluido`, `cancelado`), enderecoEntrega, observacao, historico[] |
| **voluntarios** | id, instituicaoId, nome, telefone, funcao, veiculo, disponivel |
| **mensagens** | id, doacaoId (conversa), deId, paraId, texto, em, lida |
| **notificacoes** | id, userId, titulo, texto, link, tipo (`info`, `urgente`, `mensagem`, `regiao`), ref, em, lida |
| **avaliacoes** | id, deId, paraId, doacaoId ou pedidoId, nota (1–5), comentario, em |
| **repasses** | id, instituicaoId, valor, data, descricao, registradoPor |
| **chamados** | id, userId, assunto, mensagem, contato, protocolo, status |
| **codigos** | telefone, codigo, expira, tentativas, verificado (login por SMS/WhatsApp) |

Sugestão: PostgreSQL com **PostGIS** (as consultas "doações em até X km" e "beneficiários num raio de 3 km" ficam simples e rápidas).

## 5. Regras que o servidor precisa garantir

Todas já estão implementadas em `api.js` e servem de especificação:

1. **Fluxo da doação**: `publicada → reservada → coletada → entregue` (também `cancelada` e `expirada`). Transições permitidas em `config.transicoes`; qualquer outra devolve 409.
2. **Fluxo principal**: Doador → Instituição (reserva) → Coleta → Recebimento (entra no estoque) → Distribuição → Beneficiário. O doador nunca entrega direto ao beneficiário.
3. **Prazo de 30 minutos**: reserva sem responsável definido volta a `publicada` e avisa as duas partes. No servidor, isso é uma **tarefa agendada** (a cada minuto), assim como a expiração de doações vencidas.
4. **Aprovação**: doadores e instituições só publicam/reservam com `status = aprovado`. Beneficiários não passam por aprovação (cadastro mínimo).
5. **Edição e exclusão**: o doador só altera ou exclui doações `publicadas`. Depois da reserva, apenas cancela com motivo.
6. **Retirada com código**: a distribuição ligada a um pedido exige o código de 4 dígitos mostrado ao beneficiário.
7. **Benefício fiscal**: calculado no recebimento (`pesoEntregueKg × valorPorKg`) e **gravado na doação**, para que mudanças futuras de regra não alterem comprovantes emitidos. Número sequencial e código de verificação únicos.
8. **Avisos**: instituições a até 10 km recebem aviso de nova doação; beneficiários a até 3 km recebem "Chegou alimento na sua região" quando uma instituição recebe alimentos. Raios em `config.regras`.

## 6. Privacidade (LGPD)

- Dados de beneficiários **nunca** aparecem para doadores, no painel do governo ou em dados abertos.
- A instituição vê do pedido só apelido, bairro e código. Endereço e telefone aparecem **apenas em entregas em andamento** e são apagados ao concluir ou cancelar (`pedidos.daInstituicao`).
- O mapa de calor agrega pedidos em células de ~1 km e oculta células com menos de 3 pedidos (`config.governo.minimoPorCelulaMapa`).
- Exclusão de conta remove dados pessoais e mantém só o registro mínimo para a prestação de contas.
- No servidor: criptografia em repouso para telefone e endereço, registro de acesso (auditoria), política de retenção e encarregado (DPO).

## 7. Serviços externos necessários

| Necessidade | Opções | Onde entra |
|---|---|---|
| Banco de dados com geografia | PostgreSQL + PostGIS | todas as rotas |
| Armazenamento de arquivos | S3 ou compatível (MinIO, nuvem gov) | fotos das doações e documentos (upload multipart; hoje só imagens pequenas ficam no navegador) |
| Código por SMS/WhatsApp | API do WhatsApp Business, Zenvia, Twilio | `auth.solicitarCodigo` (nunca devolver o código na resposta) |
| Mapa de ruas real | Leaflet ou MapLibre + OpenStreetMap | substituir `NH.mapa.render` e `NH.mapa.rota` mantendo a mesma assinatura |
| Endereço → coordenadas | Nominatim, Google Geocoding, base do IBGE | cadastro e perfil (hoje: localização do navegador ou posição aproximada) |
| CEP | ViaCEP (já usado no cadastro) | — |
| Validação de CNPJ e situação cadastral | API CNPJ (Serpro/Receita) | cadastro e aprovação pelo governo |
| Login gov.br (opcional) | Login Único gov.br | gestores públicos e empresas |
| Tempo real | WebSocket ou Server-Sent Events | chat, contadores e acompanhamento da coleta (hoje o front consulta a cada 5–20 s em modo HTTP) |
| Posição do entregador | PWA/app do voluntário enviando GPS | novo campo de posição na coleta (hoje a posição é simulada pelo tempo estimado) |
| Avisos no celular | Web Push (VAPID) ou Firebase Cloud Messaging | notificações com o app fechado |
| E-mail | serviço transacional | recuperação de senha, aprovação de cadastro |
| Hospedagem | HTTPS obrigatório | localização, notificações e instalação como app só funcionam em HTTPS |

## 8. Benefício fiscal

O painel mostra uma **estimativa** parametrizada em `config.beneficioFiscal.valorPorKg`. A regra efetiva depende da norma que instituir o incentivo do programa (ou das regras já existentes de dedução de doações, conforme o regime tributário de cada empresa) e deve ser definida com a equipe jurídica e com o órgão gestor. O sistema já entrega o que a fiscalização normalmente pede: comprovante numerado, código de verificação, identificação do doador e da instituição (CNPJ), data de coleta e de recebimento, quantidade e peso.
