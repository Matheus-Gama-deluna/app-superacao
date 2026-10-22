# SUPERAÇÃO — Kit completo: estrutura + identidade visual | v4 | 22/10/2026

**Objetivo:** enviar para **Google AI Studio > Build > Web** uma especificação única do MVP funcional, com PWA mobile-first, Google Authentication, Cloud Firestore com cache offline nativo, treinos executáveis e experiência visual definida. Não é um aplicativo implantado. Não sobrescrever o Firestore nativo com Dexie/outbox própria.

## Comece por estes arquivos
1. `PROMPT_MESTRE_AI_STUDIO.md` — prompt único para projeto novo (base técnica+visual).
2. `docs/11_AUDITORIA_ANTES_DESIGN.md` — estado real do material e riscos restantes.
3. `docs/07_IDENTIDADE_VISUAL.md` e `visual/design-tokens.json` — direção visual *proposta*.
4. `visual/PROTOTIPO_NAVEGAVEL.html` — navegação demonstrativa HTML local (sem backend). Abra no navegador para explorar as telas.
5. `visual/previews/` — screenshots do protótipo em celular/canvas, criados localmente a partir do nosso HTML.
6. `docs/08_INVENTARIO_TELAS_ESTADOS.md` — telas e ações; `docs/09_REFERENCIAS_VISUAIS.md` — referências e URLs.
7. `docs/10_PROMPT_VISUAL_AI_STUDIO.md` e `prompts/SPRINT_05_DESIGN_UI.md` — direcionamentos adicionais de implementação visual.
8. `docs/01` a `06`, `firebase/`, `data/`, `schemas/` e `tests/` — produto, backend, seed e gates da v3 preservados.
9. `Superacao_Planejamento_Completo_Visual_v4.xlsx` — **17 abas** incluindo telas, componentes, referências, QA visual e tokens de design.

## Sequência sugerida no AI Studio
- 00: provisionar Firebase Auth/Firestore/Rules e configurar cache persistente nativo. Login real requer conexão inicial; não fingir sucesso remoto no offline.
- 01: biblioteca, editor e arquivos seed.
- 02: executar, registrar reps reais, descanso e retomar; histórico fiel e status de sincronização.
- 03: agenda, onboarding, progresso e privacidade.
- 05: implementar identidade visual do protótipo no **app React real**. Também pode acontecer paralelamente às telas de cada sprint.
- 04: IA conversacional **opcional**, depois da estabilidade dos fluxos centrais.

### Como enviar o kit
AI Studio pode importar repositórios GitHub e trabalhar com múltiplos arquivos. Se o upload de ZIP não for aceito diretamente, descompacte e anexe arquivos individualmente ou publique os documentos num repositório GitHub. Não espere que o AI Studio 'leia tudo' se ele não conseguir acessar os anexos; peça que informe quais faltaram. O protótipo HTML NÃO substitui o banco nem o executor no Build.

## Itens ainda pendentes antes de permitir uso público
- Validação profissional de exercícios e modelos; todos 44 exercícios e 9 templates são dados de engenharia pendentes de revisão e templates estão `publishable=false`.
- Regras Firestore e isolamento por UID testados no Emulator Suite; conflitos/rejeição offline; exclusão de conta correta.
- Testar PWA instalada em Android físico com sem-rede, suspensão e retomada.
- Confirmar privacidade, licenças de mídia, acessibilidade e dados de usuário.

**Mudança em relação ao v3:** adicionados protótipo visual, design tokens, inventário, referências, prompts visuais, previews, 5 abas na planilha. Firebase v3 permanece como arquitetura adotada.
