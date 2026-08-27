// Usar una IIFE (Immediately Invoked Function Expression) para proteger el scope
(() => {
    // 1. Array local aislado para la página de catálogo
    const productosCatalogo = [
        { id: 1, nombre: "Mochi Matcha", precio: 45.00, categoria: "mochis", img: "../assets/imagenes/productosCatalogo/mochis/Mochi Matcha.png", desc: "Matcha de Uji + Toque de Vainilla.", badge: "EN STOCK" },
        { id: 2, nombre: "Poky Fresa", precio: 35.00, categoria: "poky", img: "../assets/imagenes/productosCatalogo/pokis/Pokys Fresa.png", desc: "Doble cobertura de Fresa Natural.", badge: "EN STOCK" },
        { id: 3, nombre: "Ramune Natural", precio: 85.00, categoria: "bebidas", img: "../assets/imagenes/productosCatalogo/ramune/Ramune Natural.png", desc: "Refresco icónico con canica sabor natural.", badge: "EN STOCK" },
        { id: 4, nombre: "Mochi Fresa", precio: 45.00, categoria: "mochis", img: "../assets/imagenes/productosCatalogo/mochis/Mochi Fresa.png", desc: "Mochi con Fresa Natural.", badge: "TOP 4" },
        { id: 5, nombre: "Poky Chocolate", precio: 35.00, categoria: "poky", img: "../assets/imagenes/productosCatalogo/pokis/Pokys Cholocate.png", desc: "Doble cobertura de Chocolate.", badge: "EN STOCK" },
        { id: 6, nombre: "Ramune Lychee", precio: 50.00, categoria: "bebidas", img: "../assets/imagenes/productosCatalogo/ramune/Ramune Lychee.png", desc: "Refresco icónico con canica sabor Lychee.", badge: "EN STOCK" },
        { id: 7, nombre: "Mochi Mango", precio: 45.00, categoria: "mochis", img: "../assets/imagenes/productosCatalogo/mochis/Mochi Mango.png", desc: "Mochi Mango natural.", badge: "QUEDAN POCOS" },
        { id: 8, nombre: "Pokys Oreo", precio: 85.00, categoria: "poky", img: "../assets/imagenes/productosCatalogo/pokis/Pokys Cookies & Cream.png", desc: "Doble cobertura de oreo.", badge: "EN STOCK" },
        { id: 9, nombre: "Ramune de Fresa", precio: 85.00, categoria: "bebidas", img: "../assets/imagenes/productosCatalogo/ramune/Ramune  Fresa.png", desc: "Refresco iconico con canica sabor Lychee.", badge: "EN STOCK" },
        { id: 10, nombre: "Mochi Taro", precio: 45.00, categoria: "mochis", img: "../assets/imagenes/productosCatalogo/mochis/Mochi Taro.png", desc: "Mochi Lychee Natural", badge: "EN STOCK" }
    ];

    // 2. Exportar o definir Cart de forma segura en window para los onclick del HTML
    if (!window.Cart) {
        window.Cart = {
            getCart() {
                return JSON.parse(localStorage.getItem("mochiCart")) || [];
            },
            saveCart(cart) {
                localStorage.setItem("mochiCart", JSON.stringify(cart));
                window.dispatchEvent(new Event("cartUpdated"));
            },
            additem(id) {
                const producto = productosCatalogo.find(p => p.id === id);
                if (!producto) return;

                const cart = this.getCart();
                const index = cart.findIndex(item => item.id === id);

                if (index !== -1) {
                    cart[index].cantidad += 1;
                } else {
                    cart.push({ ...producto, cantidad: 1 });
                }

                this.saveCart(cart);
                alert(`¡${producto.nombre} agregado al carrito!`);
            }
        };
    }

    // 3. Lógica de inicialización y filtros
    function inicializarCatalogo() {
        const priceRange = document.getElementById("priceRange");
        const chkBebidas = document.getElementById("flavor1");
        const chkMochis = document.getElementById("flavor2");
        const chkPoky = document.getElementById("flavor3");
        const containerGrid = document.querySelector("main section .row");

        if (!containerGrid) return;

        function renderProductos() {
            const maxPrice = priceRange ? parseFloat(priceRange.value) : 500;
            
            const seleccionadas = [];
            if (chkBebidas && chkBebidas.checked) seleccionadas.push("bebidas");
            if (chkMochis && chkMochis.checked) seleccionadas.push("mochis");
            if (chkPoky && chkPoky.checked) seleccionadas.push("poky");

            const filtrados = productosCatalogo.filter(prod => {
                const cumplePrecio = prod.precio <= maxPrice;
                const cumpleCategoria = seleccionadas.length === 0 || seleccionadas.includes(prod.categoria);
                return cumplePrecio && cumpleCategoria;
            });

            if (filtrados.length === 0) {
                containerGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <p class="text-muted fw-bold">No se encontraron productos con los filtros seleccionados.</p>
                    </div>`;
                return;
            }

            containerGrid.innerHTML = filtrados.map(prod => `
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden bg-white">
                        <div class="position-relative product-img-container rounded-4 mb-3">
                            <span class="badge badge-stock position-absolute top-0 start-0 m-3 px-3 py-2">${prod.badge}</span>
                            <img src="${prod.img}" class="img-fluid d-block mx-auto" alt="${prod.nombre}">
                        </div>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h5 class="fw-bold text-dark fs-6 m-0">${prod.nombre}</h5>
                                    <span class="price-tag fw-bold">$${prod.precio.toFixed(2)}</span>
                                </div>
                                <p class="text-secondary extra-small mb-4">${prod.desc}</p>
                            </div>
                            <button onclick="Cart.additem(${prod.id})" class="btn btn-orange w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2">
                                <i class="bi bi-cart-fill"></i> Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>
            `).join("");
        }

        [chkBebidas, chkMochis, chkPoky].forEach(chk => {
            if (chk) chk.addEventListener("change", renderProductos);
        });

        if (priceRange) {
            priceRange.addEventListener("input", renderProductos);
        }

        renderProductos();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarCatalogo);
    } else {
        inicializarCatalogo();
    }
})();