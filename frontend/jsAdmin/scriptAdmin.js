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
// ========================================
// PRODUCTOS
// ========================================

const productos = [
    {
        nombre: "Mochi Tradicional Matcha",
        sku: "MO-MAT-001",
        imagen: "/frontend/assets/imagenes/productosCatalogo/mochis/Mochi Matcha.png",
        categoria: "Mochis",
        precio: 45,
        stock: 124,
        estado: "Activo"
    },
    {
        nombre: "Pocky Fresa Kawaii",
        sku: "PK-FRE-002",
        imagen: "/frontend/assets/imagenes/productos/pocky-fresa.png",
        categoria: "Pockys",
        precio: 35,
        stock: 12,
        estado: "Activo"
    },
    {
        nombre: "Ramune Soda Original",
        sku: "BE-RAM-003",
        imagen: "/frontend/assets/imagenes/productos/ramune-original.png",
        categoria: "Bebidas",
        precio: 65,
        stock: 0,
        estado: "Inactivo"
    },
    {
        nombre: "Mochi Fresa",
        sku: "MO-FRE-004",
        imagen: "/frontend/assets/imagenes/productos/mochi-fresa.png",
        categoria: "Mochis",
        precio: 50,
        stock: 30,
        estado: "Activo"
    },
    {
        nombre: "Pocky Chocolate",
        sku: "PK-CHO-005",
        imagen: "/frontend/assets/imagenes/productos/pocky-chocolate.png",
        categoria: "Pockys",
        precio: 40,
        stock: 20,
        estado: "Activo"
    },
    {
        nombre: "Ramune Melón",
        sku: "BE-MEL-006",
        imagen: "/frontend/assets/imagenes/productos/ramune-melon.png",
        categoria: "Bebidas",
        precio: 60,
        stock: 15,
        estado: "Activo"
    },
    {
        nombre: "Mochi Mango",
        sku: "MO-MAN-007",
        imagen: "/frontend/assets/imagenes/productos/mochi-mango.png",
        categoria: "Mochis",
        precio: 55,
        stock: 8,
        estado: "Activo"
    },
    {
        nombre: "Pocky Matcha",
        sku: "PK-MAT-008",
        imagen: "/frontend/assets/imagenes/productos/pocky-matcha.png",
        categoria: "Pockys",
        precio: 42,
        stock: 18,
        estado: "Activo"
    },
    {
        nombre: "Ramune Fresa",
        sku: "BE-FRE-009",
        imagen: "/frontend/assets/imagenes/productos/ramune-fresa.png",
        categoria: "Bebidas",
        precio: 65,
        stock: 0,
        estado: "Inactivo"
    }
];


// ========================================
// VARIABLES DE PAGINACIÓN
// ========================================

let paginaActual = 1;

const productosPorPagina = 3;


// ========================================
// ELEMENTOS DEL HTML
// ========================================

const tablaProductos = document.getElementById("tablaProductos");

const botonAnterior = document.getElementById("anterior");

const botonSiguiente = document.getElementById("siguiente");

const botonesPagina = document.querySelectorAll(".pagina");

const infoProductos = document.getElementById("infoProductos");


// ========================================
// MOSTRAR PRODUCTOS
// ========================================

function mostrarProductos() {

    // Limpiamos las filas anteriores
    tablaProductos.innerHTML = "";

    // Calculamos desde qué producto comenzar
    const inicio = (paginaActual - 1) * productosPorPagina;

    // Calculamos dónde termina esta página
    const fin = inicio + productosPorPagina;

    // Sacamos solo los productos correspondientes
    const productosPagina = productos.slice(inicio, fin);


    // Recorremos los productos de la página actual
    productosPagina.forEach(producto => {

        // Creamos una fila
        const fila = document.createElement("tr");


        // ========================================
        // CLASE DE CATEGORÍA
        // ========================================

        // "Mochis" -> "mochis"
        const claseCategoria =
            producto.categoria.toLowerCase();


        // ========================================
        // CLASE DE STOCK
        // ========================================

        let claseStock = "";

        if (producto.stock > 15) {

            claseStock = "stockBueno";

        } else if (
            producto.stock > 0 &&
            producto.stock <= 15
        ) {

            claseStock = "stockBajo";
        }


        // ========================================
        // CLASE DE ESTADO
        // ========================================

        // "Activo" -> "activo"
        // "Inactivo" -> "inactivo"
        const claseEstado =
            producto.estado.toLowerCase();


        // ========================================
        // CONTENIDO DE LA FILA
        // ========================================

        fila.innerHTML = `

            <!-- CHECKBOX -->
            <td>
                <input
                    type="checkbox"
                    class="checkboxProducto"
                >
            </td>


            <!-- PRODUCTO -->
            <td>

                <div class="productoInfo">

                    <img
                        src="${producto.imagen}"
                        alt="${producto.nombre}"
                        class="productoImagen"
                    >

                    <div class="productoTexto">

                        <strong>
                            ${producto.nombre}
                        </strong>

                        <span>
                            SKU: ${producto.sku}
                        </span>

                    </div>

                </div>

            </td>


            <!-- CATEGORÍA -->
            <td>

                <span
                    class="categoria categoria-${claseCategoria}"
                >
                    ${producto.categoria}
                </span>

            </td>


            <!-- PRECIO -->
            <td>
                $${producto.precio.toFixed(2)} MXN
            </td>


            <!-- STOCK -->
            <td class="${claseStock}">
                ${producto.stock}
            </td>


            <!-- ESTADO -->
            <td>

                <span class="estado ${claseEstado}">

                    <span class="puntoEstado"></span>

                    ${producto.estado}

                </span>

            </td>
        `;


        // Agregamos la fila al tbody
        tablaProductos.appendChild(fila);
    });


    // ========================================
    // TEXTO "MOSTRANDO..."
    // ========================================

    const primerProducto = inicio + 1;

    const ultimoProducto = Math.min(
        fin,
        productos.length
    );

    infoProductos.textContent =
        `Mostrando ${primerProducto} a ${ultimoProducto} de ${productos.length} productos`;


    // Actualizamos botones
    actualizarBotones();
}


// ========================================
// ACTUALIZAR BOTONES
// ========================================

function actualizarBotones() {

    const totalPaginas = Math.ceil(
        productos.length / productosPorPagina
    );


    // Desactivar "Anterior" en página 1
    botonAnterior.disabled =
        paginaActual === 1;


    // Desactivar "Siguiente" en la última página
    botonSiguiente.disabled =
        paginaActual === totalPaginas;


    // Cambiar estilo del botón activo
    botonesPagina.forEach(boton => {

        const numeroPagina =
            Number(boton.dataset.pagina);


        boton.classList.remove("activo");


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


    if (paginaActual < totalPaginas) {

        paginaActual++;

        mostrarProductos();
    }
});


// ========================================
// BOTÓN ANTERIOR
// ========================================

botonAnterior.addEventListener("click", () => {

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

        paginaActual =
            Number(boton.dataset.pagina);

        mostrarProductos();
    });
});


// ========================================
// MOSTRAR PRIMERA PÁGINA
// ========================================

mostrarProductos();