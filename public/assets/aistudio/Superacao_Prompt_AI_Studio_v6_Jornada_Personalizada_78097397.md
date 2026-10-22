# Superação — Prompt de implementação v6
## Nova fase: entrada, escuta, rotina personalizada e continuidade dos dados

Você está trabalhando no projeto EXISTENTE do aplicativo Superação no Google AI Studio. Implemente a evolução abaixo no código atual. Não crie outro aplicativo, não substitua o produto por um protótipo e não encerre apenas com um plano.

Leia este documento integralmente, inspecione a arquitetura real e execute em etapas verificáveis. Preserve identidade visual, dados e comportamentos positivos. Quando depender de configuração externa ou revisão profissional, registre a dependência e entregue um estado honesto, sem simular integração ou validação.

## 1. Objetivo do produto

O Superação ajuda a pessoa a construir uma rotina possível, registrar o que realmente realizou e perceber evolução em relação ao próprio histórico. Deve acolher iniciantes, pessoas retornando e praticantes regulares. Constância não significa treinar todos os dias; descanso, adaptação e retomada fazem parte da jornada.

A experiência central desta fase é: escolher como entrar → ser ouvido → revisar o próprio perfil → receber uma proposta explicável → ajustar e confirmar → acompanhar hoje e a semana → registrar resultados → revisar a rotina.

Conta e convidado devem receber a mesma qualidade de personalização. Conta acrescenta sincronização e recuperação quando essas funções estiverem realmente disponíveis. RPG, aventura, ranking social e ampliação de medalhas ficam fora desta fase.

## 2. Diagnóstico a verificar no código

As seguintes situações foram observadas na interface publicada; confirme a causa antes de alterar:

- Entrada direta como convidado e possibilidade de acessar início sem concluir a escuta.
- Início afirma que nenhuma rotina foi imposta, mas exibe programa Hábito Ativo em Casa ativo e meta de três atividades.
- Programa aparece sincronizado, enquanto a agenda pode estar livre/não definida.
- Perfil e catálogo distinguem mini band, faixa longa e tubos; assistente ainda agrupa esses equipamentos.
- Catálogo anuncia 879 exercícios, enquanto o assistente anuncia 876.
- Termos internos como peso_corporal e mini_band aparecem para o usuário.
- Progresso mantém Consistência de Ferro condicionada a três treinos, independentemente da disponibilidade individual.
- Permanecem expressões de autoridade como Prescrição inteligente & base científica, sem evidência de revisão apresentada.

Esses números são observações, não constantes para copiar. Derive contagens dos dados reais.

## 3. Auditoria inicial obrigatória

Antes da implementação, identifique: rotas; estado de autenticação; armazenamento local e remoto; valores iniciais e mocks; onboarding; perfil; programas; agenda; executor; histórico; catálogo; regras de geração; backups; dependências e testes existentes.

Localize a origem da ativação automática e de metas fixas. Determine se o assistente usa regras, templates, IA ou combinação; não anuncie IA onde não existe. Identifique quais dados remotos realmente estão protegidos por usuário.

Apresente um resumo breve dos achados e prossiga para a implementação. Reutilize o que funciona; não adote novas dependências ou uma reescrita geral sem necessidade concreta.

## 4. Porta de entrada e controle da jornada

Na primeira visita, antes de qualquer dashboard, mostre boas-vindas com benefício claro e três escolhas: Entrar; Criar conta; Continuar sem conta. Evite destaque que pressione cadastro. Informe de forma simples que sem conta os dados ficam neste navegador/dispositivo.

Se o provedor disponível for Google, use a autenticação real existente. Não crie campos de senha sem infraestrutura correspondente. Erro ou cancelamento deve preservar dados e permitir continuar sem conta.

Implemente estados explícitos de carregamento inicial, escolha de acesso, onboarding em andamento, proposta pendente de confirmação e experiência principal. Autenticação, completude do perfil e confirmação do plano são dimensões distintas.

Regras de roteamento:

- Primeira visita sem escolha de acesso: boas-vindas.
- Conta ou convidado com onboarding incompleto: retomar a etapa salva.
- Perfil completo e proposta não confirmada: revisão da proposta.
- Perfil e rotina confirmados: início personalizado.
- Usuário que escolheu cadastrar plano profissional ou montar manualmente: encaminhar ao fluxo correspondente; não forçar programa automático.
- Retorno com sessão em andamento: permitir retomada depois de carregar corretamente identidade e dados.

Não renderize o dashboard genérico atrás de um modal. Não permita contornar etapas por URL interna ou navegação inferior. Nunca exiba dados de outra conta durante a hidratação. Usuários existentes devem ter dados preservados e completar somente informações ausentes, sem onboarding integral obrigatório a cada atualização.

## 5. Escuta inicial para TODOS, inclusive convidados

Construa etapas curtas com progresso visível, voltar, salvamento automático e retomada. Diferencie campos necessários de opcionais. Não transforme ausência de resposta em ausência de limitação. Não pré-selecione respostas de saúde.

### A. Seu momento

Nome de preferência; começando/retornando/praticando; experiência com exercícios; motivo para usar o aplicativo. Não exija peso, medidas corporais ou data de nascimento completa sem finalidade necessária e explicada.

### B. Objetivos e prioridades

Seleção múltipla, ordenação acessível por botões de subir/descer e foco principal explícito. Permita equilíbrio entre objetivos ou foco em um ciclo. Não prometa resultados ou períodos clínicos. Objetivos devem influenciar a sugestão e ficar editáveis depois.

### C. Disponibilidade real

Dias da semana, duração disponível por dia, preferência de horário opcional, casa/academia/outro e flexibilidade para reagendar. Âncora de hábito é opcional. Não imponha três sessões. Permita adiar a escolha de dias, mas nesse caso não invente uma agenda: apresente rotina flexível e peça confirmação dessa modalidade.

### D. Equipamentos e ambiente

Use a taxonomia única do catálogo: peso corporal, mini band circular, faixa longa, tubos com pegadores, halteres, barra/anilhas, kettlebell, máquinas, polias e apoios relevantes. Diferencie o que a pessoa possui do que está disponível hoje. Um equipamento não substitui automaticamente outro. Sem equipamento compatível, mostre alternativa verificada ou explique a indisponibilidade.

### E. Anamnese inicial e cuidados

Inclua uma etapa de escuta sobre limitações informadas, movimentos evitados e orientações profissionais existentes, com finalidade clara e coleta mínima. Não implemente diagnóstico, liberação médica automática ou protocolos clínicos inventados. Não interprete texto livre com LLM como autorização para recomendar treino.

Perguntas clínicas, instrumentos padronizados, critérios de risco e encaminhamentos precisam de fonte e revisão profissional real. Se isso ainda não existir, marque a pendência no relatório técnico, limite a personalização ao escopo disponível e não apresente o app como clinicamente validado. Restrições não suportadas devem impedir sugestões incompatíveis; ofereça cadastrar plano profissional ou revisar a configuração, sem declarar toda atividade segura ou proibida.

Permita não informar dados opcionais; explique quando a ausência impede determinada recomendação. Não envie respostas sensíveis a serviços de IA, analytics ou logs por padrão. Explique armazenamento e sincronização de modo compatível com a implementação real.

### F. Escuta e preferências

Pergunte o que costuma dificultar a prática: tempo, começar, execução, desânimo ou outro. Campo opcional: “O que você gostaria que o Superação entendesse sobre você antes de começarmos?”. Preferências devem produzir consequências claras ou ser apresentadas apenas como notas, sem fingir interpretação automática.

### G. Resumo e proposta

Apresente os dados coletados em linguagem natural com edição por seção. Depois ofereça proposta de rotina, modelos compatíveis, montagem manual ou cadastro de plano profissional. Concluir o formulário não ativa um programa automaticamente.

## 6. Proposta explicável e confirmação

Cada proposta deve mostrar objetivos considerados, frequência, dias e duração, equipamentos, fichas e justificativa curta. Exemplo de estrutura: “Você informou duas janelas de 15 minutos em casa. Esta proposta ocupa esses dias e usa apenas os equipamentos selecionados”. Não use esse exemplo como ficha clínica pronta.

Valide compatibilidade de cada exercício, não somente o nome do programa. Estimativa de duração deve considerar séries, execução, descanso e transições com premissas documentadas. Se não couber, apresente alternativa; não corte descansos indiscriminadamente.

Botões: Confirmar minha rotina; Ajustar proposta; Ver outras opções. Programas sugeridos, confirmados, pausados e encerrados são estados diferentes. Só a confirmação ativa o programa e cria compromissos. Se nenhuma opção for compatível, informe isso e permita montagem orientada/manual; não invente uma correspondência.

Use regras verificáveis para restrições e compatibilidade. IA, se existente, pode ajudar na explicação, mas não pode contornar essas regras. Não altere planos profissionais automaticamente.

## 7. Início personalizado

Organize em: Hoje; ação principal; alternativas; semana; evolução relevante. Mostre nome, data e compromisso real. O início, agenda e progresso devem consultar a mesma rotina e os mesmos registros.

Estados de hoje: treino previsto, descanso planejado, dia livre, sessão em andamento, sessão parcial ou concluída. Botões pertinentes: Começar; Retomar; Adaptar duração; Trocar exercício; Reagendar; Descansar. Uma ficha rápida deve ser compatível com o perfil e ser opcional; não substitua o compromisso silenciosamente nem conte duas sessões pelo mesmo evento.

Mova entradas de criação para Treinos depois da configuração inicial. Sem programa confirmado, não exiba programa ativo nem meta fictícia. Não mostre medalhas e recordes como cobrança inicial.

## 8. Agenda e coerência temporal

Exiba datas, semana selecionada, navegação anterior/próxima e retorno a Hoje. Considere o fuso do usuário; não use UTC como dia civil de forma indiscriminada. Diferencie template semanal de compromissos datados.

Estados: livre, planejado, em andamento, parcial, concluído, reagendado, descanso e cancelado, conforme a modelagem real. Dia livre não recebe “Marcar treino como concluído”. Descanso não cria treino ou PR. Conclusão real deve vir dos registros; atividades externas podem ter um fluxo explícito próprio.

Reagendamento não duplica eventos. Alterar uma rotina deve indicar se afeta uma ocorrência ou as próximas, preservando histórico e sessões em andamento. Explique o denominador das métricas e evite alterá-lo retroativamente de forma silenciosa.

## 9. Perfil único e revisão da rotina

Permita editar objetivos e ordem, disponibilidade, experiência, equipamentos, preferências e cuidados informados. O assistente deve abrir com esses dados e permitir ajustes para hoje sem sobrescrever o perfil permanentemente.

Mudanças relevantes oferecem recalcular uma proposta; só a confirmação altera a rotina futura. Histórico permanece intacto. Faça revisão opcional ao fim de um ciclo ou por iniciativa do usuário: disponibilidade continua adequada? duração funciona? deseja ajustar? Não aumente carga, frequência ou dificuldade automaticamente porque houve um recorde.

## 10. Executor e evolução pessoal

Preserve confirmação de repetições/tempo APÓS a série; registro do realizado; retomada após recarregar; e encerramento sem registros sem gerar treino concluído ou medalhas.

Mostre planejado hoje e último resultado comparável, quando existir. Primeiro registro estabelece referência inicial. Considere exercício, variante, carga, unidade, equipamento e modo de execução nas comparações. Não compare apenas o maior número bruto. Sessões parciais devem ser reconhecidas sem se tornarem completas.

Adapte campos ao exercício: repetições, segundos, carga opcional e unidades relevantes. Não imponha atalhos em kg a toda prancha ou mobilidade. Permita corrigir registros e recalcular derivados sem duplicação. Ofereça “Pausar e voltar ao início” quando a saída anunciar pausa.

Progresso prioriza rotina pessoal, sessões reais, referências comparáveis e retomadas. Remova critério universal de três treinos e linguagem como Consistência de Ferro. Não conceda PR por descanso ou primeiro registro tratado como melhora. Percepção de esforço e confiança podem ser opcionais, sem virarem diagnóstico.

## 11. Catálogo e conteúdo

Unifique taxonomia e seletores no onboarding, perfil, assistente, catálogo e editor. Mostre primeiro exercícios compatíveis, com opção clara de explorar todos. Busca com acentos e sinônimos; nomes legíveis em português; contagens derivadas da base real. Se parte da base não estiver elegível ao assistente, explique a diferença.

Revise classificação por equipamento, especialmente mini band versus faixa longa. Não acrescente etiquetas em massa sem verificar execução. Preserve proveniência e status de revisão. Use o mesmo seletor com filtros no editor. Dados incompletos não devem ser promovidos como conteúdo aprovado.

Retire ou fundamente alegações científicas, terapêuticas e garantias absolutas. Diferencie modelo demonstrativo, sugestão adaptada por regras e plano cadastrado pelo usuário/profissional. Não afirme revisão profissional inexistente. Não amplie o catálogo nesta fase para esconder problemas de qualidade.

## 12. Persistência local e migração para conta

Separe cache de arquivos do aplicativo do armazenamento persistente dos dados pessoais. Inspecione a solução atual e escolha evolução proporcional; IndexedDB pode ser apropriado para dados estruturados, sem exigir troca de stack desnecessária. Trate falhas de gravação e modo privado; nunca confirme “salvo” antes de sucesso.

Salve perfil, rascunho do onboarding, proposta, confirmação, rotina, compromissos, sessões e registros com identificadores estáveis, versão de esquema e timestamps adequados. Não dependa apenas de estado em memória. Reload ou fechar a aba não deve reiniciar a escuta.

Ao convidado criar conta:

1. Autenticar realmente e preservar o conjunto local.
2. Apresentar os dados a vincular, sem expor detalhes sensíveis desnecessários.
3. Vincular ou migrar com mecanismo compatível com a infraestrutura existente.
4. Garantir repetição segura sem duplicar entidades.
5. Confirmar persistência remota antes de declarar sincronizado.
6. Se houver falha, manter dados locais e oferecer nova tentativa.

Conta já existente com histórico exige resolução explícita: manter conta, importar dados locais ou revisar conflitos, conforme suporte real. Não mescle silenciosamente dados de pessoas diferentes em dispositivo compartilhado. Não use nome/e-mail como chave de deduplicação. Sair de uma conta não pode expor seus dados à próxima.

Se usar autenticação anônima de backend, diferencie-a do convidado estritamente local e confira se o vínculo ao provedor é suportado. Não prometa sincronização se o backend não estiver configurado. Nunca apague dados locais como primeiro passo da migração.

Status visíveis e verdadeiros: Salvo neste dispositivo; Alterações pendentes; Sincronizando; Sincronizado; Falha ao sincronizar. O aviso de convidado deve explicar que apagar dados do navegador ou perder o aparelho pode eliminar o conteúdo local. Backup exportável e importação validada continuam disponíveis.

## 13. Arquitetura, privacidade e acessibilidade

Use uma fonte canônica para perfil, rotina, agenda e sessões; derive indicadores em vez de duplicar valores. Separe regras de negócio de componentes e efeitos de interface. Implemente migrações de esquema versionadas, validação de entrada, operações idempotentes e recuperação de falhas.

Se houver backend, valide autorização por usuário nas regras/servidor; filtro visual não é proteção. Não exponha segredos no cliente. Limite coleta e logs sensíveis. Não afirme conformidade legal, criptografia ou segurança de backup sem comprovar.

Preserve histórico existente. Não resete armazenamento para resolver bugs. Valores legados sem origem confirmada devem ser apresentados para revisão, sem apagar planos legítimos.

Use labels, foco visível, teclado, ordem de leitura, contraste e alvos de toque confortáveis. Modal deve ter nome acessível, botão fechar nomeado, Escape e retorno de foco. Onboarding deve funcionar no celular e com teclado, sem depender apenas de arrastar ou cor. Revise também textos truncados dos botões de duração do assistente.

Adicione versão do aplicativo e identificador/data da compilação no perfil. Diferencie isso da data atual. Explique no relatório como verificar que preview e publicação correspondem à versão testada. Atualização do aplicativo não pode limpar dados ou interromper silenciosamente uma sessão.

## 14. Ordem de implementação

1. Auditar fontes de dados, defaults e autenticação; criar proteção de migração e cenários de teste.
2. Implementar porta de entrada e controle de estados, sem dashboard antecipado.
3. Implementar escuta persistente, resumo e proposta confirmável.
4. Unificar rotina, início e agenda; remover programa e metas impostos.
5. Implementar continuidade local e vínculo com conta, incluindo conflitos e falhas.
6. Integrar perfil, assistente e catálogo; ajustar progresso e executor.
7. Revisar acessibilidade, conteúdo, regressões e identificação da versão publicada.

Entregue cada etapa funcional. Não mantenha botões de sucesso fictício. Se uma dependência bloquear parte da entrega, implemente o restante e descreva exatamente o bloqueio.

## 15. Critérios de aceite e testes

Execute em ambiente de teste isolado, com dados sintéticos explicitamente identificados. Não registre testes no histórico real do usuário. Informe para cada item: passou, falhou, não testado ou bloqueado, com cenário e evidência. Build bem-sucedido não comprova fluxos de produto.

1. Primeira visita limpa apresenta escolha de acesso antes do início.
2. Convidado é escolha explícita e passa pela escuta.
3. Login cancelado/falho mantém dados e oferece continuidade.
4. Reload no meio do onboarding retoma respostas e etapa.
5. Voltar permite corrigir respostas sem perder as demais.
6. Objetivos múltiplos podem ser ordenados por teclado.
7. Dados opcionais não são tratados como respostas negativas.
8. Resumo representa fielmente as respostas.
9. Nenhum programa é ativado antes da confirmação.
10. Pessoa com dois dias de 15 minutos recebe proposta compatível ou explicação de ausência de opção.
11. Pessoa com disponibilidade e equipamentos diferentes recebe proposta correspondente, com justificativa verificável.
12. Sem equipamento compatível, exercício não é incluído silenciosamente.
13. Restrição não suportada não é ignorada pelo gerador.
14. Plano profissional pode ser cadastrado sem substituição automática.
15. Confirmar proposta cria uma única rotina e seus compromissos.
16. Início, programa e agenda concordam sobre o que está ativo.
17. Agenda mostra datas corretas e navegação entre semanas.
18. Dia livre e descanso não geram treino concluído ou PR.
19. Reagendar não duplica compromisso nem sessão.
20. Alterar rotina preserva histórico e explicita alcance futuro.
21. Ficha curta respeita perfil e não substitui sessão sem confirmação.
22. Registro pós-série e unidades continuam funcionando.
23. Pausar/recarregar retoma sessão e séries reais.
24. Encerrar sem série não cria treino concluído; parcial permanece parcial.
25. Referência anterior aparece somente quando comparável.
26. Primeiro registro não é apresentado como melhora sobre histórico inexistente.
27. Duas sessões planejadas não são penalizadas por meta universal de três.
28. Perfil atualizado chega ao assistente; ajuste de hoje não sobrescreve perfil sem escolha.
29. Taxonomia e contagens são coerentes entre telas.
30. Mini band e faixa longa são filtradas conforme compatibilidade revisada.
31. Criar conta preserva perfil, agenda, histórico e sessão local.
32. Falha de rede durante migração preserva dados e permite retomada.
33. Repetir migração/sincronização não duplica registros.
34. Conta preexistente com dados provoca resolução explícita de conflitos.
35. Trocar de conta não mostra dados privados da conta anterior.
36. Backup inválido é rejeitado sem corromper dados; backup válido preserva relações.
37. Falha de armazenamento é informada sem falso estado de sucesso.
38. Modal fecha por Escape e devolve foco; controles têm nomes acessíveis.
39. Mobile não apresenta sobreposição do teclado, botões inacessíveis ou texto cortado.
40. Versão da compilação é visível e pode ser comparada com a publicação.

Testes de regras, integração e interface devem cobrir riscos reais, especialmente roteamento, datas, compatibilidade e migração. Reutilize a infraestrutura existente. Não marque cenários dependentes de autenticação real como testados se usou apenas mocks.

## 16. Entrega final obrigatória

Informe: mudanças implementadas; arquivos/áreas alterados; modelo de dados e migração; testes executados e resultados; pendências externas; conteúdo que aguarda revisão profissional; limitações reais de offline e sincronização; identificação da versão; instruções para conferir a publicação.

Não diga “tudo concluído” se existem critérios não testados. Não invente evidências, fontes, validação médica ou integração de login. Preserve a identidade acolhedora do Superação e faça as respostas do usuário determinarem de fato sua experiência.
