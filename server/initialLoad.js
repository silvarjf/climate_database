/**
 * Created by silvarjf on 27/02/19.
 */

var config = require("config");
var cmd = require("node-cmd");

var urlLateData = config.get("urlLateData");
var dataTempFolder = config.get("dataTempFolder");

cmd.get('wget -r -A grib2 -np -P ' + dataTempFolder + ' ' + urlLateData, function(err, data, stderr) {
    console.log(data)
});



// cmd.run('wget -A grib2 -np ' + urlLateData);