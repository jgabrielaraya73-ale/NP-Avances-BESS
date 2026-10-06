import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as XLSX from 'xlsx'
import { parseXER, validarCronograma } from '../src/utils/xerParser.js'
import { parseExcel } from '../src/utils/excelParser.js'
import { compararCronogramas } from '../src/utils/chartData.js'
import { toTime } from '../src/utils/dates.js'

const task = (changes = {}) => ({ id: 'A', nombre: 'Activity', wbsName: 'WBS', wbsKey: '1', budgetLaborUnits: 100, porcentajeAvance: 25, blStart: '2030-01-01 00:00', blFinish: '2030-01-11 00:00', start: '2030-01-01 00:00', finish: '2030-01-21 00:00', actStart: '2030-01-01 00:00', actFinish: null, status: 'TK_Active', ...changes })
const schedule = (tasks, dataDate = '2030-01-06 00:00') => ({ tasks, dataDate, warnings: [] })

test('uses separate dates, fixed LB weights and exactly one actual cut point', () => {
  const b = schedule([task()])
  const c = schedule([task({ budgetLaborUnits: 9999 })])
  const result = compararCronogramas(b, c)
  assert.deepEqual(result.errors, [])
  assert.equal(result.summary.hours, 100)
  assert.equal(result.summary.plan, 50)
  assert.equal(result.summary.current, 25)
  assert.equal(result.summary.actual, 25)
  assert.equal(result.curve.filter((point) => point.real !== null).length, 1)
  assert.equal(result.curve[0].planificado, 0)
  assert.equal(result.curve.at(-1).vigente, 100)
  assert.equal(result.rows[0].delta, 10)
  assert.equal(result.wbs[0].actual, 25)
})

test('scope changes are disclosed and milestones do not add invented hours', () => {
  const b = schedule([task(), task({ id: 'REMOVED', budgetLaborUnits: 50 }), task({ id: 'M', budgetLaborUnits: 0 })])
  const c = schedule([task(), task({ id: 'NEW' }), task({ id: 'M', budgetLaborUnits: 0 })])
  const result = compararCronogramas(b, c)
  assert.equal(result.summary.matched, 2)
  assert.equal(result.summary.hours, 100)
  assert.equal(result.summary.added, 1)
  assert.equal(result.summary.removed, 1)
  assert.equal(result.warnings.length, 2)
})

test('future actual dates stay visible as provisional instead of silently correcting input', () => {
  const result = compararCronogramas(schedule([task()]), schedule([task({ actFinish: '2030-01-12 00:00', status: 'TK_Complete', porcentajeAvance: 100 })]))
  assert.equal(result.provisional, true)
  assert.equal(result.summary.actual, 100)
  assert.match(result.warnings.join(' '), /posteriores al corte: A/)
})

test('missing cut does not fabricate actuals; manual cut enables them', () => {
  const b = schedule([task()]), c = schedule([task()], null)
  assert.equal(compararCronogramas(b, c).summary.actual, null)
  assert.equal(compararCronogramas(b, c, '2030-01-06T00:00').summary.actual, 25)
})

test('missing progress is not reported as zero', () => {
  const result = compararCronogramas(schedule([task()]), schedule([task({ porcentajeAvance: null })]))
  assert.equal(result.summary.actual, null)
  assert.equal(result.wbs[0].actual, null)
  assert.ok(result.curve.every((point) => point.real === null))
})

test('rejects malformed dates and duplicate codes without a plausible looking chart', () => {
  assert.equal(toTime('2026-02-30'), null)
  assert.equal(toTime('2026-09-25 25:00'), null)
  assert.equal(toTime('19-Aug-26'), Date.UTC(2026, 7, 19))
  assert.equal(toTime('2026-09-25 18:00 A'), Date.UTC(2026, 8, 25, 18))
  assert.throws(() => validarCronograma(schedule([task(), task()])), /duplicado/)
  assert.throws(() => parseXER('not a schedule'), /exactamente un proyecto/)
  const result = compararCronogramas(schedule([task()]), schedule([task({ finish: null })]))
  assert.equal(result.curve.length, 0)
  assert.match(result.errors[0], /Fechas/)
})

test('zero hours and no matching codes return actionable errors', () => {
  assert.match(compararCronogramas(schedule([task()]), schedule([task({ id: 'B' })])).errors[0], /No hay códigos/)
  assert.match(compararCronogramas(schedule([task({ budgetLaborUnits: 0 })]), schedule([task()])).errors[0], /no tienen horas/)
})

test('Excel preserves numeric zero, dates and formatted percentages', () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Activity ID', 'Activity Name', 'Start', 'Finish', 'BL Project Start', 'Budgeted Labor Units', 'Units % Complete'],
    ['A', 'Test', '2030-01-01', '2030-01-11', '2020-01-01', 100, 0.5],
    ['B', 'Zero', '2030-01-01', '2030-01-11', '2020-01-01', 0, 0],
  ])
  sheet.G2.z = '0%'
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Schedule')
  const parsed = parseExcel(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }))
  assert.equal(parsed.tasks[0].porcentajeAvance, 50)
  assert.equal(parsed.tasks[0].blStart, '2030-01-01')
  assert.equal(parsed.tasks[1].porcentajeAvance, 0)
  assert.equal(parsed.tasks[1].budgetLaborUnits, 0)
  assert.equal(parsed.dataDate, null)
})

const basePath = new URL('../../Crono-CeCo-PCyS-Rev0 BLjga.xer', import.meta.url)
const currentPath = new URL('../../Crono-CeCo-PCyS-Rev0-20260925.xer', import.meta.url)
test('CeCo XER regression: 48 matches, correct progress, five slippages and A1030 warning', { skip: !fs.existsSync(basePath) || !fs.existsSync(currentPath) }, () => {
  const b = parseXER(fs.readFileSync(basePath, 'latin1'))
  const c = parseXER(fs.readFileSync(currentPath, 'latin1'))
  assert.equal(c.dataDate, '2026-09-25 18:00')
  assert.equal(c.tasks.find((t) => t.id === 'A1010').porcentajeAvance, 50)
  assert.equal(c.tasks.find((t) => t.id === 'A1180').porcentajeAvance, 95)
  assert.equal(c.tasks.find((t) => t.id === 'A1010').finish, '2026-10-09 18:00')
  const result = compararCronogramas(b, c)
  assert.deepEqual(result.errors, [])
  assert.equal(result.summary.matched, 48)
  assert.equal(result.summary.hours, 2288)
  assert.equal(result.summary.actual, 21.94)
  assert.deepEqual(Object.fromEntries(result.rows.map((row) => [row.id, row.delta])), { A1180: 8, A1010: 4, A1020: 4, A1000: 3, A1270: 3 })
  assert.equal(result.provisional, true)
  assert.match(result.warnings.join(' '), /A1030/)
})
