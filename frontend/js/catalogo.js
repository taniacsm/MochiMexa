// Usar una IIFE (Immediately Invoked Function Expression) para proteger el scope
(() => {
    // Consultar la misma fuente que Inicio y Administración evita precios distintos.
    const productosCatalogo = () => Mochi.productos.listar().map(p => ({
        ...p, img: p.imagen, desc: p.descripcion, agotado: p.stock === 0
    }));

    // 3. Lógica de inicialización y filtros
    function inicializarCatalogo() {
        const priceRange = document.getElementById("priceRange");
        const chkBebidas = document.getElementById("flavor1");
        const chkMochis = document.getElementById("flavor2");
        const chkPoky = document.getElementById("flavor3");
        const containerGrid = document.querySelector("main section .row");

        if (!containerGrid) return;

        const parametros = new URLSearchParams(location.search);
        const busqueda = Mochi.normalizar(parametros.get('q'));
        const categoria = parametros.get('categoria');
        const chkSnacks = document.getElementById('flavor4');
        const categorias = { bebidas: chkBebidas, mochis: chkMochis, poky: chkPoky, snacks: chkSnacks };
        Object.entries(categorias).forEach(([nombre, checkbox]) => {
            if (checkbox) checkbox.checked = nombre === categoria;
        });
        // En el catálogo el buscador responde al escribir; desde otras páginas
        // Enter abre esta misma vista con ?q=..., sin un buscador adicional.
        let consulta = busqueda;
        document.addEventListener('input', event => {
            if (event.target.matches('.custom-navbar input[type="search"]')) {
                consulta = Mochi.normalizar(event.target.value);
                const url = new URL(location.href);
                if (consulta) url.searchParams.set('q', event.target.value.trim());
                else url.searchParams.delete('q');
                history.replaceState(null, '', url);
                renderProductos();
            }
        });

        function renderProductos() {
            const productos = productosCatalogo();
            // Un precio editado por encima de $500 no debe desaparecer del
            // catálogo por el máximo antiguo del control. Se conserva un límite
            // elegido manualmente; solo se amplía la selección que estaba al tope.
            if (priceRange) {
                const anterior = Number(priceRange.max) || 500;
                const nuevoMaximo = Math.max(500, ...productos.map(p => Math.ceil(p.precio / 50) * 50));
                const usabaTodo = Number(priceRange.value) === anterior;
                priceRange.max = String(nuevoMaximo);
                if (usabaTodo) priceRange.value = String(nuevoMaximo);
            }
            const maxPrice = priceRange ? parseFloat(priceRange.value) : 500;
            const limite = document.getElementById('precioMaximo');
            if (limite) limite.textContent = `$${maxPrice} MXN`;
            if (priceRange) priceRange.setAttribute('aria-valuetext', `Hasta ${maxPrice} pesos`);
            
            const seleccionadas = [];
            if (chkBebidas && chkBebidas.checked) seleccionadas.push("bebidas");
            if (chkMochis && chkMochis.checked) seleccionadas.push("mochis");
            if (chkPoky && chkPoky.checked) seleccionadas.push("poky");
            if (chkSnacks && chkSnacks.checked) seleccionadas.push("snacks");

            const filtrados = productos.filter(prod => {
                const cumplePrecio = prod.precio <= maxPrice;
                const cumpleCategoria = seleccionadas.length === 0 || seleccionadas.includes(prod.categoria);
                const texto = Mochi.normalizar(`${prod.nombre} ${prod.desc} ${prod.categoria}`);
                const cumpleBusqueda = consulta.split(/\s+/).every(palabra => texto.includes(palabra));
                return cumplePrecio && cumpleCategoria && cumpleBusqueda;
            });

            if (filtrados.length === 0) {
                containerGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <p class="text-muted fw-bold">No se encontraron productos con los filtros seleccionados.</p>
                    </div>`;
                return;
            }

            containerGrid.innerHTML = filtrados.map(producto => {
                // Los datos escritos en formularios se tratan siempre como texto.
                const prod = Object.fromEntries(Object.entries(producto).map(([clave, valor]) =>
                    [clave, typeof valor === 'string' ? Mochi.escapar(valor) : valor]));
                return `
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden bg-white">
                        <div class="position-relative product-img-container rounded-4 mb-3">
                            <span class="badge badge-stock position-absolute top-0 start-0 m-3 px-3 py-2">${prod.badge}</span>
                            <a href="${Mochi.ruta('producto.html', { id: producto.id })}" class="d-block h-100 w-100"><img src="${Mochi.escapar(Mochi.imagenSegura(producto.img))}" class="img-fluid d-block mx-auto" alt="${prod.nombre}"></a>
                        </div>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h5 class="fw-bold text-dark fs-6 m-0"><a class="text-reset text-decoration-none" href="${Mochi.ruta('producto.html', { id: producto.id })}">${prod.nombre}</a></h5>
                                    <span class="price-tag fw-bold">$${prod.precio.toFixed(2)}</span>
                                </div>
                                <p class="text-secondary extra-small mb-4">${prod.desc}</p>
                            </div>
                            <button type="button" data-product-id="${prod.id}" onclick="Cart.additem(this.dataset.productId, this)" ${prod.agotado ? 'disabled aria-label="Producto agotado"' : ''} class="btn btn-orange w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2">
                                <i class="bi bi-cart-fill"></i> Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>
            `; }).join("");
        }

        [chkBebidas, chkMochis, chkPoky, chkSnacks].forEach(chk => {
            if (chk) chk.addEventListener("change", renderProductos);
        });

        if (priceRange) {
            priceRange.addEventListener("input", renderProductos);
        }

        // Actualizar también al volver con Atrás o editar en otra pestaña.
        window.addEventListener('pageshow', renderProductos);
        window.addEventListener('mochi:productos', renderProductos);
        window.addEventListener('storage', event => {
            if (['mochiProductosEditados', 'catalogoProductos', 'mochimexa_productos'].includes(event.key)) renderProductos();
        });
        renderProductos();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarCatalogo);
    } else {
        inicializarCatalogo();
    }
})();
