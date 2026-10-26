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
// Fuente: formulario "Operaciones de Tesorería".
// Niveles: 1 Tipo de Pago > 2 Tipo de Operación > 3 País > 4 Empresa Origen > 5 Cuenta Origen > 6 Empresa Destino > 7 Cuenta Destino
const TIPIFICACION_TESORERIA = {
    operaciones: {
    "comp": [
        "Confirmación abono por adquirencia",
        "Pago de compensación CUD",
        "Pago de compensación por Emisión",
        "Pago de compensación Redeban",
        "Pago de compensación Servibanca",
        "Pago de compensación por TC",
        "Ajuste Notas Débitos y Créditos",
        "Pago Costos Fijos Servibanca"
    ],
    "nom": [
        "Colaboradores (reembolsos, viáticos, etc)",
        "Pacto Colectivo - Cheque",
        "Pacto Colectivo - PSE",
        "Pacto Colectivo - Transferencia"
    ],
    "pay": [
        "Ajustes de nómina",
        "Pago de liquidaciones",
        "Pago de nómina",
        "Pagos a SENA",
        "Pagos AFC / Voluntarios - PSE",
        "Pagos AFC / Voluntarios - Cheque",
        "Pagos parciales de cesantias",
        "Desembolso de Libranzas",
        "Pago de Embargos",
        "Pago Seguridad Social",
        "Pacto Colectivo - PSE"
    ],
    "prov": [
        "Cheques por Ventanilla",
        "Devoluciones a Merchants",
        "Efectivo por Ventanilla",
        "Embargos",
        "Pago TC Bancolombia",
        "Pagos Customer Experience",
        "Pagos Customer Success",
        "Proveedores Internacionales",
        "Proveedores Locales",
        "Proveedores Locales - PSE",
        "Registro cuenta propia y/o terceros",
        "Impuestos - PSE",
        "Impuestos - Cheque",
        "Impuestos - Transferencias",
        "Impuestos - Efectivo por Ventanilla",
        "Inscripción Débito Automático - Tesorería",
        "FOGAFIN",
        "Débito Automático Inscripción - Pago Proveedores",
        "Débito Automático Programación - Pago Proveedores",
        "Débito Automático Actualización - Pago Proveedores",
        "Débito Automático Recaudos - Créditos",
        "Débito Automático Novedades - Créditos"
    ],
    "tras": [
        "Adición FIC Agregadora Bold. CF: Credicorp 1-1-58903-3 CCA COP",
        "Adición FIC Agregadora Bold. CO: Credicorp 1-1-56053-5 CCA COP",
        "Adición FIC Operativa Bold. CO: Credicorp 1-1-56054-4 CCA COP",
        "Retiros FIC Agregadora Bold. CF: Credicorp 1-1-58903-3 CCA COP",
        "Retiros FIC Agregadora Bold. CO: Credicorp 1-1-56053-5 CCA COP",
        "Retiros FIC Operativa Bold. CO: Credicorp 1-1-56054-4 CCA COP",
        "Traslados Entre Cuentas",
        "Traslados CUD",
        "Recaudo TC",
        "Recaudo Crédito Cupo Bold",
        "Adición Dentro APT",
        "Adición fuera APT",
        "Recarga PSE",
        "Retiro Cuenta de Administración Valores"
    ]
},
    tipoPago: {
    "Compensación": "comp",
    "Nómina": "nom",
    "Payroll": "pay",
    "Proveedores": "prov",
    "Traslados": "tras",
    "PSE Cash In": "prov",
    "Ajuste Notas Débitos y Créditos": "comp",
    "Débitos Aútomaticos - Créditos": "prov"
},
    origen: {
    "Bold CO": [
        "Bold. CO: Davivienda 451770073547 Ahorros COP",
        "Bold. CO: Bancolombia 04000000126 Ahorros COP",
        "Bold. CO: Bancolombia 04000004981 Ahorros COP",
        "Bold. CO: Bancolombia 04000006579 Corriente COP",
        "Bold. CO: Bancolombia 04000000573 Ahorros COP",
        "Bold. CO: Bancolombia 04000001617 Ahorros COP",
        "Bold. CO: Bancolombia 04000029802 Ahorros COP",
        "Bold. CO: Bancolombia 04000005928 Ahorros COP",
        "Bold. CO: Bancolombia 65200002824 Ahorros COP",
        "Bold. CO: Corredores Davivienda I 1-1-A-1 CCA COP",
        "Bold. CO: Serfinanzas 221000016150 Corriente COP",
        "Bold. CO: Scotiabank 161070270 Corriente COP",
        "Bold. CO: Scotiabank 0112998066 Ahorros COP",
        "Bold. CO: Citibank COL 0089550017 Corriente COP",
        "Bold. CO: Citibank COL 0089550025 Corriente COP",
        "Bold. CO: Citibank NY 36448843 Corriente USD",
        "Bold. CO: Bancolombia 547480****6163 TC MC COP",
        "Bold. CO: Bold CF 000008024755 Deposito COP",
        "Bold. CO: Bold CF 170012719183 Punto Red - Pagos y Recargas",
        "Bold. CO: Bold CF 170017479822 Recaudo datáfonos inbound",
        "Bold. CO: Bold CF 170014863016 QR",
        "Bold. CO: Bold CF 170011844070 PO´S ACH - QR Agregador",
        "Bold. CO: Credicorp 1-1-56053-5 CCA COP",
        "Bold. CO: Credicorp 1-1-56054-4 CCA COP",
        "Bold. CO: Bold CF 170014863016",
        "Bold CO - Bold CF 1700-1602-0586 Ahorros COP - nómina",
        "Bold CO: BBVA 0432000412 Ahorros COP",
        "Vendemás: BCP MN 191-8591606-0-96 Soles",
        "Vendemás: BCP MN 191-8591607-0-06 Soles",
        "Vendemás: BCP MN 191-8591608-0-16 Soles",
        "Vendemás: BCP MN 191-8740048-0-11 Soles",
        "Vendemás: BCP MN 191-9409795-0-32 Soles",
        "Vendemás: BCP MN 191-9410871-0-01 Soles",
        "Vendemás: BCP MN 1919914041027 Soles",
        "Vendemás: BCP MN 194-2451630-0-38 Soles",
        "Vendemás: BCP MN 194-2473891-0-96 Soles",
        "Vedemás: BN VM 00-003-234045 Soles",
        "Vendemás: BBVA MN 0100072003 Soles",
        "Vendemás: BCP ME: 194-2454542-1-62 USD"
    ],
    "Bold CF": [
        "Bold. CF: Bancolombia 04000002167 Ahorros COP",
        "Bold. CF: Silicon Valley Bank 3303688751 Corriente USD",
        "Bold. CF: Credicorp 1-1-58903-3 CCA COP",
        "Bold. CF: Scotiabank 0152999019 Ahorros COP",
        "Bold. CF: Jp Morgan 2600000209 Corriente COP",
        "Bold. CF: Jp Morgan NY 523551565 Corriente USD",
        "Bold. CF: Citibank COL 0090923013 Corriente COP",
        "Bold. CF: Citibank COL 0090923021 Corriente COP (link CUD)",
        "Bold CF: BanRep - 62108160 CUD COP",
        "Bold. CF: Bold CF - 170013569539 COP",
        "Bold. CF: Citibank -36498883 Corriente USD",
        "Bold CF - Bold CF 1700-1047-2157 Ahorros COP - nómina",
        "Bold CF - Bold CF25061001(Cuenta Contable)",
        "Bold. CF: Credicorp N° CTA: 34707 Cod 102 Port 0",
        "Bold. CF: Credicorp N° de CTA: 901522349-3 Cod 102 Port 0",
        "Bold. CF: Banco de Bogotá Cta Cte 0039889878 COP"
    ],
    "Bold Capital": [
        "Bold Capital: Bancolombia 04000003879 Ahorros COP",
        "Bold Capital: Bancolombia 19300001947 Ahorros COP",
        "Bold Capital: Bold CF 1700-1050-5296 Ahorros COP - nómina",
        "Bold Capital: BBVA 0432000421 Ahorros COP"
    ]
},
    destino: [
    "Bold. CO: Davivienda 451770073547 Ahorros COP",
    "Bold. CO: Bancolombia 04000000126 Ahorros COP",
    "Bold. CO: Bancolombia 04000006579 Corriente COP",
    "Bold. CO: Bancolombia 04000000573 Ahorros COP",
    "Bold. CO: Bancolombia 04000001617 Ahorros COP",
    "Bold. CO: Bancolombia 04000029802 Ahorros COP",
    "Bold. CO: Bancolombia 04000005928 Ahorros COP",
    "Bold. CO: Bancolombia 04000004981 Ahorros COP",
    "Bold. CO: Bancolombia 65200002824 Ahorros COP",
    "Bold. CO: Corredores Davivienda I 1-1-A-1 CCA COP",
    "Bold. CO: Serfinanzas 221000016150 Corriente COP",
    "Bold. CO: Scotiabank 161070270 Corriente COP",
    "Bold. CO: Scotiabank 0112998066 Ahorros COP",
    "Bold. CO: Citibank COL 0089550017 Corriente COP",
    "Bold. CO: Citibank COL 0089550025 Corriente COP",
    "Bold. CO: Citibank NY 36448843 Corriente USD",
    "Bold. CO: Bancolombia 547480****6163 TC MC COP",
    "Bold. CO: Bold CF 000008024755 Deposito COP",
    "Bold. CO: Bold CF 170012719183 Punto Red - Pagos y Recargas",
    "Bold. CO: Bold CF 170017479822 Recaudo datáfonos inbound",
    "Bold. CO: Bold CF 170011844070 PO´S ACH - QR Agregador",
    "Bold. CO: Credicorp 1-1-56053-5 CCA COP",
    "Bold. CO: Credicorp 1-1-56054-4 CCA COP",
    "Bold. CF: Bancolombia 04000002167 Ahorros COP",
    "Bold. CF: Silicon Valley Bank 3303688751 Corriente USD",
    "Bold. CF: Scotiabank 0152999019 Ahorros COP",
    "Bold. CF: Jp Morgan 2600000209 Corriente COP",
    "Bold. CF: Jp Morgan NY 523551565 Corriente USD",
    "Bold. CF: Citibank COL 0090923013 Corriente COP",
    "Bold. CF: Citibank COL 0090923021 Corriente COP (link CUD)",
    "Bold CF: BanRep - 62108160 CUD COP",
    "Bold CF: ACH - 65818221 COP PORT 0 TRANSFIYA",
    "Bold. CF: Credicorp Sebra 62250113 COD 102 Portaf 0 COP",
    "Bold. CF: MCCA COD 163 Sebra 65818197 Portaf 0 COP (Compensación)",
    "Bold. CF: Servibanca COD 152 Sebra 62011200 Portaf 0 COP (Compensación)",
    "Bold. CF: Redeban COD 154 Sebra 65818210 Portaf 0 COP (Compensación)",
    "Bold. CF: Redeban COD 117 Sebra 65818210 Portaf 0 COP (Comisión)",
    "Bold. CO: Bold CF 170014863016 QR",
    "Bold Capital: Bancolombia 04000003879 Ahorros COP",
    "Bold Capital: Bancolombia 19300001947 Ahorros COP",
    "N/A",
    "Bold. CF: Citibank -36498883 Corriente USD",
    "Bold. CF: Bold CF - 170013569539 COP",
    "Bold. CF: Fogafin COD 117 Sebra 62090022 Portaf 1 COP (Prima Fogafin )",
    "Bold. CF: Sebra 62010905 Portaf 0 COP COD 102 Citibank COL 0090923021 (Traslado CUD CITI)",
    "Bold. CF: Sebra CUD 62250113 Portafolio 0 COD 102 Credicorp Capital",
    "Bold. CF: Sebra CUD 62010707 Portafolio 25 COD 102 Bancolombia",
    "Bold. CF: B2B Citi Credicorp NIT 8300462686 cta AH 5083808014",
    "Bold CO - Bold CF 1700-1602-0586 Ahorros COP - nómina",
    "Bold CF - Bold CF 1700-1047-2157 Ahorros COP - nómina",
    "Bold Capital: Bold CF 1700-1050-5296 Ahorros COP - nómina",
    "Bold CF - 41151024 Cuenta de Ingreso (Cuenta Contable)",
    "Bold CF: Credicorp Capital Alta Liquidez NIT 830046268 Cta Ahorros 03181146167",
    "Bold CO: BBVA 0432000412 Ahorros COP",
    "Bold Capital: BBVA 0432000421 Ahorros COP",
    "Bold. CF: Servibanca COD 117 Sebra 62011200 Portaf 0 COP (Costos Fijos)"
],
    nomina: [
    "Bold CO - Bancolombia 04000004981 Ahorros COP",
    "Bold CF - Bancolombia 04000002167 Ahorros COP",
    "Bold Capital - Bancolombia 04000003879 Ahorros COP",
    "Bold CO - Bold CF 1700-1602-0586 Ahorros COP",
    "Bold CF - Bold CF 1700-1047-2157 Ahorros COP",
    "Bold Capital: Bold CF 1700-1050-5296 Ahorros COP",
    "Vendemás: BCP MN 191-8740048-0-11 Soles"
]
};

function empresaDeCuenta(cta) {
    var t = String(cta || "");
    if (/^Bold\.? ?CO/i.test(t) || /^Vend[eé]m[aá]s|^Vedem[aá]s/i.test(t)) return "Bold CO";
    if (/^Bold\.? ?CF/i.test(t)) return "Bold CF";
    if (/^Bold Capital/i.test(t)) return "Bold Capital";
    return "Otros";
}

function construirArbolTesoreria(T) {
    // Destinos agrupados por empresa (objetos compartidos, no se duplican en memoria)
    var destinos = {};
    T.destino.forEach(function(c) {
        var e = c === "N/A" ? "N/A" : empresaDeCuenta(c);
        (destinos[e] = destinos[e] || []).push(c);
    });
    var porEmpresa = {};
    Object.keys(T.origen).forEach(function(emp) {
        porEmpresa[emp] = {};
        T.origen[emp].forEach(function(cta) { porEmpresa[emp][cta] = destinos; });
    });
    var nominaPorEmpresa = {};
    T.nomina.forEach(function(cta) {
        var e = empresaDeCuenta(cta);
        nominaPorEmpresa[e] = nominaPorEmpresa[e] || {};
        nominaPorEmpresa[e][cta] = { [e]: ["N/A"] };   // Payroll no tiene cuenta destino en el formulario
    });
    var paises = ["Colombia", "Perú"];
    var arbol = {};
    Object.keys(T.tipoPago).forEach(function(tp) {
        var esPayroll = tp === "Payroll";
        var base = esPayroll ? nominaPorEmpresa : porEmpresa;
        arbol[tp] = {};
        T.operaciones[T.tipoPago[tp]].forEach(function(op) {
            arbol[tp][op] = {};
            paises.forEach(function(p) { arbol[tp][op][p] = base; });
        });
    });
    return arbol;
}

const arbolOperaciones = construirArbolTesoreria(TIPIFICACION_TESORERIA);

// Ramas operativas anteriores (alimentan el modo Excel masivo)
arbolOperaciones["Inversiones y Pactos"] = {
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
};
arbolOperaciones["Impuestos y Taxes"] = {
    "Impuestos Nacionales": {
        "Portal DIAN": {
            "Bold CO": {
                "Bancolombia - *1234": {
                    "DIAN Colombia": ["Cuenta Única Nacional DIAN"]
                }
            }
        }
    }
};
arbolOperaciones["Dispersión Masiva"] = {
    "Dispersión PSE": {
        "Lote ACH": {
            "Bold CO": {
                "Bancolombia - *1234": {
                    "ACH Colombia (PSE)": ["Convenio Dispersión Lote #99"]
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
        var escaparDoc = function(valor) {
            return String(valor).replace(/[&<>"']/g, function(caracter) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caracter];
            });
        };
        var urlSeguraEvidencia = function(valor) {
            try {
                var url = new URL(String(valor || ""), window.location.href);
                return url.protocol === "https:" ? url.href : "";
            } catch (error) {
                return "";
            }
        };
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
        var screenshotUrl = urlSeguraEvidencia(op.archivoScreenshot);
        if (screenshotUrl) {
            docHtml += '<div style="margin-top:12px; padding-top:10px; border-top:1px solid #E2E8F0;">' +
                '<strong style="font-size:12px; color:#0F172A;">🖼️ Evidencia del montaje bancario</strong>' +
                '<div style="margin-top:6px;"><a href="' + escaparDoc(screenshotUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#2563EB;">Abrir imagen en otra pestaña ↗</a></div>' +
                '<img src="' + escaparDoc(screenshotUrl) + '" alt="Captura del montaje bancario" style="display:block; max-width:100%; max-height:320px; margin-top:8px; border:1px solid #CBD5E1; border-radius:6px; object-fit:contain;">' +
            '</div>';
        }
        var pdfUrl = urlSeguraEvidencia(op.archivoPDF);
        if (pdfUrl) {
            docHtml += '<div style="margin-top:12px; padding-top:10px; border-top:1px solid #E2E8F0;">' +
                '<strong style="font-size:12px; color:#0F172A;">📄 Comprobante PDF de cierre</strong>' +
                '<div style="margin-top:6px;"><a href="' + escaparDoc(pdfUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#2563EB;">Abrir PDF en otra pestaña ↗</a></div>' +
                '<iframe title="Comprobante PDF de cierre" src="' + escaparDoc(pdfUrl) + '" style="width:100%; height:280px; margin-top:8px; border:1px solid #CBD5E1; border-radius:6px;"></iframe>' +
            '</div>';
        }
        if (op.observacionesCierre && String(op.observacionesCierre).trim()) {
            docHtml += '<div style="margin-top:12px; padding:10px; background:#F1F5F9; border-left:3px solid #0F766E; border-radius:4px;">' +
                '<strong style="font-size:12px; color:#0F172A;">📝 Observaciones del Preparador</strong>' +
                '<p style="margin:6px 0 0; color:#334155; font-size:12px; white-space:pre-wrap;">' + escaparDoc(op.observacionesCierre) + '</p>' +
            '</div>';
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


// === RADAR EN VIVO Y MOTOR DE TABLA ROBUSTO (SIN F5 - 100% FIRESTORE) ===
function actualizarRadarYTablaEnVivo() {
    try {
        var tb = document.getElementById("tabla-recientes");
        if (!tb) return;
        
        // Obtenemos las operaciones traídas directamente desde la nube
        var opsBase = typeof obtenerOperaciones === "function" ? (obtenerOperaciones() || []) : (window.cacheOperacionesNube || []);
        var ops = filtrarOperacionesPorPais(opsBase);
        
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

function normalizarPaisActivo(pais) {
    var valor = String(pais || "").trim().toLowerCase();
    if (valor === "colombia" || valor === "co") return "Colombia";
    if (valor === "peru" || valor === "perú" || valor === "pe") return "Perú";
    return "";
}

function obtenerPaisActivo() {
    try {
        var paisGuardado = normalizarPaisActivo(localStorage.getItem("paisActivoOperaciones"));
        if (paisGuardado) return paisGuardado;
    } catch (error) {}
    var usuario = JSON.parse(sessionStorage.getItem("usuarioLogueado") || "{}");
    return normalizarPaisActivo(usuario.pais) || "Colombia";
}

function filtrarOperacionesPorPais(operaciones) {
    var paisActivo = obtenerPaisActivo();
    return (operaciones || []).filter(function(operacion) {
        return normalizarPaisActivo(operacion.pais) === paisActivo;
    });
}

function cambiarPaisActivo(pais) {
    var paisValido = normalizarPaisActivo(pais);
    if (!paisValido) return;
    try {
        localStorage.setItem("paisActivoOperaciones", paisValido);
    } catch (error) {
        console.error("No se pudo guardar el país activo:", error);
    }
    var selector = document.getElementById("selector-pais-activo");
    if (selector) selector.value = paisValido;
    if (typeof renderizarTabla === "function") renderizarTabla();
    if (typeof actualizarRadarYTablaEnVivo === "function") actualizarRadarYTablaEnVivo();
}

window.notificacionesUsuario = window.notificacionesUsuario || [];
window.emailEscuchaNotificaciones = window.emailEscuchaNotificaciones || "";

function renderizarNotificacionesUsuario() {
    var lista = document.getElementById("lista-notificaciones");
    var contador = document.getElementById("contador-notificaciones");
    if (!lista || !contador) return;
    var noLeidas = window.notificacionesUsuario.filter(function(notificacion) { return !notificacion.leida; });
    contador.textContent = noLeidas.length > 99 ? "99+" : String(noLeidas.length);
    contador.style.display = noLeidas.length ? "inline-flex" : "none";
    lista.replaceChildren();

    if (!window.notificacionesUsuario.length) {
        var vacio = document.createElement("p");
        vacio.textContent = "No tienes notificaciones.";
        vacio.style.cssText = "padding:14px; margin:0; color:#64748B; font-size:12px;";
        lista.appendChild(vacio);
        return;
    }

    window.notificacionesUsuario.forEach(function(notificacion) {
        var fila = document.createElement("div");
        fila.style.cssText = "padding:12px; border-bottom:1px solid #E2E8F0; background:" + (notificacion.leida ? "white" : "#F0F9FF") + ";";
        var mensaje = document.createElement("p");
        mensaje.textContent = notificacion.mensaje || ("Cambio de estado: " + (notificacion.estado || ""));
        mensaje.style.cssText = "margin:0 0 6px; color:#0F172A; font-size:12px; line-height:1.4;";
        fila.appendChild(mensaje);

        var metadata = document.createElement("div");
        var fecha = notificacion.fechaCreacion && typeof notificacion.fechaCreacion.toDate === "function"
            ? notificacion.fechaCreacion.toDate()
            : null;
        metadata.textContent = (notificacion.radicado || "") + (fecha ? " · " + fecha.toLocaleString("es-CO") : "");
        metadata.style.cssText = "color:#64748B; font-size:10px;";
        fila.appendChild(metadata);

        if (notificacion.pdfUrl) {
            var enlacePdf = document.createElement("a");
            enlacePdf.href = notificacion.pdfUrl;
            enlacePdf.target = "_blank";
            enlacePdf.rel = "noopener noreferrer";
            enlacePdf.textContent = "Ver comprobante PDF";
            enlacePdf.style.cssText = "display:inline-block; margin-top:7px; color:#2563EB; font-size:11px; font-weight:700;";
            fila.appendChild(enlacePdf);
        }

        if (!notificacion.leida) {
            var marcarLeida = document.createElement("button");
            marcarLeida.type = "button";
            marcarLeida.textContent = "Marcar como leída";
            marcarLeida.style.cssText = "display:block; margin-top:7px; padding:0; border:0; background:none; color:#0F766E; font-size:11px; cursor:pointer;";
            marcarLeida.addEventListener("click", function() { marcarNotificacionLeida(notificacion.id); });
            fila.appendChild(marcarLeida);
        }
        lista.appendChild(fila);
    });
}

function escucharNotificacionesUsuario(usuario) {
    var correo = String(usuario.correo || "").trim().toLowerCase();
    if (!correo || typeof firebase === "undefined" || !firebase.app) return;
    if (window.emailEscuchaNotificaciones === correo && window.unsubscribeNotificaciones) return;
    if (typeof window.unsubscribeNotificaciones === "function") window.unsubscribeNotificaciones();
    window.emailEscuchaNotificaciones = correo;
    var db = firebase.app().firestore();
    window.unsubscribeNotificaciones = db.collection("notificaciones")
        .where("destinatarioEmail", "==", correo)
        .limit(50)
        .onSnapshot(function(snapshot) {
            window.notificacionesUsuario = [];
            snapshot.forEach(function(doc) {
                window.notificacionesUsuario.push(Object.assign({ id: doc.id }, doc.data()));
            });
            window.notificacionesUsuario.sort(function(a, b) {
                var fechaA = a.fechaCreacion && a.fechaCreacion.toMillis ? a.fechaCreacion.toMillis() : 0;
                var fechaB = b.fechaCreacion && b.fechaCreacion.toMillis ? b.fechaCreacion.toMillis() : 0;
                return fechaB - fechaA;
            });
            renderizarNotificacionesUsuario();
        }, function(error) {
            console.error("No se pudieron cargar las notificaciones:", error);
        });
}

function alternarPanelNotificaciones() {
    var panel = document.getElementById("panel-notificaciones");
    var boton = document.getElementById("boton-notificaciones");
    if (!panel) return;
    var visible = panel.style.display !== "block";
    panel.style.display = visible ? "block" : "none";
    if (boton) boton.setAttribute("aria-expanded", String(visible));
}

async function marcarNotificacionLeida(id) {
    if (typeof firebase === "undefined" || !firebase.app) return;
    try {
        await firebase.app().firestore().collection("notificaciones").doc(id).update({
            leida: true,
            fechaLectura: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("No se pudo marcar la notificación como leída:", error);
    }
}

async function marcarTodasNotificacionesLeidas() {
    var pendientes = window.notificacionesUsuario.filter(function(notificacion) { return !notificacion.leida; });
    await Promise.all(pendientes.map(function(notificacion) { return marcarNotificacionLeida(notificacion.id); }));
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
            if (!document.getElementById("selector-pais-activo")) {
                topbarRight.innerHTML = '<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">' +
                    '<div style="position:relative;">' +
                        '<button type="button" id="boton-notificaciones" aria-label="Notificaciones" aria-expanded="false" onclick="alternarPanelNotificaciones()" style="position:relative; width:38px; height:34px; border:1px solid #CBD5E1; border-radius:6px; background:white; cursor:pointer; font-size:17px;">🔔' +
                            '<span id="contador-notificaciones" style="display:none; position:absolute; top:-6px; right:-6px; min-width:16px; height:16px; padding:0 3px; align-items:center; justify-content:center; border-radius:10px; background:#DC2626; color:white; font-size:9px; font-weight:bold;"></span>' +
                        '</button>' +
                        '<div id="panel-notificaciones" style="display:none; position:absolute; z-index:5000; top:42px; right:0; width:340px; max-width:calc(100vw - 24px); max-height:420px; overflow:auto; border:1px solid #CBD5E1; border-radius:8px; background:white; box-shadow:0 12px 30px rgba(15,23,42,.18);">' +
                            '<div style="position:sticky; top:0; display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid #E2E8F0; background:white;"><strong style="font-size:12px; color:#0F172A;">Notificaciones</strong><button type="button" onclick="marcarTodasNotificacionesLeidas()" style="border:0; background:none; color:#0F766E; font-size:10px; cursor:pointer;">Marcar todas leídas</button></div>' +
                            '<div id="lista-notificaciones"></div>' +
                        '</div>' +
                    '</div>' +
                    '<label for="selector-pais-activo" style="font-size:12px; font-weight:bold; color:#334155;">País</label>' +
                    '<select id="selector-pais-activo" aria-label="Filtrar operaciones por país" onchange="cambiarPaisActivo(this.value)" style="height:32px; padding:4px 8px; border:1px solid #CBD5E1; border-radius:6px; background:white; color:#0F172A; font-weight:600;">' +
                        '<option value="Colombia">Colombia</option>' +
                        '<option value="Perú">Perú</option>' +
                    '</select>' +
                    '<span style="font-size:12px; font-weight:bold; color:#0B1442;">👤 ' + (usuario.nombre || "Usuario") + ' (' + String(usuario.rol || "solicitante").toUpperCase() + ')</span>' +
                    '<button class="btn" style="background:#FEE2E2; color:#991B1B; font-size:11px; padding:4px 10px; font-weight:bold;" onclick="cerrarSesion()">Salir</button>' +
                '</div>';
            }
            var selectorPais = document.getElementById("selector-pais-activo");
            if (selectorPais) selectorPais.value = obtenerPaisActivo();
        }
        escucharNotificacionesUsuario(usuario);

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
    if (!e.key || e.key === "bold_operaciones_bd" || e.key === "bold_notificaciones_bd" || e.key === "usuarioLogueado" || e.key === "paisActivoOperaciones") {
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
        
        // 🔄 Cambio: Volver a "Pendiente Validación" para que reaparezca en Panel Principal
        // pero mantener registro de que fue devuelta
        op.estado = "Pendiente Validación";
        op.fueDevuelta = true;  // Indicador de que fue rechazada y devuelta
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
            await crearNotificacion(radicado, "🚨 DEVUELTA: " + radicado + " fue devuelto por " + rechazador + " y retorna al Panel Principal para ajustes. Motivo: " + motivoLimpio, true);
        }

        alert("✅ OPERACIÓN DEVUELTA Y RETORNA AL PANEL:" + "\n" + "El radicado " + radicado + " cambió a 'Pendiente Validación' y reaparece en el Panel Principal." + "\n" + "El Preparador/Solicitante puede ahora corregir y volver a radicar." + "\n" + "Motivo: " + motivoLimpio);

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
            
            if (String(op.estado || "").toUpperCase().includes("RECHAZ") || String(op.estado || "").toUpperCase().includes("DEVUELT") || op.fueDevuelta) {
                var cajaAlerta = document.createElement("div");
                cajaAlerta.id = "alerta-rechazo-ui";
                cajaAlerta.style.cssText = "background:#FEF2F2; border:2px solid #EF4444; color:#991B1B; padding:14px 18px; border-radius:10px; margin-bottom:16px; box-shadow:0 4px 12px rgba(239,68,68,0.15); animation: fadeIn 0.3s ease-in-out;";
                cajaAlerta.innerHTML = '<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">' +
                    '<span style="font-size:24px;">🚨</span>' +
                    '<strong style="font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Operación Devuelta para Ajustes</strong>' +
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
    var captura = document.getElementById('contenedorCapturaPantalla');
    var estadoCaptura = document.getElementById('estadoCapturaPantalla');
    var vistaPrevia = document.getElementById('vistaPreviaCapturaPantalla');
    var observaciones = document.getElementById('inputObservacionesCierre');
    var contenedorObservaciones = document.getElementById('contenedorObservacionesCierre');
    var tituloEl = document.getElementById('tituloSubidaEvidencia');
    var textoEl = document.getElementById('textoSubidaEvidencia');
    if (!modal || !input || !tituloEl || !textoEl) return;
    modal.dataset.radicado = radicado;
    modal.dataset.tipo = tipo;
    modal._capturedScreenshot = null;
    if (modal._screenshotPreviewUrl) URL.revokeObjectURL(modal._screenshotPreviewUrl);
    modal._screenshotPreviewUrl = null;
    tituloEl.textContent = titulo;
    textoEl.textContent = descripcion;
    input.value = '';
    input.required = tipo !== 'cierre';
    input.accept = tipo === 'cierre' ? 'application/pdf' : 'image/png,image/jpeg,image/jpg,application/pdf';
    if (captura) captura.style.display = tipo === 'screenshot' ? 'block' : 'none';
    if (estadoCaptura) estadoCaptura.textContent = 'El navegador te pedirá elegir qué compartir.';
    if (vistaPrevia) {
        vistaPrevia.removeAttribute('src');
        vistaPrevia.style.display = 'none';
    }
    if (observaciones) observaciones.value = '';
    if (contenedorObservaciones) contenedorObservaciones.style.display = tipo === 'cierre' ? 'block' : 'none';
    modal.style.display = 'flex';
}

function cerrarModalSubidaEvidencia() {
    var modal = document.getElementById('modalSubidaEvidencia');
    if (modal) {
        modal.style.display = 'none';
        modal._capturedScreenshot = null;
        if (modal._screenshotPreviewUrl) URL.revokeObjectURL(modal._screenshotPreviewUrl);
        modal._screenshotPreviewUrl = null;
    }
}

async function capturarPantallaMontaje() {
    var modal = document.getElementById('modalSubidaEvidencia');
    var boton = document.getElementById('btnCapturarPantalla');
    var estado = document.getElementById('estadoCapturaPantalla');
    var vistaPrevia = document.getElementById('vistaPreviaCapturaPantalla');
    if (!modal || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('La captura de pantalla no está disponible en este navegador o contexto. Abre el sistema en HTTPS y prueba con un navegador actualizado.');
        return;
    }

    var stream;
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Selecciona la ventana...';
    }
    if (estado) estado.textContent = 'Selecciona la ventana o pantalla que contiene el portal bancario.';

    try {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        var video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        if (!video.videoWidth || !video.videoHeight) {
            await new Promise(function(resolve, reject) {
                video.addEventListener('loadedmetadata', resolve, { once: true });
                setTimeout(function() { reject(new Error('No se pudo leer la imagen de la ventana compartida.')); }, 5000);
            });
        }

        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        var blob = await new Promise(function(resolve, reject) {
            canvas.toBlob(function(result) {
                if (result) resolve(result);
                else reject(new Error('No se pudo generar el archivo de captura.'));
            }, 'image/png');
        });
        var archivo = new File([blob], modal.dataset.radicado + '_screenshot.png', { type: 'image/png' });
        modal._capturedScreenshot = archivo;

        var input = document.getElementById('inputSubidaEvidencia');
        if (input) input.value = '';
        if (modal._screenshotPreviewUrl) URL.revokeObjectURL(modal._screenshotPreviewUrl);
        modal._screenshotPreviewUrl = URL.createObjectURL(blob);
        if (vistaPrevia) {
            vistaPrevia.src = modal._screenshotPreviewUrl;
            vistaPrevia.style.display = 'block';
        }
        if (estado) estado.textContent = 'Captura lista. Presiona "Subir archivo" para adjuntarla a la operación.';
    } catch (error) {
        console.error('No se pudo capturar la pantalla:', error);
        if (estado) estado.textContent = error.name === 'NotAllowedError' ? 'No se concedió permiso para compartir la pantalla.' : 'No se pudo capturar la ventana. Inténtalo de nuevo.';
    } finally {
        if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
        if (boton) {
            boton.disabled = false;
            boton.textContent = 'Capturar ventana o pantalla';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('btnConfirmarSubidaEvidencia');
    var input = document.getElementById('inputSubidaEvidencia');
    if (!btn) return;
    if (input) input.addEventListener('change', function() {
        var modal = document.getElementById('modalSubidaEvidencia');
        var estado = document.getElementById('estadoCapturaPantalla');
        var vistaPrevia = document.getElementById('vistaPreviaCapturaPantalla');
        if (!modal || !input.files.length) return;
        modal._capturedScreenshot = null;
        if (modal._screenshotPreviewUrl) URL.revokeObjectURL(modal._screenshotPreviewUrl);
        modal._screenshotPreviewUrl = null;
        if (vistaPrevia) {
            vistaPrevia.removeAttribute('src');
            vistaPrevia.style.display = 'none';
        }
        if (estado) estado.textContent = 'Archivo seleccionado para cargar.';
    });
    btn.addEventListener('click', async function() {
        var modal = document.getElementById('modalSubidaEvidencia');
        var campoObservaciones = document.getElementById('inputObservacionesCierre');
        if (!modal || !input) return;
        var radicado = modal.dataset.radicado;
        var tipo = modal.dataset.tipo;
        var file = input.files[0] || modal._capturedScreenshot;
        var observaciones = campoObservaciones ? campoObservaciones.value.trim() : '';
        if (!radicado || !tipo) return;
        if (!file && tipo !== 'cierre') {
            alert('⚠️ Debes seleccionar un archivo antes de continuar.');
            return;
        }
        btn.disabled = true;
        btn.textContent = file ? 'Subiendo...' : 'Guardando...';
        try {
            var urlArchivo = file ? await subirArchivoAStorage(file, radicado, tipo) : null;
            var ops = typeof obtenerOperaciones === 'function' ? obtenerOperaciones() : [];
            var op = ops.find(function(item) { return item.radicado === radicado; });
            if (!op) throw new Error('No se encontró la operación en la bandeja actual.');

            if (tipo === 'screenshot') {
                var usuarioMontaje = JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}');
                op.estado = 'En Aprobación';
                op.archivoScreenshot = urlArchivo;
                op.fechaMontaje = new Date().toISOString();
                op.montadoPor = usuarioMontaje.nombre || usuarioMontaje.correo || 'Preparador';
                op.montadoPorCorreo = String(usuarioMontaje.correo || '').trim().toLowerCase();
                op.historial = op.historial || [];
                op.historial.push({
                    fecha: typeof obtenerFechaHoraMilitar === 'function' ? obtenerFechaHoraMilitar() : new Date().toLocaleString(),
                    paso: '3. MONTAJE EN BANCO',
                    detalle: 'Evidencia bancaria cargada por ' + ((JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}').nombre) || 'Preparador') + '.'
                });
            } else if (tipo === 'cierre') {
                var usuarioCierre = JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}');
                op.estado = 'COMPLETADA / CERRADA ✓';
                op.comprobanteCerrado = true;
                op.fechaCierre = new Date().toISOString();
                op.cerradoPor = usuarioCierre.nombre || usuarioCierre.correo || 'Preparador';
                op.cerradoPorCorreo = String(usuarioCierre.correo || '').trim().toLowerCase();
                op.observacionesCierre = observaciones;
                if (urlArchivo) op.archivoPDF = urlArchivo;
                op.historial = op.historial || [];
                op.historial.push({
                    fecha: typeof obtenerFechaHoraMilitar === 'function' ? obtenerFechaHoraMilitar() : new Date().toLocaleString(),
                    paso: '5. CIERRE DEL PREPARADOR',
                    detalle: 'Cierre registrado por ' + ((JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}').nombre) || 'Preparador') + '. PDF adjunto: ' + (urlArchivo ? 'Sí.' : 'No.') + ' Observaciones registradas: ' + (observaciones ? 'Sí.' : 'No.')
                });
            }
            await guardarOperaciones(ops);
            cerrarModalSubidaEvidencia();
            if (typeof refrescarPantallasUniversales === 'function') refrescarPantallasUniversales();
            else if (typeof renderizarTabla === 'function') renderizarTabla();
            alert(tipo === 'cierre' ? '✅ Operación cerrada correctamente.' : '✅ Screenshot cargado. La operación pasó a la bandeja del Aprobador.');
        } catch (error) {
            console.error('Error al subir evidencia:', error);
            alert('❌ No se pudo subir el archivo: ' + (error.message || error));
        } finally {
            btn.disabled = false;
            btn.textContent = 'Subir archivo';
        }
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
        op.estado = 'Pendiente Cierre Preparador';
        op.enTransito = false;
        op.comprobanteCerrado = false;
        op.aprobadoPor = usr.nombre || usr.correo || 'Aprobador';
        op.aprobadoPorCorreo = String(usr.correo || '').trim().toLowerCase();
        op.fechaAprobacion = new Date().toISOString();
        op.historial = op.historial || [];
        op.historial.push({
            fecha: typeof obtenerFechaHoraMilitar === 'function' ? obtenerFechaHoraMilitar() : new Date().toLocaleString(),
            paso: '4. APROBACIÓN DEL MONTAJE',
            detalle: 'Aprobado por ' + (usr.nombre || 'Aprobador') + '. Pendiente cierre por Preparador.'
        });
        if (typeof guardarOperaciones === 'function') guardarOperaciones(ops);
        if (typeof crearNotificacion === 'function') crearNotificacion(rad, '✅ ' + rad + ' fue aprobado y está pendiente de cierre por Preparador.', true);
        alert('✅ Aprobación registrada. La operación volvió a la bandeja del Preparador para el cierre.');
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
    else if (url.includes("apiAprobarMontaje")) actualizacion = { estado: "Pendiente Cierre Preparador" };
    else if (url.includes("apiCerrarComprobante")) {
        actualizacion = { estado: "COMPLETADA / CERRADA ✓", comprobanteCerrado: true, observacionesCierre: payload.observacionesCierre || "" };
        if (payload.archivoPDF) actualizacion.archivoPDF = payload.archivoPDF;
    }
    else if (url.includes("apiRechazarOperacion")) actualizacion = { estado: "Pendiente Validación", fueDevuelta: true, motivoRechazo: payload.motivo || "" };

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
