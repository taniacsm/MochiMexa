document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const { tienda, escapar, ruta } = Mochi;
    let codigo = '', resumen = null, procesando = false, completado = false, usuarioVista = '', usuarioPedido = '';
    let metodoElegido = Mochi.leer('mochiMetodoPago', '', sessionStorage);
    const avisar = (id, mensaje, error = false) => { $(id).hidden = false; $(id).textContent = mensaje; $(id).dataset.error = String(error); };
    const radiosMetodo = Array.from(document.querySelectorAll('input[name="metodo"]'));
    const datosTarjetaPrueba = { tarjetaPruebaNumero: '4242 4242 4242 4242', tarjetaPruebaVence: '12/30', tarjetaPruebaCvc: '123', tarjetaPruebaNombre: 'Cliente de prueba' };
    const restablecerTarjeta = () => Object.entries(datosTarjetaPrueba).forEach(([id, valor]) => { $(id).value = valor; });
    const formDireccion = $('formDireccionPedido');
    const campo = nombre => formDireccion.querySelector(`[name="${nombre}"]`);
    campo('estado').innerHTML = '<option value="">Selecciona un estado</option>' + tienda.estadosMX.map(e => `<option>${escapar(e)}</option>`).join('');
    $('loginPedido').href = ruta('iniciaSesion.html', { volver: ruta('resumenPedido.html') });

    function cargarDirecciones() {
        const usuario = Mochi.usuarioActual();
        if (usuarioVista !== (usuario?.id || '')) { formDireccion.reset(); restablecerTarjeta(); usuarioVista = usuario?.id || ''; }
        $('accesoPedido').hidden = Boolean(usuario);
        $('envioUsuario').hidden = !usuario;
        const anterior = $('direccionPedido').value;
        const direcciones = usuario ? tienda.direcciones() : [];
        $('direccionPedido').innerHTML = '<option value="">Selecciona una dirección</option>' + direcciones.map(d => `<option value="${escapar(d.id)}">${escapar(d.alias)} · ${escapar(d.calle)}, ${escapar(d.estado)}</option>`).join('');
        $('direccionPedido').value = direcciones.some(d => d.id === anterior) ? anterior : direcciones.find(d => d.principal)?.id || '';
        $('nuevaDireccionPedido').open = !direcciones.length;
    }
    function mostrarArticulos() {
        const contenedor = $('resumenArticulos');
        const foco = document.activeElement?.closest('[data-cart-action]');
        const restaurarFoco = foco && contenedor.contains(foco);
        // La lista permanece editable aunque la cotización detecte stock
        // insuficiente o un cupón inválido: el usuario debe poder corregirla aquí.
        Cart.recargar();
        contenedor.innerHTML = Cart.carrito.map(p => {
            const producto = Mochi.productos.obtener(p.id);
            const limite = Math.min(999, producto?.stock ?? 999);
            const enlace = ruta('producto.html', { id: p.id });
            return `<article class="pago-articulo">
                <a href="${enlace}"><img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}"></a>
                <div>
                    <a href="${enlace}">${escapar(p.nombre)}</a>
                    <div class="pago-cantidad" role="group" aria-label="Cantidad de ${escapar(p.nombre)}">
                        <button type="button" data-cart-action="decrementar" data-id="${escapar(p.id)}" aria-label="${p.cantidad === 1 ? 'Eliminar' : 'Quitar una unidad de'} ${escapar(p.nombre)}">−</button>
                        <span>${p.cantidad}</span>
                        <button type="button" data-cart-action="incrementar" data-id="${escapar(p.id)}" aria-label="Agregar una unidad de ${escapar(p.nombre)}" ${!producto || p.cantidad >= limite ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <strong>${tienda.dinero(p.precio * p.cantidad)}</strong>
            </article>`;
        }).join('') || `<p class="tienda-vacio">Tu carrito está vacío.<br><a href="${ruta('catalogo.html')}">Elegir productos</a></p>`;
        // El render sustituye los botones. Recuperar el foco permite seguir
        // ajustando con el teclado, incluso tras eliminar una fila completa.
        if (restaurarFoco) {
            const botones = Array.from(contenedor.querySelectorAll('[data-cart-action]')).filter(b => !b.disabled);
            const siguiente = botones.find(b => b.dataset.id === foco.dataset.id && b.dataset.cartAction === foco.dataset.cartAction) || botones.find(b => b.dataset.id === foco.dataset.id) || botones[0] || contenedor;
            siguiente.focus({ preventScroll: true });
        }
    }
    function mostrarMetodo() {
        const elegido = radiosMetodo.find(r => r.checked && !r.disabled)?.value;
        document.querySelectorAll('[data-metodo-panel]').forEach(panel => { panel.hidden = panel.dataset.metodoPanel !== elegido; });
        // Los campos ocultos de tarjeta no bloquean la validación de SPEI,
        // PayPal u OXXO; cambiar de método no borra la edición durante esta visita.
        $('tarjetaPruebaCampos').disabled = elegido !== 'tarjeta';
    }
    function recordarMetodo() {
        // Solo la opción elegida persiste en esta pestaña, nunca los campos.
        try { sessionStorage.setItem('mochiMetodoPago', JSON.stringify(metodoElegido)); } catch { /* La elección sigue funcionando sin persistencia. */ }
    }
    function actualizarMetodos() {
        const disponibles = tienda.metodosDisponibles();
        const anterior = metodoElegido;
        if (!disponibles.includes(metodoElegido)) metodoElegido = disponibles[0] || '';
        radiosMetodo.forEach(radio => {
            radio.disabled = !disponibles.includes(radio.value);
            radio.checked = radio.value === metodoElegido;
        });
        document.querySelectorAll('[data-metodo-opcion]').forEach(opcion => { opcion.hidden = !disponibles.includes(opcion.dataset.metodoOpcion); });
        $('estadoMetodos').hidden = true;
        if (!disponibles.length) avisar('estadoMetodos', 'No hay métodos habilitados. La tienda debe activarlos en Administración → Configuración.');
        else if (anterior && anterior !== metodoElegido) avisar('estadoMetodos', 'Tu método anterior ya no está disponible. Revisa la nueva selección antes de confirmar.');
        if (metodoElegido !== anterior) recordarMetodo();
        mostrarMetodo();
    }
    function actualizarResumen() {
        if (completado) return;
        mostrarArticulos();
        actualizarMetodos();
        $('estadoResumen').hidden = true;
        $('finalizarPedido').disabled = true;
        try {
            resumen = tienda.cotizar($('direccionPedido').value, codigo);
            $('pedidoSubtotal').textContent = tienda.dinero(resumen.subtotal / 100);
            $('pedidoDescuento').textContent = `−${tienda.dinero(resumen.descuento / 100)}`;
            $('pedidoEnvio').textContent = resumen.direccion ? tienda.dinero(resumen.envio / 100) : 'Por calcular';
            $('pedidoTotal').textContent = tienda.dinero(resumen.total / 100);
            $('finalizarPedido').textContent = `Finalizar pedido de prueba – ${tienda.dinero(resumen.total / 100)}`;
            $('finalizarPedido').disabled = !resumen.items.length || !metodoElegido || procesando;
        } catch (error) {
            resumen = null;
            avisar('estadoResumen', error.message, true);
            ['pedidoSubtotal', 'pedidoDescuento', 'pedidoEnvio', 'pedidoTotal'].forEach(id => { $(id).textContent = '—'; });
            $('finalizarPedido').textContent = 'Revisa tu carrito para continuar';
        }
    }
    function confirmar(pedido, carritoVaciado = true) {
        completado = true;
        restablecerTarjeta();
        usuarioPedido = pedido.usuarioId;
        $('pagoContenido').hidden = true;
        $('pedidoConfirmado').hidden = false;
        $('pedidoConfirmadoTexto').textContent = `Referencia ${pedido.id}. Total estimado: ${tienda.dinero(pedido.total)} MXN.${carritoVaciado ? '' : ' El pedido está guardado, pero no se pudo vaciar el carrito. Puedes limpiarlo desde el icono del carrito.'}`;
        $('pedidoConfirmado').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    $('direccionPedido').addEventListener('change', actualizarResumen);
    formDireccion.addEventListener('submit', event => {
        event.preventDefault();
        if (!formDireccion.reportValidity()) return;
        try {
            const datos = Object.fromEntries(['alias', 'calle', 'colonia', 'ciudad', 'estado', 'cp'].map(k => [k, campo(k).value]));
            const id = tienda.guardarDireccion(datos);
            if (!id) return;
            cargarDirecciones(); $('direccionPedido').value = id;
            $('nuevaDireccionPedido').open = false;
            formDireccion.reset(); actualizarResumen();
        } catch (error) { avisar('estadoDireccionPedido', error.message, true); }
    });
    $('formCupon').addEventListener('submit', event => {
        event.preventDefault();
        const candidato = $('codigoPedido').value.trim();
        try {
            tienda.cotizar($('direccionPedido').value, candidato);
            codigo = candidato;
            avisar('estadoCupon', codigo ? 'Código aplicado al resumen.' : 'Código retirado.');
            actualizarResumen();
        } catch (error) { avisar('estadoCupon', error.message, true); }
    });
    radiosMetodo.forEach(radio => radio.addEventListener('change', () => {
        if (!radio.checked || radio.disabled) return;
        metodoElegido = radio.value;
        recordarMetodo();
        actualizarResumen();
    }));
    $('restablecerTarjetaPrueba').addEventListener('click', restablecerTarjeta);
    function validarTarjetaPrueba() {
        if (metodoElegido !== 'tarjeta') return;
        // Se aceptan únicamente los números ficticios mostrados. La validación
        // ocurre en memoria; estos datos no forman parte de crearPedido().
        if ($('tarjetaPruebaNumero').value.replace(/ /g, '') !== '4242424242424242' || $('tarjetaPruebaCvc').value !== '123') throw new Error('Usa únicamente el número de prueba 4242 4242 4242 4242 y el CVC ficticio 123. No ingreses datos bancarios reales.');
        if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test($('tarjetaPruebaVence').value) || $('tarjetaPruebaNombre').value.trim().length < 2) throw new Error('Completa el vencimiento con formato MM/AA y un nombre ficticio de al menos dos caracteres.');
    }
    $('formPago').addEventListener('submit', event => {
        event.preventDefault();
        if (procesando || completado) return;
        if (!Mochi.usuarioActual()) return Mochi.pedirSesion(ruta('resumenPedido.html'));
        if (!$('formPago').reportValidity() || !$('aceptarPrueba').checked || !resumen) return;
        procesando = true; $('finalizarPedido').disabled = true;
        try {
            validarTarjetaPrueba();
            // Reutilizar el intento después de recargar evita duplicar un pedido
            // si se guardó pero falló el vaciado del carrito o se cerró la pestaña.
            let intento = Mochi.leer('mochiIntentoPedido', null, sessionStorage);
            const usuarioId = tienda.cuenta().id;
            if (!intento || intento.firma !== resumen.firma || intento.usuarioId !== usuarioId) {
                intento = { id: crypto.randomUUID(), firma: resumen.firma, usuarioId };
                if (!Mochi.guardar('mochiIntentoPedido', intento, sessionStorage)) return;
            }
            // El servicio recibe solo la preferencia, nunca los campos de tarjeta.
            const resultado = tienda.crearPedido({ direccionId: $('direccionPedido').value, metodo: document.querySelector('input[name="metodo"]:checked')?.value, codigo, solicitudId: intento.id, firma: resumen.firma });
            if (!resultado) return;
            if (resultado.carritoVaciado !== false) {
                try { sessionStorage.removeItem('mochiIntentoPedido'); } catch { /* El pedido ya está guardado. */ }
            }
            confirmar(resultado.pedido, resultado.carritoVaciado !== false);
            history.replaceState(null, '', ruta('resumenPedido.html', { pedido: resultado.pedido.id }));
        } catch (error) { avisar('estadoPedido', error.message, true); }
        finally { procesando = false; if (!completado) actualizarResumen(); }
    });
    window.addEventListener('mochi:carrito', actualizarResumen);
    window.addEventListener('mochi:productos', actualizarResumen);
    window.addEventListener('mochi:configuracion', actualizarResumen);
    window.addEventListener('storage', event => {
        if (['usuarioSesion', 'usuariosRegistrados', null].includes(event.key)) {
            if (completado) { $('pedidoConfirmado').hidden = true; location.href = ruta('resumenPedido.html'); return; }
            cargarDirecciones();
        }
        actualizarResumen();
    });
    window.addEventListener('pagehide', () => {
        // Evita restaurar texto escrito en los campos al volver con Atrás.
        restablecerTarjeta();
        if (completado) $('pedidoConfirmado').hidden = true;
    });
    window.addEventListener('pageshow', () => {
        if (completado) {
            if (Mochi.usuarioActual()?.id !== usuarioPedido) { $('pedidoConfirmado').hidden = true; location.href = ruta('resumenPedido.html'); }
            else $('pedidoConfirmado').hidden = false;
        } else { cargarDirecciones(); actualizarResumen(); }
    });
    cargarDirecciones(); actualizarResumen();
    const idConfirmado = new URLSearchParams(location.search).get('pedido');
    if (idConfirmado && Mochi.usuarioActual()) {
        const pedido = tienda.misPedidos().find(p => p.id === idConfirmado);
        if (pedido) confirmar(pedido);
    }
});
