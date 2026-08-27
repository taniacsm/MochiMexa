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

    fetch("footer.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar el Footer")
            }
            return response.text()
        })
        .then(data => {
            document.getElementById("mochiFooter").innerHTML = data;
        })
        .catch(error => {
            console.error("Error al importar el NavBar:", error)
        })

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
        this.carrito = [];
        this.apiBaseUrl = '/api/cart'; // Api de CartController
    }

    // Cargar carrito desde el backend al iniciar
    async cargarCarrito() {
        try {
            const response = await fetch(this.apiBaseUrl);
            if (!response.ok) throw new Error('Error al obtener el carrito');
            
            this.carrito = await response.json();
            this.renderCarrito();
        } catch (error) {
            console.error("Error al cargar el carrito:", error);
        }
    }

    // Agregar producto (POST al backend)
    async additem(id) {
        const imgElement = document.getElementById(`imgprod${id}`);
        const nameElement = document.getElementById(`nameprod${id}`);
        const descElement = document.getElementById(`descprod${id}`);
        const priceElement = document.getElementById(`priceprod${id}`);

        const productoData = {
            id: id,
            imagen: imgElement ? imgElement.src : '',
            alt: imgElement ? imgElement.alt : '',
            nombre: nameElement ? nameElement.innerText : '',
            descripcion: descElement ? descElement.innerText : '',
            precio: priceElement ? parseFloat(priceElement.innerText.replace('$', '')) : 0,
            cantidad: 1
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/agregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });

            if (!response.ok) throw new Error('No se pudo agregar el producto');

            // Actualizamos la lista local con la respuesta del servidor
            this.carrito = await response.json(); 
            this.renderCarrito();
            console.log(`¡Carrito actualizado en el servidor!`);
        } catch (error) {
            console.error("Error al agregar el producto:", error);
        }
    }

    // Incrementar cantidad (PUT / PATCH al backend)
    async incrementar(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/incrementar/${id}`, {
                method: 'PATCH'
            });

            if (!response.ok) throw new Error('Error al incrementar');

            this.carrito = await response.json();
            this.renderCarrito();
        } catch (error) {
            console.error("Error al incrementar la cantidad:", error);
        }
    }

    // Decrementar cantidad (PUT / PATCH al backend)
    async decrementar(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/decrementar/${id}`, {
                method: 'PATCH'
            });

            if (!response.ok) throw new Error('Error al decrementar');

            this.carrito = await response.json();
            this.renderCarrito();
        } catch (error) {
            console.error("Error al decrementar la cantidad:", error);
        }
    }

    // Eliminar ítem (DELETE al backend)
    async eliminarItem(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/eliminar/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar');

            this.carrito = await response.json();
            this.renderCarrito();
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
        }
    }

    // Renderizar HTML en la interfaz (Mantiene la misma lógica visual)
    renderCarrito() {
        const contenedor = document.getElementById('listaCarrito');
        const totalEl = document.getElementById('totalCarrito');
        if (!contenedor || !totalEl) return;

        if (this.carrito.length === 0) {
            contenedor.innerHTML = `<p class="text-muted text-center py-4">Tu carrito está vacío</p>`;
            totalEl.textContent = '$0.00';
            return;
        }

        contenedor.innerHTML = this.carrito.map(item => `
            <div class="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom">
                <img src="${item.imagen}" alt="${item.alt}" style="width:64px; height:64px; object-fit:cover; border-radius:12px;">
                <div class="flex-grow-1">
                    <p class="mb-1 fw-semibold">${item.nombre}</p>
                    <p class="mb-1 text-muted extra-small">${item.descripcion}</p>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="Cart.decrementar(${item.id})">-</button>
                        <span>${item.cantidad}</span>
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="Cart.incrementar(${item.id})">+</button>
                    </div>
                </div>
                <div class="text-end">
                    <p class="fw-bold mb-2">$${(item.precio * item.cantidad).toFixed(2)}</p>
                    <button class="btn btn-sm text-danger p-0" onclick="Cart.eliminarItem(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const total = this.carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
        totalEl.textContent = `$${total.toFixed(2)}`;
    }
}

// Inicialización de la clase
const Cart = new CartController();

// Cargar el carrito cuando cargue el documento
document.addEventListener('DOMContentLoaded', () => {
    Cart.cargarCarrito();
});





//////////////////////PRUEBA DE LOCALSTORAGE//////////////////////////
// class CartController {
//     constructor() {
//         this.carrito = JSON.parse(localStorage.getItem('miCarrito')) || [];
//     }

//     additem(id) {
//         const imgElement = document.getElementById(`imgprod${id}`);
//         const nameElement = document.getElementById(`nameprod${id}`);
//         const descElement = document.getElementById(`descprod${id}`);
//         const priceElement = document.getElementById(`priceprod${id}`);

//         const productoExistente = this.carrito.find(item => item.id === id);

//         if (productoExistente) {
//             productoExistente.cantidad++;
//             console.log(`Se aumentó la cantidad de ${productoExistente.nombre}. Total: ${productoExistente.cantidad}`);
//         } else {
//             const nuevoProducto = {
//                 id: id,
//                 imagen: imgElement ? imgElement.src : '',
//                 alt: imgElement ? imgElement.alt : '',
//                 nombre: nameElement ? nameElement.innerText : '',
//                 descripcion: descElement ? descElement.innerText : '',
//                 precio: priceElement ? parseFloat(priceElement.innerText.replace('$', '')) : 0,
//                 cantidad: 1,
//                 createdAt: new Date()
//             };

//             this.carrito.push(nuevoProducto);
//             console.log("Nuevo producto agregado al carrito:", nuevoProducto);
//         }
//         this.guardarYRenderizar();

//         const nombreProducto = nameElement ? nameElement.innerText : 'Producto';
//         console.log(`¡Se actualizó el carrito! ${nombreProducto} guardado.`);
//     }

//     incrementar(id) {
//         const item = this.carrito.find(p => p.id === id);
//         if (item) item.cantidad++;
//         this.guardarYRenderizar();
//     }

//     decrementar(id) {
//         const item = this.carrito.find(p => p.id === id);
//         if (item) {
//             item.cantidad--;
//             if (item.cantidad <= 0) {
//                 this.eliminarItem(id);
//                 return;
//             }
//         }
//         this.guardarYRenderizar();
//     }

//     eliminarItem(id) {
//         this.carrito = this.carrito.filter(p => p.id !== id);
//         this.guardarYRenderizar();
//     }

//     guardarYRenderizar() {
//         localStorage.setItem('miCarrito', JSON.stringify(this.carrito));
//         this.renderCarrito();
//     }

//     renderCarrito() {
//         const contenedor = document.getElementById('listaCarrito');
//         const totalEl = document.getElementById('totalCarrito');
//         if (!contenedor || !totalEl) return; // el modal aún no está inyectado

//         if (this.carrito.length === 0) {
//             contenedor.innerHTML = `<p class="text-muted text-center py-4">Tu carrito está vacío</p>`;
//             totalEl.textContent = '$0.00';
//             return;
//         }

//         contenedor.innerHTML = this.carrito.map(item => `
//             <div class="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom">
//                 <img src="${item.imagen}" alt="${item.alt}" style="width:64px; height:64px; object-fit:cover; border-radius:12px;">
//                 <div class="flex-grow-1">
//                     <p class="mb-1 fw-semibold">${item.nombre}</p>
//                     <p class="mb-1 text-muted extra-small">${item.descripcion}</p>
//                     <div class="d-flex align-items-center gap-2">
//                         <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="Cart.decrementar(${item.id})">-</button>
//                         <span>${item.cantidad}</span>
//                         <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="Cart.incrementar(${item.id})">+</button>
//                     </div>
//                 </div>
//                 <div class="text-end">
//                     <p class="fw-bold mb-2">$${(item.precio * item.cantidad).toFixed(2)}</p>
//                     <button class="btn btn-sm text-danger p-0" onclick="Cart.eliminarItem(${item.id})">
//                         <i class="bi bi-trash"></i>
//                     </button>
//                 </div>
//             </div>
//         `).join('');

//         const total = this.carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
//         totalEl.textContent = `$${total.toFixed(2)}`;
//     }
// }

// const Cart = new CartController();