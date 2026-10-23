# Estrat?gia E: "Corrente de Semanas Vivas", Elos de Vitalidade e Modo "Salva-H?bito"

**Status:** Planejado e Especificado  
**Arquivos Impactados:** `src/types/index.ts`, `src/lib/storage.ts`, `src/context/WorkoutContext.tsx`, `src/views/HomeView.tsx`, `src/views/CalendarView.tsx`, `src/views/ProgressView.tsx`, `tests/domain.test.ts`

---

## 1. Fundamento Comportamental e Objetivo

Aplicativos que usam "ofensivas di?rias" (*daily streaks*) geram ansiedade e abandono: basta o usu?rio precisar descansar na quarta-feira ou ter um dia ca?tico no trabalho para o contador voltar a zero e ele desistir.

No **Supera??o**, constru?mos const?ncia atrav?s de **3 mecanismos de sustentabilidade**:
1. **O Dia de Descanso como Oportunidade de Vitalidade (Sem Obriga??o)**: No dia sem treino de for?a, o usu?rio ? convidado a fazer 6?8 min de alongamento/mobilidade ou uma caminhada leve. Se fizer, ganha um **Elo de Vitalidade** na semana! Se preferir descanso total, continua 100% em paz e sem penalidade.
2. **O Bot?o "Salva-H?bito (5 min)" para Dias Dif?ceis**: Nos dias de treino agendado em que a pessoa est? sem tempo ou sem energia, ela pode acionar explicitamente a vers?o de 5 minutos para manter o h?bito vivo.
3. **Corrente de Semanas Vivas**: Medimos a continuidade por semanas ativas e pela combina??o de *Elos de For?a* + *Elos de Vitalidade*.

---

## 2. Modelagem e Regras de Invariantes (`src/types/index.ts` & `src/lib/storage.ts`)

### 2.1. Preserva??o Estrita do Invariante de Descanso (Regra R02 / E03 / T35)
* **Regra Inegoci?vel:** Um dia agendado como `activityType: 'rest'` ou `'unassigned'` **NUNCA** deve ter `isCompleted: true` como se fosse um treino de for?a obrigat?rio, nem inflar `weeklyCompletedCount` da meta de treinos principais.
* **Como representamos o Cuidado Ativo no Dia de Descanso sem violar o Invariante?**
  * Adicionamos em `CalendarDay` um campo opcional e separado:
    ```typescript
    export interface CalendarDay {
      // ... campos existentes
      vitalityBonusCompleted?: boolean; // Indica que houve caminhada ou mobilidade opcional neste dia!
      vitalityActivityLabel?: string;   // Ex: 'Mobilidade (8 min)' ou 'Caminhada (20 min)'
    }
    ```
  * Ou verificamos dinamicamente se existe uma `WorkoutSession` conclu?da naquela `dateStr` de categoria `'mobilidade'` / `'walk'` / `'active_recovery'`.
  * Dessa forma:
    * `day.isCompleted` permanece `false` nos dias `rest` (garantindo 100% de compatibilidade com os testes `C18`, `Crit?rio 24`, `R02` e `T35`!).
    * E `day.vitalityBonusCompleted` (ou a detec??o da sess?o de cuidado no dia) acende o **Elo de Vitalidade (`Sparkles` dourado/lima)** na tira semanal da `HomeView` e da `CalendarView`!

### 2.2. Expans?o em `CanonicalMetrics`:
* `weeklyVitalityLinksCount: number;` ? Quantos dias na semana atual tiveram pr?ticas de cuidado ativo (mobilidade opcional ou caminhada).
* `savedHabitSessionsCount: number;` ? Quantas vezes o usu?rio salvou o h?bito usando a rotina expressa planejada de 5 min (`isExpress && wasPlannedHabit && status === 'completed'`).

---

## 3. Especifica??o de Interface (UX por Tela)

### 3.1. Card de Dia de Descanso & Dia Livre na `HomeView.tsx`
Quando `todaySchedule?.activityType === 'rest' || todaySchedule?.activityType === 'unassigned'`:
* Exibir o card **"?? Dia de Recupera??o & Cuidado Ativo"**:
  * Se o usu?rio **j? realizou** uma caminhada ou mobilidade hoje (`vitalityDoneToday`):
    * Mostrar selo celebrativo: **`? Elo de Vitalidade Conquistado Hoje!`** (*"Voc? cuidou do seu corpo no dia de recupera??o e preparou o terreno para o pr?ximo treino."*).
  * Se **ainda n?o realizou**:
    * Mostrar os **2 caminhos de Cuidado Ativo** lado a lado:
      1. **?? Alongamento & Soltura (8 min)** (`onClick={() => onStartWorkout(recoveryPlan, undefined, 'ad_hoc', true, false)}`)
      2. **?? Registrar Caminhada Leve** (`onClick={() => setShowWalkModal(true)}`)
    * Abaixo dos bot?es, mensagem acolhedora:
      *"Opcional: realizar uma dessas pr?ticas acende um **Elo de Vitalidade** na sua semana sem alterar sua meta de descanso."*

### 3.2. Tira dos 7 Dias da Semana (`HomeView.tsx`)
Na tira horizontal de 7 dias (`Sua semana`):
* **Dia de Treino Conclu?do (`isDone`)**: ?cone `CheckCircle2` verde-esmeralda (`#246747`).
* **Dia de Descanso/Livre com B?nus de Vitalidade (`hasVitalityBonus`)**: ?cone `Sparkles` com fundo verde-lima (`#D9F277`) e t?tulo `"Elo de Vitalidade conquistado no descanso!"`.
* **Dia de Descanso Normal (`isRest`)**: ?cone `Heart` sereno (`#5B7170`).

### 3.3. Bot?o "Salva-H?bito (5 min)" nos Dias de Treino (`HomeView.tsx`)
No card de "Treino Planejado para Hoje":
* Abaixo do bot?o principal *"Iniciar Treino de Hoje"*, remodelar a ?rea do Modo Express para um card emp?tico:
  > **? Dia corrido ou pouca energia hoje?**  
  > *N?o quebre seu ritmo: fa?a a vers?o **Salva-H?bito (5 min)** com movimentos leves essenciais.*  
  > **[Ativar Modo Salva-H?bito (5 min)]**

---

## 4. Casos de Teste Automatizados (`tests/domain.test.ts`)

* **`M-E01`**: Concluir sess?o de mobilidade ou caminhada em dia `rest` mant?m `day.isCompleted === false` (preservando invariante `C18`/`T35`), mas incrementa `weeklyVitalityLinksCount: 1`.
* **`M-E02`**: Concluir integralmente a rotina `Salva-H?bito (5 min)` incrementa `savedHabitSessionsCount: 1` e desbloqueia a medalha `Const?ncia Flex?vel`.
* **`M-E03`**: Abortar treino normal de 30 min aos 2 minutos registra `status: 'parcial'` e N?O incrementa `savedHabitSessionsCount`.
