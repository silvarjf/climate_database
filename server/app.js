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
var stepLat = config.get("stepLat");
var stepLon = config.get("stepLon");
var dataFinalFolder = config.get("dataFinalFolder");
var listeningPort = config.get("listeningPort");
app.use(addRequestId);

if (fs.existsSync(userRequestsFolder)) {
	cmd("rm -rf " + userRequestsFolder)
}

fs.mkdirSync(userRequestsFolder);



app.get('/', function (req, res) {

	console.log('Get Request Received - '  + req.id)


	if (req.query.lat && req.query.lon && req.query.day) {
		console.log("Parameters Received - " + req.id)


		/*
		             Parsing Latitude
		 */
		if (!isNaN(req.query.lat)) {

			var lat = parseFloat(req.query.lat)
			var stringLat = (lat - stepLat/2) + ":" + (lat + stepLat/2)



		} else if (Array.isArray(req.query.lat) && req.query.lat.length == 2 &&
			!isNaN(req.query.lat[0]) && !isNaN(req.query.lat[1])) {


			var lat1 = parseFloat(req.query.lat[0])
			var lat2 = parseFloat(req.query.lat[1])

			if (lat1 < lat2) {
				var stringLat = (lat1 - stepLat/2) + ':' + (lat2 + stepLat/2)
			} else {
				var stringLat = (lat2 - stepLat/2) + ':' + (lat1 + stepLat/2)
			}



		} else {
			console.log('Latitude must be a numeric list of length <= 2 - ' + req.id)
			res.send('Latitude must be a numeric list of length <= 2')
			return
		}

		console.log('Latitude: ' + stringLat + ' - ' + req.id)
        /**********************************************/



		/*
					Parsing Longitude
		 */
		if (!isNaN(req.query.lon)) {

			var lon = parseFloat(req.query.lon)

			var stringLon = (lon - stepLon/2) + ":" + (lon + stepLon/2)

			console.log(stringLon)
		} else if (Array.isArray(req.query.lon) && req.query.lon.length == 2 &&
			!isNaN(req.query.lon[0]) && !isNaN(req.query.lon[1])) {

			var lon1 = parseFloat(req.query.lon[0])
			var lon2 = parseFloat(req.query.lon[1])

			if (lon1 < lon2) {
				var stringLon = (lon1 - stepLon/2) + ':' + (lon2 + stepLon/2)
			} else {
				var stringLon = (lon2 - stepLon/2) + ':' + (lon1 + stepLon/2)
			}


		} else {
			console.log('Longitude must be a numeric list of length <= 2 - ' + req.id)
			res.send('Longitude must be a numeric list of length <= 2')
			return
		}

		console.log('Longitude: ' + stringLat + ' - ' + req.id)
		/***************************************************/



		/*
		                 Parsing Dates
		 */
		var datesPerYear = {}

		if (/^([\d]{8})+$/.test(req.query.date)) {

			// Unique Date
			datesPerYear[req.query.date.slice(0,4)] = 'd=' + req.query.date

		} else if (Array.isArray(req.query.date) && req.query.date.length == 2 &&
		/^([\d]{8})+$/.test(req.query.date[0]) && /^([\d]{8})+$/.test(req.query.date[1])) {


			if (req.query.date[0] < req.query.date[1]) {

				var date1 = new Date(req.query.date[0].slice(0,4),
					parseInt(req.query.date[0].slice(4,6)) - 1, req.query.date[0].slice(6, 8))
				var date2 = new Date(req.query.date[1].slice(0,4),
					parseInt(req.query.date[1].slice(4,6)) - 1, req.query.date[1].slice(6, 8))

			} else {

				var date1 = new Date(req.query.date[1].slice(0,4),
					parseInt(req.query.date[1].slice(4,6)) - 1, req.query.date[1].slice(6, 8))
				var date2 = new Date(req.query.date[0].slice(0,4),
					parseInt(req.query.date[0].slice(4,6)) - 1, req.query.date[0].slice(6, 8))

			}


			var currentYear = 0
			var d = date1


			while (d <= date2) {

				currentYear = d.getFullYear()

				if (datesPerYear.hasOwnProperty(currentYear)) {

					if (d.getDate() == 1 && (date2.getMonth() != d.getMonth() || date2.getFullYear() != d.getFullYear())) {

						datesPerYear[currentYear] += '|d=' + currentYear + ('0' + (d.getMonth() + 1)).slice(-2)

						d.setMonth(d.getMonth() + 1)

					} else {

						datesPerYear[currentYear] += '|d=' + currentYear + ('0' + (d.getMonth() + 1)).slice(-2) +
							('0' + d.getDate()).slice(-2)

						d.setDate(d.getDate() + 1)

					}

                } else {



					if (d.getDate() == 1 && d.getMonth() == 0 && d.getFullYear() != date2.getFullYear()) {

						datesPerYear[currentYear] = ''
						d.setFullYear(d.getFullYear() + 1)

					} else if (d.getDate() == 1 && (d.getMonth() != date2.getMonth() || currentYear != date2.getFullYear())) {

						datesPerYear[currentYear] = '-match "d=' + currentYear + ('0' + (d.getMonth() + 1)).slice(-2)
						d.setMonth(d.getMonth() + 1)


					} else {



						datesPerYear[currentYear] = '-match "d=' + currentYear + ('0' + (d.getMonth() + 1)).slice(-2) +
						('0' + d.getDate()).slice(-2)
						d.setDate(d.getDate() + 1)

					}



				}

			}




		} else {
			res.send('date should be a string of length <= 2. Every element must be in the format yyyymmdd')
			return
		}

		/***************************************************************/


		/*
			Extract Precipitation Data and Create Output File
		 */

		var command = ''
		var tmpFiles = ''
		var outputFile = userRequestsFolder + req.id

		for (var year in datesPerYear) {

			if (datesPerYear[year]) {
				datesPerYear[year] += '"'
			}

			command = wgrib2 + ' ' + dataFinalFolder + year + '.grib2 ' + datesPerYear[year] +
					' -undefine out-box ' + stringLon + ' ' + stringLat + ' -csv ' + outputFile + '_' + year + '.csv'

			tmpFiles += outputFile + '_' + year + '.csv '

			console.log(command + ' - ' + req.id)

			cmd(command)


		}

		command = 'cat ' + tmpFiles + '> ' + outputFile + '.csv'
		console.log(command + ' - ' + req.id)
		cmd(command)

		command = 'rm ' + tmpFiles
		console.log(command + ' - ' + req.id)
		cmd(command)

		var output = fs.readFileSync(outputFile + '.csv')
		console.log('Output Created - ' + outputFile + '.csv - ' + req.id)

		/**************************************************/


		/*
			Send Output File
		 */
		res.setHeader('Content-disposition', 'attachment; filename=' + outputFile + '.csv')
		res.set('Content-Type', 'text/csv')
		res.status(200).send(output)

		command = 'rm ' + outputFile + '.csv'
		console.log(command + ' - ' + req.id)
		cmd(command)


		// TODO: Tornar essa chamada assíncrona

	} else {

		console.log('The routine needs a object with 3 parameters (lat, lon, date) - ' + req.id)
		res.send('The routine needs a object with 3 parameters (lat, lon, date)')
		return

	}


});

app.listen(listeningPort, function () {
	console.log('Server Listening On Port ' + listeningPort)
})