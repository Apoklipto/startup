// ======================
// API - LECTURA/ESCRITURA DE DATOS (VERSIÓN LOCAL)
// ======================

// Inicializar datos como objeto global
window.datos = { config: {}, productos: [] };

// Cargar datos del JSON local o localStorage
async function cargarDatos() {
    console.log('🔄 Cargando datos...');
    try {
        const response = await fetch('../productos.json');
        if (response.ok) {
            const data = await response.json();
            window.datos = data;
            console.log('✅ Datos cargados desde productos.json');
            console.log('📦 Productos:', window.datos.productos?.length || 0);
        } else {
            throw new Error('No se pudo cargar productos.json');
        }
    } catch (error) {
        console.warn('⚠️ No se pudo cargar productos.json, usando localStorage:', error);
        const local = localStorage.getItem('dashboard_data');
        if (local) {
            window.datos = JSON.parse(local);
            console.log('📦 Datos cargados desde localStorage');
            console.log('📦 Productos:', window.datos.productos?.length || 0);
        }
    }
    
    if (!window.datos.productos) window.datos.productos = [];
    if (!window.datos.config) window.datos.config = { numeroContacto: '54320330', moneda: 'USD' };
    
    guardarLocal();
    
    // Inicializar modal
    if (typeof initModal === 'function') {
        initModal(window.datos);
        console.log('✅ initModal ejecutado');
    }
    
    renderizarTodo();
    console.log('✅ Dashboard cargado completamente');
    console.log('📊 Estado final:', {
        total: window.datos.productos.length,
        activos: window.datos.productos.filter(p => p.publicar).length
    });
}

// Guardar en localStorage
function guardarLocal() {
    localStorage.setItem('dashboard_data', JSON.stringify(window.datos));
    console.log('💾 Datos guardados en localStorage');
}

// Exportar JSON
function descargarJSON() {
    console.log('📤 Exportando JSON...');
    try {
        const jsonStr = JSON.stringify(window.datos, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'productos.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('💾 JSON exportado correctamente');
        console.log('✅ JSON exportado correctamente');
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        mostrarToast('❌ Error al exportar JSON');
    }
}

// Importar JSON - VERSIÓN CORREGIDA
function importarJSON() {
    console.log('📥 Iniciando importación...');
    
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.onchange = function(e) {
            console.log('📄 Archivo seleccionado');
            const archivo = e.target.files[0];
            if (!archivo) {
                console.warn('⚠️ No se seleccionó ningún archivo');
                return;
            }
            
            console.log('📄 Nombre:', archivo.name);
            console.log('📏 Tamaño:', archivo.size, 'bytes');
            
            const lector = new FileReader();
            
            lector.onload = function(evento) {
                try {
                    console.log('📖 Leyendo archivo...');
                    const texto = evento.target.result;
                    
                    // Parsear el JSON
                    const datosImportados = JSON.parse(texto);
                    console.log('✅ JSON parseado correctamente');
                    console.log('📊 Estructura:', Object.keys(datosImportados));
                    console.log('📦 Productos encontrados:', datosImportados.productos?.length || 0);
                    
                    // VALIDAR ESTRUCTURA
                    if (!datosImportados.productos || !Array.isArray(datosImportados.productos)) {
                        throw new Error('Formato inválido: el archivo debe tener una propiedad "productos"');
                    }
                    
                    const cantidad = datosImportados.productos.length;
                    
                    if (cantidad === 0) {
                        alert('⚠️ El archivo no contiene productos');
                        return;
                    }
                    
                    // MOSTRAR PREVIEW
                    const preview = `📋 Resumen del archivo:
                    ─────────────────────
                    📦 Productos: ${cantidad}
                    📞 Contacto: ${datosImportados.config?.numeroContacto || 'No definido'}
                    💰 Moneda: ${datosImportados.config?.moneda || 'USD'}
                    ─────────────────────
                    Ejemplo: ${datosImportados.productos[0]?.nombre || 'N/A'}`;
                    
                    if (!confirm(`¿Importar estos datos?\n\n${preview}`)) {
                        return;
                    }
                    
                    // 🔥 IMPORTANTE: Asignar a window.datos
                    window.datos = datosImportados;
                    
                    // ASEGURAR CONFIG
                    if (!window.datos.config) {
                        window.datos.config = { 
                            numeroContacto: '54320330', 
                            moneda: 'USD' 
                        };
                    }
                    
                    // ASEGURAR QUE CADA PRODUCTO TENGA publicar
                    window.datos.productos = window.datos.productos.map(p => {
                        if (p.publicar === undefined) p.publicar = true;
                        return p;
                    });
                    
                    console.log('✅ Datos asignados a window.datos');
                    console.log('📦 Total productos:', window.datos.productos.length);
                    console.log('📦 Activos:', window.datos.productos.filter(p => p.publicar).length);
                    console.log('📦 Primer producto:', window.datos.productos[0]);
                    
                    // GUARDAR EN LOCALSTORAGE
                    guardarLocal();
                    
                    // FORZAR RENDERIZADO
                    console.log('🔄 Forzando renderizado...');
                    
                    // 1. Reinicializar modal
                    if (typeof initModal === 'function') {
                        initModal(window.datos);
                    }
                    
                    // 2. Renderizar todo
                    renderizarTodo();
                    
                    // 3. Verificar que se renderizó
                    setTimeout(() => {
                        const grid = document.getElementById('productosGrid');
                        const cards = grid?.querySelectorAll('.producto-card');
                        console.log(`✅ Renderizado completado: ${cards?.length || 0} tarjetas mostradas`);
                        
                        if (cards?.length === 0) {
                            console.warn('⚠️ No se mostraron productos. Verificando...');
                            console.log('📊 Datos:', window.datos);
                            console.log('📦 Productos:', window.datos.productos);
                            console.log('🔍 Filtros activos:', {
                                search: document.getElementById('searchInput')?.value,
                                categoria: document.getElementById('filterCategoria')?.value,
                                estado: document.getElementById('filterEstado')?.value
                            });
                        }
                    }, 200);
                    
                    mostrarToast(`✅ ${cantidad} productos importados`);
                    console.log('✅ Importación completada');
                    
                } catch (error) {
                    console.error('❌ Error al importar:', error);
                    alert('❌ Error: ' + error.message + '\n\nRevisa la consola para más detalles.');
                }
            };
            
            lector.onerror = function() {
                console.error('❌ Error al leer el archivo');
                alert('❌ Error al leer el archivo');
            };
            
            lector.readAsText(archivo);
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
        console.log('🔄 Selector de archivos abierto');
        
    } catch (error) {
        console.error('❌ Error al abrir el selector:', error);
        alert('❌ Error al abrir el selector de archivos: ' + error.message);
    }
}

// Ejecutar publicador
function ejecutarPublicador() {
    mostrarToast('⚠️ Publicador solo disponible desde terminal: node publicador.js');
    console.log('Para publicar, ejecuta: node publicador.js');
}

// ======================
// HACER FUNCIONES GLOBALES
// ======================
window.importarJSON = importarJSON;
window.descargarJSON = descargarJSON;
window.ejecutarPublicador = ejecutarPublicador;
window.guardarLocal = guardarLocal;
window.cargarDatos = cargarDatos;

console.log('✅ api.js cargado correctamente');
console.log('📌 Funciones disponibles:', ['importarJSON', 'descargarJSON', 'ejecutarPublicador', 'guardarLocal', 'cargarDatos']);