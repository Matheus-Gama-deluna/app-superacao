# Superação v7 — Plano e prompt de melhorias

Base: análise da interface publicada em https://superacao-app-65.web.app/, identificada como v6.0.0, build 2026-10-22. Este documento orienta a evolução do projeto existente; não é uma solicitação para criar outro app.

## Parte A — Plano da fase

### Resultado esperado

Uma pessoa escolhe entrar como convidado ou com conta, informa seu contexto, recebe uma proposta compatível, ajusta e confirma. O início e a agenda passam a mostrar essa mesma rotina. A execução registra o realizado e o progresso respeita os compromissos individuais.

O objetivo é completar e verificar essa jornada. Não ampliar catálogo, gamificação, RPG ou funcionalidades sociais nesta fase.

### Evidências e limites da rodada anterior

Confirmado: porta de entrada; onboarding de sete etapas; objetivos ordenáveis; seleção de dois dias e 15 minutos; separação dos elásticos; retomada do onboarding após reload; resumo fiel de parte das respostas; ausência de programa ativado automaticamente; retomada do executor; sessão sem séries sem gerar histórico ou medalhas.

Falhas reproduzidas:

- Escolher proposta personalizada no resumo leva ao início. O botão Ver Proposta no início não abriu nada.
- Assistente abriu com apenas peso corporal, 25–30 minutos e Hábito & Saúde, apesar de mini band, 15 minutos e força/mobilidade como prioridade no onboarding.
- Ficha gerada incluiu Wind Sprints, classificado como peso corporal, mas cuja instrução exige barra suspensa não informada pelo usuário.
- Motivo, três dias e um objetivo já vêm preenchidos/selecionados; remoção do objetivo inicial não ficou clara.
- Resumo não apresenta adequadamente cuidados e obstáculos. Etapa de cuidados permite avançar sem resposta; tratamento dessa ausência não foi verificado.
- Agenda sem datas/navegação e dias livres com Marcar como concluído.
- Início usa meta de duas atividades; medalha continua exigindo três treinos universais.
- Nomes em inglês, códigos internos, tradução inadequada, duração truncada, controles sem nome acessível e ausência de ação explícita de pausa.

Não testado: autenticação, migração de convidado para conta, sincronização, offline, importação de backup e comparação com histórico real. Esses itens não podem ser declarados funcionais com base nessa rodada.

### Etapas e condições de conclusão

| Etapa | Entrega | Condição para avançar |
|---|---|---|
| 1. Proposta | Fluxo único do resumo até revisão e confirmação, com estados de erro | Proposta abre pelos dois pontos de entrada e não ativa antes de confirmar |
| 2. Perfil e regras | Assistente herda respostas; exercícios exigem recursos conhecidos | Perfil sintético de dois dias/15 min é respeitado; exercício que exige barra é excluído sem barra |
| 3. Rotina e agenda | Confirmação cria compromissos datados; início mostra hoje | Confirmar novamente/recarregar não duplica eventos; reagendar preserva histórico |
| 4. Escuta e edição | Respostas explícitas, resumo completo, edição do perfil | Ausência de informação não equivale a ausência de limitação; mudanças propõem revisão futura |
| 5. Execução e progresso | Pausa explícita, campos pertinentes e metas individuais | Sessão vazia não pontua; parcial não vira completa; duas sessões planejadas são tratadas corretamente |
| 6. Conteúdo e entrega | Seleção revisada de exercícios, acessibilidade e identificação de build | Jornada principal testada, regressões verificadas e pendências documentadas |

### Política de escopo

Preservar identidade visual e dados. Priorizar exercícios revisados nas sugestões, mantendo o restante do catálogo explorável com status honesto. Não reescrever a aplicação nem trocar a stack sem causa técnica concreta. Separar a correção desta jornada da validação completa da infraestrutura de contas, mas não regredir autenticação ou persistência existentes.

### Cenário principal de homologação

Perfil sintético, sem informações reais de saúde: retornando à prática; força funcional e mobilidade em primeiro lugar; hábito em segundo; segunda e quinta; 15 minutos; casa; peso corporal e mini band; pouco tempo como obstáculo. Informações de cuidados não preenchidas devem permanecer explicitamente não informadas.

Concluir somente quando esse perfil puder revisar uma proposta compatível, confirmá-la, encontrá-la no início e na agenda e iniciar uma sessão. Testes de resultados devem usar ambiente isolado e dados sintéticos.

---

## Parte B — Prompt para o Google AI Studio

Você está trabalhando no código EXISTENTE do Superação. Implemente esta fase sobre a versão atual, preservando dados, identidade visual e comportamentos já corretos. Leia todo este documento e use a Parte A como plano de entrega. Não encerre com planejamento, telas demonstrativas ou botões sem comportamento real.

### 1. Inspeção inicial e sequência

Inspecione rotas, componentes, stores, persistência, gerador, catálogo, taxonomia, agenda, executor, autenticação, backups e testes. Identifique as causas reais das falhas registradas. Não presuma nomes de arquivos ou que uma mudança visual resolveu a regra.

Liste brevemente causas e pontos de alteração e implemente na ordem da Parte A. Reutilize a infraestrutura atual. Se algo depender de configuração externa, explique o bloqueio e implemente o restante sem simular sucesso.

### 2. Corrigir a proposta personalizada como fluxo principal

O resumo do onboarding e o cartão Ver Proposta no início devem abrir a MESMA proposta persistida. Evite dois geradores independentes com resultados diferentes.

Estados explícitos: perfil em preenchimento; pronto para sugerir; gerando proposta; proposta disponível; erro; confirmação; rotina ativa. Um erro não pode marcar a rotina como confirmada. Clique não pode terminar silenciosamente no dashboard. Apresente carregamento, erro legível, tentar novamente e voltar para corrigir respostas.

Antes de ativar, mostre:

- Objetivos e sua ordem.
- Dias, frequência, duração e equipamentos considerados.
- Fichas e exercícios, séries, repetições ou duração e descansos.
- Estimativa de tempo e suas premissas.
- Justificativa baseada em dados efetivamente utilizados.
- Limitações e informações não fornecidas que afetem o alcance da sugestão.

Ações: Confirmar minha rotina; Ajustar proposta; Rever respostas. Permita trocar exercícios compatíveis e ajustar dias/tempo sem perder o resto. Após ajuste, revalide a proposta.

Só a confirmação cria/ativa a rotina. Use identificadores estáveis e operação repetível sem duplicação. Reload mantém a proposta pendente. Se o perfil mudar depois de gerada, marque-a para revisão ou regenere com explicação; não confirme uma proposta desatualizada silenciosamente.

Sem opção compatível, explique a indisponibilidade e ofereça edição/manual/plano profissional. Não invente correspondência. Sugestão automatizada não equivale a prescrição clínica.

### 3. Fazer o assistente usar o perfil

Ao abrir, inicialize com equipamentos, duração, experiência e objetivos reais. Não volte para defaults antigos em efeitos ou rerenders. Crie correspondência explícita e documentada entre objetivos do onboarding e critérios do gerador; não converta força/mobilidade em outra categoria sem explicação.

Separe perfil habitual, parâmetros desta proposta e ajustes apenas para hoje. Alterar uma sessão não altera permanentemente o perfil sem escolha explícita. Campos devem oferecer controles que expressem seleção de modo acessível, como aria-pressed ou checkbox conforme apropriado.

Se houver múltiplos objetivos, preserve sua ordem e explique o que foi considerado. Não anuncie personalização de um campo que o algoritmo ignora. Não adote LLM como substituto das regras de compatibilidade.

### 4. Corrigir o modelo de compatibilidade dos exercícios

Separe resistência, equipamentos obrigatórios, apoios/ambiente, variantes e modo de registro. Exemplo: resistência de peso corporal com barra fixa obrigatória. Preserve a identidade dos exercícios ao migrar campos existentes.

Implemente regra única usada por gerador, substituições, proposta, opção rápida e filtros. Todos os requisitos obrigatórios precisam estar disponíveis. Para conjuntos alternativos de equipamentos, modele alternativas explicitamente; não aceite qualquer interseção simples. Campo ausente significa requisito desconhecido, não compatibilidade universal.

Audite Wind Sprints e todos os exercícios selecionáveis automaticamente. Confira nome, instruções, imagens e requisitos; se houver conflito, retire da seleção automática até revisão. Não invente correções por dedução nem altere etiquetas em massa para obter mais resultados.

Mini band circular, faixa longa e tubos com pegadores não são intercambiáveis. Apoios como barra, cadeira, banco e parede também contam como recursos. Diferencie barra fixa de barra com anilhas.

Use inicialmente uma seleção curada, com proveniência e status de revisão. O restante pode continuar acessível no catálogo sem ser apresentado como revisado. Identifique qual revisão foi realmente realizada e por quem; não atribua aprovação profissional fictícia.

Se não houver cobertura suficiente, sugira alternativas verificadas ou explique a limitação. Ter mini band não obriga usar mini band em toda ficha; a justificativa deve ser fiel. Seleção de exercícios precisa considerar diversidade pertinente aos objetivos, sem confundir quatro exercícios aleatórios com uma rotina planejada. Documente regras e limites, sem inventar protocolos de saúde.

### 5. Estimativa de tempo verificável

Calcule duração a partir de séries, tempo de execução estimado, descansos e transições. Diferencie repetições e exercícios cronometrados. Documente pressupostos; não rotule arbitrariamente qualquer ficha como 15 minutos.

Se a proposta não couber, reduza ou troque conteúdo por regras válidas ou informe que não foi possível. Não reduza descanso indiscriminadamente para fazer o número caber. Mostre estimativa, não promessa exata.

### 6. Integrar rotina, início e agenda

Use uma rotina canônica confirmada e compromissos com data. Derive início e progresso dos mesmos eventos e registros. Não mantenha arrays independentes que divergem.

Ao confirmar, mostre revisão dos dias/data de início e crie as ocorrências segundo horizonte explícito. Considere fuso local e não transforme datas civis em outro dia por conversão UTC. Defina como a semana parcial inicial é contada. Mantenha template semanal separado das ocorrências.

Agenda: datas completas, semana anterior/próxima, Hoje e estados distintos para livre, planejado, descanso, em andamento, parcial, concluído, reagendado e cancelado conforme necessário. Dia livre não oferece concluir treino. Descanso não gera série, PR ou treino concluído.

Início: compromisso de hoje, Começar/Retomar e alternativas pertinentes. Sem rotina confirmada, foco em revisar proposta; evite marcos e metas que pareçam compromissos já assumidos. Dia livre deve ser mostrado como livre, sem impor treino. Opção rápida deve ser validada com as mesmas regras e não substituir/duplicar compromisso silenciosamente.

Reagendar altera uma ocorrência e mantém rastreabilidade. Ao editar recorrência, perguntar alcance: esta ocorrência ou próximas. Preservar histórico e sessão em andamento. Não alterar retrospectivamente a meta de uma semana sem explicação.

### 7. Aperfeiçoar escuta, resumo e perfil

Remova respostas pessoais pré-preenchidas, especialmente motivo e objetivos. Dias sugeridos só devem ser assumidos por aceitação explícita. Permita remover e reordenar objetivos; não use dois IDs para o mesmo conceito com rótulos diferentes. Não mantenha objetivo inicial impossível de remover.

Ofereça duração por dia quando necessário, com padrão comum editável. Não exija âncora de hábito. Resumo deve incluir momento, objetivos, disponibilidade, equipamentos, cuidados informados/não informados, obstáculos e observações, com edição direta e retorno ao resumo preservando respostas.

Etapa de cuidados: não converter pular em “nenhuma limitação”. Não pré-selecionar respostas. Evitar afirmação “movimentos seguros” como garantia. Perguntas clínicas e regras de encaminhamento exigem revisão profissional e origem verificável. Não inventar diagnóstico, autorização médica ou protocolo. Não enviar notas sensíveis a IA/analytics/logs por padrão.

Perfil deve permitir editar todas as informações relevantes depois, não só nome/âncora/equipamentos. Mudanças relevantes oferecem revisar proposta e compromissos futuros, sem sobrescrever histórico nem planos profissionais.

### 8. Executor e métricas coerentes

Preserve registro real após série, retomada após reload e sessão sem séries sem pontuação. Acrescente Pausar e voltar ao início com retomada explícita. Evite texto que promete uma ação inexistente.

Adapte formulário ao exercício: repetições, segundos e carga quando pertinente. Esclareça convenção de carga quando aplicável; não mostre atalhos universais em kg para qualquer movimento. Navegar para próximo exercício não registra série automaticamente.

Estados de sessão devem diferenciar vazia, parcial, concluída e pausada. Não converter parcial em completa. Registros corrigidos recalculam indicadores sem duplicação.

Progresso deve refletir compromissos pessoais datados. Remova exigência universal de três treinos. Diferencie cumprimento de sessões, atividades opcionais e desafios. O número de marcos não deve parecer meta de treinos. Descanso é legítimo, mas não produz treino fictício.

Primeiro registro estabelece referência; PR posterior exige condições comparáveis (exercício, variante, equipamento, carga e unidade). Não progrida dificuldade automaticamente após recorde. Se histórico estiver vazio, mostre orientação acolhedora e sem pressão.

### 9. Conteúdo e acessibilidade

Revise primeiro os exercícios usados nas propostas. Traduza nomes e instruções preservando significado; corrija frases como “Amasse o mais alto que puder”. Quando a tradução não for confiável, exclua da seleção automática até revisão. Confirme correspondência entre imagem e texto.

Mapeie códigos internos para rótulos em português. Contagens derivadas da base; se elegíveis ao gerador forem menos que catálogo, explique a diferença. Não anuncie todos os 879 como utilizáveis se parte estiver sem revisão.

Remova ou fundamente alegações como base científica, garantias de segurança e promessas terapêuticas. Demonstre proveniência e diferencie sugestões, modelos demonstrativos e plano profissional cadastrado.

Corrija durações truncadas, controles de fechar sem nome, Escape, foco e navegação por teclado. Use diálogos semânticos, foco contido e devolução ao disparador. Verifique mobile com teclado aberto, rolagem do modal, botões fixos e ausência de sobreposições.

### 10. Dados, contas e mudança de domínio

Não limpe armazenamento para corrigir estado. Evolua esquema com migração versionada, backup quando apropriado e preservação de IDs. Não marque Salvo/Sincronizado antes da confirmação real da gravação.

O domínio antigo ai.studio e o novo web.app não compartilham automaticamente armazenamento local. Não tente ler armazenamento de outra origem nem prometa migração automática inexistente. Prepare continuidade por exportação no endereço antigo/importação validada no novo, ou sincronização real quando disponível. Se não houver acesso ao código antigo, registre essa dependência e faça o novo aceitar formatos suportados.

Importação deve validar formato/versão, mostrar resumo e conflitos, não sobrescrever silenciosamente e permitir recuperação em falha. Não mesclar dados de pessoas diferentes. Idempotência deve evitar duplicação ao importar novamente.

Não declare login/migração/sincronização/offline como aprovados sem testes específicos. Preserve funções existentes e registre limites. Credenciais nunca no código cliente; autorização deve existir no backend quando houver dados remotos.

### 11. Testes de aceite

Use ambiente isolado e perfis sintéticos. Não inserir resultados no histórico real do usuário. Reutilize testes existentes e acrescente testes relevantes para regras e integração. Para cada item, reporte passou/falhou/não testado/bloqueado com evidência, não apenas “build passou”.

1. Fluxo limpo continua exibindo escolha de acesso antes do início.
2. Reload em cada etapa relevante preserva respostas e etapa.
3. Objetivo inicial pode ser removido; ordenação reflete no resumo e no gerador.
4. Cuidados não preenchidos permanecem não informados.
5. Resumo contém cuidados, obstáculos e observações, com edição preservada.
6. Ver Proposta no onboarding abre a revisão, sem ativar rotina.
7. Ver Proposta no início abre a mesma proposta.
8. Erro de geração tem mensagem e nova tentativa sem perda de dados.
9. Reload na proposta não a perde nem a confirma.
10. Perfil de dois dias/15 min/mini band é herdado pelo assistente.
11. Ajuste só para hoje não modifica perfil habitual.
12. Objetivos múltiplos têm correspondência verificável com a geração.
13. Wind Sprints com barra obrigatória não é oferecido sem barra.
14. Outro exercício de peso corporal com apoio obrigatório também é filtrado corretamente.
15. Requisito desconhecido exclui exercício da seleção automática.
16. Mini band não habilita faixa longa ou tubos automaticamente.
17. Substituição e opção rápida respeitam as mesmas regras.
18. Nenhuma alternativa compatível produz explicação, não ficha fictícia.
19. Estimativa de tempo é calculada e proposta respeita o limite ou explica impossibilidade.
20. Confirmar cria rotina e ocorrências uma única vez.
21. Início e agenda mostram os mesmos compromissos e datas.
22. Semana parcial e fuso não deslocam dias ou criam metas impossíveis.
23. Reagendamento e edição futura preservam histórico e não duplicam eventos.
24. Dia livre/descanso não oferece concluir treino nem gera PR.
25. Pausar volta ao início e Retomar recupera exercício e registros.
26. Navegar entre exercícios sem registrar não adiciona séries.
27. Sessão vazia não pontua; sessão parcial é identificada como parcial.
28. Formulários usam campos/unidades pertinentes.
29. Duas sessões planejadas e realizadas não dependem de terceira para cumprimento semanal.
30. Primeiro registro e PR comparável são diferenciados.
31. Perfil permite revisar informações completas e propõe alterações futuras sem apagar passado.
32. Seleção curada não contém conflito conhecido entre instrução, imagem e equipamento.
33. Modais têm nome, botão fechar acessível, Escape e foco correto.
34. Mobile não corta botões de duração nem encobre ações com teclado/navegação fixa.
35. Importação suportada preserva relações e repetição não duplica dados.
36. Backup inválido não altera dados existentes.
37. Dados antigos migram de esquema sem reset.
38. Build identificável corresponde à versão publicada testada.

Acrescente regressões para conta/convidado conforme infraestrutura disponível. Cenários de login real, isolamento de contas, falha de rede e offline devem ser rotulados corretamente se não executados.

### 12. Entrega e relatório final

Entregue código funcional, migrações necessárias, testes e instruções de verificação. Relatório curto deve conter:

- Causas encontradas e correções, com áreas/arquivos alterados.
- Regras efetivamente usadas na proposta e compatibilidade.
- Exercícios revisados, excluídos e pendentes, sem falsa aprovação profissional.
- Resultado individual dos critérios de aceite.
- Limites de autenticação, persistência, sincronização e migração entre domínios.
- Versão/build testada e forma de conferir a publicação.

Não adicione novas grandes funcionalidades para compensar fluxos quebrados. A fase estará completa quando a escuta produzir uma proposta utilizável, confirmada conscientemente e refletida na rotina diária, com exercícios compatíveis e registros confiáveis.
