const fs = require('fs');
try {
    const text = fs.readFileSync('codigo_2.txt', 'utf8');
    const files = text.split("📁 ARCHIVO: ");
    
    let logica = "", prep = "", index = "", admin = "";
    
    for (let part of files) {
        if (part.startsWith("js/logica-comun.js")) logica = part.split("//////////////////////////////////////////////////////")[1].trim();
        if (part.startsWith("preparador.html")) prep = part.split("//////////////////////////////////////////////////////")[1].trim();
        if (part.startsWith("index.html")) index = part.split("//////////////////////////////////////////////////////")[1].trim();
        if (part.startsWith("admin.html")) admin = part.split("//////////////////////////////////////////////////////")[1].trim();
    }
    
    // 1. Reparar logica-comun
    logica = logica.replace(/firebase\.app\(\)\.firestore\(dbName \|\| "treasurybackoffice"\)/g, "firebase.app().firestore()");
    logica = logica.replace(/firebase\.app\(\)\.firestore\("treasurybackoffice"\)/g, "firebase.app().firestore()");
    logica = logica.replace(/"validador\.html",\s?/g, "");
    logica = logica.replace(/,\s?"validador\.html"/g, "");
    logica = logica.replace(/rol: "validador"/g, 'rol: "preparador"');
    logica = logica.replace(/"bold_operaciones_backup"/g, '"bold_operaciones_bd"');
    logica += "\nwindow.coincideFechaFiltro = function(op) { var input = document.getElementById('filtro-fecha'); var fechaInput = input ? input.value : ''; if (!fechaInput) return true; if (!op || !op.fechaRadicacion) return false; var limpiaOp = String(op.fechaRadicacion).split(' - ')[0].trim(); var partes = limpiaOp.split('/'); if (partes.length !== 3) return false; var fNorm = partes[2] + '-' + String(partes[1]).padStart(2, '0') + '-' + String(partes[0]).padStart(2, '0'); return fNorm === fechaInput; };\n";
    fs.writeFileSync('js/logica-comun.js', logica);
    
    // 2. Reparar preparador
    let parts = prep.split("function renderizarTabla() {");
    let after = parts[1].substring(parts[1].indexOf("function enviarAAprobador(rad) {"));
    let newFunc = `function renderizarTabla() {
    const ops = typeof obtenerOperaciones === 'function' ? obtenerOperaciones() : [];
    const cola = ops.filter(o => (o.estado === "Pendiente Validación" || o.estado === "En Preparación") && coincideFechaFiltro(o));
    const tb = document.getElementById('tabla-preparador');
    const usr = JSON.parse(sessionStorage.getItem('usuarioLogueado') || '{}');
    tb.innerHTML = '';
    if(cola.length === 0) { tb.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748B; padding:30px;">✅ Bandeja limpia. No hay operaciones en cola.</td></tr>'; return; }
    cola.forEach(o => {
        const prioBadge = o.prioridad === 1 ? '<span class="badge" style="background:#FEE2E2; color:#991B1B;">🔥 1 - Alta</span>' : o.prioridad === 3 ? '<span class="badge" style="background:#F1F5F9; color:#475569;">☕ 3 - Baja</span>' : '<span class="badge" style="background:#FEF3C7; color:#92400E;">⚡ 2 - Media</span>';
        let candadoHtml = "";
        if (o.apartadaPor) { candadoHtml = \`<span style="background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; padding:5px 8px; border-radius:6px; font-size:11px; font-weight:bold; display:inline-block;">🔒 Apartada: \${o.apartadaPor}</span>\`; } else { candadoHtml = \`<button class="btn" style="background:#FEF9C3; color:#A16207; border:1px dashed #CA8A04;" onclick="apartarRadicado('\${o.radicado}')">🔓 Apartar</button>\`; }
        let accionesHtml = "";
        if (o.estado === "Pendiente Validación") {
             accionesHtml = \`<button class="btn btn-primario" style="background:#0284C7;" onclick="validarKYCOperacion('\${o.radicado}')">🛡️ 1. Aprobar KYC</button>\`;
        } else if (o.estado === "En Preparación") {
             let btnStyle = "background:#15803D;"; let btnAttr = "";
             if (o.apartadaPor && o.apartadaPor !== (usr.nombre || usr.correo) && usr.rol !== 'maestro') { btnStyle = "background:#94A3B8; cursor:not-allowed;"; btnAttr = "disabled title='Bloqueado'"; }
             accionesHtml = \`<button class="btn btn-primario" style="\${btnStyle}" \${btnAttr} onclick="enviarAAprobador('\${o.radicado}')">🚀 2. Montar Banco</button>\`;
        }
        tb.innerHTML += \`<tr><td><strong>\${o.radicado}</strong><br>\${prioBadge}</td><td style="font-size:12px; font-weight:700; color:#475569;">📅 \${o.fechaRadicacion || ''}</td><td>\${o.empresa || ''}<br><span class="badge badge-opex" style="margin-top:3px;">\${o.tipo || ''}</span></td><td><strong>$ \${Number(o.montoPrep || o.montoSol || 0).toLocaleString()}</strong> <span class="badge badge-moneda">\${o.moneda || 'COP'}</span></td><td>\${candadoHtml}</td><td><button class="btn btn-detalle" onclick="auditarRadicado('\${o.radicado}')">📄 Docs</button></td><td style="display:flex; gap:8px;">\${accionesHtml}<button class="btn btn-rechazar" onclick="ejecutarRechazoSeguro('\${o.radicado}')">✕</button></td></tr>\`;
    });
}
`;
    fs.writeFileSync('preparador.html', parts[0] + newFunc + "\n\n" + after);
    
    // 3. Auto-limpiador en Index
    index = index.replace("<script>", "<script>\n        localStorage.removeItem('bold_usuarios_config');\n        sessionStorage.removeItem('usuarioLogueado');");
    fs.writeFileSync('index.html', index);
    
    // 4. Conexión de Admin
    admin = admin.replace(/firebase\.app\(\)\.firestore\("treasurybackoffice"\)/g, "firebase.app().firestore()");
    fs.writeFileSync('admin.html', admin);
    
    console.log("✅ Archivos procesados y guardados localmente.");
} catch(e) {
    console.error("❌ ERROR:", e.message);
}
