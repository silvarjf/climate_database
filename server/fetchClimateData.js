/**
 * Created by silvarjf on 27/02/19.
 */

var config = require("config");
var cmd = require("child_process").execSync;
var fs = require("fs");
const args = require("minimist")(process.argv.slice(2));

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
var command = ''
var initialLoading = false;
if (args['initialLoading'] && args['initialLoading'].toLowerCase() == 'true') {
    initialLoading = true

    console.log('Reload Files...')
    command = 'rm -rf ' + dataFinalFolder
    console.log(command)
    cmd(command)

    console.log('Creating Folder ' + dataFinalFolder)
    fs.mkdirSync(dataFinalFolder)
}
console.log('Initial Loading: ' + initialLoading)



/*
             Fetch data from the INPE website to a local temp folder and scan
 */

if (fs.existsSync(dataTempFolder)) {
    command = 'rm -rf ' + dataTempFolder
    console.log(command)
    cmd(command)


}

var filter = '';
if (!initialLoading) {
    var metadata = JSON.parse(fs.readFileSync(metadataFile))


    var year = parseInt(metadata["lastDateInDatabase"].slice(0,4));
    var month = parseInt(metadata["lastDateInDatabase"].slice(4,6));
    var day = parseInt(metadata["lastDateInDatabase"].slice(6));
    var now = new Date()

    var d = new Date(year, month - 1, day + 1)


    for (var d = new Date(year, month - 1, day + 1); d <= now; d.setDate(d.getDate() + 1)) {
        filter = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2)

        command = 'wget -nd -r -A "*' + filter + '.grib2" -np -P ' + dataTempFolder + ' ' + urlLateData
        console.log(command)

        cmd(command)
    }

} else {
    command = 'wget -nd -r -A "*.grib2" -np -P ' + dataTempFolder + ' ' + urlLateData
    console.log(command)
    cmd(command)
}



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

    console.log('Extracting coordinates...')
    command = wgrib2 + ' ' + file + ' -lola ' + minLon + ':' + nLonPoints + ':' + stepLon + ' ' +
    minLat + ':' + nLatPoints + ':' + stepLat + ' ' + file + '_tmp grib'
    console.log(command)
    cmd(command)


    date = file.match(re)[0].slice(0,8)
    year = date.slice(0,4)


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

    if (fs.existsSync(dataFinalFolder + year + '.grib2')) {
        console.log('Concatenating data to ' + year + ' file')

        command = 'mv ' + dataFinalFolder + year + '.grib2 ' + dataFinalFolder + year + '.grib2_tmp'
        console.log(command)
        cmd(command)

        command = 'cat ' + dataFinalFolder + year + '.grib2_tmp ' + filesPerYear[year] + ' > ' + dataFinalFolder + year + '.grib2'
        console.log(command)
        cmd(command)

        command = 'rm ' + dataFinalFolder + year + '.grib2_tmp'
        console.log(command)
        cmd(command)
    } else {

        console.log('Creating file for year ' + year)
        command = 'cat ' + filesPerYear[year] + ' > ' + dataFinalFolder + year + '.grib2'
        console.log(command)
        cmd(command)


    }

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
    console.log("Metadata File Created");
});


// cmd('rm -rf ' + dataTempFolder);


