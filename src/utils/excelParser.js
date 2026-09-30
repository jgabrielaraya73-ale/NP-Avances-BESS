import * as XLSX from 'xlsx';

const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (val === undefined || val === null || val === '') return 0;
  const cleanStr = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  if (cleanStr === '') return 0;
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

// Clasificador dinámico: toma directamente el nombre de la tarea en la Columna D
const classifyFamily = (taskName) => {
  if (!taskName) return 'Otras Tareas';
  return taskName.trim();
};

export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let targetSheetName = workbook.SheetNames.find(
          (name) => name.trim().toLowerCase() === 'avancejga'
        );
        if (!targetSheetName) targetSheetName = workbook.SheetNames[0];

        const targetSheet = workbook.Sheets[targetSheetName];
        const range = XLSX.utils.decode_range(targetSheet['!ref'] || 'A1:Z1000');
        const rawRows = [];

        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            const cell = targetSheet[cell_ref];
            row.push(cell ? cell.v : '');
          }
          rawRows.push(row);
        }

        const colSistema = 0;
        const colDisciplina = 1;
        const colGrupo = 2;
        const colTask = 3;
        const colObj = 4;
        const colReal = 6;

        const sistemasMap = {};
        // Se inicializa vacío para poblarse dinámicamente según las tareas del Excel
        const familiesMap = {};

        for (let i = 2; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row) continue;

          const rawSistema = row[colSistema] !== undefined ? String(row[colSistema]).trim() : '';
          const rawDisciplina = row[colDisciplina] !== undefined ? String(row[colDisciplina]).trim() : '';
          const rawGrupo = row[colGrupo] !== undefined ? String(row[colGrupo]).trim() : '';
          const rawTask = row[colTask] !== undefined ? String(row[colTask]).trim() : '';

          if (!rawSistema || rawSistema.toLowerCase() === 'sistema') continue;

          const sistemaName = rawSistema;
          const disciplinaName = rawDisciplina ? rawDisciplina.toUpperCase() : 'GENERAL';
          const grupoName = rawGrupo || disciplinaName;
          const taskName = rawTask || grupoName;

          const obj = parseNumber(row[colObj]);
          const real = parseNumber(row[colReal]);

          // Asignación y suma dinámica por tipo de Tarea
          const family = classifyFamily(taskName);
          if (!familiesMap[family]) {
            familiesMap[family] = { objetivo: 0, ejecutado: 0 };
          }
          familiesMap[family].objetivo += obj;
          familiesMap[family].ejecutado += real;

          if (!sistemasMap[sistemaName]) {
            sistemasMap[sistemaName] = { sistemaName, disciplinasMap: {} };
          }

          if (!sistemasMap[sistemaName].disciplinasMap[disciplinaName]) {
            sistemasMap[sistemaName].disciplinasMap[disciplinaName] = { disciplinaName, gruposMap: {} };
          }

          if (!sistemasMap[sistemaName].disciplinasMap[disciplinaName].gruposMap[grupoName]) {
            sistemasMap[sistemaName].disciplinasMap[disciplinaName].gruposMap[grupoName] = { grupoName, tasks: [] };
          }

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

        // Formato dinámico para las tarjetas superiores
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

        resolve({ families, sistemas });
      } catch (error) {
        console.error('Error procesando Excel:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};