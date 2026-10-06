import { useMemo } from 'react'
import Curvas from './Curvas'
import { compararCronogramas } from '../utils/chartData'
import { dateText } from '../utils/dates'

const percent = (value) => value == null ? '—' : `${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`

export default function ChartsSection({ base, current, cut }) {
  const comparison = useMemo(() => compararCronogramas(base, current, cut), [base, current, cut])
  if (!base || !current) return <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">{!base && !current ? 'Cargá la línea base y el cronograma vigente para ver las curvas.' : !base ? 'Falta cargar la línea base (LB).' : 'Falta cargar el cronograma vigente.'}</div>
  const { summary, warnings, errors, provisional } = comparison
  const observations = [...new Set(warnings)]
  const metrics = summary ? [
    ['LB al corte', percent(summary.plan), 'text-sky-400'],
    ['Vigente por fechas al corte', percent(summary.current), 'text-amber-400'],
    [provisional ? 'Avance informado · provisional' : 'Avance informado al corte', percent(summary.actual), 'text-emerald-400'],
    ['Actividades coincidentes', `${summary.matched} / ${base.tasks.length}`, 'text-white'],
  ] : []
  return <div className="space-y-5">
    {observations.length > 0 && <details className="group rounded-lg border border-amber-900/80 bg-amber-950/30 text-xs text-amber-200">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">▸</span>
        <span className="font-semibold">Observaciones de los archivos</span>
        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 tabular-nums" aria-label={`${observations.length} observaciones`}>{observations.length}</span>
        {provisional && <span className="text-amber-300/80">· Avance provisional</span>}
        <span aria-hidden="true" className="ml-auto text-amber-200/60 group-open:hidden">Ver detalle</span>
        <span aria-hidden="true" className="ml-auto hidden text-amber-200/60 group-open:inline">Ocultar</span>
      </summary>
      <ul className="mx-3 mb-3 list-disc space-y-1 border-t border-amber-900/60 pt-2 pl-5 leading-relaxed">{observations.map((warning) => <li key={warning}>{warning}</li>)}</ul>
    </details>}
    {errors.map((error) => <p key={error} role="alert" className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-200">{error}</p>)}
    {summary && <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(([title, value, color]) => <div key={title} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{title}</p><p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p></div>)}</div>
      <p className="text-xs text-slate-400">Corte: {dateText(comparison.cut)} · Ponderación común: {summary.hours.toLocaleString('es-AR')} h presupuestadas de LB en actividades coincidentes · {summary.added} altas / {summary.removed} bajas.</p>
      <Curvas comparison={comparison} />
      <details className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <summary className="cursor-pointer text-sm font-semibold">Cambios de fecha de fin ({comparison.rows.length})</summary>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-slate-400"><tr><th className="p-2">Actividad</th><th className="p-2">Fin LB</th><th className="p-2">Fin vigente / real</th><th className="p-2">Días calendario</th></tr></thead>
          <tbody>{comparison.rows.map((row) => <tr key={row.id} className="border-t border-slate-800"><td className="p-2"><span className="text-slate-400">{row.id}</span> · {row.name}</td><td className="whitespace-nowrap p-2">{dateText(row.baseFinish)}</td><td className="whitespace-nowrap p-2">{dateText(row.currentFinish)}</td><td className={`p-2 ${row.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{row.delta > 0 ? '+' : ''}{row.delta}</td></tr>)}</tbody>
        </table>{comparison.rows.length === 0 && <p className="mt-3 text-slate-400">Sin cambios de fecha de fin entre las actividades coincidentes.</p>}</div>
      </details>
    </>}
  </div>
}
