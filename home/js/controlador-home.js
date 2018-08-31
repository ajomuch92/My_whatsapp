$(document).ready(function(){
	obtenerContactos();
	$.ajax({
		url:"/obtener-usuario",
		dataType:"json",
		success:function(respuesta){
			let usuario = respuesta;
			$('#currentUser').text(usuario.nombre_usuario);
			$('#profilePicture').attr('src',usuario.url_imagen_perfil);
		}
	});
	cargarUsuariosDisponibles();
	setInterval(cargarConversacion, 15000);
	$('#conversationSection').hide();
});

function cargarUsuariosDisponibles(){
	$.ajax({
		url:"/obtener-usuarios",
		dataType:"json",
		success:function(respuesta){
			$('#users').html('');
			_.forEach(respuesta, elemento => {
				let option = `<option value='${elemento.codigo_usuario}'>${elemento.nombre_usuario}</option>`;
				$('#users').append(option);
			});
		}
	});
}

function obtenerContactos(){
	$('#div-contactos').html('');
	$.ajax({
		url:"/obtener-contactos",
		dataType:"json",
		success:function(respuesta){
			for(var i=0; i<respuesta.length; i++){
				$("#div-contactos").append(
					`<div class="row sideBar-body" onclick="seleccionarContacto(${respuesta[i].codigo_usuario},'${respuesta[i].nombre_usuario}','${respuesta[i].url_imagen_perfil}');">
						<div class="col-sm-3 col-xs-3 sideBar-avatar">
						<div class="avatar-icon">
							<img src="${respuesta[i].url_imagen_perfil}">
						</div>
						</div>
						<div class="col-sm-9 col-xs-9 sideBar-main">
						<div class="row">
							<div class="col-sm-8 col-xs-8 sideBar-name">
							<span class="name-meta">${respuesta[i].nombre_usuario}</span>
							</div>
							<div class="col-sm-4 col-xs-4 pull-right sideBar-time">
							<span class="time-meta pull-right">18:18
							</span>
							</div>
						</div>
						</div>
					</div>`
				);
			}
		}
	});
}

function seleccionarContacto(codigoContacto, nombreContacto, urlImagen){
	$("#usuario-receptor").val(codigoContacto);
	$("#nombre-contacto").html(nombreContacto);
	$("#imagen-contacto").attr("src",urlImagen);
	$('#conversationSection').show();
	cargarConversacion();
}

function cargarConversacion(){
	$.ajax({
		url:"/obtener-conversacion",
		method:"GET",
		data:"receptor="+$("#usuario-receptor").val(),
		dataType:"json",
		success:function(respuesta){
			$("#conversation").html("");
			for(var i=0; i<respuesta.length;i++){
				var cssClass=""; //sender
				if ($("#usuario-receptor").val() == respuesta[i].codigo_usuario_emisor)
					cssClass="receiver"; 
				else
					cssClass="sender"; 
				$("#conversation").append(
					`<div class="row message-body">
						<div class="col-sm-12 message-main-${cssClass}">
						<div class="${cssClass}">
							<div class="message-text">
							${replaceEmojis(respuesta[i].mensaje)}
							</div>
							<span class="message-time pull-right">
							${respuesta[i].hora_mensaje}
							</span>
						</div>
						</div>
					</div>`
				);
			}
		}
	});
}

function borrarConversacion(){
	$.ajax({
		url:"/borrar-conversacion",
		method:"GET",
		data:"receptor="+$("#usuario-receptor").val(),
		dataType:"json",
		success:function(respuesta){
			$("#conversation").html("");			
		}
	});
}

function agregarContacto(){
	$('#modalNuevoContacto').modal('show');
}

function logOut(){
	$.ajax({
		url:"/logout",
		dataType:"json",
		success:function(respuesta){
			if(!_.isUndefined(respuesta.statusCode) && respuesta.statusCode == 200){
				window.location.href ="/"
			}
		}
	})
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

function replaceEmojis(texto){
	let emojis = [
		{
			texto: ':)',
			imagen: 'img/emojis/emoji1.png'
		},
		{
			texto: 'XD',
			imagen: 'img/emojis/emoji2.png'
		},
		{
			texto: ':P',
			imagen: 'img/emojis/emoji3.png'
		},
		{
			texto: ':(',
			imagen: 'img/emojis/emoji4.png'
		},
		{
			texto: ':*',
			imagen: 'img/emojis/emoji5.png'
		},
		{
			texto: 'X_X',
			imagen: 'img/emojis/emoji6.png'
		},
		{
			texto: '|**|',
			imagen: 'img/emojis/emoji7.png'
		}
	];
	_.forEach(emojis, emoji => {
		texto = texto.replace(emoji.texto, `<img class="emoji" src=${emoji.imagen}>`)
	});
	return texto;
}

function guardarContacto(){
	let usuario = $('#users').val()
	$.ajax({
		url:"/crear-contacto",
		method:"POST",
		data:"codigo_usuario_contacto="+usuario,
		dataType:"json",
		success:function(respuesta){
			$('#modalNuevoContacto').modal('hide');	
			obtenerContactos();
			cargarUsuariosDisponibles();
		}
	});
}

$("#btn-enviar").click(function(){
let mensaje = $("#txta-mensaje").val();
let receptor = $("#usuario-receptor").val();
let nuevoMensaje = {
	mensaje, receptor
}
if(!_.isEmpty(mensaje)){
	$.ajax({
		url:"/enviar-mensaje",
		method:"POST",
		data:urlEncoded(nuevoMensaje),
		dataType:"json",
		success:function(respuesta){
			if (respuesta.affectedRows == 1){
				$("#conversation").append(
					`<div class="row message-body">
						<div class="col-sm-12 message-main-sender">
						<div class="sender">
							<div class="message-text">
							${replaceEmojis($("#txta-mensaje").val())}
							</div>
							<span class="message-time pull-right">
							18:18
							</span>
						</div>
						</div>
					</div>`
				);					
				$("#txta-mensaje").val(''); 
			}
		}
	});
}
});