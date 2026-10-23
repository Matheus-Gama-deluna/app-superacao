# Estrat?gia D: Term?metro "Antes vs. Depois" (Mem?ria de Bem-Estar)

**Status:** Planejado e Especificado  
**Arquivos Impactados:** `src/types/index.ts`, `src/lib/storage.ts`, `src/context/WorkoutContext.tsx`, `src/views/ActiveWorkoutView.tsx`, `src/views/HomeView.tsx`, `src/views/ProgressView.tsx`, `tests/domain.test.ts`

---

## 1. Fundamento Comportamental e Objetivo

Por que uma pessoa desiste de treinar ou alongar em um dia dif?cil? Porque o c?rebro avalia o custo imediato ("estou cansado/sem vontade agora") e esquece o benef?cio imediato ("sempre que eu fa?o 10 minutos, termino me sentindo muito melhor").

**Objetivo da Estrat?gia D:** Capturar, com **1 ?nico toque opcional e zero burocracia**, como a pessoa chegou para a pr?tica e como ela saiu, transformando esses registros em um **"Espelho Motivacional"** na tela inicial que usa a pr?pria hist?ria real da pessoa para convenc?-la a praticar nos dias de baixa energia.

---

## 2. Modelagem de Dados (`src/types/index.ts`)

```typescript
export type PreWorkoutMood = 'cansado' | 'tenso' | 'normal' | 'disposto';
export type PostWorkoutMood = 'renovado' | 'leve' | 'orgulhoso' | 'cansado_bem';

export interface WellbeingInsight {
  totalTrackedSessions: number;
  positiveTurnaroundCount: number; // Vezes que entrou 'cansado' ou 'tenso' e saiu melhor
  lastTurnaroundPreMood?: string;
  lastTurnaroundPostMood?: string;
  lastTurnaroundMinutes?: number;
  message: string;
}
```

### Expans?o em `WorkoutSession`:
* `preMood?: PreWorkoutMood;` ? Estado ao iniciar a sess?o.
* `postMood?: PostWorkoutMood;` ? Sensa??o ao encerrar a sess?o.

---

## 3. Dicion?rios Can?nicos e Algoritmo (`src/lib/storage.ts`)

```typescript
export const PRE_MOOD_LABELS: Record<PreWorkoutMood, { label: string; icon: string }> = {
  cansado: { label: 'Sem energia / Cansado', icon: '??' },
  tenso: { label: 'Corpo preso / Tenso', icon: '?' },
  normal: { label: 'Normal / No ritmo', icon: '??' },
  disposto: { label: 'Bem disposto', icon: '??' },
};

export const POST_MOOD_LABELS: Record<PostWorkoutMood, { label: string; icon: string }> = {
  renovado: { label: 'Com mais energia', icon: '?' },
  leve: { label: 'Mais leve e solto', icon: '??' },
  orgulhoso: { label: 'Dever cumprido', icon: '??' },
  cansado_bem: { label: 'Cansado, mas feliz', icon: '??' },
};
```

### Fun??o `generateWellbeingInsight(sessions: WorkoutSession[]): WellbeingInsight | null`
1. Filtra sess?es conclu?das ou parciais que possuam tanto `preMood` quanto `postMood`.
2. Se n?o houver nenhuma sess?o com ambos registrados, retorna `null` (**Invariante:** nunca exibir frases falsas se o usu?rio ainda n?o registrou sensa??es).
3. Identifica "Viradas Positivas" (`turnarounds`): sess?es onde `preMood === 'cansado' || preMood === 'tenso'` e `postMood` foi `'renovado' | 'leve' | 'orgulhoso' | 'cansado_bem'`.
4. Se `turnarounds.length > 0`:
   * Pega a mais recente (`latest = turnarounds[0]`).
   * Gera mensagem personalizada:
     > `"?? Lembrete da sua jornada: Em ${turnarounds.length} ${turnarounds.length === 1 ? 'vez' : 'vezes'} que voc? come?ou '${PRE_MOOD_LABELS[latest.preMood!].label}', apenas ${Math.max(1, Math.round(latest.durationSeconds / 60))} min de pr?tica fizeram voc? terminar '${POST_MOOD_LABELS[latest.postMood!].label}'."`
5. Caso todas as sess?es tenham come?ado `'normal'` ou `'disposto'`:
   * Gera mensagem:
     > `"?? Mem?ria de Bem-Estar: Nas suas ?ltimas pr?ticas, voc? terminou se sentindo '${POST_MOOD_LABELS[latest.postMood!].label}'. Reserve seus minutos de hoje!"`

---

## 4. Especifica??o de Interface (Zero Fric??o)

### 4.1. Coleta do "Como voc? chegou hoje?" (`ActiveWorkoutView.tsx` e Modal de Caminhada)
* Na 1? s?rie da sess?o (`activeSession.totalSetsCompleted === 0 && !activeSession.preMood`):
  * Exibir uma faixa compacta e acolhedora no topo da ?rea da s?rie:
    * Texto: *"Como voc? est? chegando agora? (1 toque opcional)"*
    * 4 p?lulas horizontais (`Sem energia`, `Tenso`, `Normal`, `Disposto`).
    * Ao tocar em uma, salva imediatamente em `activeSession.preMood` (via `setSessionPreMood` no `WorkoutContext`) e mostra confirma??o suave `"? Registrado: Vamos no seu ritmo hoje!"`.

### 4.2. Coleta do "Como voc? est? saindo?" (Tela de Conclus?o e Modal de Caminhada)
* Na tela de finaliza??o do `ActiveWorkoutView.tsx`, logo abaixo da percep??o de esfor?o (RPE):
  * Pergunta: *"Como voc? est? saindo ap?s esta pr?tica?"*
  * 4 bot?es em grid 2x2 (`? Com mais energia`, `?? Mais leve e solto`, `?? Dever cumprido`, `?? Cansado, mas feliz`).
  * Se `activeSession.preMood` foi preenchido, exibe conex?o imediata:
    **`Voc? chegou: {preLabel} ? Est? saindo: {postLabel}`**

### 4.3. Exibi??o na `HomeView.tsx` e `ProgressView.tsx`
* Na `HomeView.tsx`: Quando `generateWellbeingInsight(sessions)` retornar um insight v?lido, exibir um card compacto e inspirador logo abaixo do Card de Hoje.
* Na `ProgressView.tsx`: No hist?rico de sess?es realizadas, exibir a p?lula de transforma??o emocional (`?? Sem energia ? ? Com mais energia`) ao lado da dura??o da sess?o.

---

## 5. Casos de Teste Automatizados (`tests/domain.test.ts`)

* **`M-D01`**: Sem sess?es com `preMood`/`postMood`, `generateWellbeingInsight` retorna `null` sem inventar dados.
* **`M-D02`**: Sess?o iniciada com `preMood: 'cansado'` e conclu?da com `postMood: 'renovado'` contabiliza `positiveTurnaroundCount: 1` e cita os r?tulos exatos na mensagem.
* **`M-D03`**: `preMood` e `postMood` s?o preservados na serializa??o do `localStorage` e nos backups JSON.
