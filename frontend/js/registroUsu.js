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

//Confirmar contraseña
function toggleConfirmPasswordVista(){
    const visionConfirm = document.getElementById('passwordConfirm');
    const visionCerradaConfirm = document.getElementById('ojoConfirm');
    if(visionConfirm.type === "password"){
        visionConfirm.type = "text"
        visionCerradaConfirm.src="../assets/imagenes/iconos/eye-slash-solid.png"
    }else{
        visionConfirm.type = "password"
        visionCerradaConfirm.src="../assets/imagenes/iconos/eye-solid.png"
    }
}

document.getElementById('registroForm').addEventListener('submit',function(e){
    e.preventDefault();
    const nombre = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('phone').value.trim();
    const contraseña = document.getElementById('password').value;
    const confirmContraseña = document.getElementById('passwordConfirm').value;

    if(contraseña !== confirmContraseña){
    alert('Las contraseñas no coinciden');
    return false;
  }

    const nuevoUsuario = {
        nombre : nombre,
        email : email,
        telefono : telefono
    }
    const usuariosGuardados = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];
    usuariosGuardados.push(nuevoUsuario);
    localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosGuardados));
    alert("Usuario registrado con éxito.")
    document.getElementById('registroForm').reset();
});