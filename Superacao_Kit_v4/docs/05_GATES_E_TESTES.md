# 05 — Critérios de aceite, segurança e riscos

## Checklist objetivo de funcionalidade
- Catálogo: renderiza dados seed, filtra casa/bandas/rua/mobilidade, mostra estado da revisão sem fingir mídia.
- Editor: cria, edita, ordena, salva, duplica e exclui treinos; aplica schema e trata inconsistências com mensagem PT-BR.
- Sessão: começa, registra reps após série, confirma duração, descanso, pausa, retomada após reload, conclui, histórico consistente.
- Calendário: dias de treino/descanso/com recuperação opcional, reagendar, atrasos sem sumiço de histórico.
- Progresso: séries/sessões sem duplicação, XP por evento único, comparações apenas equivalentes, tela explicável.
- Backup: exportar/importar arquivo JSON íntegro; restaurar registros do Firestore via importação validada; sem sobrescrever sem confirmação.
- Offline: app carregado consegue registrar sessões sem conexão, com dados locais. Detectar limites de instalação/storage do navegador.
- Onboarding: não obriga peso/foto/sexo; identifica origem profissional e equipamento; evita falsas liberações médicas.
- IA opcional: indisponibilidade de servidor/chave não quebra app, não expõe segredos no client, não autoaplica mudanças.

## Gates Firebase desde o início
- Firebase Auth Google login funciona; após login, PWA reabre offline usando dados locais desta identidade; primeiro login precisa de internet.
- Cada conta só pode ler seus próprios dados no Firestore; regras negam leitura e gravação cruzada; Emulator Suite validado.
- Série confirmada offline aparece no listener local com hasPendingWrites=true; ao conectar e obter ACK, hasPendingWrites=false; outra sessão recebe sem duplicação.
- Se app fechar com write pendente, reabrir preserva mutações no cache persistente quando disponível; SDK retoma envio depois. Testar em dispositivo físico, e testar rejeição posterior.
- Edição de mesmo plano em dois celulares é resolvida explicitamente, sem substituir o plano do outro aparelho automaticamente.
- Falha de auth/permission-denied/quota: local continua funcionando, mostra erro e preserva pendências sem declarar sincronização concluída.
- Logout/troca de contas impede revelar cache de usuário anterior; pendências locais não devem sumir silenciosamente.
- Conexão Firestore e uso de SDK não garantem durabilidade absoluta do navegador; oferecer export/import e considerar sync como cópia secundária autenticada.

## Limites e segurança para beta
- **Exercícios/templates seed = NÃO REVISADOS**. Não lançar sugestões automáticas ou treinos pré-montados como aprovados até revisão por profissional de educação física habilitado.
- Entrada de planilhas pessoais/profissionais pode ser registrada para execução, mas o aplicativo não garante adequação clínica.
- Triagem breve serve para reconhecer necessidade de avaliação/encaminhamento; não certifica aptidão para exercício.
- Dor/sintomas preocupantes durante exercício: interrupção e orientação de busca por avaliação adequada; não gerar substituição automática.
- Faixas/mini bands: registrar tipo, âncora e cautela com ruptura/retorno; não assumir equivalência por músculo.
- Caminhada na rua: GPS opcional, tempo/distância autodeclarados. Descanso total é válido.
- Dados físicos e de saúde podem ser sensíveis sob LGPD. Garantir finalidade, minimização e controles de armazenamento/exportação/exclusão.
- Para recomendações divulgadas ao público, o revisor precisa validar cobertura, volume, progressão, alternativas, instrução, contraindicação relevante, adequação à população e atualização periódica.

## Como o AI Studio deve testar
1. Executar testes automatizados de regras puras: idempotência, nenhum `actual_reps` implícito, transição de estado, validação JSON.
2. Fazer smoke test no preview: editor salvar, reabrir, treino terminar, histórico recarregar.
3. Testar Android Chrome real: bloquear tela, voltar, alternar apps, reabrir, cair Wi-Fi, fechar guia; ninguém perde série salva.
4. Checar import/export, versão de schema, sem identificador de usuário real em dados de demo.
5. Testar dia de descanso e plano profissional sem alterações silenciosas.
6. Testar `GEMINI_API_KEY` ausente e 429 sem falha de fluxo principal.

## Gate de saída
Primeiro MVP pronto para DEMONSTRAÇÃO se 100% das operações de catálogo/editor/sessão/histórico/cadastro estão funcionais e os testes críticos passam. Primeiro MVP pronto para PILOTO REAL com recomendações somente depois que modelos utilizados estiverem aprovados por profissional habilitado e controles de privacidade forem avaliados. Sem confundir demonstração de engenharia com segurança profissional.
