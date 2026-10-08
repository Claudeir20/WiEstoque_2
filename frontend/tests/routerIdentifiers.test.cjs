const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const filename = path.join(__dirname, '../src/routerIdentifiers.ts')
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const loaded = new Module(filename, module)
loaded._compile(compiled, filename)
const { normalizeSerial, formatMac, normalizeMac } = loaded.exports

test('Scanner input accepts common MAC separators and normalizes serial', () => {
  assert.equal(normalizeSerial(' sn-zte-001\r\n'), 'SN-ZTE-001')
  for (const value of ['aabbccddee01', 'aa:bb:cc:dd:ee:01', 'aa-bb-cc-dd-ee-01', 'aabb.ccdd.ee01']) {
    assert.equal(normalizeMac(value), 'AA:BB:CC:DD:EE:01')
  }
})
test('Partial MAC input formats as the scanner types', () => {
  assert.equal(formatMac(''), '')
  assert.equal(formatMac('aab'), 'AA:B')
  assert.equal(formatMac('AA:Bb'), 'AA:BB')
})
test('Invalid scans remain visible and cannot be saved', () => {
  assert.equal(formatMac('D4D6B8N9S354A'), 'D4D6B8N9S354A')
  for (const value of ['', 'aabbccddee0', 'aabbccddee011', 'D4D6B8N9S354A', 'aabbccddee01!', 'aa bb cc dd ee 01']) {
    assert.throws(() => normalizeMac(value), /MAC inválido/)
  }
})
