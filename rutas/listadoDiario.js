const express = require('express');
const router = express.Router();
const fs = require("fs");
const HTMLparser = require('node-html-parser');

//revisa los pendientes para hoy y crea la tabla.
router.get('/', function (req, res) {

    let fecha = req.query.fecha  //pasar el parametro como ?fecha=1
    console.log("Cargar listado del dia de " + fecha);

    try {
        let pagina = fs.readFileSync("./paginasHTML/listadoDiario.html");
        var root = HTMLparser.parse(pagina); //Pagina base

    } catch (err) {
        res.writeHead(404);
        res.write('No se pudo cargar la pagina');
        res.end();
        return;
    }

    try {
        const data = fs.readFileSync("./data/Diario.json", 'utf8');
        const tareas = JSON.parse(data)

        if (fecha === "hoy") {
            const date = new Date();
            fecha = date.getDate() + "-" + (1 + date.getMonth()) + "-" + date.getFullYear();
        }
        var tabla = generarTabla(tareas, fecha);

        var fechas = "";
        for (let i = 0; i < tareas.fecha.length && i < 10; i++) {

            fechas += '<a href="/listadoDiario?fecha=';
            fechas += tareas.fecha[i] + '"style="margin: 0 5px;">'
            fechas += tareas.fecha[i] + '</a>';
        }

    } catch (err) {
        var tabla = "<h1>No se pudo cargar la tabla</h1>";
        var fechas = "<div></div>"
    }

    root.querySelector('#lista').replaceWith(tabla); //cargo la tabla en la pag
    root.querySelector('#fecha').replaceWith("<p id='fecha'>" + fecha + "</p>"); //cargo la fecha de la tabla en la pag

    root.querySelector('#linksFechas').replaceWith(fechas); //cargo los link con las fechas en la pag

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(root.toString());

});

//Crea nuevo registro de fecha
router.post('/', function (req, res) {

    let fecha = req.query.fecha  //pasar el parametro como ?fecha=1
    console.log("Nuevo registro para el dia " + fecha);

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
        tareas.fecha.unshift(fecha);
        tareas.descripcion.unshift([]);
        tareas.ids.unshift([]);
        tareas.estado.unshift([]);
    }else{
        console.log("El registro para esa fecha ya existe");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Ya existe esa fecha");
        return;
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

//agrega nueva tarea a la fecha pasada
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

    tareas.descripcion[indice].push(eliminarDiacriticosEs(req.body.descripcion));
    tareas.ids[indice].push(req.body.ids);
    tareas.estado[indice].push("Pendiente");

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


module.exports = router;

//maneja la generacion de tabla
function generarTabla(tareas, fecha) {

    const fechaIndice = tareas.fecha.indexOf(fecha);

    if (fechaIndice > -1) {

        var tabla = '<table id="lista" class="tablesorter"><thead>';
        tabla += '<th style="width: 90px;">ESTADO</th>';
        tabla += '<th style="width: 70px;">VER TAREA</th>';
        tabla += '<th>DESCRIPCION</th>';
        tabla += '</thead><tbody>'

        let descripcion = tareas.descripcion[fechaIndice];
        let ids = tareas.ids[fechaIndice];
        let estado = tareas.estado[fechaIndice];

        for (let i = 0; i < descripcion.length; i++) {
            tabla += "<tr>";
            tabla += "<td>" + estado[i] + "</td>";
            tabla += "<td><a href='/tarea?id=";
            tabla += ids[i];
            tabla += "'>" + ids[i] + "</a></td>";
            tabla += "<td>" + descripcion[i] + "</td>";
            tabla += "</tr>";

        };
        tabla += "</tbody></table>";

    } else {
        var tabla = "<h3>No se planifico tareas</h3>";
    }
    return tabla;
}

//elimina puntuacion
function eliminarDiacriticosEs(texto) {
    return texto
        .normalize('NFD')
        .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi, "$1")
        .normalize();
}