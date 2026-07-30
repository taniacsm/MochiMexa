document.addEventListener("DOMContentLoaded", () => {
    fetch("navbar.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar el NavBar")
            }
            return response.text()
        })
        .then(data => {
            document.getElementById("mochiNav").innerHTML = data;
        })
        .catch(error => {
            console.error("Error al importar el NavBar:", error)
        })

    // fetch("footer.html")
    //     .then(response => {
    //         if (!response.ok) {
    //             throw new Error("Error al cargar el Footer")
    //         }
    //         return response.text()
    //     })
    //     .then(data => {
    //         document.getElementById("mochiFooter").innerHTML = data;
    //     })
    //     .catch(error => {
    //         console.error("Error al importar el NavBar:", error)
    //     })

    //Despliegue de carrito
    fetch('../pages/despliegueCarrito.html') // 
        .then(response => response.text())
        .then(html => {
            document.getElementById('contenedorCarrito').innerHTML = html;
        })
        .catch(error => console.error('Error al cargar el modal:', error));
})

class CartController {
    constructor() {
        this.carrito = JSON.parse(localStorage.getItem('miCarrito')) || [];
    }

    additem(id) {
        const imgElement = document.getElementById(`imgprod${id}`);
        const nameElement = document.getElementById(`nameprod${id}`);
        const descElement = document.getElementById(`descprod${id}`);
        const priceElement = document.getElementById(`priceprod${id}`);

        const productoExistente = this.carrito.find(item => item.id === id);

        if (productoExistente) {
            productoExistente.cantidad++;
            console.log(`Se aumentó la cantidad de ${productoExistente.nombre}. Total: ${productoExistente.cantidad}`);
        } else {
            const nuevoProducto = {
                id: id,
                imagen: imgElement ? imgElement.src : '',
                alt: imgElement ? imgElement.alt : '',
                nombre: nameElement ? nameElement.innerText : '',
                descripcion: descElement ? descElement.innerText : '',
                precio: priceElement ? parseFloat(priceElement.innerText.replace('$', '')) : 0,
                cantidad: 1,
                createdAt: new Date()
            };

            this.carrito.push(nuevoProducto);
            console.log("Nuevo producto agregado al carrito:", nuevoProducto);
        }

        localStorage.setItem('miCarrito', JSON.stringify(this.carrito));

        const nombreProducto = nameElement ? nameElement.innerText : 'Producto';
        alert(`¡Se actualizó el carrito! Tu lista ahora tiene este dulce guardado.`);
    }
}

const Cart = new CartController();