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
})
