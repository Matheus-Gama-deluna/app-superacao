# 07 — Direção visual para o MVP Superação (proposta v4)

**Status:** direção recomendada, AINDA NÃO aprovada como identidade definitiva. A pesquisa e a arquitetura funcional já permitem iniciar o design. Foco é treino real e retorno sustentável; RPG profundo pós-MVP.

## Conceito de marca
**Superação é progresso possível, não performance punitiva.** A pessoa deve perceber energia, leveza e confiança. Promessa visual: “Seja possível hoje. Volte no seu ritmo.” Não mostrar corpos irreais, comparações de peso, ranking agressivo nem rostos gerados como falsas instruções físicas.

### Rota A (proposta implementada no protótipo)
**Clareza em movimento:** superfícies claras em verde muito pálido, cartões brancos, verde petróleo como ação principal e acento lima reservado a destaques. Cantos suaves e hierarquia tipográfica alta. Limpa, adulta, acessível e amigável.

### Rota B (alternativa futura, não implementada neste kit)
**Performance noturna:** quase preto/azul petróleo, contraste maior e acentos menta. Disponível como tema escuro derivado de tokens, sem virar gamer neon.

## Paleta exata / tokens
- Fundo: `#F5F8F5`, superfície: `#FFFFFF`, tinta: `#152A29`.
- CTA verde: `#125F55` com texto branco.
- Verde claro/acento: `#D9F277` (USAR com texto escuro, não branco).
- Estado pendente: âmbar `#91610D`; erro: `#B13D39`; sucesso: `#246747`.
- Tema escuro: tokens em `visual/design-tokens.json` — trocar tokens, não inventar cores por tela.

## Tipografia
Fonte de sistema (sem depender de internet e sem incluir arquivos de fontes), fallback `system-ui`. Escala: 32 hero, 26 títulos, 20 subtítulos, 16 corpo/inputs, 14 metadados e 12 apenas para labels secundárias não críticas. Inputs >=16px no iOS. Altura de linha >=1.35. Numeração tabular para timers e séries.

## Gramática visual
- Botão prioritário visível e único por tela (altura alvo 56px); secundários 48px; superfície mínima recomendada de toque 48x48px.
- Cartões 20px raio, espaços 8/12/16/24px, bordas leves. Sem micrográficos com informação minúscula.
- Barra inferior 4 destinos: **Início, Treinos, Agenda, Progresso**; Perfil pelo avatar/topo. A sessão ativa pode assumir modo concentração e ocultar menu inferior.
- Divisores e estados com texto+ícone, não apenas cor. Ícones neutros, sem emojis como controles definitivos.
- Logo abstrato original em `visual/assets/logo-superacao.svg`. São esboços vetoriais, não identidade registrada.

## Acessibilidade
Metas de WCAG 2.2 AA; alvos de toque 48x48 recomendado internamente (o critério 2.5.8 AA é 24x24px com exceções), contraste mínimo de 4,5:1 em texto normal e 3:1 em texto grande, não bloquear zoom, foco visível, rótulos de ícones, aria-live em confirmações, formato 24h e linguagem simples. Respeitar `prefers-reduced-motion`; fonte escalável; projetar interface para uso com uma mão ou após atividade física.

## Imagens e exercícios
NÃO embutir screenshots de concorrentes, fotos ou GIFs que não estejam licenciados. Cards do catálogo podem ter placeholders gráficos abstratos e instrução textual revisada; não gerar imagem anatomofisiológica falsa como tutorial de segurança. Para produção, conteúdo/mídia licenciados e revistos por profissional.

## Estados essenciais
- `sem_plano`: CTA "Montar primeiro treino" / "Cadastrar plano"; sem ficha recomendada falsa.
- `treino_agendado`: resumo objetivo + duração + equipamento + CTA.
- `treino_em_andamento`: retomar e identificar série/etapa.
- `descanso_total`: opção legitimada, CTA próxima sessão, atividade leve não obrigatória.
- `retorno_apos_pausa`: reagendamento sem culpabilização, preservar histórico.
- `sem_rede / salvo_localmente`: ação segue com cache e selo informativo.
- `sincronizando / sincronizado / erro`: ligar a `hasPendingWrites`/`fromCache`, nunca interpretar `navigator.onLine` como ACK.
- `catalogo_em_revisao`: nunca exibir modelos seed como validados/recomendados a público.
- `sem_conteudo_cacheado`: indicar que conteúdo ainda não foi carregado, sem sugerir que usuário não tem planos.

## Princípios contra falha visual
1. Um único CTA importante por momento.
2. Exercício atual e seu próximo passo sempre acima da dobra quando em sessão.
3. Confirmação de repetições/tempo **após** concluir série, jamais contador por toque.
4. Metas planejadas e realizadas não confundidas.
5. IA opcional só com proposta/revisão, sem controle silencioso da ficha.
6. XP e progresso simples, sem punição por repouso ou faltas.

*Protótipo clicável: `visual/PROTOTIPO_NAVEGAVEL.html`. Não é a aplicação Firebase. Os textos e números nele são DEMONSTRATIVOS.*
