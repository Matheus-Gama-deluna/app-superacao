# Estrat?gia C: O "Micro-Desafio do Dia" (Gatilho de Curiosidade e Foco)

**Status:** Planejado e Especificado  
**Arquivos Impactados:** `src/types/index.ts`, `src/lib/storage.ts`, `src/views/HomeView.tsx`, `src/views/ActiveWorkoutView.tsx`, `tests/domain.test.ts`

---

## 1. Fundamento Comportamental e Objetivo

Quando o praticante olha para uma ficha com 4 ou 5 exerc?cios que se repete toda semana, a percep??o de novidade cai e o treino pode parecer mon?tono ("mais um dia fazendo exatamente a mesma coisa").

Profissionais de Educa??o F?sica evitam esse t?dio escolhendo **apenas 1 exerc?cio-foco por sess?o** para ser o **"Micro-Desafio do Dia"**:
* N?o ? aumentar a carga de todos os exerc?cios de uma vez (o que geraria les?o ou exaust?o).
* ? propor um **micro-passo totalmente seguro e tang?vel** em 1 ?nico exerc?cio daquela rotina (ex: *"Sua marca base no Agachamento ? 10 reps ? hoje sua miss?o especial ? buscar 11 reps na ?ltima s?rie"*).

---

## 2. Modelagem de Dados (`src/types/index.ts`)

```typescript
export type MicroChallengeType =
  | 'first_pr_from_base' // Exerc?cio tem Marca Base (isBaseline: true) -> tentar o 1? PR real!
  | 'beat_pr_reps'       // Exerc?cio j? tem PR em repeti??es -> tentar +1 repeti??o
  | 'beat_pr_time'       // Exerc?cio por tempo -> tentar +5 segundos
  | 'establish_base'     // Nenhum exerc?cio tem marca ainda -> estabelecer a 1? Marca Base
  | 'mindful_mobility';  // Treino de mobilidade/alongamento -> foco em respira??o e amplitude

export interface DailyMicroChallenge {
  type: MicroChallengeType;
  exerciseId: string;
  exerciseName: string;
  badgeText: string;
  title: string;
  description: string;
  currentMark?: number;
  targetMark?: number;
  unit?: 'reps' | 'seconds';
}
```

---

## 3. Algoritmo Determin?stico (`generateDailyMicroChallenge` em `src/lib/storage.ts`)

Recebe `(plan: WorkoutPlan, personalRecords: PersonalRecord[])` e retorna `DailyMicroChallenge | null`:

1. **Valida??o Inicial**: Se `!plan || !plan.exercises || plan.exercises.length === 0`, retorna `null`.
2. **Caso 1 ? Ficha de Mobilidade / Alongamento (`plan.category === 'mobilidade'` ou t?tulo/modalidade de alongamento)**:
   * Seleciona o 1? exerc?cio da ficha (`ex = plan.exercises[0]`).
   * Retorna:
     * `type`: `'mindful_mobility'`
     * `badgeText`: `'Foco de Cuidado & Presen?a'`
     * `title`: `Soltura Consciente em ${ex.exerciseName}`
     * `description`: `'Concentre-se em soltar o ar lentamente a cada movimento, ganhando amplitude sem for?ar dor.'`
3. **Caso 2 ? Exerc?cio com Marca Base Pronta para Virar o 1? PR Real (`pr.isBaseline === true`)**:
   * **Prioridade M?xima Motivacional:** Se o usu?rio j? fez o treino 1 vez e tem uma `Marca Base` registrada em algum exerc?cio da ficha, essa ? a oportunidade perfeita para ele conquistar seu **primeiro Recorde Pessoal (`PR #1`)**!
   * Se `ex.targetReps > 0` (repeti??es):
     * `currentMark = pr.bestReps`
     * `targetMark = pr.bestReps + 1`
     * `type = 'first_pr_from_base'`
     * `badgeText = 'Oportunidade do 1? Recorde (PR)'`
     * `title = Superar sua Marca Base em ${ex.exerciseName}`
     * `description = Sua marca inicial ? ${pr.bestReps} reps. Tente alcan?ar ${pr.bestReps + 1} repeti??es em pelo menos uma s?rie hoje para conquistar seu 1? PR!`
   * Se `ex.targetDurationSeconds > 0` (tempo):
     * `currentMark = pr.bestDurationSeconds`
     * `targetMark = pr.bestDurationSeconds + 5`
     * `type = 'beat_pr_time'`
     * `description = Sua marca inicial ? ${pr.bestDurationSeconds}s. Tente sustentar ${pr.bestDurationSeconds + 5} segundos com estabilidade hoje!`
4. **Caso 3 ? Exerc?cio que J? Possui PR (`!pr.isBaseline`)**:
   * Seleciona o exerc?cio com o registro mais antigo (`recordedAt` menor) para alternar o foco entre os dias de treino.
   * Prop?e `+1 repeti??o` (`beat_pr_reps`) ou `+5 segundos` (`beat_pr_time`) sobre a marca atual.
5. **Caso 4 ? Ficha 100% In?dita (Nenhum exerc?cio tem `PersonalRecord` ainda)**:
   * Seleciona o 1? exerc?cio (`plan.exercises[0]`).
   * `type = 'establish_base'`
   * `badgeText = 'Miss?o de Estreia'`
   * `title = Registrar sua 1? Marca Base em ${ex.exerciseName}`
   * `description = 'Hoje o objetivo n?o ? pressa: execute com controle e registre suas repeti??es reais para inaugurar seu hist?rico!'`

---

## 4. Especifica??o de Interface (UX por Tela)

### 4.1. Card de Treino de Hoje na `HomeView.tsx`
* Logo abaixo da lista de exerc?cios do `todayPlan` e antes do bot?o *"Iniciar Treino de Hoje"*, exibir o box de destaque:
  * Fundo suave `#EAF3EF` com borda esquerda ou ?cone `Target` em destaque (`#125F55`).
  * Exibe `challenge.badgeText`, `challenge.title` e `challenge.description`.

### 4.2. Durante a Execu??o no `ActiveWorkoutView.tsx`
* Quando o exerc?cio atual (`currentExerciseItem.exerciseId`) for igual a `dailyChallenge.exerciseId`:
  * Exibir no topo do card do exerc?cio uma p?lula dourada/lima (`#D9F277`):
    **`?? Exerc?cio do Desafio de Hoje: Meta de Supera??o = {targetMark} {unit === 'reps' ? 'reps' : 'seg'}`**
  * No modal de confirma??o da s?rie (`handleOpenConfirm`), mostrar lembrete sutil abaixo do contador: *"Dica do Desafio: {targetMark} {unit} supera sua marca atual!"*

---

## 5. Casos de Teste Automatizados (`tests/domain.test.ts`)

* **`M-C01`**: Plano in?dito sem `personalRecords` retorna desafio `'establish_base'` para o 1? exerc?cio.
* **`M-C02`**: Plano com exerc?cio em `isBaseline: true` (10 reps) retorna desafio `'first_pr_from_base'` com `targetMark: 11`.
* **`M-C03`**: Plano com m?ltiplos exerc?cios j? com PR seleciona aquele com `recordedAt` mais antigo, garantindo rota??o natural de desafios ao longo da semana.
* **`M-C04`**: Plano da categoria `'mobilidade'` retorna desafio `'mindful_mobility'` sem exigir aumento num?rico de repeti??es.
