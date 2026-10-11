const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
function load(name) {
 const filename = path.join(__dirname, '../src/' + name + '.ts')
 const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
 const loaded = new Module(filename, module)
 loaded.paths = Module._nodeModulePaths(path.dirname(filename))
 loaded._compile(compiled, filename)
 return loaded.exports
}
const { searchMovementItems, candidateUnavailable } = load('movementSearch')
const materials = [{id:'cto',name:'CTO',quantity:3,active:true}, {id:'conector',name:'CONECTOR',quantity:0,active:true}, {id:'archived',name:'CTO antigo',quantity:3,active:false}, {id:'fiber',name:'Conexão óptica',quantity:2,active:true}]
const routers = [{id:'r1',assetNumber:'001',model:'ZTE',serialNumber:'SN1',mac:'AA:BB:CC:DD:EE:FF',status:'IN_STOCK'}, {id:'r2',assetNumber:'002',model:'ZTE',serialNumber:'SN2',mac:'00:11:22:33:44:55',status:'OUT_OF_STOCK'}]
test('Exact material is first and ambiguous results remain selectable', () => {
 const found=searchMovementItems(materials,routers,'cto','Saída')
 assert.equal(found[0].id,'cto'); assert.equal(found[0].exact,true)
 assert.equal(found.length,2); assert.equal(found[1].exact,false)
 assert.equal(searchMovementItems(materials,routers,'conexao','Saída')[0].id,'fiber')
 assert.deepEqual(searchMovementItems(materials,routers,'   ','Saída'),[])
})
test('Scanner MAC separators match and entries show only materials', () => {
 for (const query of ['aabbccddeeff','aa-bb-cc-dd-ee-ff','aabb.ccdd.eeff']) {
  assert.equal(searchMovementItems(materials,routers,query,'Saída')[0].id,'r1')
 }
 assert.equal(searchMovementItems(materials,routers,'zte','Devolução').length,2)
 assert.equal(searchMovementItems(materials,routers,'zte','Entrada').length,0)
})
test('Unavailable and already added candidates cannot be selected', () => {
 const product=searchMovementItems(materials,routers,'CTO','Saída')[0]
 assert.equal(candidateUnavailable(product,'Saída',[{id:'cto',quantity:3}]),'Saldo já adicionado')
 assert.equal(candidateUnavailable(product,'Entrada',[{id:'cto',quantity:3}]),'')
 const router=searchMovementItems(materials,routers,'SN1','Saída')[0]
 assert.equal(candidateUnavailable(router,'Devolução',[]),'Já está no estoque')
 assert.equal(candidateUnavailable(router,'Saída',[{id:'r1',quantity:1}]),'Já adicionado')
})
