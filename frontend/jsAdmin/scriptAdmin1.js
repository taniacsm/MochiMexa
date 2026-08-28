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
    busqueda: '',
    seleccionProductos: new Set(),
    pedidos: [],
    clientes: [],
    configuracion: {},
    graficaVentasInstance: null,
    paginacionProductos: {
        paginaActual: 1,
        porPagina: 3, // Respetando la paginación previa de 3 por página
        filtroCategoria: 'Todos'
    },
    paginacionPedidos: {
        paginaActual: 1,
        porPagina: 3, // La misma cantidad de filas visibles que Productos.
        filtroEstado: 'Todos'
    }
};

// Una sola correspondencia evita pintar un pedido cancelado como entregado.
const ESTILOS_PEDIDO = {
    'Pendiente': { estado: 'estadoPendiente', icono: 'pendienteEnvio' },
    'En camino': { estado: 'estadoCamino', icono: 'caminoEnvio' },
    'Entregado': { estado: 'estadoEntregado', icono: 'entregadoEnvio' },
    'Cancelado': { estado: 'estadoCancelado', icono: 'canceladoEnvio' }
};

// Datos semilla conservando tu catálogo previo con SKU e imágenes
const DATOS_SEMILLA = {
    pedidos: Mochi.tienda.pedidosSemilla,
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
        metodosPago: { ...Mochi.tienda.metodosPagoPredeterminados },
        notificaciones: { nuevosPedidos: true, stockBajo: true, resumenSemanal: false }
    }
};

// ========================================
// 2. PREPARACIÓN PARA BACKEND Y LOCALSTORAGE
// ========================================

async function obtenerProductos() {
    // El panel administra exactamente los productos que ve la tienda.
    const categorias = { mochis: 'Mochis', bebidas: 'Bebidas', poky: 'Pockys', snacks: 'Otros snacks' };
    state.productos = Mochi.productos.listar().map(p => ({ ...p, categoria: categorias[p.categoria] || p.categoria }));
    return state.productos;
}

async function obtenerPedidos() {
    try {
        const datos = Mochi.leer('mochimexa_pedidos', null);
        state.pedidos = Array.isArray(datos) ? datos : [...DATOS_SEMILLA.pedidos];
        return state.pedidos;
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        return [];
    }
}

async function actualizarPedido(id, datosActualizados) {
    const actual = state.pedidos.find(p => p.id === id);
    if (!actual || !Object.hasOwn(ESTILOS_PEDIDO, datosActualizados.estado)) return false;
    const siguiente = state.pedidos.map(p => p.id === id ? { ...p, estado: datosActualizados.estado } : p);
    if (!Mochi.guardar('mochimexa_pedidos', siguiente)) return false;
    state.pedidos = siguiente;
    // Solo después de guardar se actualizan la tabla, las tarjetas y la gráfica.
    renderTablaPedidos();
    actualizarDashboard();
    return true;
}

async function obtenerClientes() {
    try {
        const datos = Mochi.leer('mochimexa_clientes', null);
        state.clientes = Array.isArray(datos) ? datos : [...DATOS_SEMILLA.clientes];
        return state.clientes;
    } catch (error) {
        console.error("Error al cargar clientes:", error);
        return [];
    }
}

function cargarProductos() {
    return obtenerProductos().then(() => {
        mostrarProductos();
        actualizarDashboard();
    });
}

function cargarPedidos() {
    return obtenerPedidos().then(() => {
        renderTablaPedidos();
        actualizarDashboard();
    });
}

function guardarConfiguracion() {
    if (!Mochi.guardar('mochimexa_configuracion', state.configuracion)) return false;
    window.dispatchEvent(new Event('mochi:configuracion'));
    return true;
}

function cargarConfiguracion() {
    const datos = Mochi.leer('mochimexa_configuracion', {});
    state.configuracion = { ...DATOS_SEMILLA.configuracion, ...datos, metodosPago: { ...DATOS_SEMILLA.configuracion.metodosPago, ...datos?.metodosPago }, notificaciones: { ...DATOS_SEMILLA.configuracion.notificaciones, ...datos?.notificaciones } };
    aplicarConfiguracionUI();
}

// ========================================
// 3. NAVEGACIÓN ENTRE SECCIONES
// ========================================

function initNavegacion() {
    const navLinks = document.querySelectorAll('.columna1 .botonesMenu a, .columna1 .logoAdmin a');
    const secciones = document.querySelectorAll('main > section');

    function cambiarSeccion(targetId) {
        const pedido = targetId.replace('#', '');
        const idLimpio = Array.from(secciones).some(sec => sec.id === pedido) ? pedido : 'dashboard';
        
        secciones.forEach(sec => {
            sec.hidden = sec.id !== idLimpio;
            sec.style.display = sec.hidden ? 'none' : 'block';
        });

        const menuLinks = document.querySelectorAll('.columna1 .botonesMenu a');
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${idLimpio}`) {
                link.classList.add('activo');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('activo');
                link.removeAttribute('aria-current');
            }
        });

        if (window.location.hash !== `#${idLimpio}`) window.location.hash = idLimpio;
        aplicarBusquedaAdmin();
        if (idLimpio === 'dashboard') {
            actualizarDashboard();
            state.graficaVentasInstance?.resize();
        }
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

    window.addEventListener('hashchange', () => cambiarSeccion(location.hash));
    const hashInicial = window.location.hash || '#dashboard';
    cambiarSeccion(hashInicial);
}

// ========================================
// 4. DASHBOARD (MISMO DISEÑO, DATOS COMPARTIDOS)
// ========================================

function actualizarDashboard() {
    const escribir = (id, texto) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = texto;
    };
    const pendientes = state.pedidos.filter(p => p.estado === 'Pendiente').length;
    const importe = state.pedidos.reduce((total, p) => p.estado === 'Cancelado' ? total : total + (Number(p.total) || 0), 0);
    const definidos = state.productos.filter(p => p.stock != null && Number.isFinite(Number(p.stock)));
    const sinInventario = state.productos.length - definidos.length;
    escribir('resumenImporte', `$${importe.toFixed(2)}`);
    escribir('resumenPendientes', String(pendientes));
    escribir('detallePedidos', `${state.pedidos.length} pedidos en total`);
    escribir('resumenStock', definidos.length ? String(definidos.filter(p => p.stock > 0).length) : 'Por definir');
    escribir('detalleStock', `${definidos.filter(p => p.stock > 0 && p.stock <= 15).length} con stock bajo · ${sinInventario} sin inventario definido`);
    escribir('resumenClientes', String(state.clientes.length));

    const tbody = document.querySelector('.pedidoReciente tbody');
    if (tbody) {
        tbody.innerHTML = state.pedidos.slice(0, 4).map(escaparCampos).map(p => `
            <tr>
                <td>#${p.id}</td><td>${p.cliente}</td><td>${p.fecha}</td>
                <td>$${Number(p.total).toFixed(2)}</td>
                <td><span class="estadoPedido ${ESTILOS_PEDIDO[p.estado]?.estado || ''}">${p.estado}</span></td>
            </tr>
        `).join('') || '<tr><td colspan="5">No hay pedidos registrados.</td></tr>';
    }
    actualizarGraficaPedidos();
}

function actualizarGraficaPedidos() {
    const canvas = document.getElementById('graficaVentas');
    if (!canvas) return;
    const labels = Object.keys(ESTILOS_PEDIDO);
    const valores = labels.map(estado => state.pedidos.filter(p => p.estado === estado).length);
    const resumen = labels.map((estado, i) => `${estado}: ${valores[i]}`).join('. ');
    canvas.setAttribute('aria-label', `Pedidos locales por estado. ${resumen}`);
    const aviso = document.getElementById('estadoGrafica');

    // Si el CDN no carga, el resto del panel sigue funcionando y los datos
    // de la gráfica continúan disponibles en texto, sin ocultar el problema.
    if (typeof Chart === 'undefined') {
        canvas.hidden = true;
        if (aviso) { aviso.hidden = false; aviso.textContent = `Gráfica no disponible. ${resumen}`; }
        return;
    }
    canvas.hidden = false;
    if (aviso) aviso.hidden = true;
    if (state.graficaVentasInstance) {
        state.graficaVentasInstance.data.datasets[0].data = valores;
        state.graficaVentasInstance.update();
        return;
    }
    state.graficaVentasInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: 'Pedidos', data: valores, backgroundColor: ['#ffc088', '#8DBA76', '#d9e5ce', '#F4A3C1'], borderRadius: 8 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false }, border: { display: false } }
            }
        }
    });
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
    document.querySelectorAll('.catalogoHeader .botonAgregar, .columna1 .botonProducto a').forEach(boton => {
        boton.addEventListener('click', event => {
            event.preventDefault();
            abrirModalNuevoProducto();
        });
    });

    // Seleccionar todas aplica a la página visible; la selección se conserva
    // al paginar y Exportar descarga solo lo seleccionado si hay selección.
    document.querySelector('#productos thead input[type="checkbox"]')?.addEventListener('change', event => {
        document.querySelectorAll('.checkboxProducto').forEach(checkbox => {
            checkbox.checked = event.target.checked;
            if (checkbox.checked) state.seleccionProductos.add(checkbox.value);
            else state.seleccionProductos.delete(checkbox.value);
        });
    });
    document.getElementById('tablaProductos')?.addEventListener('change', event => {
        if (!event.target.matches('.checkboxProducto')) return;
        if (event.target.checked) state.seleccionProductos.add(event.target.value);
        else state.seleccionProductos.delete(event.target.value);
        actualizarSeleccionProductos();
    });

    // Exportar CSV
    const btnExportar = document.querySelector('.catalogoHeader .botonExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarProductosCSV);
    }
}

function obtenerProductosFiltrados() {
    return state.productos.filter(p =>
        (state.paginacionProductos.filtroCategoria === 'Todos' || Mochi.normalizar(p.categoria) === Mochi.normalizar(state.paginacionProductos.filtroCategoria)) &&
        Mochi.normalizar(`${p.nombre} ${p.sku || ''} ${p.categoria}`).includes(state.busqueda));
}

function actualizarSeleccionProductos() {
    const casillas = Array.from(document.querySelectorAll('.checkboxProducto'));
    const todas = document.querySelector('#productos thead input[type="checkbox"]');
    if (!todas) return;
    const marcadas = casillas.filter(c => c.checked).length;
    todas.checked = casillas.length > 0 && marcadas === casillas.length;
    todas.indeterminate = marcadas > 0 && marcadas < casillas.length;
}

function escaparCampos(datos) {
    return Object.fromEntries(Object.entries(datos).map(([clave, valor]) => [clave, typeof valor === 'string' ? Mochi.escapar(valor) : valor]));
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
    state.paginacionProductos.paginaActual = Math.min(state.paginacionProductos.paginaActual, calcularTotalPaginasProductos());
    const { paginaActual, porPagina } = state.paginacionProductos;

    const inicio = (paginaActual - 1) * porPagina;
    const fin = inicio + porPagina;
    const productosPagina = filtrados.slice(inicio, fin);

    productosPagina.forEach(datos => {
        const producto = escaparCampos({ ...datos, imagen: Mochi.imagenSegura(datos.imagen) });
        const fila = document.createElement("tr");

        const claseCategoria = Mochi.normalizar(producto.categoria).replace(/\s+/g, '-');

        let claseStock = "";
        if (producto.stock > 15) {
            claseStock = "stockBueno";
        } else if (producto.stock > 0 && producto.stock <= 15) {
            claseStock = "stockBajo";
        }

        const claseEstado = (producto.estado || 'activo').toLowerCase();

        fila.innerHTML = `
            <td>
                <input type="checkbox" class="checkboxProducto" aria-label="Seleccionar ${producto.nombre}" value="${producto.id}" ${state.seleccionProductos.has(String(datos.id)) ? 'checked' : ''}>
            </td>
            <td>
                <div class="productoInfo">
                    <img src="${producto.imagen || '../assets/imagenes/productosCatalogo/mochis/Mochi Fresa.png'}" alt="${producto.nombre}" class="productoImagen">
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
            <td class="${claseStock}">${producto.stock ?? 'Por definir'}</td>
            <td>
                <span class="estado ${claseEstado}">
                    <span class="puntoEstado"></span>
                    ${producto.estado}
                </span>
            </td>
            <td><a class="botonEditar" href="${Mochi.ruta('adminProd.html', { editar: datos.id })}" aria-label="Editar ${producto.nombre}">Editar</a></td>
        `;

        tablaProductos.appendChild(fila);
    });

    if (infoProductos) {
        const primerProducto = total > 0 ? inicio + 1 : 0;
        const ultimoProducto = Math.min(fin, total);
        infoProductos.textContent = `Mostrando ${primerProducto} a ${ultimoProducto} de ${total} productos`;
    }

    if (!total) tablaProductos.innerHTML = '<tr><td colspan="7">No se encontraron productos.</td></tr>';
    actualizarSeleccionProductos();
    actualizarBotonesPaginacion();
}

function actualizarBotonesPaginacion() {
    const botonAnterior = document.getElementById("anterior");
    const botonSiguiente = document.getElementById("siguiente");
    const botonesPagina = document.querySelectorAll(".pagina");
    const totalPaginas = calcularTotalPaginasProductos();

    if (botonAnterior) botonAnterior.disabled = state.paginacionProductos.paginaActual === 1;
    if (botonSiguiente) botonSiguiente.disabled = state.paginacionProductos.paginaActual >= totalPaginas;

    const inicio = Math.max(1, Math.min(state.paginacionProductos.paginaActual - 1, totalPaginas - botonesPagina.length + 1));
    botonesPagina.forEach((boton, indice) => {
        // Reutilizar los tres botones existentes permite llegar a páginas nuevas.
        const numeroPagina = inicio + indice;
        boton.dataset.pagina = String(numeroPagina);
        boton.textContent = String(numeroPagina);
        boton.disabled = numeroPagina > totalPaginas;
        boton.classList.remove("activo");
        if (numeroPagina === state.paginacionProductos.paginaActual) {
            boton.classList.add("activo");
        }
    });
}



// Se reutiliza la página de registro ya diseñada; no se introduce otro formulario.
function abrirModalNuevoProducto() {
    location.href = Mochi.ruta('adminProd.html');
}

// Escapar comillas y fórmulas evita columnas rotas o fórmulas ejecutables al
// abrir un CSV que contiene nombres escritos por el usuario.
function celdaCSV(valor) {
    let texto = String(valor ?? '');
    if (/^[\s]*[=+@-]/.test(texto)) texto = "'" + texto;
    return '"' + texto.replace(/"/g, '""') + '"';
}

function exportarProductosCSV() {
    const lista = state.seleccionProductos.size ? state.productos.filter(p => state.seleccionProductos.has(String(p.id))) : obtenerProductosFiltrados();
    if (!lista.length) return mostrarToast('No hay productos para exportar.', 'warning');
    const filas = [['ID', 'Nombre', 'SKU', 'Categoria', 'Precio', 'Stock', 'Estado'],
        ...lista.map(p => [p.id, p.nombre, p.sku, p.categoria, p.precio, p.stock, p.estado])];
    descargarCSV('productos_mochimexa.csv', filas.map(f => f.map(celdaCSV).join(',')).join('\n'));
    mostrarToast('Productos exportados a CSV.', 'info');
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

    document.querySelector('#pedidos .tablaPedidos tbody')?.addEventListener('click', (e) => {
        const accion = e.target.closest('.accionesPedido, [data-editar-pedido]');
        if (accion) {
            const tr = accion.closest('tr');
            const id = tr ? tr.dataset.id : null;
            if (id) abrirModalAccionesPedido(id);
        }
    });

    // Un único listener reutiliza los botones aunque cambien sus números,
    // igual que en Productos. Los símbolos de las flechas no son la lógica.
    document.querySelector('.paginacionPedidos')?.addEventListener('click', event => {
        const boton = event.target.closest('button');
        if (!boton || boton.disabled) return;
        if (boton.dataset.accion === 'anterior') state.paginacionPedidos.paginaActual--;
        else if (boton.dataset.accion === 'siguiente') state.paginacionPedidos.paginaActual++;
        else if (boton.dataset.pagina) state.paginacionPedidos.paginaActual = Number(boton.dataset.pagina);
        renderTablaPedidos();
    });
}

function renderTablaPedidos() {
    const tbody = document.querySelector('#pedidos .tablaPedidos tbody');
    if (!tbody) return;

    const pedidosFiltrados = obtenerPedidosFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / state.paginacionPedidos.porPagina));
    state.paginacionPedidos.paginaActual = Math.max(1, Math.min(state.paginacionPedidos.paginaActual, totalPaginas));
    const inicio = (state.paginacionPedidos.paginaActual - 1) * state.paginacionPedidos.porPagina;
    const visibles = pedidosFiltrados.slice(inicio, inicio + state.paginacionPedidos.porPagina);
    const informacion = document.querySelector('.paginacionPedidos p');
    if (informacion) informacion.textContent = `Mostrando ${visibles.length ? inicio + 1 : 0} a ${inicio + visibles.length} de ${pedidosFiltrados.length} pedidos`;
    actualizarPaginacionPedidos(totalPaginas);
    const filtro = document.querySelector('.pedidosHeader .botonFiltrar');
    filtro?.setAttribute('aria-pressed', String(state.paginacionPedidos.filtroEstado !== 'Todos'));
    filtro?.setAttribute('aria-label', `Filtrar pedidos. Estado actual: ${state.paginacionPedidos.filtroEstado}`);

    tbody.innerHTML = visibles.map(escaparCampos).map(ped => `
        <tr data-id="${ped.id}">
            <td>
                <div class="guiaPedido">
                    <div class="iconoEnvio ${ESTILOS_PEDIDO[ped.estado]?.icono || ''}">🚚</div>
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
                <button type="button" class="estadoPedido ${ESTILOS_PEDIDO[ped.estado]?.estado || ''}" data-editar-pedido aria-label="Cambiar estado del pedido ${ped.id}: ${ped.estado}">
                    ${ped.estado}⌄
                </button>
            </td>
            <td>
                <button type="button" class="accionesPedido" aria-label="Editar pedido ${ped.id}" title="Editar pedido">⋮</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6">No se encontraron pedidos.</td></tr>';
}

function actualizarPaginacionPedidos(totalPaginas) {
    const botones = Array.from(document.querySelectorAll('.paginacionPedidos .paginaPedido'));
    const paginaActual = state.paginacionPedidos.paginaActual;
    const primera = Math.max(1, Math.min(paginaActual - 1, totalPaginas - botones.length + 1));
    botones.forEach((boton, indice) => {
        const numero = primera + indice;
        boton.textContent = String(numero);
        boton.dataset.pagina = String(numero);
        boton.disabled = numero > totalPaginas;
        boton.classList.toggle('activa', numero === paginaActual);
        boton.setAttribute('aria-label', `Página ${numero} de pedidos`);
        if (numero === paginaActual) boton.setAttribute('aria-current', 'page');
        else boton.removeAttribute('aria-current');
    });
    const anterior = document.querySelector('.paginacionPedidos [data-accion="anterior"]');
    const siguiente = document.querySelector('.paginacionPedidos [data-accion="siguiente"]');
    if (anterior) anterior.disabled = paginaActual === 1;
    if (siguiente) siguiente.disabled = paginaActual >= totalPaginas;
}

function abrirModalAccionesPedido(idPedido) {
    const original = state.pedidos.find(p => p.id === idPedido);
    if (!original) return;
    const pedido = escaparCampos(original);

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

    document.getElementById('btnActualizarEstadoPedido').addEventListener('click', async event => {
        const boton = event.currentTarget;
        if (boton.disabled) return;
        boton.disabled = true;
        const nuevoEstado = document.getElementById('selectNuevoEstado').value;
        const guardado = await actualizarPedido(original.id, { estado: nuevoEstado });
        boton.disabled = false;
        if (!guardado) return;
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

    document.getElementById('selectFiltroEstado').value = state.paginacionPedidos.filtroEstado;
    document.getElementById('btnAplicarFiltroPedido').addEventListener('click', () => {
        state.paginacionPedidos.paginaActual = 1;
        state.paginacionPedidos.filtroEstado = document.getElementById('selectFiltroEstado').value;
        renderTablaPedidos();
        modalInstance.hide();
    });
}

function obtenerPedidosFiltrados() {
    return state.pedidos.filter(p => (state.paginacionPedidos.filtroEstado === 'Todos' || p.estado === state.paginacionPedidos.filtroEstado) &&
        Mochi.normalizar(`${p.id} ${p.cliente} ${p.estado} ${p.ubicacion}`).includes(state.busqueda));
}

function exportarPedidosCSV() {
    const lista = obtenerPedidosFiltrados();
    if (!lista.length) return mostrarToast('No hay pedidos para exportar.', 'warning');
    const filas = [['ID', 'Cliente', 'Ubicacion', 'Fecha', 'MetodoPago', 'Total', 'Estado'],
        ...lista.map(p => [p.id, p.cliente, p.ubicacion, p.fecha, p.metodoPago, p.total, p.estado])];
    descargarCSV('pedidos_mochimexa.csv', filas.map(f => f.map(celdaCSV).join(',')).join('\n'));
    mostrarToast('Pedidos exportados a CSV.', 'info');
}

// ========================================
// 7. CLIENTES
// ========================================

function initClientes() {
    obtenerClientes().then(() => {
        renderTablaClientes();
        actualizarDashboard();
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

    const lista = clientesFiltrados || state.clientes.filter(c => Mochi.normalizar(`${c.nombre} ${c.email} ${c.ubicacion}`).includes(state.busqueda));

    tbody.innerHTML = lista.map(escaparCampos).map(c => `
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
    `).join('') || '<tr><td colspan="5">No se encontraron clientes.</td></tr>';
}

function mostrarModalDetalleCliente(original) {
    const cliente = escaparCampos(original);
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
    // Cada interruptor se identifica por su método, no por su posición visual.
    pagoSwitches.forEach(input => { input.checked = cfg.metodosPago[input.dataset.metodoPago] === true; });

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

    if (!Number.isFinite(envioCdmx) || !Number.isFinite(envioInterior) || envioCdmx < 0 || envioInterior < 0) {
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
        metodosPago: Object.fromEntries(Array.from(pagoSwitches, input => [input.dataset.metodoPago, input.checked])),
        notificaciones: {
            nuevosPedidos: notifSwitches[0]?.checked || false,
            stockBajo: notifSwitches[1]?.checked || false,
            resumenSemanal: notifSwitches[2]?.checked || false
        }
    };

    if (!guardarConfiguracion()) return;
    mostrarToast("Preferencias guardadas en este navegador. No se activan cobros ni correos automáticos.", "success");
}

// ========================================
// 9. BUSCADOR DEL NAVBAR
// ========================================

function aplicarBusquedaAdmin() {
    mostrarProductos();
    renderTablaPedidos();
    renderTablaClientes();
}

function initBuscador() {
    const searchInput = document.querySelector('.custom-search-input');
    if (!searchInput) return;
    const buscar = () => {
        state.busqueda = Mochi.normalizar(searchInput.value);
        state.paginacionProductos.paginaActual = 1;
        state.paginacionPedidos.paginaActual = 1;
        // En el resumen o ajustes, buscar abre el catálogo administrativo.
        if (!['#productos', '#pedidos', '#clientes'].includes(location.hash)) location.hash = 'productos';
        aplicarBusquedaAdmin();
    };
    searchInput.addEventListener('input', buscar);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); buscar(); }
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
            abrirModalInfo('Notificaciones', `${state.pedidos.filter(p => p.estado === 'Pendiente').length} pedidos pendientes en los datos locales de demostración.`);
        });

        navIcons[1].addEventListener('click', (e) => {
            e.preventDefault();
            location.href = Mochi.ruta('contactanos.html', { asunto: 'soporte' });
        });

        navIcons[2].addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = "configuracion";
            document.querySelector('.columna1 .botonesMenu a[href="#configuracion"]')?.click();
        });
    }


}

function mostrarToast(mensaje, tipo = "info") {
    if (!window.bootstrap) { alert(mensaje); return; }
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
                <div class="toast-body">${Mochi.escapar(mensaje)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
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
    const blob = new Blob(['\ufeff', contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ========================================
// 11. INICIALIZACIÓN COMPLETA
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initNavegacion();
        await cargarProductos();
        await cargarPedidos();
        initProductos();
        initPedidos();
        initClientes();
        initConfiguracion();
        initBuscador();
        initNavbarIconosYFooter();
        // Productos y Pedidos se refrescan al volver y entre pestañas, sin
        // perder el filtro actual ni dejar al Dashboard con un estado anterior.
        window.addEventListener('pageshow', async () => {
            await cargarProductos();
            await cargarPedidos();
        });
        window.addEventListener('mochi:productos', cargarProductos);
        window.addEventListener('mochi:pedidos', cargarPedidos);
        window.addEventListener('storage', event => {
            if (event.key === null || ['mochiProductosEditados', 'catalogoProductos', 'mochimexa_productos'].includes(event.key)) cargarProductos();
            if (event.key === null || event.key === 'mochimexa_pedidos') cargarPedidos();
        });
    } catch (error) {
        console.error("Error al inicializar el panel Admin:", error);
    }
});
