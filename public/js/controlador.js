
function modalRegistro(){
	$('#modalRegistro').modal('show');
}

function guardarUsuario(){
	let usuario = $('#userName').val();
	let correo = $('#email').val();
	let imagen = $('#image').val();
	let contrasenia = $('#password').val();
	let nuevoUsuario = {
		usuario, correo, imagen, contrasenia
	};
	let isValid = true;
	_.forEach(nuevoUsuario, campo => {
		if(_.isEmpty(campo)){
			isValid = false;
		}
	});
	if(isValid){
		$.ajax({
			url:'/crear-usuario',
			data: urlEncoded(nuevoUsuario),
			method:'POST',
			dataType:'json',
			success:function(respuesta){
				let mensaje = '';
				if (!_.isUndefined(respuesta.statusCode) && respuesta.statusCode == 200){
					mensaje = respuesta.message;
				}
				else{
					mensaje = 'Ocurrió un error al guardar usuario';
				}
				$('#modalRegistro').modal('hide');
				$('#mensaje').text(mensaje);
				$('#modalSuccess').modal('show');
			}
		});
	}
}

function login(){
	let correo = $('#emailToLogin').val();
	let contrasenia = $('#passwordToLogin').val();
	let usuario = {
		correo, contrasenia
	};
	let isValid = true;
	_.forEach(usuario, campo => {
		if(_.isEmpty(campo)){
			isValid = false;
		}
	});
	if(isValid){
		$.ajax({
			url:'/login',
			data: urlEncoded(usuario),
			method:'POST',
			dataType:'json',
			success:function(respuesta){
				let mensaje = '';
				if (!_.isUndefined(respuesta.statusCode) && respuesta.statusCode == 200){
					window.location.href ="home.html"
				}
				else{
					mensaje = 'Ocurrió un error al iniciar sesión';
				}
				$('#mensaje').text(mensaje);
				$('#modalSuccess').modal('show');
			}
		});
	}
}

function urlEncoded(object){
	let url = '';
	let flag = 0;
	_.forEach(object, (value, key) => {
		if(flag > 0){
			url += '&';
		}
		url += `${key}=${value}`;
		flag++
	});
	return url;
}