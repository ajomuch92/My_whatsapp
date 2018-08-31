var express  = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
var app = express();
const _ = require('lodash');

var credenciales = {
    user:'root',
    password:'',
    port:'3306',
    host:'localhost',
    database:'db_whatsapp'
};

app.use(express.static('public')); //Middlewares
// app.use(express.static('home'));
app.use(session({secret:'Ell@NoMeAm@123',resave:true, saveUninitialized:true})); //Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
//app.use(express.urlencoded({extended:true}));

const home = express.static('home');
app.use(
    function(request, response, next){
        if (!_.isUndefined(request.session.usuario)){
            home(request, response, next);
        }
        else
            return next();
    }
);

app.get('/obtener-contactos', function(request, response){
    var conexion = mysql.createConnection(credenciales);
    let usuario = request.session.usuario;
    let id = usuario.codigo_usuario;
    var sql = `SELECT codigo_usuario, nombre_usuario, correo, url_imagen_perfil 
                FROM tbl_usuarios 
                WHERE codigo_usuario IN 
                (SELECT codigo_usuario_contacto FROM tbl_contactos WHERE codigo_usuario = ${id}
                    UNION
                    SELECT codigo_usuario FROM tbl_contactos WHERE codigo_usuario_contacto=${id}
                )`;
    var usuarios = [];
    conexion.query(sql)
    .on('result', function(resultado){
        usuarios.push(resultado);
    })
    .on('end',function(){
        response.send(usuarios);
    });   
});

app.get("/obtener-usuarios", function(request, response){
    var conexion = mysql.createConnection(credenciales);
    let usuario = request.session.usuario;
    var sql = `SELECT codigo_usuario, nombre_usuario, correo, url_imagen_perfil FROM tbl_usuarios 
                WHERE codigo_usuario NOT IN 
                (SELECT codigo_usuario_contacto FROM tbl_contactos WHERE codigo_usuario = ${usuario.codigo_usuario}) 
                AND codigo_usuario != ${usuario.codigo_usuario}`;
    var usuarios = [];
    conexion.query(sql)
    .on("result", function(resultado){
        usuarios.push(resultado);
    })
    .on("end",function(){
        response.send(usuarios);
    });   
});

app.get('/obtener-usuario', function(request, response){
    response.send(request.session.usuario);  
});

app.get('/obtener-conversacion',function(request, response){
    var conexion = mysql.createConnection(credenciales);
    var sql =   `SELECT a.*, b.nombre_usuario AS nombre_usuario_emisor,
                    c.nombre_usuario AS nombre_usuario_receptor
                FROM tbl_mensajes a
                INNER JOIN tbl_usuarios b
                on (a.codigo_usuario_emisor = b.codigo_usuario)
                INNER JOIN tbl_usuarios c
                on (a.codigo_usuario_receptor = c.codigo_usuario)
                WHERE (codigo_usuario_emisor = ? AND codigo_usuario_receptor = ?)
                OR (codigo_usuario_emisor = ? AND codigo_usuario_receptor = ?)`;
    var conversacion = [];
    let usuario = request.session.usuario
    conexion.query(sql, 
                    [
                        usuario.codigo_usuario,
                        request.query.receptor,
                        request.query.receptor,
                        usuario.codigo_usuario
                    ])
    .on('result', function(resultado){
        conversacion.push(resultado);
    })
    .on('end',function(){
        response.send(conversacion);
    });   
});

app.get('/borrar-conversacion', (request, response) => {
    var conexion = mysql.createConnection(credenciales);
    var sql =   `DELETE FROM tbl_mensajes 
                WHERE (codigo_usuario_emisor = ? AND codigo_usuario_receptor = ?)
                OR (codigo_usuario_emisor = ? AND codigo_usuario_receptor = ?)`;
    let usuario = request.session.usuario;
    conexion.query(sql, 
        [
            usuario.codigo_usuario,
            request.query.receptor,
            request.query.receptor,
            usuario.codigo_usuario
        ])
    .on('end',function(){
        response.send({statusCode: 200, message: 'Conversación borrada con éxito'});
    });  
});

app.post('/enviar-mensaje', function(request, response){
    var conexion = mysql.createConnection(credenciales);
    let usuario = request.session.usuario;
    var sql = 'INSERT INTO tbl_mensajes(codigo_usuario_emisor, codigo_usuario_receptor, mensaje, hora_mensaje) VALUES (?,?,?,?)';
    let date = new Date();
    var minutes = date.getMinutes();
    var hour = date.getHours();
    conexion.query(
        sql,
        [usuario.codigo_usuario, request.body.receptor, request.body.mensaje,`${hour}:${minutes}`],
        function(err, result){
            if (err) throw err;
            response.send(result);
        }
    ); 
});

app.post('/crear-usuario', (request, response) => {
    const conexion = mysql.createConnection(credenciales);
    let body = request.body;
    let sql = 'INSERT INTO tbl_usuarios(nombre_usuario, correo, contrasena, url_imagen_perfil) VALUES (? ,? ,sha1(?) ,? );';
    conexion.query(
        sql,
        [body.usuario, body.correo, body.contrasenia, body.imagen],
        function(err, result){
            if (err) throw err;
            response.send({statusCode: 200, message: 'Usuario registrado con éxito'});
        }
    ); 
});

app.post('/crear-contacto', (request, response) => {
    const conexion = mysql.createConnection(credenciales);
    let usuario = request.session.usuario;
    let body = request.body;
    let sql = 'INSERT INTO tbl_contactos(codigo_usuario, codigo_usuario_contacto) VALUES (?,?);';
    conexion.query(
        sql,
        [usuario.codigo_usuario, body.codigo_usuario_contacto],
        function(err, result){
            if (err) throw err;
            response.send({statusCode: 200, message: 'Contacto registrado con éxito', result});
        }
    ); 
});

app.post('/login', (request, response) => {
    const conexion = mysql.createConnection(credenciales);
    let body = request.body;
    let sql = `SELECT codigo_usuario, nombre_usuario, correo, url_imagen_perfil 
                FROM tbl_usuarios 
                WHERE correo = ? AND contrasena = sha1(?);`;
    conexion.query(
        sql,
        [body.correo, body.contrasenia],
        function(err, result){
            if (err) throw err;
            if (!_.isEmpty(result)){
                request.session.usuario = result[0];
                response.send({statusCode: 200, message: 'Login exitoso'});
            } else {
                response.send({statusCode: 400, message: 'Fallo en login'});
            }
        }
    ); 
});

app.get('/logout',function(request, response){
	request.session.destroy();
	response.send({statusCode: 200, message: 'Sesion eliminada'});
});

app.listen(3333);