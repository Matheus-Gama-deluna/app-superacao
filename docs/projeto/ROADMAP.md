# Próximas entregas e critérios de saída

Planejamento após a última análise v8. Não renomear esta fila para “concluída” por aumento da versão. O planejamento consolidado contém o inventário histórico e 44 cenários; este arquivo ajusta prioridades pela evidência mais recente.

| Ordem | Entrega | Critério de saída |
|---|---|---|
| 0 | Build e homologação isolada | Versão única + commit/identificador, ambiente novo e migrado com dados sintéticos |
| 1 | Recuperar proposta | Abre por resumo e início; erros visíveis; ajustes e confirmação; reload não ativa nem duplica |
| 2 | Perfil realmente utilizado | Assistente herda tempo, recursos e objetivos suportados; ajuste de hoje não sobrescreve perfil |
| 3 | Pausa funcional | Volta ao início e retoma séries/descanso em cenários com zero/uma/várias séries |
| 4 | Vínculos e métricas | Parcial não marca descanso; início/progresso concordam sobre BASE/PR e completos/parciais |
| 5 | Agenda confirmada | Datas, navegação, fuso, reagendamento; programa de 3 dias negocia perfil de 2 dias |
| 6 | Escuta e edição | Sem respostas impostas, resumo completo, perfil reeditável sem perda de histórico |
| 7 | Curadoria e UX | Apoios/nível compatíveis, tempo calculado, traduções e acessibilidade testadas |
| 8 | Dados e release | Migração, backups, offline, contas e publicação com testes e limites explícitos |

## Regressões que já passaram e devem ser preservadas

Separação de completos/parciais no progresso; primeira marca sem PR real ou medalha de superação; parcial não incrementa a meta do início no cenário novo; sequência correta da segunda série do agachamento. Ainda corrigir rótulo de Recorde Pessoal no início.

## Bloqueios e critérios de encerramento

Não há homologação integral enquanto proposta e vínculo de execução estiverem bloqueados ou sem teste. Exigir jornada nova e migrada, caso histórico parcial, confirmação idempotente, rotina aceita refletida na agenda e todos os P0 resolvidos. Para cada pendência externa informar dependência e próximo teste, sem simular login/nuvem ou revisão profissional.

Cada entrega deve incluir evidências, migração quando necessária e atualização deste índice/relatórios. Evitar testes que só copiam uma regra desconectada do componente real; testar integração e cenários negativos pertinentes.
