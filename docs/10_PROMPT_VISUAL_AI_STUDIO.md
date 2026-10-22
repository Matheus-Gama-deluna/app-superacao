# 10 — Prompt para aplicar identidade visual no Google AI Studio

ATENÇÃO: você está EDITANDO o Superação para torná-lo visualmente consistente e funcional. Não gere um aplicativo alternativo ou imagens bonitas desconectadas. Preserve todos os contratos do kit mestre e funcionalidades Firebase/Firestore offline. Use `docs/07_IDENTIDADE_VISUAL.md`, `docs/08_INVENTARIO_TELAS_ESTADOS.md`, `visual/design-tokens.json`, `visual/PROTOTIPO_NAVEGAVEL.html` e as prévias PNG. O protótipo HTML é uma DIREÇÃO VISUAL, não código de produção nem fonte de dados; implemente componentes React e integração real.

CONTEXTO VISUAL:
- Marca Superação: progresso sustentável, acessível, adulto, brasileiro. Direção A light suave verde petróleo e lima restrito; dark nos tokens.
- Não inserir RPG, banners motivacionais agressivos, metas de streak diário, imagens fictícias de técnica ou material dos apps de referência.
- Tipografia system-ui local, sem font CDN no runtime offline.
- 4 abas bottom em mobile: Início, Treinos, Agenda, Progresso; Perfil no topo. Execução em modo foco.
- Layout respeita safe-area, teclado, 360x800, 390x844 e 412x915; responsivo tablets; botões e inputs preferencialmente >=48px. WCAG 2.2 AA.
- Cada estado tem copy amigável e descrição sem cor como único canal. Login Google real, offline, sem plano, descanso total, retorno após pausa, sincronizando, pendente, erro, cache incompleto, conteúdo não revisado.
- Implemente página por página com componentes reutilizáveis. Integrar aos hooks/repositórios atuais, NUNCA introduzir banco local próprio, mock `setTimeout` de sync ou array para substituir Firestore.

TELAS CRÍTICAS E REFERÊNCIAS:
- Início com CTA contextual (Iniciar ou Retomar) e microvisão da agenda; cards suaves; sem carrossel excessivo.
- Treinos/Biblioteca categorizados por casa sem equipamento, mini band, faixa longa, caminhada, mobilidade. Avisar templates demonstrativos em revisão.
- Montador: ordem, séries, alvos, descanso; editar/duplicar/salvar. Plano de profissional com selo de autoria.
- Executor: exercício, série atual, objetivo, descrição, botão Concluir série; em seguida sheet para registro REAL de reps/tempo. Salvar antes de iniciar descanso; permitir parcial e correção.
- Descanso: timer por timestamp persistido, opção pular, screen wake lock se disponível; NUNCA promessa de alarme exato com app fechado.
- Progresso: métricas reais, histórico, não premia treinar em descanso. 
- Sincronização: status através de metadata Firestore; não exibir sincronia falsa quando fromCache/hasPendingWrites.
- Assistente IA apenas quando feature flag configurada e backend seguro, nunca mudar plano sem confirmar e jamais bloquear o núcleo offline.

ENTREGA:
- Componentes e tokens no código do projeto real; não somente screenshot.
- Apresentar screenshots reais do app IMPLEMENTADO para S02, S03, S05, S07, S08, S06, S11, S12 em 390x844 e um responsive 768px.
- Testar interações e fluxos principais com dados persistentes e mostrar quais ainda são protótipo.
- Verificar contraste, labels, teclado, foco, estados de erro, rede desligada e refresh durante sessão.
- Não copiar telas de Hevy, Fitbod, Freeletics e Nike. Referências para padrões, não assets.
