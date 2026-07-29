// ======================
// APP - LÓGICA PRINCIPAL
// ======================

function renderizarTodo() {
    if (!window.datos || !window.datos.productos) {
        console.error('❌ datos no disponible en renderizarTodo');
        return;
    }
    renderizarStats();
    renderizarFiltros();
    renderizarProductos();
}

function renderizarStats() {
    if (!window.datos || !window.datos.productos) return;
    
    const total = window.datos.productos.length;
    const activos = window.datos.productos.filter(p => p.publicar).length;
    const ocultos = total - activos;
    const precioMax = window.datos.productos.length > 0 
        ? Math.max(...window.datos.productos.map(p => p.precio || 0)) 
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
    if (!window.datos || !window.datos.productos) return;
    
    const categorias = [...new Set(window.datos.productos.map(p => p.categoria).filter(Boolean))];
    const select = document.getElementById('filterCategoria');
    if (select) {
        select.innerHTML = '<option value="todas">Todas las categorías</option>' +
            categorias.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

function filtrarProductos() {
    if (!window.datos || !window.datos.productos) return;
    
    const search = document.getElementById('searchInput').value.toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;
    const estado = document.getElementById('filterEstado').value;

    let filtrados = window.datos.productos;

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

function togglePublicar(index) {
    if (!window.datos || !window.datos.productos) return;
    
    window.datos.productos[index].publicar = !window.datos.productos[index].publicar;
    window.datos.productos[index].fechaModificacion = new Date().toISOString().split('T')[0];
    guardarLocal();
    renderizarTodo();
    mostrarToast(window.datos.productos[index].publicar ? '✅ Producto activado' : '👁️ Producto ocultado');
}

function eliminarProducto(index) {
    if (!window.datos || !window.datos.productos) return;
    
    if (confirm('¿Eliminar este producto definitivamente?')) {
        window.datos.productos.splice(index, 1);
        guardarLocal();
        renderizarTodo();
        mostrarToast('🗑️ Producto eliminado');
    }
}

// Hacer funciones globales
window.renderizarTodo = renderizarTodo;
window.renderizarStats = renderizarStats;
window.renderizarFiltros = renderizarFiltros;
window.filtrarProductos = filtrarProductos;
window.togglePublicar = togglePublicar;
window.eliminarProducto = eliminarProducto;