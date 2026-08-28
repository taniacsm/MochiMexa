/* El mismo formulario sirve para registrar y editar. ?editar=ID carga el artículo
 * concreto; guardar actualiza ese ID sin duplicarlo ni cambiar otros productos. */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro-producto');
    const nombre = document.getElementById('nombreProducto');
    const descripcion = document.getElementById('descripcionProducto');
    const categoria = document.getElementById('categoriaProducto');
    const foto = document.getElementById('fotoProducto');
    const precio = document.getElementById('precioProducto');
    const stock = document.getElementById('stockProducto');
    const vista = {
        titulo: document.getElementById('previewTitulo'), descripcion: document.getElementById('previewDescripcion'),
        precio: document.getElementById('previewPrecio'), imagen: document.getElementById('previewImagen')
    };
    const botonGuardar = form.querySelector('button[type="submit"]');
    const idEditar = new URLSearchParams(location.search).get('editar');
    let original = idEditar ? Mochi.productos.obtener(idEditar) : null;
    const imagenInicial = vista.imagen.src;
    let imagenLista = true, versionImagen = 0;

    function alerta(mensaje, tipo = 'danger') {
        form.querySelector('.alert')?.remove();
        const aviso = document.createElement('div');
        aviso.className = `alert alert-${tipo} alert-dismissible fade show my-3 rounded-3`;
        aviso.setAttribute('role', 'alert');
        aviso.innerHTML = `${Mochi.escapar(mensaje)}
            ${tipo === 'success' ? `<div class="mt-2"><a href="${Mochi.ruta('catalogo.html')}" class="alert-link">Ver catálogo</a> · <a href="../pagesAdmin/homeAdmin.html#productos" class="alert-link">Volver a productos</a></div>` : ''}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar aviso"></button>`;
        form.insertBefore(aviso, form.firstChild);
        aviso.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (idEditar && !original) {
        document.getElementById('tituloProducto').textContent = 'Producto no encontrado';
        botonGuardar.disabled = true;
        alerta('No existe el producto solicitado. Vuelve al catálogo administrativo para seleccionar otro.');
        return;
    }
    if (original) {
        document.title = 'Editar producto | MochiMexa';
        document.getElementById('tituloProducto').textContent = 'Editar Producto';
        document.getElementById('descripcionFormulario').textContent = 'Actualiza este artículo. Los cambios se reflejarán en Inicio, Catálogo y Administración.';
        botonGuardar.textContent = 'Guardar cambios';
    }

    function actualizarVista() {
        vista.titulo.textContent = nombre.value.trim() || 'Nombre Del Producto';
        vista.descripcion.textContent = descripcion.value.trim() || 'Descripción previa del producto para previsualización en el catálogo...';
        vista.precio.textContent = Number.isFinite(Number(precio.value)) ? `$${Number(precio.value).toFixed(2)}` : '$0.00';
    }
    function restablecer() {
        versionImagen++;
        imagenLista = true;
        botonGuardar.disabled = false;
        if (original) {
            nombre.value = original.nombre;
            descripcion.value = original.descripcion;
            categoria.value = original.categoria;
            precio.value = original.precio;
            stock.value = original.stock ?? '';
            foto.value = '';
        }
        vista.imagen.src = original?.imagen || imagenInicial;
        actualizarVista();
    }
    // En edición, Resetear recupera lo último guardado, no un formulario vacío.
    form.addEventListener('reset', event => {
        if (original) { event.preventDefault(); restablecer(); }
        else {
            versionImagen++;
            imagenLista = true;
            botonGuardar.disabled = false;
            vista.imagen.src = imagenInicial;
            vista.titulo.textContent = 'Nombre Del Producto';
            vista.descripcion.textContent = 'Descripción previa del producto para previsualización en el catálogo...';
            vista.precio.textContent = '$0.00';
        }
    });
    [nombre, descripcion, precio].forEach(campo => campo.addEventListener('input', actualizarVista));
    if (original) restablecer();

    foto.addEventListener('change', () => {
        const version = ++versionImagen;
        const archivo = foto.files[0];
        imagenLista = true;
        botonGuardar.disabled = false;
        if (!archivo) { vista.imagen.src = original?.imagen || imagenInicial; return; }
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(archivo.type) || archivo.size > 2 * 1024 * 1024) {
            foto.value = '';
            vista.imagen.src = original?.imagen || imagenInicial;
            alerta('Usa una imagen PNG, JPG, WebP o GIF de hasta 2 MB.');
            return;
        }
        imagenLista = false;
        botonGuardar.disabled = true;
        const lector = new FileReader();
        lector.onload = event => {
            if (version !== versionImagen) return;
            vista.imagen.src = event.target.result;
            imagenLista = true;
            botonGuardar.disabled = false;
        };
        lector.onerror = () => {
            if (version !== versionImagen) return;
            imagenLista = true;
            botonGuardar.disabled = false;
            foto.value = '';
            vista.imagen.src = original?.imagen || imagenInicial;
            alerta('No se pudo leer la imagen. Selecciónala de nuevo.');
        };
        lector.readAsDataURL(archivo);
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity() || !imagenLista) return;
        const datos = { nombre: nombre.value, descripcion: descripcion.value, categoria: categoria.value,
            precio: precio.value, stock: stock.value, imagen: vista.imagen.src };
        try {
            const guardado = original ? Mochi.productos.editar(idEditar, datos) : Mochi.productos.registrar(datos);
            if (!guardado) return;
            if (original) original = Mochi.productos.obtener(idEditar);
            else form.reset();
            alerta(original ? 'Cambios guardados en este navegador. El artículo mantiene el mismo ID en todas las vistas.' : 'Producto registrado en este navegador y disponible en el catálogo.', 'success');
        } catch (error) { alerta(error.message); }
    });
});
