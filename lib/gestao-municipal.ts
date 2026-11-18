import { z } from "zod"
import type { BaseC1, DirecaoC1 } from "./aps-indicadores"

export const PERFIS_USUARIO = ["Administrador", "Gestor da APS", "Consulta"] as const
export const STATUS_ACAO = ["Pendente", "Em andamento", "Concluída"] as const
const texto = z.string().trim().min(1)
const dataHora = z.string().datetime()
const competencia = z.string().regex(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/)
const valorC1 = z.number().finite().min(0).max(100).nullable()
const perfil = z.enum(PERFIS_USUARIO)
const status = z.enum(STATUS_ACAO)
const usuarioSchema = z.object({ id: texto, nome: texto.max(120), email: z.string().trim().email().max(254), perfil, ativo: z.boolean(), criadoEm: dataHora, atualizadoEm: dataHora })
const revisaoSchema = z.object({ competencia, valor: valorC1, observacao: texto.max(4000), data: dataHora })
const acaoSchema = z.object({
  id: texto, titulo: texto.max(160), descricao: texto.max(4000), equipeId: texto, equipeNome: texto,
  unidadeNome: texto, ine: texto, indicador: z.literal("C1"), direcao: z.enum(["abaixo", "acima", "equilibrio", "sem-dados"]),
  competenciaInicial: competencia, valorInicial: valorC1, fonteInicial: texto,
  responsavelId: texto, responsavelNome: texto, prazo: z.string().refine(dataValida, "Prazo inválido."),
  status, criadoEm: dataHora, atualizadoEm: dataHora, concluidaEm: dataHora.optional(), revisao: revisaoSchema.optional(),
  historico: z.array(z.object({ id: texto, texto: texto.max(10000), data: dataHora })).min(1).max(1000),
})
export const gestaoSchema = z.object({ versao: z.literal(1), usuarios: z.array(usuarioSchema).max(2000), acoes: z.array(acaoSchema).max(10000) }).superRefine((value, ctx) => {
  const ids = new Set(value.usuarios.map(u => u.id))
  const emails = new Set(value.usuarios.map(u => u.email.toLowerCase()))
  if (ids.size !== value.usuarios.length || emails.size !== value.usuarios.length || new Set(value.acoes.map(a => a.id)).size !== value.acoes.length) ctx.addIssue({ code: "custom", message: "Cadastros duplicados." })
  const abertas = new Set<string>()
  for (const acao of value.acoes) {
    if (!ids.has(acao.responsavelId)) ctx.addIssue({ code: "custom", message: "Responsável não encontrado." })
    if (acao.status === "Concluída" && (!acao.revisao || !acao.concluidaEm || acao.revisao.competencia < acao.competenciaInicial)) ctx.addIssue({ code: "custom", message: "Conclusão sem revisão válida." })
    if (acao.status !== "Concluída") {
      const chave = `${acao.equipeId}|${acao.indicador}|${acao.direcao}`
      if (abertas.has(chave)) ctx.addIssue({ code: "custom", message: "Ações abertas duplicadas para a mesma prioridade." })
      abertas.add(chave)
    }
  }
})

export type UsuarioMunicipal = z.infer<typeof usuarioSchema>
export type AcaoMunicipal = z.infer<typeof acaoSchema>
export type GestaoMunicipal = z.infer<typeof gestaoSchema>
export type StatusAcao = typeof STATUS_ACAO[number]
export interface DadosUsuario { id?: string; nome: string; email: string; perfil: UsuarioMunicipal["perfil"]; ativo: boolean }
export interface DadosAcao {
  id?: string; titulo: string; descricao: string; equipeId: string; responsavelId: string; prazo: string; status: StatusAcao
  equipeNome: string; unidadeNome: string; ine: string; competenciaInicial: string; valorInicial: number | null; direcao: DirecaoC1; fonteInicial: string
  observacao?: string; revisao?: { competencia: string; valor: number | null; observacao: string }
}
export const GESTAO_VAZIA: GestaoMunicipal = { versao: 1, usuarios: [], acoes: [] }

export function dataValida(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function dataLocal(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function acaoAtrasada(acao: AcaoMunicipal, hoje = dataLocal()) {
  return acao.status !== "Concluída" && acao.prazo < hoje
}
export function escopoMunicipio(base: BaseC1) {
  if (!base.origem) return "exemplo"
  return base.codigoMunicipio ? `ibge-${base.codigoMunicipio.slice(0, 6)}` : `nome-${base.municipio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ")}`
}
export const chaveGestao = (escopo: string) => `sobera:gestao:v1:${escopo}`
export function acaoAberta(acoes: AcaoMunicipal[], equipeId: string, direcao: DirecaoC1, excetoId?: string) {
  return acoes.find(a => a.id !== excetoId && a.indicador === "C1" && a.equipeId === equipeId && a.direcao === direcao && a.status !== "Concluída")
}

export function atualizarUsuario(gestao: GestaoMunicipal, dados: DadosUsuario, agora = new Date().toISOString()): GestaoMunicipal {
  const existente = dados.id ? gestao.usuarios.find(u => u.id === dados.id) : undefined
  if (dados.id && !existente) throw new Error("Usuário não encontrado. Recarregue a lista.")
  const nome = dados.nome.trim(), email = dados.email.trim().toLowerCase()
  if (!nome || nome.length > 120) throw new Error("Informe um nome de até 120 caracteres.")
  if (!z.string().email().max(254).safeParse(email).success) throw new Error("Informe um e-mail válido.")
  if (gestao.usuarios.some(u => u.id !== dados.id && u.email.toLowerCase() === email)) throw new Error("Este e-mail já está cadastrado, inclusive entre os usuários inativos.")
  const usuario = usuarioSchema.parse({ ...dados, id: existente?.id ?? crypto.randomUUID(), nome, email, criadoEm: existente?.criadoEm ?? agora, atualizadoEm: agora })
  return gestaoSchema.parse({ ...gestao, usuarios: existente ? gestao.usuarios.map(u => u.id === usuario.id ? usuario : u) : [...gestao.usuarios, usuario] })
}

export function atualizarAcao(gestao: GestaoMunicipal, dados: DadosAcao, agora = new Date().toISOString()): GestaoMunicipal {
  const existente = dados.id ? gestao.acoes.find(a => a.id === dados.id) : undefined
  if (dados.id && !existente) throw new Error("Ação não encontrada. Recarregue a lista.")
  const responsavel = gestao.usuarios.find(u => u.id === dados.responsavelId)
  if (!responsavel || (!responsavel.ativo && existente?.responsavelId !== responsavel.id)) throw new Error("Selecione um responsável ativo.")
  if (!dados.titulo.trim() || dados.titulo.trim().length > 160) throw new Error("Informe um título de até 160 caracteres.")
  if (!dados.descricao.trim() || dados.descricao.trim().length > 4000) throw new Error("Descreva a intervenção em até 4.000 caracteres.")
  if (!dataValida(dados.prazo)) throw new Error("Informe um prazo válido.")
  const origem = existente ?? dados
  if (dados.status !== "Concluída" && acaoAberta(gestao.acoes, origem.equipeId, origem.direcao, dados.id)) throw new Error("Já existe uma ação aberta para esta equipe e prioridade. Atualize a ação existente.")
  if (dados.status === "Concluída" && (!dados.revisao?.observacao.trim() || dados.revisao.competencia < origem.competenciaInicial)) throw new Error("Para concluir, registre o resultado e uma competência de revisão igual ou posterior à origem.")
  const statusMudou = existente && existente.status !== dados.status
  let evento = !existente ? "Ação criada." : statusMudou ? `Status alterado: ${existente.status} → ${dados.status}.` : "Ação atualizada."
  if (existente && existente.prazo !== dados.prazo) evento += ` Prazo: ${existente.prazo} → ${dados.prazo}.`
  if (existente && existente.responsavelId !== dados.responsavelId) evento += ` Responsável: ${existente.responsavelNome} → ${responsavel.nome}.`
  if (dados.status === "Concluída") evento += `\nRevisão ${dados.revisao!.competencia}, C1 ${dados.revisao!.valor === null ? "sem resultado" : dados.revisao!.valor + "%"}: ${dados.revisao!.observacao.trim()}`
  const historico = [...(existente?.historico ?? []), { id: crypto.randomUUID(), texto: evento + (dados.observacao?.trim() ? ` ${dados.observacao.trim()}` : ""), data: agora }]
  const acao = acaoSchema.parse({
    id: existente?.id ?? crypto.randomUUID(), titulo: dados.titulo.trim(), descricao: dados.descricao.trim(),
    equipeId: origem.equipeId, equipeNome: origem.equipeNome, unidadeNome: origem.unidadeNome, ine: origem.ine,
    indicador: "C1", direcao: origem.direcao, competenciaInicial: origem.competenciaInicial, valorInicial: origem.valorInicial, fonteInicial: origem.fonteInicial,
    responsavelId: responsavel.id, responsavelNome: responsavel.nome, prazo: dados.prazo, status: dados.status,
    criadoEm: existente?.criadoEm ?? agora, atualizadoEm: agora, historico,
    concluidaEm: dados.status === "Concluída" ? existente?.concluidaEm ?? agora : undefined,
    revisao: dados.status === "Concluída" ? { ...dados.revisao!, observacao: dados.revisao!.observacao.trim(), data: agora } : existente?.revisao,
  })
  return gestaoSchema.parse({ ...gestao, acoes: existente ? gestao.acoes.map(a => a.id === acao.id ? acao : a) : [...gestao.acoes, acao] })
}

export function carregarGestao(escopo: string, storage?: Pick<Storage, "getItem">) {
  if (!storage) return { dados: GESTAO_VAZIA, original: null, erro: null as string | null }
  try {
    const original = storage.getItem(chaveGestao(escopo))
    return { dados: original ? gestaoSchema.parse(JSON.parse(original)) : GESTAO_VAZIA, original, erro: null as string | null }
  } catch {
    return { dados: GESTAO_VAZIA, original: null, erro: "Não foi possível recuperar os cadastros locais. Para preservá-los, novas gravações estão bloqueadas. Verifique o navegador ou reinicie os cadastros deste município." }
  }
}
export function salvarGestao(escopo: string, dados: GestaoMunicipal, original: string | null, storage: Pick<Storage, "getItem" | "setItem">) {
  const validada = gestaoSchema.parse(dados)
  if (storage.getItem(chaveGestao(escopo)) !== original) throw new Error("Os cadastros foram alterados em outra aba. Recarregue a página antes de salvar.")
  const texto = JSON.stringify(validada)
  try { storage.setItem(chaveGestao(escopo), texto) }
  catch { throw new Error("Não foi possível salvar no navegador. Verifique o espaço e as permissões. Os cadastros anteriores foram preservados.") }
  return texto
}
