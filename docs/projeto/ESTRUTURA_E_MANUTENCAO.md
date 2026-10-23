# Estrutura técnica e manutenção

Inventário baseado na árvore e em arquivos consultados no commit 84ebbc0fe5d5180382f0012c03c96c9ecdc0493d. Não é auditoria completa da arquitetura ou segurança.

| Área | Local |
|---|---|
| Entrada da aplicação | src/App.tsx |
| Contextos | src/context/AuthContext.tsx, src/context/WorkoutContext.tsx |
| Persistência/Firebase | src/lib/storage.ts, src/lib/firebase.ts |
| Tipos | src/types/index.ts |
| Telas | src/views/WelcomeView.tsx, ListeningJourneyView.tsx, ProposalView.tsx, HomeView.tsx, CalendarView.tsx, ActiveWorkoutView.tsx, ProgressView.tsx, ProfileView.tsx, BuilderView.tsx, ExploreView.tsx |
| Testes | tests/domain.test.ts e matrizes CSV em tests/ |
| Especificação histórica | docs/01 a docs/12, prompts/, schemas/, data/, firebase/ |
| CI e publicação | .github/workflows/ |
| Documentação atual | docs/projeto/ |

## Dependências e comandos

package.json declara React, TypeScript, Vite, Tailwind, Firebase, Vitest e vite-plugin-pwa, entre outras dependências. Presença da dependência não comprova comportamento de PWA, sincronização ou integração de IA. npm run lint é checagem de tipos, não lint estilístico. A versão de package.json era 0.0.0, enquanto a interface observada dizia v8; unificar identificação é uma pendência.

O workflow de produção observado executa npm install --legacy-peer-deps, npm test e npm run build antes de publicar no Firebase Hosting para pushes em main. Sucesso desse pipeline não substitui homologação funcional. A inspeção deste documento não executou os comandos.

## Fluxo recomendado

1. Partir de branch atual e ler os requisitos e o relatório mais recente.
2. Reproduzir o problema no ambiente apropriado, diferenciando novo e migrado.
3. Corrigir causa, preservar dados e executar verificações pertinentes.
4. Abrir PR com comportamento antes/depois, migração, testes reais e limites.
5. Conferir build publicada/preview e repetir o cenário na interface.
6. Atualizar relatório de evidências e histórico, sem editar o passado como se tivesse sido aprovado.

Não versionar segredos, exportações reais de usuários ou dados de saúde. Não limpar dados para ocultar bug de migração. Documentação de regras define intenção; código e testes devem demonstrar execução. Materiais originais com arquitetura candidata devem permanecer identificados como propostas/históricos.
