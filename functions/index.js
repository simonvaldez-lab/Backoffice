const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Inicializamos el SDK de administrador de Firebase
admin.initializeApp();
const db = admin.firestore();

/**
 * 🚀 CLOUD FUNCTION: Radicación Segura de Operaciones de Tesorería
 * Endpoint HTTP con soporte CORS para recibir radicados desde el frontend
 */
exports.apiRadicarOperacion = functions.https.onRequest((req, res) => {
    // Manejo de CORS para llamadas desde tu web o GitHub Pages
    return cors(req, res, async () => {
        try {
            // Solo aceptamos peticiones POST
            if (req.method !== "POST") {
                return res.status(405).json({ exito: false, error: "Método no permitido. Usa POST." });
            }

            const datos = req.body;

            // 1. Validación de seguridad en el servidor (Backend Guard)
            if (!datos.radicado || !datos.montoSol || datos.montoSol <= 0) {
                return res.status(400).json({ 
                    exito: false, 
                    error: "Payload inválido: Faltan datos obligatorios o el monto es menor o igual a cero." 
                });
            }

            // 2. Construcción del documento blindado con Timestamps oficiales del servidor
            const nuevaOperacionDB = {
                ...datos,
                estado: "Pendiente Validación", // Forzamos el estado inicial legítimo
                fechaServidor: admin.firestore.FieldValue.serverTimestamp(),
                creadoEnCloud: true,
                auditoriaBackend: {
                    ipOrigen: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                    producidoPor: "Bold Cloud Functions Node.js"
                }
            };

            // 3. Guardado en la colección 'operaciones' de Firestore usando el N° de Radicado como ID
            await db.collection("operaciones").doc(datos.radicado).set(nuevaOperacionDB);

            console.log(`✅ [CLOUD FUNCTION] Operación radicada con éxito en DB: ${datos.radicado}`);

            // Respondemos al frontend con éxito
            return res.status(200).json({
                exito: true,
                mensaje: `Radicado ${datos.radicado} asegurado en Firebase por Cloud Functions.`,
                idDocumento: datos.radicado
            });

        } catch (error) {
            console.error("❌ [CLOUD FUNCTION ERROR]:", error);
            return res.status(500).json({ exito: false, error: "Error interno en el servidor de Firebase: " + error.message });
        }
    });
});
