# Sprint 00 — Autenticação + persistência/sincronização nativas do Firestore

**Decisão D17:** substitui o Sprint 00 da v2. **Não implemente Dexie, SyncService, outbox customizada, nem espelhamento concorrente para os dados autenticados.**

No Google AI Studio Build Web, criar integração Firebase Authentication Google, Cloud Firestore e Security Rules com projeto real e Hosting preparado; nunca simular conexão bem-sucedida.

Implementar React/TypeScript + Firebase Web modular SDK com inicialização única de `persistentLocalCache({tabManager:persistentMultipleTabManager()})` em aparelhos pessoais confiáveis. No primeiro login, exigir rede; com conta previamente autenticada e docs cacheados, usar offline. Disponibilizar seleção de dispositivo pessoal/compartilhado: no compartilhado iniciar com `memoryLocalCache()` e persistência Auth apropriada. O catálogo essencial de exercícios deve estar embarcado no PWA/Workbox, não depender do cache de docs baixados.

Entregas do Sprint 00:
1. Sign-In Google real + onAuthStateChanged, logout, perfil por UID e proteção entre contas; documentar que cache persistente não limpa automaticamente após logout.
2. Store das sessões baseado em Firestore, `onSnapshot({includeMetadataChanges:true})`, feedback `hasPendingWrites` (pendente/ACK), `fromCache` (possivelmente desatualizado), listener errors e `waitForPendingWrites()` APENAS para confirmação online.
3. Teste offline via `disableNetwork(db)` e reabilitar rede; salvar doc com ID estável por `setDoc`, NÃO aguardar ACK antes de prosseguir. Testar persistência após recarregar, fechar e reabrir PWA.
4. Eventos de séries create-only e correção por outro evento; XP derivado de IDs únicos, nunca incremento repetido no mesmo write. Security Rules negam update/delete de eventos.
5. Planos editáveis como revisões versionadas, sem sobrescrever mutações paralelas; mudanças simultâneas de dois aparelhos precisam conservar ambas versões.
6. Validar dados e Security Rules localmente com Emulator Suite; simular rejeição tardia de gravação offline, tratar rollback e erro; export/backup como recuperação. Sem tratar cache como garantia absoluta contra perda de dados.
7. UI sinaliza: salvo local/pendente, sincronizado, erro e dados antigos/incompletos; carregamento inicial distingue coleção vazia de ainda não carregada/sem rede.
8. Sem Internet no primeiro login = orientar conexão, não inventar autenticação. Convidado totalmente offline requer solução separada e fica FORA deste Sprint, salvo decisão explícita posterior.
9. Preparar service worker para shell/seed e lifecycle seguro, com cronômetro timestamps persistidos em documento de sessão, não depender de execução no background.

Concluir QA com conta A/B, multitab, offline->online e cache sem dados antes de Sprint 01.
