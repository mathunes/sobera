# SOBERA — contexto de produto e estudo inicial do C1

Registro da conversa em 19/10/2026. Documento para retomada em outras sessões.

**Estado atual:** o SOBERA está implementado como aplicação de gestão da APS com foco inicial no C1. As seções a seguir preservam decisões e registros históricos, que podem descrever etapas anteriores. Para instalação, rotas e limitações atuais, consulte o README. As telas assistenciais anteriores e os arquivos exclusivos delas foram removidos da cópia de trabalho; a homologação de uma exportação real do C1 continua pendente.

## Objetivo e decisões da conversa

- O sistema será direcionado para **SOBERA — Inteligência em Saúde**.
- O projeto atual nasceu sem escopo bem definido, com portais Hospitalar, Atenção Básica, Administrativo e Recepção.
- O usuário considera criar uma branch separada para iniciar a nova vertente, aproveitando o sistema atual como base. A branch ainda não foi criada nesta conversa.
- O foco inicial é **APS — Centro da Rede**, especialmente indicadores de APS, painéis de desempenho e, como direção de evolução, jornada do paciente.
- Referência visual local: `mapa conceitural do sus.png`, na raiz (esse é o nome efetivo do arquivo).
- A proposta inicial é consumir indicadores publicados para apontar áreas que precisam de atenção nos municípios e gerar análises derivadas úteis à gestão.
- O primeiro indicador estudado é o **C1 — Mais acesso à APS**, no contexto do cofinanciamento federal instituído pela Portaria GM/MS nº 3.493/2024 e suas atualizações.
- O usuário gostou das métricas sugeridas e solicitou preservar esta análise. Isso não equivale à aprovação de um escopo fechado de implementação.
- Nenhuma alteração funcional foi solicitada ou executada nesta etapa.

## Projeto atual: orientação técnica

- React 19, TypeScript, Vite, React Router, Tailwind CSS 4, componentes Radix e gráficos Recharts.
- Entrada: `src/main.tsx`; rotas: `src/router.tsx`. Inicialmente usava `HashRouter`; agora utiliza `BrowserRouter`, conforme a atualização de URLs registrada abaixo.
- Páginas em `app/`; componentes compartilhados em `components/`; dados e utilitários em `lib/` e em módulos próximos às páginas.
- Os imports `next/link`, `next/navigation` e `next/image` usam adaptadores em `src/compat/`, configurados no Vite e no TypeScript. A execução efetiva usa Vite.
- Os fluxos examinados usam dados simulados e estado local. Não foi identificada integração com backend ou autenticação real; os logins simulam carregamento e redirecionam.
- Na avaliação inicial, o módulo da APS continha telas assistenciais que foram posteriormente removidas do SOBERA.

## C1: definição e regras verificadas

Fonte principal: nota metodológica oficial consultada em 19/10/2026, documento SEI nº 0054814890, assinado em junho de 2026. A nota informa que revoga a versão SEI nº 0050084955.

**C1 (%) = atendimentos de demanda programada / (atendimentos de demanda programada + atendimentos de demanda espontânea) × 100.**

- Programada: consulta agendada programada, cuidado continuado e consulta agendada.
- Espontânea: escuta inicial/orientação, consulta no dia e atendimento de urgência.
- Unidade de análise: equipe, identificada pelo INE.
- Equipes contempladas: eSF e eAP, tipos 70 e 76, observados os critérios metodológicos.
- Considera registros de Atendimento Individual presencial, domiciliar e remoto, respeitando os critérios de identificação de pessoas, profissionais e vinculação a equipe/estabelecimento.
- CBO contemplados na versão consultada: 2251-42, 2251-70, 2251-30, 2251-25, 2252-50, 2235-65 e 2235-05. A atualização incluiu médico clínico e ginecologista/obstetra.
- Fontes: Siaps e SCNES.
- Atualização e monitoramento mensais; avaliação quadrimestral. Indicador não acumulativo.
- A nota informa extração do Siaps no 20º dia útil de cada mês e última competência válida do SCNES. Não confundir data de extração com garantia de publicação ou disponibilidade no SOBERA.

| Classificação oficial | Resultado |
| --- | --- |
| Ótimo | > 50% e ≤ 70% |
| Bom | > 30% e ≤ 50% |
| Suficiente | > 10% e ≤ 30% |
| Regular | ≤ 10% ou > 70% |

**Quanto maior, melhor não se aplica ao C1.** Valores baixos podem sugerir pouca oferta de cuidado programado; valores altos podem sugerir barreiras à demanda espontânea. São hipóteses para investigação, não causas comprovadas.

O indicador mede a composição dos atendimentos realizados. Isoladamente, não mede pessoas únicas com acesso, cobertura populacional, vagas disponíveis, tempo de espera, demanda reprimida ou qualidade clínica.

Problemas de classificação dos registros e envio tardio podem afetar os resultados. Preservar fonte, competência, data de obtenção e versão metodológica de cada análise; mudanças de metodologia podem afetar comparações históricas.

## Pergunta de gestão para o primeiro módulo

**Quais equipes precisam de apoio para equilibrar o cuidado programado e o atendimento das necessidades que surgem no dia?**

Proposta de valor: identificar a situação, explicar a evidência, orientar a investigação e acompanhar a ação municipal.

## Métricas propostas para o SOBERA

As análises derivadas abaixo são propostas do produto; não devem ser apresentadas como novos indicadores oficiais do Ministério da Saúde. A viabilidade depende dos campos e da granularidade efetivamente disponíveis.

| Métrica/análise | Apresentação | Utilidade municipal |
| --- | --- | --- |
| C1 por equipe e UBS | Resultado, faixa oficial e volumes | Localizar necessidade de apoio; agregação por UBS requer vínculo INE–CNES válido no período |
| Distribuição das equipes por faixa | Quantidade e percentual em cada classificação | Dimensionar a situação municipal; explicitar universo de equipes e ausências |
| Evolução mensal | C1, programados, espontâneos e total | Distinguir mudança de composição de mudança de volume |
| Persistência fora da faixa ótima | Meses consecutivos abaixo ou acima do intervalo | Priorizar recorrências, com indicação da direção do desvio |
| Mudanças de faixa | Entradas e saídas da faixa ótima | Acompanhar avanços e deteriorações |
| Distância até a faixa ótima | Diferença em pontos percentuais, com direção | Diferenciar proximidade dos limites; respeitar limite inferior estrito de 50% |
| Concentração dos atendimentos fora da faixa | Parcela do total municipal realizada por equipes fora do intervalo | Dimensionar o volume assistencial envolvido, sem confundir atendimentos com pessoas |
| Disponibilidade dos dados | Competências ausentes, denominadores zerados e atualização | Evitar interpretação de ausência como desempenho zero |

Regras analíticas propostas:

- Sempre acompanhar o percentual de numerador e denominador, quando disponíveis.
- Se os campos tiverem a mesma definição e universo, espontâneos podem ser derivados de total menos programados.
- Um agregado municipal analítico pode ser calculado por soma dos programados / soma dos atendimentos elegíveis × 100. Não usar média simples dos percentuais das equipes para representar a composição dos atendimentos municipais.
- Identificar esse agregado como cálculo do SOBERA; não apresentá-lo como avaliação federal ou classificação oficial do município.
- Mostrar a distribuição entre equipes junto ao agregado: resultados municipais podem ocultar extremos opostos.
- Diferenciar universo cadastrado, equipes avaliadas e equipes válidas para cofinanciamento. Sem essa distinção, proporções de equipes podem induzir erro.
- Denominador zero não deve resultar em classificação automática como Regular; tratar como situação sem cálculo e investigar o motivo.
- Mudanças de volume e saltos abruptos são sinais para verificação, não prova de falha assistencial ou de transmissão.
- Comparações entre municípios precisam de contexto e critérios de comparabilidade; ranking simples não foi definido como prioridade.

### Exemplo de interpretação

| Período hipotético | Programados | Espontâneos | C1 |
| --- | --- | --- | --- |
| Mês anterior | 400 | 600 | 40% |
| Mês atual | 400 | 200 | 66,7% |

O C1 entrou na faixa Ótimo, mas não houve aumento de programados e o total de atendimentos caiu. Investigar redução de procura, interrupção de oferta, transmissão ou outras mudanças antes de afirmar melhora do acesso.

## Alertas e acompanhamento de ações

Formato proposto: **evidência → hipóteses → próxima verificação → ação acompanhada**.

Exemplo: equipe com baixa participação de programados por três meses. Verificar organização da agenda, continuidade do acompanhamento, disponibilidade de profissionais e classificação dos registros.

Para C1 acima de 70%, investigar acolhimento no mesmo dia, barreiras de entrada e registro da demanda espontânea. Não orientar restrição de atendimento para melhorar percentual ou mera reclassificação artificial de registros.

Possível funcionalidade: registrar responsável, ação pactuada, prazo e revisão do resultado. Ainda é proposta, sem implementação aprovada.

## Monitoramento, avaliação e financiamento

- Distinguir resultado mensal de monitoramento e avaliação quadrimestral oficial.
- O manual do Siaps descreve conceitos mensais, médias, pesos e notas na avaliação do componente. Não reconstruir avaliação financeira por simples agregação de atendimentos ou média não validada de percentuais.
- Preservar o resultado oficial publicado e identificar cálculos próprios ou projeções.
- O C1 isolado não determina o repasse: o componente considera o conjunto dos indicadores, a classificação e as demais regras aplicáveis.
- Simulações financeiras ficaram sugeridas para uma etapa posterior, após estudo das regras vigentes e dos dados necessários. Nenhum valor ou fórmula de repasse foi validado nesta etapa.

## Dados: o que foi confirmado e o que falta validar

A documentação do Siaps registra acesso público e, na versão 1.8, inclusão de numeradores e denominadores nos arquivos do componente Qualidade. Isso não comprova, por si só, a disponibilidade de todos os campos, competências e recortes necessários em acesso público automatizado.

**Não foi baixado nem validado um arquivo público real nesta etapa. Não foi confirmada API pública específica do C1.** A página de relatórios foi acessada, mas não forneceu conteúdo tabular no mecanismo de consulta utilizado.

Antes de fechar o escopo de ingestão:

1. Obter e inspecionar uma exportação real do C1.
2. Confirmar acesso público versus restrito, formatos e condições de obtenção.
3. Validar identificadores, numerador, denominador, resultado, classificação, competências e série histórica.
4. Validar relação entre INE, CNES e município em cada período.
5. Verificar revisões de competências, ausências e mudanças metodológicas.
6. Conferir os cálculos contra resultados oficiais, incluindo valores nos limites das faixas.

Dados agregados podem sustentar desempenho e tendências. Faltas, espera, demanda recusada, continuidade com o mesmo profissional e jornada individual exigem fontes adicionais, como agenda e prontuário municipal. Não prometer essas métricas a partir apenas do C1 publicado.

## Proposta inicial de produto

Painel municipal de prioridades, detalhamento por equipe, histórico de composição dos atendimentos e acompanhamento de ações. O desenho final depende das fontes disponíveis e do público principal.

Não houve autorização para implementar telas, reformular os portais, implantar integrações ou criar branch nesta etapa. O pedido atual é preservar o contexto.

## Perguntas ainda abertas

Foram enviadas na conversa, sem resposta até este registro. Não impedem preservar o estudo:

1. Dados da primeira versão: somente públicos; públicos e relatórios municipais; ou integração com prontuário e agenda?
2. Público principal: coordenação municipal da APS; secretário e equipe de gestão; ou gestores de UBS e equipes assistenciais?

Outras definições futuras: município piloto, período inicial de análise, escopo da primeira entrega e nome/estratégia da branch.

## Fontes oficiais consultadas

Consultadas em 19/10/2026. Revalidar vigência antes de implementação de regras ou simulações financeiras.

- [Nota metodológica C1 — Mais acesso, PDF vigente consultado](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c1-mais-acesso/@@download/file) — fórmula, elegibilidade, CBO, periodicidade, faixas e limitações.
- [Manual Siaps — Componentes do Cofinanciamento Federal da APS](https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/modulo-componentes/) — monitoramento, avaliação quadrimestral, variáveis e universos de equipes.
- [Guia de preenchimento — eSF e eAP](https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento%20Atual/equipeaps/) — orientações de registro no e-SUS APS.
- [Siaps — versão 1.8](https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/release-1-8/) — acesso público e inclusão de numerador/denominador nos arquivos do componente Qualidade.
- [Manual Siaps — Transferência de Arquivos](https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/transferencia-arquivos/) — documentação do módulo de arquivos.
- [Relatórios Públicos da APS](https://relatorioaps.saude.gov.br/) — ponto de acesso, sem exportação validada nesta etapa.
- [Ministério da Saúde — componentes do cofinanciamento segundo a Portaria nº 3.493/2024](https://www.gov.br/saude/pt-br/composicao/saps/esf/faq-novo-modelo-de-cofinanciamento-federal-da-aps/componentes-cofinanciamento-federal-da-aps/quais-os-componentes-do-cofinanciamento-segundo-a-portaria) — enquadramento geral do componente Qualidade, sem substituir a legislação atualizada.

## Como retomar

Ler este documento e considerar as respostas mais recentes do usuário. Próximo passo recomendado: validar uma exportação real e transformar as métricas viáveis em especificação de um primeiro painel C1. Não presumir que fontes, público ou regras financeiras já foram definidos.

## Atualização: início do desenvolvimento

Após o registro inicial, o usuário informou que criou a nova branch e autorizou iniciar a adaptação com foco exclusivo na APS. As observações anteriores sobre ausência de autorização descrevem o momento do estudo, anterior a essa instrução.

- Removidos os portais Hospitalar, Administrativo e Recepção, seus logins, rotas e componentes exclusivos de navegação.
- A entrada agora direciona ao login da APS, com identidade SOBERA, sem seleção ou troca de perfis.
- Preservados os endereços e as telas existentes da APS e os componentes compartilhados que ela utiliza.
- A busca compartilhada de pacientes agora utiliza a APS como destino padrão.
- Atualizados título da aplicação, cabeçalho, rodapé e README.
- Dados municipais e clínicos simulados continuam nas telas da APS. A autenticação segue demonstrativa; o módulo C1 ainda não foi implementado.
- As perguntas sobre fontes de dados e público principal continuam abertas.

### URLs sem hash

O usuário solicitou remover o `#` das URLs e usar `/portal-atencao-basica` como base das telas. O roteamento passou a usar `BrowserRouter`. Um exemplo de rota atual é `/portal-atencao-basica/indicadores`.

O login permanece em `/login/aps` e a entrada `/` continua direcionando para ele. O deploy atual em GitHub Pages utiliza base `/sobera/` e página 404 para restaurar rotas diretas; outras hospedagens precisam de fallback apropriado para a aplicação.

### Atualização: interface municipal de indicadores

O usuário aprovou reorganizar a interface para o foco nos indicadores. Foram implementadas Visão geral, Indicadores (C1) e Equipes e unidades. As rotas assistenciais antigas deixaram de carregar as respectivas telas; seus arquivos exclusivos foram removidos posteriormente.

- Removidos da interface ativa: notificações clínicas, identidade fixa de médica/UBS, pacientes, atendimentos, visitas, agentes e reunião assistencial.
- Contexto atual: município demonstrativo e coordenação municipal da APS, como hipótese inicial de interface, sem encerrar a pergunta sobre público principal.
- Base fictícia compartilhada: seis equipes, três UBS e seis competências. Inclui ausência de registro e total zerado para demonstrar disponibilidade dos dados.
- Filtros de competência e unidade persistem entre as três telas durante a navegação; reiniciam ao recarregar. A equipe selecionada no C1 fica na query string.
- Visão geral: agregado ponderado, distribuição de equipes, persistência, prioridades, mudanças de faixa e concentração dos atendimentos fora da faixa ótima.
- C1: detalhamento por equipe, séries de percentual e volumes, histórico, faixas/metodologia e hipóteses de investigação. Variações mensais são calculadas apenas entre equipes com resultado nos dois meses.
- Equipes e unidades: agregados por UBS, busca e filtros por faixa/tipo, com links para análise individual.
- Sem dados é separado de Regular. Ausência de produção e total zerado são situações distintas. Agregados SOBERA não recebem classificação oficial municipal.
- Cálculos em `lib/aps-indicadores.ts`, contexto em `lib/aps-indicadores-context.tsx`, telas em `components/aps/`.
- Testes de cálculo em `scripts/test-indicadores.cjs`; verificação de renderização de rotas em `scripts/test-interface.mjs`.
- Plano de ação, integração com dados oficiais, autenticação real, avaliação quadrimestral e simulações financeiras continuam fora desta entrega.

### Atualização: importação do C1

O usuário autorizou implementar a próxima etapa recomendada: importação e validação de uma base mensal do C1. Entregue a tela Dados e importação (`/portal-atencao-basica/dados`), com CSV mapeável, revisão, erros por linha, prévia e substituição integral da base. A base validada é persistida no navegador e usada por todos os painéis. Há opção de restaurar a base de exemplo mediante confirmação na interface.

- Verificadas novamente as páginas oficiais do manual de transferência e das notas da versão 1.8; confirmam exportação de numerador/denominador e distinção entre monitoramento e avaliação quadrimestral.
- **Ainda não foi obtida uma exportação real.** A compatibilidade de layout oficial não está homologada. O modelo incluído é sintético; o fluxo aceita o contrato documentado e mapeamento configurável, sem assumir cabeçalhos oficiais específicos.
- Captura de proveniência: nome do arquivo, SHA-256, data/hora da importação, origem e data de extração declaradas, mapeamento e referência metodológica. Nenhuma verificação automática da autenticidade da origem.
- Obrigatórios: INE, CNES, tipo de equipe, numerador e denominador; competência por coluna ou competência única declarada. Apenas um município por base. Resultados publicados opcionais ficam disponíveis para conferência, enquanto os painéis recalculam pelos volumes.
- Não há importação parcial ou soma de duplicatas. Erros e falha de gravação preservam a base anterior. A importação substitui integralmente a base, sem mesclar arquivos.
- Competências, município e universo de equipes agora são dinâmicos. Meses ausentes interrompem persistência/comparações. Vínculos por competência são preservados, com identificação pelo vínculo mais próximo quando o mês não tem registro.
- Equipes ausentes são avaliadas apenas contra o universo do arquivo, sem confirmação de completude/atividade/elegibilidade no SCNES. Séries por unidade acompanham a coorte de INE do recorte atual.
- O aviso global de ambiente demonstrativo foi removido a pedido do usuário em ajuste anterior. A situação da base pode ser consultada pelo link Dados de exemplo/Dados importados no header; a data de competência continua somente nos filtros, também conforme pedido anterior.
- Documentação detalhada em `docs/importacao-c1.md`; parser em `lib/c1-importacao.ts`; armazenamento validado em `lib/c1-storage.ts`; massa sintética em `public/exemplos/c1-modelo.csv`.
- Testes incluem cálculos, importação, persistência, renderização e fluxo real em navegador headless com perfil isolado.
- Próximo passo de dados: homologar uma exportação mensal agregada real por equipe e comparar resultados com o Siaps. Plano de ação, autenticação real, sincronização em backend, download automático, avaliação quadrimestral e finanças continuam pendentes.

### Atualização: administração, usuários e plano de ação

O usuário solicitou separar a importação em uma seção administrativa e implementar o plano de ação e gestão de usuários.

- Menu separado em **Gestão da APS** (Visão geral, Indicadores, Equipes e unidades, Plano de ação) e **Administração** (Dados e importação, Gestão de usuários).
- Rota canônica de importação: `/portal-atencao-basica/administracao/dados`. A rota anterior `/dados` dentro do portal redireciona. Demais rotas novas: `/portal-atencao-basica/plano-acao` e `/portal-atencao-basica/administracao/usuarios`.
- Usuários: cadastro/edição, e-mail único, perfil, busca, filtros, inativação e reativação. Perfis Administrador, Gestor da APS e Consulta são classificações locais; não há credenciais, convites ou autorização real.
- Plano de ação: criação vinculada à equipe/prioridade do C1, responsável do cadastro municipal, prazo, status, observações e histórico. Prioridades e análise individual exibem criação/acompanhamento conforme ação aberta existente.
- Duplicação bloqueada para a mesma equipe, C1 e direção da prioridade enquanto houver ação aberta. Ações concluídas permitem nova intervenção; reabertura é bloqueada se conflitar com outra aberta.
- Conclusão exige avaliação textual e competência de revisão igual ou posterior à origem. Valores C1 de origem e revisão são preservados; sem dados não se inventa percentual. Histórico registra mudanças e avaliações, sem atribuição fictícia de autoria.
- Usuários inativos não recebem novas atribuições, mas suas responsabilidades anteriores são preservadas.
- Persistência local separada por município em `sobera:gestao:v1:<escopo>`, sem misturar com dados C1. IBGE é preferido quando disponível; na ausência usa nome normalizado. Base de exemplo tem escopo próprio. Não há migração automática de escopo por nome para IBGE e nomes homônimos sem IBGE não são distinguíveis.
- Regras e armazenamento: `lib/gestao-municipal.ts`; contexto: `lib/gestao-municipal-context.tsx`; documentação detalhada em `docs/gestao-municipal.md`.
- Novos testes de regras e navegador para usuários, ações, persistência, menus e isolamento municipal. O utilitário de navegador foi compartilhado com o teste da importação.
- Continuam pendentes: homologação de exportação real, backend, autenticação e autorização efetivas, sincronização compartilhada, demais indicadores, avaliação quadrimestral e simulações financeiras.

### Ajustes solicitados durante a implementação

- Adicionado menu de usuário no topbar com Meu perfil e Sair. Nome/e-mail editáveis localmente, independentes dos cadastros administrativos e sem autenticação real. Nome inicial: Marina Oliveira.
- Base de exemplo identificada como Armação dos Búzios, RJ. Unidades: UBS Deodorina Leite de Azevedo (Geribá), UBS Dr. Paulo Acherman (Ferradura) e UBS Lilson M. de Souza (Cem Braças), verificadas em publicação municipal de setembro de 2026. Identificadores, equipes e produção continuam sintéticos.
- Removido o link Dados de exemplo/Dados importados do header. Detalhes da base continuam em Administração, Dados e importação.
- Removidos travessões e pontos médios dos textos ativos, conforme solicitação de estilo.
- Adicionados gráfico comparativo do C1 por equipe e carrossel de insights com evidência, interpretação e geração de rascunho de plano de ação. O motor atual é determinístico e identificado como análise por regras, sem alegar uso de IA externa. Provedor/backend de IA ainda não foram definidos; a pergunta foi enviada e não respondida.
- A solicitação posterior sobre gráficos foi tratada como aprofundamento visual do C1, sem implementar outros indicadores ainda não especificados.
- Usuário pediu para ignorar o comentário "Está cheio de mosto"; não inferir dele uma instrução para remover dados simulados.
- Testes de navegador passaram para cadastro/perfil, ações, conclusão/revisão, importação, filtros, recarregamento e separação municipal. Corrigido o contexto municipal para não remontar a tela de importação ao trocar de base.
# Análises gerenciais do C1, outubro de 2026

Indicadores agora possui quatro abas, com filtros compartilhados de competência, unidade e equipe. A URL preserva a aba (`aba=variacoes`, `estabilidade` ou `prioridades`) e a equipe. Análise do C1 continua como entrada padrão.

- Variações: diferenças absolutas e relativas de programados, espontâneos e total, gráfico comparativo e detalhamento por equipe. A comparação usa exclusivamente equipes com resultado válido nos dois meses consecutivos. Base anterior zero não gera percentual relativo.
- Estabilidade: mapa de calor de 6 ou 12 meses, proporção de meses ótimos entre meses válidos e cobertura do histórico. Recuperação exige desvio seguido de três meses ótimos consecutivos. Reincidência exige desvio, retorno à faixa e novo desvio. Lacunas interrompem as sequências. Menos de quatro meses válidos recebe identificação de histórico curto.
- Prioridades: matriz de persistência na mesma direção versus distância da faixa ótima, com bolha proporcional ao volume. Ausência de resultado fica fora do gráfico e permanece na lista de prioridades. O limite de 50% continua fora da faixa ótima mesmo com distância zero.
- Resposta da gestão: cobertura por ações abertas na mesma direção, prioridades sem ação, desvios de pelo menos três meses sem responsável ativo e ações vinculadas atrasadas. Usa o estado atual dos planos, sem reconstrução histórica.
- Acompanhamento: três meses antes da criação versus três meses depois da conclusão (ou da criação enquanto aberto), excluindo os meses de referência. Exibe cobertura, médias de produção por mês válido e C1 ponderado. Retorno sustentado exige ambas as janelas completas, C1 anterior fora da faixa ótima e três meses posteriores ótimos. É observacional e não comprova causalidade.

Implementação em `lib/c1-analises.ts` e `components/aps/c1-analises.tsx`. Verificações: `npm run test:analises` e `npm run test:analises:browser`.
