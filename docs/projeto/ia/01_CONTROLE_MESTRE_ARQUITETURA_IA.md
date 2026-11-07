# 01 — Controle Mestre: Arquitetura Consolidada de IA do Superação (v9.0)

**Status do Controle:** Planejamento Revisado e Consolidado — Pronto para Execução  
**Escopo:** Evolução inteligente do **Superação PWA** com Agentes Fixos no **DeepInfra**, Sistema de **Skills Científicas em Educação Física**, **Memória Hierárquica de Baixo Custo**, **Coleta Brasileira Multimodal (Tap + Voz)** e **Botão Flutuante Contextual do Personal**.

---

## 1. Princípios Inegociáveis e Invariantes do Sistema

Alinhado às regras canônicas do repositório ([DECISOES_E_REGRAS.md](file:///root/superacao-app/docs/projeto/DECISOES_E_REGRAS.md), [04_LLM_CUSTOS.md](file:///root/superacao-app/docs/04_LLM_CUSTOS.md) e [llm-action.schema.json](file:///root/superacao-app/schemas/llm-action.schema.json)), nenhum código de IA pode violar estes **8 invariantes**:

1. **Motor Determinístico Soberano:** O [workoutEngine](file:///root/superacao-app/src/lib/workoutEngine/engine.ts) e o catálogo revisado ([catalog.ts](file:///root/superacao-app/src/data/catalog.ts), 873 exercícios) são a única fonte válida de exercícios, séries, cronômetros, recordes (PRs) e conquistas. A IA **jamais inventa exercícios** fora dos IDs elegíveis pré-filtrados.
2. **Offline-First Absoluto:** Sem internet, sem chave configurada no servidor ou sob erro `429`/`5xx`, o aplicativo **nunca bloqueia treinos, triagem ou navegação**, degradando silenciosamente para os motores determinísticos locais em `0ms`.
3. **Confirmação Explícita e Preview Diff (`requires_confirmation: true`):** Nenhum agente altera fichas permanentes ou agenda futura às escondidas. Toda proposta exibe um resumo claro do que mudará e exige 1 toque de confirmação do usuário.
4. **Separação Estrita "Só Hoje" vs. "Rotina Permanente":** Ajustes de exceção diária (viagem, falta de tempo, cansaço pontual, dor muscular leve) aplicam-se apenas à sessão em foco ou possuem validade temporária (`expiresAt`), sem desconfigurar a rotina base.
5. **Intocabilidade do Plano de Professor Parceiro:** Quando o aluno possui vínculo ativo com um professor (`teacherLink.status === 'active'`), a IA **é bloqueada de alterar fichas permanentes prescritas pelo profissional**, podendo apenas responder dúvidas de execução, aplicar redução protetora efêmera na sessão do dia (com confirmação) ou gerar observação estruturada para o professor revisar em [TeacherDashboardView.tsx](file:///root/superacao-app/src/views/TeacherDashboardView.tsx).
6. **Compatibilidade Rígida de Equipamentos:** `mini_band`, `faixa_longa` e `tubos_elasticos` permanecem estritamente distintos em todas as ferramentas determinísticas expostas aos agentes.
7. **Zero Segredo no Cliente & Minimização LGPD:** Remover completamente `VITE_GEMINI_API_KEY` de [aiCoach.ts](file:///root/superacao-app/src/lib/aiCoach.ts). `DEEPINFRA_API_KEY` reside exclusivamente no **Secret Manager** do Firebase Cloud Functions (`functions/`). Áudios gravados são efêmeros em memória e descartados após transcrição e confirmação.
8. **Triagem de Bandeiras Vermelhas (*Red Flags*):** Relatos de dor torácica, síncope/tontura aguda, irradiação neural com dormência/perda de força, trauma recente ou febre acionam bloqueio imediato de prescrição intensa e orientação clara de avaliação médica/fisioterapêutica.

---

## 2. Mapa Consolidado: Onde NÃO Usar IA vs. Onde a IA Atua

| Fluxo / Funcionalidade | Decisão Arquitetural | Justificativa Técnica e Financeira |
| :--- | :--- | :--- |
| Cronômetros ao vivo, descanso, cálculo de volume (`kg × reps`), PRs e moedas | **100% Código Local (0 tokens)** | Precisão exata, resposta em `0ms` e funcionamento no modo avião. |
| Virada de semana (Segunda a Domingo) e espaçamento base de descanso (`weeklyScheduler.ts`) | **100% Código Local (0 tokens)** | Algoritmo determinístico já resolvido com perfeição. |
| Triagem inicial quando o usuário só usa cartões fechados (sem notas de saúde/rotina) | **100% Código Local (0 tokens)** | Economiza chamadas onde o motor determinístico já entrega proposta ideal. |
| **Interpretação de `healthNotes`, `userContextNotes` e Micro-Áudios (`<= 30s`)** | **`MasterPersonalAgent` + `VoiceASR`** | Corrige a falha atual de [engine.ts](file:///root/superacao-app/src/lib/workoutEngine/engine.ts#L330-L332), traduzindo queixas reais em restrições biomecânicas estruturadas. |
| **Montagem de rotina personalizada com contexto clínico e Renovação de Ciclo (4 sem.)** | **`MasterPersonalAgent` + Skills Científicas** | Prescrição com nível de pós-graduação em Educação Física sobre os candidatos seguros pré-filtrados. |
| **Botão Flutuante Sempre Disponível (Dúvidas técnicas, dor, ajuste do dia, motivação)** | **`MasterPersonalAgent` (técnico/corpo) ou `HabitCompanion` (hábito/UI)** | Canal único acolhedor, ciente da tela/exercício atual, com ações em 1 toque. |
| **Check-in Semanal Inteligente + Lote de 5 Pílulas Motivacionais (*Batching*)** | **`TelemetryAnalystAgent`** | Substitui a média rasa de RPE por análise longitudinal real e elimina 7 chamadas avulsas de frases diárias. |
| **Anamnese Multimodal (Fotos de postura/equipamentos) & Radar da Carteira do Professor** | **`PartnerTeacherCopilotAgent`** | Cumpre a promessa multimodal de [aiTeacherCopilot.ts](file:///root/superacao-app/src/lib/aiTeacherCopilot.ts) como apoio humano (*Human-in-the-Loop*). |

---

## 3. Tabela Congelada de Modelos Fixos no DeepInfra (Sem Motor de Roteamento)

Não haverá roteador dinâmico complexo nem chamadas extras de classificação. Cada agente em `functions/src/config/agentModels.ts` possui **1 Modelo Titular Fixo** e **1 Modelo Fallback Equivalente de outra família** (acionado automaticamente em erro HTTP `5xx`/`429` ou timeout):

| ID no Registro | Agente / Serviço | Modelo Titular Fixo (DeepInfra) | Modelo Fallback Equivalente | Temperatura / Max Output | Custo Ref. (In / Out por 1M) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`master_personal`** | **Agente Principal de Personal** *(Recepção clínica, montagem, ajustes e dúvidas de treino/dor)* | `zai-org/GLM-5.3` | `deepseek-ai/DeepSeek-V4-Pro` | `temp: 0.2` / `max: 1400` | ~\$0,56 / \$1,80 |
| **`teacher_copilot`** | **Co-Piloto Multimodal do Professor** *(Fotos postura/equipamentos + anamnese + carteira)* | `moonshotai/Kimi-K2.5` | `google/gemma-4-31b-it` | `temp: 0.2` / `max: 1400` | ~\$0,45 / \$2,25 |
| **`telemetry_analyst`** | **Analista Quantitativo Longitudinal** *(Revisão semanal/mensal + lote de 5 pílulas)* | `openai/gpt-oss-120b` | `deepseek-ai/DeepSeek-V4.1-Flash` | `temp: 0.2` / `max: 900` | ~\$0,08 / \$0,30 |
| **`habit_companion`** | **Companheiro de Hábito & Guia de UI** *(Apenas motivação leve e ajuda de navegação)* | `deepseek-ai/DeepSeek-V4.1-Flash` | `google/gemma-4-31b-it` | `temp: 0.5` / `max: 400` | ~\$0,098 / \$0,294 |
| **`voice_asr`** | **Transcrição de Micro-Áudios PT-BR** *(Áudios estilo WhatsApp `<= 30s`)* | `Qwen/Qwen3-ASR-1.7B` | `mistralai/Voxtral-Mini-3B-2507` | N/A (Áudio -> Texto) | \$0,00045 / min |
| **`memory_embedder`** | **Vetorização Episódica Sob Demanda** *(Memória histórica M4 no Firestore)* | `BAAI/bge-m3` | `Qwen/Qwen3-Embedding-8B` | Vetor `1024d` | ~\$0,01 / 1M |

> [!NOTE]
> Todos os IDs de modelos também poderão ser sobrescritos via variáveis de ambiente da Cloud Function (`MODEL_MASTER_PERSONAL_PRIMARY`, etc.) para permitir atualização instantânea de versões futuras no DeepInfra sem alterar lógica de código.

---

## 4. Experiência de Usuário: Coleta Brasileira & Botão Flutuante Anti-Poluição

### 4.1. Coleta Híbrida em 3 Camadas (Público Brasileiro)
1. **Tap-First (<60s):** Cartões visuais na [ListeningJourneyView.tsx](file:///root/superacao-app/src/views/ListeningJourneyView.tsx) para objetivos, dias, tempo, ambiente, materiais e articulações macro, mais botão opcional *"Prefere contar em uma conversa rápida de 1 min?"* (máx. 3 turnos com o `MasterPersonalAgent`).
2. **Micro-Áudio Estilo WhatsApp (`<= 30s`) + Confirmação Transparente:** Botão de microfone integrado em `healthNotes`, `userContextNotes`, [ProfileView.tsx](file:///root/superacao-app/src/views/ProfileView.tsx), [CustomAnamnesisFlowView.tsx](file:///root/superacao-app/src/views/CustomAnamnesisFlowView.tsx) e na gaveta do Personal. O usuário fala naturalmente, vê a transcrição resumida + cuidados compreendidos e confirma com 1 toque.
3. **Coleta Progressiva Pós-1º Treino:** Check-in de segunda-feira e fechamento de bloco de 4 semanas conduzidos com **Entrevista Motivacional (MI)** sem culpa.

### 4.2. Regras de Layout do Botão Flutuante (`PersonalAgentFab` + `PersonalAgentDrawer`)
* **Nas 4 Abas (`Home`, `Treinos`, `Agenda`, `Progresso`):** Posicionado em `bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30` (acima da [BottomNav.tsx](file:///root/superacao-app/src/components/BottomNav.tsx)), `min-h-[48px] min-w-[48px]`, retraindo suavemente para ícone compacto durante rolagem vertical para zero poluição visual em telas `360×800` e `320×640`.
* **Durante o Treino Ativo ([ActiveWorkoutView.tsx](file:///root/superacao-app/src/views/ActiveWorkoutView.tsx)):** **PROIBIDO** renderizar pílula flutuante no canto inferior direito (para jamais competir com o CTA gigante de `56px` de concluir série). Em vez disso, renderiza gatilho ancorado `"✨ Perguntar ao Personal"` junto ao banner de dica biomecânica (`linha 1026`), já injetando no contexto o `exerciseId`, série atual, carga/reps e histórico de PR daquele movimento.
* **No Painel do Professor ([TeacherDashboardView.tsx](file:///root/superacao-app/src/views/TeacherDashboardView.tsx)):** Assume rótulo `"✨ Co-Piloto"` conectado ao `PartnerTeacherCopilotAgent`.
* **Em Telas Iniciais (`WelcomeView`, `QuickIdentificationView`):** Oculto.

---

## 5. Orçamento Operacional e Limites de Proteção (Guardrails Financeiros)

| Controle | Regra Configurada no Servidor (`functions/`) | Efeito caso Atingido |
| :--- | :--- | :--- |
| **Cota Diária de Conversa por Usuário** | Máx. `15` turnos/dia no `MasterPersonalAgent` + `20` turnos/dia no `HabitCompanion` | Exibe aviso gentil e mantém atalhos determinísticos locais funcionando. |
| **Limite de Áudio por Gravação** | Máx. `30 segundos` (`~120KB` WebM/MP4/OGG) e máx. `10` áudios/dia | Corta gravação automaticamente aos 30s com barra regressiva clara. |
| **Cache por Hash de Contexto** | Hash SHA-256 de `(healthNotes + userContextNotes + goals + equipments + limitations)` | Zero chamadas repetidas se o contexto clínico do aluno não mudou. |
| **Prefix Cache no DeepInfra** | `prompt_cache_key` determinístico por agente e versão de prompt | Até 90% de economia no prefixo de instruções e schemas de tools. |
| **Custo Alvo Mensal Estimado** | **~\$0,02 a \$0,04 USD / aluno ativo / mês (~R\$ 0,12 a R\$ 0,24/mês)** | Sustentável desde o MVP até milhares de usuários. |
