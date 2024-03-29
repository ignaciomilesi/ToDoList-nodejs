const express = require('express');
const router = express.Router();
const fs = require("fs");
const HTMLparser = require('node-html-parser');


//Crea una nueva tarea pendiente en el general 
router.post('/', function (req, res) {
    const tablero = TABLEROSELECCIONADO
    try {
        //cargo JSON general
        let data = fs.readFileSync("./data/General.json", 'utf8');
        var generalData = JSON.parse(data);

        data = fs.readFileSync("./data/" + tablero + "/Pendientes.json", 'utf8');
        var pendientes = JSON.parse(data);

    } catch (err) {

        console.log(err);
        res.writeHead(500);
        res.end("Archivo general o de pendientes no encontrado");
        return;
    }

    let dataParcial = {};

    dataParcial.id = ++generalData[tablero + "ID"]; //coloco id actualizado

    //elimino acentos en titulo y estado
    dataParcial.titulo = eliminarDiacriticosEs(req.body.titulo);
    dataParcial.estado = eliminarDiacriticosEs(req.body.estado);

    //paso la importancia y prioridad como un booleano
    dataParcial.importante = (req.body.importante === "false") ? false : true;
    dataParcial.prioritario = (req.body.prioritario === "false") ? false : true;

    //lo guardo esta parte dentro del general
    pendientes.Tareas.push(dataParcial);

    //guardo JSON Pendientes actualizado
    fs.writeFile("./data/" + tablero + "/Pendientes.json", JSON.stringify(pendientes), function (err, result) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end("No se pudo actualizar Pendientes");
            return;
        }
    });

    let dataCompleta = JSON.parse(JSON.stringify(dataParcial))

    //registro tablero
    dataCompleta.tablero = tablero;

    //registro recordatorio
    dataCompleta.recordatorio = "No se cargo ningun recordatorio aun";

    //elimino acentos en descripcion
    dataCompleta.descripcion = eliminarDiacriticosEs(req.body.descripcion);

    // registro fecha
    let date = new Date();
    dataCompleta.fecha = [date.getDate() + "-" + (1 + date.getMonth()) + "-" + date.getFullYear()];

    // registro avance
    dataCompleta.avance = ["Tarea registrada"];

    // Agrego campo para registrar los archivos
    dataCompleta.files = []

    //creo la carpeta para guardar los archivos
    fs.mkdir("./data/" + tablero + "/files/" + dataParcial.id, (err) => {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end("No se pudo crear la carpeta para los archivos");
            return;
        }
        console.log("Carpeta creada");
        fs.writeFile("./data/" + tablero + "/files/" + dataCompleta.id + "/data.json", JSON.stringify(dataCompleta), function (err, result) {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("No se pudo Crear el data del item");
                return;
            }
        });

    });

    //guardo el id actualizado
    fs.writeFile("./data/General.json", JSON.stringify(generalData), function (err, result) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end("No se pudo actualizar Archivo General");
            return;
        }
        //actualizo la tabla

        res.writeHead(200);
        res.end("Tarea cargada");

        console.log("Nueva tarea: " + JSON.stringify(req.body));
    });
});

//busca el id pasado y muestra el detalle de la tarea
router.get('/', function (req, res) {

    const tablero = req.query.tablero; //pasar el parametro como ?tablero=
    const id = parseInt(req.query.id, 10); //pasar el parametro como ?id=1
    console.log("Ver tarea " + id + " del tablero " + tablero);

    try {

        let data = fs.readFileSync("./paginasHTML/tarea.html");
        var root = HTMLparser.parse(data); //Parse la pagina
    } catch (err) {

        res.writeHead(404);
        res.write('No se pudo cargar la pagina');
        res.end();
        return;
    }

    try {

        let general = fs.readFileSync("./data/" + tablero + "/files/" + id + "/data.json", 'utf8');
        var tarea = JSON.parse(general);

    } catch (err) {
        root = "<h1>No se pudo cargar registro</h1>";
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(root.toString());
        return;
    }

    if (tarea.recordatorio.toString().slice(0, 2) === "No") root.querySelector("#ultimoRecordatorio").set_content(tarea.recordatorio.toString());
    else root.querySelector("#ultimoRecordatorio").set_content("Recordatorio cargado para el " + tarea.recordatorio.toString());
    if (tarea.estado.toString() === "Finalizado") root.querySelector("#botonTareaTerminada").replaceWith("");

    root.querySelector("#tablero").set_content(tarea.tablero.toString());
    root.querySelector("#id").set_content(tarea.id.toString());
    root.querySelector("#titulo").set_content(tarea.titulo.toString());
    root.querySelector("#estado").set_content(tarea.estado.toString().split("#")[0]);
    root.querySelector("#descripcion").set_content(tarea.descripcion.toString());
    if (tarea.importante) root.querySelector("#importante").setAttribute("checked", "");
    if (tarea.prioritario) root.querySelector("#prioritario").setAttribute("checked", "");

    for (let i = 0; i < tarea.avance.length; i++) {
        let nuevoAvance = '<div id = "' + i + '">';
        nuevoAvance += '<span>' + tarea.fecha[i] + '</span>';
        nuevoAvance += '<span>&nbsp; - &nbsp;</span>';
        nuevoAvance += '<span>' + tarea.avance[i] + '</span>';
        nuevoAvance += '</div>'

        nuevoAvance = HTMLparser.parse(nuevoAvance);
        root.querySelector("#avances").appendChild(nuevoAvance);
    }

    for (let i = 0; i < tarea.files.length; i++) {
        let nuevoFile;
        if (tarea.files[i].slice(-3) === "msg") {

            nuevoFile = ' <p></p><a href="';
            nuevoFile += tarea.files[i].slice(7);//para eliminar el ./data/files/;
            nuevoFile += '.pdf" target="_blank">';
            nuevoFile += tarea.files[i].slice(25) + '</a>';

            nuevoFile += ' <spam>.-----------.</spam><a href="';
            nuevoFile += tarea.files[i].slice(7);//para eliminar el ./data/files/;
            nuevoFile += '" target="_blank">';
            nuevoFile += 'Descargar Mail</a>';
        } else {

            nuevoFile = ' <p></p><a href="';
            nuevoFile += tarea.files[i].slice(7);//para eliminar el ./data/files/;
            nuevoFile += '" target="_blank">';
            nuevoFile += tarea.files[i].slice(25) + '</a>';
        }
        nuevoFile = HTMLparser.parse(nuevoFile);
        root.querySelector("#files").appendChild(nuevoFile);
    }

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(root.toString());
});

//Agrega avance con fecha de hoy o actualiza estado o descripcion o agrega ruta del archivo pasado del id pasado
router.patch('/', function (req, res) {

    const tablero = req.query.tablero; //pasar el parametro como ?tablero=
    const id = parseInt(req.query.id, 10); //pasar el parametro como ?id=1


    try {
        let general = fs.readFileSync("./data/" + tablero + "/files/" + id + "/data.json", 'utf8');
        var tarea = JSON.parse(general);
    } catch (err) {

        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("No se pudo cargar la base de datos");
        return;

    }

    switch (req.body.objetivo) {

        //actualizo descripcion
        case 'descripcion':
            console.log("Actualizar Descripcion");
            tarea.descripcion = eliminarDiacriticosEs(req.body.valor);
            break;

        //indico para cuando cargue un recordatorio
        case 'recordatorio':
            console.log("Actualizo fecha del ultimo recordatorio");
            tarea.recordatorio = req.body.valor;
            break;

        //agrego nuevo avance
        case 'avance':
            console.log("Agregar Avance");
            let date = new Date();
            let fechaDeAvance = date.getDate() + "-" + (1 + date.getMonth()) + "-" + date.getFullYear();
            tarea.fecha.push(fechaDeAvance);
            tarea.avance.push(eliminarDiacriticosEs(req.body.valor));

            req.body.valor = [req.body.valor, tarea.importante.toString(), tarea.prioritario.toString()];

            req.body.valor[0] = req.body.valor[0] + " # " + fechaDeAvance;
            //break; lo elimino para que actualice el estado tambien

        //actualizo estado
        case 'estado':

            console.log("Actualizar Estado");
            //actualizo la data
            tarea.estado = eliminarDiacriticosEs(req.body.valor[0]);
            tarea.importante = (req.body.valor[1] === 'true');
            tarea.prioritario = (req.body.valor[2] === 'true');


            try {

                let general = fs.readFileSync("./data/" + tablero + "/Pendientes.json", 'utf8');
                var pendientes = JSON.parse(general);

            } catch (err) {
                console.log("No se pudo cargar archivo general");
                break;
            }
            //actualizo el general
            const tareaIndice = pendientes.Tareas.map(pendiente => pendiente.id).indexOf(id);
            pendientes.Tareas[tareaIndice].estado = eliminarDiacriticosEs(req.body.valor[0]);
            pendientes.Tareas[tareaIndice].importante = (req.body.valor[1] === 'true');
            pendientes.Tareas[tareaIndice].prioritario = (req.body.valor[2] === 'true');

            //guardo el archivo general
            fs.writeFile("./data/" + tablero + "/Pendientes.json", JSON.stringify(pendientes), function (err, result) {

                if (err) {
                    console.log("No se pudo guardar el archivo general");
                }
            });

            break;

        //actualizo files
        case 'files':
            console.log("Actualizar Files");
            tarea.files.push(req.body.valor);
            break;

        default:
            console.log("Por aca no paso");
            console.log(req.body);
            break;
    }

    //actualizo el archivo de dato
    fs.writeFile("./data/" + tablero + "/files/" + id + "/data.json", JSON.stringify(tarea), function (err, result) {

        if (err) {
            console.log(err);
            res.writeHead(503);
            res.end("No se pudo actualizar data de id" + id);
            return;
        }

        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end("Avance registrado");
    });
});

//Mueve a finalizados
router.put('/finalizada', function (req, res) {

    const tablero = req.query.tablero; //pasar el parametro como ?tablero=
    const id = parseInt(req.query.id, 10); //pasar el parametro como ?id=1
    console.log("Pidiendo tarea " + id + " del tablero " + tablero + " marcar finalizada")

    try {
        let data = fs.readFileSync("./data/" + tablero + "/files/" + id + "/data.json", 'utf8')
        var tarea = JSON.parse(data);
        console.log("Se cargo data-tarea")

        let general = fs.readFileSync("./data/" + tablero + "/Pendientes.json", 'utf8')
        var ArchivoPendientes = JSON.parse(general);
        console.log("Se cargo pendientes")

        let finalizados = fs.readFileSync("./data/" + tablero + "/Finalizados.json", 'utf8')
        var ArchivoFinalizados = JSON.parse(finalizados);
        console.log("Se cargo finalizados")

    } catch (err) {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(503);
        res.end("No se pudo cargar la base de datos");
        return;
    }

    //obtengo el indice de la tarea en el general
    const tareaIndice = ArchivoPendientes.Tareas.map(pendiente => pendiente.id).indexOf(id);

    if (tareaIndice === -1) {
        console.log("No se encuentra en Pendientes");
    } else {
        //Coloco como estado finalizado y muevo la tarea
        ArchivoPendientes.Tareas[tareaIndice].estado = "Finalizado";
        ArchivoFinalizados.Tareas.push(ArchivoPendientes.Tareas[tareaIndice]);
        ArchivoPendientes.Tareas.splice(tareaIndice, 1);
    }
    //modifico data-tarea
    tarea.estado = "Finalizado";
    const date = new Date();
    tarea.fecha.push(date.getDate() + "-" + (1 + date.getMonth()) + "-" + date.getFullYear());
    tarea.avance.push("Se dio por finalizada");

    //actualizo data
    try {
        fs.writeFileSync("./data/" + tablero + "/files/" + id + "/data.json", JSON.stringify(tarea));

    } catch (err) {
        console.log(err);
        res.writeHead(503);
        res.end("No se pudo actualizar Data-Tarea");
        return;
    }

    //actualizo finalizados
    try {
        fs.writeFileSync("./data/" + tablero + "/Finalizados.json", JSON.stringify(ArchivoFinalizados));

    } catch (err) {
        console.log(err);
        res.writeHead(503);
        res.end("No se pudo actualizar Finalizados");
        return;
    }

    //actualizo el archivo pendientes
    try {
        fs.writeFileSync("./data/" + tablero + "/Pendientes.json", JSON.stringify(ArchivoPendientes));

    } catch (err) {
        console.log(err);
        res.writeHead(503);
        res.end("No se pudo actualizar Archivo General, pero se actualizo finalizados");
        return;
    }

    console.log("Registrada tareas " + id + " finalizada")
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end("Finalizado registrado");
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