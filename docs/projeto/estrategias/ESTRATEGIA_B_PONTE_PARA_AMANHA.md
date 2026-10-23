# Estrat?gia B: O "Gancho para Amanh?" no Fim da Sess?o (Ponte de Continuidade)

**Status:** Planejado e Especificado  
**Arquivos Impactados:** `src/types/index.ts`, `src/lib/storage.ts`, `src/views/ActiveWorkoutView.tsx`, `src/views/HomeView.tsx`, `tests/domain.test.ts`

---

## 1. Fundamento Comportamental e Objetivo

Na psicologia do h?bito, o momento de maior motiva??o de um praticante ? **imediatamente ap?s concluir uma sess?o** (pico de endorfina e autoefic?cia). No entanto, no c?digo atual (`ActiveWorkoutView.tsx`, linha 271), o bloco `"Ponte para amanh?"` exibe um texto est?tico gen?rico que n?o sabe o que realmente est? agendado para o dia seguinte.

**Objetivo da Estrat?gia B:** Transformar o encerramento da sess?o de hoje (e o estado p?s-treino na `HomeView`) em uma **Ponte Contextual Inteligente para Amanh?**, conectando o esfor?o feito hoje com o que o corpo precisar? amanh? (seja regenera??o ativa no descanso, seja um micro-desafio no pr?ximo treino).

---

## 2. Modelagem de Dados (`src/types/index.ts`)

```typescript
export interface TomorrowBridgeInfo {
  tomorrowDayOfWeek: number;
  tomorrowDayLabel: string;
  tomorrowDateStr?: string;
  tomorrowActivityType: ActivityType;
  tomorrowPlanId?: string;
  tomorrowPlanTitle?: string;
  headline: string;
  bodyText: string;
  nextChallengePreview?: {
    exerciseName: string;
    currentMarkText: string;
    targetMarkText: string;
  };
  canScheduleOptionalMobility: boolean;
}
```

---

## 3. Algoritmo da Ponte (`generateTomorrowBridge` em `src/lib/storage.ts`)

A fun??o pura `generateTomorrowBridge(currentSession, calendar, plans, personalRecords, referenceDate = new Date())` analisa o dia civil seguinte (`tomorrowDayOfWeek = (referenceDate.getDay() + 1) % 7`):

### Cen?rio B1: Hoje foi Treino de For?a e Amanh? ? Descanso (`rest` ou `unassigned`)
* **Diagn?stico:** O usu?rio acabou de gerar est?mulo muscular e amanh? n?o tem treino pesado. O maior risco ? que amanh? ele nem abra o app.
* **Mensagem Gerada:**
  * `headline`: `"Amanh? ({tomorrowDayLabel}): Dia de Regenera??o & Cuidado Leve"`
  * `bodyText`: `"Hoje voc? estimulou seus m?sculos em '{currentSession.planTitle}'. Amanh? ? dia de descanso muscular, mas voc? pode fazer 6 a 8 minutos de alongamento leve ou uma caminhada tranquila para soltar as articula??es e manter seu ritmo di?rio aceso!"`
  * `canScheduleOptionalMobility`: `true` (exibe bot?o opcional de 1 clique: *"? Deixar Mobilidade Leve (8 min) preparada para amanh?"*).

### Cen?rio B2: Hoje foi Descanso Ativo / Mobilidade / Caminhada e Amanh? ? Treino (`strength`)
* **Diagn?stico:** O usu?rio cuidou do corpo hoje e amanh? tem treino principal. ? hora de criar **antecipa??o positiva e curiosidade** para o treino de amanh?.
* **Mensagem Gerada:**
  * Localiza `tomorrowPlan` na lista de `plans`.
  * Chama `generateDailyMicroChallenge(tomorrowPlan, personalRecords)` (Estrat?gia C) para saber qual ser? a miss?o de amanh?.
  * `headline`: `"Amanh? ({tomorrowDayLabel}): {tomorrowPlan.title}"`
  * `bodyText`: `"Corpo solto e preparado! Amanh? voltamos ? a??o com '{tomorrowPlan.title}'. Seu destaque j? est? pronto: {challenge.description}"`

### Cen?rio B3: Hoje foi Treino de For?a e Amanh? tamb?m h? Treino Agendado (`strength`)
* **Diagn?stico:** Dias consecutivos de treino.
* **Mensagem Gerada:**
  * `headline`: `"Amanh? ({tomorrowDayLabel}): Continuidade com {tomorrowPlan.title}"`
  * `bodyText`: `"Hidrate-se bem e descanse hoje ? noite. Amanh? damos sequ?ncia com '{tomorrowPlan.title}' ({tomorrowPlan.estimatedDurationMinutes} min)."`

### Cen?rio B4: Amanh? j? est? agendado como Recupera??o Ativa (`active_recovery`) ou Caminhada (`walk`)
* **Mensagem Gerada:**
  * `headline`: `"Amanh? ({tomorrowDayLabel}): {tomorrowSchedule.planTitle}"`
  * `bodyText`: `"Tudo alinhado na sua agenda! Amanh? temos um encontro leve de cuidado ativo para manter sua semana viva sem sobrecarregar o corpo."`

---

## 4. Especifica??o de Interface (UX por Tela)

### 4.1. Tela de Conclus?o (`ActiveWorkoutView.tsx`)
* Substituir o bloco est?tico da linha 271 pelo componente din?mico alimentado por `generateTomorrowBridge`.
* Se `canScheduleOptionalMobility === true`:
  * Exibir bot?o r?pido dentro do card da Ponte:
    * Estado inicial: **`+ Deixar Alongamento de 8 min preparado para amanh? (Opcional)`**
    * Ap?s clicar: **`? Alongamento leve preparado para amanh?!`** (atualiza o `tomorrowDay` ou sinaliza lembrete gentil sem destruir o status de descanso).

### 4.2. Card P?s-Treino na `HomeView.tsx`
* Quando o usu?rio j? concluiu a atividade planejada de hoje (`todaySchedule?.isCompleted === true` ou sess?o de hoje conclu?da):
  * No Card Contextual de Hoje, al?m de parabenizar pela miss?o de hoje cumprida, exibir uma sub-se??o **"?? O que espera por voc? amanh? ({bridge.tomorrowDayLabel})"**, mantendo o gancho vivo caso a pessoa reabra o app mais tarde no mesmo dia!

---

## 5. Casos de Teste Automatizados (`tests/domain.test.ts`)

* **`M-B01`**: Concluir treino de for?a na Ter?a (com Quarta sendo `rest`) gera ponte sugerindo regenera??o ativa para Quarta com `canScheduleOptionalMobility: true`.
* **`M-B02`**: Concluir sess?o na Quarta (com Quinta tendo Treino de For?a agendado) gera ponte citando exatamente o t?tulo do treino de Quinta e o preview do Micro-Desafio.
* **`M-B03`**: Transi??o de S?bado (`dayOfWeek = 6`) para Domingo (`dayOfWeek = 0`) calcula corretamente o ?ndice circular `(6 + 1) % 7 === 0`.
