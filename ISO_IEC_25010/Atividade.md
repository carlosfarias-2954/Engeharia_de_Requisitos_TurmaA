<p align="center">
  <img src="logo-ceub-assinatura-conceito-deslocado-01.webp" alt="Logomarca do CEUB" width="300">
</p>

# Qualidade de Software com a ISO/IEC 25010 — Clínica Vida + Saúde

**Material do estudante**  
**Curso:** Engenharia de Software  
**Disciplina:** Engenharia de Requisitos  
**Profª:** Kadidja Valéria  
**Tema:** Modelo de qualidade de produto da ISO/IEC 25010 aplicado ao Sistema Integrado de Gestão de Atendimento – Clínica Vida + Saúde

**Projeto:** Sistema Integrado de Gestão de Atendimento – Clínica Vida + Saúde
**Grupo:** Turma A — Vitor, Theo, Leandro, Edgar e Carlos

---

## 1. Apresentação

No projeto da **Clínica Vida + Saúde**, não basta o sistema executar as funções de cadastro e agendamento. Também é necessário avaliar seu desempenho, sua segurança, sua confiabilidade, sua facilidade de interação, sua capacidade de integração e adaptação e os riscos envolvidos no tratamento de dados de pacientes.

A **ISO/IEC 25010:2023** apresenta um modelo de referência para especificar, medir e avaliar a qualidade de produtos de software e de Tecnologia da Informação e Comunicação (TIC). A edição de 2023 é a segunda edição da norma e substitui a edição de 2011.

> **Questão norteadora:** como transformar as necessidades identificadas na Clínica Vida + Saúde — como atualização em tempo real, resposta rápida, proteção dos dados e ausência de conflitos de agenda — em requisitos de qualidade verificáveis?

## 2. Objetivos de aprendizagem

Ao estudar este material, você deverá ser capaz de:

- compreender o conceito de qualidade de produto de software;
- reconhecer a finalidade da família SQuaRE;
- identificar as nove características da ISO/IEC 25010:2023;
- relacionar problemas de software às características de qualidade;
- diferenciar requisitos vagos de requisitos mensuráveis;
- elaborar requisitos de qualidade e critérios de aceitação;
- analisar conflitos entre diferentes características de qualidade.

## 3. Situação inicial

Considere a seguinte situação:

> A Clínica Vida + Saúde possui processos de agendamento, atendimento e pós-consulta fragmentados entre diferentes ferramentas. Mesmo que um novo sistema implemente cadastro e agendamento, ele não será considerado adequado se responder lentamente, permitir consultas duplicadas, expor dados dos pacientes ou dificultar o trabalho da recepção e do call center.

Reflita e registre suas ideias:

1. Um sistema que apenas permita agendar consultas pode ser considerado de qualidade? Justifique.
2. Cumprir os requisitos funcionais é suficiente para a Clínica Vida + Saúde?
3. Quais problemas de qualidade estão relacionados ao cenário levantado?
4. Como desempenho, segurança, confiabilidade e interação poderiam ser avaliados objetivamente?

## 4. O que é qualidade de software?

Qualidade de software é o grau em que um produto atende às necessidades explícitas e implícitas das partes interessadas, considerando as condições e o contexto em que será utilizado.

A qualidade pode ser observada a partir de diferentes perspectivas:

- **usuário:** o produto é útil, compreensível e confiável?
- **cliente:** o produto atende às necessidades do negócio?
- **desenvolvedor:** o código pode ser compreendido, testado e modificado?
- **organização:** o produto é seguro, sustentável e economicamente viável?
- **equipe de testes:** existem critérios objetivos para verificar sua qualidade?

### Qualidade não é apenas ausência de erros

Um software pode realizar corretamente suas funções e, ainda assim, apresentar problemas de qualidade. Por exemplo:

- permitir agendamentos, mas responder lentamente à recepção e ao call center;
- possuir cadastro e agenda, mas permitir duplicidade de consultas;
- executar as operações, mas expor dados pessoais e clínicos dos pacientes;
- funcionar, mas perder dados após uma interrupção;
- atender à recepção, mas não funcionar adequadamente nos equipamentos e navegadores já utilizados pela clínica.

## 5. A família SQuaRE

A ISO/IEC 25010 pertence à família **SQuaRE — Systems and Software Quality Requirements and Evaluation**. Essa família reúne normas relacionadas a:

- modelos de qualidade;
- definição de requisitos de qualidade;
- medição da qualidade;
- avaliação de produtos;
- planejamento e gerenciamento da qualidade.

No projeto da Clínica Vida + Saúde, o modelo da ISO/IEC 25010 pode apoiar o levantamento e a definição dos requisitos de qualidade, a validação da abrangência dos requisitos, a definição de objetivos de teste e o estabelecimento de critérios de aceitação para desempenho, segurança, interação, confiabilidade e compatibilidade.

## 6. As nove características de qualidade

> Os nomes em português apresentados neste material são traduções didáticas. Em documentos técnicos formais, consulte a edição oficial ou sua adoção nacional.

| Característica | Pergunta orientadora | Exemplo de aplicação |
|---|---|---|
| Adequação funcional | O produto fornece corretamente as funções necessárias? | Agendamento de consultas conforme as regras da clínica. |
| Eficiência de desempenho | O produto responde adequadamente com os recursos disponíveis? | Controle do tempo de resposta e do acesso simultâneo da recepção, call center e coordenação. |
| Compatibilidade | O produto convive e troca informações com outros produtos? | Integração entre a base centralizada de agendamento e o sistema de lembretes. |
| Capacidade de interação | As pessoas conseguem interagir adequadamente com o produto? | Tela de agendamento clara, com poucos passos e prevenção de horários duplicados. |
| Confiabilidade | O produto permanece funcionando conforme esperado? | Disponibilidade do sistema durante o atendimento da clínica e períodos de maior demanda. |
| Segurança | Dados, identidades e operações estão protegidos? | Login individual, proteção dos dados dos pacientes e registro das alterações de agenda. |
| Manutenibilidade | O produto pode ser analisado, testado e modificado com eficiência? | Alteração do módulo de agenda sem provocar falhas indevidas no cadastro ou nos demais módulos. |
| Flexibilidade | O produto pode ser adaptado, instalado, substituído ou escalado? | Funcionamento nos equipamentos e navegadores já utilizados pela clínica. |
| Proteção contra riscos (*safety*) | O produto reduz riscos de danos a pessoas, patrimônio ou ambiente? | Bloqueio de operações que possam gerar atendimento ou agendamento incompatível com as regras estabelecidas. |

### 6.1 Adequação funcional

Avalia se as funções disponibilizadas atendem às necessidades estabelecidas. Abrange a existência das funções necessárias, a correção dos resultados e a contribuição dessas funções para a realização das tarefas.

**Exemplo:** o sistema da clínica precisa permitir cadastro e agendamento, impedir conflitos de horário e permitir que recepção, call center e médicos realizem suas tarefas conforme as necessidades levantadas.

### 6.2 Eficiência de desempenho

Avalia o desempenho do produto em relação aos recursos utilizados. Pode envolver tempo de resposta, processamento, consumo de recursos e capacidade de atendimento.

**Exemplo de requisito:**

> O sistema da Clínica Vida + Saúde deverá responder às solicitações dos usuários em até 1 segundo durante o uso simultâneo da recepção, do call center e da coordenação.

### 6.3 Compatibilidade

Verifica a capacidade de um produto coexistir e trocar informações com outros produtos ou componentes.

Exemplos de situações relacionadas:

- aplicativos executados no mesmo ambiente;
- comunicação entre sistemas por uma API;
- importação e exportação de dados;
- integração com sistemas externos.

### 6.4 Capacidade de interação

Relaciona-se à interação entre as pessoas e o produto. Considera elementos como reconhecimento das funções, aprendizagem, operação, prevenção de erros, inclusão, assistência ao usuário e clareza das informações.

**Exemplo:** a tela de agendamento deverá apresentar os dados necessários de forma clara e permitir que um atendente conclua o agendamento em até 3 passos.

### 6.5 Confiabilidade

Avalia a capacidade de o produto executar suas funções de forma consistente nas condições determinadas. Pode considerar disponibilidade, resistência a falhas, recuperação e continuidade da operação.

**Exemplo de requisito:**

> O sistema da clínica deverá realizar salvamento automático dos dados a cada operação, evitando perda de informações em caso de interrupção de energia ou conexão.

### 6.6 Segurança

Avalia a proteção de dados, identidades, operações e acessos. Pode envolver confidencialidade, integridade, autenticidade, responsabilização, não repúdio e resistência a ataques.

**Exemplo:** o sistema da clínica deverá restringir o acesso aos dados dos pacientes e às alterações de agenda conforme o perfil do usuário, utilizando login individual.

### 6.7 Manutenibilidade

Analisa a facilidade para compreender, modificar, testar e reutilizar componentes do produto. Está relacionada à modularidade, reutilização, análise, modificação e testabilidade.

**Exemplo:** uma alteração no módulo de agenda deverá poder ser realizada e testada sem provocar falhas indevidas no cadastro de pacientes.

### 6.8 Flexibilidade

Avalia a capacidade de o produto adaptar-se a alterações de ambiente, demanda ou finalidade. Pode envolver adaptação, escalabilidade, instalação e substituição.

**Exemplo:** o sistema deverá funcionar nos equipamentos e navegadores já utilizados pela recepção e pelo call center, sem exigir substituição de hardware.

### 6.9 Proteção contra riscos — *Safety*

Analisa a capacidade de evitar estados perigosos e reduzir consequências que possam causar danos a pessoas, patrimônio ou ambiente. É especialmente relevante em sistemas hospitalares, veículos, aplicações industriais, aviação e infraestruturas críticas.

**Exemplo:** uma bomba de infusão impede a execução de uma operação quando os parâmetros informados ultrapassam limites de segurança previamente estabelecidos.

## 7. Da característica ao requisito mensurável

Uma característica de qualidade é ampla. Para ser utilizada em um projeto, ela precisa ser transformada em um requisito específico, verificável e, quando aplicável, mensurável.

### Exemplo — desempenho

**Formulação vaga:**

> O sistema deve ser rápido.

**Formulação verificável:**

> O sistema deverá concluir a consulta de notas em até dois segundos para 95% das requisições, considerando até 500 usuários simultâneos.

### Exemplo — capacidade de interação

**Formulação vaga:**

> O sistema deve ser fácil de usar.

**Formulação verificável:**

> Em teste com usuários, pelo menos 90% dos estudantes deverão concluir a solicitação de matrícula sem ajuda e em até cinco minutos.

### Exemplo — segurança

**Formulação vaga:**

> O sistema deve ser seguro.

**Formulação verificável:**

> Após cinco tentativas consecutivas de autenticação inválida, a conta deverá ser temporariamente bloqueada por 15 minutos e o evento deverá ser registrado.

### Estrutura recomendada

> O sistema deverá **[apresentar um comportamento ou propriedade]**, sob **[condições]**, atingindo **[valor ou limite]**, verificado por **[método de avaliação]**.

## 8. Atividade prática — Avaliação de um sistema acadêmico

**Organização:** grupos de três a cinco estudantes  
**Entregável:** tabela de análise da qualidade  
**Valor sugerido:** 0,5 ponto

### Estudo de caso

A análise do projeto da **Clínica Vida + Saúde** identificou as seguintes situações que devem ser avaliadas sob a perspectiva da qualidade:

1. O sistema precisa evitar duplicidade de cadastros e de marcações.
2. As solicitações dos usuários precisam receber resposta em até 1 segundo.
3. Um atendente deve conseguir realizar um agendamento em até 3 passos na tela.
4. O sistema deve continuar preservando os dados mesmo diante de interrupções de energia ou conexão.
5. Os dados pessoais e clínicos dos pacientes precisam permanecer protegidos e criptografados.
6. Alterações no módulo de agenda não devem provocar falhas indevidas em outros módulos.
7. A solução precisa compartilhar uma base centralizada entre recepção e call center e integrar-se ao sistema de lembretes.
8. O sistema precisa funcionar nos equipamentos e navegadores já utilizados pela clínica, sem substituição de hardware.
9. O sistema deve respeitar as regras de negócio da clínica, especialmente a proibição de duas consultas no mesmo horário para o mesmo médico.

### Orientações

Para cada ocorrência, o grupo deverá:

1. identificar a característica de qualidade predominante;
2. justificar a classificação;
3. formular um requisito de qualidade mensurável ou verificável;
4. estabelecer um critério de aceitação;
5. indicar uma forma de teste ou avaliação.

Uma mesma ocorrência pode envolver mais de uma característica. Quando isso acontecer, indique a característica predominante e explique as relações identificadas.

### Formulário de resposta

| Ocorrência | Característica predominante | Justificativa | Requisito de qualidade | Critério de aceitação | Teste ou avaliação |
|---:|---|---|---|---|---|
| 1 | Adequação funcional | A duplicidade prejudica a correta execução do processo de agendamento e cadastro. | O sistema deve impedir registros duplicados de pacientes e marcações conflitantes. | Não deve existir mais de uma marcação conflitante para o mesmo médico e horário. | Testes de cadastro e agendamento com dados repetidos e tentativas simultâneas. |
| 2 | Eficiência de desempenho | A recepção e o call center precisam de resposta rápida para atender os pacientes. | O sistema deve responder às solicitações dos usuários em até 1 segundo. | As solicitações devem atingir o limite de 1 segundo no cenário de uso definido. | Teste de desempenho e carga com usuários simultâneos. |
| 3 | Capacidade de interação | A solução precisa reduzir o tempo e a complexidade do trabalho da recepção. | Um atendente sem treinamento prévio deve conseguir concluir um agendamento em até 3 passos na tela. | O agendamento deve ser concluído dentro do limite de 3 passos no teste definido. | Teste de usabilidade com atendentes e contagem de passos. |
| 4 | Confiabilidade | A perda de dados comprometeria o atendimento e a integridade das informações. | O sistema deve realizar salvamento automático dos dados a cada operação. | Após uma interrupção simulada, os dados confirmados antes da interrupção devem permanecer disponíveis. | Simulação de queda de conexão/energia durante operações. |
| 5 | Segurança | O projeto trata dados pessoais e clínicos dos pacientes. | Os dados dos pacientes e as mensagens do sistema de lembretes devem ser criptografados. | Dados armazenados e transmitidos devem apresentar criptografia conforme a implementação definida. | Auditoria técnica e inspeção dos dados armazenados e transmitidos. |
| 6 | Manutenibilidade | Alterações em um módulo não devem produzir efeitos indevidos em outros módulos. | Alterações no módulo de agenda não devem provocar falhas indevidas no cadastro de pacientes. | Testes de regressão devem permanecer aprovados após alterações na agenda. | Testes de regressão e integração após mudança de código. |
| 7 | Compatibilidade | A operação depende de informação centralizada e da integração com lembretes. | O sistema deve compartilhar a mesma base de informações entre os canais e comunicar-se com o sistema de lembretes. | Uma alteração realizada por um canal deve estar disponível aos demais em tempo real. | Teste de integração e atualização entre recepção, call center e lembretes. |
| 8 | Flexibilidade | A clínica possui equipamentos e ferramentas existentes que não devem ser substituídos. | O sistema deve funcionar nos computadores e navegadores já utilizados pela clínica, sem troca de hardware. | O sistema deve operar nos ambientes homologados pela clínica. | Testes nos equipamentos e navegadores atualmente utilizados. |
| 9 | Proteção contra riscos (*safety*) | Um agendamento conflitante pode comprometer o fluxo de atendimento e gerar consequências operacionais. | O sistema deve bloquear a criação de duas consultas no mesmo horário para o mesmo médico. | Toda tentativa de conflito deve ser bloqueada. | Teste funcional com tentativas de agendamento simultâneo e conflito de horário. |

## 9. Análise de conflitos de qualidade

As características de qualidade estão relacionadas. Uma decisão de projeto pode beneficiar uma característica e produzir impactos em outra.

Analise as situações:

1. A criptografia dos dados dos pacientes pode produzir algum impacto no desempenho? Explique.
2. Como o login individual e os controles de acesso podem afetar a interação da recepção e do call center?
3. A necessidade de integração entre agendamento, base centralizada e lembretes pode aumentar a complexidade de manutenção?
4. Que impactos técnicos e financeiros podem surgir ao exigir salvamento automático e maior confiabilidade?
5. Como a equipe da Clínica Vida + Saúde deve decidir quais características terão maior prioridade, considerando os riscos para pacientes e para a operação?

## 10. Exercícios de revisão

### Questão 1

Um sistema apresenta todas as funções necessárias, mas leva 20 segundos para processar uma consulta. Qual característica está mais diretamente comprometida?

A. Compatibilidade  
B. Eficiência de desempenho  
C. Manutenibilidade  
D. Segurança

### Questão 2

A capacidade de trocar dados corretamente com outro sistema está relacionada principalmente a:

A. Compatibilidade  
B. Confiabilidade  
C. Proteção contra riscos  
D. Adequação funcional

### Questão 3

Qual alternativa representa um requisito mensurável?

A. O sistema deve ser intuitivo.  
B. O sistema deve ser bastante seguro.  
C. O sistema deve ser moderno.  
D. A consulta deve ser concluída em até dois segundos para 95% das requisições.

### Questão 4

A facilidade para alterar e testar um componente está relacionada a:

A. Flexibilidade  
B. Manutenibilidade  
C. Compatibilidade  
D. Capacidade de interação

### Questão 5

Impedir que um sistema hospitalar execute uma operação que coloque o paciente em risco está relacionado principalmente a:

A. Adequação funcional  
B. Eficiência de desempenho  
C. Proteção contra riscos (*safety*)  
D. Compatibilidade

### Questão 6 — Produção textual

Escolha uma característica da ISO/IEC 25010:2023 e produza:

1. um exemplo de requisito vago;
2. uma versão mensurável ou verificável desse requisito;
3. um critério de aceitação;
4. uma estratégia de teste.

## 11. Síntese para estudo

- Qualidade de software não significa apenas ausência de erros.
- A ISO/IEC 25010 oferece uma linguagem comum para discutir a qualidade de produtos.
- A edição de 2023 apresenta nove características de qualidade.
- As características relevantes devem ser selecionadas conforme o contexto, os usuários e os riscos do produto.
- Um requisito de qualidade deve apresentar condições e critérios que permitam sua verificação.

> **Para lembrar:** uma característica indica **o que observar**; uma medida define **como avaliar**; e um critério de aceitação determina **qual resultado será considerado satisfatório**.

## 14. Referências

- INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. **ISO/IEC 25010:2023 — Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model**. 2. ed. Genebra: ISO, 2023. Disponível em: <https://www.iso.org/standard/78176.html>.
- INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. **ISO/IEC 25002:2024 — Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Quality model overview and usage**. Genebra: ISO, 2024. Disponível em: <https://www.iso.org/standard/78175.html>.

---

**Material de apoio ao estudante — ISO/IEC 25010:2023**
