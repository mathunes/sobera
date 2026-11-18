const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { createRequire } = require("node:module")
const ts = require("typescript")
const cache = new Map()
function load(filename) {
  filename = path.resolve(__dirname, filename)
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }; cache.set(filename, module)
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const external = createRequire(filename)
  const requireFromFile = name => name.startsWith(".") ? load(path.resolve(path.dirname(filename), name + ".ts")) : external(name)
  new Function("exports", "module", "require", source)(module.exports, module, requireFromFile)
  return module.exports
}

const a=load('../lib/c1-analises.ts');
const c=load('../lib/aps-indicadores.ts');
const equipe=c.BASE_DEMO.equipes[0];
function base(valores){const competencias=a.janelaMensal('2026-09',valores.length);return {versao:1,municipio:'Teste',equipes:[equipe],competencias,producao:valores.flatMap((v,i)=>v===null?[]:[{equipeId:equipe.id,competencia:competencias[i],programados:v,espontaneos:100-v}])}}
let b=base([40,60,60,60,40,60]);
let r=a.analisarEstabilidade(equipe,'2026-09',b);
assert.equal(r.recuperacoes,1);assert.equal(r.reincidencias,1);assert.equal(r.validos,6);
b=base([40,60,null,60,60,60]);r=a.analisarEstabilidade(equipe,'2026-09',b);assert.equal(r.recuperacoes,0);assert.equal(r.validos,5);
b=base([0,60]);r=a.analisarVariacao([equipe],'2026-09',b);assert.equal(r.programados.percentual,null);assert.equal(r.programados.absoluta,60);
b=base([60,null]);r=a.analisarVariacao([equipe],'2026-09',b);assert.equal(r.delta,null);assert.equal(r.comparaveis.length,0);
b=base([50]);r=a.dimensaoPrioridades([equipe],'2026-09',b);assert.equal(r[0].distancia,0);assert.equal(r[0].direcao,'abaixo');
b=base([40,40,40,40,60,60,60]);const acao={id:'a',equipeId:equipe.id,competenciaInicial:'2026-06',criadoEm:'2026-06-10',status:'Em andamento'};
r=a.acompanharIntervencao(acao,'2026-09',b);assert.equal(r.completo,true);assert.equal(r.retornoSustentado,true);assert.equal(r.delta,20);
r=a.acompanharIntervencao(acao,'2026-07',b);assert.equal(r.completo,false);assert.equal(r.depois.disponiveis,1);assert.equal(r.depois.aguardando,2);
console.log('Analises C1: comparabilidade, zero, lacunas, limites, recuperacao e janelas temporais OK');

b=base([40,40,40]);
const aberta={...acao,indicador:'C1',direcao:'abaixo',competenciaInicial:'2026-07',prazo:'2026-09-01',responsavelId:'u'};
r=a.respostaGestao([equipe],'2026-09',b,[aberta],[{id:'u',ativo:true}],'2026-10-01');
assert.equal(r.cobertura,100);assert.equal(r.vencidas,1);assert.equal(r.semResponsavelAtivo,0);
r=a.respostaGestao([equipe],'2026-09',b,[aberta],[{id:'u',ativo:false}],'2026-10-01');assert.equal(r.semResponsavelAtivo,1);
r=a.respostaGestao([equipe],'2026-09',b,[{...aberta,competenciaInicial:'2026-10'}],[],'2026-10-01');assert.equal(r.semAcao,1);
console.log('Cobertura, atraso, responsavel inativo e competencia futura: OK');
