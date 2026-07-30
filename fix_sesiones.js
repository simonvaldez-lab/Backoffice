const fs = require('fs');

const text = fs.readFileSync('codigo_3.txt', 'utf8');
const files = text.split("📁 ARCHIVO: ");

function getFile(name) {
    for (let part of files) {
        if (part.startsWith(name)) {
            return part.split("//////////////////////////////////////////////////////")[1].trim();
        }
    }
    return "";
}

let logica = getFile("js/logica-comun.js");
let validador = getFile("validador.html");
let preparador = getFile("preparador.html");
let admin = getFile("admin.html");
let index = getFile("index.html");

// --- 1. JS/LOGICA-COMUN.JS ---
// Eliminar el "auto-login" que causaba que cualquiera entrara sin credenciales
logica = logica.replace(/if \(!usrRaw\) \{[\s\S]*?sessionStorage\.setItem\("usuarioLogueado", usrRaw\);\s*\}/g, "");

// Arreglar Firebase default DB
logica = logica.replace(/firebase\.app\(\)\.firestore\("treasurybackoffice"\)/g, "firebase.app().firestore()");
logica = logica.replace(/firebase\.app\(\)\.firestore\(dbName \|\| "treasurybackoffice"\)/g, "firebase.app().firestore()");

// Arreglar almacenamiento local
logica = logica.replace(/"bold_operaciones_backup"/g, '"bold_operaciones_bd"');

// Inyectar el Guardián Estricto al final del archivo
const guardian = `
// ==========================================
// 🛡️ GUARDIÁN ESTRICTO DE SESIONES (RBAC)
// ==========================================
function ejecutarGuardianEstricto() {
    var paginaActual = window.location.pathname.split("/").pop() || "";
    if (paginaActual === "index.html" || paginaActual === "") return;

    var usrRaw = sessionStorage.getItem("usuarioLogueado");
    if (!usrRaw) {
        // Expulsión inmediata si no hay sesión
        window.location.replace("index.html");
        return;
    }

    var usuario = JSON.parse(usrRaw);
    var rol = String(usuario.rol || "").toLowerCase().trim();

    var mapaPermisos = {
        "solicitante": ["solicitante.html", "historial.html"],
        "validador": ["validador.html", "historial.html"],
        "preparador": ["preparador.html", "historial.html"],
        "aprobador": ["aprobador.html", "historial.html"],
        "maestro": ["solicitante.html", "validador.html", "preparador.html", "aprobador.html", "historial.html", "admin.html"]
    };

    var permitidos = mapaPermisos[rol] || [];

    // Redirección si el rol intenta entrar a una pantalla ajena
    if (!permitidos.includes(paginaActual) && rol !== "maestro") {
        var urlNativa = permitidos[0] || "index.html";
        window.location.replace(urlNativa);
        return;
    }

    // Ocultar menús prohibidos
    document.querySelectorAll(".menu-item").forEach(function(item) {
        var enlace = item.getAttribute("href");
        if (enlace && !permitidos.includes(enlace) && rol !== "maestro") {
            item.style.display = "none";
        } else {
            item.style.display = "block";
        }
    });
}

ejecutarGuardianEstricto();
setInterval(ejecutarGuardianEstricto, 1500); // Candado activo continuo

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
};
`;
fs.writeFileSync("js/logica-comun.js", logica + "\n" + guardian);

// --- 2. VALIDADOR.HTML ---
// Reactivar la tabla para que filtre y procese el estado correcto
let valScript = `<script>
    function renderizarTabla() {
        var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : [];
        var tb = document.getElementById("tabla-validador");
        if (!tb) return;
        
        var cola = ops.filter(function(o) { return o.estado === "Pendiente Validación" && (typeof coincideFechaFiltro === "function" ? coincideFechaFiltro(o) : true); });
        
        tb.innerHTML = "";
        if (cola.length === 0) {
            tb.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#64748B; padding:30px;'>✅ Bandeja limpia. No hay radicados pendientes de revisión KYC en esta fecha.</td></tr>";
            return;
        }
        
        cola.forEach(function(o) {
            var prioBadge = o.prioridad === 1 ? "<span class='badge' style='background:#FEE2E2; color:#991B1B;'>🔥 1 - Alta</span>" : o.prioridad === 3 ? "<span class='badge' style='background:#F1F5F9; color:#475569;'>☕ 3 - Baja</span>" : "<span class='badge' style='background:#FEF3C7; color:#92400E;'>⚡ 2 - Media</span>";
            var monto = Number(o.montoPrep || o.montoSol || 0).toLocaleString();
            
            tb.innerHTML += "<tr>" +
                "<td><strong>" + o.radicado + "</strong><br>" + prioBadge + "</td>" +
                "<td style='font-size:12px; font-weight:700; color:#475569;'>📅 " + (o.fechaRadicacion || "") + "</td>" +
                "<td>" + (o.empresa || "") + "<br><span class='badge badge-opex' style='margin-top:4px;'>" + (o.tipo || "") + "</span></td>" +
                "<td>" + (o.solicitante || "") + "</td>" +
                "<td><strong>$ " + monto + "</strong> <span class='badge badge-moneda'>" + (o.moneda || "COP") + "</span></td>" +
                "<td>" + (typeof obtenerBadgeEstado === "function" ? obtenerBadgeEstado(o.estado) : o.estado) + "</td>" +
                "<td style='display: flex; gap: 8px;'>" +
                    "<button class='btn btn-detalle' onclick=\"auditarRadicado('" + o.radicado + "')\">🔍 Docs</button>" +
                    "<button class='btn btn-primario' style='background:#0284C7;' onclick=\"validarKYCOperacion('" + o.radicado + "')\">🛡️ Aprobar KYC</button>" +
                    "<button class='btn btn-rechazar' onclick=\"ejecutarRechazoSeguro('" + o.radicado + "')\">✕</button>" +
                "</td>" +
            "</tr>";
        });
    }
    document.addEventListener("DOMContentLoaded", renderizarTabla);
</script>
</body>
</html>`;
validador = validador.substring(0, validador.lastIndexOf("<script>")) + valScript;
fs.writeFileSync("validador.html", validador);

// --- 3. PREPARADOR.HTML ---
// Filtro corregido para que el Preparador vea lo que la Validadora aprobó
preparador = preparador.replace(/o\.estado === "Listo para Banco"/g, 'o.estado === "En Preparación"');
fs.writeFileSync("preparador.html", preparador);

// --- 4. ADMIN.HTML ---
admin = admin.replace(/firebase\.app\(\)\.firestore\("treasurybackoffice"\)/g, "firebase.app().firestore()");
fs.writeFileSync("admin.html", admin);

// --- 5. INDEX.HTML ---
// Inyectar destructor de sesión al entrar a la página principal para forzar login limpio
index = index.replace("<script>", "<script>\n        sessionStorage.removeItem('usuarioLogueado');");
fs.writeFileSync("index.html", index);

console.log("✅ Sistema reconstruido con sesiones privadas y perfiles separados.");
