# Decisão D17 — Firebase Firestore SDK como persistência e sincronização nativas

**Data:** 22/10/2026 · **Estado:** arquitetura recomendada para validar no MVP. Este documento SUBSTITUI integralmente a arquitetura Dexie + syncOutbox da v2.

## Objetivo e fronteira
- O Firestore Web SDK com `persistentLocalCache({tabManager: persistentMultipleTabManager()})` é a fonte operacional dos dados pessoais autenticados **e** implementa cache IndexedDB, alterações locais imediatas, fila de gravações e reconciliação com a nuvem. Não implementar Dexie como banco duplicado, nem SyncService/outbox própria para estes mesmos registros.
- Authentication Google dá identidade. Uma conta previamente autenticada e com dados já armazenados pode continuar a operar offline. **Primeiro login e acesso a dados que nunca entraram em cache exigem internet.**
- Manifest PWA + Service Worker/Workbox armazenam o *app shell* e assets essenciais (incluindo catálogo seed licenciado). Firestore cache armazena documentos consultados. O Service Worker não mantém timers rodando em segundo plano.
- Firestore **não** garante preservação absoluta frente à limpeza de dados do navegador, perda do dispositivo ou rejeição pelo backend de uma gravação pendente. Solicitar `navigator.storage.persist()` quando apropriado, manter backup/export e testar rejeições. Para recuperar erros críticos, considerar um **pequeno journal de contingência dos registros de séries confirmadas**, sem segunda fila de sincronização; avaliar após POC. Não criar journal por padrão se complicar o MVP; se não houver recuperação, documentar risco e mostrar erro de forma clara.

## Código base Firebase Web SDK
```ts
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
         doc, onSnapshot, setDoc, waitForPendingWrites } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Exemplo de visualização reativa de um evento confirmado de série.
const ref = doc(db, 'users', uid, 'setEvents', eventId);
const stop = onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
  if (!snapshot.exists()) return;
  const { hasPendingWrites, fromCache } = snapshot.metadata;
  // 'pendente' se hasPendingWrites; se false e a escrita for conhecida, ACK recebido.
  // fromCache=true indica que o snapshot pode não estar atualizado com o servidor.
  renderEvent(snapshot.data(), { hasPendingWrites, fromCache });
});

// Gerar eventId uma única vez no cliente e reutilizá-lo. A escrita local
// dispara onSnapshot antes da confirmação remota. Não bloquear o treino
// aguardando o Promise de setDoc (ele pode permanecer pendente offline).
void setDoc(ref, { ownerUid: uid, sessionId, actualReps, recordedAt: Date.now(),
                   clientEventId: eventId, schemaVersion: 1 })
  .catch(err => handleWriteRejected(err, eventId));

// Usar quando quiser confirmar entrega das gravações emitidas antes da chamada.
// Não é pré-requisito para iniciar/concluir treino offline.
await waitForPendingWrites(db);
stop();
```
> O trecho é ilustrativo: variáveis e validações fazem parte do app. `onSnapshot` e regras são fonte dos status; `navigator.onLine` não prova que o Firestore confirmou a gravação. `waitForPendingWrites` pode aguardar indefinidamente sem conexão e rejeita se o usuário mudar.

## Modelo de dados sugerido
- `users/{uid}` — preferências mínimas.
- `users/{uid}/plans/{planId}` — planos com autoria, origem e versão; editar como **revisão imutável** ou cópia versionada, evitando última-gravação silenciosa sobre a mesma ficha.
- `users/{uid}/sessions/{sessionId}` — snapshot do plano usado e estado resumido. Não armazenar arrays gigantes de séries aqui.
- `users/{uid}/setEvents/{eventId}` — evento confirmado de série, com ID determinístico/estável gerado no cliente; criar uma vez, atualização proibida pelas regras. Corrigir com novo evento que referencia o anterior.
- `users/{uid}/activities/{id}`, `calendar/{id}` e `progressEvents/{id}` — caminhadas, compromissos, marcos; evitar cronômetro com write/segundo.
- `exercise_catalog` — asset versionado do bundle local, com licença e revisão; catálogo remoto só para atualizações opcionais. Não depender de downloads durante sessão.

## Cuidados indispensáveis
1. **Sincronização automática:** Firestore usa *last-write-wins* em mudanças concorrentes do mesmo documento. Para eventos imutáveis usa-se documento individual; para mudanças de plano simultâneas, nova revisão/cópia com escolha explícita, jamais sobrescrever de forma silenciosa.
2. **Operações offline:** `setDoc` e `writeBatch` funcionam offline e são propagados quando a rede volta. `runTransaction` que precisa ler dados do servidor falha offline; não usar para confirmar séries. *Batched writes* executam atomicamente e offline, úteis para múltiplos documentos sem leituras condicionais.
3. **Estados honestos:** `hasPendingWrites` indica modificações locais ainda não confirmadas; `fromCache` mostra dados potencialmente antigos ou incompletos. Mostrar as distinções na UX. Não apresentar `fromCache=false` como prova de inexistência de outras alterações simultâneas posteriores.
4. **Erro remoto:** write pode ser rejeitado posteriormente por regras, dados inválidos ou cotas; o SDK pode desfazer o reflexo otimista local. Exigir esquema estável e validação ANTES de gravar, regras testadas em Emulator Suite e plano de recuperação/exportação para falhas. Não prometer que a gravação é 'blindada' apenas porque apareceu localmente.
5. **Consulta offline incompleta:** o cache guarda documentos já carregados; coleção consultada sem cache pode retornar vazia. Pré-carregar planos ativos, calendário próximo e último histórico quando autenticado e online. Use catálogo empacotado no SW.
6. **Privacidade e logout:** dados cacheados persistentes NÃO são automaticamente removidos ao sair da conta. Perguntar se o aparelho é confiável antes de persistir informação física; em aparelhos compartilhados oferecer `memoryLocalCache()` desde a inicialização, sem cache persistente. Não tentar limpar cache automaticamente enquanto existem gravações pendentes. Troca de UID deve zerar views/subscriptions e nunca mostrar dados da conta anterior, mas não equivale a exclusão segura do cache físico. Planejar fluxo específico de apagar armazenamento quando seguro e tecnicamente possível.
7. **Quotas/garantia:** IndexedDB pode ser removido pelo usuário/navegador; browser pode evictar cache. Backup/export de eventos e restauração com dedupe são necessários. Solicitar persistent storage quando apropriado, sem afirmar garantia absoluta.
8. **Segurança:** Security Rules por UID e evento create-only, validação de ownerUid e campos, App Check preparado; autorização não substituída pelo cache. Admin/Gemini secrets apenas no servidor. Executar testes em emulador com duas contas.
9. **Custo:** persistência e leituras locais não equivalem a cobrança por todos os acessos. Reduzir listeners globais desnecessários, usar consultas paginadas, não gravar temporizador em nuvem a cada segundo.
10. **Multitabas:** Web SDK suporta `persistentMultipleTabManager()`; usar inicialização única do Firestore e adaptar para memória em navegadores não suportados. Testar em Chrome Android como alvo principal.

## Gates para aceitar a mudança
- Após entrar uma vez online, abrir PWA instalada sem rede: catálogo, plano ativo, sessões e calendário previamente carregados acessíveis.
- Registrar série com rede desligada, encerrar/retomar: aparece no cache local, sem duplicar.
- Voltar online: `hasPendingWrites` torna-se false e segundo dispositivo recebe evento.
- Tentativa de ler e editar eventos de outro UID falha; o mesmo para alterações de eventos imutáveis.
- Edição concorrente de um mesmo plano vira revisões separadas, não perda de edição.
- Rejeição posterior de write é visível e possui recuperação definida; simular `permission-denied` no emulador.
- Testar dois navegadores, múltiplas abas, cache desabilitado, ausência de documentos baixados e logout em dispositivo compartilhado.
- Mínimo de dados de perfil físico enviados; revisão de privacidade e segurança antes de publicar.

## Referências verificadas
- https://firebase.google.com/docs/firestore/manage-data/enable-offline
- https://firebase.google.com/docs/firestore/query-data/listen
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/reference/js/firestore
- https://firebase.google.com/docs/auth/web/auth-state-persistence
- https://firebase.google.com/docs/firestore/security/get-started
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
