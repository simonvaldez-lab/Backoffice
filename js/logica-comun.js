if (typeof firebase !== "undefined" && firebase.app) {
    var _origFs = firebase.firestore;
    firebase.firestore = function(dbName) {
        return firebase.app().firestore();
    };
}
// ==========================================
// JS/LOGICA-COMUN.JS - BOLD TREASURY BACKOFFICE
// ==========================================

// 1. ÁRBOL RELACIONAL DE 7 NIVELES (BASE DE DATOS OPERATIVA)
const arbolOperaciones = {
    "Traslados": {
        "Traslados CUD": {
            "Adelanto adquirencia doméstica": {
                "Bold CF": {
                    "BanRep - 62108160 CUD COP": {
                        "Bold CO": ["Bold CF 170011844070 PO´S ACH", "Bold CF 000008024755 Deposito COP"]
                        }
                    }
                }
            }
        },    
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
    "Solicitante": ["dashboard.html", "historial.html"],
    "Preparador": ["dashboard.html", "historial.html"],
    "Aprobador": ["dashboard.html", "historial.html"],
    "Maestro": ["dashboard.html", "historial.html", "admin.html"]
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

// ==============================================================
// 4. ALMACENAMIENTO Y LECTURA 100% FIRESTORE (SIN LOCALSTORAGE)
// ==============================================================

// Enfriador/Memoria en RAM mientras la página está abierta
window.cacheOperacionesNube = [];

// Obtiene las operaciones cargadas desde Firestore
function obtenerOperaciones() {
    return window.cacheOperacionesNube || [];
}

// Guarda DIRECTAMENTE en la nube de Firebase
async function guardarOperaciones(ops) {
    window.cacheOperacionesNube = ops; // Actualiza la memoria RAM temporal

    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            
            // Subimos cada operación a la colección de Firestore
            for (const op of ops) {
                if (op && op.radicado) {
                    const docId = String(op.radicado).replace(/\//g, '-');
                    await db.collection('operaciones').doc(docId).set(op, { merge: true });
                }
            }
        }
    } catch (e) {
        console.error("❌ Error guardando directo en Firestore:", e);
    }
}

// Escuchador en Tiempo Real (Mantiene la tabla de todos los usuarios conectada a la nube)
function iniciarSincronizacionNube(callbackAlActualizar) {
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            
            db.collection('operaciones').onSnapshot((snapshot) => {
                const opsNube = [];
                snapshot.forEach(doc => opsNube.push(doc.data()));
                
                // Ordenar por fecha reciente
                opsNube.sort((a, b) => new Date(b.fechaISO || '2026-01-01') - new Date(a.fechaISO || '2026-01-01'));
                
                // Actualizamos la variable global 100% en la nube
                window.cacheOperacionesNube = opsNube;
                
                // Si la pantalla tiene función para redibujar la tabla, la ejecuta
                if (typeof callbackAlActualizar === 'function') {
                    callbackAlActualizar();
                } else if (typeof renderizarTabla === 'function') {
                    renderizarTabla();
                }
            });
        }
    } catch (e) {
        console.error("❌ Error iniciando radar de Firestore:", e);
    }
}

// ==============================================================
// 5. NOTIFICACIONES 100% FIRESTORE
// ==============================================================

async function crearNotificacion(radicado, mensaje) {
    const fechaActual = typeof obtenerFechaHoraMilitar === 'function' 
        ? obtenerFechaHoraMilitar() 
        : new Date().toLocaleString('es-CO');

    const nuevaNotif = {
        id: Date.now(),
        radicado: radicado || 'S/R',
        mensaje: mensaje,
        fecha: fechaActual,
        leida: false
    };

    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            await db.collection('notificaciones').doc(String(nuevaNotif.id)).set(nuevaNotif);
        }
    } catch (e) {
        console.error("❌ Error guardando notificación en la nube:", e);
    }
}
// 4. ALMACENAMIENTO 100% NUBE (FIRESTORE)
async function guardarOperaciones(ops) {
    // 1. Mantenemos una copia temporal en la memoria RAM del navegador para respuesta rápida
    window.cacheOperacionesNube = ops; 

    // 2. Enviamos cada operación directamente a los servidores de Firestore
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            
            for (const op of ops) {
                if (op && op.radicado) {
                    // Reemplazamos las barras slash por guiones para generar un ID válido
                    const docId = String(op.radicado).replace(/\//g, '-');
                    await db.collection('operaciones').doc(docId).set(op, { merge: true });
                }
            }
        }
    } catch (e) {
        console.error("❌ Error guardando directo en Firestore:", e);
    }
}

// 5. NOTIFICACIONES 100% NUBE (FIRESTORE)
async function crearNotificacion(radicado, mensaje) {
    const fechaActual = typeof obtenerFechaHoraMilitar === 'function' 
        ? obtenerFechaHoraMilitar() 
        : new Date().toLocaleString('es-CO');

    const nuevaNotif = {
        id: Date.now(),
        radicado: radicado || 'S/R',
        mensaje: mensaje,
        fecha: fechaActual,
        leida: false
    };

    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            await db.collection('notificaciones').doc(String(nuevaNotif.id)).set(nuevaNotif);
        }
    } catch (e) {
        console.error("❌ Error guardando notificación en Firestore:", e);
    }
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
    var est = String(estado || "").toUpperCase().trim();
    if (est.indexOf("PENDIENTE_PREPARACION") !== -1 || est.indexOf("PENDIENTE VALIDACI") !== -1 || est === "PENDIENTE") {
        return '<span class="badge" style="background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🟡 PENDIENTE COMPLIANCE / MONTAJE</span>';
    } else if (est.indexOf("PENDIENTE_APROBACION") !== -1 || est.indexOf("EN APROBACI") !== -1 || est.indexOf("EN PREPARACI") !== -1 || est === "LISTO PARA BANCO") {
        return '<span class="badge" style="background:#E0F2FE; color:#075985; border:1px solid #BAE6FD; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🔵 PENDIENTE APROBACIÓN</span>';
    } else if (est === "APROBADO" || est.indexOf("COMPLETADO") !== -1 || est.indexOf("PAGADA") !== -1 || est.indexOf("CERRADA") !== -1) {
        return '<span class="badge" style="background:#DCFCE7; color:#166534; border:1px solid #BBF7D0; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">🟢 COMPLETADA / CERRADA ✓</span>';
    } else if (est.indexOf("RECHAZADO") !== -1 || est.indexOf("DEVUELTO") !== -1) {
        return '<span class="badge" style="background:#FEE2E2; color:#991B1B; border:1px solid #FECACA; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">⚫ RECHAZADO / DEVUELTO</span>';
    } else {
        return '<span class="badge" style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">' + (estado || "SIN ESTADO") + '</span>';
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
        
        // Si no hay sesión activa en esta pestaña, se asigna por defecto Laura (Solicitante)
        if (!usrRaw) {
            usrRaw = JSON.stringify({ nombre: "Laura", rol: "Solicitante", pais: "Colombia", correo: "lau@bold.co" });
            sessionStorage.setItem("usuarioLogueado", usrRaw);
        }
        var usuario = JSON.parse(usrRaw);

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

        // 2. PERMISOS ESTRICTOS POR ROL (ACTUALIZADO A SPA)
        var rolKey = String(usuario.rol || "solicitante").toLowerCase().trim();
        var mapaPermisos = {
            "solicitante": ["dashboard.html", "historial.html"],
            "preparador": ["dashboard.html", "historial.html"],
            "aprobador": ["dashboard.html", "historial.html"],
            "maestro": ["dashboard.html", "historial.html", "admin.html"]
        };
        var permitidos = mapaPermisos[rolKey] || ["dashboard.html", "historial.html"];

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
    // Limpiamos la sesión activa de la pestaña actual
    sessionStorage.clear();
    
    // Limpiamos la memoria temporal en RAM de la nube
    window.cacheOperacionesNube = [];
    
    // Redirigimos al deck de inicio
    window.location.href = "index.html";
}

// Ejecución garantizada al cargar la página
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicarSeguridadYMenu);
} else {
    aplicarSeguridadYMenu();
}


// === EXPANSIÓN DE ÁRBOL OPERATIVO (PAGO PSE, PACTOS, TAXES) ===
if (typeof arbolOperaciones !== "undefined") {
    arbolOperaciones["Pago PSE"] = {
        "Pago Proveedores": {
            "Pago Proveedores Locales": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "Proveedores Varios": ["Dispersión Lote PSE #001", "Dispersión Lote PSE #002"]
                    }
                }
            }
        },
        "Pago Impuestos": {
            "Impuestos Nacionales DIAN": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "DIAN / Tesorería Distrital": ["Cuenta Única Nacional DIAN", "Pago Electrónico Impuestos"]
                    }
                }
            }
        },
        "Payroll": {
            "Pacto Colectivo": {
                "Bold CO": {
                    "Bancolombia - *1234": {
                        "Fondo Pacto Colectivo": ["Cuenta Nómina / Pacto *9988", "Fiduciaria Pacto Colectivo"]
                    }
                }
            }
        }
    };
}


// === EXPANSION DE CUENTAS BANCARIAS COMPLETAS SIN ASTERISCOS ===
if (typeof arbolOperaciones !== "undefined") {
    // 1. Agregamos una categoría formal con todas las cuentas completas (sin asteriscos ni resúmenes)
    arbolOperaciones["Traslados entre cuentas"]["Cuentas Propias"]["Canal Directo"]["Bold CO"] = {
        "Bancolombia - Cta. Corriente # 001-98765432-1 (Bold CO)": {
            "Bold CO": [
                "Banco de Bogotá - Cta. Corriente # 033-45678901-2 (Bold CO)",
                "Citibank Colombia - Cta. Corriente # 100-200300400-5 (Bold CO)",
                "Davivienda - Cta. Ahorros # 4568-7788-9900 (Bold CO)",
                "Banco de Occidente - Cta. Corriente # 230-88997766-4 (Bold CO)",
                "BBVA Colombia - Cta. Corriente # 310-99887766-5 (Bold CO)"
            ]
        },
        "Davivienda - Cta. Ahorros # 4568-7788-9900 (Bold CO)": {
            "Bold CO": [
                "Bancolombia - Cta. Corriente # 001-98765432-1 (Bold CO)",
                "Banco de Bogotá - Cta. Corriente # 033-45678901-2 (Bold CO)"
            ]
        },
        "Citibank Colombia - Cta. Corriente # 100-200300400-5 (Bold CO)": {
            "Bold CO": [
                "Bancolombia - Cta. Corriente # 001-98765432-1 (Bold CO)",
                "Banco de Occidente - Cta. Corriente # 230-88997766-4 (Bold CO)"
            ]
        }
    };

    // 2. Expandimos también las cuentas en las rutas operativas especiales (PSE, Pactos, Taxes)
    if (arbolOperaciones["Pago PSE"] && arbolOperaciones["Pago PSE"]["Pago Proveedores"]) {
        arbolOperaciones["Pago PSE"]["Pago Proveedores"]["Pago Proveedores Locales"]["Bold CO"] = {
            "Bancolombia - Cta. Corriente # 001-98765432-1 (Bold CO)": {
                "Proveedores Varios": [
                    "ACH Colombia (PSE) - Dispersión Lote Proveedores Cta # 99001122",
                    "ACH Colombia (PSE) - Dispersión Nómina y Honorarios Cta # 88776655"
                ]
            }
        };
    }
    
    if (arbolOperaciones["Pago PSE"] && arbolOperaciones["Pago PSE"]["Payroll"]) {
        arbolOperaciones["Pago PSE"]["Payroll"]["Pacto Colectivo"]["Bold CO"] = {
            "Bancolombia - Cta. Corriente # 001-98765432-1 (Bold CO)": {
                "Fondo Pacto Colectivo": [
                    "Fiduciaria Bancolombia - Encargo Fiduciario Cta # 55443322-1",
                    "Fiduciaria Bogotá - Fondo Pacto Colectivo Cta # 11223344-9"
                ]
            }
        };
    }

    if (arbolOperaciones["Pago PSE"] && arbolOperaciones["Pago PSE"]["Pago Impuestos"]) {
        arbolOperaciones["Pago PSE"]["Pago Impuestos"]["Impuestos Nacionales DIAN"]["Bold CO"] = {
            "Bancolombia - Cta. Corriente # 001-98765432-1 (Bold CO)": {
                "DIAN / Tesorería Distrital": [
                    "Cuenta Única Nacional DIAN - Recaudo Impuestos Cta # 0000-9999-8888",
                    "Tesorería Distrital Bogotá - Recaudo ICA y Retención Cta # 1111-2222-3333"
                ]
            }
        };
    }
}

// === RADAR EN VIVO Y MOTOR DE TABLA ROBUSTO (SIN F5 - 100% FIRESTORE) ===
function actualizarRadarYTablaEnVivo() {
    try {
        var tb = document.getElementById("tabla-recientes");
        if (!tb) return;
        
        // Obtenemos las operaciones traídas directamente desde la nube
        var ops = typeof obtenerOperaciones === "function" ? (obtenerOperaciones() || []) : (window.cacheOperacionesNube || []);
        
        var usrRaw = sessionStorage.getItem("usuarioLogueado") || "{}";
        var usr = JSON.parse(usrRaw);
        var correoUsr = usr.correo || "lau@bold.co";
        
        var misOps = ops.filter(function(o) {
            return !o.solicitante || o.solicitante === correoUsr || usr.rol === "Maestro";
        }).slice(0, 5);
        
        if (misOps.length === 0) misOps = ops.slice(0, 5);
        
        if (misOps.length === 0) {
            tb.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748B; padding:20px;">Aún no tienes operaciones radicadas en el sistema. Radica la primera arriba.</td></tr>';
            return;
        }
        
        var html = "";
        misOps.forEach(function(o) {
            var prioBadge = o.prioridad === 1 ? '<span style="color:#991B1B; font-weight:bold;">🔥 Alta</span>' : o.prioridad === 3 ? '<span style="color:#475569;">☕ Baja</span>' : '<span style="color:#D97706; font-weight:bold;">⚡ Media</span>';
            
            // Semáforo visual en tiempo real para la pantalla del Solicitante
            var badgeEst = "";
            var est = o.estado || "Pendiente Validación";
            if (est === "Pendiente Validación") {
                badgeEst = '<span style="background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px; display:inline-block;">🟡 1. En Revisión Compliance</span>';
            } else if (est === "En Preparación") {
                var quier = o.apartadaPor ? " (" + o.apartadaPor + ")" : "";
                badgeEst = '<span style="background:#E0F2FE; color:#075985; border:1px solid #BAE6FD; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px; display:inline-block;">🔵 2. En Montaje Bancario' + quier + '</span>';
            } else if (est === "En Aprobación") {
                badgeEst = '<span style="background:#FEE2E2; color:#991B1B; border:1px solid #FECACA; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px; display:inline-block;">🔴 3. En Firma de Aprobador</span>';
            } else if (est === "Completado" || est === "Aprobado") {
                badgeEst = '<span style="background:#DCFCE7; color:#166534; border:1px solid #BBF7D0; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px; display:inline-block;">🟢 4. Dispersado / Pagado ✓</span>';
            } else {
                badgeEst = '<span style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px; display:inline-block;">⚫ ' + est + '</span>';
            }
            
            var mon = o.moneda || "COP";
            var mto = (o.montoSol || o.montoPrep || 0);
            
            html += '<tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.2s;" onmouseover="this.style.background=\'#F8FAFC\'" onmouseout="this.style.background=\'transparent\'">' +
                '<td style="padding: 12px 10px;"><strong>' + (o.radicado || "S/N") + '</strong><br><span style="font-size:11px; color:#64748B;">' + (o.fechaRadicacion || "Hoy") + '</span></td>' +
                '<td style="padding: 12px 10px;"><strong style="color:#0B1442; font-size:13px;">' + (o.nombreOperacion || o.tipo || "Operación") + '</strong><br><span style="font-size:11px; color:#475569;">' + (o.empresa || "Bold CO") + ' ➔ ' + (o.compDestino || "Destino") + '</span></td>' +
                '<td style="padding: 12px 10px;"><strong style="font-size:13px; color:#1E293B;">$ ' + Number(mto).toLocaleString() + '</strong> <span style="background:#EEF2FF; color:#3730A3; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">' + mon + '</span></td>' +
                '<td style="padding: 12px 10px;">' + prioBadge + '<br><span style="font-size:11px; color:#64748B;">SLA: ' + (o.ans || "2 Horas") + '</span></td>' +
                '<td style="padding: 12px 10px;">' + badgeEst + '</td>' +
            '</tr>';
        });
        tb.innerHTML = html;
    } catch(e) { console.error("Error en radar del solicitante:", e); }
}

// Sincronización multi-escritorio: actualiza el semáforo al instante cuando otro usuario aprueba el pago
window.addEventListener("storage", function(e) {
    if (!e.key || e.key === "bold_operaciones_bd" || e.key === "bold_notificaciones_bd") {
        actualizarRadarYTablaEnVivo();
    }
});



setInterval(function() {
    if (typeof actualizarRadarYTablaEnVivo === "function") {
        actualizarRadarYTablaEnVivo();
    }
}, 1500);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizarRadarYTablaEnVivo);
} else {
    setTimeout(actualizarRadarYTablaEnVivo, 100);
}

// === MÓDULO MAESTRO DE SEGURIDAD RBAC, REDIRECCIÓN ESTRICTA Y SINCRONIZACIÓN UNIVERSAL ===
function aplicarSeguridadYMenuUniversal() {
    try {
        var paginaActual = window.location.pathname.split("/").pop() || "";
        var esLogin = (paginaActual === "index.html" || paginaActual === "");

        var usrRaw = sessionStorage.getItem("usuarioLogueado");
        
        // 🚨 EXPULSIÓN INMEDIATA SI NO HAY SESIÓN (Y NO ESTÁ EN EL LOGIN)
        if (!usrRaw && !esLogin) {
            window.location.replace("index.html");
            return;
        }
        if (!usrRaw && esLogin) return; // Es correcto que esté en el login

        var usuario = JSON.parse(usrRaw);

        // 1. DIBUJAR TOPBAR
        var topbarRight = document.querySelector(".topbar-derecha");
        if (topbarRight) {
            topbarRight.innerHTML = '<div style="display:flex; align-items:center; gap:12px;">' +
                '<span style="font-size:12px; font-weight:bold; color:#0B1442;">👤 ' + (usuario.nombre || "Usuario") + ' (' + String(usuario.rol || "solicitante").toUpperCase() + ')</span>' +
                '<button class="btn" style="background:#FEE2E2; color:#991B1B; font-size:11px; padding:4px 10px; font-weight:bold;" onclick="cerrarSesion()">Salir</button>' +
            '</div>';
        }

        // 2. PERMISOS ESTRICTOS POR ROL
        var rol = String(usuario.rol || "solicitante").toLowerCase().trim();
        var mapaPermisos = {
            "solicitante": ["dashboard.html", "historial.html"],
            "preparador": ["dashboard.html", "historial.html"],
            "aprobador": ["dashboard.html", "historial.html"],
            "maestro": ["dashboard.html", "historial.html", "admin.html"]
        };
        var permitidos = mapaPermisos[rol] || [];

        // 🚨 REDIRECCIÓN SI INTENTA ENTRAR A UNA PANTALLA PROHIBIDA
        if (!esLogin && !permitidos.includes(paginaActual) && rol !== "maestro") {
            window.location.replace(permitidos[0] || "index.html");
            return;
        }

        // 3. OCULTAR MENÚS PROHIBIDOS
        document.querySelectorAll(".menu-item").forEach(function(item) {
            var enlace = item.getAttribute("href");
            if (enlace && !permitidos.includes(enlace) && rol !== "maestro") {
                item.style.display = "none";
            } else {
                item.style.display = "block";
            }
        });
    } catch(e) { console.error("Error RBAC:", e); }
}

// 4. SINCRONIZACIÓN UNIVERSAL SIN F5 EN TODAS LAS PANTALLAS
function refrescarPantallasUniversales() {
    try {
        if (typeof renderizarTabla === "function") renderizarTabla();
        if (typeof actualizarRadarYTablaEnVivo === "function") actualizarRadarYTablaEnVivo();
        if (typeof pintarTablaRecientesSegura === "function") pintarTablaRecientesSegura();
    } catch(e) {}
}

window.addEventListener("storage", function(e) {
    if (!e.key || e.key === "bold_operaciones_bd" || e.key === "bold_notificaciones_bd" || e.key === "usuarioLogueado") {
        aplicarSeguridadYMenuUniversal();
        refrescarPantallasUniversales();
    }
});

setInterval(function() {
    aplicarSeguridadYMenuUniversal();
    refrescarPantallasUniversales();
}, 1500);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        aplicarSeguridadYMenuUniversal();
        refrescarPantallasUniversales();
    });
} else {
    aplicarSeguridadYMenuUniversal();
    refrescarPantallasUniversales();
}

// === MÓDULO DE CICLO DE VIDA, GUARDIAS RBAC Y RECHAZO ESTRICTO ===
// 🛡️ GUARDIA RBAC: Verifica que el rol sea autorizado para rechazar o aprobar
function guardiaRolRechazo(usr) {
    var rol = String(usr.rol || "").toLowerCase().trim();
    if (rol === "solicitante") {
        alert("⛔ ACCESO DENEGADO (RBAC):" + "\n" + "El rol Solicitante solo puede iniciar solicitudes y monitorear su estado. No tiene permisos para rechazar, modificar ni aprobar operaciones.");
        throw new Error("Violación RBAC: Solicitante intentando rechazar.");
    }
    if (rol !== "preparador" && rol !== "aprobador" && rol !== "maestro") {
        alert("⛔ ACCESO DENEGADO (RBAC):" + "\n" + "Tu rol no cuenta con privilegios para modificar el ciclo de vida de este radicado.");
        throw new Error("Violación RBAC: Rol no autorizado.");
    }
    return true;
}

async function ejecutarRechazoSeguro(radicado) {
    try {
        var usrRaw = sessionStorage.getItem("usuarioLogueado") || "{}";
        var usr = JSON.parse(usrRaw);
        if (typeof guardiaRolRechazo === "function") guardiaRolRechazo(usr);

        var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : (window.cacheOperacionesNube || []);
        var op = ops.find(function(o) { return o.radicado === radicado; });
        if (!op) return alert("❌ No se encontró el radicado especificado: " + radicado);

        var motivo = prompt("🚨 MOTIVO DE DEVOLUCIÓN / RECHAZO (OBLIGATORIO):" + "\n\n" + "Por favor describe detalladamente el error encontrado para que el Solicitante (" + (op.solicitante || "Analista") + ") pueda corregirlo y volver a radicar:");
        if (motivo === null) return;
        if (!motivo || motivo.trim() === "") {
            alert("⚠️ VALIDACIÓN FALLIDA: Es absolutamente obligatorio escribir las observaciones o motivo de rechazo. No se puede devolver una operación en blanco.");
            return ejecutarRechazoSeguro(radicado);
        }

        var motivoLimpio = motivo.trim();
        var rechazador = (usr.nombre || "Analista") + " (" + (usr.rol || "Preparador").toUpperCase() + ")";
        
        op.estado = "RECHAZADO";
        op.motivoRechazo = motivoLimpio;
        op.rechazadoPor = rechazador;
        op.enTransito = false;

        if (!op.historial) op.historial = [];
        op.historial.push({
            fecha: typeof obtenerFechaHoraMilitar === "function" ? obtenerFechaHoraMilitar() : new Date().toLocaleString('es-CO'),
            paso: "⚫ OPERACIÓN RECHAZADA / DEVUELTA",
            detalle: "Devuelto por " + rechazador + ". Motivo obligatorio registrado: \"" + motivoLimpio + "\"",
            alerta: true
        });

        // ☁️ Actualización directa a la base de datos Firestore
        if (typeof guardarOperaciones === "function") {
            await guardarOperaciones(ops);
        }

        if (typeof crearNotificacion === "function") {
            await crearNotificacion(radicado, "🚨 RECHAZADO: " + radicado + " fue devuelto por " + rechazador + ". Motivo: " + motivoLimpio, true);
        }

        alert("✅ OPERACIÓN RECHAZADA Y NOTIFICADA:" + "\n" + "El radicado " + radicado + " ha cambiado al estado RECHAZADO." + "\n" + "Se ha generado una alerta en la interfaz del Solicitante con tus observaciones.");

        if (typeof refrescarPantallasUniversales === "function") refrescarPantallasUniversales();
        else if (typeof renderizarTabla === "function") renderizarTabla();
        if (typeof cerrarModal === "function") cerrarModal("modalDetalles");
    } catch(err) {
        console.error("Fallo controlado en rechazo:", err.message);
    }
}

// 🛡️ INTERCEPTOR UI: Inyecta la Alerta Roja de Rechazo en la Vista del Solicitante y Auditoría
if (typeof auditarRadicado === "function") {
    var _auditarOriginal = auditarRadicado;
    auditarRadicado = function(radicado) {
        _auditarOriginal(radicado);
        setTimeout(function() {
            var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : [];
            var op = ops.find(function(o) { return o.radicado === radicado; });
            if (!op) return;
            
            var modalDatos = document.querySelector("#modalDetalles .seccion-datos");
            var alertaExistente = document.getElementById("alerta-rechazo-ui");
            if (alertaExistente) alertaExistente.remove();
            
            if (String(op.estado || "").toUpperCase().includes("RECHAZ") || String(op.estado || "").toUpperCase().includes("DEVUELT")) {
                var cajaAlerta = document.createElement("div");
                cajaAlerta.id = "alerta-rechazo-ui";
                cajaAlerta.style.cssText = "background:#FEF2F2; border:2px solid #EF4444; color:#991B1B; padding:14px 18px; border-radius:10px; margin-bottom:16px; box-shadow:0 4px 12px rgba(239,68,68,0.15); animation: fadeIn 0.3s ease-in-out;";
                cajaAlerta.innerHTML = '<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">' +
                    '<span style="font-size:24px;">🚨</span>' +
                    '<strong style="font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Operación Rechazada / Devuelto a Origen</strong>' +
                '</div>' +
                '<div style="font-size:12px; line-height:1.5; background:white; padding:10px; border-radius:6px; border:1px dashed #FECACA; color:#7F1D1D;">' +
                    '<strong>👤 Devolución emitida por:</strong> ' + (op.rechazadoPor || "Equipo Preparador / Aprobador") + '<br>' +
                    '<strong style="color:#991B1B;">📝 Observaciones y Motivo del Rechazo:</strong><br>' +
                    '<span style="display:block; margin-top:4px; font-weight:600; font-size:13px; background:#FFF1F2; padding:6px; border-radius:4px;">"' + (op.motivoRechazo || op.instrucciones || "Por favor revisar los soportes bancarios y volver a diligenciar la solicitud.") + '"</span>' +
                '</div>';
                
                if (modalDatos) modalDatos.insertBefore(cajaAlerta, modalDatos.firstChild);
            }
        }, 50);
    };
}

// === PUENTE ASÍNCRONO CON FIREBASE CLOUD FUNCTIONS ===
// ⚙️ CONFIGURACIÓN DE TU ENDPOINT EN LA NUBE
var CLOUD_FUNCTION_URL = "https://apiradicaroperacion-625642864594.us-central1.run.app";

function enviarRadicadoACloudFunction(operacion) {
    try {
        if (!operacion || !operacion.radicado) return;
        
        // Evitamos reenviar si es un guardado de actualización o rechazo posterior
        if (operacion.estado !== "Pendiente Validación" && operacion.estado !== "Pendiente Preparación") return;

        console.log("☁️ [PUENTE CLOUD] Enviando radicado a Firebase Cloud Functions: " + operacion.radicado);

        // Petición asíncrona en segundo plano (Fetch API) para no congelar la UI de Laura
        fetch(CLOUD_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(operacion)
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.exito) {
                console.log("🟢 [CLOUD FUNCTION OK]: Operación asegurada en la nube -> " + data.idDocumento);
            } else {
                console.warn("⚠️ [CLOUD FUNCTION RESPUESTA]: " + (data.error || "Desconocido"));
            }
        })
        .catch(function(err) {
            // Si la Cloud Function aún no está desplegada o hay fallo de red, el sistema local sigue intacto
            console.warn("ℹ️ [MODO OFFLINE / LOCAL]: No se pudo contactar la Cloud Function aún. La operación permanece asegurada en la memoria local y se sincronizará luego. Detalle: " + err.message);
        });
    } catch(e) {
        console.error("Fallo silencioso en puente Cloud:", e.message);
    }
}

// 🛡️ INTERCEPTOR ADITIVO: Enganchamos la función guardarOperaciones sin alterar su comportamiento
if (typeof guardarOperaciones === "function") {
    var _guardarOriginalParaCloud = guardarOperaciones;
    guardarOperaciones = function(ops) {
        // 1. Ejecutamos tu guardado local intacto para respuesta en 0 ms
        _guardarOriginalParaCloud(ops);
        
        // 2. Si hay operaciones y la más reciente es recién radicada, disparar el envío a Cloud Functions
        try {
            if (ops && ops.length > 0) {
                var ultimaOp = ops[0]; // La radicación en cascada inserta al inicio del array (unshift)
                // Disparamos en segundo plano con 100 ms de margen
                setTimeout(function() { enviarRadicadoACloudFunction(ultimaOp); }, 100);
            }
        } catch(errCloud) {}
    };
}

// === MOTOR DE GOBIERNO: GESTIÓN DE ROLES (RBAC) Y MATRIZ DE ANS (100% FIRESTORE) ===
window.cacheUsuariosNube = [];

// Lista por defecto inicial
const USUARIOS_DEFECTO = [
    { nombre: "Laura (Bogotá)", correo: "lau@bold.co", rol: "solicitante", estado: "Activo", creado: "2026-01-10" },
    { nombre: "Felipe (Preparador Banco)", correo: "fel@bold.co", rol: "preparador", estado: "Activo", creado: "2026-01-10" },
    { nombre: "Kate (Check Final)", correo: "kat@bold.co", rol: "aprobador", estado: "Activo", creado: "2026-01-10" },
    { nombre: "Simon Valdez (Director)", correo: "simon.valdez@bold.co", rol: "maestro", estado: "Activo", creado: "2026-01-01" }
];

// 1. GESTIÓN DE USUARIOS Y ROLES (Lectura sincrónica desde RAM / Caché de Nube)
function obtenerUsuariosConfig() {
    if (window.cacheUsuariosNube && window.cacheUsuariosNube.length > 0) {
        return window.cacheUsuariosNube;
    }
    return USUARIOS_DEFECTO;
}

// Carga inicial y escucha directa desde Firestore
async function cargarUsuariosDesdeNube() {
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            const snapshot = await db.collection('usuarios').get();
            
            if (snapshot.empty) {
                // Si la colección está vacía en la nube, inicializamos con los usuarios por defecto
                for (const u of USUARIOS_DEFECTO) {
                    const docId = u.correo.replace(/[@.]/g, '_');
                    await db.collection('usuarios').doc(docId).set(u);
                }
                window.cacheUsuariosNube = USUARIOS_DEFECTO;
            } else {
                const usrs = [];
                snapshot.forEach(doc => usrs.push(doc.data()));
                window.cacheUsuariosNube = usrs;
            }
        }
    } catch (e) {
        console.error("❌ Error cargando usuarios desde Firestore:", e);
        window.cacheUsuariosNube = USUARIOS_DEFECTO;
    }
    return window.cacheUsuariosNube;
}

// Guardar usuarios directamente en Firestore
async function guardarUsuariosConfig(usuarios) {
    window.cacheUsuariosNube = usuarios;
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            for (const u of usuarios) {
                if (u && u.correo) {
                    const docId = u.correo.replace(/[@.]/g, '_');
                    await db.collection('usuarios').doc(docId).set(u, { merge: true });
                }
            }
        }
    } catch (e) {
        console.error("❌ Error guardando usuarios en Firestore:", e);
    }
}

async function guardarUsuariosConfig(lista) {
    window.cacheUsuariosNube = lista;
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            for (const u of lista) {
                if (u && u.correo) {
                    const docId = u.correo.replace(/[@.]/g, '_');
                    await db.collection('usuarios').doc(docId).set(u, { merge: true });
                }
            }
        }
    } catch (e) {
        console.error("❌ Error guardando usuarios en Firestore:", e);
    }
    
    if (typeof refrescarPantallasUniversales === 'function') {
        refrescarPantallasUniversales();
    }
}

// === 2. GESTIÓN DE MATRIZ DE ANS (SLA DE TESORERÍA EN MINUTOS - 100% FIRESTORE) ===
window.cacheANSNube = [];

const CONFIG_ANS_DEFECTO = [
    { prioridad: 1, nombre: "🔥 Prioridad 1 - Alta (Nómina/Impuestos/Urgente)", maxMontajeMin: 15, maxAprobacionMin: 10, alertaColor: "#991B1B" },
    { prioridad: 2, nombre: "⚡ Prioridad 2 - Media (Proveedores/Estándar)", maxMontajeMin: 30, maxAprobacionMin: 20, alertaColor: "#D97706" },
    { prioridad: 3, nombre: "☕ Prioridad 3 - Baja (OPEX Interno/Caja Menor)", maxMontajeMin: 60, maxAprobacionMin: 45, alertaColor: "#475569" }
];

// Lectura síncrona desde memoria RAM
function obtenerConfigANS() {
    if (window.cacheANSNube && window.cacheANSNube.length > 0) {
        return window.cacheANSNube;
    }
    return CONFIG_ANS_DEFECTO;
}

// Carga inicial e inicialización en Firestore
async function cargarConfigANSDesdeNube() {
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            const snapshot = await db.collection('config_ans').get();
            
            if (snapshot.empty) {
                // Si está vacía en la nube, subimos los defaults automáticamente
                for (const item of CONFIG_ANS_DEFECTO) {
                    await db.collection('config_ans').doc(`prio_${item.prioridad}`).set(item);
                }
                window.cacheANSNube = CONFIG_ANS_DEFECTO;
            } else {
                const items = [];
                snapshot.forEach(doc => items.push(doc.data()));
                items.sort((a, b) => a.prioridad - b.prioridad);
                window.cacheANSNube = items;
            }
        }
    } catch (e) {
        console.error("❌ Error cargando ANS desde Firestore:", e);
        window.cacheANSNube = CONFIG_ANS_DEFECTO;
    }
    return window.cacheANSNube;
}

// Guardar matriz de ANS en la nube
async function guardarConfigANS(lista) {
    window.cacheANSNube = lista;
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            const db = firebase.app().firestore();
            for (const item of lista) {
                if (item && item.prioridad) {
                    await db.collection('config_ans').doc(`prio_${item.prioridad}`).set(item, { merge: true });
                }
            }
        }
    } catch (e) {
        console.error("❌ Error guardando matriz ANS en Firestore:", e);
    }
    
    if (typeof refrescarPantallasUniversales === 'function') {
        refrescarPantallasUniversales();
    }
}



// Función para calcular si una operación está vencida según la configuración real
function auditarCumplimientoANS(operacion) {
    if (!operacion || !operacion.fechaRadicacion) return { vencido: false, minTranscurridos: 0, limiteMin: 30 };
    var config = obtenerConfigANS();
    var prio = operacion.prioridad || 2;
    var regla = config.find(function(c) { return c.prioridad === prio; }) || config[1];
    
    // Si está en preparación, medimos contra maxMontajeMin; si está en aprobación, contra maxAprobacionMin
    var limite = (operacion.estado === "En Aprobación") ? regla.maxAprobacionMin : regla.maxMontajeMin;
    return { vencido: false, limiteMin: limite, regla: regla };
}

// === MOTOR CLIENTE: FIREBASE CLOUD TRANSACTIONS & WEBSOCKETS ===
var NUBE_API = {
    radicar: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiRadicarOperacion",
    validarKYC: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiValidarKYC",
    montar: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiRegistrarMontaje",
    aprobar: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiAprobarMontaje",
    cerrar: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiCerrarComprobante",
    rechazar: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiRechazarOperacion",
    guardarUsuarios: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiGuardarUsuarios",
    guardarANS: "https://us-central1-black-hulling-462522-j2.cloudfunctions.net/apiGuardarANS"
};

function iniciarEscuchadoresNubeEnVivo() {
    try {
        if (typeof firebase !== "undefined" && firebase.firestore) {
            var db = firebase.app().firestore();
            console.log("🟢 [TIEMPO REAL]: Conectado a Firestore sin almacenamiento local");
            
            // 1. Escuchador de Operaciones en Tiempo Real
            db.collection("operaciones").onSnapshot(function(snapshot) {
                var opsNube = [];
                snapshot.forEach(function(doc) { opsNube.push(doc.data()); });
                
                // Ordenamos por fecha ISO más reciente
                opsNube.sort(function(a, b) {
                    return new Date(b.fechaISO || '2026-01-01') - new Date(a.fechaISO || '2026-01-01');
                });
                
                // Actualizamos la caché global en RAM
                window.cacheOperacionesNube = opsNube;
                
                if (typeof refrescarPantallasUniversales === "function") refrescarPantallasUniversales();
                else if (typeof renderizarTabla === "function") renderizarTabla();
            }, function(e) {
                console.error("Error en radar de operaciones:", e);
            });

            // 2. Escuchador de Usuarios en Tiempo Real
            db.collection("usuarios").onSnapshot(function(snapshot) {
                var usrsNube = [];
                snapshot.forEach(function(doc) { usrsNube.push(doc.data()); });
                if (usrsNube.length > 0) {
                    window.cacheUsuariosNube = usrsNube;
                    if (typeof renderizarUsuarios === "function") renderizarUsuarios();
                }
            }, function(e) {
                console.error("Error en radar de usuarios:", e);
            });

            // 3. Escuchador de Matriz ANS en Tiempo Real
            db.collection("config_ans").onSnapshot(function(snapshot) {
                console.log("⚡ [WEBSOCKET ANS] Cambio detectado en tiempo real desde Google Cloud!");
                var ansNube = [];
                snapshot.forEach(function(doc) { ansNube.push(doc.data()); });
                if (ansNube.length > 0) {
                    ansNube.sort(function(a, b) { return a.prioridad - b.prioridad; });
                    window.cacheANSNube = ansNube;
                    if (typeof renderizarTablaANS === "function") renderizarTablaANS(ansNube);
                    if (typeof renderizarANS === "function") renderizarANS();
                }
            }, function(e) {
                console.error("Error en radar ANS:", e);
            });
        }
    } catch(e) {
        console.error("Error iniciando escuchadores en vivo:", e);
    }
}

if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", iniciarEscuchadoresNubeEnVivo);
}

function invocarCloudAPI(url, payload, callbackExito) {
    var usr = JSON.parse(sessionStorage.getItem("usuarioLogueado") || "{}");
    payload.usuario = usr;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.exito) {
            if (callbackExito) callbackExito(data);
        } else {
            alert("❌ BLOQUEO DE SEGURIDAD RBAC EN LA NUBE:\n\n" + (data.error || "Desconocido"));
        }
    })
    .catch(function(err) { alert("⚠️ Error de conexión: " + err.message); });
}

function validarKYCOperacion(rad) {
    if (confirm("🛡️ CHECK DE CUMPLIMIENTO (KYC):\n\n¿Confirmas que has verificado la legitimidad de la cuenta para el radicado " + rad + " y autorizas pasar a preparación en banco?")) {
        invocarCloudAPI(NUBE_API.validarKYC, { radicado: rad }, function(res) {
            alert("✅ ¡Revisión KYC Aprobada con Éxito en la Nube!\nLa operación " + rad + " ha cambiado a estado En Preparación.");
            if (typeof refrescarPantallasUniversales === "function") refrescarPantallasUniversales();
        });
    }
}

function subirArchivoAStorage(file, radicado, tipo) {
    if (!file) return Promise.reject(new Error('No hay archivo para subir.'));
    if (typeof firebase === 'undefined' || !firebase.storage) {
        return Promise.reject(new Error('Firebase Storage no está inicializado.'));
    }
    var storage = firebase.storage();
    var extension = file.name && file.name.indexOf('.') > -1 ? file.name.substring(file.name.lastIndexOf('.')) : '';
    var nombreArchivo = radicado + '_' + tipo + extension;
    return storage.ref('evidencias/' + nombreArchivo).put(file).then(function(snapshot) {
        return snapshot.ref.getDownloadURL();
    });
}

function abrirModalSubidaEvidencia(radicado, tipo, titulo, descripcion) {
    var modal = document.getElementById('modalSubidaEvidencia');
    var input = document.getElementById('inputSubidaEvidencia');
    var tituloEl = document.getElementById('tituloSubidaEvidencia');
    var textoEl = document.getElementById('textoSubidaEvidencia');
    if (!modal || !input || !tituloEl || !textoEl) return;
    modal.dataset.radicado = radicado;
    modal.dataset.tipo = tipo;
    tituloEl.textContent = titulo;
    textoEl.textContent = descripcion;
    input.value = '';
    modal.style.display = 'flex';
}

function cerrarModalSubidaEvidencia() {
    var modal = document.getElementById('modalSubidaEvidencia');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('btnConfirmarSubidaEvidencia');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var modal = document.getElementById('modalSubidaEvidencia');
        var input = document.getElementById('inputSubidaEvidencia');
        if (!modal || !input) return;
        var radicado = modal.dataset.radicado;
        var tipo = modal.dataset.tipo;
        var file = input.files[0];
        if (!radicado || !tipo) return;
        if (!file) {
            alert('⚠️ Debes seleccionar un archivo antes de continuar.');
            return;
        }
        btn.disabled = true;
        btn.textContent = 'Subiendo...';
        subirArchivoAStorage(file, radicado, tipo)
        .then(function(urlArchivo) {
            var db = firebase.app().firestore();
            var docId = radicado.replace(/\//g, '-');
            if (tipo === 'screenshot') {
                return db.collection('operaciones').doc(docId).update({
                    estado: 'En Aprobación',
                    archivoScreenshot: urlArchivo,
                    fechaMontaje: new Date().toISOString()
                });
            }
            return db.collection('operaciones').doc(docId).update({
                estado: 'COMPLETADA / CERRADA ✓',
                archivoPDF: urlArchivo,
                comprobanteCerrado: true,
                fechaCierre: new Date().toISOString()
            });
        })
        .then(function() {
            cerrarModalSubidaEvidencia();
            if (typeof refrescarPantallasUniversales === 'function') refrescarPantallasUniversales();
        })
        .catch(function(error) {
            console.error('Error al subir evidencia:', error);
            alert('❌ No se pudo subir el archivo: ' + (error.message || error));
        })
        .finally(function() {
            btn.disabled = false;
            btn.textContent = 'Subir archivo';
        });
    });
});

if (typeof enviarAAprobador === "function") {
    enviarAAprobador = function(rad) {
        abrirModalSubidaEvidencia(rad, 'screenshot', '📸 Subir evidencia del montaje bancario', 'Adjunta el screenshot del portal bancario para enviar la operación a aprobación.');
    };
}

if (typeof confirmarPagoFinal === "function") {
    confirmarPagoFinal = function(rad) {
        var usr = JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}');
        var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : [];
        var op = ops.find(function(o) { return o.radicado === rad; });
        if (!op) return;
        op.estado = 'APROBADO';
        op.enTransito = false;
        op.comprobanteCerrado = false;
        op.historial = op.historial || [];
        op.historial.push({
            fecha: typeof obtenerFechaHoraMilitar === 'function' ? obtenerFechaHoraMilitar() : new Date().toLocaleString(),
            paso: '4. CHECK FINAL',
            detalle: 'Liberación final por ' + (usr.nombre || 'Aprobador') + '.'
        });
        if (typeof guardarOperaciones === 'function') guardarOperaciones(ops);
        if (typeof crearNotificacion === 'function') crearNotificacion(rad, '🏁 ¡Check Final! ' + rad + ' quedó APROBADO.', true);
        alert('✅ ¡Check Final Exitoso! La operación quedó en estado APROBADO.');
        if (typeof refrescarPantallasUniversales === 'function') refrescarPantallasUniversales();
    };
}

if (typeof finalizarYCerrarComprobante === "function") {
    finalizarYCerrarComprobante = function(rad) {
        abrirModalSubidaEvidencia(rad, 'cierre', '📄 Subir PDF definitivo de cierre', 'Adjunta el PDF final del comprobante para cerrar la operación y registrar la evidencia definitiva.');
    };
}


// =====================================================================
// 🚀 CONEXIÓN DIRECTA Y SEGURA A FIRESTORE (TREASURYBACKOFFICE)
// =====================================================================

enviarRadicadoACloudFunction = function(operacion) {
    try {
        if (!operacion || !operacion.radicado) return;
        if (operacion.estado !== "Pendiente Validación" && operacion.estado !== "Pendiente Preparación") return;

        // 1. Limpiar el ID: Firebase prohíbe las diagonales (/)
        var docIdSeguro = operacion.radicado.replace(/\//g, "-");
        operacion.radicado = docIdSeguro; // Actualizamos el objeto también
        
        console.log("☁️ [PUENTE DIRECTO] Escribiendo radicado en Firestore: " + docIdSeguro);

        // 2. Conexión explícita a la base de datos correcta
        if (typeof firebase !== "undefined" && firebase.app) {
            // Aquí obligamos a Firebase a ignorar (default) y usar treasurybackoffice
            var db = firebase.app().firestore();
            
            db.collection("operaciones").doc(docIdSeguro).set(operacion)
            .then(function() {
                console.log("🟢 [FIRESTORE OK]: ¡Operación " + docIdSeguro + " guardada exitosamente en la nube!");
            })
            .catch(function(err) {
                console.error("⚠️ [FIRESTORE ERROR]: " + err.message);
            });
        } else {
            console.error("⚠️ [ERROR]: Las librerías de Firebase no están cargadas.");
        }
    } catch(e) { console.error("Fallo en puente Firestore:", e.message); }
};


// =====================================================================
// 🧹 OVERRIDE DEFINITIVO: CONEXIÓN PURA COMPAT (SIN MODULAR)
// =====================================================================

window.enviarRadicadoACloudFunction = function(operacion) {
    try {
        if (!operacion || !operacion.radicado) return;
        if (operacion.estado !== "Pendiente Validación" && operacion.estado !== "Pendiente Preparación") return;

        // 1. Limpiar el ID: Firebase prohíbe las diagonales (/)
        var docIdSeguro = operacion.radicado.replace(/\//g, "-");
        operacion.radicado = docIdSeguro; 
        
        console.log("☁️ [PUENTE DIRECTO] Escribiendo radicado en Firestore: " + docIdSeguro);

        // 2. Conexión explícita usando el SDK Compat (Garantizado)
        if (typeof firebase !== "undefined" && firebase.app) {
            var db = firebase.app().firestore();
            
            db.collection("operaciones").doc(docIdSeguro).set(operacion)
            .then(function() {
                console.log("🟢 [FIRESTORE OK]: ¡Operación " + docIdSeguro + " guardada exitosamente en la nube!");
            })
            .catch(function(err) {
                console.error("⚠️ [FIRESTORE ERROR]: " + err.message);
            });
        } else {
            console.error("⚠️ [ERROR]: Las librerías de Firebase no están cargadas.");
        }
    } catch(e) { console.error("Fallo en puente Firestore:", e.message); }
};

window.invocarCloudAPI = function(url, payload, callbackExito) {
    if (typeof firebase === "undefined" || !firebase.app) return alert("Firebase no está conectado.");
    
    var docIdSeguro = payload.radicado.replace(/\//g, "-");
    var actualizacion = {};
    
    if (url.includes("apiValidarKYC")) actualizacion = { estado: "En Preparación" };
    else if (url.includes("apiRegistrarMontaje")) actualizacion = { estado: "En Aprobación", archivoScreenshot: payload.archivoScreenshot };
    else if (url.includes("apiAprobarMontaje")) actualizacion = { estado: "APROBADO" };
    else if (url.includes("apiCerrarComprobante")) actualizacion = { estado: "COMPLETADA / CERRADA ✓", archivoPDF: payload.archivoPDF, comprobanteCerrado: true };
    else if (url.includes("apiRechazarOperacion")) actualizacion = { estado: "RECHAZADO", motivoRechazo: payload.motivo || "" };

    var db = firebase.app().firestore();
    db.collection("operaciones").doc(docIdSeguro).update(actualizacion)
    .then(function() {
        if (callbackExito) callbackExito({ exito: true });
    })
    .catch(function(err) {
        alert("⚠️ Error al actualizar en Firestore: " + err.message);
    });
};
// ==========================================
// FILTRO DE FECHAS GLOBAL
// ==========================================
window.coincideFechaFiltro = function(op) {
    var input = document.getElementById("filtro-fecha");
    var fechaInput = input ? input.value : "";
    if (!fechaInput) return true;
    if (!op || !op.fechaRadicacion) return false;
    
    var limpiaOp = String(op.fechaRadicacion).split(" - ")[0].trim();
    var partes = limpiaOp.split("/");
    if (partes.length !== 3) return false;
    var fNorm = partes[2] + "-" + String(partes[1]).padStart(2, "0") + "-" + String(partes[0]).padStart(2, "0");
    return fNorm === fechaInput;
}; // 👈 ¡Esta era la llave de cierre que faltaba!

// ============================================================================
// 🔄 SINCRONIZADOR GLOBAL DE PANTALLAS (Aplica para todos los roles)
// ============================================================================

window.refrescarPantallasUniversales = function() {
    // Si la página en la que estamos tiene una tabla, la redibuja
    if (typeof renderizarTabla === 'function') {
        renderizarTabla();
    }
};

// Apenas cargue cualquier página (Solicitante, Preparador, Aprobador), dibuja la tabla inicial
document.addEventListener("DOMContentLoaded", function() {
    if (typeof renderizarTabla === 'function') {
        renderizarTabla();
    }
});
// ============================================================================
// 🚦 MOTOR DE ENRUTAMIENTO SPA (SINGLE PAGE APPLICATION) - 100% SESIÓN LIMPIA
// ============================================================================
function activarVistaPorRol() {
    var usrRaw = sessionStorage.getItem("usuarioLogueado") || "{}";
    var usr = JSON.parse(usrRaw);
    var rol = String(usr.rol || "solicitante").toLowerCase().trim();

    // 1. Apagamos TODAS las cajas de la pantalla
    var vistas = document.querySelectorAll(".vista-rol");
    vistas.forEach(function(v) { v.style.display = "none"; });

    // 2. Encendemos SOLO la caja correspondiente al rol
    if (rol === "solicitante") {
        var vSol = document.getElementById("vista-solicitante");
        if (vSol) vSol.style.display = "block";
        
    } else if (rol === "preparador") {
        var vPrep = document.getElementById("vista-preparador");
        if (vPrep) vPrep.style.display = "block";
        if (typeof renderizarTabla === "function") renderizarTabla(); // Obliga a pintar su tabla
        
    } else if (rol === "aprobador") {
        var vApro = document.getElementById("vista-aprobador");
        if (vApro) vApro.style.display = "block";
        if (typeof renderizarTabla === "function") renderizarTabla(); // Obliga a pintar su tabla
        
    } else if (rol === "maestro") {
        // El Maestro ve todo
        vistas.forEach(function(v) { v.style.display = "block"; });
    }
}

// Enganchamos el enrutador para que se ejecute apenas cargue la página
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes("dashboard.html")) {
        activarVistaPorRol();
    }
});
