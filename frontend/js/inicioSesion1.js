// Función para ocultar / mostrar la contraseña
function togglePasswordVista() {
    const vision = document.getElementById('password');
    const visionCerrada = document.getElementById('ojo');

    if (vision.type === "password") {
        vision.type = "text";
        // Si la contraseña es visible, mostramos el ojo abierto (o el que corresponda)
        visionCerrada.src = "../assets/imagenes/iconos/eye-solid.png";
    } else {
        vision.type = "password";
        // Si la contraseña se oculta, mostramos el ojo tachado
        visionCerrada.src = "../assets/imagenes/iconos/eye-slash-solid.png";
    }
}

// Evento para procesar el inicio de sesión
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const contraseña = document.getElementById('password').value.trim();

    // 1. Obtener la lista de usuarios registrados previamente (por ejemplo, desde tu registro)
    const usuariosGuardados = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];

    // 2. Buscar si existe un usuario con ese correo y esa contraseña
    const usuarioEncontrado = usuariosGuardados.find(
        user => user.email === email && user.contraseña === contraseña
    );

    // NOTA: Si aún no tienes la pantalla de registro lista, puedes comentar la validación de arriba 
    // y dejar pasar el login directamente para probar la redirección:
    /*
    const usuarioEncontrado = true; 
    */

    if (usuarioEncontrado) {
        // 3. Guardar el estado de la sesión actual
        const usuarioSesion = {
            email: email,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('sesionActiva', JSON.stringify(usuarioSesion));

        // 4. Limpiar el formulario y redirigir al index
        document.getElementById('login-form').reset();
        window.location.href = '../index.html'; // Redirección a la página principal
    } else {
        alert('Correo o contraseña incorrectos. Inténtalo de nuevo.');
    }
});