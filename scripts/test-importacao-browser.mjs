import assert from "node:assert/strict"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { comNavegador } from "./browser-harness.mjs"

await comNavegador(async ({ command, avaliar, esperar, clicar, carregarArquivo, origem, diretorio, falhasJs }) => {
  await command("Page.navigate", { url: `${origem}/portal-atencao-basica/administracao/dados` })
  await esperar('!!document.querySelector("input[type=file]")')
  await carregarArquivo(path.resolve("public/exemplos/c1-modelo.csv"))
  await esperar('document.body.innerText.includes("Prévia dos primeiros 10 registros")')
  assert.ok(await avaliar('document.body.innerText.includes("Município de exemplo")'))
  await clicar('document.querySelector("input[type=checkbox]")')
  await clicar('[...document.querySelectorAll("button")].find(e=>e.textContent.includes("Substituir base e atualizar"))')
  await esperar('document.body.innerText.includes("Base importada e salva")')
  const dados = await avaliar('JSON.parse(localStorage.getItem("sobera:c1:base:v1"))')
  assert.equal(dados.producao.length, 4)
  assert.equal(dados.equipes[0].ine, "0000000001")
  console.log("Navegador: upload, revisão, importação e persistência OK.")

  await command("Page.navigate", { url: `${origem}/portal-atencao-basica/dashboard` })
  await esperar('document.body.innerText.includes("57,3%")')
  assert.ok(await avaliar('document.body.innerText.includes("Município de exemplo")'))
  await clicar('document.querySelector("button[role=combobox]")')
  await esperar('document.querySelectorAll("[role=option]").length > 0')
  await clicar('[...document.querySelectorAll("[role=option]")].find(e=>e.textContent.includes("ago"))')
  await esperar('document.body.innerText.includes("53,3%")')
  console.log("Navegador: recarregamento e filtro de competência usam dados importados.")

  await clicar('document.querySelector("a[href=\\"/portal-atencao-basica/equipes\\"]")')
  await esperar('document.body.innerText.includes("Resultados por equipe")')
  assert.ok(await avaliar('document.body.innerText.includes("0000000001") && !document.body.innerText.includes("DEMO-001")'))
  await clicar('[...document.querySelectorAll("button[role=combobox]")][1]')
  await esperar('document.querySelectorAll("[role=option]").length > 0')
  await clicar('[...document.querySelectorAll("[role=option]")].find(e=>e.textContent==="UBS Centro")')
  await esperar('document.body.innerText.includes("1 equipe(s) encontrada(s)")')
  await clicar('[...document.querySelectorAll("a")].find(e=>e.textContent.includes("Analisar equipe"))')
  await esperar('document.body.innerText.includes("60,0%") && document.body.innerText.includes("Histórico mensal")')
  assert.ok(await avaliar('location.search.includes("equipe=0000000001")'))
  console.log("Navegador: unidade, tabela e detalhamento C1 conectados à mesma base.")

  await command("Page.navigate", { url: `${origem}/portal-atencao-basica/administracao/dados` })
  await esperar('!!document.querySelector("input[type=file]")')
  const invalido = path.join(diretorio, "invalido.csv")
  await writeFile(invalido, "Competencia;INE;CNES;Tipo;Municipio;Numerador;Denominador\n2026-09;0000000001;0000001;eSF;Município de exemplo;100;50\n")
  await carregarArquivo(invalido)
  await esperar('document.body.innerText.includes("Numerador maior que denominador")')
  assert.ok(await avaliar('[...document.querySelectorAll("button")].find(e=>e.textContent.includes("Substituir base e atualizar")).disabled'))
  assert.equal((await avaliar('JSON.parse(localStorage.getItem("sobera:c1:base:v1"))')).producao.length, 4)
  assert.deepEqual(falhasJs, [])
  console.log("Navegador: arquivo inválido bloqueado; base anterior preservada; sem exceções JavaScript.")
});
