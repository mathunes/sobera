import assert from "node:assert/strict"
import { comNavegador } from "./browser-harness.mjs"

await comNavegador(async ({ command, avaliar, esperar, clicar, origem, falhasJs }) => {
  await command("Page.navigate", { url: origem + "/portal-atencao-basica/indicadores?equipe=centro-1" })
  try { await esperar('document.querySelectorAll("[role=tab]").length === 4') } catch (erro) { console.log(await avaliar('document.body.innerText'), falhasJs); throw erro }
  const abas = [["variacoes", "Volumes nos dois meses"], ["estabilidade", "Mapa de estabilidade das equipes"], ["prioridades", "Evolução observada após as ações"], ["analise", "Histórico mensal"]]
  for (const [aba, titulo] of abas) {
    await clicar(`document.querySelector('[role=tab][id$="trigger-${aba}"]')`)
    await esperar(`document.body.innerText.includes(${JSON.stringify(titulo)})`)
    assert.equal(await avaliar('new URLSearchParams(location.search).get("equipe")'), "centro-1")
    assert.equal(await avaliar('new URLSearchParams(location.search).get("aba")'), aba === "analise" ? null : aba)
  }
  await command("Page.navigate", { url: origem + "/portal-atencao-basica/indicadores?aba=prioridades" })
  await esperar('document.body.innerText.includes("Matriz de prioridades")')
  assert.ok(await avaliar('document.body.innerText.includes("Sem resultado")'))
  assert.equal(falhasJs.length, 0, JSON.stringify(falhasJs))
  console.log("Abas, filtros preservados, links diretos e prioridades sem dados: OK")
})
