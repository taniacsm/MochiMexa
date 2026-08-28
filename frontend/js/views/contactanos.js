document.addEventListener("DOMContentLoaded", () => {
    // Sin destinos oficiales configurados, los botones llevan al formulario
    // existente y explican el límite; no se inventan teléfonos ni correos.
    document.querySelectorAll('.botonesContacto button').forEach(boton => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('whats') && Mochi.config.whatsapp) {
                location.href = `https://wa.me/${Mochi.config.whatsapp.replace(/\D/g, '')}`;
            } else if (boton.classList.contains('email') && Mochi.config.correo) {
                location.href = `mailto:${Mochi.config.correo}`;
            } else {
                mostrarAlertaFlotante('Este canal directo aún no está configurado. Puedes escribirnos en el formulario.', 'info');
                document.getElementById('formTeam').scrollIntoView({ behavior: 'smooth' });
                document.getElementById('nombre').focus({ preventScroll: true });
            }
        });
    });

    // ==========================================
    // 2. LÓGICA DEL FORMULARIO DE CONTACTO
    // ==========================================
    const formulario = document.getElementById("form-contactanos");

    if (formulario) {
        const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const regexTelefono = /^\d{10}$/;
        const URL_FORMSPREE = `https://formspree.io/f/xkodzeev`;

        const asunto = new URLSearchParams(location.search).get('asunto');
        const temas = {
            envios: 'Quisiera conocer la cobertura, los costos y los tiempos de envío.',
            pagos: 'Quisiera consultar las formas de pago disponibles.',
            suscripcion: 'Quisiera información sobre la Suscripción Candy y sus promociones.',
            privacidad: 'Quisiera consultar el aviso de privacidad oficial de MochiMexa.',
            terminos: 'Quisiera consultar los términos y condiciones oficiales de MochiMexa.',
            recuperar: 'Necesito ayuda con mi acceso a MochiMexa. No incluiré contraseñas en este mensaje.',
            soporte: 'Necesito ayuda con el funcionamiento de MochiMexa.'
        };
        const borrador = Mochi.leer('mochiContactoBorrador', null, sessionStorage);
        if (borrador?.mensaje || temas[asunto]) formulario.elements.mensaje.value = borrador?.mensaje || temas[asunto];
        if (borrador?.correo) formulario.elements.correo.value = borrador.correo;
        // Consumir solo el borrador de esta navegación evita reutilizar datos en
        // consultas futuras. El texto permanece editable dentro del formulario.
        if (borrador) sessionStorage.removeItem('mochiContactoBorrador');
        if (['privacidad', 'terminos', 'recuperar'].includes(asunto)) {
            mostrarAlertaFlotante('Esta sección aún no tiene una página oficial o servicio de recuperación. Puedes solicitar información aquí. No envíes contraseñas.', 'info');
        }

        let enviando = false;
        formulario.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (enviando || !formulario.reportValidity()) return;
            const datosFormulario = new FormData(formulario);

            const nombreRaw = datosFormulario.get("nombre");
            const correoRaw = datosFormulario.get("correo");
            const telefonoRaw = datosFormulario.get("telefono");
            const mensajeRaw = datosFormulario.get("mensaje");

            const nombre = sanitizarTexto(nombreRaw);
            const correo = sanitizarTexto(correoRaw);
            const telefono = sanitizarTexto(telefonoRaw);
            const mensaje = sanitizarTexto(mensajeRaw);

            if (!regexNombre.test(nombre)) {
                mostrarAlertaFlotante("El nombre no debe incluir números.", "danger");
                formulario.elements["nombre"].classList.add("is-invalid");
                return;
            }

            if (!regexCorreo.test(correo)) {
                mostrarAlertaFlotante("El formato del correo electrónico es inválido.", "danger");
                formulario.elements["correo"].classList.add("is-invalid");
                return;
            }

            if (!regexTelefono.test(telefono)) {
                mostrarAlertaFlotante("El teléfono debe contener exactamente 10 dígitos numéricos.", "danger");
                formulario.elements["telefono"].classList.add("is-invalid");
                return;
            }

            if (mensaje == "") {
                mostrarAlertaFlotante("El mensaje no puede ir vacío.", "danger");
                formulario.elements["mensaje"].classList.add("is-invalid");
                return;
            }

            const datosLimpios = new FormData();
            datosLimpios.append("name", nombre);
            datosLimpios.append("email", correo);
            datosLimpios.append("phone", telefono);
            datosLimpios.append("message", mensaje);

            const botonEnviar = document.getElementById('btnEnviar');
            enviando = true;
            botonEnviar.disabled = true;
            try {
                mostrarAlertaFlotante("Procesando envío de mensaje...", "warning");

                const respuesta = await fetch(URL_FORMSPREE, {
                    method: "POST",
                    body: datosLimpios,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (respuesta.ok) {
                    mostrarAlertaFlotante("El servicio recibió tu mensaje. Gracias por contactarnos.", "success");
                    formulario.reset();
                } else {
                    mostrarAlertaFlotante("No se pudo enviar el mensaje. Tus datos siguen en el formulario para que puedas reintentar.", "danger");
                }

            } catch (error) {
                console.error("Error en la conexión fetch:", error);
                mostrarAlertaFlotante("Error de conexión. Verifica tu internet e inténtalo de nuevo.", "danger");
            } finally {
                enviando = false;
                botonEnviar.disabled = false;
            }
        });

        formulario.addEventListener("input", (e) => {
            if (e.target.matches("input, textarea")) {
                e.target.classList.remove("is-invalid");
            }
        });
    }
});

// ==========================================
// 3. FUNCIONES AUXILIARES
// ==========================================
function sanitizarTexto(texto) {
    if (!texto) return "";
    // FormData envía texto, no HTML. Escaparlo aquí alteraba los mensajes.
    return texto.trim();
}

function mostrarAlertaFlotante(mensaje, tipo = "danger") {
    if (!window.bootstrap) { alert(mensaje); return; }
    const toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) return;

    const idUnico = `toast-${Date.now()}`;

    let icono = "⚠️";
    if (tipo === "success") icono = "✅";
    if (tipo === "info")    icono = "ℹ️";
    if (tipo === "danger")  icono = "❌";

    const htmlToast = `
        <div id="${idUnico}" class="toast align-items-center text-white bg-${tipo} border-0 shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex p-2">
                <div class="toast-body d-flex align-items-center gap-2" style="font-size: 14px; line-height: 1.4;">
                    <span style="font-size: 18px;">${icono}</span>
                    <div>${Mochi.escapar(mensaje)}</div>
                </div>
                <button type="button" class="btn-close btn-close-white m-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML("beforeend", htmlToast);

    const elementoToast = document.getElementById(idUnico);
    const bsToast = new bootstrap.Toast(elementoToast, { delay: 4000 });
    bsToast.show();

    setTimeout(() => elementoToast?.remove(), 4500);
}