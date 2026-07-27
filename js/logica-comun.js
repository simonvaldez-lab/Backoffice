// ==========================================
// JS/LOGICA-COMUN.JS - BOLD TREASURY BACKOFFICE
// ==========================================

// 1. ÁRBOL RELACIONAL DE 7 NIVELES (BASE DE DATOS OPERATIVA)
const arbolOperaciones = {
    "Traslados entre cuentas": {
        "Cuentas Propias": {
            "Canal Directo": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "Bold CO": ["Banco de Bogotá - *5678", "Citi - *9012"]
                    },
                    "Davivienda - *4321": {
                        "Bold CO": ["Bancolombia - *1234"]
                    }
                },
                "Bold CF": {
                    "Bancolombia - *8888": {
                        "Bold CO": ["Bancolombia - *1234"],
                        "Bold PE": ["BCP Perú - *7777"]
                    }
                }
            }
        }
    },
    "Inversiones y Pactos": {
        "Pactos Bancarios": {
            "Mesa de Dinero": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "Fidubancolombia": ["Encargo Fiduciario - *001"],
                        "Corficolombiana": ["CDT Especial - *002"]
                    }
                }
            }
        }
    },
    "Impuestos y Taxes": {
        "Impuestos Nacionales": {
            "Portal DIAN": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "DIAN Colombia": ["Cuenta Única Nacional DIAN"]
                    }
                }
            }
        }
    },
    "Dispersión Masiva": {
        "Dispersión PSE": {
            "Lote ACH": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "ACH Colombia (PSE)": ["Convenio Dispersión Lote #99"]
                    }
                }
            }
        }
    }
};

// 2. PERMISOS Y BLOQUEO POR ROL (RBAC)
const permisos = {
    "Solicitante": ["solicitante.html", "historial.html"],
    "Validador": ["validador.html", "historial.html"],
    "Preparador": ["preparador.html", "historial.html"],
    "Aprobador": ["aprobador.html", "historial.html"],
    "Maestro": ["solicitante.html", "validador.html", "preparador.html", "aprobador.html", "historial.html"]
};

// 3. AUXILIARES DE FECHA
function obtenerFechaHoraMilitar() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    const hrs = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${anio} - ${hrs}:${min}`;
}

function obtenerFechaISO() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    return `${anio}-${mes}-${dia}`;
}

function fechasCoinciden(fechaOp, fechaInput) {
    if (!fechaInput || fechaInput === "") return true;
    if (!fechaOp) return false;
    const limpiaOp = String(fechaOp).split(" - ")[0].trim();
    const partes = limpiaOp.split("/");
    if (partes.length !== 3) return false;
    const fNorm = `${partes[2]}-${String(partes[1]).padStart(2, "0")}-${String(partes[0]).padStart(2, "0")}`;
    return fNorm === fechaInput;
}

// 4. ALMACENAMIENTO LOCAL Y SINCRONIZACIÓN
function obtenerOperaciones() {
    const ops = localStorage.getItem('bold_operaciones_bd');
    if (ops) {
        try { return JSON.parse(ops); } catch(e) { return []; }
    }
    return [];
}

function guardarOperaciones(ops) {
    localStorage.setItem('bold_operaciones_bd', JSON.stringify(ops));
}

// 5. NOTIFICACIONES
function crearNotificacion(radicado, mensaje) {
    const notifs = JSON.parse(localStorage.getItem('bold_notificaciones_bd') || '[]');
    notifs.unshift({ id: Date.now(), radicado, mensaje, fecha: obtenerFechaHoraMilitar(), leida: false });
    localStorage.setItem('bold_notificaciones_bd', JSON.stringify(notifs));
}

// 6. CONTROL DE SESIÓN Y DIBUJO DE TOPBAR (BARRA SUPERIOR DE USUARIO)
function aplicarSeguridadYMenu() {
    const usrRaw = sessionStorage.getItem('usuarioLogueado');
    if (!usrRaw) return;
    const usuario = JSON.parse(usrRaw);

    // Dibujar topbar
    const topbarRight = document.querySelector('.topbar-derecha');
    if (topbarRight) {
        topbarRight.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="position:relative; cursor:pointer;" onclick="alert('Notificaciones recientes en el sistema')">
                    🔔<span style="position:absolute; top:-5px; right:-5px; background:#EF4444; color:white; font-size:9px; border-radius:50%; padding:2px 5px; font-weight:bold;">1</span>
                </div>
                <span style="font-size:12px; background:#E2E8F0; padding:4px 8px; border-radius:12px; font-weight:bold;">🌍 ${usuario.pais || 'General'}</span>
                <span style="font-size:12px; font-weight:bold; color:#0B1442;">👤 ${usuario.nombre || 'Usuario'} (${usuario.rol || 'Solicitante'})</span>
                <button class="btn" style="background:#FEE2E2; color:#991B1B; font-size:11px; padding:4px 10px; font-weight:bold;" onclick="cerrarSesion()">Salir</button>
            </div>
        `;
    }

    // Filtrar menú según rol
    if (usuario.rol && permisos[usuario.rol]) {
        const accesos = permisos[usuario.rol];
        document.querySelectorAll('.menu-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href && !accesos.includes(href)) {
                item.style.display = 'none';
            } else {
                item.style.display = 'block';
            }
        });

        document.querySelectorAll('.menu-categoria').forEach(cat => {
            let next = cat.nextElementSibling;
            let visible = false;
            while (next && !next.classList.contains('menu-categoria')) {
                if (next.style.display !== 'none') visible = true;
                next = next.nextElementSibling;
            }
            if (!visible) cat.style.display = 'none';
        });
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuarioLogueado');
    window.location.href = 'index.html';
}

// 7. BADGES DE ESTADO
function obtenerBadgeEstado(estado) {
    switch (estado) {
        case 'Pendiente Validación': return '<span class="badge" style="background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🟡 PENDIENTE VALIDACIÓN</span>';
        case 'En Preparación': return '<span class="badge" style="background:#E0F2FE; color:#075985; border:1px solid #BAE6FD; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🔵 EN PREPARACIÓN</span>';
        case 'En Aprobación': return '<span class="badge" style="background:#FEE2E2; color:#991B1B; border:1px solid #FECACA; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🔴 EN APROBACIÓN</span>';
        case 'Completado': case 'Aprobado': return '<span class="badge" style="background:#DCFCE7; color:#166534; border:1px solid #BBF7D0; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🟢 COMPLETADO</span>';
        case 'Rechazado': return '<span class="badge" style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">⚫ RECHAZADO</span>';
        default: return `<span class="badge">${estado}</span>`;
    }
}

// 8. MODAL DE AUDITORÍA Y EXPEDIENTE
function auditarRadicado(radicado) {
    var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : [];
    var op = ops.find(function(o) { return o.radicado === radicado; });
    if (!op) return alert("No se encontró el Radicado: " + radicado);

    const elTitulo = document.getElementById("mod-radicado-titulo");
    if (elTitulo) elTitulo.innerText = "Módulo de Auditoría (" + (op.pais || "Colombia") + "): " + op.radicado;

    const elOrigen = document.getElementById("mod-origen");
    if (elOrigen) elOrigen.innerText = op.empresa || "";

    const elMoneda = document.getElementById("mod-moneda");
    if (elMoneda) elMoneda.innerText = op.moneda || "";

    const elValSol = document.getElementById("mod-val-sol");
    if (elValSol) elValSol.innerText = "$ " + (op.montoSol || 0).toLocaleString() + " " + (op.moneda || "");

    const elValPrep = document.getElementById("mod-val-prep");
    if (elValPrep) elValPrep.innerText = "Screen Banco: $ " + (op.montoPrep || 0).toLocaleString() + " " + (op.moneda || "");

    const elRegs = document.getElementById("mod-regs");
    if (elRegs) elRegs.innerText = (op.registros || 1) + " Transacciones";

    var elCtaOri = document.getElementById("mod-cta-origen");
    var elCtaDes = document.getElementById("mod-cta-destino");
    var elDocSec = document.getElementById("mod-doc-seccion");

    if (!elCtaOri) {
        var grid = document.querySelector(".grid-detalles");
        if (grid) {
            var htmlCuentas = '<div class="dato-grupo" style="grid-column: 1 / -1; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #CBD5E1;">' +
                '<span class="dato-label" style="color: #64748B;">🏦 Cuenta Origen (Débito / Salida)</span>' +
                '<span class="dato-valor" id="mod-cta-origen" style="font-size: 12px; color: #1E293B; word-break: break-all; font-weight: 600; display: block; margin-top: 2px;"></span>' +
            '</div>' +
            '<div class="dato-grupo" style="grid-column: 1 / -1; margin-top: 6px;">' +
                '<span class="dato-label" style="color: #64748B;">🎯 Cuenta Destino (Crédito / Dispersión)</span>' +
                '<span class="dato-valor" id="mod-cta-destino" style="font-size: 12px; color: #15803D; font-weight: 700; word-break: break-all; display: block; margin-top: 2px;"></span>' +
            '</div>' +
            '<div id="mod-doc-seccion" style="grid-column: 1 / -1; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E2E8F0; display: none;">' +
                '<span class="dato-label" style="color: #0B1442; font-weight: bold; margin-bottom: 6px; display: block;">📎 Soporte Operativo y Observaciones</span>' +
                '<div id="mod-doc-contenido"></div>' +
            '</div>';
            grid.insertAdjacentHTML("beforeend", htmlCuentas);
            elCtaOri = document.getElementById("mod-cta-origen");
            elCtaDes = document.getElementById("mod-cta-destino");
            elDocSec = document.getElementById("mod-doc-seccion");
        }
    }

    if (elCtaOri) elCtaOri.innerText = op.ctaOrigen || op.detalle || "No especificada";
    if (elCtaDes) elCtaDes.innerText = op.ctaDestino || op.compDestino || "No especificada";

    if (elDocSec) {
        var docHtml = "";
        if (op.nombreOperacion) {
            docHtml += '<div style="font-size:12px; margin-bottom:6px;"><strong>🏷️ Operación:</strong> <span style="background:#EEF2FF; color:#3730A3; padding:2px 6px; border-radius:4px; font-weight:bold;">' + op.nombreOperacion + '</span></div>';
        }
        if (op.archivoLink) {
            docHtml += '<div style="font-size:12px; margin-bottom:6px;"><strong>🔗 Link Operativo:</strong> <a href="' + op.archivoLink + '" target="_blank" style="color:#2563EB; font-weight:bold; text-decoration:underline;">Abrir portal o documento externo ↗</a></div>';
        }
        if (op.instrucciones) {
            docHtml += '<div style="font-size:11px; background:#FEF3C7; color:#92400E; padding:8px; border-radius:6px; margin-bottom:8px; border:1px solid #FDE68A;"><strong>📝 Observaciones:</strong> ' + op.instrucciones + '</div>';
        }
        if (op.archivoData && op.archivoNombre) {
            docHtml += '<div style="margin-top:6px;"><a href="' + op.archivoData + '" download="' + op.archivoNombre + '" class="btn" style="background:#3B82F6; color:white; font-size:11px; padding:6px 12px; text-decoration:none; display:inline-block; font-weight:bold;">📥 Descargar Archivo (' + op.archivoNombre + ')</a></div>';
            if (op.archivoNombre.endsWith(".png") || (op.archivoTipo && op.archivoTipo.includes("image"))) {
                docHtml += '<div style="margin-top:8px;"><img src="' + op.archivoData + '" style="max-width:100%; max-height:180px; border-radius:6px; border:1px solid #CBD5E1;"></div>';
            } else if (op.archivoNombre.endsWith(".pdf") || (op.archivoTipo && op.archivoTipo.includes("pdf"))) {
                docHtml += '<div style="margin-top:8px;"><iframe src="' + op.archivoData + '" style="width:100%; height:220px; border:1px solid #CBD5E1; border-radius:6px;"></iframe></div>';
            }
        }
        if (docHtml !== "") {
            document.getElementById("mod-doc-contenido").innerHTML = docHtml;
            elDocSec.style.display = "block";
        } else {
            elDocSec.style.display = "none";
        }
    }

    var divTraza = document.getElementById("mod-timeline");
    if (divTraza && op.historial) {
        divTraza.innerHTML = "";
        op.historial.forEach(function(h) {
            var estiloAlerta = h.alerta ? ' style="border-left: 4px solid #D97706;"' : '';
            divTraza.innerHTML += '<div class="timeline-item">' +
                '<div class="timeline-fecha">' + h.fecha + '</div>' +
                '<div class="timeline-desc"' + estiloAlerta + '>' +
                    '<strong>' + h.paso + '</strong><br>' +
                    '<span style="font-size:11px; color:#1E293B; display:block; margin-top:4px;">' + h.detalle + '</span>' +
                '</div>' +
            '</div>';
        });
    }

    var visSolProv = document.getElementById("vis-sol-prov");
    if (visSolProv) visSolProv.innerText = op.empresa || "";
    var visSolTotal = document.getElementById("vis-sol-total");
    if (visSolTotal) visSolTotal.innerText = "$ " + (op.montoSol || 0).toLocaleString() + " " + (op.moneda || "");
    var visPrepTotal = document.getElementById("vis-prep-total");
    if (visPrepTotal) visPrepTotal.innerText = "$ " + (op.montoPrep || 0).toLocaleString() + " " + (op.moneda || "");

    var modDetalles = document.getElementById("modalDetalles");
    if (modDetalles) modDetalles.style.display = "flex";
}

function alternarVisor() {
    const vis = document.getElementById('contenedorVisor');
    if (vis) vis.style.display = vis.style.display === 'none' ? 'block' : 'none';
}

function cambiarPestana(p) {
    const tabS = document.getElementById('tabSol');
    const tabP = document.getElementById('tabPrep');
    const visS = document.getElementById('vistaSolicitante');
    const visP = document.getElementById('vistaPreparador');
    if (p === 'solicitante') {
        if(tabS) tabS.classList.add('active'); if(tabP) tabP.classList.remove('active');
        if(visS) visS.classList.remove('hidden'); if(visP) visP.classList.add('hidden');
    } else {
        if(tabP) tabP.classList.add('active'); if(tabS) tabS.classList.remove('active');
        if(visP) visP.classList.remove('hidden'); if(visS) visS.classList.add('hidden');
    }
}

function cerrarModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// 9. INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
    aplicarSeguridadYMenu();
});


// === MÓDULO DE SEGURIDAD RBAC Y TOPBAR AGREGADO AL FINAL ===
function aplicarSeguridadYMenu() {
    try {
        var usrRaw = sessionStorage.getItem("usuarioLogueado");
        if (!usrRaw) usrRaw = localStorage.getItem("bold_ultimo_usuario_backup");
        
        // Si no hay sesión, por seguridad iniciamos como Laura (Solicitante) para no abrir roles prohibidos
        if (!usrRaw) {
            usrRaw = JSON.stringify({ nombre: "Laura", rol: "Solicitante", pais: "Colombia", correo: "lau@bold.co" });
            sessionStorage.setItem("usuarioLogueado", usrRaw);
        }
        var usuario = JSON.parse(usrRaw);
        localStorage.setItem("bold_ultimo_usuario_backup", usrRaw);

        // 1. DIBUJAR BARRA SUPERIOR DE USUARIO (TOPBAR)
        var topbarRight = document.querySelector(".topbar-derecha");
        if (topbarRight) {
            topbarRight.innerHTML = '<div style="display:flex; align-items:center; gap:12px;">' +
                '<div style="position:relative; cursor:pointer;" onclick="alert(\'Notificaciones del sistema\')">🔔<span style="position:absolute; top:-5px; right:-5px; background:#EF4444; color:white; font-size:9px; border-radius:50%; padding:2px 5px; font-weight:bold;">1</span></div>' +
                '<span style="font-size:12px; background:#E2E8F0; padding:4px 8px; border-radius:12px; font-weight:bold;">🌍 ' + (usuario.pais || "General") + '</span>' +
                '<span style="font-size:12px; font-weight:bold; color:#0B1442;">👤 ' + (usuario.nombre || "Usuario") + ' (' + (usuario.rol || "Solicitante") + ')</span>' +
                '<button class="btn" style="background:#FEE2E2; color:#991B1B; font-size:11px; padding:4px 10px; font-weight:bold;" onclick="cerrarSesion()">Salir</button>' +
            '</div>';
        }

        // 2. BLOQUEO ESTRICTO DE MENÚ POR ROL (RBAC)
        var mapaPermisos = {
            "Solicitante": ["solicitante.html", "historial.html"],
            "Validador": ["validador.html", "historial.html"],
            "Preparador": ["preparador.html", "historial.html"],
            "Aprobador": ["aprobador.html", "historial.html"],
            "Maestro": ["solicitante.html", "validador.html", "preparador.html", "aprobador.html", "historial.html"]
        };
        var rol = usuario.rol || "Solicitante";
        var permitidos = mapaPermisos[rol] || ["solicitante.html", "historial.html"];

        document.querySelectorAll(".menu-item").forEach(function(item) {
            var enlace = item.getAttribute("href");
            if (enlace && !permitidos.includes(enlace)) {
                item.style.display = "none";
                item.style.visibility = "hidden";
            } else {
                item.style.display = "block";
                item.style.visibility = "visible";
            }
        });

        document.querySelectorAll(".menu-categoria").forEach(function(cat) {
            var next = cat.nextElementSibling;
            var hayVisible = false;
            while (next && !next.classList.contains("menu-categoria")) {
                if (next.style.display !== "none" && next.style.visibility !== "hidden") hayVisible = true;
                next = next.nextElementSibling;
            }
            cat.style.display = hayVisible ? "block" : "none";
        });
    } catch(e) { console.error("Error RBAC:", e); }
}

function cerrarSesion() {
    sessionStorage.removeItem("usuarioLogueado");
    localStorage.removeItem("bold_ultimo_usuario_backup");
    window.location.href = "index.html";
}

// Ejecución garantizada al cargar la página
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicarSeguridadYMenu);
} else {
    aplicarSeguridadYMenu();
}
