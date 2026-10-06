import logo from '../assets/CPSA.png'
import fondo1 from '../assets/dron.JPG'
// import fondo2 from '../assets/fondo2.jpg'   // 👈 descomentá si tenés una segunda imagen

const obtenerFechaActual = () => {
  const hoy = new Date()
  const dia = String(hoy.getDate()).padStart(2, '0')
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const anio = hoy.getFullYear()
  return `${dia}/${mes}/${anio}`
}

/* ============================================
   🎨 PANEL DE CONFIGURACIÓN DEL HEADER
   ============================================ */
const CONFIG = {
  // --- Logo ---
  logoAlto: 60,
  logoAncho: 170,
  logoZoom: 1,
  logoFondo: true,
  logoColorFondo: '#ffffff',
  logoBordeRedondeado: 8,

  // --- Título ---
  tituloTexto: 'Proyecto BESS - NUEVO PUERTO Rev 01',
  tituloTamaño: 24,
  tituloColor: '#ffffff',

  // --- Subtítulo ---
  subtituloTexto: 'Seguimiento de avances generales en obra',
  subtituloTamaño: 16,
  subtituloColor: '#f1f5f9',

  // --- Fecha ---
  fechaTexto: obtenerFechaActual(),
  fechaTamaño: 14,
  fechaColor: '#38bdf8',

  // --- Presentador ---
  presentadorTexto: 'Presentado por: JGA',
  presentadorTamaño: 13,
  presentadorColor: '#f1f5f9',

  // --- Fondo del header ---
  headerColorFondo: '#0f172a', 
  headerColorBorde: '#334155',

  // --- Imagen de fondo ---
  headerImagenes: [fondo1],
  headerImagenOpacidad: 0.95, // Reducimos un poco la opacidad para mejorar contraste
  headerImagenPosicion: 'center',

  // --- Configuración de Legibilidad Profesional ---
  usarOverlayOscuro: false, // Agrega capa semitransparente sobre la imagen
  sombraTexto: '0px 2px 4px rgba(0, 0, 0, 0.95), 0px 0px 8px rgba(0, 0, 0, 0.57)', // Sombra doble muy legible
}
/* ============================================ */

function Header() {
  const tieneImagenes = CONFIG.headerImagenes && CONFIG.headerImagenes.length > 0

  return (
    <header
      style={{
        backgroundColor: CONFIG.headerColorFondo,
        borderBottom: `1px solid ${CONFIG.headerColorBorde}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      className="px-6 py-4 flex items-center justify-between shadow-lg"
    >
      {/* Capa de imagen(es) de fondo */}
      {tieneImagenes && (
        <div
          className="absolute inset-0 flex"
          style={{ opacity: CONFIG.headerImagenOpacidad }}
        >
          {CONFIG.headerImagenes.map((img, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: CONFIG.headerImagenPosicion,
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
        </div>
      )}

      {/* Capa Overlay Oscura para Garantizar Legibilidad */}
      {CONFIG.usarOverlayOscuro && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0.85) 100%)'
          }}
        />
      )}

      {/* Contenido Izquierdo: Logo, Título y Subtítulo */}
      <div className="flex items-center gap-3 relative z-10">
        <div
          style={{
            backgroundColor: CONFIG.logoFondo ? CONFIG.logoColorFondo : 'transparent',
            borderRadius: `${CONFIG.logoBordeRedondeado}px`,
            width: `${CONFIG.logoAncho}px`,
            height: `${CONFIG.logoAlto}px`,
            overflow: 'hidden',
          }}
          className="flex items-center justify-center shadow-md flex-shrink-0"
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${CONFIG.logoZoom})`,
            }}
          />
        </div>
        <div>
          <h1
            style={{ 
              fontSize: `${CONFIG.tituloTamaño}px`, 
              color: CONFIG.tituloColor,
              textShadow: CONFIG.sombraTexto 
            }}
            className="font-bold leading-tight tracking-wide"
          >
            {CONFIG.tituloTexto}
          </h1>
          <p 
            style={{ 
              fontSize: `${CONFIG.subtituloTamaño}px`, 
              color: CONFIG.subtituloColor,
              textShadow: CONFIG.sombraTexto 
            }}
            className="font-medium mt-0.5"
          >
            {CONFIG.subtituloTexto}
          </p>
        </div>
      </div>

      {/* Contenido Derecho: Fecha y Presentador */}
      <div className="relative z-10 text-right flex flex-col justify-center">
        <p
          style={{ 
            fontSize: `${CONFIG.fechaTamaño}px`, 
            color: CONFIG.fechaColor,
            textShadow: CONFIG.sombraTexto 
          }}
          className="font-bold leading-tight"
        >
          {CONFIG.fechaTexto}
        </p>
        <p
          style={{ 
            fontSize: `${CONFIG.presentadorTamaño}px`, 
            color: CONFIG.presentadorColor,
            textShadow: CONFIG.sombraTexto 
          }}
          className="mt-1 font-medium"
        >
          {CONFIG.presentadorTexto}
        </p>
      </div>
    </header>
  )
}

export default Header