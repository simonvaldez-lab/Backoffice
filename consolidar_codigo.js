const fs = require('fs');
const path = require('path');

// Solo leeremos estos tipos de archivos para no saturar con imágenes o binarios
const extensionesPermitidas = ['.html', '.js', '.css'];
// Carpetas que NO queremos leer
const carpetasIgnoradas = ['node_modules', '.git', '.github'];
// El archivo donde guardaremos todo
const archivoSalida = 'codigo_completo.txt';

let contenidoTotal = '======================================================\n';
contenidoTotal += '🚀 REPORTE COMPLETO DEL CÓDIGO - BOLD TREASURY\n';
contenidoTotal += '======================================================\n';

function leerDirectorio(directorio) {
    const archivos = fs.readdirSync(directorio);
    
    archivos.forEach(archivo => {
        const rutaCompleta = path.join(directorio, archivo);
        const stats = fs.statSync(rutaCompleta);
        
        if (stats.isDirectory()) {
            if (!carpetasIgnoradas.includes(archivo)) {
                leerDirectorio(rutaCompleta); // Leer subcarpetas (como js/)
            }
        } else {
            const ext = path.extname(archivo);
            if (extensionesPermitidas.includes(ext)) {
                const contenido = fs.readFileSync(rutaCompleta, 'utf8');
                contenidoTotal += `\n\n\n//////////////////////////////////////////////////////\n`;
                contenidoTotal += `📁 ARCHIVO: ${rutaCompleta}\n`;
                contenidoTotal += `//////////////////////////////////////////////////////\n\n`;
                contenidoTotal += contenido;
            }
        }
    });
}

try {
    // Iniciar lectura desde la carpeta actual
    leerDirectorio('./');
    fs.writeFileSync(archivoSalida, contenidoTotal);
    console.log(`✅ ¡ÉXITO! Se unió todo tu código en el archivo -> ${archivoSalida}`);
} catch (e) {
    console.error(`❌ Error al consolidar: ${e.message}`);
}
