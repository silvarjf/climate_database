/**
 * Created by silvarjf on 27/02/19.
 */

var express = require('express');
var addRequestId = require('express-request-id')();
var fs = require('fs');
var cmd = require("child_process").execSync;
var app = express();
var config = require('config');
var wgrib2 = config.get("wgrib2");
var userRequestsFolder = config.get('userRequestsFolder');

app.use(addRequestId);

if (fs.existsSync(userRequestsFolder)) {
	cmd("rm -rf " + userRequestsFolder)
}

fs.mkdirSync(userRequestsFolder);



app.get('/', function (req, res) {
	res.send('Hello World!');

	console.log(req.query.lat)

	// TODO: Consistência da chamada
	if (req.query.lat && req.query.lon && req.query.day) {
		console.log("nice")


		// TODO: Verificar se são limites ou datas certas
		var lat = req.query.lat
		var lon = req.query.lon
		var day = req.query.day

		// TODO: Converter a data pra uma lógica de abrir vários arquivos anuais
		/* TODO: Pra cada arquivo anual, colocar as expressões regulares (por mês se forem meses inteiros, por dias se não forem)
		 */
		// TODO: As coordenadas não são exatas. São -0.5*step:+0.5*step

		var command = wgrib2 + ' ../data/years/2019.grib2 -match "d=' + day + '" -undefine out-box ' + lon + ':' + lon + ' ' + lat + ':' + lat + ' -csv ' + userRequestsFolder + req.id + '.csv'
		console.log(command)

		cmd(command)

		// TODO: Juntar todos os arquivos e mandar pro usuário

	}

	console.log(req.id)
});

app.listen(3000, function () {
	console.log('Example app listening')
})