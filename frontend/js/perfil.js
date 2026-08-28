/* El perfil reutiliza la cuenta del login. El guardado es local y no concede
 * permisos de servidor: las comprobaciones deben repetirse en la futura API. */
document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const { tienda, escapar, ruta } = Mochi;
    let usuarioId = '', foto = '', lecturaFoto = 0, editandoDireccion = '', todosPedidos = false;
    const estado = (id, mensaje, error = false) => { const el = $(id); el.hidden = false; el.textContent = mensaje; el.dataset.error = String(error); };
    function comprobarSesion() {
        const usuario = Mochi.usuarioActual();
        if (!usuario || (usuarioId && usuario.id !== usuarioId)) {
            $('perfilContenido').hidden = true;
            $('dialogoDireccion').close();
            Mochi.pedirSesion(ruta('perfil.html'));
            return false;
        }
        return true;
    }
    if (!comprobarSesion()) return;
    try { usuarioId = tienda.cuenta().id; } catch { return; }

    function pintarFoto() { $('perfilFoto').src = foto || Mochi.imagenSegura(''); }
    function cargarPerfil() {
        if (!comprobarSesion()) return;
        const usuario = tienda.cuenta();
        lecturaFoto++;
        $('guardarPerfil').disabled = false;
        $('fotoPerfil').value = '';
        foto = usuario.foto || '';
        pintarFoto();
        $('perfilNombre').textContent = usuario.nombre;
        $('perfilNombreInput').value = usuario.nombre;
        $('perfilEmail').value = usuario.email;
        $('perfilTelefono').value = usuario.telefono || '';
        const fecha = new Date(usuario.fechaRegistro);
        $('perfilAntiguedad').textContent = Number.isNaN(fecha.getTime()) ? 'Tu cuenta MochiMexa' : `Miembro desde ${fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`;
        $('perfilCarga').hidden = true;
        $('perfilContenido').hidden = false;
        pintarDirecciones();
        pintarPedidos();
    }
    function pintarDirecciones() {
        $('listaDirecciones').innerHTML = tienda.direcciones().map(d => `
            <article class="perfil-direccion ${d.principal ? 'principal' : ''}">
                <div class="d-flex justify-content-between gap-2"><h3><i class="bi bi-house" aria-hidden="true"></i> ${escapar(d.alias)}</h3>${d.principal ? '<span class="tienda-etiqueta">Principal</span>' : ''}</div>
                <p>${escapar(d.calle)}, ${escapar(d.colonia)}<br>${escapar(d.ciudad)}, ${escapar(d.estado)}, ${escapar(d.cp)}</p>
                <div class="tienda-acciones"><button class="tienda-enlace" data-direccion-editar="${escapar(d.id)}" type="button">Editar</button><button class="tienda-enlace" data-direccion-eliminar="${escapar(d.id)}" type="button">Eliminar</button></div>
            </article>`).join('') || '<p class="tienda-nota">Aún no tienes direcciones. Agrega la primera para preparar un pedido.</p>';
    }
    function pintarPedidos() {
        const pedidos = tienda.misPedidos();
        $('verTodosPedidos').hidden = pedidos.length <= 3;
        $('verTodosPedidos').textContent = todosPedidos ? 'Mostrar recientes' : 'Ver todos';
        $('listaPedidosPerfil').innerHTML = (todosPedidos ? pedidos : pedidos.slice(0, 3)).map(p => `
            <details class="perfil-pedido"><summary><span><strong>Pedido #${escapar(p.id.slice(0, 11).toUpperCase())}</strong><small>${escapar(p.fecha)} · ${p.items?.reduce((s, i) => s + i.cantidad, 0) || 0} artículos</small></span><span><strong>${tienda.dinero(p.total)} MXN</strong><span class="tienda-etiqueta">${escapar(p.estado)} · Sin cobrar</span></span></summary>
                <p class="tienda-nota mt-3">Referencia: ${escapar(p.id)}</p>
                <ul>${(p.items || []).map(i => `<li><a href="${ruta('producto.html', { id: i.id })}">${escapar(i.nombre)}</a> · ${i.cantidad} × ${tienda.dinero(i.precio)}</li>`).join('')}</ul>
                <p class="tienda-nota">Envío: ${tienda.dinero(p.costoEnvio || 0)} · Método de prueba: ${escapar(p.metodoPago)}<br>Pedido local sin cobro ni envío real.</p>
            </details>`).join('') || `<p class="tienda-vacio">Todavía no tienes pedidos.<br><a href="${ruta('catalogo.html')}">Descubre el catálogo</a></p>`;
    }
    $('formPerfil').addEventListener('submit', event => {
        event.preventDefault();
        if (!comprobarSesion() || !$('formPerfil').reportValidity() || $('guardarPerfil').disabled) return;
        try {
            if (!tienda.actualizarPerfil({ nombre: $('perfilNombreInput').value, email: $('perfilEmail').value, telefono: $('perfilTelefono').value, foto })) return;
            cargarPerfil();
            estado('estadoPerfil', 'Tus datos y foto se guardaron en este navegador.');
        } catch (error) { estado('estadoPerfil', error.message, true); }
    });
    $('fotoPerfil').addEventListener('change', () => {
        const archivo = $('fotoPerfil').files[0], turno = ++lecturaFoto;
        $('guardarPerfil').disabled = false;
        if (!archivo || !comprobarSesion()) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(archivo.type) || archivo.size > 2 * 1024 * 1024) return estado('estadoPerfil', 'Selecciona una imagen PNG, JPG o WebP de hasta 2 MB.', true);
        $('guardarPerfil').disabled = true;
        const lector = new FileReader();
        lector.onload = () => {
            if (turno !== lecturaFoto || !comprobarSesion()) return;
            foto = lector.result;
            pintarFoto();
            $('guardarPerfil').disabled = false;
            estado('estadoPerfil', 'Vista previa lista. Pulsa Guardar cambios para conservar tu foto.');
        };
        lector.onerror = () => { if (turno === lecturaFoto) { $('guardarPerfil').disabled = false; estado('estadoPerfil', 'No se pudo leer la imagen.', true); } };
        lector.readAsDataURL(archivo);
    });
    $('quitarFoto').addEventListener('click', () => {
        lecturaFoto++; foto = ''; $('fotoPerfil').value = ''; $('guardarPerfil').disabled = false; pintarFoto();
        estado('estadoPerfil', 'Pulsa Guardar cambios para quitar la foto de tu cuenta.');
    });

    const formDireccion = $('formDireccionPerfil');
    const campo = nombre => formDireccion.querySelector(`[name="${nombre}"]`);
    campo('estado').innerHTML = '<option value="">Selecciona un estado</option>' + tienda.estadosMX.map(e => `<option>${escapar(e)}</option>`).join('');
    function abrirDireccion(id = '') {
        if (!comprobarSesion()) return;
        editandoDireccion = id;
        formDireccion.reset();
        $('estadoDireccionPerfil').hidden = true;
        $('tituloDireccion').textContent = id ? 'Editar dirección' : 'Nueva dirección';
        const direccion = tienda.direcciones().find(d => d.id === id);
        if (direccion) {
            ['alias', 'calle', 'colonia', 'ciudad', 'estado', 'cp'].forEach(k => { campo(k).value = direccion[k]; });
            campo('principal').checked = direccion.principal;
        }
        $('dialogoDireccion').showModal();
    }
    $('nuevaDireccion').addEventListener('click', () => abrirDireccion());
    $('cerrarDireccion').addEventListener('click', () => $('dialogoDireccion').close());
    $('listaDirecciones').addEventListener('click', event => {
        const editar = event.target.closest('[data-direccion-editar]');
        const eliminar = event.target.closest('[data-direccion-eliminar]');
        if (editar) abrirDireccion(editar.dataset.direccionEditar);
        if (eliminar && comprobarSesion() && confirm('¿Eliminar esta dirección de tu cuenta?')) {
            if (tienda.eliminarDireccion(eliminar.dataset.direccionEliminar)) pintarDirecciones();
        }
    });
    formDireccion.addEventListener('submit', event => {
        event.preventDefault();
        if (!comprobarSesion() || !formDireccion.reportValidity()) return;
        try {
            const datos = Object.fromEntries(['alias', 'calle', 'colonia', 'ciudad', 'estado', 'cp'].map(k => [k, campo(k).value]));
            if (!tienda.guardarDireccion({ ...datos, principal: campo('principal').checked }, editandoDireccion)) return;
            pintarDirecciones(); $('dialogoDireccion').close();
        } catch (error) { estado('estadoDireccionPerfil', error.message, true); }
    });
    $('verTodosPedidos').addEventListener('click', () => { if (comprobarSesion()) { todosPedidos = !todosPedidos; pintarPedidos(); } });
    $('formClavePerfil').addEventListener('submit', async event => {
        event.preventDefault();
        if (!comprobarSesion() || !event.currentTarget.reportValidity()) return;
        const boton = $('formClavePerfil').querySelector('button[type="submit"]');
        if (boton.disabled) return;
        boton.disabled = true;
        try {
            if (!await tienda.cambiarClave($('claveActualPerfil').value, $('claveNuevaPerfil').value, $('claveConfirmarPerfil').value)) return;
            $('formClavePerfil').reset(); estado('estadoClavePerfil', 'Contraseña local actualizada.');
        } catch (error) { estado('estadoClavePerfil', error.message, true); }
        finally { boton.disabled = false; }
    });
    $('cerrarSesionPerfil').addEventListener('click', () => { Mochi.cerrarSesion(); location.href = ruta('iniciaSesion.html'); });
    const marcarSeccion = () => {
        document.querySelectorAll('.perfil-lateral nav a').forEach(a => {
            if (a.hash === (location.hash || '#informacionPersonal')) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
        });
    };
    window.addEventListener('hashchange', marcarSeccion);
    window.addEventListener('mochi:sesion', comprobarSesion);
    window.addEventListener('storage', event => {
        if (!comprobarSesion()) return;
        if (event.key === 'mochimexa_pedidos') pintarPedidos();
        if (event.key === 'usuariosRegistrados') cargarPerfil();
    });
    window.addEventListener('pagehide', () => { $('perfilContenido').hidden = true; $('dialogoDireccion').close(); lecturaFoto++; });
    window.addEventListener('pageshow', cargarPerfil);
    cargarPerfil(); marcarSeccion();
});
