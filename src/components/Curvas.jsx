import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts'
import { dateText } from '../utils/dates'

const percent = (value) => value == null ? '—' : `${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`

export default function Curvas({ comparison }) {
  const { curve, wbs, cut, provisional } = comparison
  return <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
    <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5 xl:col-span-2">
      <h3 className="text-lg font-semibold">Curvas S · Línea base y vigente</h3>
      <p className="mt-1 text-xs text-slate-400">Acumulado ponderado por horas de LB · {dateText(curve[0].time)} al {dateText(curve.at(-1).time)}</p>
      <div className="mt-5 h-96 w-full" aria-label="Curva de línea base en azul, cronograma vigente en ámbar y avance informado al corte en verde">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curve} margin={{ top: 20, right: 20, left: 0, bottom: 10 }} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(value) => dateText(value, true)} tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={30} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 11 }} width={48} />
            <Tooltip labelFormatter={(value) => dateText(value)} formatter={(value, name) => [percent(value), name]} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: 8 }} labelStyle={{ color: '#f8fafc' }} />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            {cut !== null && <ReferenceLine x={cut} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Corte ${dateText(cut, true)}`, fill: '#cbd5e1', fontSize: 11, position: 'insideTopRight' }} />}
            <Line type="linear" dataKey="planificado" name="LB · plan por fechas" stroke="#38bdf8" strokeWidth={3} dot={false} isAnimationActive={false} />
            <Line type="linear" dataKey="vigente" name="Vigente · distribución por fechas" stroke="#fbbf24" strokeWidth={3} strokeDasharray="7 4" dot={false} isAnimationActive={false} />
            <Line dataKey="real" name={provisional ? 'Informado al corte · provisional' : 'Informado al corte'} stroke="#4ade80" strokeWidth={0} connectNulls={false} dot={{ r: 6, fill: '#4ade80', stroke: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 8 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-400">Las curvas distribuyen uniformemente las horas de LB entre el inicio y fin de cada archivo, sobre tiempo calendario. Son estimaciones por fechas; no reproducen calendarios ni perfiles de recursos de P6. El punto verde usa el avance informado del vigente. Para una curva histórica real se necesitan cortes anteriores.</p>
      <details className="mt-4 text-xs text-slate-400"><summary className="cursor-pointer">Ver valores de las curvas</summary><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-right"><thead><tr><th className="p-2 text-left">Fecha</th><th className="p-2">LB</th><th className="p-2">Vigente</th><th className="p-2">Informado{provisional ? '*' : ''}</th></tr></thead><tbody>{curve.map((row) => <tr key={row.time} className="border-t border-slate-800"><td className="p-2 text-left">{dateText(row.time)}</td><td className="p-2">{percent(row.planificado)}</td><td className="p-2">{percent(row.vigente)}</td><td className="p-2">{percent(row.real)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-lg font-semibold">Comparación por WBS</h3>
      <p className="mt-1 text-xs text-slate-400">Nivel 3 de LB · Valores al corte{provisional ? ' · Informado provisional (*)' : ''}</p>
      <div className="mt-4 max-h-[540px] overflow-auto"><table className="w-full text-right text-xs">
        <thead className="text-slate-400"><tr><th className="pb-3 pr-3 text-left">WBS / Horas LB</th><th className="p-1 text-sky-400">LB</th><th className="p-1 text-amber-400">Vigente</th><th className="p-1 text-emerald-400">Informado{provisional ? '*' : ''}</th></tr></thead>
        <tbody>{wbs.map((row) => <tr key={row.key} className="border-t border-slate-800"><td className="py-3 pr-3 text-left text-slate-300">{row.wbs}<span className="mt-1 block text-slate-500">{row.hours.toLocaleString('es-AR')} h</span></td><td className="p-1">{percent(row.plan)}</td><td className="p-1">{percent(row.current)}</td><td className="p-1 font-medium text-emerald-400">{percent(row.actual)}</td></tr>)}</tbody>
      </table></div>
    </section>
  </div>
}
