const express = require('express');
const router = express.Router();
const fs = require("fs");
const HTMLparser = require('node-html-parser');

//revisa las notas y crea la tabla.
router.get('/', function (req, res) {

    console.log("Cargar listado de notas");

    try {
        let pagina = fs.readFileSync("./paginasHTML/listaNotas.html");
        var root = HTMLparser.parse(pagina); //Pagina base

    } catch (err) {
        res.writeHead(404);
        res.write('No se pudo cargar la pagina');
        res.end();
        return;
    }

    try {
        const data = fs.readFileSync("./data/Notas.json", 'utf8');
        const notas = JSON.parse(data)

        var tabla = generarTabla(notas);

    } catch (err) {
        var tabla = "<h1>No se pudo cargar la tabla</h1>";
        var fechas = "<div></div>"
    }

    root.querySelector('#lista').replaceWith(tabla); //cargo la tabla en la pag
    
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(root.toString());

});

//Crea nueva nota
router.post('/', function (req, res) {

    console.log("Nueva nota");

    try {
        let data = fs.readFileSync("./data/Notas.json", 'utf8');
        var notas = JSON.parse(data)

    } catch (err) {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("No se pudo cargar la base de datos");
        return;
    }

    notas.descripcion.push(eliminarDiacriticosEs(req.body.descripcion));
    notas.estado.push("Pendiente");
    notas.recordatorio.push("-");

    try {
        fs.writeFileSync("./data/Notas.json", JSON.stringify(notas));

    } catch (err) {

        console.log("Error al guardar la nota");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Error al guardar el registro");
        return;
    }

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end();
});

//cambia a terminada una nota
router.patch('/', function (req, res) {

    const indice = req.query.indice;//pasar el parametro como ?indice=1
    console.log("Actualizando nota " + indice);

    try {
        let data = fs.readFileSync("./data/Notas.json", 'utf8');
        var notas = JSON.parse(data)

    } catch (err) {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("No se pudo cargar la base de datos");
        return;
    }

    notas.estado[indice] = "Terminada";
    notas.recordatorio[indice] = "-";

    try {
        fs.writeFileSync("./data/Notas.json", JSON.stringify(notas));

    } catch (err) {

        console.log("Error al guardar el registro");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Error al guardar el registro");
        return;
    }

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end();
});

//revisa los pendientes y elimina ya pasaron hace mas de 15 dias
router.delete('/', function (req, res) {

    console.log("Eliminando tareas viejas");

    try {
        let data = fs.readFileSync("./data/Diario.json", 'utf8');
        var tareas = JSON.parse(data)

    } catch (err) {
        res.writeHead(404);
        res.write('No se pudo cargar el listado diario');
        res.end();
        return;
    }

    const hoy = new Date();

    for (let i = 0; i < tareas.fecha.length; i++) {

        let fecha = tareas.fecha[i].split("-")
        fecha = new Date(fecha[2], fecha[1] - 1, fecha[0]);
        let difference = (hoy - fecha) / (1000 * 3600 * 24);

        if (difference > 15) {

            tareas.fecha.splice(i, 1);
            tareas.descripcion.splice(i, 1);
            tareas.ids.splice(i, 1);
            tareas.tablero.splice(i, 1);
            tareas.estado.splice(i, 1);

            i--;
        }
    }
    try {
        fs.writeFileSync("./data/Diario.json", JSON.stringify(tareas));

    } catch (err) {
        console.log(err);
        res.writeHead(503);
        res.end("No se pudo actualizar listado diario");
        return;
    }

    console.log("Se eliminaron los registros con mas de 15 dias de antiguedad")
    res.writeHead(200);
    res.end();
});

//agrega nuevas tareas (en array) a la fecha pasada
router.post('/tarea', function (req, res) {

    let fecha = req.query.fecha  //pasar el parametro como ?fecha=1
    console.log("Nueva tarea para el dia de " + fecha);

    try {
        let data = fs.readFileSync("./data/Diario.json", 'utf8');
        var tareas = JSON.parse(data)

    } catch (err) {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("No se pudo cargar la base de datos");
        return;
    }

    const indice = tareas.fecha.indexOf(fecha);

    if (indice === -1) {
        console.log("Error en la fecha pasada");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Error en la fecha pasada");
        return;
    }

    for (let i = 0; i < req.body.descripcion.length; i++) {
        tareas.descripcion[indice].push(eliminarDiacriticosEs(req.body.descripcion[i]));
        tareas.ids[indice].push(req.body.ids[i]);
        tareas.tablero[indice].push(req.body.tablero[i]);
        tareas.estado[indice].push(req.body.estado[i]);
    }

    try {
        fs.writeFileSync("./data/Diario.json", JSON.stringify(tareas));

    } catch (err) {

        console.log("Error al guardar el registro");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Error al guardar el registro");
        return;
    }

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end();
});



//devuelvo json con las tareas segun la fecha pasada
router.get('/tarea', function (req, res) {

    let fecha = req.query.fecha  //pasar el parametro como ?fecha=1
    let terminados = req.query.terminados === "true"  //pasar el parametro como ?terminados=false si no quiero los terminados

    console.log("obtengo registro de tareas de " + fecha + (terminados ? " con " : " sin ") + "termiandos");

    try {
        let data = fs.readFileSync("./data/Diario.json", 'utf8');
        var tareas = JSON.parse(data)

    } catch (err) {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("No se pudo cargar la base de datos");
        return;
    }

    const indice = tareas.fecha.indexOf(fecha);

    if (indice === -1) {
        console.log("Error en la fecha pasada");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Error en la fecha pasada");
        return;
    }

    let lista = { "descripcion": [], "ids": [], "tablero": [], "estado": [] }

    for (let i = 0; i < tareas.descripcion[indice].length; i++) {

        if (!terminados && tareas.estado[indice][i] === "Terminada") continue;

        lista.descripcion.push(tareas.descripcion[indice][i]);
        lista.ids.push(tareas.ids[indice][i]);
        lista.tablero.push(tareas.tablero[indice][i]);
        lista.estado.push(tareas.estado[indice][i]);
    }

    res.writeHead(200);
    res.end(JSON.stringify(lista));
});


module.exports = router;

//maneja la generacion de tabla
function generarTabla(notas) {

    var tabla = '<table id="lista" class="tablesorter"><thead>';
    tabla += '<th>DESCRIPCION</th>';
    tabla += '<th style="width: 90px;">ESTADO</th>';
    tabla += '<th style="width: 0px;">*</th>';
    tabla += '<th style="width: 150px;">RECORDATORIO</th>';
    tabla += '</thead><tbody>'

    let descripcion = notas.descripcion;
    let estado = notas.estado;
    let recordatorio = notas.recordatorio;

    for (let i = 0; i < descripcion.length; i++) {
        tabla += "<tr>";
        tabla += "<td>" + descripcion[i] + "</td>";
        tabla += "<td>" + estado[i] + "</td>";

        if (estado[i] === "Pendiente") tabla += "<td><button type='Button' onClick='marcarNotaTerminada(" + i + ")'>Ok!</button></td>";
        else tabla += "<td>.</td>";

        tabla += "<td>" + recordatorio[i] + "</td>";
        tabla += "</tr>";

    };
    tabla += "</tbody></table>";

    return tabla;
}

//elimina puntuacion
function eliminarDiacriticosEs(texto) {
    texto = texto.replace("ñ","ni")
    return texto
        .normalize('NFD')
        .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi, "$1")
        .normalize();
}