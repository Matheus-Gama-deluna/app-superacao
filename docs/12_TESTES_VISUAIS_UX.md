# 12 — Gate de qualidade visual e funcional (testar no app real)

| ID | Cenário de teste | Aceitação |
|---|---|---|
| UX-01 | 360x800 e 390x844 | CTA principal visível, bottom nav não cobre ação ou conteúdo |
| UX-02 | Fonte ampliada 200% | Texto não sobrepõe botão, rolagem funcional |
| UX-03 | Acessibilidade teclado e leitor | Rótulos, ordem lógica, focus ring visível |
| UX-04 | Toque com uma mão | Ações críticas >=48px de altura; sem gesto drag obrigatório |
| UX-05 | Fluxo após série | "Concluir série" ABRE confirmação real de repetições; cancelar não grava |
| UX-06 | Descanso e background | Timer recalcula por endsAt e mantém registro; aviso não finge alarme exato |
| UX-07 | Retorno após pausa | Preserva série e histórico, mensagem acolhedora, replanejar opcional |
| UX-08 | Dia de descanso | Descanso pleno visível sem pressão por caminhada ou XP |
| UX-09 | Sem internet | Conteúdo cacheado disponível, indicador visível, sem spinner infinito |
| UX-10 | Write pendente | Exibir 'Salvo neste aparelho' ou 'Aguardando sincronização' |
| UX-11 | ACK remoto | Exibir 'Sincronizado' somente com metadados confiáveis |
| UX-12 | Permission denied posterior | Exibir falha, explicar recuperação, não sumir com dado sem aviso |
| UX-13 | Catálogo seed sem revisão | Não exibir 'recomendado para você' ou 'aprovado' |
| UX-14 | Sem documentos Firestore em cache | Não confundir com usuário sem plano |
| UX-15 | Troca de conta/dispositivo não confiável | Nenhuma informação anterior aparece; cache/privacidade testados |
| UX-16 | Usuário com plano de profissional | Rótulo de autoria e proteção contra alteração silenciosa |
| UX-17 | Assistente desabilitado | Não há CTA IA inoperante ou bloqueio ao editor |
| UX-18 | Tema claro/escuro e reduzir movimento | Contraste, foco e conforto preservados |

**Observação:** o HTML do kit demonstra componentes e estados, mas não satisfaz esse gate; realizar testes após gerar React/PWA e provisionar Firebase.
