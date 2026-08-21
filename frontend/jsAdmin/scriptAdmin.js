// Buscamos en el HTML el canvas que tiene el id "graficaVentas"
const graficaVentas = document.getElementById("graficaVentas");

// Creamos una nueva gráfica
new Chart(graficaVentas, {

    // Le decimos qué tipo de gráfica queremos
    // "bar" significa gráfica de barras
    type: "bar",

    // Aquí van los datos de nuestra gráfica
    data: {

        // Estos son los textos que aparecen abajo de cada barra
        labels: ["L", "M", "M", "J", "V", "S", "D"],

        datasets: [
            {
                // Nombre de nuestros datos
                label: "Ventas",

                // Ventas de cada día
                // Por ahora son datos inventados
                data: [120, 180, 90, 240, 150, 280, 210],

                // Colores de las barras
                backgroundColor: [
                    "#d9e5ce",
                    "#d9e5ce",
                    "#d9e5ce",
                    "#8DBA76",
                    "#d9e5ce",
                    "#ffc088",
                    "#ffc088"
                ],

                // Redondeamos la parte superior de las barras
                borderRadius: 8
            }
        ]
    },

    // Configuración visual
    options: {

        // Hace que la gráfica se adapte al tamaño del contenedor
        responsive: true,

        // Permite que nosotros controlemos su altura con CSS
        maintainAspectRatio: false,

        plugins: {

            // Quitamos el cuadrito que dice "Ventas"
            legend: {
                display: false
            }
        },

        scales: {

            // Configuración del eje horizontal
            x: {
                grid: {
                    display: false
                },

                // Quitamos la línea inferior
                border: {
                    display: false
                }
            },

            // Configuración del eje vertical
            y: {

                // Empezar desde 0
                beginAtZero: true,

                // Ocultamos los números del lado izquierdo
                ticks: {
                    display: false
                },

                // Quitamos las líneas horizontales
                grid: {
                    display: false
                },

                // Quitamos la línea vertical
                border: {
                    display: false
                }
            }
        }
    }
});

// ========================================
// PRODUCTOS
// ========================================

// Por ahora los productos están escritos aquí.
// Después estos datos pueden venir de tu backend / base de datos.
const productos = [
    {
        nombre: "Mochi Tradicional Matcha",
        categoria: "Mochis",
        precio: 45,
        stock: 124,
        estado: "Activo"
    },
    {
        nombre: "Pocky Fresa Kawaii",
        categoria: "Pockys",
        precio: 35,
        stock: 12,
        estado: "Activo"
    },
    {
        nombre: "Ramune Soda Original",
        categoria: "Bebidas",
        precio: 65,
        stock: 0,
        estado: "Inactivo"
    },
    {
        nombre: "Mochi Fresa",
        categoria: "Mochis",
        precio: 50,
        stock: 30,
        estado: "Activo"
    },
    {
        nombre: "Pocky Chocolate",
        categoria: "Pockys",
        precio: 40,
        stock: 20,
        estado: "Activo"
    },
    {
        nombre: "Ramune Melón",
        categoria: "Bebidas",
        precio: 60,
        stock: 15,
        estado: "Activo"
    },
    {
        nombre: "Mochi Mango",
        categoria: "Mochis",
        precio: 55,
        stock: 8,
        estado: "Activo"
    },
    {
        nombre: "Pocky Matcha",
        categoria: "Pockys",
        precio: 42,
        stock: 18,
        estado: "Activo"
    },
    {
        nombre: "Ramune Fresa",
        categoria: "Bebidas",
        precio: 65,
        stock: 0,
        estado: "Inactivo"
    }
];


// ========================================
// VARIABLES PARA LA PAGINACIÓN
// ========================================

// Página que estamos viendo actualmente.
let paginaActual = 1;

// Cuántos productos queremos mostrar por página.
const productosPorPagina = 3;


// ========================================
// ELEMENTOS DEL HTML
// ========================================

// tbody donde vamos a insertar los productos.
const tablaProductos = document.getElementById("tablaProductos");

// Botones anterior y siguiente.
const botonAnterior = document.getElementById("anterior");
const botonSiguiente = document.getElementById("siguiente");

// Seleccionamos TODOS los botones que tengan class="pagina".
const botonesPagina = document.querySelectorAll(".pagina");


// ========================================
// FUNCIÓN PARA MOSTRAR LOS PRODUCTOS
// ========================================

function mostrarProductos() {

    // Primero limpiamos la tabla.
    // Esto evita que se acumulen los productos anteriores.
    tablaProductos.innerHTML = "";


    // Calculamos desde qué producto debemos empezar.
    //
    // Página 1:
    // (1 - 1) * 3 = 0
    //
    // Página 2:
    // (2 - 1) * 3 = 3
    //
    // Página 3:
    // (3 - 1) * 3 = 6
    const inicio = (paginaActual - 1) * productosPorPagina;


    // Calculamos dónde termina la página.
    const fin = inicio + productosPorPagina;


    // slice() toma solamente una parte del arreglo.
    //
    // Por ejemplo:
    // slice(0, 3)
    //
    // toma los productos:
    // 0, 1 y 2
    const productosPagina = productos.slice(inicio, fin);


    // Recorremos solamente los productos
    // que pertenecen a esta página.
    productosPagina.forEach(producto => {

        // Creamos una fila <tr>.
        const fila = document.createElement("tr");


        // Metemos dentro de la fila los datos del producto.
        fila.innerHTML = `
            <td>
                <input type="checkbox" class="checkboxProducto">
            </td>

            <td>${producto.nombre}</td>

            <td>${producto.categoria}</td>

            <td>$${producto.precio.toFixed(2)} MXN</td>

            <td>${producto.stock}</td>

            <td>${producto.estado}</td>
        `;


        // Agregamos la fila al tbody.
        tablaProductos.appendChild(fila);
    });


    // ========================================
    // TEXTO: "Mostrando 1 a 3 de 9 productos"
    // ========================================

    // El primer producto que aparece en esta página.
    // Sumamos 1 porque los arreglos empiezan en posición 0.
    const primerProducto = inicio + 1;


    // Calculamos el último producto mostrado.
    //
    // Math.min() evita pasarnos del total.
    // Por ejemplo, si existen 8 productos:
    // página 3 mostraría del 7 al 8, NO del 7 al 9.
    const ultimoProducto = Math.min(fin, productos.length);


    // Cambiamos el texto del <p> que tenemos en el HTML.
    document.getElementById("infoProductos").textContent =
        `Mostrando ${primerProducto} a ${ultimoProducto} de ${productos.length} productos`;


    // Actualizamos los botones después de mostrar la página.
    actualizarBotones();
}

// ========================================
// FUNCIÓN PARA ACTUALIZAR LOS BOTONES
// ========================================

function actualizarBotones() {

    // Calculamos cuántas páginas existen.
    //
    // Tenemos 9 productos y mostramos 3:
    //
    // 9 / 3 = 3 páginas

    const totalPaginas = Math.ceil(
        productos.length / productosPorPagina
    );


    // Si estamos en la página 1,
    // desactivamos "Anterior".
    botonAnterior.disabled = paginaActual === 1;


    // Si estamos en la última página,
    // desactivamos "Siguiente".
    botonSiguiente.disabled = paginaActual === totalPaginas;


    // Recorremos los botones 1, 2 y 3.
    botonesPagina.forEach(boton => {

        // Obtenemos el número guardado en:
        // data-pagina="1"
        // data-pagina="2"
        // etc.
        const numeroPagina = Number(boton.dataset.pagina);


        // Quitamos la clase activo de todos.
        boton.classList.remove("activo");


        // Si este botón corresponde a la página actual,
        // agregamos la clase activo.
        if (numeroPagina === paginaActual) {
            boton.classList.add("activo");
        }
    });
}


// ========================================
// BOTÓN SIGUIENTE
// ========================================

botonSiguiente.addEventListener("click", () => {

    const totalPaginas = Math.ceil(
        productos.length / productosPorPagina
    );


    // Solo avanzamos si todavía existe
    // una página siguiente.
    if (paginaActual < totalPaginas) {

        paginaActual++;

        mostrarProductos();
    }
});


// ========================================
// BOTÓN ANTERIOR
// ========================================

botonAnterior.addEventListener("click", () => {

    // Solo retrocedemos si no estamos
    // en la primera página.
    if (paginaActual > 1) {

        paginaActual--;

        mostrarProductos();
    }
});


// ========================================
// BOTONES 1, 2 Y 3
// ========================================

botonesPagina.forEach(boton => {

    boton.addEventListener("click", () => {

        // dataset.pagina obtiene el valor de:
        // data-pagina="..."
        //
        // Number lo convierte de texto a número.

        paginaActual = Number(boton.dataset.pagina);

        mostrarProductos();
    });
});


// ========================================
// MOSTRAR LA PRIMERA PÁGINA AL CARGAR
// ========================================

mostrarProductos();