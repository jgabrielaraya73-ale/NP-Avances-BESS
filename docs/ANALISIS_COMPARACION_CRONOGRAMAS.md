# Análisis de comparación de cronogramas BESS — Central Costanera

Fecha del análisis: 24/09/2026.

Actualización posterior: se implementó la carga independiente de LB y vigente, comparación por código, curvas por fechas, avance al corte y alertas. Este informe conserva el diagnóstico previo; para el comportamiento implementado consultar `METODOLOGIA_CURVAS.md`.

## Alcance y conclusión

Se revisó el código de la aplicación, se ejecutaron compilación y lint y se analizaron directamente ambos XER. No se modificó el código funcional ni los archivos de Primavera. Este documento describe el estado actual y la implementación necesaria; la comparación todavía no está incorporada a la interfaz.

La comparación es viable: los archivos comparten 48 códigos de actividad únicos. La aplicación React/Vite puede conservarse, pero el modelo de datos y los cálculos deben separar explícitamente línea base, programación vigente y avance informado al corte.

Archivos indicados por el usuario:

- Línea base: `D:\ChatGPT\BESS\Crono-CeCo-PCyS-Rev0 BLjga.xer`.
- Vigente: `D:\ChatGPT\BESS\Crono-CeCo-PCyS-Rev0-20260925.xer`.

## Inventario contrastado

| Dato | Línea base | Vigente |
|---|---|---|
| Nombre interno del proyecto | Crono-CeCo-PCyS-Rev0-3 | Crono-CeCo-PCyS-Rev0-2 |
| ID interno del proyecto | 5105 | 5053 |
| Fecha de corte (`last_recalc_date`) | 19/08/2026 18:00 | 25/09/2026 18:00 |
| Inicio del proyecto | 19/08/2026 | 19/08/2026 |
| Fin programado del proyecto | 18/12/2026 18:00 | 18/12/2026 18:00 |
| Registros TASK | 48 | 48 |
| Actividades de trabajo / hitos | 29 / 19 | 29 / 19 |
| Nodos WBS, incluida la raíz | 24 | 24 |
| Relaciones de precedencia | 52 | 52 |
| Asignaciones de recursos | 31 | 31 |
| Unidades laborales presupuestadas (`target_work_qty`) | 2.288 h | 2.288 h |
| Completadas / en curso / sin iniciar, incluidos hitos | 0 / 0 / 48 | 5 / 2 / 41 |

Los 48 `task_code` coinciden, sin duplicados, altas ni bajas. Ninguno conserva el mismo `task_id`, por lo que el cruce entre archivos debe realizarse por código dentro del par de proyectos seleccionado. Los IDs internos sirven para resolver relaciones dentro de cada XER.

Las 52 relaciones coinciden al normalizar actividad, predecesora, tipo y desfase. Tampoco cambian las unidades presupuestadas por actividad. Las fechas `target_*` y `early_*` coinciden en la línea base analizada.

Todos los recursos declarados son laborales. Las 48 actividades utilizan el calendario 7046, con jornada semanal de siete días y ocho horas diarias, repartidas entre 08:00–12:00 y 14:00–18:00. El archivo también contiene excepciones de calendario y otro calendario de recursos; una implementación general debe interpretarlos.

## Desviaciones de fechas encontradas

Se compararon las fechas de la línea base con las reales del vigente cuando existen y con las tempranas programadas cuando la actividad no ha terminado. Las diferencias siguientes son días calendario, no días hábiles.

| Código | Actividad resumida | Fin línea base | Fin vigente | Desviación |
|---|---|---|---|---|
| A1180 | Comisionamiento en frío de celdas — 3HF | 19/09/2026 | 27/09/2026, previsto | +8 días |
| A1010 | Precomisionamiento en frío PCS | 05/10/2026 | 09/10/2026, previsto | +4 días |
| A1020 | Comisionamiento de potencia STS | 13/10/2026 | 17/10/2026, previsto | +4 días |
| A1000 | Precomisionamiento de contenedores BESS | 20/09/2026 | 23/09/2026, real | +3 días |
| A1270 | Comisionamiento de contenedores BESS — CATL | 30/10/2026 | 02/11/2026, previsto | +3 días |

Las otras 43 actividades/hitos conservan su fecha de fin bajo este criterio. A1020 también desplaza su inicio cuatro días y A1270 tres días; las otras 46 fechas de inicio coinciden.

El hito A1600, Operación Comercial (COD), permanece el 18/12/2026. Esto describe el programa exportado: no demuestra por sí solo ausencia de riesgos o que los retrasos futuros no puedan afectar esa fecha.

## Inconsistencia del archivo vigente

A1030, «Comisionamiento de cables de MT (ensayos VLF)», tiene estado completado, inicio real 13/10/2026 y fin real 22/10/2026, ambos posteriores al corte 25/09/2026. Registra 80 unidades laborales reales y cero restantes.

Debe aclararse o corregirse en el origen antes de presentar un avance consolidado validado al corte. La aplicación debería mostrar la anomalía y su impacto, conservando los datos originales. No corresponde sustituir fechas o cambiar estados silenciosamente.

Los archivos se exportaron el 23/09/2026, aunque el vigente usa corte 25/09/2026. Además, la raíz WBS vigente termina en `20260925-TEST`. Estos datos ayudan a identificar la versión y su contexto; por sí solos no prueban que el archivo elegido sea incorrecto.

## Fallas reproducidas en la aplicación

### Prioridad alta: no existe una comparación entre dos archivos

`src/App.jsx:8` mantiene un solo arreglo `datosTareas`. Cargar otro archivo reemplaza el anterior. Los gráficos reciben ese único conjunto. No hay unión por actividad, desviaciones, control de alcance ni distinción entre roles de los archivos.

### Prioridad alta: fecha de corte mal leída

`src/utils/xerParser.js:38` busca `last_recalculate_date`, pero los XER contienen `last_recalc_date`. El fallback toma `scd_end_date`: el parser devuelve 18/12/2026 como corte del vigente, en lugar de 25/09/2026. La fecha fija en el cálculo del gráfico oculta parcialmente el problema.

### Prioridad alta: porcentaje de avance incorrecto

`src/utils/xerParser.js:96` busca `unit_complete_pct`, columna ausente en estos archivos, y después utiliza `phys_complete_pct`. Sin embargo, todas las actividades tienen `complete_pct_type = CP_Units`.

Para estos datos, que no tienen unidades de equipos, el porcentaje por unidades se obtiene mediante `100 × act_work_qty / (act_work_qty + remain_work_qty)`. El comportamiento corresponde a la definición de [Oracle P6, Activity % Complete y Units % Complete](https://docs.oracle.com/cd/G18294_01/p6help/en/47261.htm). No debe confundirse este indicador con avance físico medido en campo.

| Actividad | Reales | Restantes | Avance por unidades | Parser actual |
|---|---|---|---|---|
| A1010 | 144 | 144 | 50% | 0% |
| A1180 | 24 | 1,2631578947 | 95% | 100% |

Una implementación general debe respetar el tipo de porcentaje: unidades, duración o físico. Los hitos sin unidades requieren tratamiento por estado y fechas, con control de consistencia.

### Prioridad alta: se confunden fechas planificadas del vigente con línea base

`src/utils/xerParser.js:81` llama `blStart` y `blFinish` a las fechas `target_*` del archivo cargado. Cargar el vigente no obtiene las fechas del archivo BLjga.

Ejemplo A1010: el parser del vigente entrega 18/09–19/10 como supuesta línea base. La línea base externa indica 04/09–05/10 y el vigente tiene inicio real 04/09 y fin previsto 09/10. Son conceptos diferentes y deben guardarse en campos separados.

### Prioridad alta: la curva histórica real no está sustentada

`src/utils/chartData.js:109` asigna a cada corte posterior al inicio real el porcentaje del último archivo. No reconstruye cuánto se había ejecutado en cada semana. Al ejecutar las funciones existentes con el vigente, el 21/08 ya aparece un 11,18% real, incorporando el avance final de actividades que se completan después.

Los XER analizados no contienen una serie de cierres semanales ni tablas de unidades reales por período suficientes para reconstruir ese historial. Con estos archivos se puede mostrar el avance informado al corte, sujeto a las validaciones señaladas. Una curva histórica real requiere cortes adicionales o datos por período; una reconstrucción estimada debe identificarse expresamente como estimación.

### Prioridad media: ponderaciones y fechas artificiales

En `src/utils/chartData.js:39` se fijan inicio, fin y corte. En la línea 52 se asigna peso a actividades sin horas, incluyendo una unidad ficticia a cada hito. En la línea 99 se fuerza el último punto planificado a 100%, incluso si las fechas no lo justificaran.

La tabla WBS, en cambio, descarta registros sin horas. Por tanto, curva y tabla no usan la misma población ponderada. Los hitos deben conservarse como indicadores de fechas y cumplimiento, sin inventarles horas laborales.

El prorrateo actual usa tiempo calendario y descarta la hora de las fechas. Para la curva planificada conviene distribuir las unidades de línea base por horas laborables y documentar el supuesto de distribución uniforme; no debe prometerse igualdad con un perfil de recursos de P6 sin validar curvas y reglas de distribución.

### Otras observaciones

- El parser suma asignaciones sin verificar el tipo de recurso. En estos XER todos son laborales, por lo que no altera el total; con futuros archivos podría mezclar unidades incompatibles.
- WBS se agrupa solo por nombre del tercer nodo; es mejor conservar la ruta y la identidad dentro de cada archivo, evitando colisiones y declarando que la raíz del proyecto cuenta como nivel 1.
- El importador Excel tiene un corte fijo al 21/09/2026 y selección de columnas por coincidencia parcial. Requiere un contrato explícito de columnas si se mantiene como entrada equivalente al XER.
- `Header.jsx` importa `dron.jpg`, pero el archivo se llama `dron.JPG`. Funciona en este Windows; la diferencia de mayúsculas puede fallar al desplegar en un sistema sensible a ellas.
- README conserva el texto de la plantilla y no explica metodología, carga de archivos o validaciones.

## Criterio de comparación propuesto

1. Cargar y conservar dos objetos independientes: línea base y vigente, con archivo, proyecto, corte, actividades, WBS, recursos, relaciones y calendarios.
2. Validar estructura, proyectos múltiples, códigos duplicados, referencias y fechas antes de calcular. Mostrar altas y bajas si aparecen en próximos cortes.
3. Vincular actividades por `task_code` en el par seleccionado. Conservar el registro original de cada lado.
4. Mostrar inicio/fin de línea base, inicio/fin real o previsto del vigente, estado, avance por el tipo configurado y desviaciones en días calendario. Para días laborables, declarar qué calendario se usa.
5. Usar como ponderación fija las unidades laborales presupuestadas del archivo de línea base. Separar las horas consumidas del avance ponderado y de las unidades restantes.
6. Incorporar curva planificada de línea base, avance disponible al corte y proyección del trabajo pendiente. Esta última debe identificarse como proyección y partir del avance al corte; el historial real exige más información.
7. Mostrar por WBS plan al corte, avance informado, diferencia en puntos porcentuales y actividades/hitos con desvíos.
8. Incorporar una tabla filtrable de actividades, seguimiento de hitos y alertas de calidad, especialmente fechas reales posteriores al corte.

Con esta ponderación, el promedio bruto de avance por unidades del vigente sería `502 / 2.288 = 21,94%`. Incluye las 80 unidades ganadas asociadas a A1030 y, por ello, no se presenta como avance validado al 25/09. Es una comprobación aritmética de los registros, no una corrección del origen ni un indicador oficial de P6. El método y la anomalía deben quedar visibles antes de utilizar indicadores consolidados.

## Validación técnica realizada

- `npm run build`: aprobado. Advertencia por JavaScript de aproximadamente 928 kB sin comprimir; no bloquea la compilación.
- `npm run lint`: aprobado, con cinco advertencias sobre escapes innecesarios.
- Ejecución directa del parser y de las funciones de gráficos con el XER vigente: reproducidos el corte incorrecto, los porcentajes incorrectos y la curva histórica artificial.
- Contraste independiente de los archivos: verificados códigos, estados, fechas, unidades, calendarios y relaciones normalizadas.
- No se realizó una prueba visual de la interfaz en navegador. La compilación y la ejecución de funciones no sustituyen esa comprobación.

Para la implementación, las primeras verificaciones de aceptación deben exigir 48 coincidencias, cero altas/bajas en este par, corte 25/09/2026 18:00, A1010 al 50%, A1180 al 95%, los cinco desvíos de fin de la tabla, COD sin cambio y alerta explícita para A1030. Cambiar el corte o el plazo no debe requerir editar el código.
