//File Reader
//http://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript

var readData;
function readSingleFile(e) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		var contents = e.target.result;
		displayContents(contents);
	};
	reader.readAsText(file);
}

function displayContents(contents) {
	$("#datainput").text(contents.length>2000 ? contents.substring(0,2000) + "..." : contents);
	readData = contents;
}

$(document).ready(function() {
	$("#input-file").on('change', readSingleFile);
	$("#btnProcess").on('click', function(){ processJSON(readData);});

	$("#btnCopy").on('click', function(){
		if (outputString.length == 0){
			window.alert("Hit the process button first!");
		}
		else{
			downloadJSON(outputString);
		}
		
		
	});
});
  
  
//=====================================================
//dataProcessor

var outputString = "";

function processJSON(jsonString){
	var allData = JSON.parse(jsonString);
	
	outputString = process("blarg", jsonString);
	outputJSON(outputString);
}

function process(header, values){
	
	return values;
}

function outputJSON(jsonString){
	$("#dataoutput").text(jsonString.substring(0,5000));
	
}

var OUTPUT_FILENAME = "processed.json";

function downloadJSON(content){	
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    pom.setAttribute('download', OUTPUT_FILENAME);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}
