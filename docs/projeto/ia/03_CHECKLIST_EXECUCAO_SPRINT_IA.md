# 03 — Checklist Operacional de Implementação, Testes e Publicação (Atualização IA v9.0)

**Status Atual:** `[x] Fases 0 a 5 Concluídas com Sucesso — Preparando PR e Merge Final`  
**Fluxo Git Obrigatório:** Criar branch dedicada (`feat/ai-agents-deepinfra-and-admin-v9`) -> Implementar e validar todas as fases -> Rodar suíte completa (Vitest + TypeScript + Build + Playwright Mobile/Desktop) -> Abrir Pull Request detalhado -> Validar Preview/CI -> Merge na `main` + Deploy Firebase.

---

## Fase 0 — Preparação de Governança e Branch de Trabalho
- [x] **0.1.** Verificar `git status` limpo na `main` atualizada e criar a branch `feat/ai-agents-deepinfra-and-admin-v9`.
- [x] **0.2.** Sincronizar a documentação arquitetural consolidada em `docs/projeto/ia/` no repositório para manter o histórico técnico versionado junto ao código no PR.

---

## Fase 1 — Backend Serverless Seguro (`functions/`), Tabela Fixa DeepInfra e *Skills* Científicas
- [x] **1.1.** `[NEW] functions/package.json` & `[NEW] functions/tsconfig.json`: Configurar Cloud Functions for Firebase 2ª Geração (Node 22 + TypeScript) com cliente HTTP/OpenAI-compatible leve apontando para `https://api.deepinfra.com/v1/openai` e segredo `defineSecret('DEEPINFRA_API_KEY')`.
- [x] **1.2.** `[NEW] functions/src/config/agentModels.ts`: Implementar `AGENT_MODEL_REGISTRY` fixo (Titular + Fallback equivalente de outra família, sem motor de roteamento dinâmico) e executor resiliente `callDeepInfraWithFixedFallback()` com `prompt_cache_key`, timeout controlado e tratamento de erro `429`/`5xx`.
- [x] **1.3.** `[NEW] functions/src/skills/skillRegistry.ts` & `[NEW] functions/src/skills/library/*.ts`: Implementar o sistema de *Progressive Disclosure* em 3 camadas e codificar os **13 módulos científicos de Educação Física** especificados em `02_ESPECIFICACAO_SKILLS_E_MEMORIA.md`.
- [x] **1.4.** `[NEW] functions/src/tools/biomechanicsTools.ts`: Implementar as **7 ferramentas determinísticas** (`load_scientific_skills`, `check_medical_red_flags`, `query_safe_exercises` respeitando equipamentos distintos, `audit_weekly_fractional_volume`, `build_workout_proposal_diff` protegendo plano do professor, `recall_past_episodes` e `get_exercise_catalog_detail`).

---

## Fase 2 — Motor de Memória em 4 Camadas & Construção dos 4 Agentes + Voz
- [x] **2.1.** `[NEW] functions/src/memory/agentMemoryEngine.ts`: Implementar leitura/escrita da `CoreBiopsychosocialMemory` (Camada M2 com *Upsert-or-Supersede* e expiração automática `expiresAt` para dores temporárias), compactação assíncrona em 2 linhas (Camada M3) e busca vetorial `findNearest` com `BAAI/bge-m3` no Firestore (Camada M4).
- [x] **2.2.** `[NEW] functions/src/agents/voiceService.ts`: Endpoint/serviço de transcrição rápida em `pt-BR` (`Qwen/Qwen3-ASR-1.7B` -> fallback `mistralai/Voxtral-Mini-3B-2507`) validando tamanho `<= 30s` e descartando o áudio bruto em seguida.
- [x] **2.3.** `[NEW] functions/src/agents/masterPersonalAgent.ts`: Implementar o **Agente Principal de Personal** (`zai-org/GLM-5.3` -> fallback `deepseek-ai/DeepSeek-V4-Pro`) com loop máximo de 3 passos, uso das 13 Skills e das Tools determinísticas para: (a) interpretação clínica de `healthNotes`/`userContextNotes`, (b) triagem conversacional opcional de até 3 turnos, (c) montagem/renovação científica de rotina e (d) conversas técnicas/dores/ajustes no Botão Flutuante.
- [x] **2.4.** `[NEW] functions/src/agents/partnerTeacherCopilotAgent.ts`: Implementar o **Co-Piloto Multimodal do Professor** (`moonshotai/Kimi-K2.5` -> fallback `google/gemma-4-31b-it`) analisando fotos posturais (`posture_front`, `side`, `back`), fotos de `equipments` e respostas abertas + gerador de Briefing Executivo de 30 dias da carteira.
- [x] **2.5.** `[NEW] functions/src/agents/telemetryAnalystAgent.ts`: Implementar o **Analista Longitudinal** (`openai/gpt-oss-120b` -> fallback `deepseek-ai/DeepSeek-V4.1-Flash`) para revisão semanal/mensal de `SetEvent`, RPE e humor + geração em lote das **5 pílulas motivacionais da semana**.
- [x] **2.6.** `[NEW] functions/src/agents/habitCompanionAgent.ts`: Implementar o **Companheiro de Hábito & Guia de UI** (`deepseek-ai/DeepSeek-V4.1-Flash` -> fallback `google/gemma-4-31b-it`) restrito a apoio motivacional leve e dúvidas operacionais de interface.
- [x] **2.7.** `[NEW] functions/src/index.ts` & `[MODIFY]` `firebase.json` & `firestore.rules`: Expor endpoints HTTPS `onCall` com autenticação, App Check, rate-limit diário por usuário e regras de segurança para `users/{uid}/aiMemory/{doc=**}`.

---

## Fase 3 — Integração nos Motores Determinísticos Locais e Remoção de Chave Exposta
- [x] **3.1.** `[MODIFY]` `src/types/index.ts`: Adicionar tipos compartilhados (`StructuredClinicalContext`, `CoreBiopsychosocialMemory`, `ActiveScreenContext`, `AssistantActionProposal`, `ProposalDiff`).
- [x] **3.2.** `[NEW] src/lib/aiClient.ts`: Criar cliente front-end resiliente com cache por hash semântico, detecção de `navigator.onLine`, tratamento de erro `429`/timeout e fallback determinístico automático sem travar a UI.
- [x] **3.3.** `[MODIFY]` `src/lib/workoutEngine/engine.ts`: Conectar `structuredClinicalContext` e fatos ativos da memória (`clinicalFacts` não expirados) diretamente à filtragem biomecânica, limites de estresse articular, intervalos extras de descanso, seleção de padrões preferenciais e notas protetoras por exercício — corrigindo definitivamente o ponto onde `healthNotes` e `userContextNotes` eram ignorados.
- [x] **3.4.** `[MODIFY]` `src/lib/aiCoach.ts`, `src/lib/aiStudentAssistant.ts` e `src/lib/aiTeacherCopilot.ts`:
  - Remover `VITE_GEMINI_API_KEY` / `@google/genai` direto do front-end em `aiCoach.ts` e ler o pacote semanal cacheado do `TelemetryAnalystAgent`;
  - Enriquecer `aiStudentAssistant.ts` para exibir dicas protetoras reais vindas do `MasterPersonalAgent` / memória clínica (com heurística expandida para hérnia, ciático, condromalácia, epicondilite, labirintite e diástase quando offline!);
  - Conectar `aiTeacherCopilot.ts` ao `PartnerTeacherCopilotAgent` multimodal (`source: 'ai_model'`), mantendo `runClinicalHeuristicAnalysis` quando offline.

---

## Fase 4 — Coleta Brasileira Multimodal (Tap + Voz) & Botão Flutuante Contextual
- [x] **4.1.** `[NEW] src/components/VoiceOrTextContextInput.tsx`: Componente reutilizável de gravação de micro-áudio estilo WhatsApp (`MediaRecorder` até `30s`, contador regressivo, fallback gracioso sem permissão de microfone) + confirmação visual do resumo e cuidados extraídos.
- [x] **4.2.** `[NEW] src/components/PersonalAgentFab.tsx` & `[NEW] src/components/PersonalAgentDrawer.tsx`:
  - Botão flutuante tátil (`>= 48×48px`) posicionado acima da `BottomNav` nas 4 abas principais, retraindo ao rolar;
  - Gaveta (*bottom-sheet*) ciente da tela/exercício atual (`ActiveScreenContext`), com chips de 1 toque sem digitação, entrada por voz/texto, roteamento claro (`MasterPersonalAgent` para treino/corpo vs. `HabitCompanion` para UI/motivação), **Preview Diff com Confirmação Explícita** e painel transparente/editável *"🧠 O que seu Personal lembra sobre você"*.
- [x] **4.3.** `[NEW] src/components/WeeklyIntelligentCheckinModal.tsx`: Modal de virada de semana / renovação de ciclo de 4 semanas com Entrevista Motivacional (MI) e ajuste em 1 clique.
- [x] **4.4.** `[MODIFY]` Integração nas telas:
  - `src/App.tsx`: Plugar `PersonalAgentFab` + `PersonalAgentDrawer` globalmente com contexto vivo da aba/fluxo e callbacks seguros de aplicação confirmada;
  - `src/views/ActiveWorkoutView.tsx`: Ancorar o botão `"✨ Perguntar ao Personal"` junto à barra de dica biomecânica (sem pílula flutuante embaixo para não conflitar com `"Concluir Série"`);
  - `src/views/ProfileView.tsx`: Integrar `onOpenAdmin` exclusivo para contas com permissão de administrador.

---

## Fase 4.5 — Central de Administração (`Admin Control Center` — Modelos, Custos, Skills e Dados)
- [x] **4.5.1.** `[NEW] functions/src/admin/adminAuth.ts`, `usageLedger.ts` & `adminCallable.ts`: Implementar controle de autoridade blindado (`Custom Claims` + `system_admins/{uid}` + bootstrap verificado para `gamamatheus65@gmail.com` / `ADMIN_OWNER_EMAILS`), agregador atômico diário de tokens/custos (`system_metrics/ai_daily_{YYYY-MM-DD}`), trava automática de orçamento (`dailyHardStopUsd` / `monthlyHardStopUsd`), overrides dinâmicos de modelos/Skills/catálogo com cache em RAM de 60s, privacidade LGPD por padrão na busca de usuários e trilha imutável `admin_audit_logs`.
- [x] **4.5.2.** `[MODIFY]` `firestore.rules`: Adicionar `isAdmin()` seguro, proteger coleções administrativas contra escrita direta do cliente e bloquear escalação de privilégio em `users/{uid}`.
- [x] **4.5.3.** `[NEW] src/views/AdminDashboardView.tsx` & `src/components/admin/*.tsx`: Construir o Painel Admin responsivo (carregado via `lazyWithRetry`, `0 KB` para alunos comuns) com as **6 abas** (Custos & Telemetria, Gestão Live de Modelos + Mini-Playground, Cotas & Teto Financeiro, Estúdio das 13+ Skills, Gestão de Usuários/Professores e Curadoria do Catálogo + Audit Trail).
- [x] **4.5.4.** `[MODIFY]` `src/context/AuthContext.tsx`, `src/App.tsx`, e `src/views/ProfileView.tsx`: Expor `isAdmin` e exibir o botão `🛡️ Painel do Administrador` exclusivamente para contas administradoras verificadas.

---

## Fase 5 — Bateria Rigorosa de Testes Automatizados (Unitários, Segurança Clínica, Admin e E2E Mobile)
- [x] **5.1.** **Testes Unitários & de Domínio (`Vitest`):**
  - [x] Tentativa de o modelo retornar `exerciseId` inexistente ou incompatível -> bloqueado pelo validador determinístico;
  - [x] Tentativa de alterar plano permanente de aluno vinculado a Professor Parceiro -> bloqueado com segurança;
  - [x] Garantia de `requires_confirmation: true` (nenhuma proposta autoaplicada sem clique do usuário);
  - [x] Detecção de *Red Flags* médicas (dor torácica, parestesia aguda, síncope) -> bloqueia ajuste intenso e orienta avaliação médica;
  - [x] Expiração automática de dor temporária (`expiresAt`) vs. preservação de condição crônica na `CoreBiopsychosocialMemory`;
  - [x] Acionamento automático do modelo Fallback quando o Titular falha (`503`/`429`/timeout) e fallback determinístico offline em `0ms`;
  - [x] `healthNotes` (ex.: *"hérnia discal L4-L5"* e *"condromalácia"*) alterando comprovadamente os exercícios selecionados pelo `workoutEngine`.
- [x] **5.2.** **Checagem de Tipos, Build PWA e Build de `functions/`:**
  - [x] `npm run lint` (`tsc --noEmit` front-end + `functions/`) sem erros (código 0);
  - [x] `npm run build` gerando bundle limpo e verificando ausência total de `DEEPINFRA_API_KEY` ou `GEMINI_API_KEY` nos arquivos gerados em `dist/`.
- [x] **5.3.** **Testes E2E Mobile PWA (`Playwright` — Pixel 5 `393×851`, Galaxy S20 `360×800`):**
  - [x] Verificar matematicamente que `PersonalAgentFab` não sobrepõe a `BottomNav` nas 4 abas e não aparece sobreposto ao botão principal em `ActiveWorkoutView`;
  - [x] Testar abertura da gaveta do Personal, chips contextuais, preview de confirmação de ajuste e controle de memória pelo usuário;
  - [x] Testar navegação e operações nas 6 abas do Painel do Administrador (`?admin=1`).

---

## Fase 6 — CI/CD, Pull Request, Homologação e Merge na `main`
- [ ] **6.1.** Atualizar `.github/workflows/firebase-hosting-merge.yml` e `firebase-hosting-pull-request.yml` para validar também o typecheck/testes de `functions/` no pipeline.
- [ ] **6.2.** Fazer commit organizado na branch `feat/ai-agents-deepinfra-and-admin-v9`, push para `origin` e abrir Pull Request documentando arquitetura, segurança, custos e evidências dos testes.
- [ ] **6.3.** Aguardar aprovação de todos os checks de CI + link de preview do Firebase Hosting, realizar merge na `main` e validar publicação em `https://superacao-app-65.web.app`.
