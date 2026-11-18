import { createContext, useContext, useState, type ReactNode } from "react"
import { useIndicadores } from "./aps-indicadores-context"
import { atualizarAcao, atualizarUsuario, carregarGestao, chaveGestao, escopoMunicipio, GESTAO_VAZIA, salvarGestao, type DadosAcao, type DadosUsuario, type GestaoMunicipal } from "./gestao-municipal"

interface ContextoGestao {
  dados: GestaoMunicipal
  erro: string | null
  salvarUsuario: (dados: DadosUsuario) => void
  salvarAcao: (dados: DadosAcao) => void
  reiniciar: () => void
}
const Contexto = createContext<ContextoGestao | null>(null)
function lerEscopo(escopo: string) {
  try { return { escopo, ...carregarGestao(escopo, typeof window === "undefined" ? undefined : window.localStorage) } }
  catch { return { escopo, dados: GESTAO_VAZIA, original: null, erro: "Armazenamento local indisponível. Não é possível gravar cadastros." } }
}
function GestaoEscopo({ escopo, children }: { escopo: string; children: ReactNode }) {
  const [estado, setEstado] = useState(() => lerEscopo(escopo))
  // Atualiza este contexto antes de renderizar os filhos, sem remontar a tela de importação.
  if (estado.escopo !== escopo) setEstado(lerEscopo(escopo))
  function gravar(dados: GestaoMunicipal) {
    if (estado.erro) throw new Error(estado.erro)
    const original = salvarGestao(escopo, dados, estado.original, window.localStorage)
    setEstado({ escopo, dados, original, erro: null })
  }
  function reiniciar() {
    window.localStorage.removeItem(chaveGestao(escopo))
    setEstado({ escopo, dados: GESTAO_VAZIA, original: null, erro: null })
  }
  return <Contexto.Provider value={{ dados: estado.dados, erro: estado.erro, salvarUsuario: dados => gravar(atualizarUsuario(estado.dados, dados)), salvarAcao: dados => gravar(atualizarAcao(estado.dados, dados)), reiniciar }}>{children}</Contexto.Provider>
}
export function GestaoMunicipalProvider({ children }: { children: ReactNode }) {
  const { base } = useIndicadores()
  const escopo = escopoMunicipio(base)
  return <GestaoEscopo escopo={escopo}>{children}</GestaoEscopo>
}
export function useGestaoMunicipal() {
  const value = useContext(Contexto)
  if (!value) throw new Error("Contexto de gestão municipal indisponível")
  return value
}
