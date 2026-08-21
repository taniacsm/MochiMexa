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