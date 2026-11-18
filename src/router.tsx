import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import HomePage from "@/app/page"
import LoginApsPage from "@/app/login/aps/page"
import PortalAtencaoBasicaLayout from "@/app/portal-atencao-basica/layout"
import ApsDashboardPage from "@/app/portal-atencao-basica/dashboard/page"
import ApsIndicadoresPage from "@/app/portal-atencao-basica/indicadores/page"
import { EquipesUnidades } from "@/components/aps/equipes-unidades"
import { PlanoAcao } from "@/components/aps/plano-acao"
import { UsuariosMunicipais } from "@/components/aps/usuarios-municipais"
import { ImportarC1 } from "@/components/aps/importar-c1"

function ApsLayoutRoute() {
  return <PortalAtencaoBasicaLayout><Outlet /></PortalAtencaoBasicaLayout>
}

export function AppRouter() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login/aps" element={<LoginApsPage />} />
    <Route path="/portal-atencao-basica" element={<ApsLayoutRoute />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ApsDashboardPage />} />
      <Route path="indicadores" element={<ApsIndicadoresPage />} />
      <Route path="equipes" element={<EquipesUnidades />} />
      <Route path="plano-acao" element={<PlanoAcao />} />
      <Route path="administracao/dados" element={<ImportarC1 />} />
      <Route path="administracao/usuarios" element={<UsuariosMunicipais />} />
      <Route path="dados" element={<Navigate to="/portal-atencao-basica/administracao/dados" replace />} />
      <Route path="*" element={<Navigate to="/portal-atencao-basica/dashboard" replace />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
