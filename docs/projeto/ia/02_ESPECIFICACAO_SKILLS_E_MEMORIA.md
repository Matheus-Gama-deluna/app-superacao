# 02 — Especificação Técnica: Sistema de *Skills* em Educação Física, Tools Determinísticas e Memória em 4 Camadas

**Status do Controle:** Contrato Técnico Congelado para Implementação  
**Módulos Alvo:** `functions/src/skills/`, `functions/src/tools/`, `functions/src/memory/` e `firestore.rules`.

---

## 1. Arquitetura de *Agent Skills* com *Progressive Disclosure* (3 Camadas)

Para que o **`MasterPersonalAgent` (`GLM-5.3`)** e o **`PartnerTeacherCopilotAgent` (`Kimi-K2.5`)** atuem com rigor de especialista em Educação Física sem carregar dezenas de milhares de tokens em toda chamada, toda base científica segue o contrato `ExerciseScienceSkill`:

```ts
export type SkillId =
  | '01_red_flags_confef_ethics'
  | '02_acsm2026_volume_hypertrophy_strength'
  | '03_autoregulation_rir_fatigue_deload'
  | '04_home_biomechanics_resistance_curves'
  | '05_spine_lumbar_cervical_care'
  | '06_lower_limb_knee_hip_tendon'
  | '07_upper_limb_shoulder_wrist_care'
  | '08_longevity_sarcopenia_vestibular'
  | '09_cardiometabolic_female_physiology'
  | '10_mesocycle_periodization_ladders'
  | '11_motivational_interviewing_adherence'
  | '12_visual_posture_equipment_triage'
  | '13_cardio_mobility_active_recovery';

export interface ExerciseScienceSkill {
  id: SkillId;
  title: string;
  /** Camada 1: 1 linha enxuta (~20 tokens) sempre presente no prefixo cacheado */
  indexSummary: string;
  /** Gatilhos determinísticos para pré-carregamento automático em 0ms */
  autoTriggers: {
    limitationTags?: string[];
    goalKeywords?: string[];
    environment?: Array<'casa' | 'academia'>;
    agentIds?: Array<'master_personal' | 'teacher_copilot'>;
    hasPhotos?: boolean;
  };
  /** Camada 2: Protocolo técnico denso e objetivo (~450 a 650 tokens) carregado apenas sob demanda */
  protocolMarkdown: string;
  /** Camada 3: Nomes das ferramentas determinísticas que esta Skill orienta acionar */
  coupledTools: string[];
}
```

### Catálogo Completo das 13 Skills Científicas Obrigatórias

| # | `SkillId` | Conteúdo Científico Obrigatório no `protocolMarkdown` |
| :--- | :--- | :--- |
| **01** | `01_red_flags_confef_ethics` | Critérios vermelhos absolutos (dor precordial/irradiada, dispneia em repouso, síncope/vertigem aguda, déficit motor/parestesia progressiva, trauma agudo não avaliado, febre). Fronteira legal CONFEF/CREF: Educação Física adapta movimento e gerencia carga; diagnóstico nosológico e reabilitação aguda cabem à Medicina/Fisioterapia. |
| **02** | `02_acsm2026_volume_hypertrophy_strength` | *ACSM Position Stand 2026 (Currier, Phillips, Schoenfeld)* + *Pelland et al.*: contabilização fracionada (`1.0` série direta / `0.5` sinergista); hipertrofia eficaz entre `30%–100% 1RM` próxima ao esforço alvo; força máxima priorizada em multiarticulares iniciais; Dose Mínima Eficaz (`4–6` séries/padrão/semana) para sessões curtas (`15–25 min`) vs. `>= 10` séries/semana para foco hipertrófico em sessões padrão/completas. |
| **03** | `03_autoregulation_rir_fatigue_deload` | Escala `RIR` (`2–3 repetições em reserva` como padrão ótimo de estímulo-fadiga sem falha exaustiva), controle de carga interna (`sRPE` de Foster), identificação de *junk volume*, regras de *Deload* (-30% a -40% de séries mantendo tensão), Modo Suave (-25%) e rampa segura de retorno após pausas de `7–14`, `15–30` e `>30` dias. |
| **04** | `04_home_biomechanics_resistance_curves` | Biomecânica aplicada com recursos domésticos: curva elástica ascendente (`mini_band` != `faixa_longa` != `tubos_elasticos`), variação de alavancas gravitacionais no peso corporal, execução unilateral, tempo excêntrico controlado (`3–4s`), pausa isométrica no ponto de maior braço de momento (`2s`) e pareamento agonista-antagonista (*supersets* economizadores de tempo). |
| **05** | `05_spine_lumbar_cervical_care` | Diretrizes *JOSPT / McGill / O'Sullivan*: classificação funcional de sensibilidade à flexão, extensão ou compressão axial; priorização de estabilidade *anti-extensão, anti-flexão lateral e anti-rotação*; dissociação lombo-pélvica (*hip hinge*) e preferência por apoios torácicos ou cargas assimétricas leves sobre cargas axiais pesadas. |
| **06** | `06_lower_limb_knee_hip_tendon` | Diretrizes *JOSPT* para dor femoropatelar/condromalácia, osteoartrite de joelho/quadril e tendinopatias: modulação de amplitude indolor (`0°–45°/60°` inicial em cadeia fechada), isometria analgésica (`30–45s`), ênfase na cadeia póstero-lateral do quadril (glúteo médio e máximo) contra valgo dinâmico e progressão gradual de impacto. |
| **07** | `07_upper_limb_shoulder_wrist_care` | Proteção subacromial/manguito rotador, controle escapular, epicondilites e intolerância de punho: elevação no plano da escápula (`30°–45°`), pegada neutra/semipronada, razão puxar:empurrar `>= 1.5:1` para alívio postural e substituição de apoio palmar plano no chão por punho neutro, antebraço ou plano elevado (parede/banco). |
| **08** | `08_longevity_sarcopenia_vestibular` | Consensos *EWGSOP2 / ICFSR* para 55+ e idosos: preservação de potência muscular segura (intenção concêntrica ágil controlada + excêntrica estável), treino neuromotor/equilíbrio unipodal assistido, prevenção de quedas e organização da sessão por blocos posturais (em pé -> sentado -> solo) evitando trocas rápidas de decúbito em quadros de labirintite/hipotensão postural. |
| **09** | `09_cardiometabolic_female_physiology` | Hipertensão (respiração fluida contínua sem manobra de Valsalva, evitar isometrias máximas acima da linha cardíaca), diabetes/resistência à insulina, proteção articular no sobrepeso, climatério/menopausa (estímulo osteogênico e preservação de massa magra) e cuidados com pressão intra-abdominal em diástase/assoalho pélvico. |
| **10** | `10_mesocycle_periodization_ladders` | Periodização de blocos de 4 semanas integrada às Escadas Biomecânicas de [progression.ts](file:///root/superacao-app/src/lib/workoutEngine/progression.ts): progressão dupla (consolidar teto de repetições com `RPE <= 3` antes de subir degrau ou carga), manutenção de padrões motores-chave e critérios objetivos de troca de estímulo. |
| **11** | `11_motivational_interviewing_adherence` | Técnicas *OARS* de Entrevista Motivacional (perguntas abertas enxutas, afirmações de competência, escuta reflexiva, resumos práticos), Teoria da Autodeterminação e diretrizes do *Guia de Atividade Física para a População Brasileira* (valorização de qualquer dose possível sem linguagem punitiva). |
| **12** | `12_visual_posture_equipment_triage` | Protocolo para `PartnerTeacherCopilotAgent`: leitura estruturada de fotos posturais (`posture_front`, `side`, `back` — nivelamento de ombros/pelve, curvaturas sagitais, alinhamento de joelhos como *hipótese triada para aferição do professor*) + identificação precisa de equipamentos domésticos na foto `equipments`. |
| **13** | `13_cardio_mobility_active_recovery` | Integração de práticas aeróbicas externas (`caminhada_corrida`, `ciclismo_natacao`, `esporte_coletivo`) com treino de força (controle de interferência e fadiga residual em membros inferiores) e prescrição de sessões de Descanso Ativo, mobilidade articular e respiração parassimpática. |

---

## 2. Caixa de 7 Ferramentas Determinísticas (`functions/src/tools/biomechanicsTools.ts`)

Os agentes **não adivinham matemática nem IDs do catálogo**. Eles operam sobre estas 7 funções determinísticas em TypeScript:

1. **`load_scientific_skills({ skillIds })`:** Carrega em tempo de execução até 3 Skills adicionais caso a conversa revele uma condição não prevista no pré-carregamento inicial.
2. **`check_medical_red_flags({ text })`:** Varredura determinística + léxica de sinais críticos de emergência/encaminhamento médico obrigatório.
3. **`query_safe_exercises({ equipments, avoidedMovements, limitations, functionalPatterns, maxJointStress, limit })`:** Executa `isExerciseSafeForUser` sobre o catálogo enriquecido (respeitando `mini_band` != `faixa_longa` != `tubos_elasticos`) e retorna até `22` candidatos 100% seguros com `{ id, name_pt, functionalPattern, equipment, resistanceType, jointStress, instructionsSummary }`.
4. **`audit_weekly_fractional_volume({ routines, frequencyPerWeek })`:** Calcula séries diretas (`1.0`) e sinergistas (`0.5`) por padrão motor na semana, equilíbrio empurrar/puxar e duração real estimada em minutos (séries + tempo sob tensão + descansos + transições).
5. **`build_workout_proposal_diff({ currentPlan, proposedExercises, scope, isTeacherManaged })`:** Valida se todos os `exerciseId`s existem e são seguros, bloqueia mutação permanente caso `isTeacherManaged === true` e constrói o objeto `ProposalDiff` pronto para a UI pedir confirmação explícita do usuário.
6. **`recall_past_episodes({ uid, queryText, topK })`:** Gera embedding via `BAAI/bge-m3` e consulta os `topK = 3` episódios passados mais relevantes no Firestore (`findNearest`).
7. **`get_exercise_catalog_detail({ exerciseId })`:** Retorna instruções revisadas, erros comuns e variações de regressão/progressão na escada biomecânica para responder dúvidas no Botão Flutuante com precisão cirúrgica.

---

## 3. Esquema da Memória em 4 Camadas (`AgentMemoryEngine`) e Regras Firestore

### 3.1. Camada M2 — `users/{uid}/aiMemory/core` (`CoreBiopsychosocialMemory`)
Documento único compacto (~300 tokens serializados), atualizado via política **Upsert-or-Supersede** e **visível/editável pelo próprio usuário** na UI (*"🧠 O que seu Personal lembra sobre você"*):

```ts
export interface ClinicalMemoryFact {
  id: string; // chave canônica ex: 'knee_right_patellofemoral' | 'neck_acute_stiffness'
  labelPt: string; // texto claro exibido ao usuário: "Sensibilidade no joelho direito ao descer escadas"
  persistence: 'chronic' | 'temporary';
  avoidedMovements: string[];
  protectiveCuePt: string;
  createdAt: number;
  updatedAt: number;
  /** Obrigatório quando persistence === 'temporary' (ex: +4 dias para dor muscular pós-esforço) */
  expiresAt?: number;
  sourceHash?: string;
}

export interface CoreBiopsychosocialMemory {
  schemaVersion: 1;
  updatedAt: number;
  clinicalFacts: ClinicalMemoryFact[]; // Filtrado em runtime ignorando itens com expiresAt < Date.now()
  likedExerciseIds: string[];
  dislikedExerciseIds: string[];
  routineInsights: {
    realisticDurationMinutes?: number;
    mainAdherenceBarriers: string[];
    preferredCoachingTone: 'direto_cientifico' | 'acolhedor_suave' | 'motivador_energetico';
    personalMotivationSummary?: string;
  };
  mesocycleState: {
    cycleWeek: 1 | 2 | 3 | 4;
    cycleStartedAt: number;
    currentFocusSummary: string;
    lastWeeklyDigestSummary?: string;
  };
}
```

### 3.2. Camada M3 & M4 — `users/{uid}/aiMemory/episodes/items/{episodeId}` (`EpisodicMemoryItem`)
```ts
export interface EpisodicMemoryItem {
  id: string;
  createdAt: number;
  category: 'clinical_note' | 'workout_adaptation' | 'weekly_review' | 'milestone';
  /** Resumo atômico de no máximo 240 caracteres (Padrão Mem0) */
  summaryPt: string;
  /** Vetor 1024d (BAAI/bge-m3) salvo via FieldValue.vector() para busca findNearest sob demanda */
  embedding?: number[];
}
```

### 3.3. Segurança em `firestore.rules`
* `match /users/{userId}/aiMemory/{document=**}`: leitura, edição e exclusão permitidas **apenas** ao próprio titular autenticado (`request.auth != null && request.auth.uid == userId`), garantindo controle total de privacidade (LGPD) pelo usuário caso ele deseje apagar qualquer lembrança na tela de Perfil ou na gaveta do Personal. As Cloud Functions acessam via Firebase Admin SDK validando previamente o `auth.uid` da requisição.
