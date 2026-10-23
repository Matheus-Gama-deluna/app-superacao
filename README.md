# Superação

Aplicativo em português brasileiro para construir uma rotina possível de exercícios, registrar o realizado e acompanhar evolução pessoal. Prioriza autonomia, clareza e constância sem cobrança.

- Aplicativo publicado: https://superacao-app-65.web.app/
- [Documentação atual e ordem de leitura](docs/projeto/README.md)
- [Visão e objetivos](docs/projeto/VISAO_E_OBJETIVOS.md)
- [Decisões de produto e domínio](docs/projeto/DECISOES_E_REGRAS.md)
- [Histórico e mudanças](docs/projeto/HISTORICO_E_MUDANCAS.md)
- [Última análise manual da v8](docs/projeto/ESTADO_E_TESTES_V8.md)
- [Próximas entregas](docs/projeto/ROADMAP.md)

## Estado do projeto

Há uma aplicação implementada e publicada, além de materiais históricos de especificação. Publicação não significa homologação integral. A última rodada manual identificou avanços em sessões parciais e referências iniciais, mas manteve bloqueios na proposta e personalização. Consulte o relatório de testes antes de considerar um requisito concluído.

## Desenvolvimento local

O repositório contém React, TypeScript, Vite, Tailwind e dependências Firebase. Os comandos abaixo correspondem aos scripts existentes; não foram executados nesta alteração documental.

1. Instale as dependências com `npm install`.
2. Consulte `.env.example` e a configuração Firebase existente para preparar seu ambiente. Nunca versionar credenciais ou arquivos locais de segredos. Não presumir que uma chave Gemini seja necessária para todos os fluxos.
3. Execute `npm run dev` (porta configurada: 3000).

| Comando | Script atual |
|---|---|
| `npm test` | Vitest em execução única |
| `npm run lint` | TypeScript: `tsc --noEmit` |
| `npm run build` | Build Vite |
| `npm run preview` | Preview da build |

## Publicação e contribuição

O workflow `.github/workflows/firebase-hosting-merge.yml` publica no Firebase Hosting em pushes na `main`, após testes e build. Mudanças devem ser revisadas em branch/PR; não confundir preview de PR com produção. Ver [estrutura técnica e fluxo de trabalho](docs/projeto/ESTRUTURA_E_MANUTENCAO.md).

## Materiais históricos

[README do kit v4](README_COMECE_AQUI.md), [prompt mestre original](PROMPT_MESTRE_AI_STUDIO.md), `docs/01` a `docs/12`, `Superacao_Kit_v4/` e o [plano v7](Superacao_v7_Plano_e_Prompt_Melhorias.md) são referências de origem. Afirmações como “não é um aplicativo implantado” descrevem o kit original, não o estado atual. O índice atual distingue intenção de produto, proposta técnica e evidência observada.
