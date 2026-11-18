export type FaixaC1 = "Ótimo" | "Bom" | "Suficiente" | "Regular" | "Sem dados"
export type DirecaoC1 = "abaixo" | "acima" | "equilibrio" | "sem-dados"

export const MUNICIPIO_DEMO = "Armação dos Búzios, RJ"
export const NOME_INDICADOR_C1 = "Mais acesso (C1)"
export const COMPETENCIAS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
export const FONTE_C1 = "https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c1-mais-acesso/@@download/file"
export const FAIXAS_C1: FaixaC1[] = ["Ótimo", "Bom", "Suficiente", "Regular", "Sem dados"]

export interface EquipeAps {
  id: string
  nome: string
  ine: string
  unidadeId: string
  unidade: string
  cnes: string
  tipo: "eSF" | "eAP"
}

export interface ProducaoC1 {
  equipeId: string
  competencia: string
  programados: number
  espontaneos: number
  resultadoPublicado?: number
}

export interface OrigemC1 {
  arquivo: string
  importadoEm: string
  fonte: string
  dataExtracao?: string
  sha256: string
  mapeamento: Record<string, string>
  versaoMetodologia: string
}

export interface BaseC1 {
  versao: 1
  municipio: string
  codigoMunicipio?: string
  equipes: EquipeAps[]
  vinculos?: (EquipeAps & { competencia: string })[]
  producao: ProducaoC1[]
  competencias: string[]
  origem?: OrigemC1
}

// Identificadores e volumes inteiramente fictícios; não representam produção municipal.
export const EQUIPES: EquipeAps[] = [
  { id: "centro-1", nome: "Equipe Geribá I", ine: "DEMO-001", unidadeId: "centro", unidade: "UBS Deodorina Leite de Azevedo (Geribá)", cnes: "DEMO-A", tipo: "eSF" },
  { id: "centro-2", nome: "Equipe Geribá II", ine: "DEMO-002", unidadeId: "centro", unidade: "UBS Deodorina Leite de Azevedo (Geribá)", cnes: "DEMO-A", tipo: "eSF" },
  { id: "norte-1", nome: "Equipe Ferradura I", ine: "DEMO-003", unidadeId: "norte", unidade: "UBS Dr. Paulo Acherman (Ferradura)", cnes: "DEMO-B", tipo: "eSF" },
  { id: "norte-2", nome: "Equipe Ferradura II", ine: "DEMO-004", unidadeId: "norte", unidade: "UBS Dr. Paulo Acherman (Ferradura)", cnes: "DEMO-B", tipo: "eAP" },
  { id: "sul-1", nome: "Equipe Cem Braças I", ine: "DEMO-005", unidadeId: "sul", unidade: "UBS Lilson M. de Souza (Cem Braças)", cnes: "DEMO-C", tipo: "eSF" },
  { id: "sul-2", nome: "Equipe Cem Braças II", ine: "DEMO-006", unidadeId: "sul", unidade: "UBS Lilson M. de Souza (Cem Braças)", cnes: "DEMO-C", tipo: "eAP" },
]

const VOLUMES: Record<string, [number, number][]> = {
  "centro-1": [[480, 400], [510, 390], [550, 400], [570, 390], [600, 400], [620, 380]],
  "centro-2": [[280, 500], [260, 520], [240, 540], [220, 560], [200, 580], [180, 600]],
  "norte-1": [[450, 350], [480, 320], [520, 280], [560, 240], [600, 200], [640, 160]],
  "norte-2": [[160, 340], [175, 325], [190, 310], [210, 290], [230, 270], [240, 260]],
  "sul-1": [[50, 550], [55, 545], [60, 540], [65, 535], [60, 540], [50, 550]],
  "sul-2": [[180, 120], [190, 130], [200, 140], [210, 150], [0, 0]],
}

export const PRODUCAO_C1: ProducaoC1[] = EQUIPES.flatMap(equipe =>
  VOLUMES[equipe.id].map(([programados, espontaneos], index) => ({
    equipeId: equipe.id, competencia: COMPETENCIAS[index], programados, espontaneos,
  })),
)

export const BASE_DEMO: BaseC1 = { versao: 1, municipio: MUNICIPIO_DEMO, equipes: EQUIPES, producao: PRODUCAO_C1, competencias: COMPETENCIAS }

export function equipesNaCompetencia(base: BaseC1, competencia: string) {
  const porEquipe = new Map<string, NonNullable<BaseC1["vinculos"]>>()
  for (const vinculo of base.vinculos ?? []) {
    const lista = porEquipe.get(vinculo.id) ?? []
    lista.push(vinculo)
    porEquipe.set(vinculo.id, lista)
  }
  return base.equipes.map(equipe => {
    const vinculos = porEquipe.get(equipe.id)?.sort((a, b) => a.competencia.localeCompare(b.competencia))
    return vinculos?.filter(v => v.competencia <= competencia).at(-1) ?? vinculos?.[0] ?? equipe
  })
}

const indicesProducao = new WeakMap<BaseC1, Map<string, ProducaoC1>>()
function indiceProducao(base: BaseC1) {
  let indice = indicesProducao.get(base)
  if (!indice) {
    indice = new Map(base.producao.map(r => [`${r.equipeId}|${r.competencia}`, r]))
    indicesProducao.set(base, indice)
  }
  return indice
}

export function calcularC1(programados: number, espontaneos: number): number | null {
  if (![programados, espontaneos].every(n => Number.isFinite(n) && n >= 0)) return null
  const total = programados + espontaneos
  return total > 0 ? programados / total * 100 : null
}

export function classificarC1(valor: number | null): FaixaC1 {
  if (valor === null || !Number.isFinite(valor) || valor < 0 || valor > 100) return "Sem dados"
  if (valor > 50 && valor <= 70) return "Ótimo"
  if (valor > 30 && valor <= 50) return "Bom"
  if (valor > 10 && valor <= 30) return "Suficiente"
  return "Regular"
}

export function direcaoC1(valor: number | null): DirecaoC1 {
  if (classificarC1(valor) === "Sem dados") return "sem-dados"
  if (valor! <= 50) return "abaixo"
  return valor! > 70 ? "acima" : "equilibrio"
}

export function distanciaC1(valor: number | null): number | null {
  const direcao = direcaoC1(valor)
  if (direcao === "sem-dados") return null
  return direcao === "abaixo" ? 50 - valor! : direcao === "acima" ? valor! - 70 : 0
}

export function resumoC1(equipes: EquipeAps[], competencia: string, base: BaseC1 = BASE_DEMO) {
  const ids = new Set(equipes.map(e => e.id))
  const registros = base.producao.filter(r => r.competencia === competencia && ids.has(r.equipeId))
  const programados = registros.reduce((s, r) => s + r.programados, 0)
  const espontaneos = registros.reduce((s, r) => s + r.espontaneos, 0)
  const comDados = registros.filter(r => calcularC1(r.programados, r.espontaneos) !== null).length
  return { programados, espontaneos, total: programados + espontaneos, valor: calcularC1(programados, espontaneos), comRegistro: registros.length, comDados, semDados: equipes.length - comDados }
}

export function resultadoEquipe(equipeId: string, competencia: string, base: BaseC1 = BASE_DEMO) {
  const registro = indiceProducao(base).get(`${equipeId}|${competencia}`)
  const valor = registro ? calcularC1(registro.programados, registro.espontaneos) : null
  return { registro, valor, faixa: classificarC1(valor), direcao: direcaoC1(valor) }
}

// Conta meses consecutivos na mesma direção; ausências e equilíbrio interrompem a sequência.
export function persistenciaC1(equipeId: string, competencia: string, base: BaseC1 = BASE_DEMO) {
  const direcao = resultadoEquipe(equipeId, competencia, base).direcao
  if (direcao === "equilibrio" || direcao === "sem-dados") return 0
  let meses = 0
  for (let mes: string | null = competencia; mes !== null; mes = competenciaAnterior(mes, base.competencias)) {
    if (resultadoEquipe(equipeId, mes, base).direcao !== direcao) break
    meses++
  }
  return meses
}

export function competenciaAnterior(competencia: string, competencias: string[] = COMPETENCIAS) {
  const data = new Date(`${competencia}-01T12:00:00Z`)
  data.setUTCMonth(data.getUTCMonth() - 1)
  const anterior = data.toISOString().slice(0, 7)
  return competencias.includes(anterior) ? anterior : null
}

export function formatarCompetencia(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${valor}-01T12:00:00Z`))
}

export const numero = (n: number) => new Intl.NumberFormat("pt-BR").format(n)
export const contagem = (n: number, singular: string, plural: string) => `${numero(n)} ${n === 1 ? singular : plural}`
export const percentual = (n: number | null) => n === null ? "Sem dados" : `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function orientacaoC1(valor: number | null) {
  switch (direcaoC1(valor)) {
    case "abaixo": return "Verificar oferta de cuidado programado, continuidade dos acompanhamentos e classificação dos registros."
    case "acima": return "Verificar acolhimento no mesmo dia, barreiras à demanda espontânea e classificação dos registros."
    case "equilibrio": return "Acompanhar a estabilidade da composição e os volumes de atendimento."
    default: return "Verificar disponibilidade e envio da produção antes de avaliar o desempenho."
  }
}
