# NO hunger

Sistema que liga supermercados, padarias, restaurantes e outros doadores a ONGs, igrejas e instituições de caridade, para que alimentos que seriam descartados cheguem a quem precisa.

**Fluxo:** Doador → Instituição → Coleta → Distribuição → Beneficiário.

## Como abrir

- **Mais simples:** dê dois cliques em `index.html`. Funciona sem internet e sem instalar nada.
- **Com servidor local** (recomendado para testar localização e notificações):
  ```
  cd no-hunger
  python3 -m http.server 8000
  ```
  e abra `http://localhost:8000`.

### Contas de demonstração

Na tela de entrada, escolha o perfil e clique em **Entrar com a conta de demonstração**.

| Perfil | Acesso |
|---|---|
| Doador (Padaria Pão Quente) | `padaria@nohunger.demo` / `demo123` |
| Instituição (Associação Mãos Solidárias) | `maos@nohunger.demo` / `demo123` |
| Beneficiário (Maria) | celular `(11) 98888-0000`; o código aparece na tela |
| Governo | `gestor@nohunger.demo` / `demo123` |

**Dica:** abra cada perfil numa aba diferente do mesmo navegador. Cada aba tem sua própria sessão e os dados são compartilhados, então dá para ver a reserva, o chat e a coleta acontecendo dos dois lados ao mesmo tempo.

Para voltar aos dados iniciais: **Ajuda → Reiniciar dados de demonstração**.

## Estrutura

```
no-hunger/
├── index.html            Entrada: escolha do perfil e login
├── cadastro.html         Cadastro de doador ou instituição (4 etapas, com documentos)
├── doador.html           Área do doador
├── instituicao.html      Área da instituição
├── beneficiario.html     App do beneficiário (celular)
├── governo.html          Painel do governo
├── comprovante.html      Comprovante para imprimir ou salvar em PDF
├── ajuda.html            Central de ajuda pública
├── manifest.webmanifest  Instalação como app no celular
├── assets/
│   ├── css/
│   │   ├── tokens.css      Cores, fonte e sombras do design
│   │   ├── base.css        Fonte, reset, acessibilidade, utilitários
│   │   ├── components.css  Botões, cartões, status, filtros, campos, modal…
│   │   ├── layout.css      Menu lateral, app do celular, telas de entrada
│   │   └── pages.css       Mapa, gráficos, chat, comprovante
│   ├── js/
│   │   ├── core/
│   │   │   ├── config.js   Regras de negócio e parâmetros (raios, prazos, listas)
│   │   │   ├── utils.js    Formatação, datas, distância, HTML seguro, CSV
│   │   │   ├── api.js      Camada de serviços: TODAS as regras de negócio
│   │   │   ├── http.js     Adaptador para o backend (modo HTTP)
│   │   │   ├── store.js    Banco local do modo demonstração
│   │   │   └── seed.js     Dados de exemplo
│   │   ├── components/
│   │   │   ├── ui.js       Componentes de interface reutilizáveis
│   │   │   ├── map.js      Mapa, rota de coleta, mapa de calor
│   │   │   ├── shell.js    Menu, cabeçalho, rotas, notificações
│   │   │   └── comum.js    Perfil, ajuda, mensagens, avaliações
│   │   └── pages/          Uma tela por perfil
│   ├── fonts/              Inter (licença OFL incluída)
│   └── img/                Logo e ícone
└── docs/BACKEND.md       Contrato da API e o que falta para produção
```

## Design preservado

As quatro telas desenhadas (Doador: início; Instituição: doações por perto; Beneficiário: início; Governo: visão geral) foram reproduzidas com as mesmas cores, fontes, ícones, tamanhos e espaçamentos, agora com dados reais. Os estilos que estavam escritos dentro do HTML foram movidos para arquivos CSS, com os mesmos valores.

As telas que não existiam no design (entrada, cadastro, formulários, listas, chat, relatórios etc.) foram montadas **somente com os componentes e tokens do Sistema de design** (cartões, botões, status, alerta, filtros). Peças pequenas sem modelo no design, como campos de formulário, janela modal e aviso rápido, usam as mesmas cores, bordas e raios dos componentes existentes. Também foi acrescentado o que a acessibilidade exige: foco visível, link "Pular para o conteúdo" e menu recolhível em telas pequenas.

## Funcionalidades

**Doador:** cadastro com documentos · publicar excedente (alimento, quantidade, validade, foto, horário de retirada) · editar e excluir enquanto não reservada · cancelar com motivo · doações recorrentes publicadas com um clique ("Doar agora") · acompanhar status em 4 etapas e a coleta no mapa · histórico e relatório de impacto · benefício fiscal com comprovantes numerados · chat · avaliações.

**Instituição:** cadastro com documentos · mapa e lista de doações por perto com filtros (tipo, distância, vence hoje, refrigerado, cabe no estoque) · reservar e definir quem retira em até 30 minutos · rota de coleta e acompanhamento · confirmar coleta e recebimento · estoque com validade e baixas · pedidos de beneficiários e registro de distribuição · voluntários e entregadores · relatórios com exportação · horário do ponto de distribuição.

**Beneficiário:** entrada só com celular/WhatsApp e código · cadastro mínimo (apelido, bairro, cidade, consentimento) · pontos abertos agora e mapa com horários · aviso de alimento na região · reservar retirada ou pedir entrega · código do pedido · avaliar o atendimento · apagar os próprios dados.

**Governo:** aprovação de cadastros com conferência de documentos · indicadores e gráfico mensal · mapa de calor anonimizado · relatórios por mês, tipo de alimento, município e instituição · repasses com controle do orçamento · dados abertos em CSV e JSON · exportação.

**Gerais:** login por perfil · notificações (painel, contadores e aviso do navegador) · chat entre doador e instituição · avaliações · central de ajuda · gerenciamento de perfil · web e celular (instalável) · acessibilidade.

## Privacidade e acessibilidade

- Dados de beneficiários nunca aparecem para doadores, no painel do governo nem nos dados abertos; a instituição vê só o necessário, e apenas durante o atendimento.
- Todo texto vindo do usuário é escapado antes de ir para a tela (proteção contra injeção de HTML).
- Todos os campos têm rótulo; erros aparecem junto ao campo e são lidos por leitores de tela; modais prendem o foco e fecham com Esc; navegação completa por teclado; áreas de toque grandes, como no design; respeita "reduzir movimento".

## Para produção

Veja **docs/BACKEND.md**: como ligar o backend (uma linha em `config.js`), as 75 rotas da API, o modelo de dados, as regras que o servidor deve garantir e os serviços externos necessários (banco com geografia, SMS/WhatsApp, mapa de ruas, armazenamento de arquivos, tempo real, HTTPS).

No modo demonstração, os dados ficam só neste navegador, senhas e códigos são verificados localmente e a posição do entregador é simulada. Nada disso deve ir para produção sem o backend.
