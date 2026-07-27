// ======================
// API - LECTURA/ESCRITURA DE DATOS
// ======================

let datos = { config: {}, productos: [] };

// Cargar datos del JSON o localStorage
async function cargarDatos() {
    try {
        const response = await fetch('../productos.json');
        if (response.ok) {
            datos = await response.json();
        }
    } catch {
        const local = localStorage.getItem('dashboard_data');
        if (local) datos = JSON.parse(local);
    }
    
    if (!datos.productos) datos.productos = [];
    if (!datos.config) datos.config = { numeroContacto: '54320330', moneda: 'USD' };
    
    guardarLocal();
    initModal(datos);
    renderizarTodo();
}

// Guardar en localStorage
function guardarLocal() {
    localStorage.setItem('dashboard_data', JSON.stringify(datos));
}

// Exportar JSON
function descargarJSON() {
    const jsonStr = JSON.stringify(datos, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('💾 JSON exportado');
}

// Importar JSON
function importarJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();

        lector.onload = function(evento) {
            try {
                const datosImportados = JSON.parse(evento.target.result);

                if (!datosImportados.productos || !Array.isArray(datosImportados.productos)) {
                    throw new Error('Formato inválido');
                }

                const cantidad = datosImportados.productos.length;
                if (confirm(`¿Importar ${cantidad} productos? Esto REEMPLAZARÁ los datos actuales.`)) {
                    datos = datosImportados;
                    if (!datos.config) datos.config = { numeroContacto: '54320330' };
                    initModal(datos);
                    guardarLocal();
                    renderizarTodo();
                    mostrarToast(`✅ ${cantidad} productos importados`);
                }
            } catch (error) {
                alert('❌ Error: El archivo no es un JSON válido de productos');
                console.error(error);
            }
        };
        lector.readAsText(archivo);
    };

    input.click();
}
async function ejecutarPublicador() {
    if (!confirm('¿Ejecutar el publicador? Se publicarán todos los productos activos en Facebook.')) return;
    
    mostrarToast('🚀 Iniciando publicador...');
    
    try {
        const response = await fetch('/api/publicar', { method: 'POST' });
        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarToast('✅ Publicación completada');
            console.log(resultado.log);
        } else {
            mostrarToast('❌ Error en la publicación');
        }
    } catch (error) {
        mostrarToast('❌ Error de conexión');
    }
}