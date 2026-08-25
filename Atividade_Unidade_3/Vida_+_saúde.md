# Clínica Vida + Saúde

## Stakeholders

A Clínica Vida + Saúde é uma clínica médica de médio porte que atende diversas especialidades. A clínica possui os seguintes stakeholders:

- Pacientes
- Médicos
- Enfermeiros/Técnicos de enfermagem
- Recepcionistas
- Call center
- Coordenador
- Gerente
- Proprietário

---

## Regras de Negócio

A Vida + Saúde possui regras de negócio bem estabelecidas. É possível dividir essas regras em diferentes setores.

### Cadastro de Pacientes

Cada paciente possui um cadastro contendo:

- Nome
- CPF
- Data de nascimento
- Telefone
- E-mail

Esses dados são utilizados principalmente para realizar o agendamento das consultas.

### Agendamentos

Cada paciente pode possuir várias consultas marcadas com especialidades diferentes, desde que os horários das consultas não se choquem.

### Atendimento

Ao chegar à clínica, o paciente precisa pegar uma senha e aguardar ser chamado.

Quando for chamado, o recepcionista:

1. Verifica os dados do paciente.
2. Verifica o horário da consulta.
3. Confirma se as informações estão corretas.
4. Libera o paciente para aguardar o médico.

### Pós-consulta

Após a consulta, o paciente é encaminhado para a área de pós-consulta, onde os atendentes:

- Informam os valores dos exames.
- Explicam os procedimentos.
- Orientam o paciente sobre os próximos passos.

---

# Problemas Identificados

A clínica está passando por problemas devido à forma como suas regras de negócio foram implantadas.

Atualmente, os processos são fragmentados, com informações espalhadas por diversas ferramentas diferentes.

Os principais problemas identificados são:

- Demora na atualização de dados
- Duplicidade de dados
- Conflitos de horário
- Cancelamentos e faltas
- Dificuldade para reorganizar agendas
- Falhas na comunicação com os pacientes

---

# Modelo Atual (AS-IS)

O modelo atual de negócios da Clínica Vida + Saúde funciona da seguinte forma.

## Marcação da Consulta

1. O paciente entra em contato com a clínica, podendo ser:
   - Presencialmente na clínica;
   - Por ligação;
   - Por mensagem.

2. Ao entrar em contato, o paciente é instruído a realizar seu cadastro com auxílio do atendente.

3. Após realizar o cadastro, o paciente informa a especialidade na qual deseja realizar a consulta.

4. A atendente verifica se existe alguma vaga disponível.

5. Caso exista uma vaga, a atendente realiza o agendamento e informa o paciente.

## Atendimento da Consulta

1. O paciente comparece à clínica no dia marcado para sua consulta.

2. Ao chegar, pega uma senha e aguarda ser chamado na recepção.

3. Quando é chamado, a atendente:
   - Verifica a consulta marcada;
   - Confere os dados do paciente no cadastro.

4. Após a verificação, é realizado o pagamento da consulta.

5. O paciente é encaminhado para a lista de espera do médico.

6. O paciente aguarda até ser chamado para o consultório.

## Pós-consulta

1. Após terminar a consulta, o paciente é encaminhado para a área de pós-consulta.

2. O paciente aguarda ser chamado pelos atendentes.

3. Quando é chamado, o atendente realiza os orçamentos necessários.

4. O atendente também explica os exames e procedimentos indicados pelo médico.

---

# Possíveis Melhorias

Os principais problemas identificados na clínica são:

- Conflitos de dados;
- Duplicidade de marcação;
- Falhas na comunicação;
- Cancelamentos;
- Faltas de pacientes.

Para solucionar esses problemas, são propostas as seguintes melhorias.

## Conflito de Dados e Duplicidade de Marcação

É possível minimizar ou até eliminar esses problemas por meio da implementação de um sistema integrado.

O sistema deverá:

- Possuir atualização instantânea das informações;
- Permitir que os atendentes visualizem as alterações realizadas em tempo real;
- Utilizar uma base de dados centralizada para armazenar os dados dos pacientes;
- Impedir que dois atendentes realizem marcações conflitantes;
- Reduzir a inconsistência e duplicidade de informações.

## Comunicação e Cancelamentos

Para solucionar os problemas relacionados à comunicação e aos cancelamentos, será necessária a implementação de um sistema de lembretes integrado ao processo de atendimento.

O sistema deverá:

- Avisar o paciente sobre a proximidade da consulta;
- Permitir que o paciente cancele a consulta;
- Permitir que o paciente solicite o reagendamento;
- Reduzir a quantidade de faltas;
- Melhorar a comunicação entre a clínica e os pacientes.

---

# Modelo Futuro (TO-BE)

No modelo futuro, o processo após a chegada do paciente à clínica permanecerá praticamente igual.

A principal mudança ocorrerá no processo de marcação das consultas, com a implementação de um sistema integrado e de um sistema de lembretes.

## Marcação da Consulta

1. O paciente entra em contato com a clínica, podendo ser:
   - Presencialmente;
   - Por ligação;
   - Por mensagem.

2. O paciente realiza seu cadastro com auxílio do atendente.

3. O paciente informa a especialidade desejada.

4. A atendente verifica a disponibilidade de horários no sistema.

5. Caso exista uma vaga disponível, a consulta é marcada.

6. O sistema registra o agendamento na base de dados centralizada.

7. O paciente recebe a confirmação da consulta.

8. O sistema de lembretes enviará três avisos:

   - **Uma semana antes:** lembrete da consulta;
   - **Um dia antes:** lembrete da consulta, com possibilidade de cancelamento ou reagendamento;
   - **Seis horas antes:** lembrete da consulta.

Nos dois primeiros avisos, o paciente terá a possibilidade de cancelar ou remarcar a consulta caso não possa comparecer.

---

# Requisitos Funcionais e Não Funcionais

## Sistema de Uso dos Recepcionistas

### Requisitos Funcionais

- O sistema deve possuir login e senha individuais para cada usuário.
- O sistema deve permitir realizar a marcação de consultas.
- O sistema deve permitir alterações nas consultas e agendas dos médicos.
- O sistema deve liberar a agenda de consultas no início de cada mês para que os médicos possam confirmar seus horários.
- O sistema deve possuir uma conta administrativa responsável por realizar alterações em horários já marcados.
- O sistema deve impedir a marcação de duas consultas no mesmo horário para o mesmo médico.
- O sistema deve possuir indicadores de:
  - Marcações;
  - Cancelamentos;
  - Atendimentos.

### Requisitos Não Funcionais

- O sistema deve possuir tempo de resposta de **1 segundo ou menos**.
- Os dados dos pacientes devem ser criptografados.
- O sistema deve gerar um resumo diário dos logs para permitir o controle e auditoria dos dados.
- O sistema deve realizar salvamento automático dos dados para evitar perdas em situações como queda ou pico de energia ou outros acontecimentos inesperados.

---

# Sistema de Lembretes

## Requisitos Funcionais

- O sistema deve enviar três lembretes ao paciente:
  - Um lembrete uma semana antes da consulta;
  - Um lembrete um dia antes da consulta;
  - Um lembrete seis horas antes da consulta.
- O sistema deve permitir o reagendamento ou cancelamento da consulta durante os dois primeiros avisos.
- O sistema deve armazenar:
  - Nome do paciente;
  - Horário da consulta;
  - Especialidade da consulta.
- O sistema deve avisar o paciente caso o médico cancele ou altere sua agenda.

## Requisitos Não Funcionais

- O sistema deve possuir tempo de resposta de **1 segundo ou menos**.
- As mensagens enviadas devem ser criptografadas.

---

# Resumo do Modelo Futuro

A implementação do novo sistema tem como principais objetivos:

- Centralizar os dados dos pacientes;
- Evitar duplicidade de informações;
- Impedir conflitos de horários;
- Facilitar a organização das agendas;
- Reduzir cancelamentos e faltas;
- Melhorar a comunicação com os pacientes;
- Permitir o acompanhamento de indicadores;
- Aumentar a eficiência dos recepcionistas e do call center;
- Melhorar a experiência do paciente.
