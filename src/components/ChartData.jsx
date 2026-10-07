import React, { useState } from 'react';
import PuntasMTChart from './PuntasMTChart';

export default function ChartData({ families = [], sistemas = [], puntasMTData = null }) {
  const [selectedFamily, setSelectedFamily] = useState('Armado puntas AC');
  const [selectedSystem, setSelectedSystem] = useState('TODAS');

  const visibleFamilies = families.filter((f) => f.familyName !== 'Otras Tareas');

  const handlePrint = () => {
    window.print();
  };

  const filteredSistemas = sistemas.map((sis) => {
    const filteredDisciplinas = sis.disciplinas.map((disc) => {
      const filteredGrupos = disc.grupos.map((grp) => {
        const filteredSubtareas = grp.subtareas.filter((st) => {
          if (selectedFamily === 'TODAS') return true;
          return st.familia.toLowerCase().trim() === selectedFamily.toLowerCase().trim();
        });

        const grpObj = filteredSubtareas.reduce((acc, t) => acc + t.objetivo, 0);
        const grpEjec = filteredSubtareas.reduce((acc, t) => acc + t.ejecutado, 0);
        const grpRem = Math.max(0, grpObj - grpEjec);
        const grpPorc = grpObj > 0 ? (grpEjec / grpObj) * 100 : 0;

        return {
          ...grp,
          objetivoTotal: parseFloat(grpObj.toFixed(2)),
          ejecutadoTotal: parseFloat(grpEjec.toFixed(2)),
          remanenteTotal: parseFloat(grpRem.toFixed(2)),
          porcentajeTotal: parseFloat(Math.min(100, grpPorc).toFixed(1)),
          subtareas: filteredSubtareas
        };
      }).filter((grp) => grp.subtareas.length > 0);

      const discObj = filteredGrupos.reduce((acc, g) => acc + g.objetivoTotal, 0);
      const discEjec = filteredGrupos.reduce((acc, g) => acc + g.ejecutadoTotal, 0);
      const discRem = Math.max(0, discObj - discEjec);
      const discPorc = discObj > 0 ? (discEjec / discObj) * 100 : 0;

      return {
        ...disc,
        objetivoTotal: parseFloat(discObj.toFixed(2)),
        ejecutadoTotal: parseFloat(discEjec.toFixed(2)),
        remanenteTotal: parseFloat(discRem.toFixed(2)),
        porcentajeTotal: parseFloat(Math.min(100, discPorc).toFixed(1)),
        grupos: filteredGrupos
      };
    }).filter((disc) => disc.grupos.length > 0);

    const sisObj = filteredDisciplinas.reduce((acc, d) => acc + d.objetivoTotal, 0);
    const sisEjec = filteredDisciplinas.reduce((acc, d) => acc + d.ejecutadoTotal, 0);
    const sisRem = Math.max(0, sisObj - sisEjec);
    const sisPorc = sisObj > 0 ? (sisEjec / sisObj) * 100 : 0;

    return {
      ...sis,
      objetivoTotal: parseFloat(sisObj.toFixed(2)),
      ejecutadoTotal: parseFloat(sisEjec.toFixed(2)),
      remanenteTotal: parseFloat(sisRem.toFixed(2)),
      porcentajeTotal: parseFloat(Math.min(100, sisPorc).toFixed(1)),
      disciplinas: filteredDisciplinas
    };
  }).filter((sis) => {
    if (selectedSystem !== 'TODAS' && sis.sistemaName !== selectedSystem) {
      return false;
    }
    return sis.disciplinas.length > 0;
  });

  return (
    <div className="space-y-8">
      {/* Estilos CSS especiales para la impresión a PDF */}
      <style>{`
        @media print {
          /* Oculta botones de interacción y barras de filtro en el PDF */
          .no-print {
            display: none !important;
          }
          /* Ajusta contenedores para que encajen perfectamente en hoja impresa */
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* ---------------- TARJETAS SUPERIORES DE FAMILIAS ---------------- */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase">
            Resumen General por Tareas Principales
          </h2>
          
          {/* Grupo de botones a la derecha */}
          <div className="flex items-center gap-3 no-print">
            <button
              onClick={handlePrint}
              className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg hover:bg-emerald-500/20 hover:scale-105 transition-all duration-200 font-bold flex items-center gap-1.5 shadow-sm"
              title="Descargar o imprimir reporte gerencial en PDF"
            >
              <svg 
                className="w-3.5 h-3.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar Reporte para CP
            </button>

            {selectedFamily !== 'TODAS' && (
              <button
                onClick={() => setSelectedFamily('TODAS')}
                className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 hover:scale-105 transition-all duration-200 font-semibold"
              >
                Ver Todo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {visibleFamilies.map((fam, fIdx) => {
            const isSelected = selectedFamily === fam.familyName;
            const isPuntasMT = fam.familyName === 'Armado Puntas MT';
            const hasNoData = (fam.objetivo === 0 || !fam.objetivo) && !isPuntasMT;

            let badgeLabel = 'EN AVANCE';
            let badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

            if (hasNoData) {
              badgeLabel = 'SIN PLAN';
              badgeColor = 'bg-slate-800 text-slate-500 border-slate-700';
            } else if (fam.porcentaje === 100) {
              badgeLabel = '100% OK';
              badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            } else if (fam.porcentaje === 0) {
              badgeLabel = 'PENDIENTE';
              badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            }

            return (
              <div
                key={fIdx}
                onClick={() => !hasNoData && setSelectedFamily(isSelected ? 'TODAS' : fam.familyName)}
                className={`bg-[#0b1226] border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all duration-300 ease-out cursor-pointer ${
                  hasNoData
                    ? 'opacity-40 cursor-not-allowed border-slate-800/50'
                    : 'hover:-translate-y-1.5 hover:scale-[1.03] hover:border-amber-400/80 hover:shadow-lg hover:shadow-amber-500/20'
                } ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10 scale-[1.03] -translate-y-1'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block truncate" title={fam.familyName}>
                    {fam.familyName}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-white">{fam.porcentaje}%</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-700/40">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, fam.porcentaje || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-300 pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">OBJ:</span>
                    <span className="text-slate-100 font-bold">{fam.objetivo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">EJEC:</span>
                    <span className="text-emerald-400 font-bold">{fam.ejecutado}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- VISTA DETALLADA POR SISTEMAS Y POWER BLOCKS ---------------- */}
      {selectedFamily === 'Armado Puntas MT' ? (
        <PuntasMTChart puntasMTData={puntasMTData} />
      ) : (
        <div className="space-y-6">
          {/* BARRA DE FILTROS POR SISTEMA (SE OCULTA EN EL PDF) */}
          <div className="bg-[#FAF8F5]/80 backdrop-blur-md border border-amber-900/10 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3 no-print">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Categoría Principal (Sistema):
            </span>
            <button
              onClick={() => setSelectedSystem('TODAS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 transform active:scale-95 ${
                selectedSystem === 'TODAS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white text-slate-700 hover:bg-amber-50/50 border border-slate-300 hover:border-amber-400/50'
              }`}
            >
              TODAS
            </button>
            {sistemas.map((sis, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSystem(sis.sistemaName)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 transform active:scale-95 ${
                  selectedSystem === sis.sistemaName
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white text-slate-700 hover:bg-amber-50/50 border border-slate-300 hover:border-amber-400/50'
                }`}
              >
                {sis.sistemaName.toUpperCase()} ({sis.porcentajeTotal}%)
              </button>
            ))}
          </div>

          {/* LISTADO DE SISTEMAS DETALLADOS */}
          {filteredSistemas.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-amber-900/10 rounded-2xl p-10 text-center text-slate-600 text-sm font-medium">
              No hay tareas registradas para la familia seleccionada ({selectedFamily}).
            </div>
          ) : (
            filteredSistemas.map((sis, sIdx) => (
              <div key={sIdx} className="space-y-4 print-break-inside-avoid">
                {/* Título del Sistema */}
                <div className="flex justify-between items-center bg-[#FAF8F5] border border-amber-900/10 rounded-xl px-6 py-4 shadow-sm">
                  <h2 className="text-xl font-black text-amber-700 tracking-wide uppercase">
                    {sis.sistemaName}
                  </h2>
                  <div className="bg-white border border-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                    Avance Sistema: <span className="text-emerald-600 font-extrabold text-sm ml-1">{sis.porcentajeTotal}%</span>
                  </div>
                </div>

                {/* Disciplinas dentro del sistema */}
                {sis.disciplinas.map((disc, dIdx) => (
                  <div key={dIdx} className="bg-[#FAF8F5] border border-amber-900/10 rounded-2xl p-6 shadow-md space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-300/70 pb-3">
                      <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">
                        {disc.disciplinaName}
                      </h3>
                      <div className="text-xs text-slate-700 font-semibold space-x-3">
                        <span>Total: <strong className="text-slate-900">{disc.objetivoTotal}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Ejecutado: <strong className="text-emerald-700">{disc.ejecutadoTotal}</strong></span>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-300 font-bold ml-2 shadow-sm">
                          {disc.porcentajeTotal}%
                        </span>
                      </div>
                    </div>

                    {/* Grilla de Tarjetas por Power Block / Grupo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {disc.grupos.map((grp, gIdx) => (
                        <div 
                          key={gIdx} 
                          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-xl hover:border-amber-400/60 hover:-translate-y-1 transition-all duration-300 ease-out group print-break-inside-avoid"
                        >
                          <div>
                            {/* Header Tarjeta */}
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100/80 rounded-lg text-amber-700 border border-amber-200/60 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors duration-200">
                                  <svg 
                                    className="w-4 h-4" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth="2.5"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      d="M2.25 18L9 11.25l4.306 4.307a.5.5 0 00.71 0l8.234-8.234M21 7.5V12M21 7.5H16.5" 
                                    />
                                  </svg>
                                </div>
                                <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                                  {grp.groupName}
                                </span>
                              </div>
                              <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded shadow-xs">
                                {grp.porcentajeTotal}%
                              </span>
                            </div>

                            {/* Barra de progreso */}
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 mb-3">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                                style={{ width: `${Math.min(100, grp.porcentajeTotal)}%` }}
                              />
                            </div>

                            {/* Tabla de Subtareas */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px] text-left text-slate-800">
                                <thead>
                                  <tr className="text-[10px] text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                                    <th className="pb-1.5 font-bold w-2/5">TAREA</th>
                                    <th className="pb-1.5 text-center font-bold w-1/5">TOTA</th>
                                    <th className="pb-1.5 text-center font-bold w-1/5">EJEC</th>
                                    <th className="pb-1.5 text-right font-bold w-1/5">ESTADO</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {grp.subtareas.map((st, sIdx2) => {
                                    const isDone = st.ejecutado >= st.objetivo && st.objetivo > 0;
                                    const rem = Math.max(0, st.objetivo - st.ejecutado);
                                    return (
                                      <tr key={sIdx2} className="hover:bg-amber-50/60 transition-colors duration-150">
                                        <td className="py-2 pr-2 text-slate-800 font-semibold truncate max-w-[110px]" title={st.subtarea}>
                                          {st.subtarea}
                                        </td>
                                        <td className="py-2 text-center text-slate-900 font-bold">{st.objetivo}</td>
                                        <td className="py-2 text-center text-emerald-600 font-extrabold">{st.ejecutado}</td>
                                        <td className="py-2 text-right">
                                          {isDone ? (
                                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-extrabold inline-block shadow-xs">
                                              FINALIZADO
                                            </span>
                                          ) : (
                                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-extrabold inline-block shadow-xs">
                                              PENDIENTE ({rem})
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* RECUADRO DE TOTALES */}
                          <div className="bg-[#EFECE6] border border-slate-300/80 rounded-xl p-3 mt-2 shadow-inner group-hover:border-slate-400/60 transition-colors">
                            <div className="grid grid-cols-5 items-center text-xs">
                              <span className="col-span-2 text-slate-900 font-black uppercase text-[11px] tracking-wider">
                                TOTALES
                              </span>
                              <span className="text-center text-slate-900 text-sm font-black">
                                {grp.objetivoTotal}
                              </span>
                              <span className="text-center text-emerald-700 text-sm font-black">
                                {grp.ejecutadoTotal}
                              </span>
                              <span className="text-right text-red-700 text-xs font-black truncate">
                                REM: {grp.remanenteTotal}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}