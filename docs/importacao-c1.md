# Importação mensal do C1

## O que está implementado

A tela **Dados e importação** (`/portal-atencao-basica/administracao/dados`, na seção Administração) lê CSV, permite revisar o mapeamento de colunas, valida os registros e substitui a base ativa dos painéis. A rota anterior `/portal-atencao-basica/dados` é mantida como redirecionamento. Não faz download automático do Siaps, não recebe credenciais do e-Gestor e não processa dados individuais de pacientes.

Os arquivos são processados no navegador. Somente a base normalizada e sua origem são salvas no `localStorage`, na chave `sobera:c1:base:v1`. Não são enviados a um servidor. A base é compartilhada pelas telas Visão geral, Indicadores e Equipes e unidades e recuperada ao recarregar a aplicação no mesmo navegador/origem. Limpar os dados do site remove essa persistência. Não há sincronização entre dispositivos ou usuários.

## Referências e situação da homologação

Consultadas em 19/10/2026:

- [Manual de transferência de arquivos do Siaps](https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/transferencia-arquivos/): diferencia monitoramento mensal e avaliação quadrimestral, dados agregados e individualizados.
- [Notas da versão 1.8](https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/release-1-8/): registra a inclusão de numerador e denominador nas exportações do componente Qualidade.
- [Relatórios públicos da APS](https://relatorioaps.saude.gov.br/): ponto de acesso oficial.

Não foi obtida uma exportação real do C1 nesta sessão. Portanto, não há homologação de um layout oficial específico ou confirmação de API pública do C1. O importador aceita o contrato abaixo com mapeamento configurável. A próxima etapa de homologação é testar um relatório agregado mensal real e conferir o resultado contra a tela oficial por INE/competência. O modelo fornecido é sintético e pertence ao SOBERA.

## Formato aceito

- CSV com cabeçalho; separador `;`, `,` ou tabulação, detectado automaticamente. Aceita diretiva inicial `sep=;`, BOM, campos entre aspas, aspas escapadas e quebras de linha dentro de campos.
- UTF-8 ou Windows-1252; limite de 10 MB e 20.000 linhas de dados.
- Uma linha por **INE e competência**, de um único município. Arquivos nacionais ou estaduais devem ser previamente filtrados por município.
- Se houver vários indicadores, mapear a coluna Indicador para selecionar somente C1 / Mais acesso. As outras linhas são informadas como ignoradas.
- Não aceita planilhas XLSX diretamente. Salvar uma cópia como CSV UTF-8, preservando identificadores como texto.

| Campo | Regra |
| --- | --- |
| Competência | Obrigatória por coluna (`AAAA-MM`, `AAAA/MM`, `MM/AAAA`, `AAAAMM`) ou informada como competência única para o arquivo. Entre 2000-01 e 2100-12. |
| INE | Obrigatório, texto com 10 dígitos; zeros à esquerda são preservados. |
| CNES | Obrigatório, texto com 7 dígitos; zeros à esquerda são preservados. |
| Tipo | Obrigatório: eSF/70 ou eAP/76. |
| Programados / numerador C1 | Obrigatório, inteiro não negativo e menor ou igual ao denominador. |
| Total / denominador C1 | Obrigatório, inteiro não negativo. |
| Nome da equipe/unidade | Opcional; ausência usa identificação por INE/CNES. |
| Município / código IBGE | Colunas opcionais, mas são conferidas se mapeadas. Nome do município deve ser informado na tela; nomes/códigos diferentes no arquivo bloqueiam a aplicação. |
| Espontâneos | Opcional, para conferir que a soma coincide com o denominador. Caso não mapeado, é derivado de total menos programados. |
| C1 publicado | Opcional, percentual entre 0 e 100, com vírgula ou ponto decimal e `%` opcional. É preservado para conferência; diferenças acima de 0,11 p.p. geram observação. |

As contagens aceitam separador de milhares brasileiro (`1.234`). Não aceitam números negativos, frações, notação científica ou vazios como zero. Identificadores com zeros perdidos não são completados automaticamente. A validação de comprimento não confirma existência ou elegibilidade oficial no CNES/INE.

## Revisão e aplicação

1. Selecionar arquivo e conferir município, origem declarada e data de extração opcional.
2. Revisar as sugestões de colunas. Uma coluna não pode representar dois campos diferentes.
3. Corrigir todos os erros impeditivos, revisar observações e conferir a prévia normalizada. É possível baixar um relatório JSON com os erros e observações completos.
4. Confirmar a revisão e selecionar **Substituir base e atualizar painéis**. A substituição é integral: para atualizar ou ampliar o histórico, enviar um novo arquivo com os meses desejados.

Erros não causam importação parcial. Duplicatas por INE/mês são rejeitadas, sem soma automática. Se falhar a gravação local, a base anterior permanece ativa. A restauração da base de exemplo exige confirmação na própria interface.

## Regras analíticas e rastreabilidade

- Numerador e denominador alimentam o recálculo do C1. O percentual publicado é uma variável de conferência, sem substituir os volumes ou transformar o cálculo SOBERA em avaliação federal.
- Total zerado fica sem resultado. Registro ausente não é convertido em produção zero no histórico/tabulação do C1.
- Meses ausentes entre a primeira e última competência entram na série sem registros. A persistência é interrompida e a comparação mensal usa o mês calendário anterior, sem saltar lacunas.
- Vínculos equipe/unidade e nomes são preservados por competência. Sem registro naquela competência, a identificação utiliza o último vínculo conhecido anterior, ou o primeiro disponível quando não há anterior. Isso não confirma equipe ativa ou obrigação de envio.
- O universo inclui os INE encontrados no arquivo, sem validação de completude contra SCNES ou equipes cofinanciadas. As ausências exibidas são relativas a esse universo.
- O histórico de um filtro de unidade acompanha os mesmos INE selecionados no recorte atual; não é uma reconstrução histórica do conjunto de equipes daquela UBS.
- O usuário declara a origem e a data de extração. O SOBERA registra separadamente arquivo, momento da importação, SHA-256, mapeamento e referência metodológica do recálculo.
- A referência metodológica atual é C1 SEI 0054814890, junho/2026. Não há cálculo da avaliação quadrimestral, autenticação real ou estimativa financeira nesta entrega.

## Testes

- `npm run test:indicadores`: limites, ponderação e persistência.
- `npm run test:importacao`: parser, mapeamento, validações, lacunas, mudanças de vínculo e armazenamento.
- `npm run test:interface`: renderização das rotas.
- `npm run test:importacao:browser`: upload, revisão, importação, recarregamento, filtros e preservação da base diante de arquivo inválido. Usa perfil temporário isolado de Edge/Chrome, sem tocar no perfil do usuário. Para outro executável Chromium, definir `SOBERA_TEST_BROWSER`.

O arquivo `public/exemplos/c1-modelo.csv` é uma massa sintética para exercitar o fluxo, não uma evidência de compatibilidade com exportação oficial.
