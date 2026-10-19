const functions = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const cors = require("cors")({ origin: true });
const crypto = require("crypto");

admin.initializeApp();
const db = getFirestore("treasurybackoffice");

// 🛡️ GUARDIA DE SEGURIDAD (RBAC - ZERO TRUST)
async function validarPermiso(usuarioCliente, rolesPermitidos) {
    if (!usuarioCliente || !usuarioCliente.correo) throw new Error("Acceso Denegado: Sesión no identificada.");
    const correo = usuarioCliente.correo.toLowerCase().trim();
    if (correo === "simon.valdez@bold.co") return { autorizado: true, rol: "maestro", nombre: "Simon Valdez (Director)" };

    const docRef = await db.collection("configuracion").doc("usuarios").get();
    let listaUsuarios = docRef.exists && docRef.data().lista ? docRef.data().lista : [
        { correo: "lau@bold.co", rol: "solicitante", estado: "Activo" },
        { correo: "fel@bold.co", rol: "preparador", estado: "Activo" },
        { correo: "kat@bold.co", rol: "aprobador", estado: "Activo" }
    ];

    const usr = listaUsuarios.find(u => u.correo.toLowerCase() === correo);
    if (!usr) throw new Error(`Acceso Denegado: El correo ${correo} no está autorizado.`);
    if (usr.estado !== "Activo") throw new Error(`Acceso Bloqueado: Usuario suspendido.`);
    
    if (usr.rol === "maestro" || rolesPermitidos.includes(usr.rol)) {
        return { autorizado: true, rol: usr.rol, nombre: usr.nombre || correo };
    } else {
        throw new Error(`Violación RBAC: Tu rol actual ('${usr.rol.toUpperCase()}') no tiene permisos para este paso.`);
    }
}

// ⏱️ CÁLCULO DE VENCIMIENTO ANS
async function calcularVencimientoANS(prioridad, esAprobacion = false) {
    const docRef = await db.collection("configuracion").doc("ans").get();
    let matriz = docRef.exists && docRef.data().lista ? docRef.data().lista : [
        { prioridad: 1, maxMontajeMin: 15, maxAprobacionMin: 10 },
        { prioridad: 2, maxMontajeMin: 30, maxAprobacionMin: 20 },
        { prioridad: 3, maxMontajeMin: 60, maxAprobacionMin: 45 }
    ];
    const prioNum = Number(prioridad) || 2;
    const regla = matriz.find(m => m.prioridad === prioNum) || matriz[1];
    const minutos = esAprobacion ? regla.maxAprobacionMin : regla.maxMontajeMin;
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + minutos);
    return Timestamp.fromDate(ahora);
}

function crearRegistroHistorial(paso, detalle, usr, alerta = false) {
    const ahora = new Date();
    const militar = String(ahora.getHours()).padStart(2, '0') + ":" + String(ahora.getMinutes()).padStart(2, '0');
    return {
        fecha: ahora.toLocaleDateString('es-CO') + " " + militar,
        paso: paso,
        detalle: `${detalle} | Operado por: ${usr.nombre || usr.correo} (${(usr.rol || '').toUpperCase()})`,
        alerta: alerta
    };
}

async function correosPorRol(dbRef, rol) {
    const usuariosRef = await dbRef.collection("configuracion").doc("usuarios").get();
    const lista = usuariosRef.exists && Array.isArray(usuariosRef.data().lista) ? usuariosRef.data().lista : [
        { correo: "lau@bold.co", rol: "solicitante", estado: "Activo" },
        { correo: "fel@bold.co", rol: "preparador", estado: "Activo" },
        { correo: "kat@bold.co", rol: "aprobador", estado: "Activo" }
    ];
    return [...new Set(lista
        .filter(usuario => String(usuario.rol || "").toLowerCase() === rol && String(usuario.estado || "Activo").toLowerCase() === "activo")
        .map(usuario => String(usuario.correo || "").trim().toLowerCase())
        .filter(Boolean))];
}

async function notificarCambioEstado(event) {
    const anterior = event.data.before.data();
    const operacion = event.data.after.data();
    if (!anterior || !operacion || anterior.estado === operacion.estado) return;

    const destinatarios = new Map();
    const agregarDestinatario = (correo, rol, mensaje, pdfUrl = "") => {
        const email = String(correo || "").trim().toLowerCase();
        if (email) destinatarios.set(email, { destinatarioRol: rol, mensaje, pdfUrl });
    };
    const estado = String(operacion.estado || "");
    const radicado = String(operacion.radicado || event.params.radicado || "");

    if (operacion.solicitante) {
        const esCompletada = estado.toUpperCase().includes("COMPLETADA");
        const mensaje = esCompletada
            ? (operacion.archivoPDF ? `La operación ${radicado} está completada. Ya puedes consultar el comprobante PDF.` : `La operación ${radicado} está completada. No se adjuntó comprobante PDF.`)
            : `La operación ${radicado} cambió al estado: ${estado}.`;
        agregarDestinatario(operacion.solicitante, "solicitante", mensaje, esCompletada ? operacion.archivoPDF || "" : "");
    }

    const dbUsuarios = getFirestore("treasurybackoffice");
    if (estado === "En Aprobación") {
        const aprobadores = await correosPorRol(dbUsuarios, "aprobador");
        aprobadores.forEach(correo => agregarDestinatario(correo, "aprobador", `La operación ${radicado} solicita tu aprobación bancaria.`));
    }

    if (["Pendiente Cierre Preparador", "APROBADO"].includes(estado)) {
        agregarDestinatario(operacion.preparadorAsignadoCorreo, "preparador", `El Aprobador aprobó ${radicado}. La operación está pendiente de tu cierre.`);
    }

    if (estado.toUpperCase().includes("COMPLETADA")) {
        const aprobadores = await correosPorRol(dbUsuarios, "aprobador");
        aprobadores.forEach(correo => agregarDestinatario(correo, "aprobador", `El Preparador cerró la operación ${radicado}.`));
    }

    if (!destinatarios.size) return;
    const dbNotificaciones = getFirestore();
    const batch = dbNotificaciones.batch();
    destinatarios.forEach((destinatario, correo) => {
        const id = crypto.createHash("sha256").update(`${event.id}:${correo}`).digest("hex");
        batch.set(dbNotificaciones.collection("notificaciones").doc(id), {
            destinatarioEmail: correo,
            destinatarioRol: destinatario.destinatarioRol,
            radicado,
            pais: operacion.pais || "",
            estado,
            mensaje: destinatario.mensaje,
            pdfUrl: destinatario.pdfUrl,
            fechaCreacion: FieldValue.serverTimestamp(),
            leida: false
        });
    });
    await batch.commit();
}

exports.notificarCambioEstadoDefault = onDocumentUpdated({
    document: "operaciones/{radicado}",
    database: "(default)",
    region: "us-central1"
}, notificarCambioEstado);

exports.notificarCambioEstadoTreasury = onDocumentUpdated({
    document: "operaciones/{radicado}",
    database: "treasurybackoffice",
    region: "us-central1"
}, notificarCambioEstado);

// ============================================================================
// 👥 APIS DE GOBIERNO (ROLES Y ANS)
// ============================================================================
exports.apiGuardarUsuarios = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            await validarPermiso(req.body.usuario, ["maestro"]);
            await db.collection("configuracion").doc("usuarios").set({ lista: req.body.listaUsuarios, actualizadoEn: FieldValue.serverTimestamp() });
            return res.status(200).json({ exito: true });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

exports.apiGuardarANS = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            await validarPermiso(req.body.usuario, ["maestro"]);
            await db.collection("configuracion").doc("ans").set({ lista: req.body.listaANS, actualizadoEn: FieldValue.serverTimestamp() });
            return res.status(200).json({ exito: true });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

// ============================================================================
// 🚀 APIS TRANSACCIONALES
// ============================================================================
exports.apiRadicarOperacion = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            const datos = req.body;
            const usrValidado = await validarPermiso(datos.usuario, ["solicitante"]);
            if (!datos.radicado || !datos.montoSol) return res.status(400).json({ exito: false, error: "Datos incompletos." });

            const fechaVencimiento = await calcularVencimientoANS(datos.prioridad, false);
            const operacionDB = {
                ...datos,
                estado: "Pendiente Validación", // Estado inicial para que Felipe haga el primer check
                fechaServidor: FieldValue.serverTimestamp(),
                fechaVencimientoSLA: fechaVencimiento,
                creadoEnCloud: true,
                historial: [crearRegistroHistorial("1. 🟢 RADICACIÓN INICIAL", "Solicitud creada e ingresada a bandeja de Preparador para Check KYC.", usrValidado)]
            };

            await db.collection("operaciones").doc(datos.radicado).set(operacionDB);
            console.log(`✅ [CLOUD] Radicado: ${datos.radicado}`);
            return res.status(200).json({ exito: true, id: datos.radicado });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

// 🔥 NUEVO ENDPOINT: PASO 1 (VALIDACIÓN KYC ABSORBIDA POR PREPARADOR)
exports.apiValidarKYC = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            const { radicado, usuario } = req.body;
            
            // 🛡️ RBAC: Ahora el PREPARADOR está autorizado para ejecutar la validación inicial
            const usrValidado = await validarPermiso(usuario, ["preparador"]);
            if (!radicado) return res.status(400).json({ exito: false, error: "Falta radicado." });

            const docRef = db.collection("operaciones").doc(radicado);
            const nuevoHistorial = crearRegistroHistorial("2. 🛡️ CHECK KYC / COMPLIANCE APROBADO", "Revisión antifraude KYC certificada por el Preparador. Lista para iniciar montaje en portal bancario.", usrValidado);
            const correoPreparador = String(usuario.correo || "").trim().toLowerCase();
            await db.runTransaction(async transaction => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) throw new Error("Operación no encontrada.");
                const operacion = doc.data();
                const asignado = String(operacion.preparadorAsignadoCorreo || "").toLowerCase();
                if (asignado && asignado !== correoPreparador && usrValidado.rol !== "maestro") {
                    throw new Error(`La operación ya está asignada a ${operacion.preparadorAsignado || asignado}.`);
                }
                if (operacion.estado !== "Pendiente Validación") throw new Error("La operación ya no está pendiente de validación KYC.");
                transaction.update(docRef, {
                    estado: "En Preparación",
                    kycValidadoPor: usrValidado.nombre,
                    kycValidadoEn: FieldValue.serverTimestamp(),
                    preparadorAsignado: usrValidado.nombre,
                    preparadorAsignadoCorreo: correoPreparador,
                    historial: FieldValue.arrayUnion(nuevoHistorial),
                    actualizadoEn: FieldValue.serverTimestamp()
                });
            });

            console.log(`🛡️ [CLOUD] KYC Validado por Preparador: ${radicado}`);
            return res.status(200).json({ exito: true, mensaje: "KYC certificado. Operación habilitada para montaje bancario." });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

// PASO 2: MONTAJE BANCARIO (PREPARADOR)
exports.apiRegistrarMontaje = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            const { radicado, archivoScreenshot, usuario } = req.body;
            const usrValidado = await validarPermiso(usuario, ["preparador"]);
            if (!radicado || !archivoScreenshot) return res.status(400).json({ exito: false, error: "Falta radicado o screenshot." });

            const docRef = db.collection("operaciones").doc(radicado);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ exito: false });

            const fechaVencimiento = await calcularVencimientoANS(doc.data().prioridad || 2, true);
            const nuevoHistorial = crearRegistroHistorial("3. 🔵 MONTAJE EN BANCO", `Dispersión montada en portal. Screenshot: ${archivoScreenshot}.`, usrValidado);

            await docRef.update({
                estado: "En Aprobación",
                archivoScreenshot: archivoScreenshot.trim(),
                montadoPor: usrValidado.nombre,
                montadoPorCorreo: String(usuario.correo || "").trim().toLowerCase(),
                fechaMontaje: FieldValue.serverTimestamp(),
                fechaVencimientoSLA: fechaVencimiento,
                historial: FieldValue.arrayUnion(nuevoHistorial),
                actualizadoEn: FieldValue.serverTimestamp()
            });

            console.log(`🖼️ [CLOUD] Montaje registrado: ${radicado}`);
            return res.status(200).json({ exito: true });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

// PASO 3: APROBACIÓN FINANZAS (KATE)
exports.apiAprobarMontaje = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            const { radicado, usuario } = req.body;
            const usrValidado = await validarPermiso(usuario, ["aprobador"]);
            if (!radicado) return res.status(400).json({ exito: false });

            const docRef = db.collection("operaciones").doc(radicado);
            const nuevoHistorial = crearRegistroHistorial("4. 🟣 APROBACIÓN DE MONTAJE (VISTO BUENO)", "Check Final aprobado. Retorna a Preparador para PDF.", usrValidado);

            await docRef.update({
                estado: "Pendiente Cierre Preparador",
                aprobadoPor: usrValidado.nombre,
                aprobadoPorCorreo: String(usuario.correo || "").trim().toLowerCase(),
                fechaAprobacion: FieldValue.serverTimestamp(),
                historial: FieldValue.arrayUnion(nuevoHistorial),
                actualizadoEn: FieldValue.serverTimestamp()
            });

            console.log(`✅ [CLOUD] Aprobado: ${radicado}`);
            return res.status(200).json({ exito: true });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

// PASO 4: CIERRE PDF (PREPARADOR)
exports.apiCerrarComprobante = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            const { radicado, archivoPDF, observacionesCierre, usuario } = req.body;
            const usrValidado = await validarPermiso(usuario, ["preparador"]);
            if (!radicado) return res.status(400).json({ exito: false });

            const docRef = db.collection("operaciones").doc(radicado);
            const pdfAdjunto = typeof archivoPDF === "string" && archivoPDF.trim() !== "";
            const observacionesLimpias = typeof observacionesCierre === "string" ? observacionesCierre.trim().slice(0, 2000) : "";
            const nuevoHistorial = crearRegistroHistorial("🏁 5. CIERRE DEL PREPARADOR", `Cierre registrado. PDF adjunto: ${pdfAdjunto ? "Sí" : "No"}. Observaciones registradas: ${observacionesLimpias ? "Sí" : "No"}.`, usrValidado);

            const actualizacion = {
                estado: "COMPLETADA / CERRADA ✓",
                comprobanteCerrado: true,
                enTransito: false,
                cerradoPor: usrValidado.nombre,
                cerradoPorCorreo: String(usuario.correo || "").trim().toLowerCase(),
                fechaCierre: FieldValue.serverTimestamp(),
                observacionesCierre: observacionesLimpias,
                historial: FieldValue.arrayUnion(nuevoHistorial),
                actualizadoEn: FieldValue.serverTimestamp()
            };
            if (pdfAdjunto) actualizacion.archivoPDF = archivoPDF.trim();

            await docRef.update(actualizacion);

            console.log(`🏁 [CLOUD] Cierre PDF: ${radicado}`);
            return res.status(200).json({ exito: true });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});

// RECHAZO UNIVERSAL
exports.apiRechazarOperacion = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            if (req.method !== "POST") return res.status(405).json({ exito: false });
            const { radicado, motivo, usuario } = req.body;
            const usrValidado = await validarPermiso(usuario, ["solicitante", "preparador", "aprobador"]);
            if (!radicado || !motivo || motivo.trim() === "") return res.status(400).json({ exito: false, error: "Motivo obligatorio." });

            const docRef = db.collection("operaciones").doc(radicado);
            const motivoLimpio = motivo.trim();
            const nuevoHistorial = crearRegistroHistorial("⚫ OPERACIÓN DEVUELTA / RECHAZADA", `Devuelto por analista. Motivo: "${motivoLimpio}"`, usrValidado, true);

            await docRef.update({
                estado: "RECHAZADO",
                motivoRechazo: motivoLimpio,
                enTransito: false,
                historial: FieldValue.arrayUnion(nuevoHistorial),
                actualizadoEn: FieldValue.serverTimestamp()
            });

            console.log(`🚨 [CLOUD] Rechazado: ${radicado}`);
            return res.status(200).json({ exito: true });
        } catch (err) { return res.status(403).json({ exito: false, error: err.message }); }
    });
});
