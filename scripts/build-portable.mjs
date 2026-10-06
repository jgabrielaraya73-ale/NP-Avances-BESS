import { build } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Script } from 'node:vm'

const root = fileURLToPath(new URL('../', import.meta.url))
const result = await build({
  root,
  configFile: path.join(root, 'vite.config.js'),
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    write: false,
    sourcemap: false,
    minify: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    lib: { entry: path.join(root, 'src/main.jsx'), name: 'BessPortable', formats: ['iife'] },
    rolldownOptions: { output: { codeSplitting: false } },
  },
})

const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output)
const chunks = outputs.filter((item) => item.type === 'chunk')
const assets = outputs.filter((item) => item.type === 'asset')
// Rolldown can retain a self-reference in dynamicImports after inlining.
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.some((name) => name !== chunks[0].fileName) || /\bimport\s*\(/.test(chunks[0].code)) {
  throw new Error('La versión portable debe contener un único bloque JavaScript sin importaciones externas.')
}
if (assets.some((asset) => !asset.fileName.endsWith('.css'))) {
  throw new Error('Hay recursos que no se incorporaron al HTML portable.')
}
const css = assets.map((asset) => String(asset.source)).join('\n')
if (/url\(\s*['"]?(?!data:|#)/i.test(css)) throw new Error('Hay referencias CSS a archivos externos.')
if (/@import\b/i.test(css)) throw new Error('Hay importaciones CSS externas.')
// A classic-script syntax check catches accidental module-only output.
new Script(chunks[0].code, { filename: 'BESS.portable.js' })
const jsBase64 = Buffer.from(chunks[0].code, 'utf8').toString('base64')
const favicon = (await readFile(path.join(root, 'public/favicon.svg'))).toString('base64')
// Decode into an inline classic script. Base64 prevents bundled strings from
// terminating the HTML script element and preserves arbitrary Unicode verbatim.
const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Comparación portable de cronogramas BESS — Central Costanera">
  <title>BESS — Comparación de cronogramas</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${favicon}">
  <style>${css.replace(/<\/style/gi, '<\\/style')}</style>
</head>
<body>
  <div id="root"></div>
  <noscript>Habilitá JavaScript en el navegador para abrir la aplicación BESS.</noscript>
  <script>
    (() => {
      const script = document.createElement('script');
      script.textContent = new TextDecoder().decode(Uint8Array.from(atob('${jsBase64}'), char => char.charCodeAt(0)));
      document.body.appendChild(script);
    })();
  </script>
</body>
</html>
`

const destination = path.join(root, 'portable')
await mkdir(destination, { recursive: true })
await writeFile(path.join(destination, 'BESS.html'), html, 'utf8')
await writeFile(path.join(destination, 'LEEME.txt'), `BESS — Central Costanera\n\n1. Copiá BESS.html a la computadora donde lo quieras utilizar.\n2. Abrilo con doble clic en un navegador actualizado (Chrome o Edge).\n3. Cargá la línea base y el cronograma vigente en sus respectivos campos.\n\nNo requiere instalación, Node.js, conexión a internet ni servidor local.\nLas imágenes y librerías están incluidas. Los archivos XER/Excel se seleccionan por separado y se procesan en el navegador.\nAl cerrar o recargar la página se deben volver a cargar los cronogramas.\n\nLas curvas son distribuciones uniformes por fechas. El punto verde representa el avance informado al corte; revisá las observaciones de calidad de los datos.\n\nPara regenerar el HTML desde el proyecto: npm run build:portable\n`, 'utf8')
console.log(`Portable: ${path.join(destination, 'BESS.html')} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`)
