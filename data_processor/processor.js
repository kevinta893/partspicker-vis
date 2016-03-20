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
	$("#btnProcess").on('click', function(){ processData(readData);});

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

function processData(rawData){
	outputString = JSON.stringify(process(rawData));
	outputJSON(outputString);
}

function outputJSON(jsonString){
	$("#dataoutput").text(jsonString.length>=5000 ? jsonString.substring(0,5000) + "..." : jsonString);
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




//=====================================================
//processing data
var everything;
function process(rawData){
	//format all rows to string arrays
	rawData = rawData.split('\n');
	
	//setup progressBar
	setupProgressMax([6])
	
	
	var allData = [];
	
	
	for (var i = 0 ; i< rawData.length ; i++){
		var row = rawData[i].split(',');
		
		//clean each row's qoutes
		for (var j = 0 ; j < row.length ; j++){
			row[j] = row[j].substring(1, row[j].length-1);
		}
		allData[i] = row;
	}
	incrementProgress(1);

	
	
	//turn each row array into an associative array row
	var header = allData[0];
	for (var i = 0 ; i< allData.length ; i++){
		var assocRow = {};
		for (var j = 0 ; j < allData[i].length ; j++){
			assocRow[header[j]] = allData[i][j];
		}
		allData[i] = assocRow;
	}
	incrementProgress(1);

	//now that all rows are in arrays, take the first row to be the header and create associateive arrays
	var result = {pc_list:[]};
	
	var buildIds = [];
	
	//build id table
	for (var i = 1 ; i < allData.length ; i++){		//skip header
		buildIds.push(allData[i].build_id);
	}
	incrementProgress(1);
	
	
	//remove all duplicates
	buildIds = buildIds.filter(function(item, pos) {
		return buildIds.indexOf(item) == pos;
	});
	incrementProgress(1);
	
	//get meta about each build id
	for (var i = 0 ; i < buildIds.length ; i++){		
		var row = allData.find(function (ele, index){
			return ele.build_id === buildIds[i];
		});
		
		result.pc_list[i] = {
			build_id : row.build_id,
			name : row.name,
			total_price : row.total_price,
			date_published : row.date_published,
			page_num : row.page_num,
			buildlink_href : row.buildlink_href,
			parts_list : []
		};
		
	}
	incrementProgress(1);
	
	//gather all the parts for each PC
	for (var i = 0 ; i < allData.length ; i++){		
		var pc_row = result.pc_list.find(function (ele, index){			
			return ele.build_id === allData[i].build_id;
		});
		
		if (!(typeof pc_row === "undefined")){
			//add the part to the list of parts
			var row = allData[i];
			
			pc_row.parts_list.push({
				part_type : row.part_type,
				part_name : row.part_name,
				part_price : row.part_price,
				part_price_alt : row.part_price_alt,
				part_description_href : row.part_description_href
				
			});
		}
		
	}
	incrementProgress(1);
	
	everything = result;

	return result;
}



function rowGetPart(row){
	var part = {type: row["part_type"], name: row["part_name"], price: row["part_price"]};
	
	return part;
}



//=========================================================
//progress bar
function setupProgressMax(list){
	//reset current progress
	progressValue = 0;
	
	var totalMax = 0;
	
	for (var i = 0 ; i< list.length ; i++){
		totalMax += list[i];
	}
	
	$("#progressBar").attr("max", totalMax);

}

var progressValue = 0;
function incrementProgress(num){
	progressValue += num;
	$("#progressBar").attr("value", progressValue);
	setTimeout(50);
}