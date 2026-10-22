# 03 — Fluxos e experiência mobile

## Navegação base
**Início**: avatar simples/círculo com iniciais, progresso semanal, sessão programada/retomar, barra de marcos, atalho ao catálogo e ao calendário.
**Treinos**: abas "Meus treinos" e "Explorar"; busca por nome; filtros local, equipamento, modalidade, tempo, dificuldade candidata; editor.
**Planejamento**: semana visual com dias planejados, descanso completo e mobilidade opcional; reagendar com confirmação.
**Progresso**: semana/ciclo, histórico, sessões e repetição/tempo/atividade real, metas acompanhadas, exportar dados.
**Perfil**: objetivos ordenados, dias, equipamento, preferências, configurações de privacidade e importação/exportação.
**Assistente**: atalho opcional, não exigir IA para operar qualquer tela.

## Fluxo essencial: montar → iniciar → registrar
1. Pessoa entra na biblioteca e filtra por `sem equipamento`, `faixa longa`, `mini band`, `caminhada` ou `mobilidade`.
2. Escolhe um exercício ou uma estrutura de treino pendente de revisão apenas para testar o fluxo no modo de desenvolvimento, cria plano pessoal.
3. Define séries, alvo e descanso; salva versão; escolhe dia ou "Treinar agora".
4. Tela de execução mostra nome, etapa atual, instruções sem mídia se não licenciada, alvo previsto e botão grande **"Concluir série"**.
5. **Depois** de executar a série, surge painel "Quantas repetições você fez?" (ou "Qual duração realizou?"). Nenhum alvo planejado é presumido executado. Pessoa altera e confirma.
6. Persistir registro, iniciar descanso opcional, avançar. O app pode mostrar progresso depois da série, nunca exigir toque a cada repetição.
7. Sessão concluída -> feedback simples, histórico, próxima sessão e XP mínimo por conclusão única. Falha/reload -> retomar estado sem duplicações.

## Cinco estados da home
- `session_today`: mostrar treino de hoje e CTA "Iniciar".
- `session_in_progress`: CTA prioritário "Retomar" com série atual.
- `full_rest`: explicar valor do descanso; CTA "Ver próxima sessão". Movimento leve só opção condicionada e não obrigatória.
- `no_plan`: escolher criar, explorar modelos, inserir plano do profissional; nunca mapa vazio.
- `return_after_pause`: "Vamos reorganizar seu plano?" sem culpar a pessoa, conservar histórico e marcos.

## Criar treinos de várias origens
**Manual**: pode misturar modalidades, organizar exercícios e descanso.
**Modelo**: duplicar/editar; selo explícito `Em revisão` se seed demonstrativo, sem alegar recomendação profissional.
**Profissional**: entrada manual do nome/autoria, data/versão e movimentos; anotações e limites; não modificar automaticamente sem consentimento do profissional quando exigido.

## Recursos de hábito no MVP
- Planejar "quando e onde" com dias disponíveis; tela calendário.
- Feedback pós-sessão "você concluiu 2 das 2 sessões planejadas" em vez de ranking.
- Pequenos marcos por início, retorno e regularidade relativa ao plano; não exigir atividade diária.
- Lembretes apenas com autorização, e somente se implementados com comportamento confiável.
- Resumo semanal opcional da rotina; registrar esforço/conforto sem avaliação médica automática.
- Alternativas para dia de descanso: consultar progresso, revisar plano, escolher descanso completo; caminhada/mobilidade somente se apropriada/opt-in.

## Acessibilidade e mobile
- PT-BR integral, botões amplos, nav inferior, contraste alto, feedback de confirmação, fonte consistente.
- Não usar cor como único significado. Evitar microanimações na tela de concentração.
- Modo escuro pode vir de sistema; priorizar legibilidade.
- Testar Safari/iOS depois, mas primeiro Android Chrome e PWA offline.
