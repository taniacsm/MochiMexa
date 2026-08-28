// Pruebas locales sin navegador, red ni dependencias externas. Se ejecutan los
// scripts reales en un contexto aislado, con almacenamiento y elementos mínimos.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const raiz = path.resolve(__dirname, '..');

function almacen(datos = {}) {
    const valores = new Map(Object.entries(datos).map(([k, v]) => [k, JSON.stringify(v)]));
    return { getItem: k => valores.get(k) ?? null, setItem: (k, v) => valores.set(k, v), removeItem: k => valores.delete(k) };
}
function elemento(props = {}) {
    const eventos = {};
    const clases = new Set();
    return {
        eventos, value: '', textContent: '', innerHTML: '', children: [], dataset: {}, style: {}, checked: false,
        classList: { add: k => clases.add(k), remove: k => clases.delete(k), contains: k => clases.has(k), toggle(k, activo) { activo ? clases.add(k) : clases.delete(k); } },
        addEventListener(tipo, fn) { (eventos[tipo] ||= []).push(fn); },
        async emitir(tipo, datos = {}) { for (const fn of eventos[tipo] || []) await fn.call(this, { preventDefault() {}, target: this, currentTarget: this, ...datos }); },
        setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k] ?? null; }, removeAttribute(k) { delete this[k]; },
        querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, matches() { return false; },
        appendChild(hijo) { this.children.push(hijo); }, insertBefore(hijo) { this.children.unshift(hijo); },
        scrollIntoView() {}, focus() {}, remove() {}, showModal() { this.open = true; }, close() { this.open = false; }, reportValidity() { return true; },
        reset() { this.reiniciado = true; void this.emitir('reset'); }, ...props
    };
}
function entorno({ datos = {}, url = 'http://localhost:8765/frontend/pages/index.html', ids = {}, selectores = {}, varios = {} } = {}) {
    const alertas = [];
    const ventana = elemento();
    // Location del navegador acepta destinos relativos; URL.href de Node no.
    let pagina = new URL(url);
    const ubicacion = {
        get href() { return pagina.href; }, set href(valor) { pagina = new URL(valor, pagina); },
        get pathname() { return pagina.pathname; }, get search() { return pagina.search; },
        get hash() { return pagina.hash; }, set hash(valor) { pagina.hash = valor; }
    };
    const documento = elemento({
        readyState: 'loading', currentScript: { src: 'http://localhost:8765/frontend/js/mochi.js' },
        getElementById: id => ids[id] || null,
        querySelector: selector => selectores[selector] || null,
        querySelectorAll: selector => varios[selector] || [],
        createElement: () => elemento(), body: elemento()
    });
    const ctx = vm.createContext({
        document: documento, localStorage: almacen(datos), sessionStorage: almacen(),
        location: ubicacion, URL, URLSearchParams, TextEncoder, crypto: webcrypto, console, AbortController, clearTimeout,
        alert: mensaje => alertas.push(mensaje), confirm: () => true, navigator: {}, setTimeout: () => 0,
        history: { replaceState() {} }, addEventListener: (tipo, fn) => ventana.addEventListener(tipo, fn),
        Event: class { constructor(type) { this.type = type; } },
        dispatchEvent(event) { for (const fn of ventana.eventos[event.type] || []) fn(event); return true; },
        fetch: async () => { throw new Error('La prueba no debe usar la red'); }
    });
    ctx.window = ctx;
    const cargar = archivo => vm.runInContext(fs.readFileSync(path.join(raiz, 'frontend', archivo), 'utf8'), ctx, { filename: archivo });
    cargar('js/mochi.js');
    cargar('js/productos.js');
    cargar('js/tienda.js');
    return { ctx, cargar, ids, selectores, varios, documento, alertas, ventana };
}
function botonProducto(nombre, precio, imagen) {
    const campos = { img: { src: imagen, alt: nombre }, h5: { textContent: nombre }, '.price-tag, [id^="priceprod"]': { textContent: `$${precio}` }, p: { textContent: 'Descripción de prueba' } };
    return { closest: () => ({ querySelector: s => campos[s] }) };
}
function entornoCarrito(datos = {}) {
    const e = entorno({ datos, ids: { listaCarrito: elemento(), totalCarrito: elemento() }, selectores: { '.btn-pagar': elemento() } });
    e.cargar('js/script.js');
    return e;
}
const imagenMochi = 'http://localhost:8765/frontend/assets/imagenes/productosCatalogo/mochis/Mochi%20Fresa.png';

test('rutas relativas, búsqueda con acentos y escape de texto', () => {
    const { ctx } = entorno();
    assert.equal(ctx.Mochi.ruta('catalogo.html', { q: 'té & fresa' }), 'http://localhost:8765/frontend/pages/catalogo.html?q=t%C3%A9+%26+fresa');
    assert.equal(ctx.Mochi.normalizar('  MELÓN  '), 'melon');
    assert.equal(ctx.Mochi.escapar('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
    assert.match(ctx.Mochi.imagenSegura('javascript:alert(1)'), /LogoNegro.png$/);
});

test('datos dañados y falta de espacio no anuncian un guardado exitoso', () => {
    const { ctx, alertas } = entorno();
    ctx.localStorage.setItem('roto', '{');
    assert.equal(ctx.Mochi.leer('roto', 'respaldo'), 'respaldo');
    ctx.localStorage.setItem = () => { throw new Error('quota'); };
    assert.equal(ctx.Mochi.guardar('x', []), false);
    assert.match(alertas[0], /No se pudo guardar/);
});

test('carrito: artículos con igual ID no se mezclan; mismo producto sí suma', () => {
    const { ctx, ids } = entornoCarrito();
    ctx.Cart.additem(4, botonProducto('KitKat', 62, 'http://localhost:8765/frontend/assets/kitkat.jpg'));
    ctx.Cart.additem(4, botonProducto('Mochi Fresa', 45, imagenMochi));
    ctx.Cart.additem(5, botonProducto('Mochi Fresa', 45, imagenMochi));
    assert.equal(ctx.Cart.carrito.length, 2);
    assert.equal(ctx.Cart.carrito[1].cantidad, 2);
    assert.equal(ids.totalCarrito.textContent, '$152.00');
    assert.equal(JSON.parse(ctx.localStorage.getItem('mochiCart')).length, 2);
});

test('carrito: un producto conocido usa el precio compartido aunque el DOM tenga otro importe', () => {
    const { ctx, alertas, ids } = entornoCarrito();
    ctx.Cart.additem(1, botonProducto('Mochi', 45, imagenMochi));
    ctx.Cart.additem(1, botonProducto('Mochi', 50, imagenMochi));
    assert.equal(ids.totalCarrito.textContent, '$90.00');
    assert.ok(!alertas.some(a => a.includes('precios distintos')));
});

test('carrito: cantidades, eliminar, estado vacío y recuperación tras recargar', () => {
    const primero = entornoCarrito();
    primero.ctx.Cart.additem(1, botonProducto('Mochi', 45, imagenMochi));
    const key = primero.ctx.Cart.carrito[0].id;
    primero.ctx.Cart.incrementar(key);
    const segundo = entornoCarrito({ mochiCart: JSON.parse(primero.ctx.localStorage.getItem('mochiCart')) });
    assert.equal(segundo.ctx.Cart.carrito[0].cantidad, 2);
    segundo.ctx.Cart.decrementar(key);
    segundo.ctx.Cart.decrementar(key);
    assert.equal(segundo.ctx.Cart.carrito.length, 0);
    assert.equal(segundo.ids.totalCarrito.textContent, '$0.00');
    assert.equal(segundo.selectores['.btn-pagar'].disabled, true);
    primero.ctx.Cart.eliminarItem(key);
    assert.equal(primero.ctx.Cart.carrito.length, 0);
});

test('carrito: altas sin foto y fotos locales conservan identidades al recargar', () => {
    const e = entornoCarrito();
    const logo = 'http://localhost:8765/frontend/assets/logo.png';
    e.ctx.Cart.additem('local-1', botonProducto('Uno', 10, logo));
    e.ctx.Cart.additem('local-2', botonProducto('Dos', 20, logo));
    e.ctx.Cart.additem('local-3', botonProducto('Tres', 30, 'data:image/png;base64,AAAA'));
    const copia = entornoCarrito({ mochiCart: JSON.parse(e.ctx.localStorage.getItem('mochiCart')) });
    assert.equal(copia.ctx.Cart.carrito.length, 3);
    assert.equal(copia.ctx.Cart.carrito[2].id, 'local-3');
});

test('carrito: migración de formato antiguo y texto seguro', () => {
    const e = entornoCarrito({ miCarrito: [{ id: 1, nombre: '<script>x</script>', precio: 45, cantidad: 1, imagen: 'http://localhost:8765/frontend/assets/desconocido.png' }, null, { nombre: 'inválido', precio: -1, cantidad: 1 }] });
    e.ctx.Cart.renderCarrito();
    assert.equal(e.ctx.Cart.carrito.length, 1);
    assert.match(e.ids.listaCarrito.innerHTML, /&lt;script&gt;/);
    assert.doesNotMatch(e.ids.listaCarrito.innerHTML, /<script>/);
});

test('carrito: fallar al guardar conserva el estado anterior', () => {
    const e = entornoCarrito();
    e.ctx.localStorage.setItem = () => { throw new Error('quota'); };
    e.ctx.Cart.additem(1, botonProducto('Mochi', 45, imagenMochi));
    assert.equal(e.ctx.Cart.carrito.length, 0);
});

test('Pagar abre el resumen, conserva el carrito y todavía no crea pedidos ni cobros', () => {
    const e = entornoCarrito();
    e.ctx.Cart.additem(1, botonProducto('Mochi', 45, imagenMochi));
    e.ctx.Cart.pagar();
    assert.match(e.ctx.location.href, /resumenPedido.html$/);
    assert.equal(e.ctx.sessionStorage.getItem('mochiContactoBorrador'), null);
    assert.equal(e.ctx.Cart.carrito.length, 1);
    assert.equal(e.ctx.localStorage.getItem('mochimexa_pedidos'), null);
});

function catalogo(query = '', datos = {}) {
    const ids = Object.fromEntries(['priceRange', 'precioMaximo', 'flavor1', 'flavor2', 'flavor3', 'flavor4'].map(id => [id, elemento()]));
    ids.priceRange.value = '500';
    const grid = elemento();
    const e = entorno({ url: `http://localhost:8765/frontend/pages/catalogo.html${query}`, ids, datos, selectores: { 'main section .row': grid } });
    e.cargar('js/catalogo.js');
    return { ...e, grid };
}

test('catálogo: muestra todos por defecto y combina categoría con precio', async () => {
    const e = catalogo();
    await e.documento.emitir('DOMContentLoaded');
    assert.equal((e.grid.innerHTML.match(/data-product-id=/g) || []).length, 15);
    e.ids.flavor3.checked = true;
    e.ids.priceRange.value = '40';
    await e.ids.priceRange.emitir('input');
    assert.equal((e.grid.innerHTML.match(/data-product-id=/g) || []).length, 3);
    assert.doesNotMatch(e.grid.innerHTML, /Mochi Matcha/);
});

test('catálogo: enlaces de categoría y búsqueda sin resultados', async () => {
    const e = catalogo('?categoria=mochis&q=M%C3%81TCHA');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal((e.grid.innerHTML.match(/data-product-id=/g) || []).length, 1);
    assert.match(e.grid.innerHTML, /Mochi Matcha/);
    await e.documento.emitir('input', { target: { value: 'inexistente', matches: () => true } });
    assert.match(e.grid.innerHTML, /No se encontraron/);
    await e.documento.emitir('input', { target: { value: '', matches: () => true } });
    assert.equal((e.grid.innerHTML.match(/data-product-id=/g) || []).length, 5);
});

test('catálogo incorpora productos registrados, escapa nombres y desactiva agotados', async () => {
    const e = catalogo('', { catalogoProductos: [{ id: 900, nombre: '<img onerror=x>', descripcion: 'Prueba', categoria: 'snacks', precio: 12, stock: 0 }] });
    await e.documento.emitir('DOMContentLoaded');
    assert.match(e.grid.innerHTML, /data-product-id="local-900"/);
    assert.match(e.grid.innerHTML, /disabled aria-label="Producto agotado"/);
    assert.match(e.grid.innerHTML, /&lt;img onerror=x&gt;/);
});

function cuenta() {
    const submit = elemento();
    const form = elemento({ querySelector: () => submit });
    const ids = { registroForm: form, 'login-form': form, name: elemento({ value: 'Prueba Local' }), email: elemento({ value: 'PRUEBA@example.test' }), phone: elemento({ value: '55 1234 5678' }), password: elemento({ value: 'Prueba local 123', type: 'password' }), passwordConfirm: elemento({ value: 'Prueba local 123', type: 'password' }), ojo: elemento({ closest: () => submit }), ojoConfirm: elemento({ closest: () => submit }) };
    return { ...entorno({ ids, url: 'http://localhost:8765/frontend/pages/registroUsuarios.html' }), form, submit };
}

test('registro y login comparten credencial; contraseña exacta y sesión sin secretos', async () => {
    const e = cuenta();
    e.cargar('js/registroUsu.js');
    await e.form.emitir('submit');
    const usuario = JSON.parse(e.ctx.localStorage.getItem('usuariosRegistrados'))[0];
    assert.equal(usuario.email, 'prueba@example.test');
    assert.equal(usuario.claveHash.length, 64);
    assert.equal(usuario.contraseña, undefined);
    assert.doesNotMatch(e.ctx.localStorage.getItem('usuarioSesion'), /claveHash|sal|Prueba local 123/);
    assert.match(e.ctx.location.href, /pages\/perfil.html$/);
    assert.ok(!e.alertas.some(a => a.startsWith('No se pudo')));
    e.ctx.location.href = 'iniciaSesion.html';
    e.form.eventos.submit = [];
    e.ctx.localStorage.removeItem('usuarioSesion');
    e.cargar('js/inicioSesion1.js');
    e.ids.password.value = 'incorrecta';
    await e.form.emitir('submit');
    assert.equal(e.ctx.localStorage.getItem('usuarioSesion'), null);
    e.ids.password.value = 'Prueba local 123';
    await e.form.emitir('submit');
    assert.equal(JSON.parse(e.ctx.localStorage.getItem('usuarioSesion')).email, usuario.email);
    assert.match(e.ctx.location.href, /pages\/perfil.html$/);
});

test('registro rechaza contraseñas diferentes y correo duplicado', async () => {
    const e = cuenta();
    e.cargar('js/registroUsu.js');
    e.ids.passwordConfirm.value = 'otra';
    await e.form.emitir('submit');
    assert.equal(e.ctx.localStorage.getItem('usuariosRegistrados'), null);
    e.ids.passwordConfirm.value = e.ids.password.value;
    await e.form.emitir('submit');
    await e.form.emitir('submit');
    assert.equal(JSON.parse(e.ctx.localStorage.getItem('usuariosRegistrados')).length, 1);
    assert.ok(e.alertas.some(a => a.includes('ya está registrado')));
});

test('mostrar/ocultar funciona en ambos campos del registro', () => {
    const e = cuenta();
    e.cargar('js/registroUsu.js');
    for (const [fn, id] of [['togglePasswordVista', 'password'], ['toggleConfirmPasswordVista', 'passwordConfirm']]) {
        e.ctx[fn](); assert.equal(e.ids[id].type, 'text');
        e.ctx[fn](); assert.equal(e.ids[id].type, 'password');
    }
});

test('login de cuenta antigua sin credencial no concede acceso', async () => {
    const e = cuenta();
    e.ctx.Mochi.guardar('usuariosRegistrados', [{ email: 'prueba@example.test', nombre: 'Antigua' }]);
    e.cargar('js/inicioSesion1.js');
    await e.form.emitir('submit');
    assert.equal(e.ctx.Mochi.sesion(), null);
    assert.ok(e.alertas.some(a => a.includes('cuenta antigua')));
});

test('admin carga sin ejecutar un modal inexistente y comparte altas con catálogo', async () => {
    const e = entorno({ datos: { catalogoProductos: [{ id: 42, nombre: 'Alta local', categoria: 'snacks', precio: 20, stock: 3 }] } });
    e.cargar('jsAdmin/scriptAdmin1.js');
    await e.ctx.obtenerProductos();
    vm.runInContext("state.busqueda = 'alta'; state.paginacionProductos.filtroCategoria = 'Pockys';", e.ctx);
    const lista = e.ctx.obtenerProductosFiltrados();
    assert.equal(lista.length, 1);
    assert.equal(lista[0].id, 'local-42');
    e.ctx.abrirModalNuevoProducto();
    assert.match(e.ctx.location.href, /pages\/adminProd.html$/);
});

test('admin conserva filtros al paginar y protege el CSV', async () => {
    const e = entorno();
    e.cargar('jsAdmin/scriptAdmin1.js');
    await e.ctx.obtenerProductos();
    vm.runInContext("state.busqueda = 'mochi'; state.paginacionProductos.filtroCategoria = 'Mochis';", e.ctx);
    assert.equal(e.ctx.obtenerProductosFiltrados().length, 5);
    assert.equal(e.ctx.calcularTotalPaginasProductos(), 2);
    assert.equal(e.ctx.celdaCSV('a,"b"'), '"a,""b"""');
    assert.equal(e.ctx.celdaCSV('=1+1'), '"\'=1+1"');
});

test('admin actualiza pedidos solo si se guardan; buscar respeta el estado', async () => {
    const e = entorno();
    e.cargar('jsAdmin/scriptAdmin1.js');
    await e.ctx.obtenerPedidos();
    vm.runInContext("state.busqueda = 'sofia'; state.paginacionPedidos.filtroEstado = 'Pendiente';", e.ctx);
    assert.equal(e.ctx.obtenerPedidosFiltrados().length, 1);
    e.ctx.localStorage.setItem = () => { throw new Error('quota'); };
    assert.equal(await e.ctx.actualizarPedido('MX-0992-A', { estado: 'Entregado' }), false);
    assert.equal(e.ctx.obtenerPedidosFiltrados()[0].estado, 'Pendiente');
});

function panelPedidos(pedidos) {
    const tabla = elemento(), info = elemento(), paginacion = elemento(), filtro = elemento();
    const anterior = elemento({ dataset: { accion: 'anterior' } });
    const siguiente = elemento({ dataset: { accion: 'siguiente' } });
    const paginas = [1, 2, 3].map(n => elemento({ dataset: { pagina: String(n) } }));
    const e = entorno({
        url: 'http://localhost:8765/frontend/pagesAdmin/homeAdmin.html#pedidos',
        datos: pedidos ? { mochimexa_pedidos: pedidos } : {},
        ids: Object.fromEntries(['resumenImporte', 'resumenPendientes', 'detallePedidos', 'resumenStock', 'detalleStock', 'resumenClientes', 'graficaVentas', 'estadoGrafica'].map(id => [id, elemento()])),
        selectores: {
            '#pedidos .tablaPedidos tbody': tabla, '.paginacionPedidos p': info,
            '.paginacionPedidos': paginacion, '.pedidosHeader .botonFiltrar': filtro,
            '.paginacionPedidos [data-accion="anterior"]': anterior,
            '.paginacionPedidos [data-accion="siguiente"]': siguiente,
            '.pedidoReciente tbody': elemento()
        },
        varios: { '.paginacionPedidos .paginaPedido': paginas }
    });
    e.cargar('jsAdmin/scriptAdmin1.js');
    const pulsar = boton => paginacion.emitir('click', { target: { closest: () => boton } });
    return { ...e, tabla, info, anterior, siguiente, paginas, filtro, pulsar };
}

function pedidoPrueba(i, estado = 'Pendiente') {
    return { id: `PRUEBA-${i}`, cliente: `Cliente ${i}`, ubicacion: 'México', fecha: '28 Ago, 10:00 AM', metodoPago: 'Tarjeta', total: i * 10, estado, tipoEnvio: 'Estándar' };
}

test('pedidos pagina de tres en tres y permite navegar más allá de los tres botones iniciales', async () => {
    const e = panelPedidos(Array.from({ length: 14 }, (_, i) => pedidoPrueba(i + 1)));
    await e.ctx.cargarPedidos();
    e.ctx.initPedidos();
    assert.equal((e.tabla.innerHTML.match(/<tr /g) || []).length, 3);
    assert.equal(e.info.textContent, 'Mostrando 1 a 3 de 14 pedidos');
    assert.equal(e.anterior.disabled, true);
    await e.pulsar(e.paginas[2]);
    assert.equal(e.info.textContent, 'Mostrando 7 a 9 de 14 pedidos');
    assert.deepEqual(e.paginas.map(b => b.dataset.pagina), ['2', '3', '4']);
    await e.pulsar(e.paginas[2]);
    await e.pulsar(e.siguiente);
    assert.equal(e.info.textContent, 'Mostrando 13 a 14 de 14 pedidos');
    assert.equal(e.siguiente.disabled, true);
    assert.equal(e.paginas[2]['aria-current'], 'page');
    await e.pulsar(e.siguiente);
    assert.equal(e.info.textContent, 'Mostrando 13 a 14 de 14 pedidos');
    await e.pulsar(e.anterior);
    assert.match(e.info.textContent, /10 a 12/);
});

test('pedidos combina búsqueda y estado, exporta el filtro y resuelve la tabla vacía', async () => {
    const e = panelPedidos(Array.from({ length: 8 }, (_, i) => pedidoPrueba(i + 1, i < 5 ? 'Pendiente' : 'Entregado')));
    await e.ctx.cargarPedidos();
    e.ctx.initPedidos();
    vm.runInContext("state.busqueda = 'cliente'; state.paginacionPedidos.filtroEstado = 'Pendiente';", e.ctx);
    e.ctx.renderTablaPedidos();
    await e.pulsar(e.siguiente);
    assert.equal(e.info.textContent, 'Mostrando 4 a 5 de 5 pedidos');
    assert.equal(e.filtro['aria-pressed'], 'true');
    assert.doesNotMatch(e.tabla.innerHTML, /PRUEBA-6/);
    let csv;
    e.ctx.descargarCSV = (nombre, contenido) => { csv = contenido; };
    e.ctx.exportarPedidosCSV();
    assert.equal(csv.split('\n').length, 6);
    assert.doesNotMatch(csv, /PRUEBA-6/);
    vm.runInContext("state.busqueda = 'inexistente';", e.ctx);
    e.ctx.renderTablaPedidos();
    assert.match(e.tabla.innerHTML, /colspan="6">No se encontraron pedidos/);
    assert.equal(e.info.textContent, 'Mostrando 0 a 0 de 0 pedidos');
    assert.equal(e.anterior.disabled, true);
    assert.equal(e.siguiente.disabled, true);
    vm.runInContext("state.busqueda = ''; state.paginacionPedidos.filtroEstado = 'Todos';", e.ctx);
    e.ctx.renderTablaPedidos();
    assert.equal(e.info.textContent, 'Mostrando 1 a 3 de 8 pedidos');
});

test('el filtro de pedidos conserva su estado al reabrirse y vuelve a la primera página al aplicar', async () => {
    const e = panelPedidos();
    await e.ctx.cargarPedidos();
    e.ctx.bootstrap = { Modal: class { static getInstance() {} show() {} hide() {} } };
    e.documento.body.insertAdjacentHTML = () => {
        e.ids.modalFiltroPedidos = elemento();
        e.ids.selectFiltroEstado = elemento();
        e.ids.btnAplicarFiltroPedido = elemento();
    };
    vm.runInContext("state.paginacionPedidos.filtroEstado = 'En camino'; state.paginacionPedidos.paginaActual = 2;", e.ctx);
    e.ctx.abrirModalFiltroPedidos();
    assert.equal(e.ids.selectFiltroEstado.value, 'En camino');
    e.ids.selectFiltroEstado.value = 'Cancelado';
    await e.ids.btnAplicarFiltroPedido.emitir('click');
    assert.equal(e.info.textContent, 'Mostrando 1 a 1 de 1 pedidos');
    assert.match(e.tabla.innerHTML, /estadoCancelado/);
    assert.doesNotMatch(e.tabla.innerHTML, /estadoEntregado/);
});

test('Dashboard calcula tarjetas y gráfica con los mismos pedidos y se actualiza al guardar', async () => {
    const e = panelPedidos();
    let grafica;
    e.ctx.Chart = class {
        constructor(canvas, opciones) { this.data = opciones.data; this.actualizaciones = 0; grafica = this; }
        update() { this.actualizaciones++; }
        resize() {}
    };
    await e.ctx.cargarProductos();
    await e.ctx.cargarPedidos();
    await e.ctx.obtenerClientes();
    e.ctx.actualizarDashboard();
    assert.equal(e.ids.resumenImporte.textContent, '$1360.50');
    assert.equal(e.ids.resumenPendientes.textContent, '1');
    assert.equal(e.ids.resumenStock.textContent, 'Por definir');
    assert.equal(e.ids.resumenClientes.textContent, '4');
    assert.deepEqual(Array.from(grafica.data.datasets[0].data), [1, 1, 1, 1]);
    assert.equal(await e.ctx.actualizarPedido('MX-0992-A', { estado: 'Cancelado' }), true);
    assert.equal(e.ids.resumenImporte.textContent, '$1010.50');
    assert.equal(e.ids.resumenPendientes.textContent, '0');
    assert.deepEqual(Array.from(grafica.data.datasets[0].data), [0, 1, 1, 2]);
    assert.ok(grafica.actualizaciones > 0);
    assert.match(e.selectores['.pedidoReciente tbody'].innerHTML, /estadoCancelado/);
    const recargado = panelPedidos(JSON.parse(e.ctx.localStorage.getItem('mochimexa_pedidos')));
    await recargado.ctx.cargarPedidos();
    assert.equal(recargado.ids.resumenPendientes.textContent, '0');
    assert.equal(await e.ctx.actualizarPedido('MX-0992-A', { estado: 'Inventado' }), false);
    assert.equal(await e.ctx.actualizarPedido('NO-EXISTE', { estado: 'Entregado' }), false);
});

test('Dashboard sin Chart conserva el resumen en texto y maneja pedidos vacíos sin errores', async () => {
    const e = panelPedidos([]);
    await e.ctx.cargarPedidos();
    assert.equal(e.ids.graficaVentas.hidden, true);
    assert.equal(e.ids.estadoGrafica.hidden, false);
    assert.match(e.ids.estadoGrafica.textContent, /Gráfica no disponible.*Pendiente: 0/);
    assert.equal(e.ids.resumenImporte.textContent, '$0.00');
    assert.match(e.selectores['.pedidoReciente tbody'].innerHTML, /No hay pedidos registrados/);
});

test('pedidos recibe cambios de otra pestaña y al volver sin perder el filtro aplicado', async () => {
    const e = panelPedidos();
    await e.documento.emitir('DOMContentLoaded');
    vm.runInContext("state.paginacionPedidos.filtroEstado = 'Entregado';", e.ctx);
    e.ctx.Mochi.guardar('mochimexa_pedidos', [pedidoPrueba(50, 'Entregado')]);
    await e.ventana.emitir('storage', { key: 'mochimexa_pedidos' });
    await new Promise(resolve => setImmediate(resolve));
    assert.match(e.tabla.innerHTML, /PRUEBA-50/);
    assert.equal(e.info.textContent, 'Mostrando 1 a 1 de 1 pedidos');
    assert.equal(e.filtro['aria-pressed'], 'true');
    e.ctx.Mochi.guardar('mochimexa_pedidos', [pedidoPrueba(60, 'Pendiente')]);
    await e.ventana.emitir('pageshow');
    assert.match(e.tabla.innerHTML, /No se encontraron pedidos/);
    assert.equal(e.ids.resumenPendientes.textContent, '1');
});

test('el botón de estado abre la edición y guardar actualiza la tabla sin perder el ID', async () => {
    const e = panelPedidos();
    await e.ctx.cargarPedidos();
    e.ctx.initPedidos();
    let cerrado = false;
    e.ctx.bootstrap = { Modal: class { static getInstance() {} show() {} hide() { cerrado = true; } } };
    e.ctx.mostrarToast = () => {};
    e.documento.body.insertAdjacentHTML = () => {
        e.ids.modalAccionesPedido = elemento();
        e.ids.selectNuevoEstado = elemento({ value: 'Entregado' });
        e.ids.btnActualizarEstadoPedido = elemento();
    };
    const accion = { closest: () => ({ dataset: { id: 'MX-0992-A' } }) };
    await e.tabla.emitir('click', { target: { closest: () => accion } });
    await e.ids.btnActualizarEstadoPedido.emitir('click');
    assert.equal(cerrado, true);
    const guardados = JSON.parse(e.ctx.localStorage.getItem('mochimexa_pedidos'));
    assert.equal(guardados.length, 4);
    assert.equal(guardados.find(p => p.id === 'MX-0992-A').estado, 'Entregado');
    assert.match(e.tabla.innerHTML, /Cambiar estado del pedido MX-0992-A: Entregado/);
});

test('navbar enlaza la búsqueda y permite cerrar la sesión compartida', async () => {
    const input = elemento();
    const login = elemento(), registro = elemento();
    const inicio = elemento({ href: 'http://localhost:8765/frontend/pages/index.html' });
    const nav = elemento({ querySelector: () => input, querySelectorAll: s => s === '.custom-link' ? [inicio] : [login, registro] });
    const e = entorno({ datos: { usuariosRegistrados: [{ nombre: 'Prueba', email: 'prueba@example.test' }], usuarioSesion: { nombre: 'Prueba', email: 'prueba@example.test' }, sesionActiva: {} }, ids: { carritoModal: elemento() }, selectores: { '.custom-navbar': nav } });
    e.cargar('js/script.js');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(inicio['aria-current'], 'page');
    assert.equal(registro.textContent, 'Cerrar sesión');
    assert.match(login.href, /perfil.html$/);
    await e.documento.emitir('click', { target: { closest: selector => selector === '[data-cerrar-sesion]' ? registro : null } });
    assert.equal(e.ctx.Mochi.sesion(), null);
    assert.equal(e.ctx.localStorage.getItem('sesionActiva'), null);
    input.value = 'té & fresa';
    await input.emitir('keydown', { key: 'Enter' });
    assert.equal(new URL(e.ctx.location.href).searchParams.get('q'), 'té & fresa');
    assert.match(e.ctx.location.pathname, /catalogo.html$/);
});

test('footer: favoritos, compartir y solicitud sin suscripción ficticia', async () => {
    const favorito = elemento(), compartir = elemento();
    const email = elemento({ value: 'prueba@example.test' });
    const form = elemento({ querySelector: () => email });
    const footer = elemento({ querySelector: s => ({ '[aria-label="Favoritos"]': favorito, '[aria-label="Compartir"]': compartir, '.newsletter-form': form })[s] });
    const e = entorno({ selectores: { 'footer#mochiFooter': footer } });
    let copiado;
    e.ctx.navigator.clipboard = { writeText: async texto => { copiado = texto; } };
    e.cargar('js/script.js');
    await e.documento.emitir('DOMContentLoaded');
    await favorito.emitir('click');
    assert.equal(favorito['aria-pressed'], 'true');
    await favorito.emitir('click');
    assert.equal(favorito['aria-pressed'], 'false');
    await compartir.emitir('click');
    assert.match(copiado, /pages\/index.html$/);
    await form.emitir('submit');
    assert.equal(new URL(e.ctx.location.href).searchParams.get('asunto'), 'suscripcion');
    assert.doesNotMatch(e.ctx.location.href, /example/);
    assert.equal(JSON.parse(e.ctx.sessionStorage.getItem('mochiContactoBorrador')).correo, email.value);
});

function contacto() {
    const campos = Object.fromEntries(Object.entries({ nombre: 'Prueba Local', correo: 'prueba@example.test', telefono: '5512345678', mensaje: 'Quiero información & detalles.' }).map(([k, value]) => [k, elemento({ value })]));
    const form = elemento({ elements: campos });
    const e = entorno({ ids: { 'form-contactanos': form, btnEnviar: elemento(), ...campos } });
    e.ctx.FormData = class {
        constructor(formulario) { this.datos = new Map(formulario ? Object.entries(formulario.elements).map(([k, campo]) => [k, campo.value]) : []); }
        get(k) { return this.datos.get(k); }
        append(k, v) { this.datos.set(k, v); }
    };
    e.cargar('js/views/contactanos.js');
    return { ...e, form, campos };
}

test('contacto valida antes de enviar y evita solicitudes duplicadas (servicio simulado)', async () => {
    const e = contacto();
    await e.documento.emitir('DOMContentLoaded');
    let solicitudes = 0, completar;
    e.ctx.fetch = async (_, opciones) => {
        solicitudes++;
        assert.equal(opciones.body.get('message'), 'Quiero información & detalles.');
        return new Promise(resolve => { completar = resolve; });
    };
    e.campos.telefono.value = 'invalido';
    await e.form.emitir('submit');
    assert.equal(solicitudes, 0);
    e.campos.telefono.value = '5512345678';
    const pendiente = e.form.emitir('submit');
    assert.equal(e.ids.btnEnviar.disabled, true);
    await e.form.emitir('submit');
    assert.equal(solicitudes, 1);
    completar({ ok: true });
    await pendiente;
    assert.equal(e.form.reiniciado, true);
    assert.equal(e.ids.btnEnviar.disabled, false);
});

test('contacto conserva el formulario y restaura Enviar tras un error (servicio simulado)', async () => {
    const e = contacto();
    await e.documento.emitir('DOMContentLoaded');
    e.ctx.fetch = async () => ({ ok: false });
    await e.form.emitir('submit');
    assert.equal(e.form.reiniciado, undefined);
    assert.equal(e.ids.btnEnviar.disabled, false);
    assert.ok(e.alertas.some(a => a.includes('No se pudo enviar')));
});

test('admin inicia en Dashboard y mantiene las otras secciones ocultas', async () => {
    const secciones = ['dashboard', 'productos', 'pedidos', 'clientes', 'configuracion'].map(id => elemento({ id }));
    const enlaces = secciones.map(s => elemento({ href: `#${s.id}` }));
    const e = entorno({
        ids: { tablaProductos: elemento(), infoProductos: elemento() },
        selectores: { '#pedidos .tablaPedidos tbody': elemento(), '.paginacionPedidos p': elemento(), '.paginacionPedidos': elemento(), '.pedidoReciente tbody': elemento(), '#clientes table tbody': elemento() },
        varios: { 'main > section': secciones, '.columna1 .botonesMenu a': enlaces, '.columna1 .botonesMenu a, .columna1 .logoAdmin a': enlaces }
    });
    e.cargar('jsAdmin/scriptAdmin1.js');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ctx.location.hash, '#dashboard');
    assert.equal(secciones[0].style.display, 'block');
    assert.ok(secciones.slice(1).every(s => s.hidden && s.style.display === 'none'));
    assert.equal(enlaces[0]['aria-current'], 'page');
    assert.ok(!enlaces[4].classList.contains('activo'));
    assert.equal(e.ids.tablaProductos.children.length, 3);
    assert.match(e.selectores['#pedidos .tablaPedidos tbody'].innerHTML, /MX-0992-A/);
    assert.equal(e.selectores['.paginacionPedidos'].eventos.click.length, 1);
    await enlaces[4].emitir('click');
    assert.equal(e.ctx.location.hash, '#configuracion');
    assert.equal(secciones[4].hidden, false);
    assert.equal(secciones[0].hidden, true);
    e.ctx.location.hash = '#no-existe';
    await e.ventana.emitir('hashchange');
    assert.equal(e.ctx.location.hash, '#dashboard');
    const html = fs.readFileSync(path.join(raiz, 'frontend/pagesAdmin/homeAdmin.html'), 'utf8');
    assert.match(html, /<section id="dashboard">/);
    assert.match(html, /¡Hola, Admin!|<canvas/);
    assert.match(html, /<section id="configuracion" hidden>/);
});

test('formulario de productos guarda un alta visible en catálogo y Resetear limpia la vista previa', async () => {
    const ids = Object.fromEntries(['form-registro-producto', 'previewTitulo', 'previewDescripcion', 'previewPrecio', 'previewImagen', 'nombreProducto', 'descripcionProducto', 'categoriaProducto', 'fotoProducto', 'precioProducto', 'stockProducto'].map(id => [id, elemento()]));
    ids.previewImagen.src = 'http://localhost:8765/frontend/assets/logo.png';
    ids['form-registro-producto'].querySelector = selector => selector === 'button[type="submit"]' ? elemento() : null;
    ids.nombreProducto.value = 'Mochi Prueba';
    ids.descripcionProducto.value = 'Descripción suficientemente larga';
    ids.categoriaProducto.value = 'mochis'; ids.categoriaProducto.selectedIndex = 1;
    ids.precioProducto.value = '35'; ids.stockProducto.value = '3'; ids.fotoProducto.files = [];
    const e = entorno({ ids });
    e.cargar('js/adminProd.js');
    await e.documento.emitir('DOMContentLoaded');
    await ids['form-registro-producto'].emitir('submit');
    const registrado = JSON.parse(e.ctx.localStorage.getItem('catalogoProductos'))[0];
    assert.equal(registrado.nombre, 'Mochi Prueba');
    assert.equal(registrado.stock, 3);
    assert.equal(ids.previewTitulo.textContent, 'Nombre Del Producto');
    assert.equal(ids.previewPrecio.textContent, '$0.00');
    const catalogoNuevo = catalogo('', { catalogoProductos: [registrado] });
    await catalogoNuevo.documento.emitir('DOMContentLoaded');
    assert.match(catalogoNuevo.grid.innerHTML, /Mochi Prueba/);
});

function datosProducto(cambios = {}) {
    return { nombre: 'Mochi actualizado', descripcion: 'Descripción del producto actualizada.', precio: 49.5, stock: 12, categoria: 'mochis', imagen: imagenMochi, ...cambios };
}

test('editar un producto conserva su ID y sincroniza Inicio, catálogo, panel y carrito anterior', async () => {
    const precio = elemento(), nombre = elemento(), descripcion = elemento(), imagen = elemento(), boton = elemento();
    const card = elemento({ dataset: { productId: 'mochi-fresa' }, querySelector: selector => ({ h5: nombre, p: descripcion, img: imagen, button: boton, '[id^="priceprod"]': precio })[selector] });
    const e = entorno({
        datos: { mochiCart: [{ id: 4, nombre: 'Mochi Fresa', precio: 45, cantidad: 2, imagen: imagenMochi }] },
        ids: { listaCarrito: elemento(), totalCarrito: elemento() },
        varios: { '.product-card[data-product-id]': [card] }
    });
    const cantidad = e.ctx.Mochi.productos.listar().length;
    assert.equal(e.ctx.Mochi.productos.editar('mochi-fresa', datosProducto()), true);
    e.cargar('js/script.js');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(precio.textContent, '$49.50');
    assert.equal(nombre.textContent, 'Mochi actualizado');
    assert.equal(e.ctx.Cart.carrito[0].id, 'mochi-fresa');
    assert.equal(e.ids.totalCarrito.textContent, '$99.00');
    assert.equal(e.ctx.Mochi.productos.listar().length, cantidad);
    e.cargar('jsAdmin/scriptAdmin1.js');
    assert.equal((await e.ctx.obtenerProductos()).find(p => p.id === 'mochi-fresa').precio, 49.5);
    const guardados = JSON.parse(e.ctx.localStorage.getItem('mochiProductosEditados'));
    const vistaCatalogo = catalogo('?q=actualizado', { mochiProductosEditados: guardados });
    await vistaCatalogo.documento.emitir('DOMContentLoaded');
    assert.match(vistaCatalogo.grid.innerHTML, /\$49\.50/);
    assert.match(vistaCatalogo.grid.innerHTML, /data-product-id="mochi-fresa"/);
});

test('edición rechaza precio/stock inválidos e IDs inexistentes sin sobreescribir productos', () => {
    const e = entorno();
    assert.throws(() => e.ctx.Mochi.productos.editar('no-existe', datosProducto()), /no está disponible/);
    assert.throws(() => e.ctx.Mochi.productos.editar('mochi-fresa', datosProducto({ precio: -1 })), /precio/);
    assert.throws(() => e.ctx.Mochi.productos.editar('mochi-fresa', datosProducto({ precio: 2.999 })), /decimales/);
    assert.throws(() => e.ctx.Mochi.productos.editar('mochi-fresa', datosProducto({ stock: 1.5 })), /stock/);
    assert.equal(e.ctx.localStorage.getItem('mochiProductosEditados'), null);
    e.ctx.localStorage.setItem = () => { throw new Error('quota'); };
    assert.equal(e.ctx.Mochi.productos.editar('mochi-fresa', datosProducto()), false);
    assert.equal(e.ctx.Mochi.productos.obtener('mochi-fresa').precio, 45);
});

test('altas nuevas conservan Otros snacks y no se convierten en Pocky al recargar', () => {
    const e = entorno();
    const id = e.ctx.Mochi.productos.registrar(datosProducto({ categoria: 'snacks' }));
    assert.equal(e.ctx.Mochi.productos.obtener(id).categoria, 'snacks');
    const copia = entorno({ datos: { catalogoProductos: JSON.parse(e.ctx.localStorage.getItem('catalogoProductos')) } });
    assert.equal(copia.ctx.Mochi.productos.obtener(id).categoria, 'snacks');
});

function editor(id = 'mochi-fresa') {
    const ids = Object.fromEntries(['form-registro-producto', 'tituloProducto', 'descripcionFormulario', 'previewTitulo', 'previewDescripcion', 'previewPrecio', 'previewImagen', 'nombreProducto', 'descripcionProducto', 'categoriaProducto', 'fotoProducto', 'precioProducto', 'stockProducto'].map(key => [key, elemento()]));
    ids.previewImagen.src = 'http://localhost:8765/frontend/assets/logo.png';
    ids.fotoProducto.files = [];
    const guardar = elemento();
    ids['form-registro-producto'].querySelector = selector => selector === 'button[type="submit"]' ? guardar : null;
    const e = entorno({ ids, url: `http://localhost:8765/frontend/pages/adminProd.html?editar=${id}` });
    e.cargar('js/adminProd.js');
    return { ...e, form: ids['form-registro-producto'], guardar };
}

test('editor precarga el producto; Resetear restaura lo guardado y guardar no crea duplicados', async () => {
    const e = editor();
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.nombreProducto.value, 'Mochi Fresa');
    assert.equal(e.guardar.textContent, 'Guardar cambios');
    e.ids.nombreProducto.value = 'Cambio sin guardar';
    await e.form.emitir('reset');
    assert.equal(e.ids.nombreProducto.value, 'Mochi Fresa');
    e.ids.nombreProducto.value = 'Mochi edición';
    e.ids.precioProducto.value = '60';
    e.ids.stockProducto.value = '8';
    await e.form.emitir('submit');
    assert.equal(e.ctx.Mochi.productos.obtener('mochi-fresa').precio, 60);
    assert.equal(e.ctx.localStorage.getItem('catalogoProductos'), null);
    e.ids.precioProducto.value = '999';
    await e.form.emitir('reset');
    assert.equal(e.ids.precioProducto.value, 60);
});

test('editor no convierte un ID inválido en un registro nuevo', async () => {
    const e = editor('inexistente');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.guardar.disabled, true);
    assert.equal(e.form.eventos.submit, undefined);
    assert.equal(e.ctx.localStorage.getItem('catalogoProductos'), null);
});

test('una lectura de imagen anterior a Resetear no reemplaza la foto del producto', async () => {
    const e = editor();
    let lector;
    e.ctx.FileReader = class { constructor() { lector = this; } readAsDataURL() {} };
    await e.documento.emitir('DOMContentLoaded');
    const original = e.ids.previewImagen.src;
    e.ids.fotoProducto.files = [{ type: 'image/png', size: 20 }];
    await e.ids.fotoProducto.emitir('change');
    assert.equal(e.guardar.disabled, true);
    await e.form.emitir('reset');
    lector.onload({ target: { result: 'data:image/png;base64,AAAA' } });
    assert.equal(e.ids.previewImagen.src, original);
    assert.equal(e.guardar.disabled, false);
});

test('los diez precios HTML iniciales coinciden con la fuente compartida antes de ejecutar la página', () => {
    const { ctx } = entorno();
    const pagina = fs.readFileSync(path.join(raiz, 'frontend/pages/index.html'), 'utf8');
    const tarjetas = [...pagina.matchAll(/<div data-product-id="([^"]+)" class="card product-card[\s\S]*?id="priceprod\d+"[^>]*>\$([\d.]+)/g)];
    assert.equal(tarjetas.length, 10);
    for (const [, id, precio] of tarjetas) assert.equal(Number(precio), ctx.Mochi.productos.obtener(id).precio, id);
    const destinos = [...pagina.matchAll(/href="producto.html\?id=([^"]+)"/g)].map(m => m[1]);
    assert.equal(destinos.length, 20); // Imagen y nombre de cada tarjeta.
    for (const id of destinos) assert.ok(ctx.Mochi.productos.obtener(id), id);
});

test('la columna Editar coincide con el encabezado de la tabla y dirige al ID correcto', async () => {
    const e = entorno({ ids: { tablaProductos: elemento() } });
    e.cargar('jsAdmin/scriptAdmin1.js');
    await e.ctx.cargarProductos();
    const fila = e.ids.tablaProductos.children[0].innerHTML;
    const html = fs.readFileSync(path.join(raiz, 'frontend/pagesAdmin/homeAdmin.html'), 'utf8');
    const encabezado = html.match(/<tr class="tituloTablaProductos">([\s\S]*?)<\/tr>/)[1];
    assert.equal((fila.match(/<td\b/g) || []).length, (encabezado.match(/<th\b/g) || []).length);
    assert.match(fila, /adminProd.html\?editar=mochi-matcha/);
});

function recuperacion() {
    const e = cuenta();
    const guardar = elemento();
    for (const id of ['recuperar-clave', 'recuperarForm', 'correoRecuperacion', 'estadoRecuperacion', 'abrirRecuperacion', 'volverLogin']) e.ids[id] = elemento();
    e.ids.recuperarForm.querySelector = () => guardar;
    e.cargar('js/inicioSesion1.js');
    return { ...e, guardar, recuperarForm: e.ids.recuperarForm };
}

test('recuperación abre dentro de Iniciar sesión y permite volver al login', async () => {
    const e = recuperacion();
    assert.equal(e.ids['recuperar-clave'].hidden, true);
    await e.ids.abrirRecuperacion.emitir('click');
    assert.equal(e.form.hidden, true);
    assert.equal(e.ids['recuperar-clave'].hidden, false);
    assert.equal(e.ids.correoRecuperacion.value, e.ids.email.value);
    await e.ids.volverLogin.emitir('click');
    assert.equal(e.form.hidden, false);
});

test('sin servicio de recuperación no se simula un correo ni se altera la credencial', async () => {
    const e = recuperacion();
    e.ctx.Mochi.guardar('usuariosRegistrados', [{ email: 'prueba@example.test', claveHash: 'hash-original' }]);
    const antes = e.ctx.localStorage.getItem('usuariosRegistrados');
    e.ids.correoRecuperacion.value = 'prueba@example.test';
    await e.recuperarForm.emitir('submit');
    assert.match(e.ids.estadoRecuperacion.textContent, /No se ha enviado ningún correo/);
    assert.equal(e.ctx.localStorage.getItem('usuariosRegistrados'), antes);
});

test('recuperación usa el servicio configurado con mensaje neutral y evita doble solicitud (simulado)', async () => {
    const e = recuperacion();
    e.ctx.Mochi.config.recuperacion = '/servicio-de-prueba';
    e.ids.correoRecuperacion.value = ' PRUEBA@example.test ';
    let peticiones = 0, completar;
    e.ctx.fetch = async (url, opciones) => {
        peticiones++;
        assert.equal(url, '/servicio-de-prueba');
        assert.equal(JSON.parse(opciones.body).email, 'prueba@example.test');
        return new Promise(resolve => { completar = resolve; });
    };
    const solicitud = e.recuperarForm.emitir('submit');
    await e.recuperarForm.emitir('submit');
    assert.equal(peticiones, 1);
    assert.equal(e.guardar.disabled, true);
    completar({ ok: true });
    await solicitud;
    assert.match(e.ids.estadoRecuperacion.textContent, /Si existe una cuenta/);
    assert.equal(e.guardar.disabled, false);
});

test('recuperación restaura el botón y muestra el error si el servicio falla (simulado)', async () => {
    const e = recuperacion();
    e.ctx.Mochi.config.recuperacion = '/servicio-de-prueba';
    e.ctx.fetch = async () => ({ ok: false });
    await e.recuperarForm.emitir('submit');
    assert.match(e.ids.estadoRecuperacion.textContent, /No se pudo completar/);
    assert.equal(e.guardar.disabled, false);
});

for (const pagina of ['pagina-inicio', 'pagina-contacto', 'pagina-tienda']) test(`${pagina}: el espacio del navbar se mide al abrir y cerrar el menú móvil`, async () => {
    let altura = 76, reservado;
    const input = elemento();
    const nav = elemento({ querySelector: () => input, getBoundingClientRect: () => ({ height: altura }) });
    const e = entorno({ ids: { carritoModal: elemento() }, selectores: { '.custom-navbar': nav } });
    e.documento.body.classList.add(pagina);
    e.documento.documentElement = { style: { setProperty: (nombre, valor) => { reservado = [nombre, valor]; } } };
    e.cargar('js/script.js');
    await e.documento.emitir('DOMContentLoaded');
    assert.deepEqual(reservado, ['--mochi-navbar-height', '76px']);
    altura = 330;
    await nav.emitir('shown.bs.collapse');
    assert.deepEqual(reservado, ['--mochi-navbar-height', '330px']);
    altura = 76;
    await nav.emitir('hidden.bs.collapse');
    assert.deepEqual(reservado, ['--mochi-navbar-height', '76px']);
});


test('un precio editado superior al rango original sigue visible en el catálogo', async () => {
    const e = catalogo('', { mochiProductosEditados: { 'mochi-fresa': datosProducto({ precio: 650 }) } });
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.priceRange.max, '650');
    assert.equal(e.ids.priceRange.value, '650');
    assert.match(e.grid.innerHTML, /\$650\.00/);
    e.ids.priceRange.value = '100';
    await e.ids.priceRange.emitir('input');
    assert.doesNotMatch(e.grid.innerHTML, /\$650\.00/);
});

// Las nuevas vistas usan estas mismas cuentas, direcciones y productos; los
// fixtures no contienen datos bancarios ni servicios de red.
const direccionTienda = () => ({ id: 'casa-1', alias: 'Casa', calle: 'Calle de prueba 10', colonia: 'Centro', ciudad: 'Cuauhtémoc', estado: 'Ciudad de México', cp: '06000', principal: true });
const usuarioTienda = (id = 'usuario-1') => ({ id, nombre: `Persona ${id}`, email: `${id}@example.test`, telefono: '5512345678', fechaRegistro: '2026-08-28T00:00:00Z', sal: 'sal-de-prueba', claveHash: 'hash-de-prueba', direcciones: [direccionTienda()] });
const carritoTienda = () => [{ id: 'mochi-fresa', nombre: 'Mochi Fresa', imagen: imagenMochi, precio: 1, cantidad: 2 }];
function datosTienda(extra = {}) {
    const usuario = usuarioTienda();
    return { usuariosRegistrados: [usuario, usuarioTienda('usuario-2')], usuarioSesion: { id: usuario.id, email: usuario.email }, mochiCart: carritoTienda(), ...extra };
}
function cuentaTienda(extra = {}) { return entorno({ datos: datosTienda(extra) }); }

// Elementos mínimos obtenidos del HTML real, para ejecutar los handlers reales
// de cada página sin una implementación de navegador ni conexión a localhost.
function vistaTienda(nombre, opciones = {}) {
    const html = fs.readFileSync(path.join(raiz, `frontend/pages/${nombre}.html`), 'utf8');
    const attrs = texto => Object.fromEntries([...texto.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const ids = {};
    for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="[^"]+"[^>]*)>/g)) {
        const a = attrs(m[2]);
        ids[a.id] = elemento({ ...a, hidden: /\bhidden\b/.test(m[2]), checked: /\bchecked\b/.test(m[2]) });
    }
    for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)) {
        const form = ids[attrs(m[1]).id];
        const controles = [...m[2].matchAll(/<(input|select|textarea|button)\b([^>]*)>/g)].map(c => {
            const a = attrs(c[2]);
            return { tag: c[1], el: ids[a.id] || elemento({ ...a, checked: /\bchecked\b/.test(c[2]) }) };
        });
        form.querySelector = selector => {
            const n = selector.match(/\[name="([^"]+)"\]/)?.[1];
            if (n) return controles.find(c => c.el.name === n)?.el || null;
            if (selector === 'button[type="submit"]') return controles.find(c => c.tag === 'button' && c.el.type === 'submit')?.el || null;
            return null;
        };
        form.reset = () => { for (const c of controles) { c.el.value = ''; c.el.checked = false; } };
    }
    for (const id of ['mochiNav', 'mochiFooter', 'contenedorCarrito']) if (ids[id]) ids[id].children = [elemento()];
    ids.carritoModal = elemento();
    const metodos = ['tarjeta', 'paypal', 'spei', 'oxxo'].map(value => elemento({ value, checked: value === 'tarjeta' }));
    const paneles = metodos.map(m => elemento({ dataset: { metodoPanel: m.value } }));
    const opcionesMetodo = metodos.map(m => elemento({ dataset: { metodoOpcion: m.value } }));
    const contador = elemento(), enlaceCarrito = elemento(), estadoCarrito = elemento();
    const e = entorno({ url: `http://localhost:8765/frontend/pages/${nombre}.html${opciones.query || ''}`, datos: opciones.datos || datosTienda(), ids, varios: { 'input[name="metodo"]': metodos, '[data-metodo-panel]': paneles, '[data-metodo-opcion]': opcionesMetodo, '[data-cart-count]': [contador], '[data-cart-link]': [enlaceCarrito], '[data-cart-status]': [estadoCarrito] } });
    e.documento.querySelector = selector => selector === 'input[name="metodo"]:checked' ? metodos.find(m => m.checked) : null;
    e.documento.body.classList.add('pagina-tienda');
    e.cargar('js/script.js');
    e.cargar(`js/${nombre}.js`);
    return { ...e, html, metodos, paneles, opcionesMetodo, contador, enlaceCarrito, estadoCarrito };
}

test('perfil requiere una cuenta conectada y la URL de regreso no acepta destinos externos', async () => {
    const e = vistaTienda('perfil', { datos: {} });
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.perfilContenido.hidden, true);
    assert.match(e.ctx.location.href, /iniciaSesion.html\?volver=/);
    for (const url of ['https://example.test/perfil.html', 'javascript:alert(1)', '//evil.example/producto.html', '/frontend/pagesAdmin/homeAdmin.html']) {
        assert.match(e.ctx.Mochi.destinoSesion(url), /\/pages\/perfil.html$/);
    }
    assert.match(e.ctx.Mochi.destinoSesion('producto.html?id=mochi-fresa#resenasProducto'), /producto.html\?id=mochi-fresa#resenasProducto$/);
    assert.throws(() => e.ctx.Mochi.tienda.actualizarPerfil({}), /Inicia sesión/);
});

test('perfil guarda nombre, correo, teléfono y foto sin perder identidad, contraseña o direcciones', async () => {
    const e = vistaTienda('perfil');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.perfilContenido.hidden, false);
    assert.match(e.ids.listaDirecciones.innerHTML, /Calle de prueba/);
    e.ids.perfilNombreInput.value = 'Nombre actualizado';
    e.ids.perfilEmail.value = 'nuevo@example.test';
    e.ids.perfilTelefono.value = '55 1234 5678';
    let lector;
    e.ctx.FileReader = class { constructor() { lector = this; } readAsDataURL() {} };
    e.ids.fotoPerfil.files = [{ type: 'image/png', size: 10 }];
    await e.ids.fotoPerfil.emitir('change');
    assert.equal(e.ids.guardarPerfil.disabled, true);
    lector.result = 'data:image/png;base64,AAAA'; lector.onload();
    await e.ids.formPerfil.emitir('submit');
    const usuario = e.ctx.Mochi.usuarioActual();
    assert.equal(usuario.id, 'usuario-1');
    assert.equal(usuario.email, 'nuevo@example.test');
    assert.equal(usuario.foto, lector.result);
    assert.equal(usuario.claveHash, 'hash-de-prueba');
    assert.equal(usuario.direcciones[0].id, 'casa-1');
    assert.equal(e.ctx.Mochi.sesion().email, 'nuevo@example.test');
    assert.match(e.ids.estadoPerfil.textContent, /se guardaron/);
});

test('perfil rechaza correos duplicados, fotos inválidas y errores de almacenamiento', () => {
    const e = cuentaTienda(), tienda = e.ctx.Mochi.tienda;
    const datos = { nombre: 'Prueba', email: 'usuario-2@example.test', telefono: '5512345678' };
    assert.throws(() => tienda.actualizarPerfil(datos), /ya está registrado/);
    assert.throws(() => tienda.actualizarPerfil({ ...datos, email: 'nuevo@example.test', foto: 'data:image/svg+xml;base64,AAA' }), /foto/);
    e.ctx.localStorage.setItem = () => { throw new Error('quota'); };
    assert.equal(tienda.actualizarPerfil({ ...datos, email: 'nuevo@example.test' }), false);
    assert.equal(e.ctx.Mochi.usuarioActual().email, 'usuario-1@example.test');
});

test('una foto que termina de leer tras Quitar no reemplaza la elección más reciente', async () => {
    const e = vistaTienda('perfil');
    await e.documento.emitir('DOMContentLoaded');
    let lector;
    e.ctx.FileReader = class { constructor() { lector = this; } readAsDataURL() {} };
    e.ids.fotoPerfil.files = [{ type: 'image/png', size: 10 }];
    await e.ids.fotoPerfil.emitir('change');
    await e.ids.quitarFoto.emitir('click');
    lector.result = 'data:image/png;base64,AAAA'; lector.onload();
    assert.doesNotMatch(e.ids.perfilFoto.src, /^data:/);
    assert.equal(e.ids.guardarPerfil.disabled, false);
});

test('direcciones permiten alta, edición y eliminación, con una principal y sin cruzar cuentas', () => {
    const e = cuentaTienda(), tienda = e.ctx.Mochi.tienda;
    const nueva = tienda.guardarDireccion({ ...direccionTienda(), alias: 'Oficina', principal: true });
    assert.equal(tienda.direcciones().length, 2);
    assert.equal(tienda.direcciones().filter(d => d.principal).length, 1);
    tienda.guardarDireccion({ ...direccionTienda(), calle: 'Otra calle 20', principal: false }, nueva);
    assert.equal(tienda.direcciones().find(d => d.id === nueva).calle, 'Otra calle 20');
    assert.throws(() => tienda.guardarDireccion({ ...direccionTienda(), cp: 'abc' }), /código postal/);
    assert.throws(() => tienda.guardarDireccion(direccionTienda(), 'ajena'), /no existe/);
    tienda.eliminarDireccion(nueva);
    assert.equal(tienda.direcciones()[0].principal, true);
    assert.equal(e.ctx.Mochi.usuarios().find(u => u.id === 'usuario-2').direcciones.length, 1);
});

test('el formulario de direcciones del perfil guarda y permite abrir la edición', async () => {
    const e = vistaTienda('perfil');
    await e.documento.emitir('DOMContentLoaded');
    await e.ids.nuevaDireccion.emitir('click');
    assert.equal(e.ids.dialogoDireccion.open, true);
    for (const [k, v] of Object.entries(direccionTienda())) {
        const input = e.ids.formDireccionPerfil.querySelector(`[name="${k}"]`);
        if (input && k !== 'principal') input.value = v;
    }
    await e.ids.formDireccionPerfil.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.direcciones().length, 2);
    assert.equal(e.ids.dialogoDireccion.open, false);
    await e.ids.listaDirecciones.emitir('click', { target: { closest: selector => selector === '[data-direccion-editar]' ? { dataset: { direccionEditar: 'casa-1' } } : null } });
    assert.equal(e.ids.tituloDireccion.textContent, 'Editar dirección');
    assert.equal(e.ids.formDireccionPerfil.querySelector('[name="calle"]').value, 'Calle de prueba 10');
});

test('perfil se oculta si la sesión se cierra o cambia, incluso al volver con Atrás', async () => {
    const e = vistaTienda('perfil');
    await e.documento.emitir('DOMContentLoaded');
    await e.ventana.emitir('pagehide');
    assert.equal(e.ids.perfilContenido.hidden, true);
    e.ctx.Mochi.cerrarSesion();
    await e.ventana.emitir('pageshow');
    assert.equal(e.ids.perfilContenido.hidden, true);
    assert.match(e.ctx.location.href, /iniciaSesion.html/);
});

test('cambiar contraseña comprueba la actual y nunca guarda la nueva en texto', async () => {
    const e = cuentaTienda();
    const usuario = e.ctx.Mochi.usuarioActual();
    usuario.claveHash = await e.ctx.Mochi.derivarClave('Clave anterior', usuario.sal);
    e.ctx.Mochi.guardar('usuariosRegistrados', [usuario]);
    await assert.rejects(e.ctx.Mochi.tienda.cambiarClave('incorrecta', 'Clave nueva 123', 'Clave nueva 123'), /no coincide/);
    assert.equal(await e.ctx.Mochi.tienda.cambiarClave('Clave anterior', 'Clave nueva 123', 'Clave nueva 123'), true);
    const actualizado = e.ctx.Mochi.usuarioActual();
    assert.equal(actualizado.claveHash, await e.ctx.Mochi.derivarClave('Clave nueva 123', actualizado.sal));
    assert.doesNotMatch(e.ctx.localStorage.getItem('usuariosRegistrados'), /Clave nueva 123/);
});

test('checkout usa precios canónicos, tarifas administrativas y centavos enteros', () => {
    const e = cuentaTienda({ mochimexa_configuracion: { envioCdmx: 45.25, envioInterior: 100 } });
    const resumen = e.ctx.Mochi.tienda.cotizar('casa-1');
    assert.equal(resumen.subtotal, 9000);
    assert.equal(resumen.envio, 4525);
    assert.equal(resumen.total, 13525);
    assert.equal(resumen.items[0].precio, 45);
    assert.equal(e.ctx.Mochi.tienda.cotizar('').envio, 0);
});

test('cupones no inventan descuentos: validan configuración, vigencia y mínimo', () => {
    const e = cuentaTienda();
    assert.throws(() => e.ctx.Mochi.tienda.cotizar('casa-1', 'NO-EXISTE'), /no está disponible/);
    e.ctx.Mochi.config.cupones = [{ codigo: 'TEST', valor: 10, tipo: 'porcentaje', minimo: 50 }];
    assert.equal(e.ctx.Mochi.tienda.cotizar('casa-1', 'test').descuento, 900);
    e.ctx.Mochi.config.cupones[0].hasta = '2000-01-01';
    assert.throws(() => e.ctx.Mochi.tienda.cotizar('casa-1', 'test'), /venció/);
});

test('checkout rechaza stock insuficiente, productos desconocidos y cantidades duplicadas que superan el stock', () => {
    const e = cuentaTienda({ mochiProductosEditados: { 'mochi-fresa': datosProducto({ stock: 3 }) } });
    e.ctx.Mochi.guardar('mochiCart', [...carritoTienda(), ...carritoTienda()]);
    assert.throws(() => e.ctx.Mochi.tienda.cotizar('casa-1'), /stock suficiente/);
    e.ctx.Mochi.guardar('mochiCart', [{ id: 'no-existe', cantidad: 1 }]);
    assert.throws(() => e.ctx.Mochi.tienda.cotizar('casa-1'), /ya no está disponible/);
});

test('finalizar crea un solo pedido local sin cobro, conserva ejemplos y aparece en perfil y Admin', async () => {
    const e = cuentaTienda(), tienda = e.ctx.Mochi.tienda;
    const resumen = tienda.cotizar('casa-1');
    const solicitud = { direccionId: 'casa-1', metodo: 'tarjeta', solicitudId: 'intento-1', firma: resumen.firma };
    const primero = tienda.crearPedido(solicitud);
    const repetido = tienda.crearPedido(solicitud);
    assert.equal(primero.pedido.id, repetido.pedido.id);
    assert.equal(tienda.pedidos().length, 5);
    assert.equal(tienda.misPedidos().length, 1);
    assert.equal(primero.pedido.estadoPago, 'Sin cobrar');
    assert.equal(primero.pedido.total, 170);
    assert.equal(e.ctx.localStorage.getItem('mochiCart'), '[]');
    assert.doesNotMatch(JSON.stringify(primero.pedido), /cardNumber|cvc|numeroTarjeta/);
    e.cargar('jsAdmin/scriptAdmin1.js');
    await e.ctx.obtenerPedidos();
    await e.ctx.actualizarPedido(primero.pedido.id, { estado: 'En camino' });
    assert.equal(tienda.misPedidos()[0].estado, 'En camino');
    e.ctx.Mochi.guardar('usuarioSesion', { id: 'usuario-2', email: 'usuario-2@example.test' });
    assert.equal(tienda.misPedidos().length, 0);
});

test('un pedido no se guarda con precios cambiados, dirección ajena o un fallo de almacenamiento', () => {
    const e = cuentaTienda(), tienda = e.ctx.Mochi.tienda;
    const firma = tienda.cotizar('casa-1').firma;
    const solicitud = { direccionId: 'casa-1', metodo: 'paypal', solicitudId: '1', firma };
    e.ctx.Mochi.productos.editar('mochi-fresa', datosProducto({ precio: 99 }));
    assert.throws(() => tienda.crearPedido(solicitud), /cambió/);
    assert.throws(() => tienda.crearPedido({ ...solicitud, direccionId: 'otra' }), /dirección/);
    solicitud.firma = tienda.cotizar('casa-1').firma;
    e.ctx.localStorage.setItem = () => { throw new Error('quota'); };
    assert.equal(tienda.crearPedido(solicitud), false);
    assert.equal(tienda.misPedidos().length, 0);
    assert.equal(JSON.parse(e.ctx.localStorage.getItem('mochiCart')).length, 1);
});

test('el resumen cambia métodos, valida la confirmación y finaliza sin duplicar al pulsar otra vez', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.pedidoTotal.textContent, '$170.00');
    e.metodos.forEach(r => { r.checked = r.value === 'spei'; });
    await e.metodos[2].emitir('change');
    assert.equal(e.paneles[0].hidden, true);
    assert.equal(e.paneles[2].hidden, false);
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos().length, 0);
    e.ids.aceptarPrueba.checked = true;
    await e.ids.formPago.emitir('submit');
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos().length, 1);
    assert.equal(e.ctx.Mochi.tienda.misPedidos()[0].metodoPago, 'SPEI');
    assert.equal(e.ids.pedidoConfirmado.hidden, false);
    assert.match(e.ids.pedidoConfirmadoTexto.textContent, /170\.00/);
    assert.equal(e.ids.tarjetaPruebaCampos.disabled, true);
    assert.equal(e.contador.hidden, true);
});

test('resumen vacío desactiva finalizar y un visitante sin sesión vuelve al login', async () => {
    const vacio = vistaTienda('resumenPedido', { datos: datosTienda({ mochiCart: [] }) });
    await vacio.documento.emitir('DOMContentLoaded');
    assert.equal(vacio.ids.finalizarPedido.disabled, true);
    const anonimo = vistaTienda('resumenPedido', { datos: { mochiCart: carritoTienda() } });
    await anonimo.documento.emitir('DOMContentLoaded');
    assert.equal(anonimo.ids.accesoPedido.hidden, false);
    assert.equal(anonimo.ids.envioUsuario.hidden, true);
    await anonimo.ids.formPago.emitir('submit');
    assert.match(anonimo.ctx.location.href, /iniciaSesion.html\?volver=.*resumenPedido/);
});

test('detalle muestra el producto elegido y Comprar ahora lleva su cantidad al resumen', async () => {
    const e = vistaTienda('producto', { query: '?id=mochi-fresa', datos: datosTienda({ mochiCart: [] }) });
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.productoContenido.hidden, false);
    assert.equal(e.ids.productoNombre.textContent, 'Mochi Fresa');
    assert.equal(e.ids.productoPrecio.textContent, '$45.00 MXN');
    assert.doesNotMatch(e.ids.productosRelacionados.innerHTML, /id=mochi-fresa/);
    await e.ids.masProducto.emitir('click');
    await e.ids.comprarProducto.emitir('click');
    assert.equal(JSON.parse(e.ctx.localStorage.getItem('mochiCart'))[0].cantidad, 2);
    assert.match(e.ctx.location.href, /resumenPedido.html$/);
    await e.ids.abrirFotoProducto.emitir('click');
    assert.equal(e.ids.dialogoFotoProducto.open, true);
    assert.match(e.ids.fotoProductoAmpliada.src, /Mochi%20Fresa/);
});

test('detalle inexistente tiene salida al catálogo y el agotado no permite compra', async () => {
    const inexistente = vistaTienda('producto', { query: '?id=no-existe' });
    await inexistente.documento.emitir('DOMContentLoaded');
    assert.equal(inexistente.ids.productoNoExiste.hidden, false);
    const agotado = vistaTienda('producto', { query: '?id=mochi-fresa', datos: datosTienda({ mochiCart: [], mochiProductosEditados: { 'mochi-fresa': datosProducto({ stock: 0 }) } }) });
    await agotado.documento.emitir('DOMContentLoaded');
    assert.equal(agotado.ids.comprarProducto.disabled, true);
    assert.equal(agotado.ctx.Cart.agregarProducto('mochi-fresa', 1), false);
    assert.equal(agotado.ctx.Cart.carrito.length, 0);
});

test('reseñas se guardan por producto y usuario, se editan sin duplicar y se escapan al mostrar', async () => {
    const e = vistaTienda('producto', { query: '?id=mochi-fresa' });
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.promedioResenas.textContent, 'Sin calificaciones todavía');
    await e.ids.escribirResena.emitir('click');
    e.ids.estrellasResena.value = '5';
    e.ids.comentarioResena.value = '<img src=x onerror=alert(1)> Muy rico';
    await e.ids.formResena.emitir('submit');
    assert.match(e.ids.listaResenas.innerHTML, /&lt;img/);
    assert.doesNotMatch(e.ids.listaResenas.innerHTML, /<img src=x/);
    assert.match(e.ids.promedioResenas.textContent, /5\.0/);
    e.ctx.Mochi.tienda.guardarResena('mochi-fresa', 4, 'Cambio mi opinión de prueba.');
    assert.equal(e.ctx.Mochi.tienda.resenas('mochi-fresa').length, 1);
    assert.equal(e.ctx.Mochi.tienda.resenas('mochi-matcha').length, 0);
    e.ctx.Mochi.guardar('usuarioSesion', { id: 'usuario-2', email: 'usuario-2@example.test' });
    e.ctx.Mochi.tienda.eliminarResena('mochi-fresa');
    assert.equal(e.ctx.Mochi.tienda.resenas('mochi-fresa').length, 1);
    assert.throws(() => e.ctx.Mochi.tienda.guardarResena('mochi-fresa', 6, 'Opinión de prueba'), /estrellas/);
});

test('reseñar requiere login y el formulario de una cuenta no publica bajo otra', async () => {
    const e = vistaTienda('producto', { query: '?id=mochi-fresa' });
    await e.documento.emitir('DOMContentLoaded');
    await e.ids.escribirResena.emitir('click');
    e.ids.estrellasResena.value = '5'; e.ids.comentarioResena.value = 'Mi opinión de ejemplo.';
    e.ctx.Mochi.guardar('usuarioSesion', { id: 'usuario-2', email: 'usuario-2@example.test' });
    await e.ids.formResena.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.resenas('mochi-fresa').length, 0);
    assert.match(e.ids.estadoResena.textContent, /sesión cambió/);
    e.ctx.Mochi.cerrarSesion();
    await e.ids.escribirResena.emitir('click');
    assert.match(e.ctx.location.href, /iniciaSesion.html\?volver=.*producto/);
    assert.throws(() => e.ctx.Mochi.tienda.guardarResena('mochi-fresa', 5, 'Opinión de prueba'), /Inicia sesión/);
});

test('registro y login conservan el retorno al resumen o al producto que pidió la sesión', async () => {
    const e = cuenta();
    const destino = 'http://localhost:8765/frontend/pages/resumenPedido.html';
    e.ctx.location.href = `http://localhost:8765/frontend/pages/registroUsuarios.html?volver=${encodeURIComponent(destino)}`;
    e.cargar('js/registroUsu.js');
    await e.form.emitir('submit');
    assert.equal(e.ctx.location.href, destino);
    e.ctx.Mochi.cerrarSesion();
    const producto = 'http://localhost:8765/frontend/pages/producto.html?id=mochi-fresa#resenasProducto';
    e.ctx.location.href = `http://localhost:8765/frontend/pages/iniciaSesion.html?volver=${encodeURIComponent(producto)}`;
    e.ids['login-form'] = elemento({ querySelector: () => elemento() });
    e.cargar('js/inicioSesion1.js');
    await e.ids['login-form'].emitir('submit');
    assert.equal(e.ctx.location.href, producto);
});

test('el intento se conserva si no se pudo vaciar el carrito y un reintento no duplica el pedido', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    const guardar = e.ctx.localStorage.setItem;
    e.ctx.localStorage.setItem = (clave, valor) => { if (clave === 'mochiCart') throw new Error('carrito bloqueado'); guardar(clave, valor); };
    e.ids.aceptarPrueba.checked = true;
    await e.ids.formPago.emitir('submit');
    const intento = e.ctx.sessionStorage.getItem('mochiIntentoPedido');
    assert.ok(intento);
    assert.match(e.ids.pedidoConfirmadoTexto.textContent, /no se pudo vaciar/);
    const siguiente = vistaTienda('resumenPedido', { datos: datosTienda({ mochimexa_pedidos: e.ctx.Mochi.tienda.pedidos() }) });
    siguiente.ctx.sessionStorage.setItem('mochiIntentoPedido', intento);
    await siguiente.documento.emitir('DOMContentLoaded');
    siguiente.ids.aceptarPrueba.checked = true;
    await siguiente.ids.formPago.emitir('submit');
    assert.equal(siguiente.ctx.Mochi.tienda.misPedidos().length, 1);
    assert.match(siguiente.ids.pedidoConfirmadoTexto.textContent, /no se pudo vaciar/);
});

test('un pedido completado permite comenzar después otro pedido idéntico', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    e.ids.aceptarPrueba.checked = true;
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.sessionStorage.getItem('mochiIntentoPedido'), null);
    const nuevo = vistaTienda('resumenPedido', { datos: datosTienda({ mochimexa_pedidos: e.ctx.Mochi.tienda.pedidos() }) });
    await nuevo.documento.emitir('DOMContentLoaded');
    nuevo.ids.aceptarPrueba.checked = true;
    await nuevo.ids.formPago.emitir('submit');
    assert.equal(nuevo.ctx.Mochi.tienda.misPedidos().length, 2);
});

test('contador suma unidades sin necesitar el panel lateral y respeta errores de guardado', () => {
    const contador = elemento(), enlace = elemento(), estado = elemento();
    const e = entorno({ varios: { '[data-cart-count]': [contador], '[data-cart-link]': [enlace], '[data-cart-status]': [estado] } });
    e.cargar('js/script.js');
    e.ctx.Cart.renderCarrito();
    assert.equal(contador.hidden, true);
    e.ctx.Cart.agregarProducto('mochi-fresa', 2);
    e.ctx.Cart.agregarProducto('pocky-fresa', 1);
    assert.equal(contador.textContent, '3');
    assert.equal(contador.hidden, false);
    assert.match(enlace['aria-label'], /3 productos/);
    assert.equal(estado.textContent, '3 productos en el carrito');
    e.ctx.Cart.decrementar('mochi-fresa');
    assert.equal(contador.textContent, '2');
    e.ctx.Cart.eliminarItem('pocky-fresa');
    assert.equal(estado.textContent, '1 producto en el carrito');
    e.ctx.localStorage.setItem = () => { throw new Error('sin espacio'); };
    e.ctx.Cart.incrementar('mochi-fresa');
    assert.equal(contador.textContent, '1');
});

test('el contador recupera cantidades al recargar, cambiar de pestaña y volver con Atrás', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.contador.textContent, '2');
    e.ctx.Mochi.guardar('mochiCart', [{ ...carritoTienda()[0], cantidad: 5 }]);
    await e.ventana.emitir('storage', { key: 'mochiCart' });
    assert.equal(e.contador.textContent, '5');
    assert.equal(e.ids.pedidoTotal.textContent, '$305.00');
    e.ctx.Mochi.guardar('mochiCart', [{ ...carritoTienda()[0], cantidad: 1 }]);
    await e.ventana.emitir('pageshow');
    assert.equal(e.contador.textContent, '1');
    assert.equal(e.ids.pedidoTotal.textContent, '$125.00');
    e.ctx.Mochi.guardar('mochiCart', []);
    await e.ventana.emitir('storage', { key: 'mochiCart' });
    assert.equal(e.contador.hidden, true);
    assert.equal(e.ids.pedidoTotal.textContent, '$0.00');
});

// Se obtiene el botón desde el HTML que produjo el script y se pulsa por la
// delegación real del documento. Así no se sustituye el flujo por llamadas directas.
async function pulsarCantidad(e, accion, id = 'mochi-fresa', enfocar = false) {
    const patron = new RegExp(`<button[^>]*data-cart-action="${accion}"[^>]*data-id="${id}"[^>]*>`);
    const etiqueta = e.ids.resumenArticulos.innerHTML.match(patron)?.[0];
    assert.ok(etiqueta, `Debe existir el botón ${accion} del producto ${id}`);
    assert.doesNotMatch(etiqueta, /\sdisabled\b/);
    const boton = elemento({ dataset: { cartAction: accion, id } });
    boton.closest = selector => selector === '[data-cart-action]' ? boton : null;
    if (enfocar) e.documento.activeElement = boton;
    await e.documento.emitir('click', { target: boton });
}

test('resumen enlaza el navbar y permite sumar, restar y eliminar sin abrir el panel', async () => {
    const e = vistaTienda('resumenPedido');
    let aperturas = 0;
    e.ctx.bootstrap = { Modal: { getOrCreateInstance: () => ({ show() { aperturas++; } }) } };
    await e.documento.emitir('DOMContentLoaded');
    assert.ok(e.ids.mochiNav);
    assert.doesNotMatch(e.html, /editarCarritoResumen|Editar carrito|data-bs-target/);
    assert.match(e.html, /href="#resumenArticulos"/);
    await pulsarCantidad(e, 'incrementar');
    assert.equal(e.contador.textContent, '3');
    assert.equal(e.ids.pedidoSubtotal.textContent, '$135.00');
    assert.equal(e.ids.pedidoTotal.textContent, '$215.00');
    await pulsarCantidad(e, 'decrementar');
    await pulsarCantidad(e, 'decrementar');
    assert.equal(e.ids.pedidoTotal.textContent, '$125.00');
    assert.match(e.ids.resumenArticulos.innerHTML, /aria-label="Eliminar Mochi Fresa"/);
    await pulsarCantidad(e, 'decrementar');
    assert.match(e.ids.resumenArticulos.innerHTML, /carrito está vacío/);
    assert.equal(e.ids.pedidoTotal.textContent, '$0.00');
    assert.equal(e.ids.pedidoEnvio.textContent, '$0.00');
    assert.equal(e.ids.finalizarPedido.disabled, true);
    assert.equal(e.contador.hidden, true);
    assert.equal(aperturas, 0);
});

test('los controles del resumen conservan el foco después de actualizar una fila', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    let enfocado = '';
    const reemplazo = elemento({ dataset: { id: 'mochi-fresa', cartAction: 'incrementar' }, focus() { enfocado = 'boton'; } });
    e.ids.resumenArticulos.contains = () => true;
    e.ids.resumenArticulos.querySelectorAll = () => [reemplazo];
    await pulsarCantidad(e, 'incrementar', 'mochi-fresa', true);
    assert.equal(enfocado, 'boton');
    e.ids.resumenArticulos.querySelectorAll = () => [];
    e.ids.resumenArticulos.focus = () => { enfocado = 'lista'; };
    await pulsarCantidad(e, 'decrementar', 'mochi-fresa', true);
    assert.equal(enfocado, 'lista');
});

test('un error de stock o de cupón no oculta los controles para corregir el resumen', async () => {
    const e = vistaTienda('resumenPedido', { datos: datosTienda({ mochiProductosEditados: { 'mochi-fresa': datosProducto({ stock: 1 }) } }) });
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.finalizarPedido.disabled, true);
    assert.match(e.ids.estadoResumen.textContent, /stock suficiente/);
    assert.match(e.ids.resumenArticulos.innerHTML, /data-cart-action="incrementar"[^>]* disabled/);
    await pulsarCantidad(e, 'decrementar');
    assert.equal(e.ids.finalizarPedido.disabled, false);
    assert.equal(e.ids.estadoResumen.hidden, true);
    assert.equal(e.ids.pedidoTotal.textContent, '$129.50');

    const conCupon = vistaTienda('resumenPedido');
    conCupon.ctx.Mochi.config.cupones = [{ codigo: 'PRUEBA', tipo: 'porcentaje', valor: 10, minimo: 80 }];
    await conCupon.documento.emitir('DOMContentLoaded');
    conCupon.ids.codigoPedido.value = 'PRUEBA';
    await conCupon.ids.formCupon.emitir('submit');
    assert.equal(conCupon.ids.pedidoTotal.textContent, '$161.00');
    await pulsarCantidad(conCupon, 'incrementar');
    assert.equal(conCupon.ids.pedidoTotal.textContent, '$201.50');
    await pulsarCantidad(conCupon, 'decrementar');
    await pulsarCantidad(conCupon, 'decrementar');
    assert.equal(conCupon.ids.finalizarPedido.disabled, true);
    assert.match(conCupon.ids.estadoResumen.textContent, /requiere un subtotal/);
    assert.match(conCupon.ids.resumenArticulos.innerHTML, /data-cart-action="incrementar"/);
    conCupon.ids.codigoPedido.value = '';
    await conCupon.ids.formCupon.emitir('submit');
    assert.equal(conCupon.ids.pedidoTotal.textContent, '$125.00');
    assert.equal(conCupon.ids.finalizarPedido.disabled, false);
});

test('el método de pago persiste en la pestaña sin guardar los campos editados', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    assert.equal(e.ids.tarjetaPruebaCampos.disabled, false);
    e.ids.tarjetaPruebaNombre.value = 'Personaje de prueba';
    e.ids.tarjetaPruebaVence.value = '06/32';
    e.metodos.forEach(r => { r.checked = r.value === 'paypal'; });
    await e.metodos[1].emitir('change');
    assert.equal(e.ids.tarjetaPruebaCampos.disabled, true);
    assert.equal(e.ids.tarjetaPruebaNombre.value, 'Personaje de prueba');
    const recargado = vistaTienda('resumenPedido');
    recargado.ctx.sessionStorage.setItem('mochiMetodoPago', e.ctx.sessionStorage.getItem('mochiMetodoPago'));
    await recargado.documento.emitir('DOMContentLoaded');
    assert.equal(recargado.metodos[1].checked, true);
    assert.equal(recargado.paneles[1].hidden, false);
    assert.equal(recargado.ids.tarjetaPruebaNombre.value, 'Cliente de prueba');
    await e.ventana.emitir('pagehide');
    assert.equal(e.ids.tarjetaPruebaNombre.value, 'Cliente de prueba');
});

test('tarjeta permite editar solo la demostración, restablecerla y guardar únicamente el método', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    e.ids.aceptarPrueba.checked = true;
    e.ids.tarjetaPruebaNumero.value = '0000';
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos().length, 0);
    assert.match(e.ids.estadoPedido.textContent, /únicamente el número de prueba/);
    await e.ids.restablecerTarjetaPrueba.emitir('click');
    assert.equal(e.ids.tarjetaPruebaNumero.value, '4242 4242 4242 4242');
    e.ids.tarjetaPruebaNombre.value = 'Personaje de prueba';
    e.ids.tarjetaPruebaVence.value = '20/30';
    await e.ids.formPago.emitir('submit');
    assert.match(e.ids.estadoPedido.textContent, /formato MM\/AA/);
    assert.equal(e.ctx.Mochi.tienda.misPedidos().length, 0);
    e.ids.tarjetaPruebaVence.value = '06/32';
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos()[0].metodoPago, 'Tarjeta');
    assert.equal(e.ctx.Mochi.tienda.misPedidos()[0].estadoPago, 'Sin cobrar');
    assert.doesNotMatch(e.ctx.localStorage.getItem('mochimexa_pedidos'), /4242 4242 4242 4242|4242424242424242|Personaje de prueba|06\/32|tarjetaPrueba|cvc/i);
    assert.equal(e.ids.tarjetaPruebaNombre.value, 'Cliente de prueba');
    assert.doesNotMatch(e.html, /<input[^>]*(?:id="tarjetaPrueba[^"]+"[^>]* name=|name="[^"]+"[^>]*id="tarjetaPrueba)/);
});

test('pagos aplica la configuración vigente y bloquea una opción desactivada al confirmar', async () => {
    const e = vistaTienda('resumenPedido');
    await e.documento.emitir('DOMContentLoaded');
    e.ctx.Mochi.guardar('mochimexa_configuracion', { metodosPago: { tarjeta: false, paypal: false, spei: true, oxxo: true } });
    e.ids.aceptarPrueba.checked = true;
    // El evento de otra pestaña aún no llegó: el servicio debe impedir usar Tarjeta.
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos().length, 0);
    assert.match(e.ids.estadoPedido.textContent, /ya no está disponible/);
    assert.equal(e.opcionesMetodo[0].hidden, true);
    assert.equal(e.metodos[2].checked, true);
    assert.equal(e.opcionesMetodo[3].hidden, false);
    assert.equal(e.ids.tarjetaPruebaCampos.disabled, true);
    e.ctx.Mochi.guardar('mochimexa_configuracion', { metodosPago: { tarjeta: false, paypal: false, spei: false, oxxo: false } });
    await e.ventana.emitir('storage', { key: 'mochimexa_configuracion' });
    assert.equal(e.ids.finalizarPedido.disabled, true);
    assert.match(e.ids.estadoMetodos.textContent, /No hay métodos habilitados/);
    assert.ok(e.metodos.every(r => !r.checked && r.disabled));
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos().length, 0);
    e.ctx.Mochi.guardar('mochimexa_configuracion', { metodosPago: { tarjeta: false, paypal: false, spei: false, oxxo: true } });
    await e.ventana.emitir('storage', { key: 'mochimexa_configuracion' });
    assert.equal(e.metodos[3].checked, true);
    assert.equal(e.ids.finalizarPedido.disabled, false);
    await e.ids.formPago.emitir('submit');
    assert.equal(e.ctx.Mochi.tienda.misPedidos()[0].metodoPago, 'OXXO');
});

test('Configuración guarda los cuatro métodos por identidad y el resumen lee sus cambios', () => {
    const e = entorno({ datos: { mochimexa_configuracion: { metodosPago: { tarjeta: false, spei: true, oxxo: false } } } });
    const pagos = ['oxxo', 'paypal', 'tarjeta', 'spei'].map(id => elemento({ dataset: { metodoPago: id } }));
    e.ids.nombreAdmin = elemento(); e.ids.correoAdmin = elemento();
    e.varios['#configuracion .metodosPago input[type="checkbox"]'] = pagos;
    e.varios['#configuracion .configEnvios input[type="number"]'] = [elemento(), elemento()];
    e.cargar('jsAdmin/scriptAdmin1.js');
    e.ctx.cargarConfiguracion();
    assert.deepEqual(pagos.map(p => p.checked), [false, true, false, true]);
    pagos.forEach(p => { p.checked = p.dataset.metodoPago === 'oxxo'; });
    let cambios = 0;
    e.ventana.addEventListener('mochi:configuracion', () => { cambios++; });
    e.ctx.guardarAjustesDesdeUI();
    assert.deepEqual(JSON.parse(e.ctx.localStorage.getItem('mochimexa_configuracion')).metodosPago, { oxxo: true, paypal: false, tarjeta: false, spei: false });
    assert.deepEqual(Array.from(e.ctx.Mochi.tienda.metodosDisponibles()), ['oxxo']);
    assert.equal(cambios, 1);
    e.ctx.localStorage.setItem = () => { throw new Error('sin espacio'); };
    pagos[0].checked = false;
    e.ctx.guardarAjustesDesdeUI();
    assert.equal(cambios, 1);
    assert.deepEqual(Array.from(e.ctx.Mochi.tienda.metodosDisponibles()), ['oxxo']);
});
