import { useState, type FormEvent } from "react"
import { Pencil, Plus, UserCheck, UserRoundX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useGestaoMunicipal } from "@/lib/gestao-municipal-context"
import { PERFIS_USUARIO, type DadosUsuario, type UsuarioMunicipal } from "@/lib/gestao-municipal"
import { FiltroSelect, MetricCard, PageIntro, Panel } from "./indicadores-ui"
import { ErroGestao, INPUT_GESTAO } from "./gestao-ui"

const NOVO_USUARIO: DadosUsuario = { nome: "", email: "", perfil: "Gestor da APS", ativo: true }

export function UsuariosMunicipais() {
  const { dados, salvarUsuario, erro } = useGestaoMunicipal()
  const [busca, setBusca] = useState("")
  const [perfil, setPerfil] = useState("todos")
  const [status, setStatus] = useState("todos")
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState<DadosUsuario>(NOVO_USUARIO)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [falha, setFalha] = useState<string | null>(null)
  const usuarios = dados.usuarios.filter(u => (perfil === "todos" || u.perfil === perfil) && (status === "todos" || u.ativo === (status === "ativos")) && `${u.nome} ${u.email}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")))
  const ativos = dados.usuarios.filter(u => u.ativo).length
  function editar(usuario?: UsuarioMunicipal) {
    setForm(usuario ? { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, ativo: usuario.ativo } : { ...NOVO_USUARIO })
    setFalha(null); setMensagem(null); setAberto(true)
  }
  function salvar(event: FormEvent) {
    event.preventDefault()
    try { salvarUsuario(form); setAberto(false); setFalha(null); setMensagem(form.id ? "Usuário atualizado." : "Usuário cadastrado.") }
    catch (error) { setFalha(error instanceof Error ? error.message : "Não foi possível salvar o usuário.") }
  }
  function alternar(usuario: UsuarioMunicipal) {
    try { salvarUsuario({ ...usuario, ativo: !usuario.ativo }); setFalha(null); setMensagem(usuario.ativo ? "Usuário inativado. Seu histórico de responsabilidades foi preservado." : "Usuário reativado.") }
    catch (error) { setMensagem(null); setFalha(error instanceof Error ? error.message : "Não foi possível atualizar o usuário.") }
  }
  return <div className="space-y-6 p-4 md:p-8">
    <PageIntro titulo="Gestão de usuários" descricao="Organize os usuários do município e defina os responsáveis pelos planos de ação."><Button onClick={() => editar()} disabled={!!erro} className="gap-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"><Plus className="h-4 w-4" />Novo usuário</Button></PageIntro>
    <ErroGestao />
    <p className="rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-600">Cadastros salvos neste navegador para o município atual. Os perfis são classificações do cadastro: ainda não concedem permissões, criam credenciais ou enviam convites de acesso.</p>
    {mensagem && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{mensagem}</p>}
    {falha && !aberto && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{falha}</p>}
    <div className="grid gap-4 sm:grid-cols-3"><MetricCard titulo="Usuários cadastrados" valor={String(dados.usuarios.length)} descricao="Cadastros do município atual." /><MetricCard titulo="Ativos" valor={String(ativos)} descricao="Disponíveis para novas atribuições de ações." /><MetricCard titulo="Inativos" valor={String(dados.usuarios.length - ativos)} descricao="Histórico preservado, sem novas atribuições." /></div>
    <Panel titulo="Usuários do município" descricao="E-mails são únicos no cadastro, incluindo usuários inativos.">
      <div className="mb-5 flex flex-wrap gap-3"><label className="flex min-w-44 flex-1 flex-col gap-1.5 text-xs font-medium text-slate-500">Buscar usuário<input value={busca} onChange={e => setBusca(e.target.value)} className={INPUT_GESTAO} placeholder="Nome ou e-mail" /></label><FiltroSelect label="Perfil" value={perfil} onValueChange={setPerfil} options={[{ value: "todos", label: "Todos os perfis" }, ...PERFIS_USUARIO.map(p => ({ value: p, label: p }))]} className="w-full sm:w-48" /><FiltroSelect label="Situação" value={status} onValueChange={setStatus} options={[{ value: "todos", label: "Todos" }, { value: "ativos", label: "Ativos" }, { value: "inativos", label: "Inativos" }]} className="w-full sm:w-40" /></div>
      <p role="status" className="mb-3 text-xs text-slate-500">{usuarios.length} usuário(s) encontrado(s)</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr>{["Usuário", "Perfil", "Situação", "Ações abertas", "Gerenciar"].map(t => <th key={t} scope="col" className="p-3 text-xs font-medium text-slate-500">{t}</th>)}</tr></thead><tbody>{usuarios.map(u => <tr key={u.id} className="border-t border-slate-100"><td className="p-3"><p className="font-semibold">{u.nome}</p><p className="mt-1 text-xs text-slate-500">{u.email}</p></td><td className="p-3 text-xs">{u.perfil}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.ativo ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{u.ativo ? "Ativo" : "Inativo"}</span></td><td className="p-3 tabular-nums">{dados.acoes.filter(a => a.responsavelId === u.id && a.status !== "Concluída").length}</td><td className="p-3"><div className="flex gap-2"><Button variant="ghost" size="sm" disabled={!!erro} onClick={() => editar(u)} aria-label={`Editar ${u.nome}`} className="gap-1.5 rounded-lg text-xs"><Pencil className="h-3.5 w-3.5" />Editar</Button><Button variant="ghost" size="sm" disabled={!!erro} onClick={() => alternar(u)} aria-label={`${u.ativo ? "Inativar" : "Reativar"} ${u.nome}`} className="gap-1.5 rounded-lg text-xs">{u.ativo ? <UserRoundX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}{u.ativo ? "Inativar" : "Reativar"}</Button></div></td></tr>)}{!usuarios.length && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-500">{dados.usuarios.length ? "Nenhum usuário corresponde aos filtros." : "Cadastre o primeiro usuário para atribuir responsáveis às ações."}</td></tr>}</tbody></table></div>
    </Panel>
    <Dialog open={aberto} onOpenChange={setAberto}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg"><DialogHeader><DialogTitle>{form.id ? "Editar usuário" : "Novo usuário"}</DialogTitle><DialogDescription>Cadastro municipal para organização e atribuição de responsabilidades. Não cria uma conta de acesso.</DialogDescription></DialogHeader><form onSubmit={salvar} className="space-y-4">
      {falha && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{falha}</p>}
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Nome completo *<input required maxLength={120} autoComplete="name" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className={INPUT_GESTAO} /></label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">E-mail *<input type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={INPUT_GESTAO} /></label>
      <FiltroSelect label="Perfil" value={form.perfil} onValueChange={value => setForm({ ...form, perfil: value as DadosUsuario["perfil"] })} options={PERFIS_USUARIO.map(p => ({ value: p, label: p }))} />
      <FiltroSelect label="Situação do cadastro" value={form.ativo ? "ativo" : "inativo"} onValueChange={value => setForm({ ...form, ativo: value === "ativo" })} options={[{ value: "ativo", label: "Ativo" }, { value: "inativo", label: "Inativo" }]} />
      <p className="text-xs leading-relaxed text-slate-500">Usuários inativos continuam no histórico das ações, mas não ficam disponíveis para novas atribuições.</p>
      <DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={() => setAberto(false)}>Cancelar</Button><Button type="submit" disabled={!!erro} className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Salvar usuário</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </div>
}
