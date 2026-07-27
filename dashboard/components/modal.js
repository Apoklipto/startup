// ======================
// COMPONENTE MODAL
// ======================

let productoEditando = null;
let datos = null;

// Inicializar con referencia a los datos
function initModal(datosRef) {
    datos = datosRef;
}

function abrirModalNuevo() {
    productoEditando = null;
    document.getElementById('modalContent').innerHTML = formularioHTML({});
    document.getElementById('modalOverlay').classList.add('active');
}

function abrirModalEditar(index) {
    productoEditando = index;
    document.getElementById('modalContent').innerHTML = formularioHTML(datos.productos[index]);
    document.getElementById('modalOverlay').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function formularioHTML(p) {
    return `
        <h2>${productoEditando !== null ? '✏️ Editar' : '➕ Nuevo'} Producto</h2>
        
        <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="editNombre" value="${p.nombre || ''}" placeholder="Nombre del producto">
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Precio</label>
                <input type="number" id="editPrecio" value="${p.precio || 0}" placeholder="0">
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="editCategoria">
                    <option value="EcoFlow" ${p.categoria === 'EcoFlow' ? 'selected' : ''}>EcoFlow</option>
                    <option value="Kit Solar" ${p.categoria === 'Kit Solar' ? 'selected' : ''}>Kit Solar</option>
                    <option value="Inversores" ${p.categoria === 'Inversores' ? 'selected' : ''}>Inversores</option>
                    <option value="Paneles Solares" ${p.categoria === 'Paneles Solares' ? 'selected' : ''}>Paneles Solares</option>
                    <option value="Ventiladores" ${p.categoria === 'Ventiladores' ? 'selected' : ''}>Ventiladores</option>
                    <option value="Oupes" ${p.categoria === 'Oupes' ? 'selected' : ''}>Oupes</option>
                    <option value="Otros" ${p.categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label>Descripción</label>
            <textarea id="editDescripcion" placeholder="Descripción del producto">${p.descripcion || ''}</textarea>
        </div>

        <div class="form-group">
            <label>Imagen</label>
            <input type="text" id="editImagen" value="${p.imagen || ''}" placeholder="ej: delta2.jpg">
        </div>

        <div class="form-group">
            <label>Tags (separados por coma)</label>
            <input type="text" id="editTags" value="${(p.tags || []).join(', ')}" placeholder="bateria, solar">
        </div>

        <div class="preview">
            <strong>Vista previa:</strong><br>
            <span id="previewTexto">${p.nombre || 'Nombre'}</span><br>
            <span style="color: var(--text-secondary)">${(p.descripcion || '').substring(0, 50)}...</span><br>
            <span style="color: var(--warning); font-weight: bold;">Precio: ${p.precio || 0}. Escribir al ${datos.config.numeroContacto || '54320330'}</span>
        </div>

        <div class="modal-actions">
            <button class="btn btn-outline" onclick="cerrarModal()">Cancelar</button>
            ${productoEditando !== null ? `<button class="btn btn-danger" onclick="eliminarProducto(${productoEditando}); cerrarModal();">🗑️ Eliminar</button>` : ''}
            <button class="btn btn-primary" onclick="guardarProducto()">💾 Guardar</button>
        </div>
    `;
}

function guardarProducto() {
    const producto = {
        id: productoEditando !== null ? datos.productos[productoEditando].id : generarID(),
        nombre: document.getElementById('editNombre').value,
        descripcion: document.getElementById('editDescripcion').value,
        precio: parseInt(document.getElementById('editPrecio').value) || 0,
        imagen: document.getElementById('editImagen').value,
        categoria: document.getElementById('editCategoria').value,
        tags: document.getElementById('editTags').value.split(',').map(t => t.trim()).filter(Boolean),
        publicar: productoEditando !== null ? datos.productos[productoEditando].publicar : true,
        fechaCreacion: productoEditando !== null ? datos.productos[productoEditando].fechaCreacion : new Date().toISOString().split('T')[0],
        fechaModificacion: new Date().toISOString().split('T')[0]
    };

    if (productoEditando !== null) {
        datos.productos[productoEditando] = producto;
    } else {
        datos.productos.push(producto);
    }

    guardarLocal();
    renderizarTodo();
    cerrarModal();
    mostrarToast(productoEditando !== null ? '✅ Producto actualizado' : '✅ Producto creado');
}

function generarID() {
    return 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

// ======================
// VISTA PREVIA EN VIVO
// ======================
document.addEventListener('input', function(e) {
    if (e.target.closest('#modalContent')) {
        const nombre = document.getElementById('editNombre')?.value || 'Nombre';
        const desc = document.getElementById('editDescripcion')?.value || '';
        const precio = document.getElementById('editPrecio')?.value || '0';
        const preview = document.getElementById('previewTexto');
        if (preview) {
            preview.innerHTML = `
                <strong>${nombre}</strong><br>
                <span style="color: var(--text-secondary)">${desc.substring(0, 50)}...</span><br>
                <span style="color: var(--warning); font-weight: bold;">Precio: ${precio}. Escribir al ${datos.config.numeroContacto || '54320330'}</span>
            `;
        }
    }
});

// ======================
// CERRAR MODAL
// ======================
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) cerrarModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarModal();
});