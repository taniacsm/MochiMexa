// Función para ocultar / mostrar la contraseña
function togglePasswordVista() {
    const vision = document.getElementById('password');
    const visionCerrada = document.getElementById('ojo');

    if (vision.type === "password") {
        vision.type = "text";
        visionCerrada.src = "../assets/imagenes/iconos/eye-solid.png";
    } else {
        vision.type = "password";
        visionCerrada.src = "../assets/imagenes/iconos/eye-slash-solid.png";
    }
}

// Evento para procesar el inicio de sesión mediante la API REST
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Endpoint de autenticación en el servidor Spring Boot (Puerto 8080)
    const API_URL = 'http://localhost:8080/api/auth/login';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: email, 
                password: password 
            })
        });

        if (!response.ok) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        const data = await response.json();

        // Almacenar token o datos de sesión devueltos por Spring Boot
        const usuarioSesion = {
            email: email,
            token: data.token || null,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('sesionActiva', JSON.stringify(usuarioSesion));

        document.getElementById('login-form').reset();
        window.location.href = '../index.html';

    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
});