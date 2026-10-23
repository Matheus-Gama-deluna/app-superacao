# Documentação atual do projeto

Consolidação da conversa de produto e das análises realizadas até a rodada que identificou a interface como v8.0.0, build 2026-10-22. Data documental de referência: 22/10/2026, fuso America/Sao_Paulo. Não é uma nova auditoria do código nem garantia do estado atual da produção.

## Ordem de leitura

1. [Visão e objetivos](VISAO_E_OBJETIVOS.md): propósito, público, jornada e limites.
2. [Decisões e regras](DECISOES_E_REGRAS.md): contratos desejados de dados e comportamento.
3. [Estrutura e manutenção](ESTRUTURA_E_MANUTENCAO.md): mapa do repositório e contribuição.
4. [Histórico](HISTORICO_E_MUDANCAS.md): evolução de v4 a v8, sem tratar planos como entregas.
5. [Estado e testes v8](ESTADO_E_TESTES_V8.md): evidência mais recente e pendências.
6. [Roadmap](ROADMAP.md): entregas ordenadas e critérios de saída.
7. [Planejamento consolidado v8](PLANEJAMENTO_CONSOLIDADO_V8.md): inventário amplo e 44 cenários de homologação; ler junto do relatório mais recente, que atualiza os resultados históricos.

## Como interpretar fontes

- **Decisão/requisito:** comportamento desejado; não significa implementação.
- **Observado:** resultado manual de um cenário identificado.
- **Declarado:** informação do relatório de implementação, sem verificação independente equivalente.
- **Hipótese:** explicação a investigar no código.
- **Não testado:** sem evidência suficiente; não classificar como aprovado ou falha comprovada.

Materiais de versões anteriores são preservados como histórico. Este conjunto atualiza a orientação documental para decisões discutidas na conversa, sem transformar uma proposta de arquitetura em descrição do código. Em caso de divergência, registrar explicitamente e revisar o requisito; não resolver apagando dados ou declarando sucesso sem teste.
