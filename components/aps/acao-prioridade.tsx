import Link from "next/link"
import { useGestaoMunicipal } from "@/lib/gestao-municipal-context"
import { acaoAberta } from "@/lib/gestao-municipal"
import type { DirecaoC1 } from "@/lib/aps-indicadores"
import { StatusAcaoBadge } from "./gestao-ui"

export function AcaoPrioridade({ equipeId, direcao }: { equipeId: string; direcao: DirecaoC1 }) {
  const { dados, erro } = useGestaoMunicipal()
  const aberta = acaoAberta(dados.acoes, equipeId, direcao)
  if (erro) return <Link href="/portal-atencao-basica/plano-acao" className="text-xs text-rose-700 hover:underline">Verificar cadastro de ações</Link>
  return <div className="flex flex-col items-start gap-2">{aberta && <StatusAcaoBadge status={aberta.status} />}<Link href={aberta ? `/portal-atencao-basica/plano-acao?acao=${encodeURIComponent(aberta.id)}` : `/portal-atencao-basica/plano-acao?nova=1&equipe=${encodeURIComponent(equipeId)}`} className="text-xs font-semibold text-emerald-700 hover:underline">{aberta ? "Acompanhar ação" : "Criar plano de ação"}</Link></div>
}
