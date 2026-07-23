// ==========================================
// 🚀 MOTOR FIREBASE: CONEXIÓN A FIRESTORE ("treasurybackoffice")
// ==========================================

// 👇 AQUÍ PEGAS TUS LLAVES (Reemplaza los valores entre comillas) 👇
const firebaseConfig = {
  apiKey: "AIzaSyBse--Da5Fdrso5bp9rFsUbq_uLcn61HS0",
  authDomain: "black-hulling-462522-j2.firebaseapp.com",
  projectId: "black-hulling-462522-j2",
  storageBucket: "black-hulling-462522-j2.firebasestorage.app",
  messagingSenderId: "625642864594",
  appId: "1:625642864594:web:14d656c6f0ba1f5a72d20b",
  measurementId: "G-ERCH4HEG2H"
};
// 👆 ========================================================= 👆

window.dbFirestore = null;

function iniciarMotorNube() {
    if (firebaseConfig.apiKey === "TU_API_KEY_AQUI" || firebaseConfig.apiKey.includes("xxxx")) {
        console.warn("⚠️ MODO OFFLINE: Pega tus llaves reales de Firebase en js/logica-comun.js para activar la nube en tiempo real.");
        return;
    }

    const scriptApp = document.createElement('script');
    scriptApp.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js";
    scriptApp.onload = () => {
        const scriptDb = document.createElement('script');
        scriptDb.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";
        scriptDb.onload = conectarFirestore;
        document.head.appendChild(scriptDb);
    };
    document.head.appendChild(scriptApp);
}

function conectarFirestore() {
    try {
        firebase.initializeApp(firebaseConfig);
        // CONEXIÓN ESPECÍFICA A TU BASE DE DATOS "treasurybackoffice"
        window.dbFirestore = firebase.app().firestore("treasurybackoffice");
        console.log("🟢 FIREBASE CONECTADO OK"); 
        const chivato = document.createElement("div"); 
        chivato.style = "position:fixed; bottom:10px; right:10px; background:#15803D; color:white; padding:8px 15px; border-radius:20px; font-size:12px; font-weight:bold; z-index:99999; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"; 
        chivato.innerText = "🟢 Nube Firebase: CONECTADA (treasurybackoffice)"; 
        document.body.appendChild(chivato);

        // 1. ESCUCHADOR EN TIEMPO REAL: OPERACIONES
        window.dbFirestore.collection("operaciones").onSnapshot(snapshot => {
            if (snapshot.empty) {
                // Subir datos iniciales la primera vez que se conecta
                const locales = JSON.parse(localStorage.getItem('bold_operaciones_bd') || '[]');
                locales.forEach(op => window.dbFirestore.collection("operaciones").doc(op.radicado).set(op));
            } else {
                const opsNube = [];
                snapshot.forEach(doc => opsNube.push(doc.data()));
                localStorage.setItem('bold_operaciones_bd', JSON.stringify(opsNube));
                if (typeof renderizarTabla === 'function') renderizarTabla();
            }
        });

        // 2. ESCUCHADOR EN TIEMPO REAL: NOTIFICACIONES
        window.dbFirestore.collection("notificaciones").orderBy("id", "desc").limit(30).onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const notifsNube = [];
                snapshot.forEach(doc => notifsNube.push(doc.data()));
                localStorage.setItem('bold_notificaciones_bd', JSON.stringify(notifsNube));
                if (typeof renderizarNotificacionesUI === 'function') renderizarNotificacionesUI();
            }
        });

    } catch (e) {
        console.error("❌ Error Firebase:", e); 
        alert("🚨 ERROR DE FIREBASE: " + e.message);
    }
}

iniciarMotorNube();



// ==========================================
// 0. GENERADORES DE FECHA Y HORA MILITAR (24H)
// ==========================================
function obtenerHoraMilitar() {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function obtenerFechaHoraMilitar() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-CO');
    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${fecha} - ${hora}`;
}

function obtenerFechaISO(fechaObj = new Date()) {
    const yyyy = fechaObj.getFullYear();
    const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ==========================================
// 1. SEMÁFORO DE COLORES PARA ESTADOS
// ==========================================
function obtenerBadgeEstado(estado) {
    let bg = "#FEF3C7", color = "#92400E", border = "#FDE68A";
    if (estado.includes("Aprobación") || estado.includes("Aprobado") || estado.includes("Listo") || estado.includes("Dispersado") || estado.includes("Autorizado") || estado.includes("Pagada")) {
        bg = "#DCFCE7"; color = "#15803D"; border = "#BBF7D0";
    } else if (estado.includes("Rechazado") || estado.includes("Devuelto")) {
        bg = "#FEE2E2"; color = "#991B1B"; border = "#FECACA";
    }
    return `<span class="badge" style="background:${bg}; color:${color}; border:1px solid ${border}; font-weight:800; padding: 5px 10px;">${estado}</span>`;
}

// ==========================================
// 2. MOTOR DE FILTRADO POR FECHA
// ==========================================
function coincideFechaFiltro(op) {
    const el = document.getElementById('filtro-fecha');
    if (!el || !el.value) return true;
    if (op.fechaISO && op.fechaISO === el.value) return true;
    const partes = el.value.split('-');
    if (partes.length === 3 && op.fechaRadicacion) {
        const fPartes = op.fechaRadicacion.split('/');
        if (fPartes.length === 3) {
            return parseInt(partes[2], 10) === parseInt(fPartes[0], 10) &&
                   parseInt(partes[1], 10) === parseInt(fPartes[1], 10) &&
                   partes[0] === fPartes[2];
        }
    }
    return false;
}

function limpiarFiltroFecha() {
    const el = document.getElementById('filtro-fecha');
    if (el) el.value = '';
    if (typeof renderizarTabla === 'function') renderizarTabla();
}

// ==========================================
// 3. BASE DE DATOS OPERATIVA BI-NACIONAL
// ==========================================
function obtenerOperaciones() {
    let bd = localStorage.getItem('bold_operaciones_bd');
    const hoy = new Date().toLocaleDateString('es-CO');
    const hoyISO = obtenerFechaISO();
    
    if (!bd) {
        const iniciales = [
            {
                radicado: "TRAS-22/07-26-0003", pais: "Colombia", empresa: "Bold CO", compDestino: "Bold CO",
                tipo: "Traslados entre cuentas", detalle: "Bancolombia", 
                ctaOrigen: "Bold. CO: Bancolombia 04000000126 Ahorros COP - Co SAS Payouts", ctaDestino: "Bold. CO: Bancolombia 04000029802 Ahorros COP - Co SAS Main Treasury",
                solicitante: "lau@bold.co", montoSol: 85000000, montoPrep: 85000000, moneda: "COP",
                registros: 1, ans: "1 Hora", estado: "Pendiente Validación", prioridad: 1, fechaRadicacion: hoy, fechaISO: hoyISO, apartadaPor: null,
                enTransito: true, comprobanteCerrado: false,
                historial: [{ fecha: hoy + " - 08:30", paso: "1. RADICACIÓN", detalle: "Traslado urgente de fondos (Prioridad 1 - Alta). Registro histórico #0003." }]
            },
            {
                radicado: "TRAS-22/07-26-0002", pais: "Colombia", empresa: "Bold CF", compDestino: "Bold CO",
                tipo: "Traslados CUD", detalle: "Adelanto adquirencia doméstica",
                ctaOrigen: "Bold CF: BanRep - 62108160 CUD COP", ctaDestino: "Bold. CO: Bold CF 170011844070 PO´S ACH - QR Agregador",
                solicitante: "lau@bold.co", montoSol: 15000000, montoPrep: 15000000, moneda: "COP",
                registros: 1, ans: "4 Horas", estado: "Pendiente Validación", prioridad: 3, fechaRadicacion: hoy, fechaISO: hoyISO, apartadaPor: null,
                enTransito: true, comprobanteCerrado: false,
                historial: [{ fecha: hoy + " - 09:15", paso: "1. RADICACIÓN", detalle: "Adelanto adquirencia doméstica (Prioridad 3 - Baja). Registro histórico #0002." }]
            },
            {
                radicado: "OPEX-20/06-26-0001", pais: "Colombia", empresa: "Empresa Matriz S.A.", compDestino: "Bold CO",
                tipo: "OPEX", detalle: "Facturación Mensual",
                solicitante: "juan.solicitante@bold.co", montoSol: 48500000, montoPrep: 45230000, moneda: "COP",
                registros: 14, ans: "2 Horas", estado: "Pagada (Comprobante Cerrado)", prioridad: 2, fechaRadicacion: "20/06/2026", fechaISO: "2026-06-20", apartadaPor: null,
                enTransito: false, comprobanteCerrado: true,
                historial: [{ fecha: "20/06/2026 - 14:20", paso: "4. DISPERSIÓN BANCARIA COMPLETE", detalle: "Documento cargado y pagado en banco. Comprobante cerrado." }]
            }
        ];
        localStorage.setItem('bold_operaciones_bd', JSON.stringify(iniciales));
        return iniciales;
    }
    
    const ops = JSON.parse(bd);
    let modificado = false;
    ops.forEach((o, i) => {
        if (!o.prioridad) { o.prioridad = (i % 3) + 1; modificado = true; }
        if (!o.fechaRadicacion) { o.fechaRadicacion = (o.historial && o.historial[0]) ? o.historial[0].fecha.split(' - ')[0] : hoy; modificado = true; }
        if (!o.fechaISO) { o.fechaISO = hoyISO; modificado = true; }
        if (typeof o.apartadaPor === 'undefined') { o.apartadaPor = null; modificado = true; }
        if (typeof o.enTransito === 'undefined') {
            const cerrada = o.estado.includes("Pagada") || o.estado.includes("Dispersado") || o.estado.includes("Rechazado");
            o.enTransito = !cerrada; o.comprobanteCerrado = cerrada; modificado = true;
        }
        if (o.historial) {
            o.historial.forEach(h => {
                if (h.fecha && (h.fecha.includes('AM') || h.fecha.includes('PM'))) {
                    h.fecha = h.fecha.replace(/ AM| PM/g, ''); modificado = true;
                }
            });
        }
    });
    if (modificado) localStorage.setItem('bold_operaciones_bd', JSON.stringify(ops));
    return ops;
}

function obtenerOperacionesActivas() {
    const ops = obtenerOperaciones();
    const dataUsuario = sessionStorage.getItem('usuarioLogueado');
    if (!dataUsuario) return ops;
    const usr = JSON.parse(dataUsuario);
    return ops.filter(o => !o.pais || o.pais === usr.pais);
}

function guardarOperaciones(lista) {
    localStorage.setItem('bold_operaciones_bd', JSON.stringify(lista));
}

// ==========================================
// 4. MOTOR DE NOTIFICACIONES (CON REGLA DE SILENCIO OPERATIVO)
// ==========================================
function obtenerNotificaciones() {
    let bd = localStorage.getItem('bold_notificaciones_bd');
    if (!bd) {
        const iniciales = [
            { id: 1, radicado: "SISTEMA", mensaje: "👋 Bienvenido al Módulo de Notificaciones en tiempo real.", fecha: obtenerFechaHoraMilitar(), leido: false },
            { id: 2, radicado: "REGLA", mensaje: "🔕 Las alertas se desactivan automáticamente en cuanto la operación queda Pagada o Cerrada.", fecha: obtenerFechaHoraMilitar(), leido: false }
        ];
        localStorage.setItem('bold_notificaciones_bd', JSON.stringify(iniciales));
        return iniciales;
    }
    return JSON.parse(bd);
}

function guardarNotificaciones(lista) {
    localStorage.setItem('bold_notificaciones_bd', JSON.stringify(lista));
    renderizarNotificacionesUI();
}

// REGLA MAESTRA: Solo se notifica si está en tránsito. Si está cerrada/pagada, se bloquea (salvo el mensaje final de pago).
function crearNotificacion(radicado, mensaje, esCierreFinal = false) {
    const ops = obtenerOperaciones();
    const op = ops.find(o => o.radicado === radicado);
    
    // Si la operación ya está cerrada o no está en tránsito, y NO es la alerta final de pago, BLOQUEAR NOTIFICACIÓN
    if (op && (!op.enTransito || op.comprobanteCerrado || op.estado.includes("Pagada") || op.estado.includes("Rechazado")) && !esCierreFinal) {
        console.warn(`🔕 Silencio Operativo: La notificación para el radicado ${radicado} fue ignorada porque su comprobante ya está cerrado/pagado.`);
        return;
    }

    const notifs = obtenerNotificaciones();
    notifs.unshift({
        id: Date.now(),
        radicado: radicado,
        mensaje: mensaje,
        fecha: obtenerFechaHoraMilitar(),
        leido: false
    });
    if (notifs.length > 30) notifs.pop();
    guardarNotificaciones(notifs);
}

function alternarNotificaciones() {
    const popup = document.getElementById('notif-popup');
    if (popup) {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        if (popup.style.display === 'block') renderizarNotificacionesUI();
    }
}

function marcarTodoLeido() {
    const notifs = obtenerNotificaciones();
    notifs.forEach(n => n.leido = true);
    guardarNotificaciones(notifs);
}

function renderizarNotificacionesUI() {
    const listaEl = document.getElementById('notif-lista');
    const badgeEl = document.getElementById('notif-badge');
    if (!listaEl || !badgeEl) return;

    const notifs = obtenerNotificaciones();
    const noLeidas = notifs.filter(n => !n.leido).length;

    if (noLeidas > 0) {
        badgeEl.style.display = 'inline-block';
        badgeEl.innerText = noLeidas;
    } else {
        badgeEl.style.display = 'none';
    }

    listaEl.innerHTML = '';
    if (notifs.length === 0) {
        listaEl.innerHTML = '<div style="text-align:center; padding: 20px; color:#94A3B8;">No hay notificaciones recientes.</div>';
        return;
    }

    notifs.forEach(n => {
        const bg = n.leido ? 'white' : '#EEF2FF';
        const border = n.leido ? '#E2E8F0' : '#C7D2FE';
        listaEl.innerHTML += `
            <div style="background: ${bg}; border: 1px solid ${border}; padding: 10px; border-radius: 6px; margin-bottom: 8px; position: relative;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; color: #0B1442; font-size: 11px; margin-bottom: 3px;">
                    <span>📌 ${n.radicado}</span>
                    <span style="color: #64748B; font-weight: normal;">${n.fecha.split(' - ')[1] || n.fecha}</span>
                </div>
                <div style="font-size: 11px; color: #334155; line-height: 1.4;">${n.mensaje}</div>
            </div>
        `;
    });
}

function apartarRadicado(radicado) {
    const ops = obtenerOperaciones();
    const op = ops.find(o => o.radicado === radicado);
    const usr = JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}');
    
    if (op) {
        if (!op.enTransito || op.comprobanteCerrado) {
            alert("🔕 Esta operación ya se encuentra pagada o cerrada. No se puede alterar ni generar alertas.");
            return;
        }
        if (op.apartadaPor) {
            alert(`⚠️ Esta operación ya fue apartada por: ${op.apartadaPor}.\nEstá bloqueada para evitar dispersiones duplicadas.`);
            return;
        }
        op.apartadaPor = usr.nombre || usr.correo || "Analista Preparador";
        op.historial.push({
            fecha: obtenerFechaHoraMilitar(),
            paso: "🔒 BLOQUEO ANTI-DUPLICIDAD",
            detalle: `Operación apartada y bloqueada para dispersión bancaria exclusiva por: ${op.apartadaPor}.`
        });
        guardarOperaciones(ops);
        crearNotificacion(radicado, `🔒 ¡BLOQUEO DE SEGURIDAD! El radicado ${radicado} fue apartada por ${op.apartadaPor} para dispersión CUD.`);
        alert(`🔒 Has apartado exitosamente el radicado ${radicado}.\nAhora tienes bloqueo de titularidad para dispersar sin riesgo de duplicidad.`);
        if (typeof renderizarTabla === 'function') renderizarTabla();
    }
}

// ==========================================
// 5. SEGURIDAD, PERMISOS Y TOPBAR (CON CAMPANA 🔔)
// ==========================================
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
            "preparador": ["validador.html", "preparador.html", "historial.html"]
        };

        if (!permisos[usuario.rol].includes(rutaActual)) {
            alert("⛔ Acceso denegado. Tu perfil (" + usuario.rol.toUpperCase() + ") solo tiene acceso a sus funciones específicas.");
            window.location.href = permisos[usuario.rol][0];
            return;
        }

        const topbarDerecha = document.querySelector('.topbar-derecha');
        if (topbarDerecha) {
            topbarDerecha.innerHTML = `
                <div style="position: relative; display: inline-block; margin-right: 12px;">
                    <button onclick="alternarNotificaciones()" style="background: white; border: 1px solid #CBD5E1; padding: 6px 10px; border-radius: 8px; cursor: pointer; position: relative; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        🔔 <span id="notif-badge" style="background: #EF4444; color: white; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 10px; position: absolute; top: -6px; right: -6px; display: none;">0</span>
                    </button>
                    
                    <div id="notif-popup" style="display: none; position: absolute; right: 0; top: 38px; width: 340px; background: white; border: 1px solid #CBD5E1; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; overflow: hidden; text-align: left;">
                        <div style="background: #0B1442; color: white; padding: 10px 14px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <span>🔔 Novedades en Tránsito (24h)</span>
                            <span style="font-size: 11px; background: #3730A3; padding: 3px 8px; border-radius: 4px; cursor: pointer; text-decoration: underline;" onclick="marcarTodoLeido()">✓ Marcar leídas</span>
                        </div>
                        <div id="notif-lista" style="max-height: 280px; overflow-y: auto; padding: 10px; font-size: 12px; color: #334155; background: #F8FAFC;">
                        </div>
                    </div>
                </div>
                
                <span style="background: #F1F5F9; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; color: #0B1442; border: 1px solid #CBD5E1; margin-right: 10px;">${usuario.bandera || '🌍'} ${usuario.pais || 'General'}</span>
                <span style="font-size: 13px; font-weight: bold; color: #0B1442; margin-right: 15px;">${usuario.nombre}</span>
                <button onclick="cerrarSesion()" style="background: white; border: 1px solid #EF4444; color: #EF4444; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">Salir</button>
            `;
            renderizarNotificacionesUI();
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
// 6. AUDITORÍA UNIVERSAL
// ==========================================
function auditarRadicado(radicado) {
    const ops = obtenerOperaciones();
    const op = ops.find(o => o.radicado === radicado);
    if (!op) return alert("No se encontró el Radicado: " + radicado);

    document.getElementById('mod-radicado-titulo').innerText = `Módulo de Auditoría (${op.pais || 'Colombia'}): ${op.radicado}`;
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

// ==========================================
// 7. ÁRBOL RELACIONAL CORREGIDO
// ==========================================
const arbolOperaciones = {
  "Traslados": {
    "Traslados CUD": {
      "Adelanto adquirencia doméstica": { "Bold CF": { "Bold CF: BanRep - 62108160 CUD COP": { "Bold CO": ["Bold. CO: Bold CF 170011844070 PO´S ACH - QR Agregador", "Bold. CO: Bold CF 000008024755 Deposito COP"] } } },
      "Traslado adquirencia doméstica": {
        "Bold CF": {
          "Bold. CF: Citibank COL 0090923021 Corriente COP (link CUD)": { "Bold CO": ["Bold. CO: Citibank COL 0089550017 Corriente COP", "Bold. CO: Bold CF 170011844070 PO´S ACH - QR Agregador", "Bold. CO: Bold CF 000008024755 Deposito COP"] },
          "Bold CF: BanRep - 62108160 CUD COP": { "Bold CO": ["Bold. CO: Bold CF 170011844070 PO´S ACH - QR Agregador", "Bold. CO: Bold CF 000008024755 Deposito COP"] }
        }
      },
      "Traslado recursos": {
        "Bold CF": {
          "Bold CF: BanRep - 62108160 CUD COP": { "Bold CF": ["Bold. CF: Sebra CUD 62010707 Portafolio 25 COD 102 Bancolombia", "Bold. CF: Citibank COL 0090923021 Corriente COP (link CUD)"] },
          "Bold. CF: Citibank COL 0090923021 Corriente COP (link CUD)": { "Bold CF": ["Bold CF: BanRep - 62108160 CUD COP"] },
          "Bold. CF: Citibank COL 0090923013 Corriente COP": { "Bold CF": ["Bold CF: BanRep - 62108160 CUD COP"] },
          "Bold. CF: Bancolombia 04000002167 Ahorros COP": { "Bold CF": ["Bold CF: BanRep - 62108160 CUD COP"] }
        }
      }
    },
    "Traslados entre cuentas": {
      "Bancolombia": {
        "Bold CO": {
          "Bold. CO: Bancolombia 04000000126 Ahorros COP - Co SAS Payouts": { "Bold CO": ["Bold. CO: Bancolombia 04000029802 Ahorros COP - Co SAS Main Treasury", "Bold. CO: Bancolombia 04000005928 Ahorros COP - Co SAS Loans n Referrals", "Bold. CO: Bancolombia 04000004981 Ahorros COP - Co SAS Payroll", "Bold. CO: Bancolombia 04000000573 Ahorros COP - Co SAS mPos Testing", "Bold. CO: Bancolombia 04000001617 Ahorros COP - Co SAS Human Talent", "Bold. CO: Bancolombia 04000006579 Corriente COP", "Bold. CO: Bancolombia 65200002824 Ahorros COP"] },
          "Bold. CO: Bancolombia 04000029802 Ahorros COP - Co SAS Main Treasury": { "Bold CO": ["Bold. CO: Bancolombia 04000000126 Ahorros COP - Co SAS Payouts", "Bold. CO: Bancolombia 04000005928 Ahorros COP - Co SAS Loans n Referrals", "Bold. CO: Bancolombia 04000004981 Ahorros COP - Co SAS Payroll", "Bold. CO: Bancolombia 04000000573 Ahorros COP - Co SAS mPos Testing", "Bold. CO: Bancolombia 04000001617 Ahorros COP - Co SAS Human Talent", "Bold. CO: Bancolombia 04000006579 Corriente COP", "Bold. CO: Bancolombia 65200002824 Ahorros COP"] },
          "Bold. CO: Bancolombia 04000005928 Ahorros COP - Co SAS Loans n Referrals": { "Bold CO": ["Bold. CO: Bancolombia 04000000126 Ahorros COP - Co SAS Payouts", "Bold. CO: Bancolombia 04000029802 Ahorros COP - Co SAS Main Treasury", "Bold. CO: Bancolombia 04000004981 Ahorros COP - Co SAS Payroll", "Bold. CO: Bancolombia 04000000573 Ahorros COP - Co SAS mPos Testing", "Bold. CO: Bancolombia 04000001617 Ahorros COP - Co SAS Human Talent", "Bold. CO: Bancolombia 04000006579 Corriente COP", "Bold. CO: Bancolombia 65200002824 Ahorros COP"], "Bold CF": ["Bold. CF: Bancolombia 04000002167 Ahorros COP - Bold CF SA"] },
          "Bold. CO: Bancolombia 04000004981 Ahorros COP - Co SAS Payroll": { "Bold CO": ["Bold. CO: Bancolombia 04000000126 Ahorros COP - Co SAS Payouts", "Bold. CO: Bancolombia 04000005928 Ahorros COP - Co SAS Loans n Referrals", "Bold. CO: Bancolombia 04000000573 Ahorros COP - Co SAS mPos Testing", "Bold. CO: Bancolombia 04000001617 Ahorros COP - Co SAS Human Talent", "Bold. CO: Bancolombia 04000006579 Corriente COP", "Bold. CO: Bancolombia 65200002824 Ahorros COP"] },
          "Bold. CO: Bancolombia 04000000573 Ahorros COP - Co SAS mPos Testing": { "Bold CO": ["Bold. CO: Bancolombia 04000000126 Ahorros COP - Co SAS Payouts", "Bold. CO: Bancolombia 04000029802 Ahorros COP - Co SAS Main Treasury", "Bold. CO: Bancolombia 04000005928 Ahorros COP - Co SAS Loans n Referrals", "Bold. CO: Bancolombia 04000004981 Ahorros COP - Co SAS Payroll", "Bold. CO: Bancolombia 04000001617 Ahorros COP - Co SAS Human Talent", "Bold. CO: Bancolombia 04000006579 Corriente COP", "Bold. CO: Bancolombia 65200002824 Ahorros COP"] }
        },
        "Bold CF": { "Bold. CF: Bancolombia 04000002167 Ahorros COP": { "Bold CF": ["Bold. CF: Bancolombia 04000002167 Ahorros COP - Main"] } },
        "Bold Capital": { "Bold Capital: Bancolombia 04000009999 Ahorros COP": { "Bold Capital": ["Bold Capital: Bancolombia 04000009999 Ahorros COP - Treasury"] } }
      },
      "Citi": {
        "Bold CO": { "Bold. CO: Citibank COL 0089550017 Corriente COP": { "Bold CO": ["Bold. CO: Citibank COL 0089550017 Corriente COP - Payouts"] } },
        "Bold CF": { "Bold. CF: Citibank COL 0090923021 Corriente COP": { "Bold CF": ["Bold. CF: Citibank COL 0090923021 Corriente COP - Main"] } }
      },
      "ACH": {
        "Bold CO": { "Bold. CO: ACH Dispersión 001": { "Bold CO": ["Bold. CO: ACH Recepción 001"] } },
        "Bold CF": { "Bold. CF: ACH Dispersión 002": { "Bold CF": ["Bold. CF: ACH Recepción 002"] } },
        "Bold Capital": { "Bold Capital: ACH Dispersión 003": { "Bold Capital": ["Bold Capital: ACH Recepción 003"] } }
      }
    }
  }
};
function guardarOperaciones(lista) {
    localStorage.setItem('bold_operaciones_bd', JSON.stringify(lista));
    // Envía los datos inmediatamente a la colección de Firebase
    if (window.dbFirestore) {
        lista.forEach(op => window.dbFirestore.collection("operaciones").doc(op.radicado).set(op));
    }
}