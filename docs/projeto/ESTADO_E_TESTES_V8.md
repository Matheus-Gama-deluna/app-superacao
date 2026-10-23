# Estado observado e testes da interface v8

Registro histórico da última rodada manual na conversa. Endereço: https://superacao-app-65.web.app/. Perfil identificou v8.0.0, build 2026-10-22; boas-vindas ainda anunciou 6.0.0. Não foi possível associar a sessão do navegador a um SHA de commit. Este relatório não comprova correspondência com a main atual.

## Cenário

O navegador abriu sem perfil anterior; nenhuma limpeza foi feita para provocar isso. Foi percorrida uma nova escuta com perfil sintético Homologação nova: retorno à prática, força/mobilidade primeiro e hábito depois, Seg/Qui, 15 min, casa, peso corporal e mini band. Cuidados não preenchidos; sem dados reais de saúde e sem conta conectada.

A opção rápida foi iniciada; uma série fictícia de 12 repetições de agachamento foi registrada; sessão encerrada como parcial (~1 min). Dados exclusivamente sintéticos do navegador de teste. Não publicar backups pessoais junto deste relatório.

## Avanços demonstrados

| Verificação | Observado |
|---|---|
| Parcial | Progresso: zero concluídos + uma parcial |
| Referência inicial | Zero PRs reais, uma marca inicial, etiqueta BASE |
| Medalhas | Zero medalhas após a parcial, corrigindo atribuições anteriores neste cenário |
| Meta no início | 0/2; parcial não virou sessão completa |
| Sequência | Descanso anunciou segunda série do mesmo agachamento |
| Duração no assistente | 12–15 min e demais rótulos completos |
| Linguagem de treinos | Seleção personalizada & progressão guiada substituiu alegação anterior de base científica |

## Falhas reproduzidas e pendências visíveis

| ID | Área | Reprodução/resultado | Prioridade |
|---|---|---|---|
| V8-01 | Proposta | Etapa 7 → Ver Proposta Personalizada → início; Ver Proposta no início não abre | P0 |
| V8-02 | Assistente | Abre só peso corporal, 25–30 min e Hábito, apesar do perfil | P1 |
| V8-03 | Pausa | Novo botão aparece, mas não volta ao início antes ou depois de série salva | P1 |
| V8-04 | Marca inicial | Progresso diz BASE/zero PR; início chama mesma marca de Recorde Pessoal | P1 |
| V8-05 | Agenda | Dias livres com Marcar como concluído; sem datas/navegação nas telas verificadas | P1 |
| V8-06 | Consistência | Medalha ainda descrita como três ou mais treinos para perfil de dois dias | P1 |
| V8-07 | Escuta | Objetivo e Seg/Qua/Sex pré-selecionados; remoção de objetivo não visível | P1 |
| V8-08 | Resumo/perfil | Resumo sem blocos completos; perfil sem edição de objetivos/dias/duração/cuidados | P1 |
| V8-09 | Release | Boas-vindas 6.0.0 versus perfil 8.0.0 | P1 |

P0 bloqueia jornada; P1 afeta regra/personalização; prioridades propostas para implementação, não severidades técnicas auditadas no código.

## Não homologado nesta rodada

Ativação de programa e conflito de frequência; vínculo sessão/compromisso de outro dia; migração dos dados antigos; filtro determinístico de Wind Sprints/outros apoios; seleção por nível; duração calculada; edição/exclusão e recálculo; teclado/foco completos; mobile físico; login, vínculo convidado→conta, isolamento, offline e backups.

A falha anterior de parcial marcando descanso não foi revalidada neste cenário sem programa ativo. Não declarar corrigida nem reproduzida na v8 por extrapolação. A sequência correta de um exercício não comprova todas as sequências.

## Evidência exigida nas próximas rodadas

Registrar versão + commit + ambiente, dados sintéticos, passos, esperado, observado e evidência. Classificar passou/falhou/bloqueado/não testado. Número de testes, atributos ARIA ou classes responsivas não substituem teste real de integração, teclado ou mobile. Não aprovar todos os critérios com base apenas em build ou inspeção de código.
