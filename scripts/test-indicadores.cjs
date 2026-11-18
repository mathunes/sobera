const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

const sourcePath = path.join(__dirname, "../lib/aps-indicadores.ts")
const output = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const compiled = { exports: {} }
new Function("exports", "module", output)(compiled.exports, compiled)
const c1 = compiled.exports

const limites = [
  [null, "Sem dados"], [NaN, "Sem dados"], [-1, "Sem dados"], [101, "Sem dados"],
  [0, "Regular"], [10, "Regular"], [10.01, "Suficiente"], [30, "Suficiente"],
  [30.01, "Bom"], [50, "Bom"], [50.01, "Ótimo"], [70, "Ótimo"], [70.01, "Regular"], [100, "Regular"],
]
for (const [valor, faixa] of limites) assert.equal(c1.classificarC1(valor), faixa, `Limite ${valor}`)
assert.equal(c1.calcularC1(600, 400), 60)
assert.equal(c1.calcularC1(0, 0), null)
assert.equal(c1.calcularC1(-1, 5), null)
assert.equal(c1.calcularC1(Infinity, 5), null)
assert.equal(c1.direcaoC1(50), "abaixo")
assert.equal(c1.direcaoC1(80), "acima")
assert.equal(c1.distanciaC1(50), 0) // Distância até o limite; 50% ainda não é ótimo.
assert.equal(c1.distanciaC1(80), 10)
assert.equal(c1.distanciaC1(null), null)

const resumo = c1.resumoC1(c1.EQUIPES, "2026-09")
assert.equal(resumo.programados, 1730)
assert.equal(resumo.total, 3680)
assert.equal(resumo.valor, 1730 / 3680 * 100)
assert.equal(resumo.comDados, 5)
assert.equal(resumo.semDados, 1)
assert.equal(c1.resultadoEquipe("sul-2", "2026-09").registro, undefined)
assert.equal(c1.resultadoEquipe("sul-2", "2026-08").faixa, "Sem dados")
assert.equal(c1.persistenciaC1("norte-1", "2026-09"), 2) // Julho: exatamente 70%, ainda ótimo.
assert.equal(c1.persistenciaC1("centro-1", "2026-09"), 0)
assert.equal(c1.persistenciaC1("sul-2", "2026-09"), 0)
assert.equal(c1.resumoC1([], "2026-09").valor, null)
assert.equal(c1.resumoC1(c1.EQUIPES.filter(e => e.unidadeId === "centro"), "2026-09").total, 1780)
assert.equal(c1.competenciaAnterior("2026-04"), null)
assert.equal(c1.competenciaAnterior("2026-09"), "2026-08")
console.log("C1: limites, cálculo ponderado, recortes, ausências, total zerado e persistência verificados.")
