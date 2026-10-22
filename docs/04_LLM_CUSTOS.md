# 04 — Conversação com LLM barata: arquitetura, preços e controles

**Princípio:** motor determinístico de planos/séries/agenda é o sistema de registro e decisão. LLM é opcional, usada para compreender linguagem natural, explicar, conversar e produzir propostas que o usuário confirma. O app funciona sem IA externa.

## Casos de alto valor/baixo custo
1. "Só tenho 15 minutos e minha mini band hoje" -> extrair intenção/limites, filtrar catálogo e mostrar opções **já revisadas**, não inventar séries.
2. "Troca esse movimento porque não tenho cadeira" -> buscar alternativas permitidas e explicar; pedir confirmação antes de salvar plano.
3. "Como fui esta semana?" -> resposta com agregados locais (sessões feitas/planejadas, sem detalhes de saúde), incentivo sem culpa e opção de revisar agenda.
4. "Como funciona esse exercício?" -> explicar a ficha revisada, não oferecer diagnóstico nem avaliação de técnica por visão sem validação.
5. "Quero voltar depois de parar" -> acolher e encaminhar revisão de rotina; não prescrever volume compensatório.

## Modelos e custos públicos consultados 20/10/2026
- `gemini-2.5-flash-lite` padrão pago: **US$0,10/M tokens entrada + US$0,40/M tokens saída**. Modelo econômico de fallback.
- `gemini-3.1-flash-lite` padrão pago: **US$0,25/M entrada + US$1,50/M saída**. Modelo mais novo para comparar qualidade de entendimento e JSON.
- `gemini-3.5-flash-lite` padrão pago: **US$0,30/M entrada + US$2,50/M saída**. Comparar qualidade para pedidos complexos.
- Preços e limites variam; conferir página oficial antes de publicar: https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br .

### Cenário ilustrativo de tokens
**2.000 tokens de entrada + 400 de saída** por solicitação de texto (sem ferramentas, sem grounding, sem tokens extras de raciocínio):
- 2.5 Flash-Lite: **US$0,00036/chamada**, aproximadamente **US$0,36/1.000 chamadas**.
- 3.1 Flash-Lite: **US$0,00110/chamada**, aproximadamente **US$1,10/1.000 chamadas**.
- 3.5 Flash-Lite: **US$0,00160/chamada**, aproximadamente **US$1,60/1.000 chamadas**.
São estimativas matemáticas, não garantias nem custo total. Não incluem hosting/Firestore, saída de pensamento adicional, ferramentas, mídia, impostos, retries ou contexto maior. Monitorar tokens reais e testar preço de cada modelo.

## Política de roteamento recomendada
- `rules_only` para composição, progressão, calendário e execução.
- `small` Gemini 2.5 Lite ou 3.1 Lite para classificação de intenção/explicações e resposta simples; experimentar A/B de qualidade. Use nome configurável `GEMINI_MODEL_CHEAP` com fallback.
- `better` (3.5 Lite ou Flash após benchmark) só quando pedido ficar ambíguo, com limite por usuário/dia, opt-in, sem enviar dados de saúde desnecessários.
- Rate limit por IP/usuário no servidor, caps de tokens, budget diário/mensal, cache de explicações de exercícios, logs redigidos/sem dados sensíveis, retry curto em 429, fallback a UI determinística.
- Chamar LLM **somente por ação explícita** no chat, nunca a cada série/abertura/calendário.

## Privacidade e dados sensíveis
Documentação Google indica que o **nível gratuito pode usar conteúdo para aprimorar produtos**, ao passo que o nível pago da Gemini API não o utiliza para esse fim segundo as condições publicadas. Portanto, para um produto com possíveis dados físicos/saúde, **não enviar informações identificáveis ou sensíveis pelo nível gratuito** sem base legal/garantias compatíveis. Preferir uso pago mínimo com consentimento específico, dados agregados e minimização. Ver https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br . Consultar requisitos LGPD e política de retenção antes do beta.

## Protocolo de segurança
- Servidor constrói contexto mínimo: nomes/IDs de exercícios **aprovados**, metadados de metas/agenda consentidos e resumo estatístico. Nenhuma nota médica integral por padrão.
- LLM retorna JSON validado por schema (`schemas/llm-action.schema.json`) com `intent`, `reply_pt`, `candidate_exercise_ids`, `proposed_changes`, `requires_confirmation`, `risk_flag`.
- Servidor valida `exercise_id` em catálogo, `review_status` e elegibilidade, limites de plano e autoria; ações de mudança exibem um preview de diff e pedem confirmação expressa.
- Em alerta de dor/sintomas preocupantes ou dúvidas sobre segurança, não ajustar prescrição automaticamente; orientar avaliação apropriada e priorizar segurança.
- Chaves apenas no servidor AI Studio Web (`GEMINI_API_KEY` como secret). Se não houver chave ou rede, chat mostra fallback informativo e **nunca bloqueia treino**.

## Prompt interno sugerido (sistema)
Você é o assistente opcional de conversação do Superação, em português brasileiro. Sua função é entender pedidos relacionados ao catálogo e a planos de treino já validados; explicar fontes fornecidas e criar propostas estruturadas sem executar mudanças. Nunca diagnostique, substitua avaliação médica/profissional, invente exercícios, taxas de esforço, doses, cargas ou limites. Apenas referencie IDs fornecidos no contexto. Se não houver template revisado elegível, diga claramente e ofereça edição manual ou consulta profissional. Em caso de dor/sintomas preocupantes, não propor exercício substituto de forma autônoma. Devolva objeto JSON conforme schema; marcadores de risco prevalecem. Nunca declare que uma sugestão foi aplicada sem a pessoa confirmar no app.
