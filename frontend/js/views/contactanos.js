document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. LÓGICA DE BOTONES DEMOSTRATIVOS
    // ==========================================
    const botonesContacto = document.querySelectorAll(".botonesContacto button");

    botonesContacto.forEach((boton) => {
        let alertaDiv = null;

        boton.addEventListener("click", (e) => {
            e.preventDefault();

            if (!alertaDiv) {
                alertaDiv = document.createElement("div");
                alertaDiv.className = "alerta-demostrativa";
                alertaDiv.textContent = "¡Gracias por querer contactarnos!";

                alertaDiv.style.cssText = `
                    color: #89023E;
                    font-weight: bold;
                    font-size: 0.85rem;
                    margin-top: 6px;
                    text-align: center;
                `;

                boton.insertAdjacentElement("afterend", alertaDiv);
            }
        });

        boton.addEventListener("mouseleave", () => {
            if (alertaDiv) {
                alertaDiv.remove();
                alertaDiv = null;
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

        formulario.addEventListener("submit", async (e) => {
            e.preventDefault();
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
                    mostrarAlertaFlotante("¡Mensaje enviado con éxito! Formspree ya lo redirigió a tu correo.", "success");
                    formulario.reset();
                } else {
                    mostrarAlertaFlotante("Hubo un problema al procesar el envío. Revisa tu ID de Formspree.", "danger");
                }

            } catch (error) {
                console.error("Error en la conexión fetch:", error);
                mostrarAlertaFlotante("Error de conexión. Verifica tu internet e inténtalo de nuevo.", "danger");
            }
        });

        formulario.addEventListener("input", (e) => {
            if (e.target.matches("input")) {
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
    return texto
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

function mostrarAlertaFlotante(mensaje, tipo = "danger") {
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
                    <div>${mensaje}</div>
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