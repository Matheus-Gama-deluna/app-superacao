# 11 — Auditoria da estrutura v3 antes de foco visual — 22/10/2026

## Parecer executivo
**PRONTA PARA INICIAR DESIGN E IMPLEMENTAÇÃO ITERATIVA, NÃO PRONTA PARA PUBLICAÇÃO.** O v3 tem visão de produto, domínio, sementes, contratos, suporte Firestore offline, telas e testes de aceitação. Faltavam identidade visual, telas desenhadas, tokens, comportamento exaustivo por estado, referências de UX e instrução de handoff explícita para design. Este v4 cobre essas lacunas.

## Base verificada
- 44 exercícios de teste autorais, NÃO revisados profissionalmente; 9 templates de engenharia NÃO publicáveis (`publishable:false`); não alegar protocolo validado.
- Firebase Auth/Firestore SDK com `persistentLocalCache` e multitab: estratégia arquitetural definida, não testada no Google AI Studio.
- Regras Firestore são **modelo inicial** e NÃO equivalem a política de segurança pronta para produção: acesso aos documentos `users/{uid}` / `plans` permite mudanças com pouca validação de formato; as regras de planos não garantem revisão imutável (o documento é apenas proposta); exclusão de conta requer remoção em cascata segura; exigem testes com Emulator Suite.
- JSON seeds e schemas precisam ser tratados como contrato de desenvolvimento; não importar mídias sem direitos verificáveis.
- Firestore nativo offline gerencia dados autenticados; Dexie/outbox própria não deve renascer no redesenho visual. PWA SW cacheia app shell e catálogo. `onSnapshot` distingue write pendente e dados possivelmente antigos. Preservar situação do cache e resolver rejeição tardia de escrita.
- O protótipo HTML deste kit é uma PREVISUALIZAÇÃO INTERATIVA **sem login real, Firestore ou dados de saúde**, para avaliar disposição visual e microinterações.

## Pendências prioritárias antes do piloto público
1. Validar dados Firebase de ponta a ponta, multiusuário, offline->online e perda de escrita por rejeição.
2. Revisar Rules com esquemas por coleção e casos de permissões; plano profissional só pode mudar sob consentimento apropriado.
3. Aprovação profissional de cada modelo e material de exercício; ter licenças de imagens/vídeos para publicar.
4. Privacidade: dispositivo confiável, limpeza/isolamento ao trocar usuário, exportação e exclusão real de conta e dados.
5. Revisar primeira experiência offline, cache frio sem dados, modo convidado e conflitos sem perda.
6. Verificar o ciclo completo num Android físico e instalar a PWA em HTTPS.
7. Determinar se notificações pontuais offline exigirão Capacitor; não prometer execução indefinida em background web.
8. Publicação sem cobrar/expor dados sensíveis à LLM; chat server-side opcional e seguro.

## Novas entregas visuais adicionadas no v4
- Identidade visual e modo escuro tokenizado.
- Inventário de 14 telas incluindo estados críticos e caderno de componentes.
- Pesquisa editorial de UX com 7 referências verificáveis e sem mídia de terceiros distribuída.
- Protótipo HTML/CSS/JS responsivo navegável, com oito telas e painel de confirmação ilustrativo, mais screenshots PNG do próprio protótipo.
- Prompt independente de implementação visual que protege comportamento e infraestrutura.
- QA UX de acessibilidade, mobile, estados de offline, editor e confirmação pós-série.

## Critério de versão
A identidade visual é proposta D18, para validação do usuário. A decisão D17 (Firestore cache offline nativo) permanece. Não chamar o v4 de aplicativo produzido: é kit de implementação e protótipo editorial navegável.
