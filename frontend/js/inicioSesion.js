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
document.getElementById('login-form').addEventListener('submit',function(e){
    e.preventDefault();
    const email = document.getElementById('email').value;
    const contraseña = document.getElementById('password').value;

    const nuevoUsuario = {
        email : email,
        contraseña : contraseña
    }
    const usuariosGuardados = JSON.parse(localStorage.getItem('usuariosBienvenidos')) || [];
    usuariosGuardados.push(nuevoUsuario);
    localStorage.setItem('usuariosBienvenidos', JSON.stringify(usuariosGuardados));
    document.getElementById('login-form').reset();
});