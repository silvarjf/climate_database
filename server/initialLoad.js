/**
 * Created by silvarjf on 27/02/19.
 */

var config = require("config");
var cmd = require("child_process").execSync;
var fs = require("fs");

var urlLateData = config.get("urlLateData");
var dataTempFolder = config.get("dataTempFolder");
var dataFinalFolder = config.get("dataFinalFolder");
var metadataFile = config.get("metadataFile");
var wgrib2 = config.get('wgrib2');


/*
 Function to scan the contents of a folder recursively
  */
var walkSync = function (dir, filelist) {
    var files = fs.readdirSync(dir);

    filelist = filelist || [];

    files.forEach(function(file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = walkSync(dir + file + '/', filelist);
        } else {
            if (file.endsWith('.grib2')) {
                filelist.push(dir + file);
            }
        }
    });
    return filelist
}

/***************************/





/*
             Fetch data from the INPE website to a local temp folder and scan
 */
fs.existsSync(dataTempFolder)) {
    fs.mkdirSync(dataTempFolder)
}

cmd('wget -r -A grib2 -np -P ' + dataTempFolder + ' ' + urlLateData);


var filelist = walkSync(dataTempFolder);

/***************************/






/*
Slice only the desired coordinates and aggregate the files by year
 */

var minLat = config.get('minLat');
var maxLat = config.get('maxLat');
var stepLat = config.get('stepLat');
var minLon = config.get('minLon');
var maxLon = config.get('maxLon');
var stepLon = config.get('stepLon');

var nLatPoints = Math.abs(maxLat - minLat)/stepLat + 1;
var nLonPoints = Math.abs(maxLon - minLon)/stepLon + 1;

var filesPerYear = {};
var dates = []
var year = ''
var date = ''
var re = /([\d]{8}).grib2/g;



filelist.forEach(function (file) {

    console.log(wgrib2 + ' ' + file + ' -lola ' + minLon + ':' + nLonPoints + ':' + stepLon + ' ' +
    minLat + ':' + nLatPoints + ':' + stepLat + ' ' + file + '_tmp grib')
    cmd(wgrib2 + ' ' + file + ' -lola ' + minLon + ':' + nLonPoints + ':' + stepLon + ' ' +
    minLat + ':' + nLatPoints + ':' + stepLat + ' ' + file + '_tmp grib')


    date = file.match(re)[0].slice(0,8)
    year = date.slice(0,4)

    console.log(year)

    if (filesPerYear.hasOwnProperty(year)) {
        filesPerYear[year] += ' ' + file + '_tmp'
    } else {
        filesPerYear[year] = file + '_tmp'
    }

    dates.push(date)

});

if (!fs.existsSync(dataFinalFolder)) {
    fs.mkdirSync(dataFinalFolder)
}

for (var year in filesPerYear) {
    cmd('cat ' + filesPerYear[year] + ' > ' + dataFinalFolder + year + '.grib2')
}

/*****************************************************/





/*
    Save metadata file and clean the environment
 */

var metadata = {
    "lastProcessingTime": (new Date()).toLocaleString('pt-BR'),
    "lastDateInDatabase": dates.sort().reverse()[0]
}

fs.writeFile(metadataFile, JSON.stringify(metadata), (err) => {
    if (err) {
        console.error(err);
        return;
    };
    console.log("File has been created");
});

console.log(dates)

cmd('rm -rf ' + dataTempFolder);


