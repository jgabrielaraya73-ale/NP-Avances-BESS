# Comparación de curvas

## Versión portable

Ejecutar `npm run build:portable` para generar `portable/BESS.html`. Ese único archivo contiene el código, los estilos, las imágenes y las librerías de lectura XER/Excel. Puede copiarse a otra computadora y abrirse con doble clic en Chrome o Edge actualizado, sin Node.js ni servidor. La carpeta también incluye `LEEME.txt` con instrucciones.

Los cronogramas se cargan por separado desde el navegador; no están incorporados al HTML. No se conserva la selección al cerrar o recargar la página. El generador comprueba que no haya importaciones JavaScript externas, recursos de salida separados o dependencias CSS externas, y valida la sintaxis del script incorporado.

La apertura directa mediante `file://` no pudo verificarse en el navegador integrado de Codex porque su política bloquea ese tipo de URL. La versión portable debe comprobarse con doble clic en el navegador del equipo de destino.

## Uso local

Desde `bess-app - CC`, ejecutar `npm run dev -- --host 127.0.0.1` y abrir la dirección informada por Vite.

1. En **Línea base (LB)**, cargar `Crono-CeCo-PCyS-Rev0 BLjga.xer`.
2. En **Cronograma vigente**, cargar `Crono-CeCo-PCyS-Rev0-20260925.xer`.
3. Revisar las observaciones y comparar curvas, indicadores, WBS y cambios de fecha de fin.

Se puede reemplazar o quitar cada archivo por separado. Una importación fallida conserva el archivo previo y muestra un error. La carga se procesa en memoria en el navegador; al recargar la página se deben seleccionar los archivos nuevamente. Los archivos no se envían a un servicio externo.

## Qué representa cada serie

- **Azul, LB:** unidades laborales presupuestadas de LB distribuidas uniformemente entre sus fechas planificadas.
- **Ámbar, vigente:** las mismas unidades de LB distribuidas entre inicio y fin del vigente, usando fechas reales cuando existen y fechas tempranas programadas para el trabajo pendiente.
- **Verde, informado al corte:** promedio del porcentaje de cada actividad vigente, ponderado por las unidades laborales de LB. Es un punto al corte, no un historial reconstruido.

Ambas curvas por fechas son aproximaciones sobre tiempo calendario, conservando la hora de inicio y fin. No interpretan calendarios laborales, excepciones ni curvas de asignación de recursos. La curva ámbar no es una proyección anclada al avance informado; representa la distribución uniforme del cronograma vigente. Por eso puede no pasar por el punto verde. Los valores se muestrean semanalmente los viernes e incluyen el corte y los extremos del período.

El gráfico, las tarjetas y la tabla WBS usan la misma ponderación. Los hitos sin unidades no reciben horas ficticias, pero participan en el cotejo de actividades y fechas. No se fuerza un 100% en una fecha fija.

## Lectura y validaciones

- Un proyecto por XER; los códigos de actividad deben existir y ser únicos.
- Cruce por `task_code`. Las altas/bajas se enumeran y las curvas usan solo actividades coincidentes para mantener un alcance común.
- La fecha de corte procede de `PROJECT.last_recalc_date`. Si falta, se puede ingresar manualmente. El nombre del archivo no se utiliza como fecha.
- Se respeta el tipo de avance de la actividad: unidades, duración o físico. En unidades se incluyen unidades laborales y no laborales; el peso de comparación sigue siendo el presupuesto laboral de LB.
- Los porcentajes ausentes no se convierten automáticamente en cero; se omite el indicador consolidado si falta avance de una actividad con peso.
- Fechas inválidas o invertidas en actividades ponderadas impiden calcular las curvas, con un mensaje que identifica las actividades.
- Fechas reales posteriores al corte y estados inconsistentes se señalan. El valor informado conserva los datos del archivo y se marca provisional.
- Las diferencias de fin se expresan en días calendario. Un valor positivo significa fin posterior a la LB.
- WBS se agrupa según la jerarquía de LB, tomando la raíz del proyecto como nivel 1.

Con los archivos suministrados se verificaron 48 coincidencias, 2.288 h de ponderación, corte 25/09/2026 18:00, A1010 al 50%, A1180 al 95% y cinco desvíos de fin (+8, +4, +4, +3 y +3 días). El avance bruto de 21,94% es provisional por la actividad A1030, que tiene fechas reales en octubre.

## Excel

Se admite la primera hoja de `.xlsx` o `.xls`, con encabezados en la primera fila. Columnas principales: `Activity ID`, `Activity Name`, `WBS`, `Start`, `Finish`, `Budgeted Labor Units` (o `Planned Labor Units`) y `Units % Complete` (o `Activity % Complete`). Opcionales: `Actual Start`, `Actual Finish`, `Actual Labor Units`, `Remaining Labor Units`, `Data Date`.

Las fechas deben ser celdas de fecha o textos ISO (`YYYY-MM-DD HH:mm`), o `DD-MMM-YY` con mes en inglés. Los porcentajes pueden ser números de 0 a 100, texto con `%` o celdas numéricas con formato de porcentaje de Excel. Si no hay porcentaje, se calcula con unidades laborales reales y restantes cuando ambas están presentes. Las columnas se buscan por nombre completo, sin distinguir espacios, guiones bajos, puntos ni mayúsculas.

## Comprobaciones

`npm run test` ejecuta pruebas del motor, importadores, validaciones y regresión con los dos XER de la carpeta superior. La regresión se omite si esos archivos no están disponibles. `npm run build` compila la aplicación y `npm run lint` verifica el código.
