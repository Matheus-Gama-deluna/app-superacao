# Estrat?gia A: M?ltiplas "Moedas de Supera??o" (Al?m do PR Tradicional)

**Status:** Planejado e Especificado  
**Arquivos Impactados:** `src/types/index.ts`, `src/lib/storage.ts`, `src/context/WorkoutContext.tsx`, `src/views/ActiveWorkoutView.tsx`, `src/views/HomeView.tsx`, `src/views/ProgressView.tsx`, `tests/domain.test.ts`

---

## 1. Fundamento Comportamental e Objetivo

Se o ?nico indicador de sucesso de uma sess?o for o **Recorde Pessoal Bruto (PR de carga ou repeti??es)**, o praticante enfrenta dois problemas graves:
1. Em sess?es de **Mobilidade, Alongamento ou Caminhada**, o contador `Recordes (PRs): 0` passa a mensagem subconsciente de que a pr?tica "n?o rendeu nada".
2. Na **primeira execu??o** de um exerc?cio ou em semanas de consolida??o (em que a pessoa mant?m as mesmas 10 repeti??es, mas com melhor controle e menor desgaste f?sico), ela n?o recebe reconhecimento pelo avan?o fisiol?gico real.

**Objetivo da Estrat?gia A:** Reconhecer **4 Moedas Distintas e Honestas de Supera??o**, garantindo que toda pr?tica conclu?da tenha seu valor real celebrado, sem inflar m?tricas nem inventar falsos recordes.

---

## 2. As 4 Moedas de Supera??o do Sistema

| Moeda | C?digo (`AchievementCoin`) | Regra Estrita de Concess?o | O Que Celebra |
|---|---|---|---|
| **1. Marca Base Desbloqueada** | `'base_unlocked'` | Primeira execu??o v?lida (`actualReps > 0` ou `actualDurationSeconds > 0`) de um exerc?cio in?dito no hist?rico. Define `isBaseline: true`, `isPR: false`. | Ter vencido a in?rcia e estabelecido a refer?ncia oficial para os pr?ximos treinos. |
| **2. Recorde Pessoal (PR Real)** | `'performance_pr'` | Supera??o estrita de repeti??es, tempo ou carga sobre uma marca anterior j? existente (`!isBaseline` ou superando a `BASE` anterior). | Evolu??o objetiva de for?a, resist?ncia ou capacidade f?sica. |
| **3. Supera??o de Fluidez (RPE)** | `'efficiency_gain'` | Sess?o conclu?da (`status === 'completed'`) da mesma ficha (`planId`) onde o volume planejado foi cumprido e o esfor?o percebido (`feedbackEffort`, 1 a 5) foi **menor** que o da sess?o anterior conclu?da daquela ficha. | Adapta??o neuromuscular: fazer o mesmo treino sentindo menos desgaste! |
| **4. Elo de Cuidado & Vitalidade** | `'care_vitality'` | Conclus?o de sess?o de Mobilidade/Alongamento (`category === 'mobilidade'`), Recupera??o Ativa ou Caminhada (`walk`). | Regenera??o articular, al?vio de tens?es e manuten??o da identidade ativa nos dias sem for?a. |

---

## 3. Modelagem de Dados (`src/types/index.ts`)

```typescript
export type AchievementCoinType =
  | 'base_unlocked'
  | 'performance_pr'
  | 'efficiency_gain'
  | 'care_vitality'
  | 'habit_saved';

export interface SessionEfficiencyComparison {
  previousSessionId: string;
  previousEffort: number; // 1 a 5
  currentEffort: number;  // 1 a 5
  improved: boolean;
}
```

### Expans?o em `WorkoutSession`:
* `newBaselinesCount?: number;` ? Quantidade de exerc?cios que tiveram sua 1? Marca Base registrada nesta sess?o.
* `achievementCoins?: AchievementCoinType[];` ? Lista de moedas conquistadas na sess?o.
* `efficiencyComparison?: SessionEfficiencyComparison;` ? Comparativo de RPE com a ?ltima sess?o equivalente.

### Expans?o em `CanonicalMetrics`:
* `baselineMarksCount: number;` ? Total de exerc?cios com marca base ativa.
* `careMinutesTotal: number;` ? Total de minutos dedicados a mobilidade, alongamento e caminhada.
* `careSessionsCount: number;` ? Total de sess?es regenerativas/caminhadas conclu?das.
* `efficiencyGainsCount: number;` ? Total de vezes em que o praticante reduziu o RPE para o mesmo treino.

---

## 4. Regras de Neg?cio e Algoritmos (`src/lib/storage.ts`)

### 4.1. Retorno Expl?cito de `isNewBaseline` em `checkAndRegisterPR`
Atualizar a assinatura de retorno de `checkAndRegisterPR`:
```typescript
export function checkAndRegisterPR(
  exerciseId: string,
  exerciseName: string,
  actualReps: number,
  actualDurationSeconds: number | undefined,
  sessionId: string,
  existingPRs: PersonalRecord[],
  actualWeightKg?: number
): {
  isPR: boolean;
  isNewBaseline: boolean;
  updatedPRs: PersonalRecord[];
  prText?: string;
}
```
* Quando `!currentPR` e a s?rie ? v?lida: retorna `isPR: false`, `isNewBaseline: true`, `prText: 'Marca Base inicial registrada! Na pr?xima sess?o, ela ser? sua refer?ncia.'`.
* Em `WorkoutContext.tsx` (`recordSet`), se `isNewBaseline === true`, incrementa `activeSession.newBaselinesCount`.

### 4.2. C?lculo de Supera??o de Fluidez (`evaluateEfficiencyGain`)
Executado no fechamento da sess?o (`finishWorkout` em `WorkoutContext.tsx`):
1. Verifica se a sess?o atual est? completa (`totalSetsCompleted >= totalSetsPlanned` e `status === 'completed'`). **Invariante:** Sess?es parciais nunca ganham `efficiency_gain` (pois fazer metade do treino obviamente cansa menos!).
2. Busca no hist?rico de `sessions` a sess?o imediatamente anterior com o mesmo `planId` e `status === 'completed'` que possua `feedbackEffort` registrado.
3. Se `currentEffort < previousSession.feedbackEffort` e `totalRepsCompleted >= previousSession.totalRepsCompleted`:
   * Registra `efficiencyComparison = { previousSessionId, previousEffort, currentEffort, improved: true }`.
   * Adiciona `'efficiency_gain'` em `achievementCoins`.

### 4.3. Contabiliza??o de Minutos de Cuidado em `calculateCanonicalMetrics`
* Filtra todas as sess?es conclu?das onde `planId.includes('mobilidade')`, `planId.includes('walk')`, `originType === 'active_recovery'` ou associadas a planos de categoria `'mobilidade'` / `'caminhada'`.
* Soma `Math.max(1, Math.round(s.durationSeconds / 60))` em `careMinutesTotal`.

---

## 5. Especifica??o de Interface (UX por Tela)

### 5.1. `ActiveWorkoutView.tsx` (Durante e Ap?s o Treino)
* **Durante a S?rie**:
  * Se `!previousPR`: Exibir badge acolhedor `"?? 1? Execu??o: Vamos registrar sua Marca Base"`.
  * Se `previousPR.isBaseline`: Exibir `"Sua Marca Base: X reps ? Pronta para o 1? PR!"`.
* **Na Tela de Conclus?o da Sess?o**:
  * Se a sess?o for de **Mobilidade / Alongamento**, substituir o card `Recordes (PRs): 0` por **`Cuidado Ativo: +X min`** (?cone `Sparkles` verde-esmeralda).
  * Se a sess?o registrou novas Marcas Base (`newBaselinesCount > 0`) e `prsAchieved === 0`, exibir no 3? card: **`Marcas Base: +X`** em vez de `Recordes (PRs): 0`.
  * Quando o usu?rio seleciona o RPE (`Como voc? sentiu o treino de hoje?`) e o valor selecionado ? menor que o `feedbackEffort` da ?ltima sess?o completa daquela mesma ficha, exibir imediatamente um banner celebrativo:
    > **? Supera??o de Fluidez Detectada!**  
    > *Na ?ltima vez, este treino pareceu **Intenso (4/5)**. Hoje voc? entregou o mesmo resultado sentindo-o **Suave (2/5)**. Seu condicionamento evoluindo na pr?tica!*

### 5.2. `HomeView.tsx` (Corre??o definitiva do item `V8-04`)
* Na se??o **"Suas Supera??es & Marcas"**:
  * Verificar `const isRealPR = !pr.isBaseline && (pr.prCount || 0) > 0;`.
  * Se `isRealPR`: Exibir selo verde-lima **`?? Recorde Pessoal (PR #N)`**.
  * Se `pr.isBaseline`: Exibir selo neutro **`?? Marca Base (Refer?ncia)`** com subt?tulo *"Tente +1 no pr?ximo treino"*.

### 5.3. `ProgressView.tsx`
* No grid de m?tricas principais no topo, apresentar os 4 pilares:
  1. **Treinos Conclu?dos** (+ nota de parciais)
  2. **Recordes Reais (PRs)** (+ nota de Marcas Base)
  3. **Minutos de Cuidado** (Mobilidade & Caminhada acumuladas)
  4. **Volume / Repeti??es Totais**

---

## 6. Casos de Teste Automatizados (`tests/domain.test.ts`)

* **`M-A01`**: Primeira s?rie de um exerc?cio retorna `isNewBaseline: true` e `isPR: false`.
* **`M-A02`**: Segunda execu??o superando repeti??es da Marca Base retorna `isPR: true`, `isNewBaseline: false` e `prCount: 1`.
* **`M-A03`**: Concluir a mesma ficha com `feedbackEffort: 2` ap?s sess?o anterior completa com `feedbackEffort: 4` concede a moeda `'efficiency_gain'`.
* **`M-A04`**: Sess?o parcial (`status: 'parcial'`) com `feedbackEffort: 1` NUNCA concede `'efficiency_gain'`.
* **`M-A05`**: Sess?es de caminhada e mobilidade somam corretamente em `careMinutesTotal` e concedem `'care_vitality'`.
