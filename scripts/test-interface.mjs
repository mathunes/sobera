import assert from "node:assert/strict"
import React from "react"
import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { createServer } from "vite"

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" })
try {
  const { AppRouter } = await server.ssrLoadModule("/src/router.tsx")
  const cases = [
    ["/portal-atencao-basica/dashboard", ["Visão geral da APS", "Prioridades para a gestão", "47,0%", "Insights da APS", "C1 por equipe", "Marina Oliveira"]],
    ["/portal-atencao-basica/indicadores", ["C1, Mais acesso à APS", "Histórico mensal", "Metodologia e faixas oficiais"]],
    ["/portal-atencao-basica/indicadores?equipe=norte-1", ["Equipe Ferradura I", "80,0%", "Verificar acolhimento"]],
    ["/portal-atencao-basica/indicadores?equipe=sul-2", ["Sem dados", "Recorte incompleto"]],
    ["/portal-atencao-basica/indicadores?equipe=inexistente", ["Equipe indisponível neste recorte"]],
    ["/portal-atencao-basica/equipes", ["Equipes e unidades", "Produção ausente", "DEMO-006"]],
    ["/portal-atencao-basica/administracao/dados", ["Dados e importação", "Selecionar arquivo", "Base ativa", "Administração"]],
    ["/portal-atencao-basica/administracao/usuarios", ["Gestão de usuários", "Novo usuário", "Cadastre o primeiro usuário"]],
    ["/portal-atencao-basica/plano-acao", ["Plano de ação", "Nova ação", "Nenhuma ação cadastrada"]],
    ["/login/aps", ["SOBERA", "gestão municipal"]],
  ]
  for (const [url, expected] of cases) {
    const html = renderToString(React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(AppRouter)))
    for (const text of expected) assert.ok(html.includes(text), `${url}: texto ausente: ${text}`)
    if (url.startsWith("/portal-")) {
      assert.ok(!html.includes("Ambiente demonstrativo"))
      assert.ok(!html.includes("Dra. Ana Ferreira"))
      assert.ok(!html.includes('href="/portal-atencao-basica/visitas"'))
    }
    console.log(`Renderização OK: ${url}`)
  }
} finally {
  await server.close()
}
