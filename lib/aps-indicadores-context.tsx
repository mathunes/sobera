import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { BASE_DEMO, equipesNaCompetencia, competenciaAnterior, persistenciaC1, resultadoEquipe, resumoC1, type BaseC1, type EquipeAps } from "@/lib/aps-indicadores"
import { carregarBaseC1, CHAVE_BASE_C1, salvarBaseC1 } from "@/lib/c1-storage"

interface ContextoIndicadores {
  base: BaseC1
  competencia: string
  competencias: string[]
  setCompetencia: (value: string) => void
  unidadeId: string
  setUnidadeId: (value: string) => void
  equipes: EquipeAps[]
  equipesTodas: EquipeAps[]
  erroArmazenamento: string | null
  importarBase: (base: BaseC1) => void
  usarExemplo: () => void
  resumoC1: typeof resumoC1
  resultadoEquipe: typeof resultadoEquipe
  persistenciaC1: typeof persistenciaC1
  competenciaAnterior: (value: string) => string | null
}

const Contexto = createContext<ContextoIndicadores | null>(null)

function iniciarBase() {
  try { return carregarBaseC1(typeof window === "undefined" ? undefined : window.localStorage) }
  catch { return { base: BASE_DEMO, erro: "Armazenamento local indisponível. A base de exemplo está ativa." } }
}

export function IndicadoresProvider({ children }: { children: ReactNode }) {
  const [inicial] = useState(iniciarBase)
  const [base, setBase] = useState(inicial.base)
  const [erroArmazenamento, setErro] = useState(inicial.erro)
  const [competencia, setCompetencia] = useState(inicial.base.competencias.at(-1)!)
  const [unidadeId, setUnidadeId] = useState("todas")
  const equipesTodas = useMemo(() => equipesNaCompetencia(base, competencia), [base, competencia])
  const equipes = equipesTodas.filter(e => unidadeId === "todas" || e.unidadeId === unidadeId)
  const calculos = useMemo(() => ({
    resumoC1: (equipes: EquipeAps[], mes: string) => resumoC1(equipes, mes, base),
    resultadoEquipe: (id: string, mes: string) => resultadoEquipe(id, mes, base),
    persistenciaC1: (id: string, mes: string) => persistenciaC1(id, mes, base),
    competenciaAnterior: (mes: string) => competenciaAnterior(mes, base.competencias),
  }), [base])

  function ativar(nova: BaseC1) {
    setBase(nova)
    setCompetencia(nova.competencias.at(-1)!)
    setUnidadeId("todas")
    setErro(null)
  }
  function importarBase(nova: BaseC1) {
    try { salvarBaseC1(nova, window.localStorage) }
    catch { throw new Error("Não foi possível salvar a importação. Verifique o espaço e as permissões do navegador. A base atual foi preservada.") }
    ativar(nova)
  }
  function usarExemplo() {
    try { window.localStorage.removeItem(CHAVE_BASE_C1) }
    catch { throw new Error("Não foi possível remover a base salva. A base atual foi preservada.") }
    ativar(BASE_DEMO)
  }
  return <Contexto.Provider value={{ base, competencia, competencias: base.competencias, setCompetencia: value => { if (base.competencias.includes(value)) { setCompetencia(value); setUnidadeId("todas") } }, unidadeId, setUnidadeId, equipes, equipesTodas, erroArmazenamento, importarBase, usarExemplo, ...calculos }}>{children}</Contexto.Provider>
}

export function useIndicadores() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error("Contexto municipal indisponível")
  return contexto
}
