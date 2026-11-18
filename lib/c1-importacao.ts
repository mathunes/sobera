import { calcularC1, contagem, NOME_INDICADOR_C1, type BaseC1, type EquipeAps, type ProducaoC1 } from "./aps-indicadores"

export const LIMITE_ARQUIVO = 10 * 1024 * 1024
export const LIMITE_LINHAS = 20000
export const VERSAO_C1 = `${NOME_INDICADOR_C1}, SEI 0054814890, junho/2026`
export const CAMPOS_C1 = [
  { id: "competencia", label: "Competência mensal", obrigatorio: true, aliases: ["competencia", "competencia atendimento", "mes ano", "ano mes"] },
  { id: "ine", label: "INE da equipe", obrigatorio: true, aliases: ["ine", "codigo ine", "nu ine", "co ine"] },
  { id: "cnes", label: "CNES da unidade", obrigatorio: true, aliases: ["cnes", "codigo cnes", "co cnes", "nu cnes"] },
  { id: "tipo", label: "Tipo de equipe (eSF / eAP)", obrigatorio: true, aliases: ["tipo equipe", "tipo de equipe", "tipo", "co tipo equipe"] },
  { id: "programados", label: "Atendimentos programados (numerador)", obrigatorio: true, aliases: ["numerador", "nm", "programados", "atendimentos programados", "numerador c1"] },
  { id: "total", label: "Total de atendimentos (denominador)", obrigatorio: true, aliases: ["denominador", "dn", "total", "total atendimentos", "denominador c1"] },
  { id: "equipe", label: "Nome da equipe", aliases: ["equipe", "nome equipe", "nome da equipe", "no equipe", "nm equipe"] },
  { id: "unidade", label: "Nome da unidade", aliases: ["unidade", "ubs", "nome unidade", "nome da unidade", "estabelecimento", "no estabelecimento"] },
  { id: "municipio", label: "Município", aliases: ["municipio", "nome municipio", "no municipio", "nm municipio"] },
  { id: "codigoMunicipio", label: "Código IBGE do município", aliases: ["codigo municipio", "co municipio", "codigo ibge", "ibge"] },
  { id: "indicador", label: "Indicador (para arquivos com mais de um)", aliases: ["indicador", "nome indicador", "codigo indicador"] },
  { id: "espontaneos", label: "Espontâneos (conferência opcional)", aliases: ["espontaneos", "atendimentos espontaneos"] },
  { id: "resultado", label: `${NOME_INDICADOR_C1} publicado em % (conferência opcional)`, aliases: ["resultado", "percentual", "c1", "pontuacao", "resultado c1"] },
] as const
export type CampoC1 = typeof CAMPOS_C1[number]["id"]
export type MapeamentoC1 = Partial<Record<CampoC1, string>>
export interface LinhaCsv { numero: number; valores: string[] }
export interface ArquivoCsv { cabecalhos: string[]; linhas: LinhaCsv[]; separador: string }
export interface ProblemaC1 { linha?: number; mensagem: string }
export interface RevisaoC1 { base: BaseC1 | null; erros: ProblemaC1[]; avisos: ProblemaC1[]; ignoradas: number }
export interface MetadadosC1 { municipio: string; fonte: string; arquivo: string; sha256: string; dataExtracao?: string; competenciaFixa?: string }

export function normalizarTexto(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

export function lerCsv(conteudo: string): ArquivoCsv {
  if (conteudo.length > LIMITE_ARQUIVO) throw new Error("O arquivo excede o limite de 10 MB.")
  let texto = conteudo.replace(/^\uFEFF/, "")
  const diretiva = /^sep=([;,\t])\r?\n/i.exec(texto)
  if (diretiva) texto = texto.slice(diretiva[0].length)
  const primeiraLinha = texto.split(/\r?\n/, 1)[0]
  const contar = (separador: string) => { let aspas = false; let total = 0; for (const c of primeiraLinha) { if (c === '"') aspas = !aspas; else if (!aspas && c === separador) total++ } return total }
  const separador = diretiva?.[1] ?? [";", ",", "\t"].sort((a, b) => contar(b) - contar(a))[0]
  const linhas: LinhaCsv[] = []
  let valores: string[] = [], celula = "", entreAspas = false, fechouAspas = false, numero = diretiva ? 2 : 1, inicio = numero
  const fimCelula = () => { valores.push(celula.trim()); celula = ""; fechouAspas = false }
  const fimLinha = () => {
    fimCelula()
    if (valores.some(v => v !== "")) linhas.push({ numero: inicio, valores })
    valores = []
    if (linhas.length > LIMITE_LINHAS + 1) throw new Error("Limite de 20.000 linhas excedido. Separe o arquivo por município.")
  }
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreAspas) {
      if (c === '"') { if (texto[i + 1] === '"') { celula += '"'; i++ } else { entreAspas = false; fechouAspas = true } }
      else { celula += c; if (c === "\n") numero++ }
    } else if (c === separador) fimCelula()
    else if (c === "\n" || c === "\r") { fimLinha(); if (c === "\r" && texto[i + 1] === "\n") i++; numero++; inicio = numero }
    else if (c === '"') { if (celula.trim() || fechouAspas) throw new Error(`Aspas inválidas na linha ${numero}.`); entreAspas = true; celula = "" }
    else if (fechouAspas && c.trim()) throw new Error(`Texto após fechamento de aspas na linha ${numero}.`)
    else if (!fechouAspas) celula += c
  }
  if (entreAspas) throw new Error(`Campo com aspas não fechadas na linha ${inicio}.`)
  if (valores.length || celula || fechouAspas) fimLinha()
  if (linhas.length < 2) throw new Error("Informe um CSV com cabeçalho e pelo menos uma linha de dados.")
  const cabecalhos = linhas.shift()!.valores
  if (cabecalhos.length < 2 || cabecalhos.some(c => !c)) throw new Error("Cabeçalhos vazios ou separador não reconhecido.")
  if (new Set(cabecalhos.map(normalizarTexto)).size !== cabecalhos.length) throw new Error("Há nomes de colunas duplicados. Renomeie-os antes de importar.")
  const irregular = linhas.find(l => l.valores.length !== cabecalhos.length)
  if (irregular) throw new Error(`Linha ${irregular.numero}: quantidade de campos diferente do cabeçalho.`)
  return { cabecalhos, linhas, separador }
}

export function sugerirMapeamento(cabecalhos: string[]): MapeamentoC1 {
  const mapa: MapeamentoC1 = {}
  for (const campo of CAMPOS_C1) {
    const candidatos = cabecalhos.filter(c => (campo.aliases as readonly string[]).includes(normalizarTexto(c)))
    if (candidatos.length === 1) mapa[campo.id] = candidatos[0]
  }
  return mapa
}

export function normalizarCompetencia(value: string) {
  const s = value.trim()
  let ano: string, mes: string
  if (/^\d{4}[-/]\d{2}$/.test(s)) [ano, mes] = s.split(/[-/]/)
  else if (/^\d{2}\/\d{4}$/.test(s)) [mes, ano] = s.split("/")
  else if (/^\d{6}$/.test(s)) { ano = s.slice(0, 4); mes = s.slice(4) }
  else return null
  return +ano >= 2000 && +ano <= 2100 && +mes >= 1 && +mes <= 12 ? `${ano}-${mes}` : null
}

export function inteiroCsv(value: string): number | null {
  const s = value.trim()
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(s)) return null
  const n = Number(s.replace(/\./g, ""))
  return Number.isSafeInteger(n) && n >= 0 ? n : null
}

export function listarCompetencias(inicio: string, fim: string) {
  const competencias: string[] = []
  const data = new Date(`${inicio}-01T12:00:00Z`)
  while (data.toISOString().slice(0, 7) <= fim) {
    competencias.push(data.toISOString().slice(0, 7))
    data.setUTCMonth(data.getUTCMonth() + 1)
  }
  return competencias
}

export function validarImportacao(csv: ArquivoCsv, mapa: MapeamentoC1, meta: MetadadosC1): RevisaoC1 {
  const erros: ProblemaC1[] = [], avisos: ProblemaC1[] = []
  const erro = (mensagem: string, linha?: number) => erros.push({ linha, mensagem })
  for (const campo of CAMPOS_C1) {
    if ("obrigatorio" in campo && !mapa[campo.id] && !(campo.id === "competencia" && meta.competenciaFixa)) erro(`Selecione a coluna: ${campo.label}.`)
    if (mapa[campo.id] && !csv.cabecalhos.includes(mapa[campo.id]!)) erro(`Coluna inexistente: ${mapa[campo.id]}.`)
  }
  const usados = Object.values(mapa).filter(Boolean)
  if (new Set(usados).size !== usados.length) erro("Uma coluna foi atribuída a mais de um campo.")
  if (!meta.municipio.trim()) erro("Informe o município da base.")
  if (!meta.fonte.trim()) erro("Informe a origem do arquivo.")
  if (meta.competenciaFixa && !normalizarCompetencia(meta.competenciaFixa)) erro("Competência única inválida.")
  if (meta.dataExtracao) {
    const data = new Date(`${meta.dataExtracao}T12:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.dataExtracao) || !Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== meta.dataExtracao) erro("Data de extração inválida.")
  }
  if (erros.length) return { base: null, erros, avisos, ignoradas: 0 }

  const indices = Object.fromEntries(Object.entries(mapa).map(([campo, coluna]) => [campo, csv.cabecalhos.indexOf(coluna!)]))
  const equipes = new Map<string, EquipeAps>()
  const vinculos: NonNullable<BaseC1["vinculos"]> = []
  const producao: ProducaoC1[] = []
  const chaves = new Set<string>(), municipios = new Set<string>(), codigos = new Set<string>()
  const nomesUnidades = new Map<string, string>()
  let ignoradas = 0, semNome = false
  for (const linha of csv.linhas) {
    const get = (campo: CampoC1) => indices[campo] === undefined ? "" : linha.valores[indices[campo]].trim()
    if (mapa.indicador) {
      const indicador = normalizarTexto(get("indicador"))
      if (!/^(c1|c 1)( |$)/.test(indicador) && !/^mais acesso( |$)/.test(indicador)) { ignoradas++; continue }
    }
    const inicioErros = erros.length
    const competencia = normalizarCompetencia(mapa.competencia ? get("competencia") : meta.competenciaFixa ?? "")
    const ine = get("ine"), cnes = get("cnes")
    const tipoTexto = normalizarTexto(get("tipo"))
    const tipo = /^(esf|70|070|70 equipe de saude da familia|equipe de saude da familia)$/.test(tipoTexto) ? "eSF" : /^(eap|76|076|76 equipe de atencao primaria|equipe de atencao primaria)$/.test(tipoTexto) ? "eAP" : null
    const programados = inteiroCsv(get("programados")), total = inteiroCsv(get("total"))
    if (!competencia) erro("Competência inválida. Use AAAA-MM, MM/AAAA ou AAAAMM. Não importe resultados quadrimestrais.", linha.numero)
    if (!/^\d{10}$/.test(ine)) erro("INE deve conter 10 dígitos, preservando zeros à esquerda.", linha.numero)
    if (!/^\d{7}$/.test(cnes)) erro("CNES deve conter 7 dígitos, preservando zeros à esquerda.", linha.numero)
    if (!tipo) erro("Tipo de equipe deve ser eSF/70 ou eAP/76.", linha.numero)
    if (programados === null || total === null) erro("Numerador e denominador devem ser inteiros não negativos. Campos vazios não equivalem a zero.", linha.numero)
    else if (programados > total) erro("Numerador maior que denominador.", linha.numero)
    if (mapa.municipio) {
      if (!get("municipio")) erro("Município vazio.", linha.numero)
      else municipios.add(normalizarTexto(get("municipio")))
    }
    if (mapa.codigoMunicipio) {
      if (!/^\d{6,7}$/.test(get("codigoMunicipio"))) erro("Código IBGE inválido (6 ou 7 dígitos).", linha.numero)
      else codigos.add(get("codigoMunicipio"))
    }
    if (programados !== null && total !== null && mapa.espontaneos) {
      const espontaneos = inteiroCsv(get("espontaneos"))
      if (espontaneos === null || programados + espontaneos !== total) erro("Programados + espontâneos deve ser igual ao denominador.", linha.numero)
    }
    if (erros.length !== inicioErros) continue
    const chave = `${ine}|${competencia}`
    if (chaves.has(chave)) { erro("INE e competência duplicados. Use uma única linha por equipe/mês, sem somar duplicatas.", linha.numero); continue }
    chaves.add(chave)
    const equipe: EquipeAps = { id: ine, ine, cnes, nome: get("equipe") || `Equipe ${ine}`, unidade: get("unidade") || `Unidade ${cnes}`, unidadeId: cnes, tipo: tipo! }
    const unidadeNoMes = nomesUnidades.get(`${cnes}|${competencia}`)
    if (unidadeNoMes && unidadeNoMes !== equipe.unidade) erro("Nomes conflitantes para o mesmo CNES na competência.", linha.numero)
    nomesUnidades.set(`${cnes}|${competencia}`, equipe.unidade)
    if (!get("equipe") || !get("unidade")) semNome = true
    const registro: ProducaoC1 = { equipeId: ine, competencia: competencia!, programados: programados!, espontaneos: total! - programados! }
    if (mapa.resultado && get("resultado")) {
      const texto = get("resultado").replace(/%$/, "").trim().replace(",", ".")
      const publicado = /^\d+(\.\d+)?$/.test(texto) ? Number(texto) : NaN
      if (!Number.isFinite(publicado) || publicado > 100) erro("Resultado publicado inválido. Informe percentual entre 0 e 100.", linha.numero)
      else {
        registro.resultadoPublicado = publicado
        const calculado = calcularC1(registro.programados, registro.espontaneos)
        if (calculado === null || Math.abs(publicado - calculado) > 0.11) avisos.push({ linha: linha.numero, mensagem: `O valor publicado de ${NOME_INDICADOR_C1} diverge do recálculo. Confira os volumes e as colunas mapeadas.` })
      }
    }
    equipes.set(ine, equipe)
    vinculos.push({ ...equipe, competencia: competencia! })
    producao.push(registro)
  }
  if (municipios.size > 1 || codigos.size > 1) erro("O arquivo contém mais de um município. Exporte ou filtre um município por base.")
  if (municipios.size === 1 && !municipios.has(normalizarTexto(meta.municipio))) erro("O município informado não corresponde ao município do arquivo.")
  if (!producao.length) erro(`Nenhum registro mensal válido de ${NOME_INDICADOR_C1} foi encontrado.`)
  if (ignoradas) avisos.push({ mensagem: `${contagem(ignoradas, "linha ignorada por pertencer a outro indicador", "linhas ignoradas por pertencerem a outros indicadores")}.` })
  if (semNome) avisos.push({ mensagem: "Nomes ausentes: equipes/unidades serão identificadas por INE/CNES." })
  const zerados = producao.filter(r => r.programados + r.espontaneos === 0).length
  if (zerados) avisos.push({ mensagem: `${contagem(zerados, "registro sem resultado", "registros sem resultado")} porque o total de atendimentos é zero.` })
  if (!mapa.municipio && !mapa.codigoMunicipio) avisos.push({ mensagem: "Sem coluna de município: a identificação municipal depende da informação fornecida nesta importação." })
  const meses = [...new Set(producao.map(r => r.competencia))].sort()
  if (erros.length) return { base: null, erros, avisos, ignoradas }
  const competencias = listarCompetencias(meses[0], meses.at(-1)!)
  if (competencias.length !== meses.length) avisos.push({ mensagem: "Há meses sem registros no intervalo. Serão exibidos sem dados e interromperão a persistência." })
  return { erros, avisos, ignoradas, base: {
    versao: 1, municipio: meta.municipio.trim(), codigoMunicipio: [...codigos][0],
    equipes: [...equipes.values()], vinculos, producao, competencias,
    origem: { arquivo: meta.arquivo, importadoEm: new Date().toISOString(), fonte: meta.fonte.trim(), dataExtracao: meta.dataExtracao || undefined, sha256: meta.sha256, mapeamento: { ...Object.fromEntries(Object.entries(mapa).filter(([, value]) => value)), ...(!mapa.competencia && meta.competenciaFixa ? { competenciaFixa: meta.competenciaFixa } : {}) }, versaoMetodologia: VERSAO_C1 },
  } }
}
