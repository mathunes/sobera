import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useGestaoMunicipal } from "@/lib/gestao-municipal-context"
import type { StatusAcao } from "@/lib/gestao-municipal"

export const INPUT_GESTAO = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
export const TEXTAREA_GESTAO = "min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
export function StatusAcaoBadge({ status }: { status: StatusAcao }) {
  const cores = { "Pendente": "bg-slate-100 text-slate-700", "Em andamento": "bg-sky-50 text-sky-800", "Concluída": "bg-emerald-50 text-emerald-800" }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cores[status]}`}>{status}</span>
}
export function ErroGestao() {
  const { erro, reiniciar } = useGestaoMunicipal()
  const [falha, setFalha] = useState<string | null>(null)
  if (!erro) return null
  return <div className="space-y-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"><p role="alert">{falha || erro}</p><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="rounded-xl">Reiniciar cadastros deste município</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reiniciar os cadastros locais?</AlertDialogTitle><AlertDialogDescription>Usuários e ações salvos neste navegador para o município atual serão removidos. A base de indicadores permanece intacta.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { try { reiniciar() } catch { setFalha("Não foi possível remover os cadastros. Verifique as permissões do navegador.") } }}>Reiniciar cadastros</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
}
