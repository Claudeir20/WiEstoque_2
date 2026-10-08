const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const filename = path.join(__dirname, '../src/history.ts')
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const loaded = new Module(filename, module)
loaded._compile(compiled, filename)
const { filterHistory, summarizeHistory } = loaded.exports
const product = (id, quantity) => ({ type: 'PRODUCT', productId: id, routerId: null, productName: 'Conector', quantity })
const movement = (id, technicianId, date, type, items) => ({ id, technicianId, technicianName: technicianId || 'Entrada de estoque', date, type, items })
const filters = { technicianId: '', startDate: '', endDate: '', itemId: '', type: 'WITHDRAWAL' }
const data = [
  movement('before','joao','2026-09-30T23:59:59','WITHDRAWAL',[product('conector',100)]),
  movement('first','joao','2026-10-01T00:00:00','WITHDRAWAL',[product('conector',30),product('cabo',5)]),
  movement('last','joao','2026-10-31T23:59:59.999999','WITHDRAWAL',[product('conector',50)]),
  movement('after','joao','2026-11-01T00:00:00','WITHDRAWAL',[product('conector',100)]),
  movement('other','marina','2026-10-10T09:00:00','WITHDRAWAL',[product('conector',20)]),
  movement('return','joao','2026-10-15T09:00:00','RETURN',[product('conector',10)]),
  movement('entry',null,'2026-10-16T09:00:00','ENTRY',[product('conector',40)]),
]
test('October includes both boundary days, filters technician and only the selected material', () => {
  const result = filterHistory(data, { ...filters, technicianId: 'joao', startDate: '2026-10-01', endDate: '2026-10-31', itemId: 'PRODUCT:conector' })
  assert.deepEqual(result.map(m => m.id), ['last','first'])
  assert.equal(result[1].items.length,1)
  assert.equal(summarizeHistory(result)[0].withdrawals,80)
  assert.equal(data[1].items.length,2)
})
test('All types keep withdrawal, return, and entry totals separate and group each technician', () => {
  const result = filterHistory(data, { ...filters, type: '', startDate: '2026-10-01', endDate: '2026-10-31', itemId: 'PRODUCT:conector' })
  const summary = summarizeHistory(result)
  const joao = summary.find(r => r.technician === 'joao')
  assert.equal(joao.withdrawals,80)
  assert.equal(joao.returns,10)
  assert.equal(joao.net,70)
  assert.equal(summary.find(r => r.technician === 'marina').withdrawals,20)
  assert.equal(summary.find(r => r.technician === 'Entrada de estoque').entries,40)
})
test('Invalid ranges and nonexistent items return no results; one-sided and same-day ranges work', () => {
  assert.equal(filterHistory(data,{ ...filters, startDate:'2026-10-31',endDate:'2026-10-01' }).length,0)
  assert.equal(filterHistory(data,{ ...filters, itemId:'PRODUCT:missing' }).length,0)
  assert.equal(filterHistory(data,{ ...filters, startDate:'2026-11-01' }).length,1)
  assert.equal(filterHistory(data,{ ...filters, endDate:'2026-09-30' }).length,1)
  assert.equal(filterHistory(data,{ ...filters, startDate:'2026-10-31',endDate:'2026-10-31' }).length,1)
})
test('Items with identical names are grouped by ID, and routers remain individual', () => {
  const result = summarizeHistory([movement('x','joao','2026-10-01T00:00:00','WITHDRAWAL',[
    product('one',2),product('two',3),{ type:'ROUTER',routerId:'router',productId:null,model:'AX',assetNumber:'PAT-1',quantity:1 }
  ])])
  assert.equal(result.length,3)
  assert.deepEqual(result.map(r => r.withdrawals).sort(),[1,2,3])
})
