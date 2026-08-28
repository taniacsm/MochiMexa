document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const { tienda, escapar, ruta } = Mochi;
    const id = new URLSearchParams(location.search).get('id');
    let producto, indiceRelacionados = 0, usuarioResena = '';
    const aviso = (elemento, mensaje, error = false) => { $(elemento).hidden = false; $(elemento).textContent = mensaje; $(elemento).dataset.error = String(error); };
    const categorias = { mochis: 'Mochis', poky: 'Pocky', bebidas: 'Bebidas', snacks: 'Otros snacks' };
    function cantidadValida() {
        const n = Number($('cantidadProducto').value), limite = Math.min(999, producto.stock ?? 999);
        if (!Number.isInteger(n) || n < 1 || n > limite) throw new Error(`Elige una cantidad entre 1 y ${limite}.`);
        return n;
    }
    function pintarRelacionados() {
        const todos = Mochi.productos.listar().filter(p => p.id !== id);
        const relacionados = [...todos.filter(p => p.categoria === producto.categoria), ...todos.filter(p => p.categoria !== producto.categoria)];
        indiceRelacionados = Math.min(indiceRelacionados, Math.max(0, relacionados.length - 4));
        $('productosRelacionados').innerHTML = relacionados.slice(indiceRelacionados, indiceRelacionados + 4).map(p => `<a class="producto-relacionado" href="${ruta('producto.html', { id: p.id })}"><img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}" loading="lazy"><div><h3>${escapar(p.nombre)}</h3><strong>${tienda.dinero(p.precio)}</strong></div></a>`).join('');
        $('relacionadosAnterior').disabled = indiceRelacionados === 0;
        $('relacionadosSiguiente').disabled = indiceRelacionados + 4 >= relacionados.length;
    }
    function pintarProducto() {
        producto = Mochi.productos.obtener(id);
        $('productoContenido').hidden = !producto;
        $('productoNoExiste').hidden = Boolean(producto);
        if (!producto) { $('dialogoFotoProducto').close(); document.title = 'Producto no disponible · MochiMexa'; return; }
        document.title = `${producto.nombre} · MochiMexa`;
        $('productoMiga').textContent = producto.nombre;
        $('productoNombre').textContent = producto.nombre;
        $('productoPrecio').textContent = `${tienda.dinero(producto.precio)} MXN`;
        $('productoDescripcion').textContent = producto.descripcion;
        $('productoCategoria').textContent = categorias[producto.categoria] || producto.categoria;
        $('productoImagen').src = producto.imagen; $('productoImagen').alt = producto.nombre;
        $('productoStock').textContent = producto.stock === 0 ? 'Agotado por el momento' : producto.stock == null ? 'Disponibilidad final por confirmar con la tienda.' : `${producto.stock} unidades disponibles`;
        ['comprarProducto', 'agregarProducto', 'masProducto', 'menosProducto', 'cantidadProducto'].forEach(k => { $(k).disabled = producto.stock === 0; });
        $('cantidadProducto').max = String(Math.min(999, producto.stock ?? 999));
        // Solo se muestran fotos del artículo real, no otros sabores como si
        // fueran ángulos del mismo producto. La galería admite fotos adicionales.
        const imagenes = [...new Set([producto.imagen, ...(Array.isArray(producto.imagenes) ? producto.imagenes.map(Mochi.imagenSegura) : [])])];
        $('productoMiniaturas').innerHTML = imagenes.map((imagen, i) => `<button type="button" data-imagen="${escapar(imagen)}" aria-label="Ver imagen ${i + 1} de ${escapar(producto.nombre)}" aria-pressed="${i === 0}"><img src="${escapar(imagen)}" alt="" loading="lazy"></button>`).join('');
        pintarRelacionados(); pintarResenas();
    }
    function pintarResenas() {
        const resenas = tienda.resenas(id), usuario = Mochi.usuarioActual();
        const propia = resenas.find(r => r.usuarioId === usuario?.id);
        $('escribirResena').textContent = propia ? 'Editar mi reseña' : 'Escribir reseña';
        const media = resenas.length ? resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length : 0;
        $('promedioResenas').textContent = resenas.length ? `★ ${media.toFixed(1)} / 5 · ${resenas.length} ${resenas.length === 1 ? 'reseña' : 'reseñas'}` : 'Sin calificaciones todavía';
        $('listaResenas').innerHTML = resenas.map(r => `<article class="resena-card"><h3>${escapar(r.autor)}</h3><time datetime="${escapar(r.fecha)}">${escapar(new Date(r.fecha).toLocaleDateString('es-MX'))}</time><span class="resena-estrellas" aria-label="${r.estrellas} de 5 estrellas">${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}</span><p>${escapar(r.comentario)}</p>${r.usuarioId === usuario?.id ? '<button type="button" class="tienda-enlace" data-eliminar-resena>Eliminar mi reseña</button>' : ''}</article>`).join('') || '<p class="tienda-nota">Sé la primera persona en compartir su experiencia con este producto.</p>';
    }
    function comprar(irAlPago) {
        try {
            if (!producto || !Cart.agregarProducto(id, cantidadValida())) return;
            if (irAlPago) Cart.pagar();
            else aviso('estadoProducto', `${producto.nombre} agregado al carrito.`);
        } catch (error) { aviso('estadoProducto', error.message, true); }
    }
    $('comprarProducto').addEventListener('click', () => comprar(true));
    $('agregarProducto').addEventListener('click', () => comprar(false));
    $('menosProducto').addEventListener('click', () => { $('cantidadProducto').value = String(Math.max(1, (Number($('cantidadProducto').value) || 1) - 1)); });
    $('masProducto').addEventListener('click', () => { $('cantidadProducto').value = String(Math.min(Number($('cantidadProducto').max), (Number($('cantidadProducto').value) || 1) + 1)); });
    $('productoMiniaturas').addEventListener('click', event => {
        const boton = event.target.closest('[data-imagen]');
        if (!boton) return;
        $('productoImagen').src = boton.dataset.imagen;
        document.querySelectorAll('#productoMiniaturas button').forEach(b => b.setAttribute('aria-pressed', String(b === boton)));
    });
    $('abrirFotoProducto').addEventListener('click', () => {
        $('fotoProductoAmpliada').src = $('productoImagen').src;
        $('fotoProductoAmpliada').alt = producto.nombre;
        $('dialogoFotoProducto').showModal();
    });
    $('cerrarFotoProducto').addEventListener('click', () => $('dialogoFotoProducto').close());
    $('relacionadosAnterior').addEventListener('click', () => { indiceRelacionados = Math.max(0, indiceRelacionados - 4); pintarRelacionados(); });
    $('relacionadosSiguiente').addEventListener('click', () => { indiceRelacionados += 4; pintarRelacionados(); });
    $('escribirResena').addEventListener('click', () => {
        if (!Mochi.usuarioActual()) return Mochi.pedirSesion(`${ruta('producto.html', { id })}#resenasProducto`);
        const usuario = tienda.cuenta();
        usuarioResena = usuario.id;
        const propia = tienda.resenas(id).find(r => r.usuarioId === usuario.id);
        $('estrellasResena').value = propia?.estrellas || '';
        $('comentarioResena').value = propia?.comentario || '';
        $('estadoResena').hidden = true;
        $('formResena').hidden = false;
        $('estrellasResena').focus();
    });
    $('cancelarResena').addEventListener('click', () => { $('formResena').hidden = true; });
    $('formResena').addEventListener('submit', event => {
        event.preventDefault();
        if (!$('formResena').reportValidity()) return;
        try {
            if (tienda.cuenta().id !== usuarioResena) throw new Error('La sesión cambió. Abre de nuevo el formulario de reseña.');
            if (!tienda.guardarResena(id, $('estrellasResena').value, $('comentarioResena').value)) return;
            $('formResena').hidden = true; pintarResenas();
        } catch (error) { aviso('estadoResena', error.message, true); }
    });
    $('listaResenas').addEventListener('click', event => {
        if (event.target.closest('[data-eliminar-resena]') && confirm('¿Eliminar tu reseña de este producto?')) {
            try { if (tienda.eliminarResena(id)) pintarResenas(); }
            catch (error) { aviso('estadoResena', error.message, true); }
        }
    });
    window.addEventListener('mochi:productos', pintarProducto);
    window.addEventListener('mochi:resenas', pintarResenas);
    window.addEventListener('mochi:sesion', () => { $('formResena').hidden = true; pintarResenas(); });
    window.addEventListener('storage', event => {
        if (['mochiResenas', 'usuarioSesion', 'usuariosRegistrados', null].includes(event.key)) { $('formResena').hidden = true; pintarResenas(); }
        if (['mochiProductosEditados', 'catalogoProductos', 'mochimexa_productos', null].includes(event.key)) pintarProducto();
    });
    window.addEventListener('pageshow', pintarProducto);
    pintarProducto();
});
