# Decisões e regras de domínio

Especificação desejada, não descrição integral da implementação atual. Consulte o estado de testes para saber o que foi demonstrado.

## Entidades e fronteiras

| Conceito | Contrato |
|---|---|
| Perfil | Objetivos ordenados, disponibilidade, experiência, recursos e contexto informado |
| Proposta | Sugestão revisável ligada à versão do perfil; sem ativação automática |
| Rotina confirmada | Plano aceito e suas versões futuras |
| Compromisso | Ocorrência com data civil local, tipo e ficha opcional, identificador estável |
| Sessão | Execução real vinculada a um compromisso específico ou explicitamente avulsa |
| Série | Resultado confirmado pelo usuário, unidade e variante pertinentes |
| Marca inicial | Primeira referência válida, sem alegar melhora |
| PR | Melhora segundo condições comparáveis e regra conhecida |
| Conquista | Derivação recalculável dos fatos, com regra e deduplicação |

Templates no catálogo não contam como rotinas do usuário. Autenticação, completude da escuta e confirmação do plano são estados distintos.

## Invariantes

1. Registrar só depois da execução confirmada; navegar entre exercícios não conclui série.
2. Sessão vazia não gera treino concluído, PR ou medalha.
3. Sessão parcial permanece identificável e não equivale silenciosamente a uma completa.
4. Executar uma ficha de outro dia não conclui o compromisso de hoje por coincidência de data. Origem deve ser preservada ou ajustada explicitamente.
5. Descanso não gera treino nem PR. Check-in, caso exista, é evento distinto.
6. Marca inicial não recebe conquista de melhora sobre histórico inexistente.
7. Uma parcial curta de ficha normal não vira modalidade rápida só pela duração.
8. Todas as telas calculam métricas a partir dos mesmos eventos e critérios.
9. Repetir confirmação, importação, gravação ou sincronização não duplica entidades.
10. Alterar perfil ou rotina oferece revisão do futuro, sem apagar passado ou sessão em andamento.
11. Programa com frequência diferente da disponibilidade exige revisão antes de ativar; atividades extras são opt-in.
12. Falha de persistência deve aparecer; só mostrar sincronizado após confirmação real.

## Personalização e compatibilidade

Assistente inicializa com o perfil válido; ajustes apenas para hoje ficam separados. Objetivos têm correspondência explícita com as regras do gerador. Distinguir resistência (peso corporal) de recursos obrigatórios (barra fixa, banco, cadeira, parede). Todos os requisitos necessários devem existir; requisitos desconhecidos não tornam exercício universalmente elegível. Modelar alternativas explicitamente.

Mini band, faixa longa e tubos não são intercambiáveis. Usar a mesma regra em proposta, gerador, substituição, opção rápida e seletores pertinentes. Auditar nome, imagem, instrução, equipamento e nível; seleção aleatória sem um exercício incompatível não comprova o filtro.

Tempo estimado deve considerar execução, séries, descanso e transições. Explicar sequência consecutiva versus circuito. Não rotular toda ficha como 15 min nem reduzir descansos arbitrariamente para caber.

## Métricas e dados

Separar treinos completos, parciais, atividades e cumprimento dos compromissos. Explicar denominadores e semana inicial parcial. Não alterar retrospectivamente metas sem informação. Comparar exercício/variante/equipamento/carga/unidade conforme regra; maior repetição entre cargas diferentes não é automaticamente PR.

LocalStorage, cache de assets, cache de dados e persistência remota têm funções diferentes. A arquitetura final deve ser conferida no código; não presumir que propostas antigas de Firestore já estão implementadas. Contas e dados locais de pessoas diferentes não podem ser mesclados silenciosamente. Origens ai.studio e web.app não compartilham armazenamento: continuidade exige exportação/importação suportada ou sincronização real.
