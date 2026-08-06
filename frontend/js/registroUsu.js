function togglePasswordVista(){
    // le llamamos vision a la variable del icono del toggle-password
    const vision = document.getElementById('password');
    const visionCerrada = document.getElementById('ojo');
    if(vision.type === "password"){
        vision.type = "text"
        ojo.src="../assets/imagenes/iconos/eye-slash-solid.png"
    }else{
        vision.type = "password"
        ojo.src="../assets/imagenes/iconos/eye-solid.png"
    }

}