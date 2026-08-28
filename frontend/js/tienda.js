/* Datos de las tres vistas nuevas. Es una demostración local: no hay API de
 * usuarios, cobros ni envíos. Nunca se guardan tarjetas, CVC o datos bancarios. */
(() => {
    const estadosMX = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];
    const metodos = { tarjeta: 'Tarjeta', paypal: 'PayPal', spei: 'SPEI', oxxo: 'OXXO' };
    const metodosPagoPredeterminados = Object.freeze({ tarjeta: true, paypal: true, spei: true, oxxo: false });
    function metodosDisponibles() {
        const configurados = Mochi.leer('mochimexa_configuracion', {})?.metodosPago;
        // El mismo ajuste alimenta Administración y el resumen. Las claves
        // antiguas sin PayPal conservan su valor y reciben solo el valor faltante.
        return Object.keys(metodos).filter(id => (configurados?.[id] ?? metodosPagoPredeterminados[id]) === true);
    }
    // Son los mismos ejemplos que ya mostraba Administración. No se asignan
    // a una cuenta real ni se presentan como compras del usuario conectado.
    const pedidosSemilla = [
        { id: 'MX-0992-A', cliente: 'Sofía Martínez', ubicacion: 'Estado de México', fecha: '24 Oct, 10:30 AM', metodoPago: 'Tarjeta', total: 350, estado: 'Pendiente', tipoEnvio: 'Estándar' },
        { id: 'MX-0993-B', cliente: 'Carlos Reyes', ubicacion: 'Jalisco', fecha: '23 Oct, 14:15 PM', metodoPago: 'OXXO Pay', total: 890.50, estado: 'En camino', tipoEnvio: 'Express' },
        { id: 'MX-0994-C', cliente: 'Ana Gómez', ubicacion: 'Nuevo León', fecha: '22 Oct, 09:00 AM', metodoPago: 'SPEI', total: 120, estado: 'Entregado', tipoEnvio: 'Estándar' },
        { id: 'MX-0995-D', cliente: 'Pedro Sola', ubicacion: 'Ciudad de México', fecha: '21 Oct, 16:45 PM', metodoPago: 'Tarjeta', total: 540, estado: 'Cancelado', tipoEnvio: 'Estándar' }
    ];
    const lista = (clave, defecto = []) => {
        const datos = Mochi.leer(clave, defecto);
        return Array.isArray(datos) ? datos.filter(p => p && typeof p === 'object') : (Array.isArray(defecto) ? defecto : []);
    };
    const avisar = nombre => { if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event(nombre)); };
    const texto = valor => String(valor ?? '').trim();
    const dinero = importe => `$${Number(importe).toFixed(2)}`;

    function cuenta() {
        let usuario = Mochi.usuarioActual();
        if (!usuario) throw new Error('Inicia sesión para continuar.');
        // Las cuentas existentes reciben un ID una sola vez. Correo y nombre
        // se pueden editar sin perder direcciones, pedidos ni reseñas.
        if (!usuario.id) {
            if (!Mochi.iniciarSesion(usuario)) throw new Error('No se pudo preparar tu cuenta local.');
            usuario = Mochi.usuarioActual();
        }
        return usuario;
    }

    function guardarCuenta(usuario) {
        if (cuenta().id !== usuario.id) throw new Error('La sesión cambió. Vuelve a iniciar sesión.');
        const usuarios = Mochi.usuarios().map(u => u.id === usuario.id ? usuario : u);
        if (!Mochi.guardar('usuariosRegistrados', usuarios)) return false;
        avisar('mochi:sesion');
        return true;
    }

    function actualizarPerfil(datos) {
        const usuario = cuenta();
        const nombre = texto(datos.nombre), email = texto(datos.email).toLowerCase();
        const telefono = texto(datos.telefono).replace(/[\s()-]/g, '');
        if (nombre.length < 2 || nombre.length > 80) throw new Error('Escribe un nombre de 2 a 80 caracteres.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Escribe un correo válido.');
        if (!/^\d{10}$/.test(telefono)) throw new Error('El teléfono debe tener 10 dígitos.');
        if (Mochi.usuarios().some(u => u.id !== usuario.id && u.email.toLowerCase() === email)) throw new Error('Ese correo ya está registrado.');
        const foto = datos.foto ?? usuario.foto ?? '';
        if (foto && (!/^data:image\/(png|jpe?g|webp);base64,/i.test(foto) || foto.length > 2800000)) throw new Error('La foto debe ser PNG, JPG o WebP de hasta 2 MB.');
        return guardarCuenta({ ...usuario, nombre, email, telefono, foto });
    }

    function direcciones() { const datos = cuenta().direcciones; return Array.isArray(datos) ? datos : []; }
    function guardarDireccion(datos, id = '') {
        const usuario = cuenta();
        const anteriores = direcciones();
        if (id && !anteriores.some(d => d.id === id)) throw new Error('La dirección ya no existe.');
        const siguiente = Object.fromEntries(['alias', 'calle', 'colonia', 'ciudad', 'estado', 'cp'].map(k => [k, texto(datos[k])]));
        if (['alias', 'calle', 'colonia', 'ciudad'].some(k => siguiente[k].length < 2 || siguiente[k].length > 120)) throw new Error('Completa nombre, calle, colonia y municipio (2 a 120 caracteres).');
        if (!estadosMX.includes(siguiente.estado) || !/^\d{5}$/.test(siguiente.cp)) throw new Error('Selecciona un estado y un código postal de 5 dígitos.');
        siguiente.id = id || crypto.randomUUID();
        siguiente.principal = Boolean(datos.principal) || !anteriores.length || Boolean(anteriores.find(d => d.id === id)?.principal);
        const nuevas = [...anteriores.filter(d => d.id !== id).map(d => ({ ...d, principal: siguiente.principal ? false : d.principal })), siguiente];
        return guardarCuenta({ ...usuario, direcciones: nuevas }) ? siguiente.id : false;
    }
    function eliminarDireccion(id) {
        const nuevas = direcciones().filter(d => d.id !== id).map(d => ({ ...d }));
        if (nuevas.length && !nuevas.some(d => d.principal)) nuevas[0].principal = true;
        return guardarCuenta({ ...cuenta(), direcciones: nuevas });
    }

    async function cambiarClave(actual, nueva, confirmacion) {
        const usuario = cuenta();
        if (nueva.length < 8 || nueva.length > 128 || nueva !== confirmacion) throw new Error('Las contraseñas nuevas deben coincidir y tener de 8 a 128 caracteres.');
        if (!usuario.sal || await Mochi.derivarClave(actual, usuario.sal) !== usuario.claveHash) throw new Error('La contraseña actual no coincide.');
        const sal = crypto.randomUUID();
        const claveHash = await Mochi.derivarClave(nueva, sal);
        // Releer después de derivar impide sobrescribir otros cambios del perfil.
        const vigente = cuenta();
        if (vigente.id !== usuario.id || vigente.claveHash !== usuario.claveHash) throw new Error('La sesión o la contraseña cambió. Inténtalo otra vez.');
        return guardarCuenta({ ...vigente, sal, claveHash });
    }

    function pedidos() { return lista('mochimexa_pedidos', pedidosSemilla); }
    function misPedidos() { const id = cuenta().id; return pedidos().filter(p => p.usuarioId === id); }
    function carritoActual() {
        const agrupados = new Map();
        lista('mochiCart', Mochi.leer('miCarrito', [])).forEach(item => {
            const producto = Mochi.productos.encontrar(item.id, item.imagen || item.img);
            if (!producto) throw new Error('Un producto de tu carrito ya no está disponible. Revísalo antes de continuar.');
            const cantidad = Number(item.cantidad);
            if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 999) throw new Error('Revisa las cantidades del carrito.');
            const total = cantidad + (agrupados.get(producto.id)?.cantidad || 0);
            if (total > Math.min(999, producto.stock ?? 999)) throw new Error(`No hay stock suficiente de ${producto.nombre}. Ajusta tu carrito.`);
            agrupados.set(producto.id, { id: producto.id, nombre: producto.nombre, imagen: producto.imagen, precio: producto.precio, cantidad: total });
        });
        return Array.from(agrupados.values());
    }
    function descuento(codigo, subtotal) {
        if (!texto(codigo)) return 0;
        const cupones = Array.isArray(Mochi.config.cupones) ? Mochi.config.cupones : [];
        const cupon = cupones.find(c => c && c.activo !== false && Mochi.normalizar(c.codigo) === Mochi.normalizar(codigo));
        if (!cupon || (cupon.hasta && (!Number.isFinite(Date.parse(cupon.hasta)) || Date.parse(cupon.hasta) < Date.now()))) throw new Error('El código no está disponible o ya venció.');
        if (!Number.isFinite(cupon.valor) || cupon.valor <= 0 || !['porcentaje', 'importe'].includes(cupon.tipo)) throw new Error('El código no está configurado correctamente.');
        if (subtotal < Math.round((cupon.minimo || 0) * 100)) throw new Error(`El código requiere un subtotal de ${dinero(cupon.minimo)}.`);
        return Math.min(subtotal, Math.round(cupon.tipo === 'porcentaje' ? subtotal * Math.min(cupon.valor, 100) / 100 : cupon.valor * 100));
    }
    function cotizar(direccionId = '', codigo = '') {
        const items = carritoActual();
        const subtotal = items.reduce((suma, p) => suma + Math.round(p.precio * 100) * p.cantidad, 0);
        const direccion = Mochi.usuarioActual() ? direcciones().find(d => d.id === direccionId) : null;
        const configuracion = Mochi.leer('mochimexa_configuracion', {}) || {};
        const tarifa = direccion ? Number(direccion.estado === 'Ciudad de México' ? configuracion.envioCdmx ?? 80 : configuracion.envioInterior ?? 150) : 0;
        if (!Number.isFinite(tarifa) || tarifa < 0) throw new Error('Revisa la tarifa de envío en Configuración.');
        const envio = items.length ? Math.round(tarifa * 100) : 0;
        if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(envio) || !Number.isSafeInteger(subtotal + envio)) throw new Error('El importe excede el límite permitido. Revisa precios y cantidades.');
        const rebaja = descuento(codigo, subtotal);
        // Centavos enteros: el total siempre coincide con el detalle mostrado.
        const firma = JSON.stringify({ items, direccion, subtotal, envio, rebaja });
        return { items, direccion, subtotal, envio, descuento: rebaja, total: subtotal - rebaja + envio, firma };
    }

    function crearPedido({ direccionId, metodo, codigo = '', solicitudId, firma }) {
        const usuario = cuenta();
        if (!solicitudId || typeof solicitudId !== 'string') throw new Error('Recarga el resumen para iniciar un pedido.');
        const anteriores = pedidos();
        const existente = anteriores.find(p => p.usuarioId === usuario.id && p.solicitudId === solicitudId);
        if (existente) return { pedido: existente, repetido: true, carritoVaciado: lista('mochiCart').length === 0 };
        const resumen = cotizar(direccionId, codigo);
        if (!resumen.items.length) throw new Error('Tu carrito está vacío.');
        if (!resumen.direccion) throw new Error('Agrega o selecciona una dirección de envío.');
        if (!Object.hasOwn(metodos, metodo)) throw new Error('Selecciona un método de pago.');
        // Se comprueba otra vez al confirmar por si Administración desactivó
        // la opción mientras el usuario mantenía abierto el resumen.
        if (!metodosDisponibles().includes(metodo)) throw new Error('Este método de pago ya no está disponible. Selecciona otra opción.');
        if (resumen.firma !== firma) throw new Error('El carrito, el precio o la dirección cambió. Revisa el resumen y vuelve a confirmar.');
        const fecha = new Date();
        const pedido = {
            id: `MM-${crypto.randomUUID()}`, solicitudId, usuarioId: usuario.id,
            cliente: usuario.nombre, email: usuario.email, ubicacion: resumen.direccion.estado,
            fecha: fecha.toLocaleDateString('es-MX'), creadoEn: fecha.toISOString(),
            items: resumen.items, direccion: { ...resumen.direccion }, tipoEnvio: 'Estándar',
            subtotal: resumen.subtotal / 100, descuento: resumen.descuento / 100,
            costoEnvio: resumen.envio / 100, total: resumen.total / 100, metodoPago: metodos[metodo],
            estado: 'Pendiente', estadoPago: 'Sin cobrar', modo: 'demostracion'
        };
        if (!Mochi.guardar('mochimexa_pedidos', [pedido, ...anteriores])) return false;
        // La escritura del pedido es previa al vaciado. Reintentar la misma
        // solicitud nunca duplica el pedido si el navegador falla al limpiar.
        const carritoVaciado = Mochi.guardar('mochiCart', []);
        avisar('mochi:carrito');
        avisar('mochi:pedidos');
        return { pedido, carritoVaciado };
    }

    function resenas(productoId) { return lista('mochiResenas').filter(r => r.productoId === productoId && Number.isInteger(r.estrellas) && r.estrellas >= 1 && r.estrellas <= 5); }
    function guardarResena(productoId, estrellas, comentario) {
        const usuario = cuenta();
        if (!Mochi.productos.obtener(productoId)) throw new Error('El producto no existe.');
        const mensaje = texto(comentario), puntuacion = Number(estrellas);
        if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) throw new Error('Selecciona de 1 a 5 estrellas.');
        if (mensaje.length < 10 || mensaje.length > 1000) throw new Error('Escribe una reseña de 10 a 1000 caracteres.');
        const anteriores = lista('mochiResenas');
        const propia = anteriores.find(r => r.productoId === productoId && r.usuarioId === usuario.id);
        const resena = { id: propia?.id || crypto.randomUUID(), productoId, usuarioId: usuario.id, autor: usuario.nombre, estrellas: puntuacion, comentario: mensaje, fecha: new Date().toISOString() };
        const nuevas = [resena, ...anteriores.filter(r => !(r.productoId === productoId && r.usuarioId === usuario.id))];
        if (!Mochi.guardar('mochiResenas', nuevas)) return false;
        avisar('mochi:resenas');
        return true;
    }
    function eliminarResena(productoId) {
        const id = cuenta().id;
        if (!Mochi.guardar('mochiResenas', lista('mochiResenas').filter(r => !(r.productoId === productoId && r.usuarioId === id)))) return false;
        avisar('mochi:resenas');
        return true;
    }

    Mochi.tienda = { estadosMX, metodos, metodosPagoPredeterminados, metodosDisponibles, pedidosSemilla, dinero, cuenta, actualizarPerfil, direcciones, guardarDireccion, eliminarDireccion, cambiarClave, pedidos, misPedidos, carritoActual, cotizar, crearPedido, resenas, guardarResena, eliminarResena };
})();
