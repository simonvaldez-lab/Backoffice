// ==========================================
// 1. BASE DE DATOS OPERATIVA (LOCALSTORAGE POR RADICADOS)
// ==========================================
function obtenerOperaciones() {
    let bd = localStorage.getItem('bold_operaciones_bd');
    if (!bd) {
        const iniciales = [
            {
                radicado: "RAD-2026-0891",
                empresa: "Empresa Matriz S.A.",
                tipo: "OPEX",
                solicitante: "juan.solicitante@bold.co",
                montoSol: 48500000,
                montoPrep: 45230000,
                moneda: "COP",
                registros: 14,
                ans: "2 Horas",
                estado: "En Aprobación",
                historial: [
                    { fecha: "23 Jun 2026 - 11:00 AM", paso: "1. RADICACIÓN (Solicitante)", detalle: "Documento cargado: Facturas_Junio.pdf (Monto original: $48.5M)" },
                    { fecha: "23 Jun 2026 - 11:15 AM", paso: "2. PREPARACIÓN (Mesa Control)", detalle: "Se eliminó el registro N° 5 por rebote bancario. Monto real en banco: $45,230,000 COP.", alerta: true }
                ]
            },
            {
                radicado: "RAD-2026-0892",
                empresa: "Bold CO",
                tipo: "Nómina",
                solicitante: "lau@bold.co",
                montoSol: 150000000,
                montoPrep: 150000000,
                moneda: "COP",
                registros: 45,
                ans: "4 Horas",
                estado: "Pendiente Validación",
                historial: [
                    { fecha: "24 Jun 2026 - 08:30 AM", paso: "1. RADICACIÓN (Solicitante)", detalle: "Lote de nómina quincenal cargado por Laura." }
                ]
            },
            {
                radicado: "RAD-2026-0893",
                empresa: "Bold CF",
                tipo: "Traslados",
                solicitante: "carlos@bold.co",
                montoSol: 32000000,
                montoPrep: 32000000,
                moneda: "USD",
                registros: 5,
                ans: "1 Hora",
                estado: "Listo para Banco",
                historial: [
                    { fecha: "24 Jun 2026 - 09:00 AM", paso: "1. RADICACIÓN", detalle: "Traslado internacional." },
                    { fecha: "24 Jun 2026 - 09:45 AM", paso: "2. VALIDADO COMPLIANCE", detalle: "Soportes KYC verificados por María." },
                    { fecha: "24 Jun 2026 - 10:10 AM", paso: "3. AUTORIZADO", detalle: "Aprobado por Kate (Aprobador)." }
                ]
            }
        ];
        localStorage.setItem('bold_operaciones_bd', JSON.stringify(iniciales));
        return iniciales;
    }
    return JSON.parse(bd);
}

function guardarOperaciones(lista) {
    localStorage.setItem('bold_operaciones_bd', JSON.stringify(lista));
}

// ==========================================
// 2. SEGURIDAD, PERMISOS ESTRICTOS Y USUARIO MAESTRO
// ==========================================
const usuariosPrueba = {
    "simo@bold.co": { rol: "maestro", url: "historial.html", nombre: "👑 Simon (Usuario Maestro)", correo: "simo@bold.co" },
    "lau@bold.co": { rol: "solicitante", url: "solicitante.html", nombre: "👋 Laura (Solicitante)", correo: "lau@bold.co" },
    "mar@bold.co": { rol: "validador", url: "validador.html", nombre: "👋 María (Validador)", correo: "mar@bold.co" },
    "kat@bold.co": { rol: "aprobador", url: "aprobador.html", nombre: "👋 Kate (Aprobador)", correo: "kat@bold.co" },
    "fel@bold.co": { rol: "preparador", url: "preparador.html", nombre: "👋 Felipe (Preparador)", correo: "fel@bold.co" }
};

function iniciarSesion() {
    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    if (usuariosPrueba[email] && pass === "12") {
        sessionStorage.setItem('usuarioLogueado', JSON.stringify(usuariosPrueba[email]));
        window.location.href = usuariosPrueba[email].url;
    } else if(errorMsg) { errorMsg.style.display = 'block'; }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuarioLogueado');
    window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const rutaActual = window.location.pathname.split('/').pop() || 'index.html';
    if (rutaActual !== 'index.html' && rutaActual !== '') {
        const dataUsuario = sessionStorage.getItem('usuarioLogueado');
        if (!dataUsuario) { window.location.href = "index.html"; return; }
        const usuario = JSON.parse(dataUsuario);

        const permisos = {
            "maestro": ["solicitante.html", "validador.html", "aprobador.html", "preparador.html", "historial.html"],
            "solicitante": ["solicitante.html", "historial.html"],
            "validador": ["validador.html", "historial.html"],
            "aprobador": ["aprobador.html", "historial.html"],
            "preparador": ["preparador.html", "historial.html"]
        };

        if (!permisos[usuario.rol].includes(rutaActual)) {
            alert("⛔ Acceso denegado. Tu perfil (" + usuario.rol.toUpperCase() + ") solo tiene acceso a sus funciones específicas.");
            window.location.href = permisos[usuario.rol][0];
            return;
        }

        const topbarDerecha = document.querySelector('.topbar-derecha');
        if (topbarDerecha) {
            topbarDerecha.innerHTML = `
                <span style="font-size: 13px; font-weight: bold; color: #0B1442; margin-right: 15px;">${usuario.nombre}</span>
                <button onclick="cerrarSesion()" style="background: white; border: 1px solid #EF4444; color: #EF4444; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">Salir</button>
            `;
        }

        document.querySelectorAll('.menu-item').forEach(item => {
            const enlace = item.getAttribute('href');
            if (enlace && !permisos[usuario.rol].includes(enlace)) item.style.display = 'none';
        });

        document.querySelectorAll('.menu-categoria').forEach(cat => {
            let next = cat.nextElementSibling, visible = false;
            while (next && !next.classList.contains('menu-categoria')) {
                if (next.style.display !== 'none') visible = true;
                next = next.nextElementSibling;
            }
            if (!visible) cat.style.display = 'none';
        });

        if (typeof renderizarTabla === 'function') renderizarTabla();
    }
});

// ==========================================
// 3. AUDITORÍA UNIVERSAL (EXPEDIENTE DUAL POR RADICADO)
// ==========================================
function auditarRadicado(radicado) {
    const ops = obtenerOperaciones();
    const op = ops.find(o => o.radicado === radicado);
    if (!op) return alert("No se encontró el Radicado: " + radicado);

    document.getElementById('mod-radicado-titulo').innerText = `Módulo de Auditoría de Soportes: ${op.radicado}`;
    document.getElementById('mod-origen').innerText = op.empresa;
    document.getElementById('mod-moneda').innerText = op.moneda;
    document.getElementById('mod-val-sol').innerText = `$ ${op.montoSol.toLocaleString()} ${op.moneda}`;
    document.getElementById('mod-val-prep').innerText = `Screen Banco: $ ${op.montoPrep.toLocaleString()} ${op.moneda}`;
    document.getElementById('mod-regs').innerText = `${op.registros} Transacciones`;

    const divTraza = document.getElementById('mod-timeline');
    divTraza.innerHTML = '';
    op.historial.forEach(h => {
        divTraza.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-fecha">${h.fecha}</div>
                <div class="timeline-desc" ${h.alerta ? 'style="border-left: 4px solid #D97706;"' : ''}>
                    <strong>${h.paso}</strong><br>
                    <span style="font-size:11px; color:#1E293B; display:block; margin-top:4px;">${h.detalle}</span>
                </div>
            </div>`;
    });

    document.getElementById('vis-sol-prov').innerText = op.empresa;
    document.getElementById('vis-sol-total').innerText = `$ ${op.montoSol.toLocaleString()} ${op.moneda}`;
    document.getElementById('vis-prep-total').innerText = `$ ${op.montoPrep.toLocaleString()} ${op.moneda}`;

    document.getElementById('modalDetalles').style.display = 'flex';
}

function alternarVisor() {
    const v = document.getElementById('contenedorVisor');
    v.style.display = (v.style.display === 'flex') ? 'none' : 'flex';
}

function cambiarPestana(origen) {
    document.getElementById('tabSol').classList.toggle('active', origen === 'solicitante');
    document.getElementById('tabPrep').classList.toggle('active', origen === 'preparador');
    document.getElementById('vistaSolicitante').classList.toggle('hidden', origen !== 'solicitante');
    document.getElementById('vistaPreparador').classList.toggle('hidden', origen !== 'preparador');
}

function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }
