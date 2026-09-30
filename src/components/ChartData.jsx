import React, { useState } from 'react';

function ChartData({ families, sistemas }) {
  const [selectedSistema, setSelectedSistema] = useState('TODAS');
  const [selectedFamily, setSelectedFamily] = useState('TODAS');

  if (!sistemas || sistemas.length === 0) return null;

  // 1. Filtrado por Sistema
  let filteredSistemas = selectedSistema === 'TODAS'
    ? sistemas
    : sistemas.filter((s) => s.sistemaName === selectedSistema);

  // 2. Filtrado dinámico por Familia usando coincidencias (includes)
  if (selectedFamily !== 'TODAS') {
    filteredSistemas = filteredSistemas.map((sis) => ({
      ...sis,
      disciplinas: sis.disciplinas.map((disc) => ({
        ...disc,
        grupos: disc.grupos.map((grp) => ({
          ...grp,
          subtareas: grp.subtareas.filter((sub) => {
            const t = sub.subtarea.toLowerCase();
            const f = selectedFamily.toLowerCase();

            if (f.includes('fundaciones') || f.includes('obras civiles')) {
              return t.includes('fundacion') || t.includes('civil') || t.includes('hormigon');
            }
            if (f.includes('montaje')) {
              return t.includes('montaje') || t.includes('equipo') || t.includes('bess') || t.includes('pcs') || t.includes('sts');
            }
            if (f.includes('armado puntas dc')) {
              return (t.includes('armado') || t.includes('punta')) && t.includes('dc');
            }
            if (f.includes('armado puntas mt')) {
              return (t.includes('armado') || t.includes('punta')) && (t.includes('mt') || t.includes('media'));
            }
            if (f.includes('armado puntas ac')) {
              return (t.includes('armado') || t.includes('punta')) && !t.includes('dc') && !t.includes('mt') && !t.includes('media');
            }
            if (f.includes('tendido cable mt')) {
              return (t.includes('tendido') || t.includes('cable')) && (t.includes('mt') || t.includes('media'));
            }
            if (f.includes('tendido cable bt')) {
              return (t.includes('tendido') || t.includes('cable')) && !(t.includes('mt') || t.includes('media'));
            }
            return t.includes(f);
          })
        })).filter((grp) => grp.subtareas.length > 0)
      })).filter((disc) => disc.grupos.length > 0)
    })).filter((sis) => sis.disciplinas.length > 0);
  }

  return (
    <div className="space-y-8 text-slate-100 font-sans">
      
      {/* SECCIÓN SUPERIOR: TARJETAS DE FAMILIAS REAGRUPADAS */}
      {families && families.length > 0 && (
        <div className="bg-[#101935]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">
              RESUMEN GENERAL POR TAREAS PRINCIPALES
            </h3>
            {selectedFamily !== 'TODAS' && (
              <button
                onClick={() => setSelectedFamily('TODAS')}
                className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-md font-bold hover:bg-amber-500/30 transition-all"
              >
                Ver Todas las Familias ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {families.map((fam, fIdx) => {
              const isSelected = selectedFamily === fam.familyName;
              const hasNoData = fam.objetivo === 0;

              let badgeLabel = 'EN AVANCE';
              let badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

              if (hasNoData) {
                badgeLabel = 'SIN PLAN';
                badgeColor = 'bg-slate-800/80 text-slate-500 border-slate-700/50';
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
                  className={`bg-[#0b1226] border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                    hasNoData ? 'opacity-40 cursor-not-allowed border-slate-800/50' : ''
                  } ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg scale-[1.02]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block truncate" title={fam.familyName}>
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
                        style={{ width: `${Math.min(100, fam.porcentaje)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-300 pt-2 border-t border-slate-800/80 space-y-1">
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
      )}

      {/* BOTONES DE FILTRADO POR SISTEMA */}
      <div className="bg-[#101935]/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
        <span className="text-xs font-bold text-slate-300 tracking-wider uppercase block">
          Categoría Principal (Sistema):
        </span>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedSistema('TODAS')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              selectedSistema === 'TODAS'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-[#1b264f]/60 text-slate-300 hover:bg-[#25356e] border border-slate-700/60'
            }`}
          >
            TODAS
          </button>

          {sistemas.map((sis, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSistema(sis.sistemaName)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                selectedSistema === sis.sistemaName
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-[#1b264f]/60 text-slate-300 hover:bg-[#25356e] border border-slate-700/60'
              }`}
            >
              {sis.sistemaName} ({sis.porcentajeTotal}%)
            </button>
          ))}
        </div>
      </div>

      {/* DETALLE INFERIOR */}
      <div className="space-y-12">
        {filteredSistemas.map((sis, sIdx) => {
          const sisObj = sis.disciplinas.reduce(
            (accD, d) => accD + d.grupos.reduce(
              (accG, g) => accG + g.subtareas.reduce((accS, s) => accS + Number(s.objetivo || 0), 0), 0
            ), 0
          );
          const sisEjec = sis.disciplinas.reduce(
            (accD, d) => accD + d.grupos.reduce(
              (accG, g) => accG + g.subtareas.reduce((accS, s) => accS + Number(s.ejecutado || 0), 0), 0
            ), 0
          );
          const sisPorc = sisObj > 0 ? ((sisEjec / sisObj) * 100).toFixed(1) : "0.0";

          return (
            <div key={sIdx} className="space-y-6">
              
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wider">
                  {sis.sistemaName}
                </h2>
                <span className="text-sm font-bold text-slate-300 bg-[#162040] px-4 py-2 rounded-lg border border-slate-700">
                  Avance Sistema: <strong className="text-emerald-400 ml-1">{sisPorc}%</strong>
                </span>
              </div>

              {sis.disciplinas.map((disc, dIdx) => {
                const discObj = disc.grupos.reduce(
                  (accG, g) => accG + g.subtareas.reduce((accS, s) => accS + Number(s.objetivo || 0), 0), 0
                );
                const discEjec = disc.grupos.reduce(
                  (accG, g) => accG + g.subtareas.reduce((accS, s) => accS + Number(s.ejecutado || 0), 0), 0
                );
                const discPorc = discObj > 0 ? ((discEjec / discObj) * 100).toFixed(1) : "0.0";

                return (
                  <div key={dIdx} className="bg-[#101935]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h3 className="text-xl font-black text-white tracking-wide uppercase">
                        {disc.disciplinaName}
                      </h3>
                      <div className="text-sm font-semibold text-slate-300 flex items-center gap-3">
                        <span>Total: <strong className="text-white">{discObj}</strong></span>
                        <span>|</span>
                        <span>Ejecutado: <strong className="text-emerald-400">{discEjec}</strong></span>
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-md border border-emerald-500/30 font-black">
                          {discPorc}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {disc.grupos.map((grp, gIdx) => {
                        const grpObj = grp.subtareas.reduce((acc, sub) => acc + Number(sub.objetivo || 0), 0);
                        const grpEjec = grp.subtareas.reduce((acc, sub) => acc + Number(sub.ejecutado || 0), 0);
                        const grpRem = Math.max(0, grpObj - grpEjec);
                        const grpPorc = grpObj > 0 ? ((grpEjec / grpObj) * 100).toFixed(1) : "0.0";
                        const isGrpFinished = grpRem === 0 && grpObj > 0;

                        return (
                          <div key={gIdx} className="bg-[#0b1226] border border-slate-800 rounded-xl p-5 shadow-inner flex flex-col justify-between space-y-5">
                            <div>
                              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                                <h4 className="text-base font-extrabold text-slate-100 tracking-wide">{grp.groupName}</h4>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                                  isGrpFinished
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                }`}>
                                  {grpPorc}%
                                </span>
                              </div>

                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4 border border-slate-700/50">
                                <div
                                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Number(grpPorc))}%` }}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <div className="grid grid-cols-12 text-xs font-bold text-slate-400 border-b border-slate-800 pb-2 mb-2 uppercase tracking-wider">
                                  <span className="col-span-5">Tarea</span>
                                  <span className="col-span-2 text-center">Tota</span>
                                  <span className="col-span-2 text-center">Ejec</span>
                                  <span className="col-span-3 text-center">Estado</span>
                                </div>

                                {grp.subtareas.map((sub, sIdx) => {
                                  const isTaskFinished = sub.remanente === 0 && sub.objetivo > 0;

                                  return (
                                    <div key={sIdx} className="grid grid-cols-12 text-xs items-center py-1.5 border-b border-slate-800/40 text-slate-200 hover:bg-slate-800/30 rounded px-1 transition-colors">
                                      <span className="col-span-5 font-semibold truncate pr-1" title={sub.subtarea}>
                                        {sub.subtarea}
                                      </span>
                                      <span className="col-span-2 text-center text-slate-100 font-bold">{sub.objetivo}</span>
                                      <span className="col-span-2 text-center text-emerald-400 font-bold">{sub.ejecutado}</span>
                                      <span className="col-span-3 text-center">
                                        {isTaskFinished ? (
                                          <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                            Finalizado
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                            Pendiente ({sub.remanente})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid grid-cols-12 text-xs font-extrabold bg-[#131d3d]/80 py-2 px-2 rounded-lg border border-slate-800 text-slate-100 mt-2">
                              <span className="col-span-5 uppercase text-slate-400">Totales</span>
                              <span className="col-span-2 text-center text-white">{grpObj}</span>
                              <span className="col-span-2 text-center text-emerald-400">{grpEjec}</span>
                              <span className="col-span-3 text-center">
                                {isGrpFinished ? (
                                  <span className="text-emerald-400 font-black">100% OK</span>
                                ) : (
                                  <span className="text-amber-400 font-black">REM: {grpRem}</span>
                                )}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChartData;