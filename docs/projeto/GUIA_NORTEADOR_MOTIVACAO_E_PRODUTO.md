# Guia Norteador: Motiva??o, Retorno Di?rio e Const?ncia Sustent?vel

**Data de Cria??o:** 23/10/2026  
**Prop?sito deste Documento:** Servir como b?ssola de produto e engenharia para todas as pr?ximas evolu??es do **Supera??o**, garantindo que o sistema cumpra seu objetivo central: **fazer a pessoa encontrar sentido em voltar amanh?** ? seja para seu treino principal, seja para um alongamento ou caminhada no dia de descanso.

---

## 1. O Que Estamos Fazendo e O Que Queremos Alcan?ar

### A Dor Central que Resolvemos
A maior dificuldade de quem come?a ou retoma exerc?cios f?sicos n?o ? fazer o primeiro treino, mas **continuar voltando nos dias e semanas seguintes**. As pessoas abandonam aplicativos tradicionais porque:
1. **Mentalidade "Tudo ou Nada"**: Se o dia n?o tem treino pesado, o usu?rio se desconecta do aplicativo; o dia de descanso vira um vazio, que vira abandono.
2. **Recompensa ?nica e Excludente**: Quando o ?nico incentivo ? "aumentar peso ou bater recorde de repeti??es", qualquer dia de cansa?o, manuten??o ou mobilidade parece "sem valor".
3. **Falta de Conex?o com o Amanh?**: O treino termina de forma seca, sem plantar uma raz?o clara, curiosa e acolhedora para abrir o app no dia seguinte.

### O Que Queremos no Supera??o
Queremos um **Sistema de Motiva??o Intr?nseca e Continuidade Di?ria** que:
* Fa?a a pessoa sentir **orgulho real** ao encerrar qualquer pr?tica hoje (for?a, mobilidade de 8 min, caminhada ou vers?o Salva-H?bito de 5 min).
* D? a ela um **motivo concreto e personalizado** para voltar amanh? (um micro-desafio tang?vel no pr?ximo treino ou um ritual leve de regenera??o no dia de descanso).
* Utilize o **pr?prio hist?rico de bem-estar e evolu??o da pessoa** como prova de que movimentar o corpo vale a pena, sem recorrer a cobran?as punitivas ou falsos recordes.

---

## 2. O Ciclo de Engajamento Di?rio do Supera??o (Loop de 4 Tempos)

Toda intera??o no aplicativo deve alimentar este fluxo cont?nuo:

```
[1. CONVITE COM SENTIDO (HomeView)]
   ??? Espelho de Bem-Estar (lembra como ela se sentiu melhor nas ?ltimas pr?ticas)
   ??? Se Dia de Treino: Mostra o Micro-Desafio do Dia + op??o Salva-H?bito (5 min)
   ??? Se Dia de Descanso: Convida para Alongamento (8 min) ou Caminhada Leve (Elo de Vitalidade)
          ?
          ?
[2. ENTRADA E EXECU??O GUIADA (ActiveWorkoutView / Caminhada)]
   ??? Check-in de 1 toque (Opcional): "Como voc? chegou hoje?" (Cansado, Tenso, Normal, Disposto)
   ??? Destaque no Exerc?cio do Micro-Desafio durante a execu??o
   ??? Pausa funcional segura (permite pausar, voltar ao In?cio e retomar sem perder nada)
          ?
          ?
[3. RECONHECIMENTO MULTIDIMENSIONAL (Conclus?o da Sess?o)]
   ??? Check-in de 1 toque: "Como est? saindo agora?" + Percep??o de Esfor?o (RPE 1?5)
   ??? Entrega das Moedas de Supera??o Reais da Sess?o:
       ? Marca Base (1? refer?ncia) | ? PR Real (superou marca)
       ? Supera??o de Fluidez (mesmo treino com menor esfor?o RPE)
       ? Elo de Vitalidade & Minutos de Cuidado (mobilidade/caminhada)
          ?
          ?
[4. PONTE PARA AMANH? (Gancho de Continuidade)]
   ??? Se amanh? ? Descanso: Sugere 6?8 min de alongamento/caminhada para regenerar os m?sculos usados hoje
   ??? Se amanh? ? Treino: Antecipa o treino de amanh? e revela qual ser? o pr?ximo Micro-Desafio
```

---

## 3. Regras de Ouro Inegoci?veis (Invariantes ?ticos e T?cnicos)

Para que a motiva??o seja aut?ntica e nunca caia em "gamifica??o artificial", nenhuma implementa??o pode violar estas regras:

1. **Primeira Marca ? `BASE`, Nunca `PR`**: A 1? execu??o de um exerc?cio ? celebrada como *Marca Base Desbloqueada* (o ponto de partida oficial), jamais como quebra de recorde sobre hist?rico inexistente.
2. **Sess?o Parcial != Treino Express (Salva-H?bito)**: Parar um treino normal de 20 min no 1? minuto registra honestamente uma sess?o `parcial`. O selo de *Salva-H?bito* s? ? concedido quando a pessoa escolhe e conclui a rotina curta planejada.
3. **Descanso ? Sagrado e N?o Punitivo**: Fazer alongamento ou caminhada no dia de descanso acende um **Elo de Vitalidade (B?nus de Cuidado)**, mas **nunca** pune quem escolheu descanso total nem altera falsamente a meta de treinos de for?a.
4. **Zero Fric??o Obrigat?ria**: Check-ins de humor/energia ("Antes vs. Depois") devem funcionar com **1 ?nico toque opcional**, sem travar o in?cio ou o salvamento do treino.
5. **Consist?ncia Absoluta entre Telas**: In?cio (`HomeView`), Agenda (`CalendarView`), Executor (`ActiveWorkoutView`) e Evolu??o (`ProgressView`) devem ler as mesmas m?tricas can?nicas e usar os mesmos termos (`Marca Base` vs `Recorde Pessoal`).

---

## 4. Alinhamento com os Ajustes Finais de Funda??o (v8)

Junto com a implementa??o das 5 Estrat?gias de Motiva??o, garantiremos o fechamento dos 5 itens de estabilidade mapeados na auditoria da v8:
* **V8-03 (Pausa Funcional)**: Respeitar `isFocusMode` no `src/App.tsx` (`if (activeSession && isFocusMode)`) para que o bot?o de pausa no treino retorne imediatamente ? `HomeView` mantendo o card de retomada ativo.
* **V8-04 (Sem?ntica `BASE` vs `PR` na Home)**: Na `HomeView.tsx`, distinguir visualmente *Marca Base* de *Recorde Pessoal*, alinhando com a `ProgressView.tsx`.
* **V8-07 (Escuta Inicial Consciente)**: Evitar que dias e objetivos venham pr?-impostos sem escolha ativa em novos perfis.
* **V8-08 (Resumo Completo e Edi??o Completa no Perfil)**: Exibir cuidados e obst?culos no resumo da etapa 7 (indicando explicitamente *"N?o informado"* quando vazio) e permitir editar objetivos, dias, dura??o e cuidados dentro do `ProfileView.tsx`.
* **V8-09 (Unifica??o de Vers?o)**: Utilizar a constante `APP_VERSION` em `WelcomeView.tsx` e `package.json`.

---

## 5. ?ndice dos Planos Detalhados das 5 Estrat?gias

Cada uma das 5 estrat?gias possui um plano arquitetural e funcional profundo em sua pr?pria especifica??o:

1. **[Estrat?gia A ? M?ltiplas Moedas de Supera??o](estrategias/ESTRATEGIA_A_MOEDAS_DE_SUPERACAO.md)**
2. **[Estrat?gia B ? O Gancho para Amanh? (Ponte de Continuidade)](estrategias/ESTRATEGIA_B_PONTE_PARA_AMANHA.md)**
3. **[Estrat?gia C ? O Micro-Desafio do Dia (Gatilho de Curiosidade e Foco)](estrategias/ESTRATEGIA_C_MICRO_DESAFIO_DO_DIA.md)**
4. **[Estrat?gia D ? Term?metro Antes vs. Depois (Mem?ria de Bem-Estar)](estrategias/ESTRATEGIA_D_TERMOMETRO_ANTES_DEPOIS.md)**
5. **[Estrat?gia E ? Corrente de Semanas Vivas, Elos de Vitalidade e Salva-H?bito](estrategias/ESTRATEGIA_E_SEMANAS_VIVAS_E_SALVA_HABITO.md)**
