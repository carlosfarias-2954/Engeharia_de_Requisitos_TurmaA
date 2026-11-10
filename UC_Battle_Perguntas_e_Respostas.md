# U.C. Battle — Perguntas e Respostas

## 1 – Qual é o objetivo principal do U.C. Battle?

O **U.C. Battle** é um jogo educacional acessível, desenvolvido para apoiar o processo de ensino e aprendizagem de **UML**.

O jogador assume o papel de um herói que precisa derrotar cinco vilões de dificuldade crescente, vencendo batalhas ao responder corretamente perguntas sobre o conteúdo de **casos de uso**.

Além do combate, o jogo oferece um **modo de treino** e uma seção de estudo chamada **Book**, na qual o jogador pode reforçar o aprendizado.

---

## 2 – Quem interage diretamente com o sistema?

Apenas um ator interage diretamente com o sistema: o **Jogador**.

É o próprio **diagrama de casos de uso do artigo (Figura 2)** que confirma isso, mostrando um único ator ligado a todos os casos de uso do jogo.

---

## 3 – Quais funcionalidades são oferecidas ao jogador?

O jogador pode:

- **Selecionar um vilão** para enfrentar, entre os que já foram desbloqueados;
- **Enfrentar um vilão**, respondendo charadas sobre casos de uso em um combate por pontos de vida;
- **Utilizar uma habilidade especial** uma vez por batalha para receber uma dica sobre a charada;
- **Se render durante uma batalha**, o que é registrado como derrota;
- **Acessar o modo de treino com o mestre**, para praticar sem penalidade por erro;
- **Estudar conceitos por meio do "Book"**, escolhendo um tema para leitura;
- **Configurar opções de acessibilidade**, como ligar/desligar sons, músicas e narrações;
- **Retornar às telas anteriores e ao menu principal**.

---

## 4 – Quais regras condicionam o uso da habilidade de receber uma dica?

Segundo o artigo, a habilidade só pode ser usada **uma única vez por batalha** e apenas quando o jogador estiver com **2 pontos de vida ou menos**.

Essas duas condições — **limite de uma utilização** e **gatilho de vida baixa** — formam uma regra de negócio que restringe quando o caso de uso **"Utilizar habilidade"** pode ser executado.

---

## 5 – Quais funcionalidades contribuem para a acessibilidade do jogo?

As funcionalidades que contribuem para a acessibilidade incluem:

- **Ausência de limite de tempo** para responder às charadas;
- **Opção de ativar/desativar a narração** de perguntas, alternativas, dicas e do Book;
- **Controle independente** de efeitos sonoros e músicas;
- **Modo de treino sem penalidade**, permitindo prática livre de erros;
- **Progressão gradual de dificuldade** entre os vilões;
- **Uso de cores combinado com texto**, evitando depender somente da cor para transmitir informações.
