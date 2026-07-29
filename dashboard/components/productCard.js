// ======================
// COMPONENTE TARJETA DE PRODUCTO
// ======================

function renderizarProductos(productosFiltrados = null) {
    if (!window.datos || !window.datos.productos) {
        console.error('❌ datos no disponible en renderizarProductos');
        return;
    }
    
    const productos = productosFiltrados || window.datos.productos;
    const grid = document.getElementById('productosGrid');

    if (!grid) return;

    if (productos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="icon">📭</div>
                <p>No se encontraron productos</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = productos.map((p, index) => `
        <div class="producto-card ${p.publicar ? '' : 'oculto'}" data-index="${index}">
            <div class="estado"></div>
            <div class="categoria">${p.categoria || 'Sin categoría'}</div>
            <div class="nombre">${p.nombre}</div>
            <div class="descripcion">${p.descripcion || 'Sin descripción'}</div>
            <div class="precio">$${p.precio || 0}</div>
            <div class="imagen">🖼️ ${p.imagen || 'N/A'}</div>
            <div class="acciones">
                <button class="btn btn-primary btn-sm" onclick="abrirModalEditar(${index})">✏️ Editar</button>
                <button class="btn btn-warning btn-sm" onclick="togglePublicar(${index})">${p.publicar ? '👁️ Ocultar' : '✅ Publicar'}</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.renderizarProductos = renderizarProductos;