/* Navegación y carrito compartidos: se inicializan después de insertar los
 * componentes. No se cambian clases, colores ni contenedores de las páginas. */
(() => {
    const { leer, guardar, ruta, escapar, imagenSegura } = Mochi;

    class CartController {
        constructor() {
            const guardado = leer('mochiCart', leer('miCarrito', []));
            this.carrito = [];
            // Aceptamos los dos formatos anteriores sin borrar sus claves.
            (Array.isArray(guardado) ? guardado : []).forEach(producto => {
                if (!producto || !producto.nombre) return;
                const actual = Mochi.productos.encontrar(producto.id, producto.imagen || producto.img);
                const precio = actual?.precio ?? Number(producto.precio);
                const cantidad = Number(producto.cantidad);
                if (!Number.isFinite(precio) || precio <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) return;
                const imagen = actual?.imagen || imagenSegura(producto.imagen || producto.img);
                const id = actual?.id || this.claveImagen(imagen, producto.id);
                const existente = this.carrito.find(item => item.id === id);
                if (existente) existente.cantidad = Math.min(999, existente.cantidad + cantidad);
                else this.carrito.push({ id, imagen, nombre: actual?.nombre || String(producto.nombre), alt: actual?.nombre || String(producto.alt || producto.nombre), descripcion: actual?.descripcion || String(producto.descripcion || producto.desc || ''), precio, cantidad: Math.min(999, cantidad) });
            });
        }

        claveImagen(imagen, id) {
            // Los IDs 4, 5, etc. representaban artículos distintos en Inicio y
            // Catálogo. El archivo de imagen identifica el mismo artículo en ambos.
            if (String(id).startsWith('local-')) return String(id);
            if (imagen.startsWith('data:')) return `local-${id}`;
            const clave = new URL(imagen, location.href).pathname.split('/assets/').pop();
            try { return decodeURIComponent(clave); } catch { return clave; }
        }

        additem(id, boton) {
            const card = boton?.closest('.card');
            const img = card?.querySelector('img') || document.getElementById(`imgprod${id}`);
            const nombre = card?.querySelector('h5') || document.getElementById(`nameprod${id}`);
            const precioEl = card?.querySelector('.price-tag, [id^="priceprod"]') || document.getElementById(`priceprod${id}`);
            const descripcion = card?.querySelector('p') || document.getElementById(`descprod${id}`);
            const actual = Mochi.productos.encontrar(card?.dataset?.productId || id, img?.src);
            if (actual) {
                if (!this.agregarProducto(actual.id, 1)) return;
                const modal = document.getElementById('carritoModal');
                if (modal && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modal).show();
                else alert(`${actual.nombre} agregado al carrito.`);
                return;
            }
            if (actual?.stock === 0) return alert('Este producto está agotado.');
            const precio = actual?.precio ?? Number(precioEl?.textContent.replace(/[^\d.]/g, ''));
            if (!img || !nombre || !Number.isFinite(precio) || precio <= 0) {
                alert('No se pudo identificar este producto. Inténtalo desde el catálogo.');
                return;
            }
            const imagen = actual?.imagen || imagenSegura(img.src);
            const clave = actual?.id || this.claveImagen(imagen, id);
            const siguiente = this.carrito.map(item => ({ ...item }));
            const existente = siguiente.find(item => item.id === clave);
            if (existente && existente.cantidad >= 999) return alert('Se alcanzó el límite de 999 unidades por producto.');
            if (existente) {
                existente.cantidad++;
                if (actual) Object.assign(existente, { precio, imagen, nombre: actual.nombre, descripcion: actual.descripcion });
            }
            else siguiente.push({ id: clave, imagen, alt: img.alt, nombre: actual?.nombre || nombre.textContent.trim(), descripcion: actual?.descripcion || descripcion?.textContent.trim() || '', precio, cantidad: 1 });
            if (!this.guardar(siguiente)) return;
            if (!actual && existente && existente.precio !== precio) {
                alert(`Este producto aparece con precios distintos en Inicio y Catálogo. Se conserva el precio de tu carrito: $${existente.precio.toFixed(2)}. Confírmalo con la tienda antes de comprar.`);
            }
            // La ventana existente da confirmación visible sin añadir elementos
            // a las tarjetas ni cambiar su tamaño.
            const modal = document.getElementById('carritoModal');
            if (modal && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modal).show();
            else alert(`${nombre.textContent.trim()} agregado al carrito.`);
        }

        guardar(siguiente) {
            if (!guardar('mochiCart', siguiente)) return false;
            if (!siguiente.length) {
                // Un carrito nuevo puede generar otro pedido legítimo idéntico.
                try { sessionStorage.removeItem('mochiIntentoPedido'); } catch { /* No afecta al carrito ya guardado. */ }
            }
            this.carrito = siguiente;
            this.renderCarrito();
            if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('mochi:carrito'));
            return true;
        }

        // El detalle compra por ID y cantidad; no necesita simular una tarjeta
        // del catálogo ni tomar precios de texto HTML.
        agregarProducto(id, cantidad = 1) {
            const producto = Mochi.productos.obtener(id);
            if (!producto) { alert('El producto ya no está disponible.'); return false; }
            const limite = Math.min(999, producto.stock ?? 999);
            const vigente = new CartController();
            const anterior = vigente.carrito.find(p => p.id === producto.id);
            if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad + (anterior?.cantidad || 0) > limite) {
                alert(limite === 0 ? 'Este producto está agotado.' : `Puedes tener como máximo ${limite} unidades de este producto en el carrito.`);
                return false;
            }
            const siguiente = vigente.carrito.map(p => ({ ...p }));
            const existente = siguiente.find(p => p.id === producto.id);
            if (existente) existente.cantidad += cantidad;
            else siguiente.push({ id: producto.id, nombre: producto.nombre, alt: producto.nombre, descripcion: producto.descripcion, imagen: producto.imagen, precio: producto.precio, cantidad });
            return this.guardar(siguiente);
        }

        recargar() { this.carrito = new CartController().carrito; this.renderCarrito(); }

        incrementar(id) { this.cambiarCantidad(id, 1); }
        decrementar(id) { this.cambiarCantidad(id, -1); }
        cambiarCantidad(id, diferencia) {
            this.recargar();
            const item = this.carrito.find(producto => producto.id === id);
            if (!item) return;
            if (item.cantidad + diferencia > 999) return alert('Se alcanzó el límite de 999 unidades por producto.');
            const actual = Mochi.productos.obtener(id);
            if (diferencia > 0 && actual?.stock != null && item.cantidad + diferencia > actual.stock) return alert('No hay más stock disponible de este producto.');
            this.guardar(this.carrito.map(producto => producto.id === id ? { ...producto, cantidad: producto.cantidad + diferencia } : producto).filter(producto => producto.cantidad > 0));
        }
        eliminarItem(id) { this.recargar(); this.guardar(this.carrito.filter(producto => producto.id !== id)); }

        actualizarProductos() {
            this.carrito = this.carrito.map(item => {
                const actual = Mochi.productos.encontrar(item.id, item.imagen);
                return actual ? { ...item, id: actual.id, nombre: actual.nombre, imagen: actual.imagen, descripcion: actual.descripcion, precio: actual.precio } : item;
            });
            this.renderCarrito();
        }

        renderCarrito() {
            // El navbar puede terminar de cargar antes que el panel lateral.
            // Actualizamos el contador incluso cuando todavía no existe el modal.
            const unidades = this.carrito.reduce((suma, item) => suma + item.cantidad, 0);
            const descripcion = unidades ? `${unidades} ${unidades === 1 ? 'producto' : 'productos'} en el carrito` : 'Carrito vacío';
            document.querySelectorAll('[data-cart-count]').forEach(contador => {
                contador.textContent = String(unidades);
                contador.hidden = unidades === 0;
            });
            document.querySelectorAll('[data-cart-link]').forEach(enlace => {
                enlace.setAttribute('aria-label', `Ver carrito: ${descripcion}`);
                enlace.title = descripcion;
            });
            document.querySelectorAll('[data-cart-status]').forEach(estado => {
                // Evita repetir anuncios al renderizar sin cambios de cantidad.
                if (estado.textContent !== descripcion) estado.textContent = descripcion;
            });
            const lista = document.getElementById('listaCarrito');
            const total = document.getElementById('totalCarrito');
            if (!lista || !total) return;
            lista.innerHTML = this.carrito.length ? this.carrito.map(item => `
                <div class="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom">
                    <img src="${escapar(item.imagen)}" alt="${escapar(item.alt)}" style="width:64px; height:64px; object-fit:cover; border-radius:12px;">
                    <div class="flex-grow-1">
                        <p class="mb-1 fw-semibold">${escapar(item.nombre)}</p>
                        <p class="mb-1 text-muted extra-small">${escapar(item.descripcion)}</p>
                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" data-cart-action="decrementar" data-id="${escapar(item.id)}" aria-label="Quitar una unidad de ${escapar(item.nombre)}">-</button>
                            <span>${item.cantidad}</span>
                            <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" data-cart-action="incrementar" data-id="${escapar(item.id)}" aria-label="Agregar una unidad de ${escapar(item.nombre)}">+</button>
                        </div>
                    </div>
                    <div class="text-end">
                        <p class="fw-bold mb-2">$${(item.precio * item.cantidad).toFixed(2)}</p>
                        <button type="button" class="btn btn-sm text-danger p-0" data-cart-action="eliminarItem" data-id="${escapar(item.id)}" aria-label="Eliminar ${escapar(item.nombre)}"><i class="bi bi-trash"></i></button>
                    </div>
                </div>`).join('') : '<p class="text-muted text-center py-4">Tu carrito está vacío</p>';
            const centavos = this.carrito.reduce((suma, item) => suma + Math.round(item.precio * 100) * item.cantidad, 0);
            total.textContent = `$${(centavos / 100).toFixed(2)}`;
            const pagar = document.querySelector('.btn-pagar');
            if (pagar) pagar.disabled = this.carrito.length === 0;
        }

        pagar() {
            this.recargar();
            if (!this.carrito.length) return alert('Agrega un producto antes de continuar.');
            // Primero se abre el resumen; navegar no registra pedidos ni cobra.
            if (this.guardar(this.carrito)) location.href = ruta('resumenPedido.html');
        }
    }

    window.Cart = new CartController();

    async function cargarComponente(id, pagina) {
        const contenedor = document.getElementById(id);
        if (!contenedor || contenedor.children.length) return;
        try {
            const respuesta = await fetch(ruta(pagina));
            if (!respuesta.ok) throw new Error(`${pagina}: ${respuesta.status}`);
            contenedor.innerHTML = await respuesta.text();
        } catch (error) {
            console.error('No se pudo cargar el componente:', error);
            contenedor.textContent = 'No se pudo cargar esta sección. Recarga la página desde un servidor local.';
        }
    }

    function iniciarNavbar() {
        const navbar = document.querySelector('.custom-navbar');
        if (!navbar) return;
        if (document.body.classList.contains('pagina-inicio') || document.body.classList.contains('pagina-contacto') || document.body.classList.contains('pagina-tienda')) {
            // El menú móvil puede aumentar de altura: medimos el navbar en lugar
            // de fijar un padding que solo funciona en una pantalla concreta.
            // Inicio y Contacto añaden después su margen pequeño desde su CSS.
            const reservarEspacio = () => document.documentElement.style.setProperty('--mochi-navbar-height', `${Math.ceil(navbar.getBoundingClientRect().height)}px`);
            reservarEspacio();
            if (typeof ResizeObserver !== 'undefined') new ResizeObserver(reservarEspacio).observe(navbar);
            window.addEventListener('resize', reservarEspacio);
            navbar.addEventListener('shown.bs.collapse', reservarEspacio);
            navbar.addEventListener('hidden.bs.collapse', reservarEspacio);
        }
        navbar.querySelectorAll('.custom-link').forEach(link => {
            const activo = new URL(link.href).pathname === location.pathname;
            link.classList.toggle('active', activo);
            if (activo) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        const buscador = navbar.querySelector('input[type="search"]');
        buscador.value = new URLSearchParams(location.search).get('q') || '';
        // Conservamos el div y el input originales; Enter funciona también en móvil.
        buscador.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (location.pathname === new URL(ruta('catalogo.html')).pathname) return;
                location.href = ruta('catalogo.html', buscador.value.trim() ? { q: buscador.value.trim() } : {});
            }
        });
        actualizarCuentaNavbar();
    }

    function actualizarCuentaNavbar() {
        const navbar = document.querySelector('.custom-navbar');
        if (!navbar) return;
        const sesion = Mochi.sesion();
        const links = navbar.querySelectorAll('.dropdown-item');
        if (sesion?.email && links.length >= 2) {
            links[0].textContent = 'Mi perfil';
            links[0].title = sesion.nombre || sesion.email;
            links[0].href = ruta('perfil.html');
            links[1].textContent = 'Cerrar sesión';
            links[1].href = ruta('iniciaSesion.html');
            links[1].setAttribute('data-cerrar-sesion', '');
        } else if (links.length >= 2) {
            links[0].textContent = 'Iniciar sesión'; links[0].href = ruta('iniciaSesion.html');
            links[0].removeAttribute('title');
            links[1].textContent = 'Registrarse'; links[1].href = ruta('registroUsuarios.html');
            links[1].removeAttribute('data-cerrar-sesion');
        }
    }

    function iniciarFooter() {
        const footer = document.querySelector('footer#mochiFooter');
        if (!footer) return;
        const favorito = footer.querySelector('[aria-label="Favoritos"]');
        const pagina = location.pathname;
        const favoritos = () => { const datos = leer('mochiPaginasFavoritas', []); return Array.isArray(datos) ? datos : []; };
        const actualizar = () => {
            favorito.setAttribute('aria-pressed', String(favoritos().includes(pagina)));
            favorito.title = favoritos().includes(pagina) ? 'Quitar esta página de favoritos locales' : 'Guardar esta página en favoritos locales';
        };
        actualizar();
        favorito.addEventListener('click', () => {
            const datos = favoritos();
            const existe = datos.includes(pagina);
            if (guardar('mochiPaginasFavoritas', existe ? datos.filter(item => item !== pagina) : [...datos, pagina])) {
                actualizar();
                alert(existe ? 'Página retirada de tus favoritos locales.' : 'Página guardada como favorita en este navegador.');
            }
        });
        footer.querySelector('[aria-label="Compartir"]').addEventListener('click', async () => {
            const datos = { title: 'MochiMexa', text: 'Dulzura Japonesa con Corazón Mexicano', url: ruta('index.html') };
            try {
                if (navigator.share) await navigator.share(datos);
                else if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(datos.url);
                    alert('Enlace copiado. Si estás usando localhost, solo abrirá en tu computadora.');
                } else window.prompt('Copia este enlace de MochiMexa:', datos.url);
            } catch (error) {
                if (error.name !== 'AbortError') window.prompt('No se pudo compartir automáticamente. Copia el enlace:', datos.url);
            }
        });
        footer.querySelector('.newsletter-form').addEventListener('submit', event => {
            event.preventDefault();
            if (!event.currentTarget.reportValidity()) return;
            const correo = event.currentTarget.querySelector('input').value.trim();
            alert('La suscripción automática aún no está disponible. Abriremos una solicitud de información; no quedarás suscrito hasta que la tienda lo confirme.');
            Mochi.contacto('suscripcion', 'Quisiera información sobre la Suscripción Candy y las promociones de MochiMexa.', correo);
        });
    }

    document.addEventListener('click', event => {
        if (event.target.closest('[data-cerrar-sesion]')) {
            event.preventDefault();
            Mochi.cerrarSesion();
            location.href = ruta('iniciaSesion.html');
            return;
        }
        const accion = event.target.closest('[data-cart-action]');
        if (accion && ['incrementar', 'decrementar', 'eliminarItem'].includes(accion.dataset.cartAction)) {
            Cart[accion.dataset.cartAction](accion.dataset.id);
        }
        if (event.target.closest('.btn-pagar')) Cart.pagar();
    });

    function actualizarInicio() {
        document.querySelectorAll('.product-card[data-product-id]').forEach(card => {
            const producto = Mochi.productos.obtener(card.dataset.productId);
            if (!producto) return;
            card.querySelector('h5').textContent = producto.nombre;
            card.querySelector('p').textContent = producto.descripcion;
            card.querySelector('[id^="priceprod"]').textContent = `$${producto.precio.toFixed(2)}`;
            card.querySelector('img').src = producto.imagen;
            card.querySelector('img').alt = producto.nombre;
            const boton = card.querySelector('button');
            boton.disabled = producto.stock === 0;
            boton.setAttribute('aria-label', producto.stock === 0 ? `${producto.nombre} agotado` : `Agregar ${producto.nombre} al carrito`);
        });
        Cart.actualizarProductos();
    }
    // Atrás/Adelante puede restaurar una página con un carrito antiguo en memoria.
    window.addEventListener('pageshow', () => { Cart.recargar(); actualizarInicio(); });
    window.addEventListener('mochi:productos', actualizarInicio);
    window.addEventListener('storage', event => {
        if (['mochiProductosEditados', 'catalogoProductos', 'mochimexa_productos'].includes(event.key)) actualizarInicio();
        if (['mochiCart', 'miCarrito', null].includes(event.key)) Cart.recargar();
        if (['usuarioSesion', 'usuariosRegistrados', null].includes(event.key)) actualizarCuentaNavbar();
    });
    window.addEventListener('mochi:sesion', actualizarCuentaNavbar);
    window.addEventListener('mochi:carrito', () => Cart.recargar());

    document.addEventListener('DOMContentLoaded', async () => {
        actualizarInicio();
        // El modal se inserta en su contenedor cuando existe. En Contacto/Acerca
        // se añade fuera del flujo; no ocupa espacio ni desplaza el diseño.
        await Promise.all([
            cargarComponente('mochiNav', 'navbar.html'),
            cargarComponente('mochiFooter', 'footer.html')
        ]);
        if ((document.querySelector('.custom-navbar') || document.getElementById('contenedorCarrito')) && !document.getElementById('carritoModal')) {
            if (document.getElementById('contenedorCarrito')) await cargarComponente('contenedorCarrito', 'despliegueCarrito.html');
            else {
                try {
                    const respuesta = await fetch(ruta('despliegueCarrito.html'));
                    if (!respuesta.ok) throw new Error('No se pudo cargar el carrito');
                    document.body.insertAdjacentHTML('beforeend', await respuesta.text());
                } catch (error) { console.error(error); }
            }
        }
        iniciarNavbar();
        iniciarFooter();
        Cart.renderCarrito();
    });
})();
