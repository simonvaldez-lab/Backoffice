const fs = require('fs');

// ==========================================
// 1. REPARAR LOGICA-COMUN.JS (EL CEREBRO)
// ==========================================
if (fs.existsSync('js/logica-comun.js')) {
    let logica = fs.readFileSync('js/logica-comun.js', 'utf8');

    // a. Conectar correctamente a Firebase (default)
    logica = logica.replace(/firebase\.app\(\)\.firestore\("treasurybackoffice"\)/g, "firebase.app().firestore()");
    logica = logica.replace(/firebase\.app\(\)\.firestore\(dbName \|\| "treasurybackoffice"\)/g, "firebase.app().firestore()");

    // b. Arreglar el guardado de la tabla en vivo
    logica = logica.replace(/"bold_operaciones_backup"/g, '"bold_operaciones_bd"');

    // c. DESTRUIR EL AUTO-LOGIN Y CREAR EL GUARDIÁN ESTRICTO
    const regexSeguridad = /function aplicarSeguridadYMenuUniversal\(\) \{[\s\S]*?\} catch\(e\) \{ console\.error\("Error en RBAC Universal:", e\); \}\s*\}/;
    
    const nuevoGuardian = `function aplicarSeguridadYMenuUniversal() {
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
            "solicitante": ["solicitante.html", "historial.html"],
            "validador": ["validador.html", "historial.html"],
            "preparador": ["preparador.html", "historial.html"],
            "aprobador": ["aprobador.html", "historial.html"],
            "maestro": ["solicitante.html", "validador.html", "preparador.html", "aprobador.html", "historial.html", "admin.html"]
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
}`;
    
    if (regexSeguridad.test(logica)) {
        logica = logica.replace(regexSeguridad, nuevoGuardian);
    } else {
        // Si por alguna razón está usando la función vieja, la reemplazamos también
        logica = logica.replace(/function aplicarSeguridadYMenu\(\) \{[\s\S]*?\} catch\(e\) \{ console\.error\("Error RBAC:", e\); \}\s*\}/g, nuevoGuardian);
        logica = logica.replace(/aplicarSeguridadYMenu\(\)/g, "aplicarSeguridadYMenuUniversal()");
    }

    // d. Inyectar filtro de fechas si no existe
    if (!logica.includes("window.coincideFechaFiltro")) {
        logica += `\nwindow.coincideFechaFiltro = function(op) {
            var input = document.getElementById("filtro-fecha");
            var fechaInput = input ? input.value : "";
            if (!fechaInput) return true;
            if (!op || !op.fechaRadicacion) return false;
            var limpiaOp = String(op.fechaRadicacion).split(" - ")[0].trim();
            var partes = limpiaOp.split("/");
            if (partes.length !== 3) return false;
            var fNorm = partes[2] + "-" + String(partes[1]).padStart(2, "0") + "-" + String(partes[0]).padStart(2, "0");
            return fNorm === fechaInput;
        };\n`;
    }

    fs.writeFileSync('js/logica-comun.js', logica);
}

// ==========================================
// 2. REPARAR VALIDADOR.HTML (ELIMINAR ERROR DE SINTAXIS)
// ==========================================
if (fs.existsSync('validador.html')) {
    let validador = fs.readFileSync('validador.html', 'utf8');
    let scriptIndex = validador.lastIndexOf("<script>");
    if (scriptIndex !== -1) {
        let valTop = validador.substring(0, scriptIndex);
        let valScript = `<script>
        function renderizarTabla() {
            var ops = typeof obtenerOperaciones === "function" ? obtenerOperaciones() : [];
            var tb = document.getElementById("tabla-validador");
            if (!tb) return;
            
            var cola = ops.filter(function(o) { return o.estado === "Pendiente Validación" && (typeof coincideFechaFiltro === "function" ? coincideFechaFiltro(o) : true); });
            
            tb.innerHTML = "";
            if (cola.length === 0) {
                tb.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#64748B; padding:30px;'>✅ Bandeja limpia. No hay radicados pendientes de revisión KYC.</td></tr>";
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
                        "<button class='btn btn-detalle' onclick=\\"auditarRadicado('" + o.radicado + "')\\">🔍 Docs</button>" +
                        "<button class='btn btn-primario' style='background:#0284C7;' onclick=\\"validarKYCOperacion('" + o.radicado + "')\\">🛡️ Aprobar KYC</button>" +
                        "<button class='btn btn-rechazar' onclick=\\"ejecutarRechazoSeguro('" + o.radicado + "')\\">✕ Devolver</button>" +
                    "</td>" +
                "</tr>";
            });
        }
        document.addEventListener("DOMContentLoaded", renderizarTabla);
    </script>
    </body>
    </html>`;
        fs.writeFileSync('validador.html', valTop + valScript);
    }
}

// ==========================================
// 3. ACTUALIZAR PREPARADOR.HTML (Recibir de Validador)
// ==========================================
if (fs.existsSync('preparador.html')) {
    let prep = fs.readFileSync('preparador.html', 'utf8');
    // El preparador ahora busca operaciones "En Preparación" (Aprobadas por Validador)
    prep = prep.replace(/o\.estado === "Listo para Banco"/g, 'o.estado === "En Preparación"');
    fs.writeFileSync('preparador.html', prep);
}

// ==========================================
// 4. QUITAR AMNESIA DEL INDEX (Salvar a los usuarios)
// ==========================================
if (fs.existsSync('index.html')) {
    let idx = fs.readFileSync('index.html', 'utf8');
    idx = idx.replace(/localStorage\.removeItem\([\x27"]bold_usuarios_config[\x27"]\);\s*/g, "");
    fs.writeFileSync('index.html', idx);
}

// ==========================================
// 5. CONECTAR ADMIN.HTML A FIREBASE
// ==========================================
if (fs.existsSync('admin.html')) {
    let adm = fs.readFileSync('admin.html', 'utf8');
    adm = adm.replace(/firebase\.app\(\)\.firestore\("treasurybackoffice"\)/g, "firebase.app().firestore()");
    fs.writeFileSync('admin.html', adm);
}

console.log("✅ Sistema parcheado con sesiones herméticas y roles separados.");
