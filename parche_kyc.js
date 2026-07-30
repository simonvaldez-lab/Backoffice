const fs = require("fs");
const file = "validador.html";
let code = fs.readFileSync(file, "utf8");

// Cortamos el bloque <script> viejo y roto
const scriptStart = code.lastIndexOf("<script>");
const topHtml = code.substring(0, scriptStart);

// Inyectamos el motor real
const newScript = `<script>
    function renderizarTabla() {
        var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : [];
        var tb = document.getElementById("tabla-validador");
        if (!tb) return;
        
        // Filtrar las operaciones que esperan validación KYC
        var cola = ops.filter(function(o) {
            return o.estado === "Pendiente Validación";
        });
        
        tb.innerHTML = "";
        if (cola.length === 0) {
            tb.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#64748B; padding:30px;'>✅ No hay radicados pendientes de validación KYC.</td></tr>";
            return;
        }
        
        cola.forEach(function(o) {
            var prioBadge = o.prioridad === 1 ? "<span class='badge' style='background:#FEE2E2; color:#991B1B;'>🔥 1 - Alta</span>" : o.prioridad === 3 ? "<span class='badge' style='background:#F1F5F9; color:#475569;'>☕ 3 - Baja</span>" : "<span class='badge' style='background:#FEF3C7; color:#92400E;'>⚡ 2 - Media</span>";
            var monto = Number(o.montoPrep || o.montoSol || 0).toLocaleString();
            var moneda = o.moneda || "COP";
            var estado = obtenerBadgeEstado(o.estado);
            
            var btnRevisar = "<button class='btn btn-detalle' onclick=\"auditarRadicado('" + o.radicado + "')\">🔍 Revisar Soportes</button>";
            var btnAprobar = "<button class='btn btn-primario' style='background:#0284C7;' onclick=\"validarKYCOperacion('" + o.radicado + "')\">🛡️ Aprobar KYC</button>";
            var btnRechazar = "<button class='btn btn-rechazar' onclick=\"ejecutarRechazoSeguro('" + o.radicado + "')\">✕ Devolver</button>";
            
            tb.innerHTML += "<tr>" +
                "<td><strong>" + o.radicado + "</strong><br>" + prioBadge + "</td>" +
                "<td style='font-size:12px; font-weight:700; color:#475569;'>📅 " + (o.fechaRadicacion || "") + "</td>" +
                "<td>" + o.empresa + "<br><span class='badge badge-opex' style='margin-top:4px;'>" + o.tipo + "</span></td>" +
                "<td>" + o.solicitante + "</td>" +
                "<td><strong>$ " + monto + "</strong> <span class='badge badge-moneda'>" + moneda + "</span></td>" +
                "<td>" + estado + "</td>" +
                "<td style='display: flex; gap: 8px;'>" + btnRevisar + btnAprobar + btnRechazar + "</td>" +
            "</tr>";
        });
    }
    
    // Auto-dibujar la tabla al entrar a la página
    document.addEventListener("DOMContentLoaded", renderizarTabla);
</script>
</body>
</html>`;

fs.writeFileSync(file, topHtml + newScript);
console.log("🟢 validador.html reparado y conectado con éxito.");
