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

function cambiarRol(rutaHtml) {
    if (rutaHtml) window.location.href = rutaHtml;
}

// ==========================================
// MÓDULO DE SEGURIDAD Y LOGIN
// ==========================================
const usuariosPrueba = {
    "lau@bold.co": { rol: "solicitante", url: "solicitante.html", nombre: "Laura (Solicitante)" },
    "mar@bold.co": { rol: "validador", url: "validador.html", nombre: "María (Validador)" },
    "kat@bold.co": { rol: "aprobador", url: "aprobador.html", nombre: "Kate (Aprobador)" },
    "fel@bold.co": { rol: "preparador", url: "preparador.html", nombre: "Felipe (Preparador)" }
};

function iniciarSesion() {
    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');

    if (usuariosPrueba[email] && pass === "12") {
        const usuario = usuariosPrueba[email];
        sessionStorage.setItem('usuarioLogueado', JSON.stringify(usuario)); // Guardar sesión
        window.location.href = usuario.url; // Redirigir a su pantalla
    } else {
        errorMsg.style.display = 'block';
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuarioLogueado');
    window.location.href = "index.html";
}

// ==========================================
// VALIDACIÓN AUTOMÁTICA DE ROLES EN PANTALLAS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const rutaActual = window.location.pathname;
    
    // Si NO estamos en la página de login (index.html), aplicar seguridad
    if (!rutaActual.endsWith('index.html') && !rutaActual.endsWith('/')) {
        
        const dataUsuario = sessionStorage.getItem('usuarioLogueado');
        
        // 1. Si intenta entrar sin login, expulsarlo al index
        if (!dataUsuario) {
            window.location.href = "index.html";
            return;
        }

        const usuario = JSON.parse(dataUsuario);

        // 2. Transformar la barra superior (Quitar selector de roles, poner nombre)
        const topbarDerecha = document.querySelector('.topbar-derecha');
        if (topbarDerecha) {
            topbarDerecha.innerHTML = `
                <span style="font-size: 14px; font-weight: bold; color: #0b1442; margin-right: 15px;">👋 Hola, ${usuario.nombre}</span>
                <button onclick="cerrarSesion()" style="background: white; border: 1px solid #ef4444; color: #ef4444; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Cerrar Sesión</button>
            `;
        }

        // 3. Ocultar del menú lateral las opciones que NO son de su rol
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const enlace = item.getAttribute('href');
            if (usuario.rol === 'solicitante' && !enlace.includes('solicitante') && !enlace.includes('historial')) item.style.display = 'none';
            if (usuario.rol === 'validador' && !enlace.includes('validador')) item.style.display = 'none';
            if (usuario.rol === 'aprobador' && !enlace.includes('aprobador')) item.style.display = 'none';
            if (usuario.rol === 'preparador' && !enlace.includes('preparador')) item.style.display = 'none';
        });

        // 4. Ocultar los títulos de categorías del menú que quedaron vacíos
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
