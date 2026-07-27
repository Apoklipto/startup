// ======================
// APP - LÓGICA PRINCIPAL
// ======================

// ======================
// RENDERIZAR
// ======================
function renderizarTodo() {
    renderizarStats();
    renderizarFiltros();
    renderizarProductos();
}

function renderizarStats() {
    const total = datos.productos.length;
    const activos = datos.productos.filter(p => p.publicar).length;
    const ocultos = total - activos;
    const precioMax = datos.productos.length > 0 
        ? Math.max(...datos.productos.map(p => p.precio || 0)) 
        : 0;

    document.getElementById('stats').innerHTML = `
        <div class="stat-card">
            <div class="number">${total}</div>
            <div class="label">Total Productos</div>
        </div>
        <div class="stat-card success">
            <div class="number">${activos}</div>
            <div class="label">Activos</div>
        </div>
        <div class="stat-card danger">
            <div class="number">${ocultos}</div>
            <div class="label">Ocultos</div>
        </div>
        <div class="stat-card warning">
            <div class="number">$${precioMax}</div>
            <div class="label">Precio Mayor</div>
        </div>
    `;
}

function renderizarFiltros() {
    const categorias = [...new Set(datos.productos.map(p => p.categoria).filter(Boolean))];
    const select = document.getElementById('filterCategoria');
    select.innerHTML = '<option value="todas">Todas las categorías</option>' +
        categorias.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ======================
// FILTRAR
// ======================
function filtrarProductos() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;
    const estado = document.getElementById('filterEstado').value;

    let filtrados = datos.productos;

    if (search) {
        filtrados = filtrados.filter(p => 
            p.nombre.toLowerCase().includes(search) ||
            p.descripcion?.toLowerCase().includes(search) ||
            (p.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }

    if (categoria !== 'todas') {
        filtrados = filtrados.filter(p => p.categoria === categoria);
    }

    if (estado === 'activos') {
        filtrados = filtrados.filter(p => p.publicar);
    } else if (estado === 'ocultos') {
        filtrados = filtrados.filter(p => !p.publicar);
    }

    renderizarProductos(filtrados);
}

// ======================
// CRUD (acciones de tarjeta)
// ======================
function togglePublicar(index) {
    datos.productos[index].publicar = !datos.productos[index].publicar;
    datos.productos[index].fechaModificacion = new Date().toISOString().split('T')[0];
    guardarLocal();
    renderizarTodo();
    mostrarToast(datos.productos[index].publicar ? '✅ Producto activado' : '👁️ Producto ocultado');
}

function eliminarProducto(index) {
    if (confirm('¿Eliminar este producto definitivamente?')) {
        datos.productos.splice(index, 1);
        guardarLocal();
        renderizarTodo();
        mostrarToast('🗑️ Producto eliminado');
    }
} 