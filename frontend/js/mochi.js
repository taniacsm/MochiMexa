/* Utilidades compartidas. Este frontend guarda datos de demostración en ESTE
 * navegador; no sustituye una API, autenticación de servidor ni una pasarela. */
(() => {
    const paginas = new URL('../pages/', document.currentScript.src);
    const normalizar = valor => String(valor ?? '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, caracter =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter]));

    function leer(clave, defecto, almacen = localStorage) {
        try {
            const valor = almacen.getItem(clave);
            return valor === null ? defecto : JSON.parse(valor);
        } catch {
            // No borramos datos previos si están dañados o el navegador los bloquea.
            return defecto;
        }
    }

    function guardar(clave, valor, almacen = localStorage) {
        try {
            almacen.setItem(clave, JSON.stringify(valor));
            return true;
        } catch {
            alert('No se pudo guardar en este navegador. Revisa el espacio disponible y los permisos de almacenamiento.');
            return false;
        }
    }

    function ruta(pagina, parametros = {}) {
        const destino = new URL(pagina, paginas);
        Object.entries(parametros).forEach(([clave, valor]) => destino.searchParams.set(clave, valor));
        return destino.href;
    }

    function contacto(asunto, mensaje = '', correo = '') {
        // Los datos personales van en un borrador de sesión, nunca en la URL.
        if ((mensaje || correo) && !guardar('mochiContactoBorrador', { mensaje, correo }, sessionStorage)) return;
        window.location.href = `${ruta('contactanos.html', { asunto })}#formTeam`;
    }

    function imagenSegura(valor) {
        const respaldo = new URL('../assets/imagenes/iconos/logos/LogoNegro.png', paginas).href;
        try {
            if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(valor)) return valor;
            const url = new URL(valor || respaldo, paginas);
            return ['http:', 'https:', 'file:'].includes(url.protocol) ? url.href : respaldo;
        } catch { return respaldo; }
    }

    function alternarClave(id, iconoId) {
        const campo = document.getElementById(id);
        const icono = document.getElementById(iconoId);
        if (!campo || !icono) return;
        campo.type = campo.type === 'password' ? 'text' : 'password';
        icono.src = new URL(`../assets/imagenes/iconos/eye-${campo.type === 'password' ? 'slash-solid' : 'solid'}.png`, paginas).href;
        icono.closest('button').setAttribute('aria-label', campo.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
        icono.closest('button').setAttribute('aria-pressed', String(campo.type === 'text'));
    }

    async function derivarClave(clave, sal) {
        // PBKDF2 evita guardar contraseñas en texto plano. Es solo una demostración
        // local: la autorización real debe verificarse en el futuro backend.
        const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(sal), iterations: 100000, hash: 'SHA-256' }, material, 256);
        return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    window.Mochi = {
        leer, guardar, ruta, contacto, normalizar, escapar, imagenSegura, alternarClave, derivarClave,
        // Completar SOLO con datos oficiales confirmados. No se inventan destinos.
        config: { whatsapp: '', correo: '', recuperacion: '', cupones: [] },
        usuarios: () => {
            const usuarios = leer('usuariosRegistrados', []);
            return Array.isArray(usuarios) ? usuarios.filter(usuario => usuario && typeof usuario.email === 'string') : [];
        },
        usuarioActual() {
            const sesion = leer('usuarioSesion', null);
            if (!sesion?.email) return null;
            return Mochi.usuarios().find(usuario => sesion.id ? usuario.id === sesion.id : usuario.email.toLowerCase() === sesion.email.toLowerCase()) || null;
        },
        sesion() {
            const sesion = leer('usuarioSesion', null);
            if (!sesion || typeof sesion.email !== 'string') return null;
            const actual = Mochi.usuarioActual();
            // Leer los datos actuales evita perder la cuenta al editar su correo.
            return actual ? { id: actual.id, nombre: actual.nombre, email: actual.email, telefono: actual.telefono, foto: actual.foto || '', loginTime: sesion.loginTime } : null;
        },
        iniciarSesion(usuario) {
            const id = usuario.id || crypto.randomUUID();
            if (!usuario.id) {
                const usuarios = Mochi.usuarios();
                if (!guardar('usuariosRegistrados', usuarios.map(u => u.email.toLowerCase() === usuario.email.toLowerCase() ? { ...u, id } : u))) return false;
            }
            const { nombre, email, telefono } = usuario;
            return guardar('usuarioSesion', { id, nombre, email, telefono, loginTime: new Date().toISOString() });
        },
        cerrarSesion() {
            localStorage.removeItem('usuarioSesion');
            localStorage.removeItem('sesionActiva');
            if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('mochi:sesion'));
        },
        destinoSesion(valor = new URLSearchParams(location.search).get('volver')) {
            // Solo se aceptan retornos a estas páginas propias; nunca a una URL externa.
            const defecto = ruta('perfil.html');
            try {
                const destino = new URL(valor || defecto, paginas);
                const permitidas = ['perfil.html', 'resumenPedido.html', 'producto.html'].map(p => new URL(ruta(p)).pathname);
                return destino.origin === paginas.origin && permitidas.includes(destino.pathname) ? destino.href : defecto;
            } catch { return defecto; }
        },
        pedirSesion(volver = location.href) {
            location.href = ruta('iniciaSesion.html', { volver: Mochi.destinoSesion(volver) });
        }
    };
})();
