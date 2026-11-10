[Atividade_UML_parte2.md](https://github.com/user-attachments/files/32532898/Atividade_UML_parte2.md)
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

---

## Quadro de análise

| Elemento identificado | Evidência no artigo | Classificação |
|---|---|---|
| Jogador | É o herói que enfrenta os vilões e interage com todas as telas do jogo. | Ator |
| Selecionar uma fase | "O software deverá permitir ao usuário selecionar uma fase." | Requisito funcional |
| Responder charada | Combate consiste em responder charadas com 4 alternativas, uma correta. | Requisito funcional |
| Utilizar habilidade / Receber dica | Uso único por batalha, condicionado a 2 pontos de vida ou menos. | Regra de negócio |
| Se render | Sistema deve indicar derrota caso o usuário escolha se render. | Requisito funcional |
| Acessar modo de treino | Opção de treinar com o mestre, praticando sem ser penalizado por erros. | Requisito funcional / Acessibilidade |
| Estudar conceitos (book) | Opção para ler sobre os conteúdos relacionados aos casos de uso. | Requisito funcional |
| Progressão de dificuldade | Cada vilão possui 1 ponto de vida a mais que o anterior. | Regra de negócio |
| Narração configurável | Tela de opções permite ligar/desligar sons, músicas e narração. | Requisito de acessibilidade |
| Sem limite de tempo | Jogador não precisa agir de forma rápida em nenhuma interação. | Requisito de acessibilidade |

---

## Etapa 2 — Construção do Diagrama

O diagrama a seguir foi construído a partir dos requisitos funcionais e das regras de negócio identificadas na Etapa 1, contendo a fronteira do sistema (U.C. Battle), o ator Jogador, oito casos de uso, relações de inclusão e extensão, e uma nota UML com a regra de negócio da habilidade.

![Diagrama de Casos de Uso do jogo U.C. Battle]

*Figura A — Diagrama de Casos de Uso do jogo U.C. Battle (elaborado a partir dos requisitos do artigo)*

### Decisões de modelagem discutidas

**1. "Responder charada" faz parte obrigatória de "Enfrentar vilão"?**
Sim. Toda batalha consiste em uma sequência de charadas — não há como enfrentar um vilão sem responder charadas — por isso a relação é modelada como `<<include>>`, partindo de "Enfrentar vilão" em direção a "Responder charada". Pelo mesmo motivo, "Acessar modo de treinamento" também inclui "Responder charada", já que reaproveita a mesma mecânica, apenas sem penalidade por erro.

**2. "Receber dica" sempre acontece ou depende de uma condição?**
Depende de uma condição. "Utilizar habilidade" só pode ocorrer quando o jogador tem 2 pontos de vida ou menos e ainda não usou a habilidade naquela batalha; por isso ele é modelado como uma extensão (`<<extend>>`) de "Enfrentar vilão", e não como parte obrigatória do fluxo principal. Já "Receber dica" é a consequência direta de usar a habilidade, então é sempre executado quando "Utilizar habilidade" ocorre — por isso a relação entre os dois é `<<include>>`.

**3. "Estudar conceitos" é uma etapa da batalha ou uma funcionalidade independente?**
É uma funcionalidade independente. O jogador pode acessar o "book" a partir do menu principal a qualquer momento, sem relação com o estado da batalha; por isso o ator se associa diretamente a "Estudar conceitos", que por sua vez inclui "Selecionar tema de estudo" (etapa obrigatória para escolher o conteúdo a ser lido).

**4. O modo de treinamento deve reutilizar algum comportamento da batalha?**
Sim. O modo treino reaproveita o mecanismo de responder charadas usado nas batalhas contra vilões, mudando apenas a regra de penalidade (no treino o erro não custa pontos de vida). Essa reutilização foi representada com um `<<include>>` de "Acessar modo de treinamento" para "Responder charada".

**5. Quais requisitos de acessibilidade precisam aparecer no modelo?**
A regra de não penalização no modo treino e a condição de uso da habilidade (vida ≤ 2, uma vez por batalha) foram destacadas por meio de uma nota UML associada a "Utilizar habilidade", já que ambas influenciam diretamente o fluxo de interação e não seriam claras apenas pelo nome dos casos de uso.

---

## Etapa 3 — Matriz de rastreabilidade

| ID | Requisito do artigo | Caso de uso correspondente | No diagrama? |
|---|---|---|---|
| RF01 | O software deve permitir ao usuário selecionar uma fase. | Selecionar fase | Sim |
| RF02 | O software deve trocar de charada após o usuário escolher uma resposta. | Responder charada | Sim |
| RF03 | O software deve permitir usar a habilidade somente com 2 ou menos pontos de vida. | Utilizar habilidade | Sim |
| RF04 | O software deve garantir que o usuário não seja penalizado no modo treino. | Acessar modo de treinamento | Sim |
| RF05 | O software deve permitir ao usuário selecionar a opção de estudar conceitos. | Estudar conceitos | Sim |

---

## Checklist de validação

- [x] Os atores representam papéis externos ao sistema — apenas o Jogador, papel externo que interage com o jogo.
- [x] Os casos de uso foram escritos com verbo no infinitivo (Selecionar, Enfrentar, Responder, Utilizar, Receber, Acessar, Estudar).
- [x] A fronteira do sistema está identificada — retângulo "U.C. Battle".
- [x] Cada associação representa uma interação real do jogador com o menu ou com a batalha.
- [x] O `<<include>>` representa comportamento obrigatório e reutilizado (charadas usadas tanto na batalha quanto no treino).
- [x] O `<<extend>>` representa comportamento opcional e condicionado (habilidade só com vida ≤ 2).
- [x] As regras de negócio (limite de uso da habilidade, ausência de penalidade no treino) foram registradas em nota, não como atores.
- [x] Os cinco requisitos selecionados na matriz de rastreabilidade estão representados no diagrama.
- [x] A necessidade de acessibilidade do modo treino (sem penalidade) foi considerada na nota e na descrição do caso de uso.
- [x] O diagrama está legível, sem elementos desconectados.

---

## Justificativa das principais decisões de modelagem

Optamos por separar "Utilizar habilidade" de "Receber dica" para deixar explícita a regra de negócio (vida ≤ 2 e uso único) exatamente no ponto do fluxo em que ela se aplica, evitando que ficasse escondida dentro de um único caso de uso genérico. O `<<include>>` foi reservado para comportamentos sempre executados (responder charada, escolher tema de estudo, receber dica), enquanto o `<<extend>>` foi usado apenas para o comportamento condicional da habilidade, respeitando a semântica da UML. Por fim, reaproveitamos "Responder charada" tanto na batalha quanto no treino para evidenciar, no próprio diagrama, que a acessibilidade do jogo (treino sem penalidade) é uma variação de regra sobre um mesmo caso de uso, e não uma funcionalidade totalmente separada.


Linha 347
Linha 348
Linha 349
Linha 350
Linha 351
Linha 352
Linha 353
Linha 354
Linha 355
Linha 356
Linha 357
Linha 358
Linha 359
Linha 360
Linha 361
Linha 362
Linha 363
Linha 364
Linha 365
Linha 366
Linha 367
Linha 368
Linha 369
Linha 370
Linha 371
Linha 372
Linha 373
Linha 374
Linha 375
Linha 376
Linha 377
Linha 378
Linha 379
Linha 380
Linha 381
Linha 382
Linha 383
Linha 384
Linha 385
Linha 386
Linha 387
Linha 388
Linha 389
Linha 390
Linha 391
Linha 392
Linha 393
Linha 394
Linha 395
Linha 396
Linha 397
Linha 398
Linha 399
Linha 400
Linha 401
Linha 402
Linha 403
Linha 404
Linha 405
Linha 406
Linha 407
Linha 408
Linha 409
Linha 410
Linha 411
Linha 412
Linha 413
Linha 414
Linha 415
Linha 416
Linha 417
Linha 418
Linha 419
Linha 420
Linha 421
Linha 422
Linha 423
Linha 424
Linha 425
Linha 426
Linha 427
Linha 428
Linha 429
Linha 430
Linha 431
Linha 432
Linha 433
Linha 434
Linha 435
Linha 436
Linha 437
Linha 438
Linha 439
Linha 440
Linha 441
Linha 442
Linha 443
Linha 444
Linha 445
Linha 446
Linha 447
Linha 448
Linha 449
Linha 450
Linha 451
Linha 452
Linha 453
Linha 454
Linha 455
Linha 456
Linha 457
Linha 458
Linha 459
Linha 460
Linha 461
Linha 462
Linha 463
Linha 464
Linha 465
Linha 466
Linha 467
Linha 468
Linha 469
Linha 470
Linha 471
Linha 472
Linha 473
Linha 474
Linha 475
Linha 476
Linha 477
Linha 478
Linha 479
Linha 480
Linha 481
Linha 482
Linha 483
Linha 484
Linha 485
Linha 486
Linha 487
Linha 488
Linha 489
Linha 490
Linha 491
Linha 492
Linha 493
Linha 494
Linha 495
Linha 496
Linha 497
Linha 498
Linha 499
Linha 500
