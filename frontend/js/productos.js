/* Fuente compartida de productos. Inicio, catálogo, editor y carrito consultan
 * el mismo ID y precio. Los importes base conservan la referencia del catálogo.
 * Los cambios son locales: el futuro backend deberá validar precios e inventario. */
(() => {
    const carpeta = '../assets/imagenes/productosCatalogo/';
    const bases = [
        { id: 'mochi-matcha', nombre: 'Mochi Matcha', precio: 45, categoria: 'mochis', imagen: 'mochis/Mochi Matcha.png', descripcion: 'Matcha de Uji + Toque de Vainilla.', badge: 'EN STOCK' },
        { id: 'pocky-fresa', nombre: 'Poky Fresa', precio: 35, categoria: 'poky', imagen: 'pokis/Pokys Fresa.png', descripcion: 'Doble cobertura de Fresa Natural.', badge: 'EN STOCK' },
        { id: 'ramune-natural', nombre: 'Ramune Natural', precio: 85, categoria: 'bebidas', imagen: 'ramune/Ramune Natural.png', descripcion: 'Refresco icónico con canica sabor natural.', badge: 'EN STOCK' },
        { id: 'mochi-fresa', nombre: 'Mochi Fresa', precio: 45, categoria: 'mochis', imagen: 'mochis/Mochi Fresa.png', descripcion: 'Mochi con Fresa Natural.', badge: 'TOP 4' },
        { id: 'pocky-chocolate', nombre: 'Poky Chocolate', precio: 35, categoria: 'poky', imagen: 'pokis/Pokys Cholocate.png', descripcion: 'Doble cobertura de Chocolate.', badge: 'EN STOCK' },
        { id: 'ramune-lychee', nombre: 'Ramune Lychee', precio: 50, categoria: 'bebidas', imagen: 'ramune/Ramune Lychee.png', descripcion: 'Refresco icónico con canica sabor Lychee.', badge: 'EN STOCK' },
        { id: 'mochi-mango', nombre: 'Mochi Mango', precio: 45, categoria: 'mochis', imagen: 'mochis/Mochi Mango.png', descripcion: 'Mochi Mango natural.', badge: 'QUEDAN POCOS' },
        { id: 'pocky-oreo', nombre: 'Pokys Oreo', precio: 85, categoria: 'poky', imagen: 'pokis/Pokys Cookies & Cream.png', descripcion: 'Doble cobertura de oreo.', badge: 'EN STOCK' },
        { id: 'ramune-fresa', nombre: 'Ramune de Fresa', precio: 85, categoria: 'bebidas', imagen: 'ramune/Ramune  Fresa.png', descripcion: 'Refresco icónico con canica sabor fresa.', badge: 'EN STOCK' },
        { id: 'mochi-taro', nombre: 'Mochi Taro', precio: 45, categoria: 'mochis', imagen: 'mochis/Mochi Taro.png', descripcion: 'Mochi Taro Natural.', badge: 'EN STOCK' },
        // Estos cinco ya estaban en Inicio; ahora también se pueden encontrar
        // y editar desde el catálogo, sin duplicar un mismo producto.
        { id: 'kitkat-sake', nombre: 'KitKat Sake', precio: 62, categoria: 'snacks', imagen: 'kitkat/kitKatSake.jpg', descripcion: 'Edición especial Japón.', badge: 'EN STOCK' },
        { id: 'ramune-uva', nombre: 'Ramune Uva', precio: 55, categoria: 'bebidas', imagen: 'ramune/Ramune Uva.png', descripcion: 'Refresco icónico con canica sabor uva.', badge: 'EN STOCK' },
        { id: 'mochi-lychee', nombre: 'Mochi sabor Lychee', precio: 45, categoria: 'mochis', imagen: 'mochis/Mochi Lychee.png', descripcion: 'Edición Lychee Natural.', badge: 'EN STOCK' },
        { id: 'pocky-matcha', nombre: 'Pokis Matcha', precio: 38, categoria: 'poky', imagen: 'pokis/Pokys Matcha.png', descripcion: 'Edición especial Matcha.', badge: 'EN STOCK' },
        { id: 'ramune-melon', nombre: 'Ramune Melón', precio: 55, categoria: 'bebidas', imagen: 'ramune/Ramune Melon.png', descripcion: 'Refresco icónico con canica sabor melón.', badge: 'EN STOCK' }
    ].map(p => ({ ...p, imagen: carpeta + p.imagen, stock: null, sku: p.id.toUpperCase() }));

    const cambiosClave = 'mochiProductosEditados';
    const categoria = valor => ({ snacks: 'poky', pockys: 'poky', pocky: 'poky' }[Mochi.normalizar(valor)] || Mochi.normalizar(valor));
    const rutaImagen = valor => {
        try { return decodeURIComponent(new URL(Mochi.imagenSegura(valor)).pathname).split('/assets/').pop(); }
        catch { return String(valor); }
    };
    const listaGuardada = clave => {
        const datos = Mochi.leer(clave, []);
        return Array.isArray(datos) ? datos.filter(p => p && p.nombre) : [];
    };
    const leerCambios = () => {
        const datos = Mochi.leer(cambiosClave, {});
        return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
    };

    function listar() {
        const lista = bases.map(p => ({ ...p }));
        listaGuardada('catalogoProductos').forEach((p, indice) => lista.push({
            ...p, id: `local-${p.id || indice}`, categoria: p.versionCatalogo === 2 ? p.categoria : categoria(p.categoria), sku: p.sku || `LOCAL-${p.id || indice}`
        }));
        // Las altas antiguas del panel se conservan. Sus copias de productos base
        // no vuelven a introducir los precios contradictorios de demostración.
        listaGuardada('mochimexa_productos').forEach((p, indice) => {
            const id = String(p.id).startsWith('local-') ? String(p.id) : `admin-${p.id || indice}`;
            if (lista.some(item => item.id === id || rutaImagen(item.imagen) === rutaImagen(p.imagen))) return;
            lista.push({ ...p, id, categoria: categoria(p.categoria) });
        });
        const cambios = leerCambios();
        return lista.map(p => {
            const editado = cambios[p.id];
            const producto = { ...p, ...(editado && typeof editado === 'object' ? editado : {}), id: p.id };
            const stock = producto.stock == null ? null : Number(producto.stock);
            return { ...producto, precio: Number(producto.precio), stock, imagen: Mochi.imagenSegura(producto.imagen),
                descripcion: producto.descripcion || '', estado: stock === 0 ? 'Inactivo' : 'Activo',
                badge: stock === 0 ? 'AGOTADO' : (producto.badge || 'EN STOCK') };
        }).filter(p => Number.isFinite(p.precio) && p.precio > 0);
    }

    function obtener(id) { return listar().find(p => p.id === String(id)); }
    function encontrar(id, imagen) {
        const directo = obtener(id);
        if (directo) return directo;
        if (!imagen || String(imagen).startsWith('data:')) return undefined;
        // Compatibilidad con carritos anteriores, que identificaban por imagen.
        const base = bases.find(p => rutaImagen(p.imagen) === rutaImagen(imagen));
        return base ? obtener(base.id) : listar().find(p => rutaImagen(p.imagen) === rutaImagen(imagen));
    }

    function validar(datos) {
        if (String(datos.nombre || '').trim().length < 3) throw new Error('El nombre debe tener al menos 3 caracteres.');
        if (String(datos.descripcion || '').trim().length < 10) throw new Error('La descripción debe tener al menos 10 caracteres.');
        if (!['mochis', 'bebidas', 'poky', 'snacks'].includes(datos.categoria)) throw new Error('Selecciona una categoría válida.');
        const precio = Number(datos.precio), stock = Number(datos.stock);
        if (!Number.isFinite(precio) || precio <= 0 || precio * 100 > Number.MAX_SAFE_INTEGER || Math.abs(precio * 100 - Math.round(precio * 100)) > 0.000001) throw new Error('El precio debe ser positivo y tener como máximo dos decimales.');
        if (datos.stock === '' || datos.stock == null || !Number.isSafeInteger(stock) || stock < 0) throw new Error('El stock debe ser un número entero no negativo.');
        return { nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim(), categoria: datos.categoria,
            precio, stock, imagen: Mochi.imagenSegura(datos.imagen) };
    }

    function editar(id, datos) {
        if (!obtener(id)) throw new Error('El producto ya no está disponible. Vuelve al catálogo administrativo.');
        const siguiente = validar(datos);
        if (!Mochi.guardar(cambiosClave, { ...leerCambios(), [id]: siguiente })) return false;
        avisar();
        return true;
    }

    function registrar(datos) {
        const siguiente = { ...validar(datos), id: crypto.randomUUID(), versionCatalogo: 2, fechaRegistro: new Date().toISOString() };
        if (!Mochi.guardar('catalogoProductos', [...listaGuardada('catalogoProductos'), siguiente])) return false;
        avisar();
        return `local-${siguiente.id}`;
    }

    function avisar() {
        if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('mochi:productos'));
    }

    Mochi.productos = { listar, obtener, encontrar, editar, registrar };
})();
