//Extracción desde el DOM
function additem(id) {
    // 1. Seleccionar los elementos del DOM usando el ID dinámico
    const imgElement = document.getElementById(`imgprod${id}`);
    const nameElement = document.getElementById(`nameprod${id}`);
    const descElement = document.getElementById(`descprod${id}`);
    const priceElement = document.getElementById(`priceprod${id}`);

    // Extraer los datos de los elementos
    const producto = {
        id: id,
        // obtención de URL de la imagen y el texto alternativo
        imagen: imgElement ? imgElement.src : '', 
        alt: imgElement ? imgElement.alt : '',
        // obtener el texto visible dentro de las etiquetas
        nombre: nameElement ? nameElement.innerText : '',
        descripcion: descElement ? descElement.innerText : '',
        // Limpiamos el texto del precio
        precio: priceElement ? parseFloat(priceElement.innerText.replace('$', '')) : 0
    };

    console.log("Producto extraído con éxito:", producto);
    
}
