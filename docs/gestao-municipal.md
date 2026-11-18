# Administração municipal e plano de ação

## Navegação

**Gestão da APS**: Visão geral, Indicadores, Equipes e unidades, Plano de ação.

**Administração**: Dados e importação, Gestão de usuários.

Rotas:

- `/portal-atencao-basica/plano-acao`
- `/portal-atencao-basica/administracao/dados`
- `/portal-atencao-basica/administracao/usuarios`

O endereço anterior `/portal-atencao-basica/dados` redireciona para o novo endereço administrativo. O link da origem dos dados e o cabeçalho usam a rota nova.

## Gestão de usuários

- Cadastro e edição de nome, e-mail, perfil e situação.
- E-mails normalizados em minúsculas e únicos, incluindo usuários inativos.
- Perfis disponíveis: Administrador, Gestor da APS e Consulta.
- Busca por nome/e-mail e filtros por perfil/situação.
- Inativação e reativação, preservando o histórico de responsabilidades.
- Usuários ativos podem receber novas ações. Um responsável inativo já vinculado pode ser mantido na ação existente até sua substituição.

**Os perfis classificam o cadastro local; não implementam autorização.** Não há contas reais, convites, senhas, recuperação de acesso ou integração com um provedor de identidade. O login existente continua demonstrativo. Essas limitações são informadas na tela de usuários.

## Plano de ação

Uma ação contém título, descrição da intervenção, equipe, indicador C1, responsável, prazo e status: Pendente, Em andamento ou Concluída. A listagem permite busca e filtros por status, responsável, equipe e prazo. Atraso considera a data local do navegador e apenas ações não concluídas; prazo no dia de hoje não está em atraso.

As prioridades da visão geral e a análise individual do C1 permitem criar uma ação. Havendo ação aberta para a mesma equipe, indicador e direção do problema, o link passa a **Acompanhar ação**. A mesma regra bloqueia duplicação no salvamento, independentemente da competência. Direções diferentes podem ter ações distintas.

O cadastro registra a competência, o valor do C1, o tipo da prioridade, a identificação da equipe/unidade e a origem da base (SHA-256 ou exemplo). Esses campos de origem não são alterados na edição, mesmo que uma nova base atualize a produção ou os nomes. Quando a equipe deixa de existir na base ativa, sua ação continua disponível com os dados históricos e sinalização de ausência na base atual.

Observações de acompanhamento entram no histórico com data e hora. Mudanças de status, prazo e responsável também são registradas. Não é atribuído um autor fictício aos eventos, pois não existe sessão autenticada.

Para concluir, é obrigatório registrar uma avaliação textual e uma competência de revisão igual ou posterior à origem. O C1 da revisão é capturado da base disponível e preservado junto à avaliação. Se não houver resultado, a conclusão registra `null`, sem inventar melhora ou produzir percentual zero. O valor original, o resultado da revisão e o valor atual são mostrados separadamente.

Uma ação concluída pode ser reaberta se não houver outra ação aberta para a mesma prioridade. A revisão anterior permanece visível, e as avaliações de conclusão também ficam no histórico. Uma nova intervenção pode ser criada após a conclusão da anterior. Não há exclusão definitiva de ações nesta versão, para preservar o acompanhamento.

## Persistência e separação municipal

Os cadastros ficam no `localStorage`, separados da base C1:

`sobera:gestao:v1:<escopo>`

Escopos:

- `exemplo` para a base sintética.
- Código IBGE normalizado para seis dígitos, quando informado no arquivo importado.
- Nome normalizado do município, se não houver código IBGE.

Quando o arquivo passa a incluir IBGE após uma importação sem esse código, o escopo muda: não é feita migração automática dos cadastros. Sem IBGE, municípios homônimos não podem ser distinguidos apenas pelo nome. Para uso municipal real, incluir o código IBGE e posteriormente substituir essa identificação pelo município da sessão autenticada no backend.

Trocar a base de dados dentro do mesmo escopo preserva usuários e ações. Trocar o município ou retornar à base de exemplo muda os cadastros apresentados sem apagar os anteriores.

Não há sincronização entre navegadores/dispositivos. Os dados são validados na leitura e antes de gravar. Erros de armazenamento preservam o estado anterior. Se outra aba alterar o mesmo cadastro, uma gravação com estado antigo é bloqueada e solicita recarregar, evitando sobrescrita silenciosa. Essa verificação é local e não substitui controle concorrente transacional de um backend.

Cadastros inválidos não são sobrescritos automaticamente: a interface bloqueia gravações e oferece reinício dos cadastros do município mediante confirmação. A base de indicadores não é apagada por esse reinício.

## Implementação e validação

- Regras: `lib/gestao-municipal.ts`.
- Contexto: `lib/gestao-municipal-context.tsx`.
- Telas: `components/aps/plano-acao.tsx` e `components/aps/usuarios-municipais.tsx`.
- Vínculo nas prioridades: `components/aps/acao-prioridade.tsx`.
- `npm run test:gestao`: regras de cadastro, unicidade, ações, revisão, histórico e persistência.
- `npm run test:gestao:browser`: ciclo de cadastro, ação a partir de prioridade, status, revisão, filtros, recarregamento, inativação e isolamento municipal em perfil temporário de navegador.
- Os testes de importação continuam usando o mesmo utilitário de navegador isolado em `scripts/browser-harness.mjs`.

Próxima etapa de infraestrutura: backend, autenticação, autorização efetiva por perfil, identificação municipal consistente e persistência compartilhada. Nenhuma mensagem ou convite é enviado a usuários nesta versão.

## Perfil no topbar e sugestões

O topbar inclui menu de usuário com Meu perfil e Sair. Nome e e-mail podem ser editados e persistidos em `sobera:perfil:v1`, separadamente dos usuários administrativos. O perfil inicial é Marina Oliveira; não é uma pessoa autenticada nem cria automaticamente um cadastro municipal.

A visão geral inclui um carrossel manual de insights, com evidência, interpretação e próxima verificação. O motor em `lib/c1-insights.ts` usa regras determinísticas do C1; nenhum provedor de IA está conectado. A interface informa essa condição. O botão Gerar plano de ação abre um rascunho da intervenção para revisão e atribuição de responsável/prazo; não salva automaticamente. Uma ação já aberta para a mesma prioridade é reaproveitada.

O gráfico C1 por equipe complementa as séries de evolução e volumes. Equipes sem resultado não recebem uma barra de zero.

Na base de exemplo, os nomes das unidades Geribá, Ferradura e Cem Braças foram baseados nesta [publicação da Prefeitura de Búzios de setembro de 2026](https://buzios.rj.gov.br/buzios-realiza-campanha-de-vacinacao-antirrabica-no-dia-26/). As equipes, seus identificadores e os volumes de produção continuam sintéticos. Não é um levantamento completo da rede municipal.

O link de situação da base e a competência foram removidos do header a pedido do usuário. A situação da base está na seção administrativa. Separadores com travessão e ponto médio foram retirados dos textos das telas ativas.
