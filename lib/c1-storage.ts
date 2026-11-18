import { z } from "zod"
import { BASE_DEMO, type BaseC1 } from "./aps-indicadores"
import { listarCompetencias, normalizarCompetencia } from "./c1-importacao"

export const CHAVE_BASE_C1 = "sobera:c1:base:v1"
const competencia = z.string().refine(v => normalizarCompetencia(v) === v)
const contagem = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const equipe = z.object({
  id: z.string().regex(/^\d{10}$/), ine: z.string().regex(/^\d{10}$/), nome: z.string().trim().min(1),
  unidadeId: z.string().regex(/^\d{7}$/), cnes: z.string().regex(/^\d{7}$/), unidade: z.string().trim().min(1), tipo: z.enum(["eSF", "eAP"]),
})
const schema = z.object({
  versao: z.literal(1), municipio: z.string().trim().min(1), codigoMunicipio: z.string().regex(/^\d{6,7}$/).optional(),
  equipes: z.array(equipe).min(1).max(20000),
  vinculos: z.array(equipe.extend({ competencia })).min(1).max(20000),
  producao: z.array(z.object({ equipeId: z.string(), competencia, programados: contagem, espontaneos: contagem, resultadoPublicado: z.number().min(0).max(100).optional() })).min(1).max(20000),
  competencias: z.array(competencia).min(1).max(1212),
  origem: z.object({ arquivo: z.string().min(1), importadoEm: z.string().datetime(), fonte: z.string().trim().min(1), dataExtracao: z.string().optional(), sha256: z.string().regex(/^[a-f0-9]{64}$/), mapeamento: z.record(z.string()), versaoMetodologia: z.string().min(1) }),
})

export function validarBasePersistida(value: unknown): BaseC1 {
  const base = schema.parse(value)
  const ids = new Set(base.equipes.map(e => e.id))
  const chaves = new Set(base.producao.map(r => `${r.equipeId}|${r.competencia}`))
  const vinculos = new Set(base.vinculos.map(v => `${v.id}|${v.competencia}`))
  const meses = base.producao.map(r => r.competencia).sort()
  const esperadas = listarCompetencias(meses[0], meses.at(-1)!)
  if (ids.size !== base.equipes.length || chaves.size !== base.producao.length || vinculos.size !== base.vinculos.length || vinculos.size !== chaves.size || base.producao.some(r => !ids.has(r.equipeId) || !vinculos.has(`${r.equipeId}|${r.competencia}`) || !Number.isSafeInteger(r.programados + r.espontaneos)) || base.vinculos.some(v => !ids.has(v.id) || v.id !== v.ine || v.cnes !== v.unidadeId) || base.equipes.some(e => e.id !== e.ine || e.cnes !== e.unidadeId) || JSON.stringify(esperadas) !== JSON.stringify(base.competencias)) {
    throw new Error("A base salva contém vínculos, competências ou registros inconsistentes.")
  }
  return base
}

export function carregarBaseC1(storage?: Pick<Storage, "getItem">): { base: BaseC1; erro: string | null } {
  if (!storage) return { base: BASE_DEMO, erro: null }
  try {
    const texto = storage.getItem(CHAVE_BASE_C1)
    return { base: texto ? validarBasePersistida(JSON.parse(texto)) : BASE_DEMO, erro: null }
  } catch {
    return { base: BASE_DEMO, erro: "Não foi possível recuperar a base salva. A base de exemplo está ativa; importe novamente ou confira o armazenamento do navegador." }
  }
}

export function salvarBaseC1(base: BaseC1, storage: Pick<Storage, "setItem">) {
  const validada = validarBasePersistida(base)
  storage.setItem(CHAVE_BASE_C1, JSON.stringify(validada))
}
