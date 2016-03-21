//File Reader
//http://stackoverflow.com/questions/3582671/how-to-open-a-local-disk-file-with-javascript

var readData;
var readBenchData;
function readSingleFile(e) {
	var file = e.target.files[0];
	console.log(e);
	if (!file) {
		return;
	}
	var reader = new FileReader();
	
	var fileType = (e.target.name === "data" ? "data" : "benchmark");
	
	reader.onload = function(e) {
		var contents = e.target.result;
		
		if (fileType === "data"){
			readData = contents;
			$("#datainput").text(contents.length>2000 ? contents.substring(0,2000) + "..." : contents);
		}
		else{
			readBenchData = contents;
		}
	};
	reader.readAsText(file);
}


$(document).ready(function() {
	$("#input-file").on('change', readSingleFile);
	$("#input-bench-file").on('change', readSingleFile);
	$("#btnProcess").on('click', function(){ 
		if (typeof readData === "undefined" || typeof readBenchData === "undefined"){
			window.alert("Specfiy both data and benchmark files first!");
			return;
		}
		processData(readData, readBenchData);
	});

	$("#btnCopy").on('click', function(){
		if (outputString.length == 0){
			window.alert("Hit the process button first!");
			return;
		}
		else{
			downloadJSON(outputString);
		}
		
		
	});

});
  
  
//=====================================================
//dataProcessor

var outputString = "";

function processData(rawData, rawBenchData){
	processBench(rawBenchData);
	
	outputString = JSON.stringify(process(rawData));
	outputJSON(outputString);
}

function outputJSON(jsonString){
	$("#dataoutput").text(jsonString.length>=5000 ? jsonString.substring(0,5000) + "..." : jsonString);
}

var OUTPUT_FILENAME = "processed.json";

function downloadJSON(content){	
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent("var pc_list = " + content + ";"));
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



var benchDatabase;
function processBench(rawBenchData){
	//format all rows to string array
	rawBenchData = rawBenchData.split('\n');

	var allBenchData = [];

	
	// Remove qoutes from each csv
	for (var i = 0 ; i< rawBenchData.length ; i++){
		var row = rawBenchData[i].split(',');
		
		//clean each row's qoutes
		for (var j = 0 ; j < row.length ; j++){
			row[j] = row[j].substring(1, row[j].length-1);
		}
		allBenchData[i] = row;
	}
	
	//turn each row array into an associative array row
	var header = allBenchData[0];
	for (var i = 0 ; i< allBenchData.length ; i++){
		var assocRow = {};
		for (var j = 0 ; j < allBenchData[i].length ; j++){
			assocRow[header[j]] = allBenchData[i][j];
		}
		allBenchData[i] = assocRow;
	}

	benchDatabase = allBenchData;
}



var everything;
function process(rawData){
	//format all rows to string arrays
	rawData = rawData.split('\n');
	
	//setup progressBar
	setupProgressMax([6])
	
	
	var allData = [];
	
	// Remove qoutes from each csv
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
	var result = [];
	
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
		
		var allCPUs = benchDatabase.filter(function(ele, index, arr){return (ele.build_id === buildIds[i]) && (ele.part_type === "CPU")});
		var allGPUs = benchDatabase.filter(function(ele, index, arr){return (ele.build_id === buildIds[i]) && (ele.part_type === "Video Card")});
		
		
		result[i] = {
			build_id : row.build_id,
			name : row.name,
			total_price : row.total_price,
			date_published : row.date_published,
			page_num : row.page_num,
			buildlink_href : row.buildlink_href,
			total_cpus : allCPUs.length,
			total_gpus : allGPUs.length,
			total_cpu_score : 0,
			total_gpu_score : 0,
			parts_list : [],
			cpu_list : [],
			gpu_list : []
		};
		
		//compute the bench scores, add the cpu to the list
		for (var j = 0 ; j < allCPUs.length ; j++){
			var obj = allCPUs[j];
			result[i].total_cpu_score += obj.CPU_Mark;
			result[i].cpu_list.push({
				part_name : obj.part_name,
				part_price : obj.part_price,
				part_price_alt : obj.part_price_alt,
				part_description_href : obj.part_description_href,
				CPU_Mark : obj.CPU_Mark,
				price : obj.price,
				no_cores : obj.No_of_Cores,
				socket : obj.Socket,
				single_thread_mark : obj.Single_Thread_Mark
			});
		}
		
		//compute the bench scores, add the gpu to the list
		for (var j = 0 ; j < allGPUs.length ; j++){
			var obj = allGPUs[j];
			result[i].total_gpu_score += obj.Passmark_G3D_Mark;
			result[i].gpu_list.push({
				part_type : obj.part_type,
				part_name : obj.part_name,
				part_price : obj.part_price,
				part_price_alt : obj.part_price_alt,
				part_description_href : obj.part_description_href,
				Passmark_G3D_Mark : obj.Passmark_G3D_Mark,
				price : obj.Price1
			});
		}
		
	}
	incrementProgress(1);
	
	//gather all the parts for each PC
	for (var i = 0 ; i < allData.length ; i++){		
		var pc_row = result.find(function (ele, index){			
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