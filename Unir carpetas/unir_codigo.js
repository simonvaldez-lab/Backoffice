const fs = require('fs');
const path = require('path');

// 📂 Lista SUPER EXTENDIDA de todos los archivos clave de tu proyecto según tu imagen
const archivos = [
    // 🖥️ Frontend - HTMLs
    'index.html',
    'dashboard.html',
    'solicitante.html',
    'preparador.html',
    'aprobador.html',
    'validador.html',
    'admin.html',
    'historial.html',

    // 🧠 Frontend - Lógica y Estilos
    'js/logica-comun.js',
    'css/estilos.css',

    // ☁️ Backend - Cloud Functions
    'functions/index.js',
    'functions/package.json',

    // 🩹 Scripts Raíz (Fixes, Parches y el Index base)
    'index.js',
    'fix_seguridad.js',
    'fix_sesiones.js',
    'fix_usuarios.js',
    'parche_kyc.js',
    'consolidar_codigo.js',

    // ⚙️ Configuración del Servidor y Firebase
    'firebase.json',
    '.firebaserc',
    'package.json'
];

let contenidoFinal = '=== RESPALDO COMPLETO DE CÓDIGO - BOLD TREASURY ===\n\n';

// Usamos __dirname para asegurarnos de que busque los archivos desde la carpeta raíz correcta
const rutaBase = __dirname.includes('Unir carpetas') ? path.join(__dirname, '..') : __dirname;

archivos.forEach(archivo => {
    const rutaCompleta = path.join(rutaBase, archivo);
    
    // Verificamos si el archivo existe antes de leerlo
    if (fs.existsSync(rutaCompleta)) {
        contenidoFinal += `\n======================================================\n`;
        contenidoFinal += `📄 ARCHIVO: ${archivo}\n`;
        contenidoFinal += `======================================================\n\n`;
        
        // Leemos el contenido y lo sumamos al texto final
        contenidoFinal += fs.readFileSync(rutaCompleta, 'utf8');
        contenidoFinal += `\n\n`;
    } else {
        console.warn(`⚠️ Archivo no encontrado (saltando): ${archivo}`);
    }
});

// 💾 Guardamos todo en un solo archivo .txt en la raíz
const rutaDestino = path.join(rutaBase, 'codigo_completo.txt');
fs.writeFileSync(rutaDestino, contenidoFinal);
console.log('✅ ¡Éxito, Simon! Se ha actualizado el archivo "codigo_completo.txt" con todo tu repositorio.');