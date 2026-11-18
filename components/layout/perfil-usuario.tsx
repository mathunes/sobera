import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ChevronDown, LogOut, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { carregarPerfilLocal, PERFIL_PADRAO, salvarPerfilLocal } from "@/lib/perfil-local"
import { INPUT_GESTAO } from "@/components/aps/gestao-ui"

function iniciar() {
  try { return carregarPerfilLocal(typeof window === "undefined" ? undefined : window.localStorage) }
  catch { return { perfil: PERFIL_PADRAO, erro: "Armazenamento local indisponível." } }
}
export function PerfilUsuario() {
  const [inicial] = useState(iniciar)
  const [perfil, setPerfil] = useState(inicial.perfil)
  const [rascunho, setRascunho] = useState(inicial.perfil)
  const [falha, setFalha] = useState(inicial.erro)
  const [aberto, setAberto] = useState(false)
  const iniciais = perfil.nome.split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase()
  function salvar(event: FormEvent) {
    event.preventDefault()
    try { setPerfil(salvarPerfilLocal(rascunho, window.localStorage)); setFalha(null); setAberto(false) }
    catch (error) { setFalha(error instanceof Error ? error.message : "Não foi possível salvar seu perfil.") }
  }
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-auto gap-2 rounded-full px-2 py-1.5 hover:bg-slate-50" aria-label="Abrir menu do usuário" title={perfil.nome}>
      <Avatar className="size-9"><AvatarImage src={import.meta.env.BASE_URL + "images/avatar-usuario-2.png"} alt="" className="object-cover" /><AvatarFallback className="bg-emerald-50 text-xs font-semibold text-emerald-800">{iniciais}</AvatarFallback></Avatar>
      <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 lg:block">{perfil.nome}</span><ChevronDown className="h-3.5 w-3.5 text-slate-400" />
    </Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-60 rounded-xl border-slate-100 bg-white p-1.5 shadow-lg" onCloseAutoFocus={event => { if (aberto) event.preventDefault() }}>
      <DropdownMenuLabel><p className="truncate text-sm font-semibold">{perfil.nome}</p><p className="mt-1 truncate text-xs font-normal text-slate-500">{perfil.email || "Perfil local"}</p></DropdownMenuLabel><DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => { setRascunho(perfil); setAberto(true) }} className="cursor-pointer gap-2 rounded-lg py-2.5 focus:bg-emerald-50 focus:text-emerald-800"><UserRound className="h-4 w-4" />Meu perfil</DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2.5 text-rose-700 focus:bg-rose-50 focus:text-rose-800"><Link href="/login/aps" className="flex items-center gap-2"><LogOut className="h-4 w-4" />Sair</Link></DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    <Dialog open={aberto} onOpenChange={setAberto}><DialogContent className="rounded-2xl sm:max-w-lg"><DialogHeader><DialogTitle>Meu perfil</DialogTitle><DialogDescription>Personalize o nome e o e-mail exibidos neste navegador. Estes dados não alteram os cadastros municipais nem criam credenciais de acesso.</DialogDescription></DialogHeader><form onSubmit={salvar} className="space-y-4">
      {falha && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{falha}</p>}
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Seu nome *<input required maxLength={120} autoComplete="name" className={INPUT_GESTAO} value={rascunho.nome} onChange={e => setRascunho({ ...rascunho, nome: e.target.value })} /></label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Seu e-mail (opcional)<input type="email" maxLength={254} autoComplete="email" className={INPUT_GESTAO} value={rascunho.email} onChange={e => setRascunho({ ...rascunho, email: e.target.value })} /></label>
      <DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={() => setAberto(false)}>Cancelar</Button><Button type="submit" className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Salvar perfil</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </>
}
