import * as XLSX from 'xlsx';

const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (val === undefined || val === null || val === '') return 0;
  const cleanStr = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  if (cleanStr === '') return 0;
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // 1. Buscar prioritariamente la hoja 'AvanceJGA'
        let targetSheetName = workbook.SheetNames.find(
          (name) => name.trim().toLowerCase() === 'avancejga'
        );

        if (!targetSheetName) {
          targetSheetName = workbook.SheetNames.find(
            (name) => name.toLowerCase().includes('avance') || name.toLowerCase().includes('jga')
          );
        }

        if (!targetSheetName) targetSheetName = workbook.SheetNames[0];

        const targetSheet = workbook.Sheets[targetSheetName];
        const rawData = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: '', blankrows: false });

        if (!rawData || rawData.length === 0) {
          throw new Error(`La hoja "${targetSheetName}" está vacía.`);
        }

        // 2. Extraer Metadatos (Header general)
        let headerInfo = {
          contrato: 'N/A',
          proyecto: 'Proyecto BESS - CENTRAL COSTANERA',
          contratista: 'N/A',
          cliente: 'N/A',
          nroReporte: 'N/A',
          ubicacion: 'N/A',
        };

        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const rowStr = rawData[i].map((c) => String(c).toUpperCase()).join(' ');
          if (rowStr.includes('PROYECTO:')) headerInfo.proyecto = rawData[i][2] || rawData[i][3] || headerInfo.proyecto;
          if (rowStr.includes('CONTRATO:')) headerInfo.contrato = rawData[i][2] || rawData[i][3] || 'N/A';
        }

        // 3. Detectar la fila de encabezados de la tabla (donde están los títulos de columnas)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const rowStr = rawData[i].map((c) => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('objetivo') || rowStr.includes('ejecutado') || rowStr.includes('avance')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) headerRowIndex = 1; // Fila por defecto si no hay títulos explícitos

        // Encontrar índices de columnas dinámicamente según la fila de encabezados
        const headerRow = rawData[headerRowIndex].map((c) => String(c).toLowerCase().trim());
        
        let colGroup = 1; // Columna B por defecto (Nivel 1)
        let colTask = 2;  // Columna C por defecto (Nivel 2 / Tarea)
        let colObj = -1;
        let colReal = -1;

        headerRow.forEach((title, idx) => {
          if (title.includes('objetivo') || title.includes('plan') || title.includes('contractual')) colObj = idx;
          if (title.includes('ejecutado') || title.includes('real') || title.includes('avance real')) colReal = idx;
          if (title.includes('grupo') || title.includes('categoria') || title.includes('nivel 1')) colGroup = idx;
          if (title.includes('tarea') || title.includes('subcategoria') || title.includes('descripcion')) colTask = idx;
        });

        // Posiciones de respaldo si no se hallaron por nombre
        if (colObj === -1) colObj = headerRow.length - 3 >= 0 ? headerRow.length - 3 : 5;
        if (colReal === -1) colReal = headerRow.length - 2 >= 0 ? headerRow.length - 2 : 6;

        // 4. Agrupamiento totalmente dinámico según la Columna B (Nivel 1)
        const categoriesMap = {};

        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;

          const groupName = row[colGroup] !== undefined && row[colGroup] !== null ? String(row[colGroup]).trim() : '';
          const taskName = row[colTask] !== undefined && row[colTask] !== null ? String(row[colTask]).trim() : '';

          // Ignorar filas totalmente vacías
          if (!groupName && !taskName) continue;

          const currentGroup = groupName || 'OTRAS ACTIVIDADES';
          const currentTask = taskName || currentGroup;

          if (!categoriesMap[currentGroup]) {
            categoriesMap[currentGroup] = {
              name: currentGroup,
              tasksMap: {}
            };
          }

          const rawObj = parseNumber(row[colObj]);
          const rawReal = parseNumber(row[colReal]);

          if (!categoriesMap[currentGroup].tasksMap[currentTask]) {
            categoriesMap[currentGroup].tasksMap[currentTask] = {
              tarea: currentTask,
              objetivo: 0,
              ejecutado: 0
            };
          }

          categoriesMap[currentGroup].tasksMap[currentTask].objetivo += rawObj;
          categoriesMap[currentGroup].tasksMap[currentTask].ejecutado += rawReal;
        }

        // 5. Mapeo final para el Dashboard (Totales, Porcentajes y Remanentes)
        const categories = Object.values(categoriesMap)
          .map((cat) => {
            const taskList = Object.values(cat.tasksMap).map((t) => {
              const remanente = Math.max(0, t.objetivo - t.ejecutado);
              const porcentaje = t.objetivo > 0 ? (t.ejecutado / t.objetivo) * 100 : 0;
              return {
                tarea: t.tarea,
                objetivoTotal: parseFloat(t.objetivo.toFixed(2)),
                ejecutadoTotal: parseFloat(t.ejecutado.toFixed(2)),
                remanente: parseFloat(remanente.toFixed(2)),
                porcentajeAvance: parseFloat(Math.min(100, porcentaje).toFixed(1)),
              };
            });

            const catObj = taskList.reduce((acc, t) => acc + t.objetivoTotal, 0);
            const catEjec = taskList.reduce((acc, t) => acc + t.ejecutadoTotal, 0);
            const catRem = Math.max(0, catObj - catEjec);
            const catPorc = catObj > 0 ? (catEjec / catObj) * 100 : 0;

            return {
              categoryName: cat.name,
              objetivoTotal: parseFloat(catObj.toFixed(2)),
              ejecutadoTotal: parseFloat(catEjec.toFixed(2)),
              remanenteTotal: parseFloat(catRem.toFixed(2)),
              porcentajeAvance: parseFloat(Math.min(100, catPorc).toFixed(1)),
              tasks: taskList
            };
          })
          .filter((c) => c.tasks.length > 0);

        resolve({ headerInfo, categories });
      } catch (error) {
        console.error('Error procesando Excel AvanceJGA:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};