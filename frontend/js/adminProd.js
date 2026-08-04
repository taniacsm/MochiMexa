document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro-producto');
    
    // Elementos de la Vista Previa (Card)
    const previewTitulo = document.getElementById('previewTitulo');
    const previewDescripcion = document.getElementById('previewDescripcion');
    const previewPrecio = document.getElementById('previewPrecio');
    const previewImagen = document.getElementById('previewImagen');

    // inputs del Formulario
    const nombreInput = document.getElementById('nombreProducto');
    const descripcionInput = document.getElementById('descripcionProducto');
    const categoriaSelect = document.getElementById('categoriaProducto');
    const fotoInput = document.getElementById('fotoProducto');
    const precioInput = document.getElementById('precioProducto');
    const stockInput = document.getElementById('stockProducto');

    // Sincronización con la Vista Previa 
    nombreInput.addEventListener('input', (e) => {
        previewTitulo.textContent = e.target.value.trim() || 'Nombre del Producto';
    });

    descripcionInput.addEventListener('input', (e) => {
        previewDescripcion.textContent = e.target.value.trim() || 'Descripción previa del producto...';
    });

    precioInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        previewPrecio.textContent = !isNaN(val) ? `$${val.toFixed(2)}` : '$0.00';
    });

    // Cargar imagen local en la vista previa
    fotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImagen.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });


    // Validación y Alertas de Bootstrap ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Detiene el envío nativo del formulario

    // Eliminar alertas previas si existen
        const alertaPrevia = form.querySelector('.alert');
        if (alertaPrevia) alertaPrevia.remove();

    // Inicializamos array de errores
        let errores = [];

    // Validaciones personalizadas
        if (nombreInput.value.trim().length < 3) {
            errores.push('El nombre del producto debe tener al menos 3 caracteres.');
        }

        if (descripcionInput.value.trim().length < 10) {
            errores.push('La descripción debe ser más detallada (mínimo 10 caracteres).');
        }

        if (categoriaSelect.selectedIndex === 0 || categoriaSelect.value === 'Selecciona una categoría') {
            errores.push('Por favor, selecciona una categoría válida.');
        }

        const precioValue = parseFloat(precioInput.value);
        if (isNaN(precioValue) || precioValue <= 0) {
            errores.push('El precio debe ser un número mayor a 0.');
        }

        const stockValue = parseInt(stockInput.value, 10);
        if (isNaN(stockValue) || stockValue < 0) {
            errores.push('El stock no puede ser un número negativo.');
        }

        // Si hay errores, mostrar la alerta de Bootstrap y detener el flujo
        if (errores.length > 0) {
            mostrarAlerta(errores, 'danger');
            return;
        }



    // Generación del Objeto JSON y Guardado en LocalStorage ---
        
        const productoNuevoCatalogo = {
            nombre: nombreInput.value.trim(),
            descripcion: descripcionInput.value.trim(),
            categoria: categoriaSelect.value,
            precio: precioValue,
            stock: stockValue,
            // Guardamos la imagen desde la vista previa 
            imagen: fotoInput.files.length > 0 ? previewImagen.src : '',
            fechaRegistro: new Date()//.toISOString()
        };

    // Mostramos el resultado en consola
            
            console.log("String JSON listo para enviar:", productoNuevoCatalogo);

    // Obtener inventario actual de localStorage o crear array vacío si no existe
        let catalogo = JSON.parse(localStorage.getItem('catalogoProductos')) || [];
        
    // Añadir el nuevo producto
        catalogo.push(productoNuevoCatalogo);

    // Guardar array actualizado en LocalStorage convirtiéndolo a String JSON
        localStorage.setItem('catalogoProductos', JSON.stringify(catalogo));

    // Mostrar alerta de producto registrado
        mostrarAlerta(['¡Producto registrado con éxito y guardado en la base de datos local!'], 'success');

    // Limpiar el formulario 
        form.reset();
        setTimeout(() => {
            previewTitulo.textContent = 'Mochi de Matcha Premium';
            previewDescripcion.textContent = 'Descripción previa del producto para previsualización en el catálogo...';
            previewPrecio.textContent = '$0.00';
            previewImagen.src = '';
            
        // Remover la alerta de éxito tras unos segundos
            const alertaExito = form.querySelector('.alert');
            if (alertaExito) alertaExito.remove();
        }, 3500);
    });

    // Función auxiliar para renderizar alertas HTML de Bootstrap
    function mostrarAlerta(mensajes, tipo) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo} alert-dismissible fade show my-3 rounded-3`;
        alertDiv.setAttribute('role', 'alert');

        let cuerpoAlerta = '';
        if (mensajes.length > 1) {
            cuerpoAlerta = `<strong class="d-block mb-1">Por favor corrige los siguientes errores:</strong><ul>`;
            mensajes.forEach(msg => {
                cuerpoAlerta += `<li>${msg}</li>`;
            });
            cuerpoAlerta += `</ul>`;
        } else {
            cuerpoAlerta = `<div>${mensajes[0]}</div>`;
        }

        alertDiv.innerHTML = `
            ${cuerpoAlerta}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

    // Insertar la alerta al principio del formulario para que sea muy visible
        form.insertBefore(alertDiv, form.firstChild);
        
    // Auto-scroll suave hacia la alerta
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
