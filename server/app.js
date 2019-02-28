/**
 * Created by silvarjf on 27/02/19.
 */

var express = require('express');
var cmd = require("child_process").execSync;
var app = express();
var config = require('config')
var wgrib2 = config.get("wgrib2")

app.get('/', function (req, res) {
	res.send('Hello World!');

	console.log(JSON.parse(req.query))

	if (req.query.lat && req.query.lon && req.query.day) {
		console.log("nice")
		var lat = req.query.lat.min
		var lon = req.query.lon.min
		var day = req.query.day.min

		var command = ' ../data/years/2019.grib2 -match "d=' + day + '" -undefine out-box ' + lon + ':' + lon + ' ' + lat + ':' + lat + '-csv teste.csv'
		console.log(command)

		cmd(command)
	}

	console.log(req.query)
});

app.listen(3000, function () {
	console.log('Example app listening')
})