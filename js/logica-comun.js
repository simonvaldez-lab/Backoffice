const opcionesSubtipo = {
    "Compensación": ["Pago de compensación CUD", "Confirmación abono", "Emisión"],
    "Nómina": ["Colaboradores", "Pacto Colectivo - Cheque", "Pacto Colectivo - PSE"],
    "Proveedores": ["Ventanilla", "Locales", "Internacionales"],
    "Traslados": ["Traslados Entre Cuentas", "Traslados CUD"]
};

const opcionesCuentasOrigen = {
    "Bold CO": ["Davivienda 451770073547 Ahorros", "Bancolombia 0400000126 Ahorros"],
    "Bold CF": ["Bancolombia 04000002167 Ahorros", "Credicorp 1-1-58903-3 CCA"]
};

function cambiarRol(rutaHtml) {
    if (rutaHtml) window.location.href = rutaHtml;
}
