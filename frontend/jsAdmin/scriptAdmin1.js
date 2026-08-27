/**
 * ============================================================================
 * MOCHIMEXA ADMIN - PANEL DE CONTROL COMPLETO (scriptAdmin.js)
 * ============================================================================
 */

// ========================================
// 1. VARIABLES Y ESTADO GLOBAL
// ========================================

const state = {
    productos: [],
    pedidos: [],
    clientes: [],
    configuracion: {},
    paginacionProductos: {
        paginaActual: 1,
        porPagina: 3, // Respetando la paginación previa de 3 por página
        filtroCategoria: 'Todos'
    },
    paginacionPedidos: {
        paginaActual: 1,
        porPagina: 5,
        filtroEstado: 'Todos'
    },
    graficaVentasInstance: null
};

// Datos semilla conservando tu catálogo previo con SKU e imágenes
const DATOS_SEMILLA = {
    productos: [
        {
            id: 1,
            nombre: "Mochi Tradicional Matcha",
            sku: "MO-MAT-001",
            imagen: "/frontend/assets/imagenes/productosCatalogo/mochis/Mochi Matcha.png",
            categoria: "Mochis",
            precio: 45,
            stock: 124,
            estado: "Activo"
        },
        {
            id: 2,
            nombre: "Pocky Fresa Kawaii",
            sku: "PK-FRE-002",
            imagen: "/frontend/assets/imagenes/productos/pocky-fresa.png",
            categoria: "Pockys",
            precio: 35,
            stock: 12,
            estado: "Activo"
        },
        {
            id: 3,
            nombre: "Ramune Soda Original",
            sku: "BE-RAM-003",
            imagen: "/frontend/assets/imagenes/productos/ramune-original.png",
            categoria: "Bebidas",
            precio: 65,
            stock: 0,
            estado: "Inactivo"
        },
        {
            id: 4,
            nombre: "Mochi Fresa",
            sku: "MO-FRE-004",
            imagen: "/frontend/assets/imagenes/productos/mochi-fresa.png",
            categoria: "Mochis",
            precio: 50,
            stock: 30,
            estado: "Activo"
        },
        {
            id: 5,
            nombre: "Pocky Chocolate",
            sku: "PK-CHO-005",
            imagen: "/frontend/assets/imagenes/productos/pocky-chocolate.png",
            categoria: "Pockys",
            precio: 40,
            stock: 20,
            estado: "Activo"
        },
        {
            id: 6,
            nombre: "Ramune Melón",
            sku: "BE-MEL-006",
            imagen: "/frontend/assets/imagenes/productos/ramune-melon.png",
            categoria: "Bebidas",
            precio: 60,
            stock: 15,
            estado: "Activo"
        },
        {
            id: 7,
            nombre: "Mochi Mango",
            sku: "MO-MAN-007",
            imagen: "/frontend/assets/imagenes/productos/mochi-mango.png",
            categoria: "Mochis",
            precio: 55,
            stock: 8,
            estado: "Activo"
        },
        {
            id: 8,
            nombre: "Pocky Matcha",
            sku: "PK-MAT-008",
            imagen: "/frontend/assets/imagenes/productos/pocky-matcha.png",
            categoria: "Pockys",
            precio: 42,
            stock: 18,
            estado: "Activo"
        },
        {
            id: 9,
            nombre: "Ramune Fresa",
            sku: "BE-FRE-009",
            imagen: "/frontend/assets/imagenes/productos/ramune-fresa.png",
            categoria: "Bebidas",
            precio: 65,
            stock: 0,
            estado: "Inactivo"
        }
    ],
    pedidos: [
        { id: "MX-0992-A", cliente: "Sofía Martínez", ubicacion: "Estado de México", fecha: "24 Oct, 10:30 AM", metodoPago: "Tarjeta", total: 350.00, estado: "Pendiente", tipoEnvio: "Estándar" },
        { id: "MX-0993-B", cliente: "Carlos Reyes", ubicacion: "Jalisco", fecha: "23 Oct, 14:15 PM", metodoPago: "OXXO Pay", total: 890.50, estado: "En camino", tipoEnvio: "Express" },
        { id: "MX-0994-C", cliente: "Ana Gómez", ubicacion: "Nuevo León", fecha: "22 Oct, 09:00 AM", metodoPago: "SPEI", total: 120.00, estado: "Entregado", tipoEnvio: "Estándar" },
        { id: "MX-0995-D", cliente: "Pedro Sola", ubicacion: "Ciudad de México", fecha: "21 Oct, 16:45 PM", metodoPago: "Tarjeta", total: 540.00, estado: "Cancelado", tipoEnvio: "Estándar" }
    ],
    clientes: [
        { id: 1, nombre: "Mariana Valdés", email: "mariana.v@gmail.com", ubicacion: "Ciudad de México", pedidos: 14, ultimaActividad: "Hoy, 10:23 AM", avatar: "../assets/imagenes/nosotros/Frida.jpeg" },
        { id: 2, nombre: "Carlos Ruíz", email: "carlos.j99@gmail.com", ubicacion: "Jalisco", pedidos: 3, ultimaActividad: "Ayer, 04:45 PM", iniciales: "CJ" },
        { id: 3, nombre: "Sofía Ruíz", email: "sofia.j99@gmail.com", ubicacion: "Estado de México", pedidos: 8, ultimaActividad: "Ayer, 11:10 AM", iniciales: "SR" },
        { id: 4, nombre: "Missael Juan", email: "misaael@gmail.com", ubicacion: "Nuevo León", pedidos: 1, ultimaActividad: "12 Ago, 09:00 AM", avatar: "../assets/imagenes/nosotros/Missael.jpeg" }
    ],
    configuracion: {
        nombreAdmin: "Ana Mochi",
        correoAdmin: "admin@mochimexa.com",
        envioCdmx: 80,
        envioInterior: 150,
        metodosPago: { tarjeta: true, spei: true, oxxo: false },
        notificaciones: { nuevosPedidos: true, stockBajo: true, resumenSemanal: false }
    }
};

// ========================================
// 2. PREPARACIÓN PARA BACKEND Y LOCALSTORAGE
// ========================================

async function obtenerProductos() {
    try {
        const datos = localStorage.getItem('mochimexa_productos');
        state.productos = datos ? JSON.parse(datos) : [...DATOS_SEMILLA.productos];
        return state.productos;
    } catch (error) {
        console.error("Error al cargar productos:", error);
        return [];
    }
}

async function crearProducto(nuevoProd) {
    try {
        nuevoProd.id = state.productos.length ? Math.max(...state.productos.map(p => p.id)) + 1 : 1;
        state.productos.push(nuevoProd);
        guardarProductos();
        return nuevoProd;
    } catch (error) {
        console.error("Error al crear producto:", error);
        throw error;
    }
}

async function obtenerPedidos() {
    try {
        const datos = localStorage.getItem('mochimexa_pedidos');
        state.pedidos = datos ? JSON.parse(datos) : [...DATOS_SEMILLA.pedidos];
        return state.pedidos;
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        return [];
    }
}

async function actualizarPedido(id, datosActualizados) {
    try {
        const index = state.pedidos.findIndex(p => p.id === id);
        if (index !== -1) {
            state.pedidos[index] = { ...state.pedidos[index], ...datosActualizados };
            guardarPedidos();
            return state.pedidos[index];
        }
    } catch (error) {
        console.error("Error al actualizar pedido:", error);
        throw error;
    }
}

async function obtenerClientes() {
    try {
        const datos = localStorage.getItem('mochimexa_clientes');
        state.clientes = datos ? JSON.parse(datos) : [...DATOS_SEMILLA.clientes];
        return state.clientes;
    } catch (error) {
        console.error("Error al cargar clientes:", error);
        return [];
    }
}

function guardarProductos() {
    localStorage.setItem('mochimexa_productos', JSON.stringify(state.productos));
}

function cargarProductos() {
    obtenerProductos().then(() => {
        mostrarProductos();
    });
}

function guardarPedidos() {
    localStorage.setItem('mochimexa_pedidos', JSON.stringify(state.pedidos));
}

function cargarPedidos() {
    obtenerPedidos().then(() => {
        renderTablaPedidos();
        renderTablaPedidosDashboard();
    });
}

function guardarConfiguracion() {
    localStorage.setItem('mochimexa_configuracion', JSON.stringify(state.configuracion));
}

function cargarConfiguracion() {
    const datos = localStorage.getItem('mochimexa_configuracion');
    state.configuracion = datos ? JSON.parse(datos) : { ...DATOS_SEMILLA.configuracion };
    aplicarConfiguracionUI();
}

// ========================================
// 3. NAVEGACIÓN ENTRE SECCIONES
// ========================================

function initNavegacion() {
    const navLinks = document.querySelectorAll('.columna1 .botonesMenu a, .columna1 .logoAdmin a');
    const secciones = document.querySelectorAll('main > section');

    function cambiarSeccion(targetId) {
        const idLimpio = targetId.replace('#', '') || 'dashboard';
        
        secciones.forEach(sec => {
            sec.style.display = (sec.id === idLimpio) ? 'block' : 'none';
        });

        const menuLinks = document.querySelectorAll('.columna1 .botonesMenu a');
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(idLimpio)) {
                link.classList.add('activo');
            } else {
                link.classList.remove('activo');
            }
        });

        window.location.hash = idLimpio;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                cambiarSeccion(href);
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.matches('.pedidoRecienteTitle a')) {
            e.preventDefault();
            cambiarSeccion('#pedidos');
        }
    });

    const hashInicial = window.location.hash || '#dashboard';
    cambiarSeccion(hashInicial);
}

// ========================================
// 4. DASHBOARD & GRÁFICA (CONSERVANDO TU DISEÑO)
// ========================================

function initDashboard() {
    const graficaVentas = document.getElementById("graficaVentas");
    if (!graficaVentas) return;

    if (state.graficaVentasInstance) {
        state.graficaVentasInstance.destroy();
    }

    state.graficaVentasInstance = new Chart(graficaVentas, {
        type: "bar",
        data: {
            labels: ["L", "M", "M", "J", "V", "S", "D"],
            datasets: [
                {
                    label: "Ventas",
                    data: [120, 180, 90, 240, 150, 280, 210],
                    backgroundColor: [
                        "#d9e5ce",
                        "#d9e5ce",
                        "#d9e5ce",
                        "#8DBA76",
                        "#d9e5ce",
                        "#ffc088",
                        "#ffc088"
                    ],
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { display: false },
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

function renderTablaPedidosDashboard() {
    const tbody = document.querySelector('.pedidoReciente tbody');
    if (!tbody) return;

    const ultimosPedidos = state.pedidos.slice(0, 4);
    tbody.innerHTML = ultimosPedidos.map((ped, index) => {
        const clasesRow = ['firstRowTableValues', 'secondRowTableValues', 'thirdRowTableValues', 'fourthRowTableValues'];
        const claseEstado = ped.estado.toLowerCase().replace(' ', '');
        return `
            <tr class="${clasesRow[index] || ''}">
                <td>#${ped.id}</td>
                <td>${ped.cliente}</td>
                <td>${ped.fecha}</td>
                <td>$${Number(ped.total).toFixed(2)}</td>
                <td>
                    <span class="estadoPedido ${claseEstado}">${ped.estado}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// 5. PRODUCTOS (PAGINACIÓN, FILTROS Y ESTILOS PROPIOS)
// ========================================

function initProductos() {
    // Filtros por Categoría
    const contenedorFiltros = document.querySelector('.filtrosProductos');
    if (contenedorFiltros) {
        contenedorFiltros.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro')) {
                contenedorFiltros.querySelectorAll('.filtro').forEach(btn => btn.classList.remove('activo'));
                e.target.classList.add('activo');
                state.paginacionProductos.filtroCategoria = e.target.textContent.trim();
                state.paginacionProductos.paginaActual = 1;
                mostrarProductos();
            }
        });
    }

    // Botones de Paginación
    const botonAnterior = document.getElementById("anterior");
    const botonSiguiente = document.getElementById("siguiente");
    const botonesPagina = document.querySelectorAll(".pagina");

    if (botonSiguiente) {
        botonSiguiente.addEventListener("click", () => {
            const totalPaginas = calcularTotalPaginasProductos();
            if (state.paginacionProductos.paginaActual < totalPaginas) {
                state.paginacionProductos.paginaActual++;
                mostrarProductos();
            }
        });
    }

    if (botonAnterior) {
        botonAnterior.addEventListener("click", () => {
            if (state.paginacionProductos.paginaActual > 1) {
                state.paginacionProductos.paginaActual--;
                mostrarProductos();
            }
        });
    }

    botonesPagina.forEach(boton => {
        boton.addEventListener("click", () => {
            state.paginacionProductos.paginaActual = Number(boton.dataset.pagina);
            mostrarProductos();
        });
    });

    // Nuevo Producto Modal
    const btnAgregar = document.querySelector('.catalogoHeader .botonAgregar, .columna1 .botonProducto a');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalNuevoProducto();
        });
    }

    // Exportar CSV
    const btnExportar = document.querySelector('.catalogoHeader .botonExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarProductosCSV);
    }
}

function obtenerProductosFiltrados() {
    if (state.paginacionProductos.filtroCategoria === 'Todos') {
        return state.productos;
    }
    return state.productos.filter(p => p.categoria.toLowerCase() === state.paginacionProductos.filtroCategoria.toLowerCase());
}

function calcularTotalPaginasProductos() {
    const filtrados = obtenerProductosFiltrados();
    return Math.ceil(filtrados.length / state.paginacionProductos.porPagina) || 1;
}

function mostrarProductos() {
    const tablaProductos = document.getElementById("tablaProductos");
    const infoProductos = document.getElementById("infoProductos");
    if (!tablaProductos) return;

    tablaProductos.innerHTML = "";

    const filtrados = obtenerProductosFiltrados();
    const total = filtrados.length;
    const { paginaActual, porPagina } = state.paginacionProductos;

    const inicio = (paginaActual - 1) * porPagina;
    const fin = inicio + porPagina;
    const productosPagina = filtrados.slice(inicio, fin);

    productosPagina.forEach(producto => {
        const fila = document.createElement("tr");

        const claseCategoria = producto.categoria.toLowerCase();

        let claseStock = "";
        if (producto.stock > 15) {
            claseStock = "stockBueno";
        } else if (producto.stock > 0 && producto.stock <= 15) {
            claseStock = "stockBajo";
        }

        const claseEstado = (producto.estado || 'activo').toLowerCase();

        fila.innerHTML = `
            <td>
                <input type="checkbox" class="checkboxProducto" value="${producto.id}">
            </td>
            <td>
                <div class="productoInfo">
                    <img src="${producto.imagen || '/frontend/assets/imagenes/productos/mochi-fresa.png'}" alt="${producto.nombre}" class="productoImagen">
                    <div class="productoTexto">
                        <strong>${producto.nombre}</strong>
                        <span>SKU: ${producto.sku || 'N/A'}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="categoria categoria-${claseCategoria}">${producto.categoria}</span>
            </td>
            <td>$${Number(producto.precio).toFixed(2)} MXN</td>
            <td class="${claseStock}">${producto.stock}</td>
            <td>
                <span class="estado ${claseEstado}">
                    <span class="puntoEstado"></span>
                    ${producto.estado}
                </span>
            </td>
        `;

        tablaProductos.appendChild(fila);
    });

    if (infoProductos) {
        const primerProducto = total > 0 ? inicio + 1 : 0;
        const ultimoProducto = Math.min(fin, total);
        infoProductos.textContent = `Mostrando ${primerProducto} a ${ultimoProducto} de ${total} productos`;
    }

    actualizarBotonesPaginacion();
}

function actualizarBotonesPaginacion() {
    const botonAnterior = document.getElementById("anterior");
    const botonSiguiente = document.getElementById("siguiente");
    const botonesPagina = document.querySelectorAll(".pagina");
    const totalPaginas = calcularTotalPaginasProductos();

    if (botonAnterior) botonAnterior.disabled = state.paginacionProductos.paginaActual === 1;
    if (botonSiguiente) botonSiguiente.disabled = state.paginacionProductos.paginaActual >= totalPaginas;

    botonesPagina.forEach(boton => {
        const numeroPagina = Number(boton.dataset.pagina);
        boton.classList.remove("activo");
        if (numeroPagina === state.paginacionProductos.paginaActual) {
            boton.classList.add("activo");
        }
    });
}



    eliminarModalExistente('modalNuevoProducto');
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalNuevoProducto');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();

    document.getElementById('btnGuardarProducto').addEventListener('click', async () => {
        const nombre = document.getElementById('prodNombre').value.trim();
        const categoria = document.getElementById('prodCategoria').value;
        const precio = parseFloat(document.getElementById('prodPrecio').value);
        const stock = parseInt(document.getElementById('prodStock').value);
        const estado = document.getElementById('prodEstado').value;

        if (!nombre || isNaN(precio) || isNaN(stock)) {
            mostrarToast("Por favor completa todos los campos correctamente.", "warning");
            return;
        }

        if (precio < 0 || stock < 0) {
            mostrarToast("El precio y stock no pueden ser valores negativos.", "danger");
            return;
        }

        const skuGenerado = `${categoria.substring(0, 2).toUpperCase()}-NEW-${Math.floor(100 + Math.random() * 900)}`;

        try {
            await crearProducto({
                nombre,
                sku: skuGenerado,
                imagen: "/frontend/assets/imagenes/productos/mochi-fresa.png",
                categoria,
                precio,
                stock,
                estado
            });
            mostrarProductos();
            modalInstance.hide();
            mostrarToast("Producto agregado exitosamente.", "success");
        } catch (error) {
            mostrarToast("Ocurrió un error al guardar el producto.", "danger");
        }
    });


function exportarProductosCSV() {
    if (!state.productos.length) {
        mostrarToast("No hay productos para exportar.", "warning");
        return;
    }
    let csv = "ID,Nombre,SKU,Categoria,Precio,Stock,Estado\n";
    state.productos.forEach(p => {
        csv += `"${p.id}","${p.nombre}","${p.sku || ''}","${p.categoria}","${p.precio}","${p.stock}","${p.estado}"\n`;
    });
    descargarCSV("productos_mochimexa.csv", csv);
    mostrarToast("Catálogo exportado a CSV.", "info");
}

// ========================================
// 6. PEDIDOS
// ========================================

function initPedidos() {
    const btnFiltrar = document.querySelector('.pedidosHeader .botonFiltrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', abrirModalFiltroPedidos);
    }

    const btnExportar = document.querySelector('.pedidosHeader .botonExportarPedidos');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarPedidosCSV);
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('accionesPedido')) {
            const tr = e.target.closest('tr');
            const id = tr ? tr.dataset.id : null;
            if (id) abrirModalAccionesPedido(id);
        }
    });
}

function renderTablaPedidos() {
    const tbody = document.querySelector('#pedidos .tablaPedidos tbody');
    if (!tbody) return;

    let pedidosFiltrados = state.pedidos;
    if (state.paginacionPedidos.filtroEstado !== 'Todos') {
        pedidosFiltrados = state.pedidos.filter(p => p.estado.toLowerCase() === state.paginacionPedidos.filtroEstado.toLowerCase());
    }

    tbody.innerHTML = pedidosFiltrados.map(ped => `
        <tr data-id="${ped.id}">
            <td>
                <div class="guiaPedido">
                    <div class="iconoEnvio ${ped.estado === 'Pendiente' ? 'pendienteEnvio' : ped.estado === 'En camino' ? 'caminoEnvio' : 'entregadoEnvio'}">🚚</div>
                    <div class="guiaTexto">
                        <strong>#${ped.id}</strong>
                        <span>${ped.tipoEnvio || 'Estándar'}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="clientePedido">
                    <strong>${ped.cliente}</strong>
                    <span>⌖ ${ped.ubicacion}</span>
                </div>
            </td>
            <td>${ped.fecha}</td>
            <td><span class="metodoPago">▣ ${ped.metodoPago}</span></td>
            <td>
                <span class="estadoPedido ${ped.estado === 'Pendiente' ? 'estadoPendiente' : ped.estado === 'En camino' ? 'estadoCamino' : 'estadoEntregado'}">
                    ${ped.estado}⌄
                </span>
            </td>
            <td>
                <button class="accionesPedido">⋮</button>
            </td>
        </tr>
    `).join('');
}

function abrirModalAccionesPedido(idPedido) {
    const pedido = state.pedidos.find(p => p.id === idPedido);
    if (!pedido) return;

    const modalHtml = `
        <div class="modal fade" id="modalAccionesPedido" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Acciones Pedido #${pedido.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                        <p><strong>Total:</strong> $${Number(pedido.total).toFixed(2)}</p>
                        <div class="mb-3">
                            <label class="form-label">Cambiar Estado:</label>
                            <select id="selectNuevoEstado" class="form-select">
                                <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="En camino" ${pedido.estado === 'En camino' ? 'selected' : ''}>En camino</option>
                                <option value="Entregado" ${pedido.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
                                <option value="Cancelado" ${pedido.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="btnActualizarEstadoPedido">Actualizar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    eliminarModalExistente('modalAccionesPedido');
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalAccionesPedido');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();

    document.getElementById('btnActualizarEstadoPedido').addEventListener('click', async () => {
        const nuevoEstado = document.getElementById('selectNuevoEstado').value;
        await actualizarPedido(pedido.id, { estado: nuevoEstado });
        renderTablaPedidos();
        renderTablaPedidosDashboard();
        modalInstance.hide();
        mostrarToast(`Estado de pedido #${pedido.id} actualizado a "${nuevoEstado}".`, "success");
    });
}

function abrirModalFiltroPedidos() {
    const modalHtml = `
        <div class="modal fade" id="modalFiltroPedidos" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Filtrar Pedidos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <select id="selectFiltroEstado" class="form-select">
                            <option value="Todos">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En camino">En camino</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="btnAplicarFiltroPedido">Aplicar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    eliminarModalExistente('modalFiltroPedidos');
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalFiltroPedidos');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();

    document.getElementById('btnAplicarFiltroPedido').addEventListener('click', () => {
        state.paginacionPedidos.filtroEstado = document.getElementById('selectFiltroEstado').value;
        renderTablaPedidos();
        modalInstance.hide();
    });
}

function exportarPedidosCSV() {
    if (!state.pedidos.length) {
        mostrarToast("No hay pedidos para exportar.", "warning");
        return;
    }
    let csv = "ID,Cliente,Ubicacion,Fecha,MetodoPago,Total,Estado\n";
    state.pedidos.forEach(p => {
        csv += `"${p.id}","${p.cliente}","${p.ubicacion}","${p.fecha}","${p.metodoPago}","${p.total}","${p.estado}"\n`;
    });
    descargarCSV("pedidos_mochimexa.csv", csv);
    mostrarToast("Lista de pedidos exportada a CSV.", "info");
}

// ========================================
// 7. CLIENTES
// ========================================

function initClientes() {
    obtenerClientes().then(() => {
        renderTablaClientes();
    });

    document.addEventListener('click', (e) => {
        const filaCliente = e.target.closest('#clientes table tbody tr');
        if (filaCliente) {
            const email = filaCliente.querySelector('.cliente-email')?.textContent.trim();
            if (email) {
                const cliente = state.clientes.find(c => c.email === email);
                if (cliente) mostrarModalDetalleCliente(cliente);
            }
        }
    });
}

function renderTablaClientes(clientesFiltrados = null) {
    const tbody = document.querySelector('#clientes table tbody');
    if (!tbody) return;

    const lista = clientesFiltrados || state.clientes;

    tbody.innerHTML = lista.map(c => `
        <tr>
            <td>
                <div class="cliente-info-container">
                    ${c.avatar 
                        ? `<img src="${c.avatar}" alt="${c.nombre}" class="avatar-img">`
                        : `<div class="avatar-iniciales bg-avatar-verde">${c.iniciales || 'CL'}</div>`
                    }
                    <div class="cliente-datos">
                        <span class="cliente-nombre">${c.nombre}</span>
                        <span class="cliente-email">${c.email}</span>
                    </div>
                </div>
            </td>
            <td>${c.ubicacion}</td>
            <td>${c.pedidos}</td>
            <td>${c.ultimaActividad}</td>
            <td><button class="btn btn-sm btn-outline-secondary">Detalles</button></td>
        </tr>
    `).join('');
}

function mostrarModalDetalleCliente(cliente) {
    const modalHtml = `
        <div class="modal fade" id="modalDetalleCliente" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalle del Cliente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <h4>${cliente.nombre}</h4>
                        <p class="text-muted">${cliente.email}</p>
                        <hr>
                        <div class="row text-start">
                            <div class="col-6"><strong>Ubicación:</strong></div>
                            <div class="col-6">${cliente.ubicacion}</div>
                            <div class="col-6"><strong>Pedidos Realizados:</strong></div>
                            <div class="col-6">${cliente.pedidos}</div>
                            <div class="col-6"><strong>Última Actividad:</strong></div>
                            <div class="col-6">${cliente.ultimaActividad}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    eliminarModalExistente('modalDetalleCliente');
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalDetalleCliente');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
}

// ========================================
// 8. CONFIGURACIÓN
// ========================================

function initConfiguracion() {
    cargarConfiguracion();

    const botonesGuardar = document.querySelectorAll('#configuracion .botonGuardar');
    botonesGuardar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            guardarAjustesDesdeUI();
        });
    });
}

function aplicarConfiguracionUI() {
    const cfg = state.configuracion;
    const inputNombre = document.getElementById('nombreAdmin');
    const inputCorreo = document.getElementById('correoAdmin');

    if (inputNombre) inputNombre.value = cfg.nombreAdmin || '';
    if (inputCorreo) inputCorreo.value = cfg.correoAdmin || '';

    const enviosInputs = document.querySelectorAll('#configuracion .configEnvios input[type="number"]');
    if (enviosInputs.length >= 2) {
        enviosInputs[0].value = cfg.envioCdmx;
        enviosInputs[1].value = cfg.envioInterior;
    }

    const pagoSwitches = document.querySelectorAll('#configuracion .metodosPago input[type="checkbox"]');
    if (pagoSwitches.length >= 3) {
        pagoSwitches[0].checked = cfg.metodosPago.tarjeta;
        pagoSwitches[1].checked = cfg.metodosPago.spei;
        pagoSwitches[2].checked = cfg.metodosPago.oxxo;
    }

    const notifSwitches = document.querySelectorAll('#configuracion .notificacionesAdmin input[type="checkbox"]');
    if (notifSwitches.length >= 3) {
        notifSwitches[0].checked = cfg.notificaciones.nuevosPedidos;
        notifSwitches[1].checked = cfg.notificaciones.stockBajo;
        notifSwitches[2].checked = cfg.notificaciones.resumenSemanal;
    }
}

function guardarAjustesDesdeUI() {
    const nombre = document.getElementById('nombreAdmin')?.value.trim();
    const correo = document.getElementById('correoAdmin')?.value.trim();

    if (!nombre || !correo) {
        mostrarToast("El nombre y el correo no pueden estar vacíos.", "warning");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        mostrarToast("Ingresa un correo electrónico válido.", "danger");
        return;
    }

    const enviosInputs = document.querySelectorAll('#configuracion .configEnvios input[type="number"]');
    const envioCdmx = parseFloat(enviosInputs[0]?.value || 0);
    const envioInterior = parseFloat(enviosInputs[1]?.value || 0);

    if (envioCdmx < 0 || envioInterior < 0) {
        mostrarToast("Los costos de envío no pueden ser negativos.", "danger");
        return;
    }

    const pagoSwitches = document.querySelectorAll('#configuracion .metodosPago input[type="checkbox"]');
    const notifSwitches = document.querySelectorAll('#configuracion .notificacionesAdmin input[type="checkbox"]');

    state.configuracion = {
        nombreAdmin: nombre,
        correoAdmin: correo,
        envioCdmx,
        envioInterior,
        metodosPago: {
            tarjeta: pagoSwitches[0]?.checked || false,
            spei: pagoSwitches[1]?.checked || false,
            oxxo: pagoSwitches[2]?.checked || false
        },
        notificaciones: {
            nuevosPedidos: notifSwitches[0]?.checked || false,
            stockBajo: notifSwitches[1]?.checked || false,
            resumenSemanal: notifSwitches[2]?.checked || false
        }
    };

    guardarConfiguracion();
    mostrarToast("Configuración guardada correctamente en el sistema.", "success");
}

// ========================================
// 9. BUSCADOR DEL NAVBAR
// ========================================

function initBuscador() {
    const searchInput = document.querySelector('.custom-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length === 0) {
            mostrarProductos();
            renderTablaClientes();
            return;
        }

        const productosCoincidentes = state.productos.filter(p => 
            p.nombre.toLowerCase().includes(query) || p.categoria.toLowerCase().includes(query)
        );

        const clientesCoincidentes = state.clientes.filter(c => 
            c.nombre.toLowerCase().includes(query) || c.email.toLowerCase().includes(query) || c.ubicacion.toLowerCase().includes(query)
        );

        if (document.getElementById('productos').style.display !== 'none') {
            renderTablaProductosBusqueda(productosCoincidentes);
        } else if (document.getElementById('clientes').style.display !== 'none') {
            renderTablaClientes(clientesCoincidentes);
        }
    });
}

function renderTablaProductosBusqueda(lista) {
    const tablaProductos = document.getElementById("tablaProductos");
    if (!tablaProductos) return;

    tablaProductos.innerHTML = "";
    lista.forEach(producto => {
        const fila = document.createElement("tr");

        const claseCategoria = producto.categoria.toLowerCase();
        let claseStock = producto.stock > 15 ? "stockBueno" : producto.stock > 0 ? "stockBajo" : "";
        const claseEstado = (producto.estado || 'activo').toLowerCase();

        fila.innerHTML = `
            <td><input type="checkbox" class="checkboxProducto" value="${producto.id}"></td>
            <td>
                <div class="productoInfo">
                    <img src="${producto.imagen || '/frontend/assets/imagenes/productos/mochi-fresa.png'}" alt="${producto.nombre}" class="productoImagen">
                    <div class="productoTexto">
                        <strong>${producto.nombre}</strong>
                        <span>SKU: ${producto.sku || 'N/A'}</span>
                    </div>
                </div>
            </td>
            <td><span class="categoria categoria-${claseCategoria}">${producto.categoria}</span></td>
            <td>$${Number(producto.precio).toFixed(2)} MXN</td>
            <td class="${claseStock}">${producto.stock}</td>
            <td>
                <span class="estado ${claseEstado}">
                    <span class="puntoEstado"></span>
                    ${producto.estado}
                </span>
            </td>
        `;
        tablaProductos.appendChild(fila);
    });
}

// ========================================
// 10. NOTIFICACIONES / MODALES Y UTILERÍAS UX
// ========================================

function initNavbarIconosYFooter() {
    const navIcons = document.querySelectorAll('.adminNav div:last-child a');
    
    if (navIcons.length >= 3) {
        navIcons[0].addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalInfo("Notificaciones", "🔔 Tienes 2 pedidos nuevos pendientes por revisar.");
        });

        navIcons[1].addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalInfo("Centro de Ayuda", "Para soporte técnico comunícate a soporte@mochimexa.com.");
        });

        navIcons[2].addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = "configuracion";
            document.querySelector('.columna1 .botonesMenu a[href="#configuracion"]')?.click();
        });
    }

    const footerLinks = document.querySelectorAll('footer .linksFooter a');
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const titulo = link.textContent.trim();
            abrirModalInfo(titulo, `La sección de <strong>${titulo}</strong> se encuentra actualmente en desarrollo.`);
        });
    });
}

function mostrarToast(mensaje, tipo = "info") {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const toastId = 'toast_' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${mensaje}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}

function abrirModalInfo(titulo, contenido) {
    const modalHtml = `
        <div class="modal fade" id="modalInfoGenerico" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${contenido}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendido</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    eliminarModalExistente('modalInfoGenerico');
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalInfoGenerico');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
}

function eliminarModalExistente(idModal) {
    const exist = document.getElementById(idModal);
    if (exist) {
        const inst = bootstrap.Modal.getInstance(exist);
        if (inst) inst.dispose();
        exist.remove();
    }
}

function descargarCSV(nombreArchivo, contenidoCSV) {
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================================
// 11. INICIALIZACIÓN COMPLETA
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initNavegacion();
        await cargarProductos();
        await cargarPedidos();
        initDashboard();
        initProductos();
        initPedidos();
        initClientes();
        initConfiguracion();
        initBuscador();
        initNavbarIconosYFooter();
    } catch (error) {
        console.error("Error al inicializar el panel Admin:", error);
    }
});