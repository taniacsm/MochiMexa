// Se conservan los nombres usados por los onclick del HTML.
function togglePasswordVista() { Mochi.alternarClave('password', 'ojo'); }
function toggleConfirmPasswordVista() { Mochi.alternarClave('passwordConfirm', 'ojoConfirm'); }

document.getElementById('registroForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const nombre = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const telefono = document.getElementById('phone').value.replace(/[\s()-]/g, '');
    const clave = document.getElementById('password').value;
    const confirmacion = document.getElementById('passwordConfirm').value;
    if (!this.reportValidity()) return;
    if (nombre.length < 2) return alert('Escribe tu nombre completo.');
    if (!/^\d{10}$/.test(telefono)) return alert('El teléfono debe tener 10 dígitos.');
    if (clave.length < 8) return alert('La contraseña debe tener al menos 8 caracteres.');
    if (clave !== confirmacion) return alert('Las contraseñas no coinciden.');
    if (Mochi.usuarios().some(usuario => usuario.email.toLowerCase() === email)) {
        return alert('Este correo ya está registrado en este navegador. Inicia sesión o consulta a la tienda si tu cuenta anterior no guardó una contraseña.');
    }

    const boton = this.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        const sal = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
        const claveHash = await Mochi.derivarClave(clave, sal);
        const nuevoUsuario = { id: crypto.randomUUID(), nombre, email, telefono, sal, claveHash, fechaRegistro: new Date().toISOString() };
        // Se vuelve a leer después de la operación asíncrona para no sobrescribir
        // registros de otra pestaña. Nunca se guarda la contraseña original.
        const usuarios = Mochi.usuarios();
        if (usuarios.some(usuario => usuario.email.toLowerCase() === email)) return alert('Este correo ya está registrado.');
        if (!Mochi.guardar('usuariosRegistrados', [...usuarios, nuevoUsuario])) return;
        if (!Mochi.iniciarSesion(nuevoUsuario)) return;
        alert('Cuenta de demostración registrada en este navegador. No es una cuenta de servidor; usa datos de prueba.');
        window.location.href = Mochi.destinoSesion();
    } catch (error) {
        console.error('No se pudo completar el registro local:', error);
        alert('No se pudo completar el registro. Abre la página con un servidor local (localhost) o HTTPS e inténtalo de nuevo.');
    } finally { boton.disabled = false; }
});
