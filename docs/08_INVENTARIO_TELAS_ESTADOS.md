# 08 — Inventário de telas, ações e estados do MVP

| ID | Tela | Ação primária | Dados mostrados | Estados/exceções indispensáveis |
|---|---|---|---|---|
| S00 | Acesso/identidade | Entrar com Google / continuar convidado | Política de privacidade, dispositivo confiável | sem rede novo usuário, Firebase não provisionado, erro de login, dispositivo compartilhado |
| S01 | Onboarding progressivo | Salvar perfil e prosseguir | objetivo primário/secundários, equipamento, tempo, dias, origem profissional | pular/voltar/salvar rascunho, alerta de segurança, resposta desconhecida |
| S02 | Início | Iniciar / Retomar treino | plano de hoje, metas semanais, próximo compromisso, sincronização | sem plano, descanso total, treino ativo, offline, retorno após pausa |
| S03 | Treinos / Explorar | Criar treino | meus planos, categorias, filtros e exercícios | catálogo seed em revisão, filtros vazios, plano do profissional |
| S04 | Detalhes exercício | Adicionar ao treino | instruções, variante, equipamento exato, cautelas, origem/mídia | texto não revisado, vídeo indisponível, sem âncora adequada |
| S05 | Montador | Salvar meu treino | ordem dos exercícios, séries, alvos, duração e descanso | salvar offline, draft, editar, duplicar, excluir, origem profissional bloqueada |
| S06 | Agenda | Planejar semana | sessões, caminhada, mobilidade, descanso total | faltas, reagendar, conflitos, sincronização pendente |
| S07 | Execução em foco | Concluir série | exercício atual, série prevista, instrução, tempo, pausa | sem rede, retorno após suspensão, não confundir confirmado com planejado |
| S08 | Confirmar registro | Salvar repetições reais | repetições/tempo efetivos, nota e opção de correção | cancelar sem gravar, zero e parcial válidos, teclado visível |
| S09 | Descanso | Seguir / pular | tempo persistido, próximo exercício, wake-lock opt-in | bloquear tela, terminar enquanto fechado, sem alarme garantido |
| S10 | Conclusão | Voltar para início | resumo concluído, esforço opcional e feedback | XP idempotente, treino incompleto, nenhum streak forçado |
| S11 | Progresso / Histórico | Ver sessão | calendário/histórico, planejado vs realizado | sem histórico, offline cache insuficiente, correções append-only |
| S12 | Perfil / Configurações | Atualizar preferências | metas, equipamentos, dados e sessão, exportar | logout vs cache, conta compartilhada, excluir dados, exportar JSON |
| S13 | Assistente (feature flag) | Revisar proposta | mensagem, busca no catálogo, proposta com diff | offline/indisponível, privacidade, proposta não validada, confirmação explícita |

## Ordem visual recomendada no AI Studio
1. S02/S03/S05/S07/S08/S09/S10: caminho crítico montar → executar → confirmar → concluir.
2. S00/S01/S06/S11/S12: autenticação, onboarding, agenda e progresso.
3. S13: assistente opcional, nunca bloquear caminho crítico.

## Componentes reutilizáveis
`AppShell`, `TopStatusBar`, `BottomNav`, `PrimaryButton`, `ExerciseCard`, `EquipmentChip`, `DifficultyTag`, `ReviewBadge`, `PlanCard`, `WeekStrip`, `SetRow`, `NumericConfirmSheet`, `RestTimer`, `SyncStatus`, `EmptyState`, `DangerNotice`, `ProgressMetric`, `BottomSheet`, `OfflineBanner`, `ConfirmationDialog`.

## Regras de UX pouco negociáveis
- Confirmar série grava **resultado real informado**, não o alvo presumido.
- Na tela de execução a barra de navegação pode sumir, mantendo saída com salvamento e retorno explícito.
- Conquistas baseadas em sessões planejadas; descanso absoluto não é dia fracassado.
- Ao falhar Firebase, não exibir ``Sincronizado``.
- Se não houver documento carregado offline, exibir estado ``Não disponível sem conexão`` em vez de vazio definitivo.
- Mostrar ``Conteúdo em revisão`` para modelos seed e permitir apenas simulação de desenvolvimento ou montagem manual no piloto sem aprovação.
