// ==========================================
// REGLAS DE SEGURIDAD Y CONTROL DE ACCESO BOLD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos el nombre del archivo actual (ej. solicitante.html)
    const rutaActual = window.location.pathname.split('/').pop() || 'index.html';

    // 1. Si NO estamos en el Login, activamos el Guardia de Seguridad
    if (rutaActual !== 'index.html' && rutaActual !== '') {
        
        const dataUsuario = sessionStorage.getItem('usuarioLogueado');
        
        // REGLA A: Si intentan entrar sin iniciar sesión, expulsarlos al Login
        if (!dataUsuario) {
            window.location.href = "index.html";
            return;
        }

        const usuario = JSON.parse(dataUsuario);

        // REGLA B: Definir estrictamente a qué pantallas tiene acceso cada rol
        const permisos = {
            "solicitante": ["solicitante.html", "historial.html"],
            "validador": ["validador.html"],
            "aprobador": ["aprobador.html"],
            "preparador": ["preparador.html"]
        };

        const paginasPermitidas = permisos[usuario.rol];

        // REGLA C: Si la URL actual no está en su lista de permisos, bloquear y expulsar
        if (!paginasPermitidas.includes(rutaActual)) {
            alert("⛔ Acceso denegado. Tu rol de " + usuario.rol.toUpperCase() + " no tiene permisos para ver esta pantalla.");
            window.location.href = paginasPermitidas[0]; // Lo enviamos a su vista principal
            return;
        }

        // REGLA D: Adaptar la interfaz visual (Barra superior)
        const topbarDerecha = document.querySelector('.topbar-derecha');
        if (topbarDerecha) {
            topbarDerecha.innerHTML = `
                <span style="font-size: 14px; font-weight: bold; color: #0b1442; margin-right: 15px;">👋 Hola, ${usuario.nombre}</span>
                <button onclick="cerrarSesion()" style="background: white; border: 1px solid #ef4444; color: #ef4444; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; transition: 0.2s;">Cerrar Sesión</button>
            `;
        }

        // REGLA E: Ocultar los enlaces del menú lateral prohibidos
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const enlace = item.getAttribute('href');
            if (enlace && !paginasPermitidas.includes(enlace)) {
                item.style.display = 'none'; // Desaparece el botón
            }
        });

        // REGLA F: Ocultar los subtítulos del menú si quedaron vacíos
        document.querySelectorAll('.menu-categoria').forEach(cat => {
            let elementoSiguiente = cat.nextElementSibling;
            let tieneLinksVisibles = false;
            
            while (elementoSiguiente && !elementoSiguiente.classList.contains('menu-categoria')) {
                if (elementoSiguiente.style.display !== 'none') tieneLinksVisibles = true;
                elementoSiguiente = elementoSiguiente.nextElementSibling;
            }
            if (!tieneLinksVisibles) cat.style.display = 'none';
        });
    }
});

// Función para el botón de salir
function cerrarSesion() {
    sessionStorage.removeItem('usuarioLogueado');
    window.location.href = "index.html";
}

// ==========================================
// DATOS COMUNES DE LA PLATAFORMA (Formularios)
// ==========================================
const opcionesSubtipo = {
    "Compensación": ["Pago de compensación CUD", "Confirmación abono", "Emisión"],
    "Nómina": ["Colaboradores", "Pacto Colectivo - Cheque", "Pacto Colectivo - PSE"],
    "Proveedores": ["Ventanilla", "Locales", "Internacionales"],
    "Traslados": ["Traslados Entre Cuentas", "Traslados CUD"]
};

const opcionesCuentasOrigen = {
    "Bold CO": ["Davivienda 451770073547 Ahorros", "Bancolombia 0400000126 Ahorros"],
    "Bold CF": ["Bancolombia 04000002167 Ahorros", "Credicorp 1-1-58903-3 CCA"]
};
