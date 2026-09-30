import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Header from './components/Header';
import ChartData from './components/ChartData';

/* ============================================
   LÓGICA DE PROCESAMIENTO Y PARSEO DE EXCEL
   ============================================ */
const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (val === undefined || val === null || val === '') return 0;
  const cleanStr = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  if (cleanStr === '') return 0;
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

const classifyFamily = (taskName) => {
  const name = taskName.toLowerCase().trim();

  // Evaluamos Armado de Puntas únicamente
  if (name.includes('armado') || name.includes('puntas') || name.includes('punta')) {
    if (name.includes('dc')) return 'Armado puntas DC';
    if (name.includes('mt') || name.includes('media')) return 'Armado Puntas MT';
    return 'Armado puntas AC';
  }

  if (name.includes('tendido') || name.includes('cable')) {
    if (name.includes('mt') || name.includes('media')) return 'Tendido Cable MT';
    return 'Tendido Cable BT';
  }

  if (name.includes('fundacion') || name.includes('civil') || name.includes('hormigon')) {
    return 'Fundaciones / Obras Civiles';
  }

  if (name.includes('montaje') || name.includes('equipo') || name.includes('bess') || name.includes('pcs') || name.includes('sts')) {
    return 'Montaje de Equipos';
  }

  return 'Otras Tareas';
};

const parseArrayBuffer = (buffer) => {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  let targetSheetName = workbook.SheetNames.find(
    (name) => name.trim().toLowerCase() === 'avancejga'
  );
  if (!targetSheetName) targetSheetName = workbook.SheetNames[0];

  const targetSheet = workbook.Sheets[targetSheetName];
  const rawRows = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: '' });

  const colSistema = 0, colDisciplina = 1, colGrupo = 2, colTask = 3, colObj = 4, colReal = 6;
  const sistemasMap = {};
  const familiesMap = {
    'Fundaciones / Obras Civiles': { objetivo: 0, ejecutado: 0 },
    'Montaje de Equipos': { objetivo: 0, ejecutado: 0 },
    'Armado puntas DC': { objetivo: 0, ejecutado: 0 },
    'Armado puntas AC': { objetivo: 0, ejecutado: 0 },
    'Armado Puntas MT': { objetivo: 0, ejecutado: 0 },
    'Tendido Cable BT': { objetivo: 0, ejecutado: 0 },
    'Tendido Cable MT': { objetivo: 0, ejecutado: 0 }
  };

  let currentSistema = '';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rawSistema = row[colSistema] !== undefined ? String(row[colSistema]).trim() : '';
    const rawDisciplina = row[colDisciplina] !== undefined ? String(row[colDisciplina]).trim() : '';
    const rawGrupo = row[colGrupo] !== undefined ? String(row[colGrupo]).trim() : '';
    const rawTask = row[colTask] !== undefined ? String(row[colTask]).trim() : '';

    if (rawSistema && rawSistema.toLowerCase() !== 'sistema' && rawSistema.toLowerCase() !== 'sistema / tag') {
      currentSistema = rawSistema;
    }

    if (!currentSistema) continue;

    const obj = parseNumber(row[colObj]);
    const real = parseNumber(row[colReal]);

    if (obj === 0 && real === 0 && !rawTask) continue;

    const sistemaName = currentSistema;
    const disciplinaName = rawDisciplina ? rawDisciplina.toUpperCase() : 'GENERAL';
    const grupoName = rawGrupo || disciplinaName;
    const taskName = rawTask || grupoName;

    const family = classifyFamily(taskName);
    if (!familiesMap[family]) familiesMap[family] = { objetivo: 0, ejecutado: 0 };
    familiesMap[family].objetivo += obj;
    familiesMap[family].ejecutado += real;

    if (!sistemasMap[sistemaName]) sistemasMap[sistemaName] = { sistemaName, disciplinasMap: {} };
    if (!sistemasMap[sistemaName].disciplinasMap[disciplinaName]) sistemasMap[sistemaName].disciplinasMap[disciplinaName] = { disciplinaName, gruposMap: {} };
    if (!sistemasMap[sistemaName].disciplinasMap[disciplinaName].gruposMap[grupoName]) sistemasMap[sistemaName].disciplinasMap[disciplinaName].gruposMap[grupoName] = { grupoName, tasks: [] };

    sistemasMap[sistemaName].disciplinasMap[disciplinaName].gruposMap[grupoName].tasks.push({
      subtarea: taskName,
      objetivo: obj,
      ejecutado: real,
      remanente: Math.max(0, obj - real)
    });
  }

  const sistemas = Object.values(sistemasMap).map((sis) => {
    const disciplinas = Object.values(sis.disciplinasMap).map((disc) => {
      const grupos = Object.values(disc.gruposMap).map((grp) => {
        const grpObj = grp.tasks.reduce((acc, t) => acc + t.objetivo, 0);
        const grpEjec = grp.tasks.reduce((acc, t) => acc + t.ejecutado, 0);
        const grpRem = Math.max(0, grpObj - grpEjec);
        const grpPorc = grpObj > 0 ? (grpEjec / grpObj) * 100 : 0;
        return {
          groupName: grp.grupoName,
          objetivoTotal: parseFloat(grpObj.toFixed(2)),
          ejecutadoTotal: parseFloat(grpEjec.toFixed(2)),
          remanenteTotal: parseFloat(grpRem.toFixed(2)),
          porcentajeTotal: parseFloat(Math.min(100, grpPorc).toFixed(1)),
          subtareas: grp.tasks
        };
      });

      const discObj = grupos.reduce((acc, g) => acc + g.objetivoTotal, 0);
      const discEjec = grupos.reduce((acc, g) => acc + g.ejecutadoTotal, 0);
      const discRem = Math.max(0, discObj - discEjec);
      const discPorc = discObj > 0 ? (discEjec / discObj) * 100 : 0;
      return {
        disciplinaName: disc.disciplinaName,
        objetivoTotal: parseFloat(discObj.toFixed(2)),
        ejecutadoTotal: parseFloat(discEjec.toFixed(2)),
        remanenteTotal: parseFloat(discRem.toFixed(2)),
        porcentajeTotal: parseFloat(Math.min(100, discPorc).toFixed(1)),
        grupos
      };
    });

    const sisObj = disciplinas.reduce((acc, d) => acc + d.objetivoTotal, 0);
    const sisEjec = disciplinas.reduce((acc, d) => acc + d.ejecutadoTotal, 0);
    const sisRem = Math.max(0, sisObj - sisEjec);
    const sisPorc = sisObj > 0 ? (sisEjec / sisObj) * 100 : 0;
    return {
      sistemaName: sis.sistemaName,
      objetivoTotal: parseFloat(sisObj.toFixed(2)),
      ejecutadoTotal: parseFloat(sisEjec.toFixed(2)),
      remanenteTotal: parseFloat(sisRem.toFixed(2)),
      porcentajeTotal: parseFloat(Math.min(100, sisPorc).toFixed(1)),
      disciplinas
    };
  });

  const families = Object.keys(familiesMap).map((key) => {
    const obj = familiesMap[key].objetivo;
    const ejec = familiesMap[key].ejecutado;
    const porc = obj > 0 ? (ejec / obj) * 100 : 0;
    return {
      familyName: key,
      objetivo: parseFloat(obj.toFixed(2)),
      ejecutado: parseFloat(ejec.toFixed(2)),
      remanente: parseFloat(Math.max(0, obj - ejec).toFixed(2)),
      porcentaje: parseFloat(Math.min(100, porc).toFixed(1))
    };
  });

  return { families, sistemas };
};

export default function App() {
  const [excelData, setExcelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchDefaultExcel = async () => {
      try {
        setLoading(true);
        const response = await fetch(`./Computos-NP-CC.xlsx?v=${Date.now()}`);

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const parsed = parseArrayBuffer(buffer);
        setExcelData(parsed);
        setErrorMsg(null);
      } catch (err) {
        console.error('Error al leer el Excel:', err);
        setErrorMsg('Error al cargar la información del Excel. Revisa que el archivo exista en la carpeta public.');
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultExcel();
  }, []);

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        <div className="flex justify-between items-center bg-[#101935]/80 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs text-slate-400">
            {loading ? (
              <span className="text-amber-400 font-bold animate-pulse">Cargando datos actualizados del proyecto...</span>
            ) : excelData ? (
              <span className="text-emerald-400 font-bold">● Sincronizado automáticamente desde Computos-NP-CC.xlsx</span>
            ) : (
              <span className="text-red-400">{errorMsg}</span>
            )}
          </div>
        </div>

        {excelData && <ChartData families={excelData.families} sistemas={excelData.sistemas} />}
      </main>
    </div>
  );
}