# 02 — Arquitetura sugerida e modelo de dados

## Stack candidata
- **AI Studio Build — Web**, React + TypeScript + Vite. Mobile-first PWA instalável se o ambiente suportar; caso não, primeiro manter site responsivo confiável e adicionar manifest/service worker no Sprint 03.
- UI: Tailwind CSS e componentes acessíveis (Radix/shadcn opcional); ícones SVG.
- Estado: React Query para recursos remotos futuros; estado de sessão local bem definido. Não colocar registros importantes apenas em memória.
- Persistência principal: **Cloud Firestore Web SDK** com `persistentLocalCache` (IndexedDB gerenciado pelo SDK) e sincronização offline automática. Versões de esquema de domínio + exportação/importação JSON com `schemaVersion`. Sem Dexie/outbox para usuário autenticado.
- Validação: Zod (formularios + importações), ids estáveis e `crypto.randomUUID` para eventos locais.
- Testes: Vitest + React Testing Library; E2E Playwright se viável no ambiente.
- Backend **Firebase desde o início**: Authentication (Google), Firestore (fonte de dados de domínio, sincronizada por UID), Hosting (PWA HTTPS), Security Rules e App Check preparado. **Node.js** opcional mais tarde para chat Gemini, com verificação de Firebase ID token; não usar API key Gemini em frontend. Nunca expor `GEMINI_API_KEY` no navegador. AI Studio suporta servidor Node e secrets em apps Web.
- Sincronização é requisito MVP: Firestore SDK aplica gravações locais otimistas e as transmite ao reconectar; habilitar persistentLocalCache + multi-tab; observar hasPendingWrites e fromCache. Não criar fila/reconciliador próprio. Eventos de séries usam IDs estáveis e são append-only para evitar last-write-wins; planos editados concorrentemente criam revisões preservadas. Se write for rejeitado no servidor, observar e tratar possível rollback; não prometer durabilidade absoluta. Ver docs/06_FIREBASE_OFFLINE_SYNC.md.

## Entidades fundamentais
`Exercise` — id, nome em PT-BR, modalidade, movimento/padrão, variante, equipamento/subtipo, ambiente, registro (reps/seg/min/km), cautelas, revisão/versão, proveniência/licença, media opcional.
`WorkoutTemplate` — id, origem/autor/revisor, ambiente/equipamentos, slots ordenados, metas ilustrativas, status revisão e `publishable`.
`WorkoutPlan` — id, owner, `source=manual|template|professional`, sourceDetails, version, lista de sessões, dias/agenda, data de revisão, status.
`PlanSession` — id, exercises como snapshots dos slots; duração estimada; repetições/séries/descanso planejados.
`WorkoutSession` — id, planSnapshotVersion, `status=draft|active|paused|completed|abandoned`, startedAt, completedAt, duration, esforço/nota opcional.
`SeriesRecord` — id estável, sessionId, exerciseId, setIndex, plannedTarget, actualReps OU actualSeconds, recordedAt, userConfirmed=true. Registro deve ser idempotente, nunca duplicar XP ou contagem.
`ActivityRecord` — caminhada/atividade fora de série, tempo, distância opcional, esforço, origem manual. Sem GPS compulsório.
`CalendarEntry` — data local, plannedSessionId opcional, `dayType=strength|cardio|mobility|active_recovery|full_rest`, status e regras de replanejamento.
`ProgressEvent` — tipo, sourceId único, timestamp, delta (XP se aplicável), regra/versão para auditoria e dedupe.
`UserProfile` — objetivos, prioridade, equipamento específico, locais possíveis, disponibilidade, experiência autodeclarada, triagem de segurança mínima e consentimento.
`AssistantProposal` — intent validada por JSON Schema + referências aos IDs existentes + preview + requiresConfirmation. Não aplicar plano antes de confirmar.

## Dependências entre componentes
`catalog` -> `templateLibrary` -> `planComposer` -> `schedule` -> `sessionExecutor` -> `history` -> `progress`.
`llmAssistant` nunca escreve diretamente em `plan/session`; ele propõe `AssistantProposal`, e um validador local checa ids, limites, autoria e ação permitida.

## Regras invariantes
1. Nenhuma série é contabilizada pela meta planejada sem `userConfirmed`.
2. Fechar navegador ou perder rede não pode apagar séries já confirmadas; gravação imediata pelo SDK Firestore e observação de cache local, com tratamento explícito de erro de gravação tardio.
3. Progresso e XP são calculados por evento único, com dedupe `sourceId`.
4. Plano profissional não recebe alterações automáticas sem autorização explícita pertinente.
5. Recomendador `filter(publishable && reviewStatus==='aprovado')`; seed pendente não pode ter selo de validação.
6. Dia `full_rest` jamais é tratado como sessão perdida.
7. Ajustes para dor/sintomas relevantes levam a pausa/orientação profissional apropriada, não substituição automatizada.
8. `media_url` ausente -> mostrar cartão de instrução textual; não usar links externos não licenciados.
9. Sem chaves de API no client; limitar rate e custo no servidor.
10. Conteúdo licenciado preserva atribuição e restrições na camada por asset, não só por repositório.

## Base de exercícios
O seed anexo é **autoral, demonstrativo, não revisado**. Não mistura imagens de terceiros. O OpenBody CC0 é candidato a chave canônica, mas ainda não foi incorporado automaticamente. Referências: https://openbody.dev/licensing/ ; https://github.com/rfivesix/OpenExerciseDB (dados CC BY-SA); https://github.com/rthepen/workout-database (mídia externa não liberada); https://wger.readthedocs.io/en/stable/api/routines.html .

## Resultado esperado do primeiro scaffold
Projeto código rodável (não Figma), npm scripts, Firebase provisionado com Auth Google/Firestore e regras protegidas, import seed, Firestore SDK cache persistente offline e sincronização nativa, navegação e editor/executor completo mesmo offline após acesso local inicial. Se Firebase não estiver configurado, mostrar pendência de configuração, não simular nuvem. Modo convidado offline antes do primeiro login requer fluxo local separado e fica fora do Sprint 00.
