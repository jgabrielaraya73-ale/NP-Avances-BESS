import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function PuntasMTChart({ puntasMTData }) {
  const [filterPB, setFilterPB] = useState('TODOS');

  if (!puntasMTData || !puntasMTData.powerBlocks || puntasMTData.powerBlocks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-md">
        No hay información disponible para Armado de Puntas MT.
      </div>
    );
  }

  const { powerBlocks, totalObjetivo, totalEjecutado, totalRestante, porcentajeGlobal } = puntasMTData;

  // Filtrado por Power Block
  const filteredPB = filterPB === 'TODOS'
    ? powerBlocks
    : powerBlocks.filter((pb) => pb.powerBlockName === filterPB);

  // Datos para el gráfico
  const chartData = filteredPB.map((pb) => ({
    name: pb.powerBlockName,
    Objetivo: pb.objetivoTotal,
    Ejecutado: pb.ejecutadoTotal,
    Restante: pb.restanteTotal
  }));

  // Lista plana para la tabla
  const tableRows = [];
  filteredPB.forEach((pb) => {
    pb.formaciones.forEach((f) => {
      tableRows.push({
        powerBlock: pb.powerBlockName,
        formacion: f.formacion,
        objetivo: f.objetivo,
        ejecutado: f.ejecutado,
        restante: f.restante,
        porcentaje: f.porcentaje
      });
    });
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4 text-slate-900">
      
      {/* TÍTULO PRINCIPAL */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-xl font-black text-slate-900 tracking-wide">
          Detalle de Armado Puntas MT
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Visualización analítica de avance consolidado por Power Block y Formación de Cable
        </p>
      </div>

      {/* TARJETAS ESTILO KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Objetivo */}
        <div className="bg-slate-50/80 border-l-4 border-l-blue-600 border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                OBJETIVO TOTAL
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-slate-900">{totalObjetivo}</span>
                <span className="text-xs text-slate-500 font-semibold">(100%)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full w-full"></div>
          </div>
        </div>

        {/* Card 2: Ejecutado */}
        <div className="bg-emerald-50/40 border-l-4 border-l-emerald-600 border border-emerald-100 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                EJECUTADO
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-emerald-950">{totalEjecutado}</span>
                <span className="text-xs text-emerald-700 font-bold">({porcentajeGlobal}%)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-emerald-200/60 h-1.5 rounded-full mt-2">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min(porcentajeGlobal, 100)}%` }}></div>
          </div>
        </div>

        {/* Card 3: Restante */}
        <div className="bg-amber-50/40 border-l-4 border-l-amber-500 border border-amber-100 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                RESTANTE
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-amber-950">{totalRestante}</span>
                <span className="text-xs text-amber-700 font-bold">({(100 - porcentajeGlobal).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-amber-200/60 h-1.5 rounded-full mt-2">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.max(100 - porcentajeGlobal, 0)}%` }}></div>
          </div>
        </div>

        {/* Card 4: % Avance Global */}
        <div className="bg-indigo-50/40 border-l-4 border-l-indigo-600 border border-indigo-100 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                % AVANCE GLOBAL
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-indigo-950">{porcentajeGlobal}%</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-indigo-200/60 h-1.5 rounded-full mt-2">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(porcentajeGlobal, 100)}%` }}></div>
          </div>
        </div>

      </div>

      {/* FILTROS POR POWER BLOCK */}
      <div className="flex flex-col space-y-1 pt-1">
        <span className="text-[11px] font-bold text-slate-700 uppercase">
          Filtrar Power Block:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterPB('TODOS')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filterPB === 'TODOS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            TODOS ({powerBlocks.length})
          </button>
          {powerBlocks.map((pb, idx) => (
            <button
              key={idx}
              onClick={() => setFilterPB(pb.powerBlockName)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                filterPB === pb.powerBlockName
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {pb.powerBlockName} ({pb.porcentajeAvance}%)
            </button>
          ))}
        </div>
      </div>

      {/* GRÁFICO COMPACTO */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Comparativo de Avance por Power Block
          </h3>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 65 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={true} />
              
              <XAxis
                dataKey="name"
                stroke="#000000"
                tick={{ fill: '#000000', fontSize: 9, fontWeight: 600 }}
                tickLine={true}
                interval={0}
                angle={-90}
                textAnchor="end"
                dy={5}
              />
              
              <YAxis
                stroke="#000000"
                tick={{ fill: '#000000', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{
                  paddingBottom: '10px',
                  fontSize: '11px',
                  color: '#000000',
                  fontWeight: 'bold'
                }}
              />
              
              <Bar dataKey="Objetivo" fill="#2563eb" radius={[3, 3, 0, 0]} name="Objetivo" maxBarSize={22} />
              <Bar dataKey="Ejecutado" fill="#059669" radius={[3, 3, 0, 0]} name="Ejecutado" maxBarSize={22} />
              <Bar dataKey="Restante" fill="#d97706" radius={[3, 3, 0, 0]} name="Restante" maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA DETALLADA CON COLUMNA DE ESTADO */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Detalle por Formación de Cable
          </h3>
          <span className="text-xs text-slate-600 font-bold">
            {tableRows.length} Registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Power Block</th>
                <th className="py-2.5 px-4">Formación de Cable</th>
                <th className="py-2.5 px-4 text-center">Objetivo</th>
                <th className="py-2.5 px-4 text-center">Ejecutado</th>
                <th className="py-2.5 px-4 text-center">Restante</th>
                <th className="py-2.5 px-4 text-center">% Avance</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900 bg-white">
              {tableRows.map((row, rIdx) => {
                // Configuración de estado y estilos dinámicos
                let statusLabel = 'PENDIENTE';
                let statusBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
                let dotColor = 'bg-slate-400';
                let pctBg = 'bg-slate-50 text-slate-700 border-slate-200';

                if (row.porcentaje === 100) {
                  statusLabel = 'FINALIZADO';
                  statusBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  dotColor = 'bg-emerald-500';
                  pctBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                } else if (row.porcentaje > 0) {
                  statusLabel = 'EN EJECUCIÓN';
                  statusBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                  dotColor = 'bg-amber-500';
                  pctBg = 'bg-amber-50 text-amber-800 border-amber-200';
                }

                return (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-amber-700">{row.powerBlock}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{row.formacion}</td>
                    <td className="py-2.5 px-4 text-center font-bold">{row.objetivo}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-700">{row.ejecutado}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-600">{row.restante}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${pctBg}`}>
                        {row.porcentaje}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusBadgeStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}