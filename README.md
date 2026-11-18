# SOBERA — Inteligência em Saúde

Aplicação voltada à gestão municipal da Atenção Primária à Saúde (APS), com indicadores, painéis de desempenho e acompanhamento de planos de ação.

## Desenvolvimento

Use Node.js 20.19 ou superior na série 20, ou 22.12 ou superior na série 22. Instale as dependências com `npm ci` e execute `npm run dev`. Para gerar ou atualizar o arquivo de dependências, use `npm install`.

- `npm run build`: gera a aplicação em `dist/`.
- `npm run preview`: serve o build localmente.
- `npx tsc --noEmit --incremental false`: verifica os tipos.
- `npm run test:indicadores` e `npm run test:analises`: verificam cálculos e análises do C1.
- `npm run test:importacao` e `npm run test:gestao`: verificam importação e regras de gestão.
- `npm run test:interface`: verifica a renderização das rotas e estados principais.
- `npm run test:analises:browser`, `npm run test:importacao:browser` e `npm run test:gestao:browser`: verificam os fluxos em navegador headless. Os testes de navegador requerem Chrome ou Edge instalado.

## Estrutura e navegação

- React 19, TypeScript, Vite, React Router, Tailwind CSS e Recharts.
- Entrada em `src/main.tsx`; rotas em `src/router.tsx`.
- A página inicial direciona ao login único em `/login/aps`.
- As funcionalidades estão em `/portal-atencao-basica`, preservando os endereços existentes da APS.
- Gestão da APS: Visão geral (`dashboard`), Indicadores (`indicadores`), Equipes e unidades (`equipes`) e Plano de ação (`plano-acao`).
- Administração: Dados e importação (`administracao/dados`) e Gestão de usuários (`administracao/usuarios`). A rota anterior `dados` redireciona para o novo endereço. As antigas rotas assistenciais direcionam para a visão geral.
- Endereços desconhecidos retornam à entrada da aplicação.
- Os adaptadores em `src/compat/` permitem reaproveitar imports de navegação e imagens do Next.js.
- O roteamento usa `BrowserRouter`, sem `#`. A base local é `/`; o build de deploy usa `/sobera/`. O roteador acompanha a base do Vite.
- `npm run deploy` compila e publica a pasta `dist` na branch `gh-pages` do repositório `mathunes/sobera`, sem alterar o `origin`. No destino, configure Settings → Pages para publicar `gh-pages` a partir da raiz. O arquivo `404.html` encaminha rotas diretas para a aplicação, que restaura o endereço original. O fallback é específico de `/sobera/`.

## Estado atual

O login continua demonstrativo, sem autenticação real. A aplicação inicia com dados de exemplo e permite substituí-los por uma base CSV mensal validada na tela Dados e importação. A base importada é salva neste navegador e alimenta todos os painéis. Não há conexão automática com o Ministério da Saúde. A compatibilidade com um layout oficial real ainda precisa ser homologada.

Os filtros de competência e unidade são compartilhados durante a navegação e reiniciam ao recarregar a aplicação; os dados importados permanecem salvos. A seleção de equipe na análise do C1 é registrada na query string (`?equipe=...`). O município passa a ser o da base importada. O universo de equipes do arquivo não comprova cadastro completo ou elegibilidade para financiamento.

Veja [Importação mensal do C1](./docs/importacao-c1.md) para o formato aceito, regras de validação, persistência e limitações da homologação. Há um [modelo CSV sintético](./public/exemplos/c1-modelo.csv) disponível também na interface.

O Plano de ação permite registrar intervenções a partir das prioridades, atribuir responsáveis, acompanhar prazos/status e registrar a revisão do C1. A gestão de usuários oferece cadastro, edição e inativação. Ambos são salvos localmente por município; os perfis são classificações, sem contas ou permissões reais. Veja [Administração municipal e plano de ação](./docs/gestao-municipal.md) para regras e limites da persistência.

Regras e dados estão em `lib/aps-indicadores.ts`; o contexto de filtros está em `lib/aps-indicadores-context.tsx`; as telas e componentes ficam em `components/aps/`. A nota metodológica de referência é a C1, SEI 0054814890, de junho de 2026. Classificações são por equipe; agregados municipais e por UBS são análises próprias do SOBERA. O painel não calcula a avaliação quadrimestral ou repasses.

Consulte [CONTEXTO-SOBERA-APS-C1.md](./CONTEXTO-SOBERA-APS-C1.md) para o estudo do indicador C1, métricas propostas, fontes oficiais e decisões pendentes.
