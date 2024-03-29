const express = require('express');
const router = express.Router();
const fs = require("fs");
const HTMLparser = require('node-html-parser');

//revisa los tableros y crea la tabla.
router.get('/', function (req, res) {

    console.log("cargar listado de tableros");
    //Cargo Pagina base
    try {
        let data = fs.readFileSync("./paginasHTML/tableros.html")
        var root = HTMLparser.parse(data);

    } catch (err) {

        res.writeHead(404);
        res.write('No se pudo cargar la pagina');
        res.end();
        return;
    }

    //tabla a generar
    let tabla = '<table id="lista" class="tablesorter"><thead>';
    tabla += '<tr><th style="width: 150px;">TABLERO</th>'
    tabla += '<th>LINK</th>'
    tabla += '</tr></thead><tbody>'

    try {
        let tableros = fs.readFileSync("./data/General.json", 'utf8')
        tableros = JSON.parse(tableros);

        for (let tablero in tableros) {
            tabla += "<tr>";
            tabla += "<td>" + tablero.toString().slice(0, -2) + "</td>";
            tabla += "<td><button type='Button' onClick='verTablero(\"" + tablero.toString().slice(0, -2) + "\")'>Ver Tablero</button></td>";
            tabla += "</tr>";

        }
        tabla += "</tbody></table>";

    } catch (err) {
        tabla = "<h1>No se pudo cargar la tabla</h1>";

    }

    root.querySelector('#TableroSeleccionado').replaceWith(DESPLEGABLETABLERO);
    root.querySelector('#lista').replaceWith(tabla); //cargo la tabla en la pag

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(root.toString());

});

//Crea una nuevo tablero 
router.post('/', function (req, res) {

    let NuevoTableroNombre = eliminarDiacriticosEs(req.body.NuevoTableroNombre);

    NuevoTableroNombre = NuevoTableroNombre.toUpperCase();

    try {
        //cargo JSON general
        let data = fs.readFileSync("./data/General.json", 'utf8');
        var generalData = JSON.parse(data);

    } catch (err) {

        console.log(err);
        res.writeHead(500);
        res.end("Archivo general o de pendientes no encontrado");
        return;
    }

    if (generalData[NuevoTableroNombre + "ID"] !== undefined) {
        console.log("Tablero ya existente");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Tablero ya existente");
        return;
    }


    generalData[NuevoTableroNombre + "ID"] = 0;


    //creo la carpeta para guardar los archivos
    fs.mkdir("./data/" + NuevoTableroNombre, (err) => {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end("No se pudo crear la carpeta para los archivos");
            return;
        }
        fs.mkdir("./data/" + NuevoTableroNombre + "/files", (err) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("No se pudo crear la carpeta para los archivos");
                return;
            }
        });

        let plantilla = { "Tareas": [] };

        fs.writeFile("./data/" + NuevoTableroNombre + "/Finalizados.json", JSON.stringify(plantilla), function (err, result) {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("No se pudo Crear finalizados.json");
                return;
            }
        });

        fs.writeFile("./data/" + NuevoTableroNombre + "/Pendientes.json", JSON.stringify(plantilla), function (err, result) {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("No se pudo Crear pendientes.json");
                return;
            }
        });
        console.log("Carpetas creada y archivos creados");
    });

    //guardo el general actualizado
    fs.writeFile("./data/General.json", JSON.stringify(generalData), function (err, result) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end("No se pudo actualizar Archivo General");
            return;
        }

        DESPLEGABLETABLERO = crearDesplegable();
        TABLEROSELECCIONADO = NuevoTableroNombre;
        res.writeHead(200);
        res.end("Tarea cargada");
        console.log("Nueva tablero: " + NuevoTableroNombre);
    });
});

//cambia la seleccion del tablero 
router.post('/seleccion', function (req, res) {

    let tablero = req.query.tablero; //pasar el parametro como ?tablero=   
    tablero = tablero.toUpperCase();
    console.log("Cambiando al tablero: " + tablero)

    try {
        //cargo JSON general
        let data = fs.readFileSync("./data/General.json", 'utf8');
        var generalData = JSON.parse(data);

    } catch (err) {

        console.log(err);
        res.writeHead(500);
        res.end("Archivo general o de pendientes no encontrado");
        return;
    }

    if (generalData[tablero + "ID"] === undefined) {
        console.log("Tablero no existente");

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("Tablero ya existente");
        return;
    }

    TABLEROSELECCIONADO = tablero;
    DESPLEGABLETABLERO = crearDesplegable();

    res.writeHead(200);
    res.end("Tablero cambiado");
    console.log("Cambio Listo");

});

module.exports = router;

//elimina puntuacion
function eliminarDiacriticosEs(texto) {
    texto = texto.replace("ñ","ni")
    return texto
        .normalize('NFD')
        .replace(/([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi, "$1")
        .normalize();
}

function crearDesplegable() {

    try {
        let data = fs.readFileSync("./data/General.json", 'utf8')
        var tableros = JSON.parse(data);

    } catch (err) {
        return "<p>No se pudo cargar desplegable</p>";
    }

    let desplegable = "<select id='TableroSeleccionado'>"

    for (let tablero in tableros) {
        
        desplegable += "<option value='"+ tablero.toString().slice(0, -2)+ "'"
        if(tablero.toString().slice(0, -2) === TABLEROSELECCIONADO )desplegable += " selected";
        desplegable += ">" +tablero.toString().slice(0, -2)+"</option>"
        
    }
    desplegable += "</select>"
    
    return desplegable;
}