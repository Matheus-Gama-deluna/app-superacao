# Superação — Planejamento consolidado da próxima fase (v8)

Data: 22/10/2026. Documento de planejamento; não representa funcionalidades implementadas ou homologadas.

## 1. Objetivo e decisão de escopo

Completar uma jornada coerente: acesso → escuta → proposta → confirmação → compromissos → execução real → evolução pessoal. A próxima fase deve corrigir as relações entre esses elementos antes de ampliar funcionalidades.

O Superação deve ajudar a construir uma rotina possível, acompanhar o realizado e reconhecer evolução sobre o próprio histórico. Descanso, retomada, adaptação e sessões parciais são legítimos; cada um precisa ter significado claro. Não obrigar três sessões universais, transformar primeiro registro em melhora ou gerar cobranças artificiais.

Preservar identidade visual, dados e comportamentos corretos. Fora desta fase: RPG/aventura, ranking social, novos pacotes extensos de exercícios e reescrita geral da aplicação. Autenticação, sincronização, backups e offline permanecem como frentes de verificação, sem serem declaradas prontas por suposição.

## 2. Base de evidências e limites

Fontes: navegação e testes manuais no navegador em nuvem em https://superacao-app-65.web.app/; rodadas anteriores visíveis na conversa; relatório de implementação v7 enviado pelo usuário em Texto colado.txt.

A interface inicialmente exibiu v6.0.0 e posteriormente v7.0.0, ambas com build de 22/10/2026. Algumas alterações foram observadas, outras continuaram falhando. Não há prova suficiente para atribuir todas as diferenças a cache, publicação ou migração. A identificação de versão, sozinha, não comprova a origem do código servido.

O relatório declara 51 testes automatizados e aprovação dos 38 critérios. Não houve inspeção independente do código nem execução desses testes nesta rodada. Algumas evidências descritas no relatório são inspeções de implementação, não testes completos do comportamento.

### Ambiente efetivamente utilizado

- Perfil local sintético: Teste de revisão, sem conta conectada.
- Criado na rodada anterior: retorno à prática; força funcional/mobilidade como primeira prioridade; hábito como segunda; segunda e quinta; 15 minutos; casa; peso corporal e mini band; pouco tempo como obstáculo.
- Sem informações pessoais reais de saúde. Cuidados não preenchidos no cenário original.
- Na última rodada foi ativado Hábito Ativo em Casa e salva uma série sintética de Gato e Vaca, dez repetições, encerrada como parcial. Os dados permaneceram nesse perfil local.
- Não foi feita nova instalação com armazenamento limpo nem reset do perfil existente. Não confundir nova aba com ambiente novo.

### Como classificar os resultados

Observado: apareceu ou foi reproduzido na interface. Hipótese: possível explicação ainda sem confirmação no código. Proposto: decisão desejada para esta fase. Pendente: não testado ou não demonstrado. Não converter ausência de evidência em falha comprovada.

## 3. Fundamentos que devem ser preservados

| Fundamento | Evidência e limite |
|---|---|
| Escolha de acesso | Entrada com convidado, criar conta e entrar observada na rodada da v6; revalidar instalação limpa na próxima versão |
| Escuta estruturada | Sete etapas, objetivos ordenáveis e resumo de parte das respostas observados anteriormente |
| Retomada do onboarding | Reload preservou etapa e dias na rodada anterior; revalidar após mudanças de esquema |
| Equipamentos separados | Mini band, faixa longa e tubos presentes no perfil e no assistente |
| Ausência de ativação inicial | Antes do teste de ativação, não havia programa ativo no perfil migrado |
| Editor com filtros | Seletor ganhou filtros de equipamento e músculo na última rodada |
| Registro após a série | Confirmação de execução real aparece depois de Concluir Série |
| Retomada do executor | Navegar ao segundo exercício e recarregar preservou posição |
| Sessão vazia | Descarte sem séries não criou histórico ou medalhas nas rodadas verificadas |
| Sessão parcial | Último teste apareceu como Parcial, uma série, no histórico; contador de treinos concluídos permaneceu zero |
| Persistência local | Programa e resultados sintéticos permaneceram após reload; não comprova offline nem nuvem |

## 4. Inventário consolidado de achados

P0: bloqueia a jornada ou atribui resultados incorretos. P1: personalização e regras centrais. P2: clareza, acabamento e ampliação da cobertura. As causas abaixo devem ser investigadas; não são diagnóstico de código.

| ID | Prioridade | Achado observado ou pendência | Encaminhamento |
|---|---|---|---|
| J01 | P0 | Ver Proposta no início do perfil existente não abre | Corrigir roteamento/estado e recuperação de proposta legada; testar usuário novo e migrado |
| J02 | P1 | Assistente abre com apenas peso corporal, 25–30 min e Hábito | Herdar perfil, explicitar correspondência de objetivos e separar ajuste de hoje |
| J03 | P1 | Perfil não oferece edição completa ou refazer escuta nas telas observadas | Editor por seção, retomada e revisão futura sem reset |
| J04 | P1 | Na rodada anterior havia motivo/dias/objetivo pré-preenchidos | Revalidar em ambiente limpo; respostas explícitas, remover objetivos e defaults assumidos |
| J05 | P1 | Resumo anterior incompleto para cuidados/obstáculos; correção declarada não revalidada | Exibir informado/não informado e edição direta |
| R01 | P0 | Programa de catálogo ativado diretamente em Seg/Qua/Sex, com recuperação no fim de semana | Revisão prévia e resolução da diferença para disponibilidade Seg/Qui |
| R02 | P0 | Sessão parcial da ficha A marcou descanso de quinta como realizado | Relacionar execução ao compromisso correto ou registrá-la como avulsa |
| R03 | P1 | Agenda sem datas/navegação e dias livres/descanso com concluir | Ocorrências datadas, tipos distintos e ações pertinentes |
| R04 | P1 | Meta do início mudou de 2 para 3 após ativação sem negociação | Confirmar mudança de rotina e derivar meta de compromissos aceitos |
| E01 | P0 | Primeiro registro sintético gerou PR e Superação de Limites | Referência inicial distinta de melhora comparável |
| E02 | P1 | Parcial de ~1 min de ficha normal concedeu Constância Flexível | Definir elegibilidade por modalidade/resultado, não só duração curta |
| E03 | P0 | Histórico: zero concluídos; início: 1/3 após mesma parcial | Separar sessões completas, parciais e atividades; rótulos e cálculos canônicos |
| E04 | P1 | Não apareceu Pausar e voltar ao início, com zero ou uma série | Ação explícita preservando estado e retomada no início |
| E05 | P1 | Série 1 de 2 de Gato e Vaca; descanso anunciou outro exercício | Verificar se circuito ou erro de sequência; explicar organização |
| E06 | P1 | Formulário de Gato e Vaca oferece carga/atalhos em kg | Campos e unidades adequados por exercício e variante |
| C01 | P1 | Ficha Hábito incluiu salto lateral e flexão pliométrica | Demonstrar critérios de experiência, complexidade e seleção; não inferir adequação clínica |
| C02 | P1 | Wind Sprints com barra era incompatível na rodada anterior | Correção declarada não homologada exaustivamente; regressão direta e outros apoios |
| C03 | P1 | Requisitos/classificações adicionais parecem inconsistentes | Auditoria de correspondência entre nome, imagem, instruções e recursos; confirmar caso a caso |
| C04 | P2 | Inglês/códigos/traduções misturadas persistem | Revisar seleção automática primeiro; rótulos legíveis no catálogo/editor |
| C05 | P2 | Editor anuncia 876; catálogo 879 | Contagens calculadas e explicação de subconjuntos |
| U01 | P1 | Plano profissional abre com indicação profissional desmarcada | Preservar intenção e distinguir autoria declarada de validação profissional |
| U02 | P2 | Ficha vazia anuncia 5 minutos | Sem estimativa até haver conteúdo; tempo calculado |
| U03 | P1 | Escape não fecha seletor; fechar sem nome acessível | Diálogo semântico, foco, teclado e regressão de todos os modais |
| U04 | P2 | Duração Express (12-15 aparece incompleta | Texto completo e teste visual em larguras reais |
| U05 | P2 | Base científica e linguagem de prescrição ainda visíveis | Remover alegação sem sustentação ou apresentar fonte/revisão real |
| D01 | P1 | Versão v7 coexistiu com falhas descritas como corrigidas | Vincular release a commit/build e testar artefato publicado |
| D02 | P1 | Migração entre versões não demonstrada no caminho existente | Fixtures v6/v7 e reparação sem apagar dados |
| D03 | P1 | Login, migração de conta, nuvem, offline e backups não homologados | Suíte específica com falhas e limites declarados |

## 5. Caso obrigatório de regressão: uma série parcial

### Reprodução observada

1. Perfil sintético inicialmente com dois dias, 15 minutos, peso corporal e mini band.
2. Ativar Hábito Ativo em Casa pelo catálogo: programa marcou Seg/Qua/Sex e recuperação Sáb/Dom, sem diálogo de adaptação.
3. Na quinta-feira, iniciar ficha A pela agenda de segunda.
4. Registrar dez repetições da primeira série de Gato e Vaca.
5. Encerrar como parcial.

Resultado: histórico Parcial, uma série, ~1 min; zero treinos concluídos; início 1/3; descanso de quinta marcado; PR de dez repetições; medalhas Constância Flexível e Superação de Limites. Persistiu após reload.

### Resultado desejado

O evento iniciado deve conservar sua origem. Iniciar ficha de outro dia não autoriza concluir o compromisso de hoje. Deve oferecer executar aquela ocorrência, reagendar ou fazer avulso, com significado claro. A parcial registra somente o realizado, sem concluir automaticamente o compromisso inteiro. Primeiro registro é referência, sem medalha de melhora. Uma parcial curta de ficha comum não vira modalidade rápida. Início, agenda e progresso apresentam os mesmos fatos com rótulos consistentes.

## 6. Contrato de produto e dados proposto

Os nomes abaixo são conceitos; adaptar ao esquema real sem reescrita desnecessária.

| Conceito | Responsabilidade | Regra principal |
|---|---|---|
| Perfil | Preferências, disponibilidade e contexto informado | Não é substituído por ajustes avulsos |
| Proposta | Sugestão revisável vinculada a uma versão do perfil | Não ativa rotina; invalidação/revisão explícita após mudança relevante |
| Rotina confirmada | Plano aceito e versões futuras | Mudanças exigem confirmação e alcance claro |
| Compromisso | Ocorrência em data local, tipo e ficha opcional | ID estável; descanso não é treino |
| Sessão | Execução real, origem e estado | Pode vincular compromisso ou ser avulsa; vínculo não muda pelo dia atual |
| Registro de série | Resultado real, unidade, variante e ordem | Navegação não cria execução; correção recalcula derivados |
| Referência e PR | Primeira marca e melhora comparável | Não comparar condições incompatíveis |
| Conquista | Reconhecimento derivado de regra versionada | Recalculável, sem duplicação e sem criar fatos |

Estados do fluxo: escuta em andamento → proposta pendente → rotina confirmada. Separar autenticação, visualização e conteúdo: quantidade de templates não comprova rotina do usuário.

Sessão: em andamento/pausada, concluída parcial, concluída integral, abandonada sem séries, com regras de transição explícitas. Compromisso: livre, planejado, em andamento, parcial, concluído, reagendado, cancelado ou descanso conforme modelagem adotada. Não reutilizar um único booleano done para significados diferentes.

### Métricas propostas

- Treinos concluídos: sessões integrais válidas, com regra de associação definida e sem duplicar compromisso.
- Sessões parciais: contagem própria e indicação de séries realizadas.
- Atividades realizadas: pode incluir parciais, mas deve ser nomeada e separada da meta de sessões completas.
- Cumprimento da agenda: deriva dos compromissos aceitos no período e do critério apresentado. Recomenda-se parcial não contar como compromisso integral; não inventar percentual proporcional sem regra explícita.
- Descanso: permanece legítimo sem gerar treino, repetições ou PR. Check-in de bem-estar, se houver, é evento distinto.
- Referência inicial: primeiro registro válido; pode ter reconhecimento de primeiro registro, sem Superação de Limites.
- PR: melhora segundo regra comparável, com exercício/variante/equipamento/carga/unidade pertinentes. Maior número de repetições não significa automaticamente melhor resultado entre cargas diferentes.
- Modalidade rápida: escolhida explicitamente ou identificada por versão de ficha; duração curta isolada não basta para converter sessão normal.

Os indicadores devem ser calculados a partir dos mesmos eventos. Campos derivados persistidos precisam de mecanismo de reconstrução e versão da regra.

## 7. Frentes de implementação

### F0 — Diagnóstico, release e base de teste

Inspecionar código, esquema, regras reais e logs não sensíveis. Associar cada falha ao caminho exato. Conferir commit, build e artefato servido. Investigar cache/service worker somente se presentes; não assumir causa.

Disponibilizar ambiente de homologação e perfis sintéticos isolados: novo, migrado v6, migrado v7 e conta de teste. Não apagar armazenamento de usuário como correção. Capturar evidência de versão e cenários antes/depois. Substituir mensagem Compilação verificada/atestar integridade por identificação factual se não houver mecanismo de verificação.

### F1 — Sessão, compromisso e resultados (P0)

Implementar o contrato do item 6. Corrigir associação por ID, estados de parcial e contagens, primeira referência e medalhas. Testar o caso do item 5 antes e depois. Preservar resultados existentes; reparar associações antigas somente quando determinável, registrando ambiguidade para revisão. Não mover eventos históricos silenciosamente.

Tratar correção de registro e recálculo. Publicar versão das regras; remover conquistas indevidas com tratamento transparente e preservar os registros de exercício. Não conceder novamente por reload.

### F2 — Proposta, confirmação e personalização

Corrigir ambos os acessos à mesma proposta persistida. Estados de carregamento/erro e nova tentativa; retorno do perfil migrado sem proposta recuperável deve oferecer gerar/revisar, não botão inerte. Reload não confirma proposta. Confirmação repetida não duplica rotina.

Assistente herda dados válidos e mantém diferença entre perfil habitual e ajuste de hoje. Mapear objetivos ordenados a regras do gerador, sem afirmar que campos ignorados personalizam a ficha. Mudança de perfil oferece nova revisão, sem trocar rotina ativa automaticamente.

Programa de catálogo deve apresentar incompatibilidade de frequência, dias, duração ou recursos antes de ativar. Oferecer proposta adaptada suportada, alterar disponibilidade ou escolher outro. Não preencher recuperação nos dias livres sem aceitação.

### F3 — Agenda e experiência diária

Datas civis, fuso, semana anterior/próxima e Hoje. Separar padrão semanal e ocorrências. Definir semana inicial parcial, início do programa e horizonte de criação. Reagendar/editar uma ocorrência ou próximas, preservando passado e sessão em andamento.

Hoje mostra compromisso real, retomada e alternativas. Sessão avulsa em descanso não conclui descanso nem outro treino. Livres/descanso não têm concluir treino. Não oferecer só marcação manual como equivalente a série registrada; se existir atividade externa, rotular origem e dados disponíveis.

### F4 — Curadoria, compatibilidade e seleção

Exigir recursos obrigatórios com alternativas modeladas explicitamente; separar peso corporal de apoio obrigatório. Confirmar barra fixa versus barra/anilhas, mini band versus faixa longa/tubos. Requisito desconhecido não significa elegível.

Auditar seleção automática por nome, texto, imagem, nível e recursos, começando por Wind Sprints e exercícios com barra/banco/cadeira/parede. A ausência de Wind Sprints em uma ficha aleatória não comprova filtro correto; usar teste determinístico.

Explicitar regra de experiência/complexidade e organização da ficha. O caso de saltos e flexão pliométrica em Hábito para retorno à prática exige revisão, não conclusão médica automática. Regras clínicas ou de encaminhamento precisam de revisão habilitada e origem; não inventar liberação de saúde.

Calcular tempo com premissas documentadas de execução, séries, descanso e transição. Mostrar limite excedido ou alternativa quando não couber. Não reduzir descanso indiscriminadamente nem fixar rótulo de 15 min sem cálculo.

### F5 — Escuta, perfil e autoria profissional

Revalidar fluxo limpo: escolhas explícitas, objetivos removíveis/ordenáveis, disponibilidade e durações pertinentes, notas opcionais vazias. Diferenciar cuidados não informados de nenhuma limitação. Resumo completo com edição por seção e retorno sem perda.

Editor de perfil completo e opção de revisar escuta sem apagar histórico. Plano profissional deve abrir com intenção preservada e informar que a autoria é declarada pelo usuário, sem aparentar validação independente. Não alterar automaticamente a prescrição cadastrada.

### F6 — Executor e qualidade da interface

Pausar e voltar ao início com retomada preservada. Testar zero/uma/várias séries e reload no descanso. Esclarecer séries consecutivas versus circuito; indicador de próximo deve corresponder à sequência real.

Formulários pertinentes por exercício: repetições, tempo, carga opcional quando aplicável; definir unilateralidade e convenções relevantes. Evitar atalhos genéricos de kg em mobilidade.

Todos os modais: nome, fechar acessível, Escape, foco inicial/contido e retorno. Testar execução pelo teclado, não só presença de atributos. Corrigir durações cortadas, códigos visíveis, traduções e contagens. Ficha vazia sem duração fictícia. Revisar alegações de base científica, segurança e integridade.

### F7 — Persistência, conta, offline e continuidade

Migrações versionadas preservam perfil, proposta, rotina, eventos e séries. Falha de gravação não pode exibir sucesso. Testar importação inválida sem alteração, válida com relações preservadas e repetida sem duplicação. Resolver conflitos antes de sobrescrever.

Convidado para conta: autenticação real, vínculo explícito, repetição segura, falha recuperável e isolamento entre contas. Não compartilhar notas de saúde com IA/analytics por padrão. Domínios antigos e novos não compartilham armazenamento local: exportação/importação ou sincronização real, sem prometer transferência automática.

Offline precisa ser verificado desde carregamento disponível até gravação e retorno da rede; retomada online após reload não comprova offline.

## 8. Ordem de entrega e dependências

| Marco | Conteúdo | Dependência | Saída verificável |
|---|---|---|---|
| M0 | F0 | Acesso ao projeto/ambiente | Build identificada, cenários e fixtures isolados |
| M1 | F1 | M0 | Caso parcial sem atribuições indevidas |
| M2 | F2 e núcleo de F4 | Modelo consistente | Proposta utilizável e compatível, confirmação idempotente |
| M3 | F3 | M1/M2 | Hoje e agenda concordam com rotina confirmada |
| M4 | F5/F6 e restante de F4 | Fluxo principal estável | Edição, executor e conteúdo com regressões aprovadas |
| M5 | F7 e homologação final | Migrações e ambiente de contas | Limites documentados e release testada publicamente |

Não fixar prazo sem inspecionar o código. Cada marco deve caber em uma entrega revisável e conter testes dos comportamentos alterados. Não exigir nova rodada de toda a suíte por mudança cosmética sem risco; repetir regressões pertinentes e os cenários centrais na release final.

## 9. Matriz de homologação

Para cada caso registrar build/commit, perfil novo ou migrado, pré-condições, passos, esperado, observado, evidência e status: passou/falhou/bloqueado/não testado. Não marcar passou por inspeção de função quando o critério exige interface ou integração.

| Caso | Verificação obrigatória |
|---|---|
| T01 | Primeira visita mostra escolhas de acesso; convidado segue escuta antes do início |
| T02 | Onboarding salva e retoma cada etapa relevante; voltar/editar não perde dados |
| T03 | Objetivos podem ser removidos e ordenados; sem duplicidade conceitual |
| T04 | Cuidados não preenchidos continuam não informados no resumo e gerador |
| T05 | Resumo mostra todos os blocos e edição retorna corretamente |
| T06 | Proposta abre por resumo e início, com os mesmos dados |
| T07 | Perfil migrado sem proposta válida recebe recuperação utilizável |
| T08 | Erro de geração é legível, recuperável e não ativa rotina |
| T09 | Reload da proposta preserva conteúdo sem confirmar |
| T10 | Confirmar/repetir/recarregar não duplica rotina ou ocorrências |
| T11 | Assistente herda dias, tempo, equipamentos, nível e objetivos suportados |
| T12 | Ajuste de hoje não sobrescreve perfil; alteração habitual pede revisão futura |
| T13 | Programa de 3 dias versus perfil de 2 exige revisão antes de ativar |
| T14 | Datas/fuso/virada de semana/semana parcial mantêm compromissos corretos |
| T15 | Reagendar e editar próximas ocorrências preserva histórico e IDs |
| T16 | Dia livre e descanso sem concluir treino ou PR |
| T17 | Executar ficha de outro dia mantém vínculo ou oferece avulso explicitamente |
| T18 | Caso da série parcial do item 5 passa integralmente |
| T19 | Sessão sem séries não gera histórico, medalhas ou conclusão |
| T20 | Parcial e completa têm contagens e rótulos iguais em todas as telas |
| T21 | Primeiro registro cria referência; melhora comparável gera PR, reload não duplica |
| T22 | Duração curta de ficha comum não concede modalidade rápida por acidente |
| T23 | Pausa com zero/uma/várias séries preserva ordem e resultados |
| T24 | Reload durante descanso retoma estado; navegar não registra série |
| T25 | Ordem de próxima série corresponde a consecutivas/circuito declarado |
| T26 | Campos/unidades são pertinentes a mobilidade, força e duração |
| T27 | Wind Sprints sem barra é rejeitado; com recursos válidos tem comportamento correto |
| T28 | Banco/cadeira/parede e alternativas são verificados deterministamente |
| T29 | Mini band não habilita faixa longa/tubos; requisitos desconhecidos não são aceitos |
| T30 | Troca de exercício e opção rápida usam as mesmas regras |
| T31 | Sem exercícios elegíveis há explicação e caminho de revisão, sem ficha inventada |
| T32 | Nível e objetivos mudam seleção por regra testável; curadoria sem conflitos conhecidos |
| T33 | Estimativa calculada cabe no tempo ou informa impossibilidade |
| T34 | Perfil completo editável; plano profissional preserva origem e não é alterado automaticamente |
| T35 | Editor vazio não anuncia duração; contagens são consistentes/explicadas |
| T36 | Escape/foco/fechar/teclado funcionam em todos os modais relevantes |
| T37 | Mobile real/responsivo: teclado, rolagem, barras fixas e textos completos |
| T38 | Backup inválido não altera dados; válido preserva vínculos; repetição não duplica |
| T39 | Migração v6/v7 preserva dados e informa conflitos ambíguos |
| T40 | Convidado→conta funciona com falha/repetição; conta preexistente resolve conflitos |
| T41 | Troca/logout de conta não expõe dados da anterior |
| T42 | Offline/gravação/retorno de rede refletem status real, sem perda silenciosa |
| T43 | Release pública corresponde ao commit testado e atualização preserva sessão |
| T44 | Após corrigir/excluir registro por fluxo suportado, métricas e conquistas são recalculadas |

## 10. Cenários sintéticos para comparação

| Perfil | Configuração | Finalidade |
|---|---|---|
| A — Retorno em casa | Seg/Qui, 15 min, peso corporal + mini band, força/mobilidade e hábito | Reproduzir cenário observado e jornada principal |
| B — Sem apoios | Peso corporal, sem barra/banco/cadeira/parede declarados | Garantir requisitos obrigatórios e tratamento de ausência de opções |
| C — Recursos distintos | Faixa longa e apoios declarados, tempo diferente | Demonstrar diferença real da proposta e não intercambialidade |
| D — Plano profissional | Plano sintético cadastrado, sem autoria real inventada | Preservar intenção, edição manual e origem |
| E — Migrado | Fixture v6/v7 com proposta ausente/antiga e parcial existente | Recuperação e consistência sem limpar armazenamento |
| F — Conta de teste | Local e remoto com dados conflitantes | Sincronização, isolamento e continuidade, com autorização apropriada |

Casos de limitações devem usar fixtures sintéticas identificadas e regras revisadas, sem dados reais de saúde e sem inventar interpretação clínica.

## 11. Pendências de investigação e decisões a formalizar

- Causa real de Ver Proposta inerte e diferença entre novos/migrados.
- Se o executor pretende circuito ou séries consecutivas; refletir essa decisão em UI e registro.
- Qual regra atual concede Constância Flexível e primeiro PR; verificar tempo ativo versus tempo decorrido.
- Como a sessão recebe o ID de compromisso e por que o descanso de hoje foi marcado.
- Se a meta atual conta sessões, dias ativos ou compromissos; não misturar sem rótulos.
- Cobertura real de curadoria e origem/licença do catálogo: relatório afirma domínio público, mas isso não foi verificado independentemente.
- Critérios reais para nível/complexidade e limites da personalização; não prometer validação clínica.
- Se os testes automatizados exercitam componentes reais ou reproduzem regras em funções independentes.
- Se há service worker/cache de aplicação e qual política de atualização existe.
- Modelo de conflitos de backup/conta, versão de regras e reparação de derivados legados.

## 12. Critério de conclusão da fase

Não considerar concluído apenas por build, número de testes ou versão atualizada. Exigir: jornada principal executada em perfil novo e migrado; nenhum P0 conhecido pendente; caso parcial reproduzido e corrigido; agenda/início/progresso coerentes; proposta compatível e confirmada; regressões pertinentes aprovadas; limitações de infraestrutura explicitadas; release pública identificada e conferida.

Se uma frente estiver bloqueada, entregar o restante com status preciso e dependência concreta. O relatório final deve mostrar esperado versus observado e separar implementação, teste automatizado, teste manual e revisão de conteúdo.

## 13. Texto de encaminhamento para implementação

Use este planejamento como especificação da próxima fase no projeto existente do Superação. Comece pela investigação de F0 e pelo caso de regressão da sessão parcial. Implemente os marcos na ordem indicada, preservando os dados e os fundamentos já corretos. Não acrescente grandes funcionalidades nesta fase. Documente causas reais, decisões de métricas e vínculos, migrações, testes executados, pendências e identificação do artefato publicado. Não marque como aprovado o que não foi efetivamente verificado.
