// Toggle para mostrar/ocultar contraseña
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

// Toggle para confirmar contraseña
function toggleConfirmPasswordVista() {
    const visionConfirm = document.getElementById('passwordConfirm');
    const visionCerradaConfirm = document.getElementById('ojoConfirm');
    if (visionConfirm.type === "password") {
        visionConfirm.type = "text";
        visionCerradaConfirm.src = "../assets/imagenes/iconos/eye-solid.png";
    } else {
        visionConfirm.type = "password";
        visionCerradaConfirm.src = "../assets/imagenes/iconos/eye-slash-solid.png";
    }
}

// Envío del formulario al Backend (REST API)
document.getElementById('registroForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('passwordConfirm').value;

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    // Estructura del objeto JSON enviada al Controller de Spring Boot
    const usuarioDTO = {
        nombre: nombre,
        email: email,
        telefono: telefono,
        password: password
    };

    try {
        // Conexión al endpoint de Spring Boot (Puerto 8080)
        const response = await fetch('http://localhost:8080/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioDTO)
        });

        if (response.ok) {
            const data = await response.json();
            alert("Usuario registrado con éxito en la base de datos.");
            
            // Redirección corregida con ruta relativa
            window.location.href = '../index.html';
        } else {
            alert("Hubo un error al registrar el usuario. Revisa los datos enviados.");
        }
    } catch (error) {
        console.error('Error al conectar con la REST API:', error);
        alert("No se pudo establecer conexión con el servidor Spring Boot.");
    }
});