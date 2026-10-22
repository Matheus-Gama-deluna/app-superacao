# 01 — Visão, decisões e escopo funcional

**Produto:** Superação — aplicativo em português brasileiro, mobile-first, para construir um hábito de exercício físico com autonomia, clareza e progressão individual.

**Problema principal:** pessoas iniciantes ou retomando atividade física, especialmente em casa, têm dificuldade de escolher atividades compatíveis, executar, registrar e retornar à rotina. O app apoia, não substitui, avaliação ou prescrição profissional quando necessária.

## Decisões já tomadas
- MVP **com treinos reais executáveis e registráveis**, não só frontend.
- Home **híbrida**: missão/treino de hoje acessível, progresso básico e personagem simples; mapa RPG vem em versões futuras.
- Três origens de plano: **manual**, **modelo sugerido a partir de biblioteca/regras revisadas**, **plano cadastrado de profissional** com fonte/versão (portal do profissional futuro).
- Catálogo cobre casa sem aparelhos, faixas longas, mini bands, caminhada na rua, mobilidade, alongamentos e dias de recuperação.
- Registros por repetições **após** finalizar cada série; para exercícios cronometrados, registrar/confirmar duração real. Diferenciar planejado de executado; edição posterior permitida.
- Disponibilidade, equipamentos, objetivos ordenáveis, experiência, rotina e segurança alimentam planejamento. Usuário confirma mudanças.
- Descanso completo legítimo. Caminhada leve/mobilidade no dia de descanso só se opcional, apropriado e permitido pelo plano; sem penalidade por parar.
- Gamificação essencial: pequenas conquistas, progresso planejado/realizado, XP simples sem pressionar carga/repetições. Capítulos/cenários/competição posteriores.
- LLM **opcional e barata**, para conversação e compreensão de intenções, nunca fonte única de prescrição. Aplicativo permanece funcional offline sem IA.

## Escopo funcional P1 obrigatório
1. Onboarding curto e reeditável; objetivo principal e secundários com ordem explícita; dias/tempo disponíveis, ambiente, equipamentos (distinguir mini band, faixa longa, tubo e ponto de ancoragem); existência de plano de profissional; informação proporcional de segurança; usuário pode pular questões não necessárias.
2. Navegação Início / Treinos / Planejamento / Progresso / Perfil. Sem mapa vazio.
3. Biblioteca de exercícios: lista, busca e filtros por modalidade, local, equipamento, padrão, dificuldade candidata; detalhes com instruções textuais, cautelas e indicador de revisão.
4. Editor de treino: novo, duplicar modelo, editar; nome, exercícios ordenados, séries, meta de repetições/tempo, descanso, exclusão/edição; salvar localmente.
5. Treinos de profissional: registrar manualmente autoria e versão sem alegar verificação; importação avançada futura.
6. Sugestões: somente **templates `publishable=true` e revisados** podem ser oferecidos como propostas automatizadas. No seed atual todos estão pendentes: oferecer como amostras de estrutura para o desenvolvedor, com texto visível, **não como recomendações ao público**.
7. Agenda: planejar semana, descanso completo, caminhada e mobilidade opt-in, reagendar, ajustar sem apagar histórico; mostrar próxima sessão.
8. Execução: início, séries concluídas e confirmação de dados reais, pausas e timers, retomar após background/reload, feedback de esforço opcional, salvar cada série em transação.
9. Histórico e progresso: resumo semanal, sessões planejadas/realizadas, séries feitas, registro de caminhadas, metas de regularidade relativas à agenda, pequenas conquistas e exportação de dados.
10. Dados persistentes: cache IndexedDB gerenciado pelo Firestore SDK, com sincronização offline nativa; não depender somente de React state ou localStorage para sessões. Backup JSON exportar/importar, schema versionado e testes de dados offline. Offline após carregamento inicial e assets locais.
11. Privacidade: não coletar peso, foto ou saúde detalhada sem propósito; excluir/exportar informações. Nunca enviar histórico integral para LLM automaticamente.
12. UX em PT-BR, acessível, legível no Android, fonte >= 16px em entradas, botões grandes, sem interações obrigatórias durante repetição.

## Fora do primeiro MVP
- RPG completo com mapas/capítulos/loja/itens.
- Ranking público, amigos, duelos, feeds sociais.
- Portal sincronizado para profissionais, pagamento, telemetria invasiva.
- Detecção automática de repetições pela câmera, avaliação médica por IA.
- 1.000 vídeos/GIFs de fonte incerta; não instalar assets sem licença.
- LLM permanente, voz em tempo real, agentic loop com acesso direto a alterar o plano.

## Etapas de entrega
**Sprint 01:** scaffold web, navegação, seed, catálogo, editor e Firestore com cache persistente.
**Sprint 02:** executor de séries, timer, descanso, persistência/resumo.
**Sprint 03:** onboarding, calendário, planos de três origens, continuidade, status segurança e revisão de templates.
**Sprint 04 (opcional):** chat barato via servidor, ação estruturada e confirmação do usuário.

**Indicadores de aceite:** primeira sessão possível, progresso salvo após reload, histórico fiel, próxima sessão localizável, dia de descanso sem obrigatoriedade, catálogo navegável, nenhum elemento falso/placeholder funcional.
