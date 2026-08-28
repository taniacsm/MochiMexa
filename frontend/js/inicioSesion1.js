function togglePasswordVista() { Mochi.alternarClave('password', 'ojo'); }

// Crear una cuenta desde checkout o una reseña conserva el destino de regreso.
const enlaceRegistro = document.querySelector('.register-link');
if (enlaceRegistro && new URLSearchParams(location.search).has('volver')) enlaceRegistro.href = Mochi.ruta('registroUsuarios.html', { volver: Mochi.destinoSesion() });

// Registro y login usan usuariosRegistrados y usuarioSesion. Antes el registro
// no guardaba una credencial y el login terminaba en una ruta que no existía.
document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const clave = document.getElementById('password').value;
    document.getElementById('email').value = email;
    if (!this.reportValidity()) return;
    const boton = this.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        const usuario = Mochi.usuarios().find(item => item.email.toLowerCase() === email);
        if (usuario && !usuario.claveHash) {
            alert('Esta cuenta antigua no tiene una credencial compatible. No podemos recuperar ni inventar su contraseña. Abre «¿Olvidaste tu clave?» para consultar las opciones de recuperación.');
            return;
        }
        if (!usuario || await Mochi.derivarClave(clave, usuario.sal) !== usuario.claveHash) {
            alert('Correo o contraseña incorrectos. Inténtalo de nuevo.');
            return;
        }
        if (Mochi.iniciarSesion(usuario)) window.location.href = Mochi.destinoSesion();
    } catch (error) {
        console.error('No se pudo iniciar la sesión local:', error);
        alert('No se pudo iniciar sesión. Usa un servidor local (localhost) o HTTPS.');
    } finally { boton.disabled = false; }
});


// La sección vive en Iniciar sesión. No se restablece una contraseña basándose
// solo en el correo ni se muestran enlaces falsos generados en el navegador.
(() => {
    const panel = document.getElementById('recuperar-clave');
    const formulario = document.getElementById('recuperarForm');
    if (!panel || !formulario) return;
    const login = document.getElementById('login-form');
    const correo = document.getElementById('correoRecuperacion');
    const estado = document.getElementById('estadoRecuperacion');
    const boton = formulario.querySelector('button[type="submit"]');
    let enviando = false;

    function mostrarRecuperacion(abierta, enfocar = false) {
        panel.hidden = !abierta;
        login.hidden = abierta;
        if (abierta && !correo.value) correo.value = document.getElementById('email').value.trim();
        if (enfocar) (abierta ? correo : document.getElementById('email')).focus();
    }
    document.getElementById('abrirRecuperacion').addEventListener('click', () => mostrarRecuperacion(true, true));
    document.getElementById('volverLogin').addEventListener('click', () => mostrarRecuperacion(false, true));
    window.addEventListener('hashchange', () => mostrarRecuperacion(location.hash === '#recuperar-clave'));
    mostrarRecuperacion(location.hash === '#recuperar-clave');

    formulario.addEventListener('submit', async event => {
        event.preventDefault();
        correo.value = correo.value.trim().toLowerCase();
        if (enviando || !formulario.reportValidity()) return;
        estado.hidden = false;
        if (!Mochi.config.recuperacion) {
            estado.textContent = 'El envío de enlaces de recuperación todavía no está habilitado. Usa «Necesito ayuda» para solicitar asistencia. No se ha enviado ningún correo ni cambiado tu contraseña.';
            return;
        }
        enviando = true;
        boton.disabled = true;
        boton.textContent = 'Solicitando…';
        estado.textContent = 'Procesando tu solicitud…';
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), 10000);
        try {
            const respuesta = await fetch(Mochi.config.recuperacion, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email: correo.value }), signal: controlador.signal
            });
            if (!respuesta.ok) throw new Error('Solicitud rechazada');
            // Mensaje neutral: no revela qué direcciones tienen una cuenta.
            estado.textContent = 'Si existe una cuenta asociada a ese correo, recibirás las instrucciones de recuperación. Revisa también la carpeta de spam.';
        } catch {
            estado.textContent = 'No se pudo completar la solicitud. Tu contraseña no cambió; inténtalo de nuevo o solicita ayuda.';
        } finally {
            clearTimeout(temporizador);
            enviando = false;
            boton.disabled = false;
            boton.textContent = 'Solicitar enlace';
        }
    });
})();
