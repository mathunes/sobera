import { z } from "zod"

export const CHAVE_PERFIL = "sobera:perfil:v1"
export const PERFIL_PADRAO = { nome: "Marina Oliveira", email: "" }
const schema = z.object({ nome: z.string().trim().min(1, "Informe seu nome.").max(120, "Use até 120 caracteres no nome."), email: z.string().trim().max(254).refine(value => value === "" || z.string().email().safeParse(value).success, "Informe um e-mail válido.") })
export type PerfilLocal = z.infer<typeof schema>

export function carregarPerfilLocal(storage?: Pick<Storage, "getItem">) {
  try {
    const value = storage?.getItem(CHAVE_PERFIL)
    return { perfil: value ? schema.parse(JSON.parse(value)) : PERFIL_PADRAO, erro: null as string | null }
  } catch { return { perfil: PERFIL_PADRAO, erro: "Não foi possível recuperar o perfil local. Você pode preencher e salvar os dados novamente." } }
}
export function salvarPerfilLocal(dados: PerfilLocal, storage: Pick<Storage, "setItem">) {
  const parsed = schema.safeParse({ nome: dados.nome.trim(), email: dados.email.trim().toLowerCase() })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)
  try { storage.setItem(CHAVE_PERFIL, JSON.stringify(parsed.data)) }
  catch { throw new Error("Não foi possível salvar o perfil neste navegador. Os dados anteriores foram preservados.") }
  return parsed.data
}
