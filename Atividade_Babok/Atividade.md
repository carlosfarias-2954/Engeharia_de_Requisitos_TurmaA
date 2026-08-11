# Simulação de Projeto com BABoK — Sistema de Gestão para Startup de Tecnologia

## 1. Cenário / Problema

A startup de tecnologia está em fase de crescimento e enfrenta três dores estruturais que ameaçam sua escalabilidade:

* **Comunicação falha:** desconexão entre as equipes técnicas e de negócio no dia a dia.
* **Atrasos e retrabalho:** ciclos de desenvolvimento ineficientes, gerando desperdício de tempo e recursos.
* **Ponto cego de gestão:** ausência de relatórios de desempenho e métricas de produtividade.

---

## 2. Stakeholders Envolvidos

| Stakeholder                   | Foco / Responsabilidade                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Analistas de Negócio**      | **Descoberta:** conduzem entrevistas investigativas com as partes interessadas.                      |
| **Stakeholders**              | **Perspectiva:** representam as necessidades reais de gestores, desenvolvedores e clientes internos. |
| **Engenheiros de Requisitos** | **Estruturação:** organizam, documentam e priorizam os requisitos levantados.                        |

---

## 3. Requisitos de Negócio

Os principais objetivos estratégicos da solução são:

* Organização de backlog.
* Gestão de sprints.
* Geração de relatórios.
* Integração com o ecossistema de ferramentas já utilizadas.

---

## 4. Requisitos das Partes Interessadas

Após entrevista com **Leandro Gonçalves da Silva**, stakeholder com experiência prévia em startups, o grupo identificou que o sistema deveria funcionar como uma plataforma de transmissão (*streaming*), com a possibilidade de criação de chats para registro histórico do projeto.

---

## 5. Requisitos da Solução

### 5.1 Requisitos Funcionais

O sistema deverá:

* Possuir área de login para **usuários** e **administradores**.
* Possuir uma área para realização de transmissões, utilizadas nas reuniões diárias (*dailys*).
* Permitir a criação de chats específicos para cada projeto, servindo como forma de registro e histórico do projeto.
* Possuir uma área de calendário para que o administrador possa marcar futuras reuniões e entregas relacionadas ao projeto.
* Possuir um módulo de **Power BI** específico para cada projeto.

### 5.2 Requisitos Não Funcionais

O sistema deverá:

* Responder às solicitações em até **1 segundo**.
* Utilizar **criptografia** para proteger os dados referentes aos projetos.
* Realizar **backup semanal** de cada projeto.
* Enviar **lembretes** aos envolvidos quando houver uma reunião marcada.

---

## 6. Priorização

### 6.1 Funcionalidades Essenciais — V1

As seguintes funcionalidades foram definidas como essenciais para a primeira versão do sistema:

* [x] Área de login para usuário e administrador.
* [x] Área de transmissões para reuniões *dailys*.
* [x] Criação de chats por projeto.
* [x] Módulo de Power BI por projeto.

### 6.2 Funcionalidades Desejáveis

* [ ] Área de calendário para marcação de reuniões e entregas.

---

## 7. Solução Proposta

O grupo propõe o desenvolvimento de um **aplicativo de transmissão e gestão de projetos**, permitindo que a empresa realize reuniões, aumente o contato entre os envolvidos nos projetos e mantenha um registro histórico das atividades realizadas.

A solução contará com um **módulo de Power BI integrado**, permitindo que os administradores e o **PO (*Product Owner*)** de cada projeto tenham acesso a relatórios relacionados ao desempenho e à produtividade da equipe.

### Principais componentes da solução

```text
                    ┌─────────────────────────┐
                    │ Sistema de Gestão       │
                    │ para Startup            │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │ Transmissão │     │ Chat /      │     │ Power BI    │
      │ de Reuniões │     │ Histórico   │     │             │
      └─────────────┘     └─────────────┘     └─────────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                       ┌─────────────────┐
                       │ Gestão do       │
                       │ Projeto         │
                       └─────────────────┘
```

---

## 8. Justificativa

A solução é eficiente porque, além de resolver os problemas da startup a curto prazo, cria uma **rotina estruturada de comunicação, acompanhamento e registro dentro da empresa**.

Com a centralização das reuniões, dos históricos dos projetos e dos indicadores de desempenho, espera-se:

* Reduzir falhas de comunicação entre as equipes.
* Diminuir atrasos e retrabalho.
* Facilitar o acompanhamento dos projetos.
* Aumentar a visibilidade sobre a produtividade das equipes.
* Centralizar informações importantes dos projetos.
* Criar um histórico das decisões e atividades realizadas.
* Apoiar gestores e *Product Owners* na tomada de decisões baseada em dados.

Dessa forma, a solução contribui não apenas para resolver os problemas atuais, mas também para **prevenir que essas dificuldades voltem a ocorrer conforme a startup continue crescendo**.

---

## 9. Resumo da Solução

| Área                          | Solução                                   |
| ----------------------------- | ----------------------------------------- |
| **Comunicação**               | Transmissões para reuniões *dailys*       |
| **Registro**                  | Chats específicos por projeto             |
| **Gestão**                    | Organização e acompanhamento dos projetos |
| **Indicadores**               | Módulo de Power BI                        |
| **Agenda**                    | Calendário para reuniões e entregas       |
| **Segurança**                 | Criptografia dos dados                    |
| **Disponibilidade dos dados** | Backup semanal                            |
| **Notificações**              | Lembretes de reuniões                     |
| **Desempenho**                | Resposta de até 1 segundo                 |

---

## 10. Conclusão

A proposta apresenta uma solução integrada para os principais problemas identificados na startup, utilizando conceitos de **Análise de Negócios e Engenharia de Requisitos** para transformar as necessidades dos stakeholders em requisitos de solução.

A primeira versão (**V1**) prioriza as funcionalidades essenciais para comunicação, registro e acompanhamento dos projetos, enquanto funcionalidades adicionais poderão ser incorporadas posteriormente conforme as necessidades da organização.

## Referencias
* Babok
* IA do canva para interface
* GPT e CLAUDE para estruturação e formatação

## integrantes
* Carlos Eduardo
* Leandro Gonçalves
* Theo Guimarães
* Vitor Emanoel
*
