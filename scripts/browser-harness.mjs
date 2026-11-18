import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createServer } from "vite"
import { createServer as createNetServer } from "node:net"

export async function comNavegador(testar) {
// Perfil e servidor isolados: não usa o navegador ou a base local do usuário.
const executavel = process.env.SOBERA_TEST_BROWSER || [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find(existsSync)
if (!executavel) throw new Error("Defina SOBERA_TEST_BROWSER com um navegador Chromium para executar este teste.")
const diretorio = await mkdtemp(path.join(tmpdir(), "sobera-c1-test-"))
const portaLivre = await new Promise((resolve, reject) => {
  const reserva = createNetServer()
  reserva.once("error", reject)
  reserva.listen(0, "127.0.0.1", () => { const porta = reserva.address().port; reserva.close(() => resolve(porta)) })
})
const server = await createServer({ logLevel: "error", server: { host: "127.0.0.1", port: portaLivre, strictPort: true } })
let navegador, ws
const pendentes = new Map()
const falhasJs = []
let sequencia = 0
function enviar(method, params = {}, sessionId) {
  const id = ++sequencia
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pendentes.delete(id); reject(new Error(`Tempo esgotado: ${method}`)) }, 15000)
    pendentes.set(id, { resolve, reject, timeout })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}
try {
  await server.listen()
  const porta = server.httpServer.address().port
  const origem = `http://127.0.0.1:${porta}`
  navegador = spawn(executavel, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${path.join(diretorio, "perfil")}`, "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-extensions", "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] })
  const endpoint = await new Promise((resolve, reject) => {
    let log = ""
    const timeout = setTimeout(() => reject(new Error("Navegador não iniciou o protocolo de depuração.")), 20000)
    navegador.once("error", error => { clearTimeout(timeout); reject(error) })
    navegador.once("exit", code => { clearTimeout(timeout); reject(new Error(`Navegador encerrou: ${code}`)) })
    navegador.stderr.on("data", data => {
      log += data.toString()
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(log)
      if (match) { clearTimeout(timeout); resolve(match[1]) }
    })
  })
  ws = new WebSocket(endpoint)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  ws.onmessage = event => {
    const response = JSON.parse(event.data)
    if (response.method === "Runtime.exceptionThrown") falhasJs.push(response.params.exceptionDetails.exception?.description || response.params.exceptionDetails.text)
    const pending = pendentes.get(response.id)
    if (!pending) return
    clearTimeout(pending.timeout); pendentes.delete(response.id)
    if (response.error) pending.reject(new Error(response.error.message))
    else pending.resolve(response.result)
  }
  const target = await enviar("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await enviar("Target.attachToTarget", { targetId: target.targetId, flatten: true })
  const command = (method, params = {}) => enviar(method, params, sessionId)
  await command("Runtime.enable")
  await command("Page.enable")
  async function avaliar(expression) {
    const response = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
    return response.result.value
  }
  async function esperar(expression) {
    const inicio = Date.now()
    while (Date.now() - inicio < 20000) {
      if (await avaliar(`Boolean(${expression})`)) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Condição não atendida: ${expression}`)
  }
  async function clicar(expression) {
    const ponto = await avaliar(`(()=>{const e=${expression};if(!e)throw Error('Elemento não encontrado');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await command("Input.dispatchMouseEvent", { type: "mousePressed", ...ponto, button: "left", clickCount: 1 })
    await command("Input.dispatchMouseEvent", { type: "mouseReleased", ...ponto, button: "left", clickCount: 1 })
  }
  async function carregarArquivo(filename) {
    const { root } = await command("DOM.getDocument")
    const { nodeId } = await command("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' })
    await command("DOM.setFileInputFiles", { nodeId, files: [filename] })
  }
  await testar({ command, avaliar, esperar, clicar, carregarArquivo, origem, diretorio, falhasJs });
} finally {
  if (ws?.readyState === WebSocket.OPEN) {
    try { await enviar("Browser.close") } catch { /* O fechamento pode interromper a resposta. */ }
    ws.close()
  }
  for (const pending of pendentes.values()) clearTimeout(pending.timeout)
  navegador?.kill()
  await server.close()
  // Somente o diretório temporário criado por este teste pode ser removido.
  const resolvido = path.resolve(diretorio)
  if (path.dirname(resolvido) === path.resolve(tmpdir()) && path.basename(resolvido).startsWith("sobera-c1-test-")) {
    await rm(resolvido, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {})
  }
}

}
