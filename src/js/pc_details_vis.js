var build_list;
var selected_build;
var software_req_list;
/* this code doesn't quite work because of CORS security restrictions
// we get around this by importing countries.js
d3.json("data.json",
	function(error, data) {
		if (error) {
			console.log("we got an error", error);
			return;
		} else {
			console.log("data loaded ok");
		}
		
		//formatData();
		//createVis();
		//etc.
	}
);
*/


var root;

var margin = {
	top : 50,
	left: 50,
	bottom: 50,
	right: 50
};
var width = 1000 - margin.left * 2;
var height = 600 - margin.top * 2;

var xScale = d3.scale.linear().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().orient("bottom");
var yAxis = d3.svg.axis().orient("left");

var firstRun = true;




//Asthetic controls
var barWidth = 100;
var divisionLines = [
{
	x:115,
	y:0,
	width: 5,
	height: height,
	classAttr: "divider-line"
}
];

var X_AXIS_POSITION = {
	top: 45,
	left: width/2
};

var Y_AXIS_POSITION = {
	top: height/2 + (-50),
	left: -1 * margin.left
};

var X_AXIS_LABEL = "Total Price (USD)";
var Y_AXIS_LABEL = "Passmark 3D Score";


//Pre-render data filters
var min_price = 1;
var max_price = 10000;

var min_gpu_performance = 1;
var max_gpu_performance = 500000;

var min_cpu_performance = 1;
var max_cpu_performance = 500000;

var max_gpu_count = 4;
var max_cpu_count = 2;



initPage();


function initPage(){
	
	//format the data
	formatData(pc_list, software_list);
	
	//get the requested buildid
	selected_build = build_list.find(function(ele,index,arr){
		return ele.build_id === window.location.search.replace("?", "").split('=')[1];
	});
	
	//return error and quit when there's no pc selected
	if (typeof selected_build === "undefined"){
		$("#build-name-header").text("ERROR! No PC selected.");
		return;
	}
	
	console.log("Showing build details for: " + selected_build.build_id);
	setupPage(selected_build);
	
	
	
	createButtons();
	createVis();
	updateVis();
}

function setupPage(pc){
	//add pc name title
	$("#build-name-header").text("Build Details: " + pc.name);
	
	//add pc details
	var summaryData = [
		{label: "Name: ", val: pc.name},
		{label: "Total price: ", val: pc.total_price},
		{label: "Date published: ", val: pc.date_published},
		{label: "More Information: ", val: "<a href=\""+ pc.buildlink_href + "\" target=\"_blank\">Click Here</a>"}
	];
	
	var summaryList = d3.select("#details-summary").selectAll(".summary-element")
		.data(summaryData)
		.enter()
		.append("div")
			.attr("class", "summary-detail");
		
	summaryList.append("p")
		.attr("class", "summary-detail-label")
		.html(function(d) {
			return d.label;
		});
		
	summaryList.append("p")
		.attr("class", "summary-detail-value")
		.html(function(d) {
			return d.val;
		});
	
	
	
	//add all components except Custom
	var displayList = pc.parts_list.filter(function(ele, index, arr){
		return !(ele.part_type === "Custom");
	});
	

	var pcComponents = d3.select("#component-list").selectAll(".component")
		.data(displayList)
		.enter()
		.append("div")
			.attr("class", "component");
		
	pcComponents.append("p")
		.attr("class", "component-type")
		.html(function (d){
			return d.part_type;
		});
		
	pcComponents.append("p")
		.attr("class", "component-name")
		.html(function (d){
			return "<a href=\"" + d.part_description_href + "\" target=\"_blank\">" + d.part_name + "</a>";
		});
		
	pcComponents.append("p")
		.attr("class", "component-price")
		.html(function (d){
			
			return d.part_price;
		});
		
		
}



function formatData(pc_data, software_data) {
	build_list = pc_data;
	
	for (var i = 0; i < build_list.length ; i++){
		build_list[i].total_price = parseFloat(build_list[i].total_price);
		build_list[i].total_cpus = parseInt(build_list[i].total_cpus);
		build_list[i].total_gpus = parseInt(build_list[i].total_gpus);
		
	}
	
	//filter out partial builds
	build_list = build_list.filter(function (ele, index, arr){
		if (hasPart(ele, "CPU") && 
			hasPart(ele, "Video Card") && 
			hasPart(ele, "Motherboard") && 
			hasPart(ele, "Power Supply") && 
			hasPart(ele, "Memory") && 
			hasPart(ele, "Case") && 
			hasPart(ele, "Storage")){
				return true;
			}
			else {false;}

	});
	
	
	//narrow the range of PCs by total price 
	build_list = build_list.filter(function (ele, index, arr){
		return (ele.total_price >= min_price) && (ele.total_price <= max_price);
	});
	
	//filter out gpus by performance
	build_list = build_list.filter(function (ele, index, arr){
		return (ele.total_gpu_score >= min_gpu_performance) && (ele.total_gpu_score <= max_gpu_performance);
	});
	
	//filter out cpus by performance
	build_list = build_list.filter(function (ele, index, arr){
		return (ele.total_cpu_score >= min_cpu_performance) && (ele.total_cpu_score <= max_cpu_performance);
	});
	
	//remove builds that have more than MAX gpus
	build_list = build_list.filter(function (ele, index, arr){
		return (ele.total_gpus <= max_gpu_count);
	});
	
	//remove builds that have more than MAX cpus
	build_list = build_list.filter(function (ele, index, arr){
		return (ele.total_cpus <= max_cpu_count);
	});
	
	
	//sort by total price for entry transition
	build_list = build_list.sort(function (a,b){
		
		if (a.total_price < b.total_price){
			//sort in decending (highest to low)
			if (a.total_gpus < b.total_gpus){
				return -1;
			}
			else if (a.total_gpus > b.total_gpus){
				return 1;
			}
			else{
				return 0;
			}
		}
		else if (a.total_price > b.total_price){
			//sort in decending (highest to low)
			if (a.total_gpus < b.total_gpus){
				return -1;
			}
			else if (a.total_gpus > b.total_gpus){
				return 1;
			}
			else{
				return 0;
			}
		}
		
	});
	
	
	console.log("Total complete PCs in Database: " + build_list.length);

	//==================================================
	//software list data formattting
	
	software_req_list = software_data;

	software_req_list.sort(function(a,b){
		//combine the total score for recommended requirements from both cpu and gpu
		//ignore nulls by setting them to default as zero
		var totalMinScoreA = (a.rec_cpu_bench == "null" ? 0 : a.rec_cpu_bench) + (a.rec_gpu_bench == "null" ? 0 : a.rec_gpu_bench);
		var totalMinScoreB = (b.rec_cpu_bench == "null" ? 0 : b.rec_cpu_bench) + (b.rec_gpu_bench == "null" ? 0 : b.rec_gpu_bench);
		
		//sort in decending (highest to low)
		if (totalMinScoreA < totalMinScoreB){
			return 1;
		}
		else if (totalMinScoreA > totalMinScoreB){
			return -1;
		}
		else{
			return 0;
		}
		
	});
	
	console.log("Total software in Database: " + software_req_list.length);
	
}

function createVis() {
	createStackedBarChart(selected_build, 0);
	createStackedBarChart(build_list[601], 200);
	createStackedBarChart(build_list[503], 320);
	createStackedBarChart(build_list[405], 440);

	
	// recompute the max value for the x and y and size scales
	yScale.domain([0, 100]);
	
	root = d3.select("#graphics");

	
	//start of chart, top left
	root = root.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

			
	root.selectAll(".dividerLine").data(divisionLines)
		.enter()
		.append("rect")
		.attr("class", function(d){return d.classAttr;})
		.attr("x", function(d){return d.x})
		.attr("y", function(d){return d.y})
		.attr("width", function(d){return d.width})
		.attr("height", function(d){return d.height});
		
		
}

function createStackedBarChart(pc, xPos){
	// recompute the max value for the x and y and size scales
	yScale.domain([0, 100]);
	
	root = d3.select("#graphics");

	//start of chart, top left
	root = root.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

	var barVals = categorizeParts(pc);
	barVals.reverse();

	//create each pc build
	var stackedBar = root.selectAll(".pc").data(barVals)
		.enter()
		.append("g")
			.attr("class", "pc-part-bar")
			.attr("transform", function(d, i) {
				//locate the points based on previous Y location
				var barHeight = (d.percent/100.0) * height;
				barVals.prev = i==0? height: barVals.prev;
				var nextY = barVals.prev-barHeight;
				barVals.prev = nextY;
				
				return ret = "translate(" +
					xPos + "," + 
					nextY + ")";
			})
			
		
	stackedBar.append("rect")
		.attr("width", barWidth)
		.attr("height", function(d,i){
			return (d.percent/100.0) * height;
		})
		.attr("class", function(d,i){
			var type = d.part_type.replace(new RegExp(' ','g'), '-');
			return "stack-bar bar-part-type-" + type;
		});
		
	stackedBar.append("text")
		.attr("class", "text")
		.text(function(d){return d.part_type;});
}

function updateVis() {
	// recompute the max value for the x and y and size scales
	yScale.domain([0, 100]);




	// update the scales for the x and y axes
	xAxis.scale(xScale);
	yAxis.scale(yScale);
	
	// redraw the axis, ticks, and labels
	root.select(".xAxis").call(xAxis)
		.select(".label").text(X_AXIS_LABEL);
	root.select(".yAxis").call(yAxis)
		.select(".label").text(Y_AXIS_LABEL);
		
	//first run of the visualization is now done
	if (firstRun === true){
		firstRun = false;
	}
}

function createButtons() {

	
}



//=======================================================
//pc parts helper functions

function categorizeParts(pc){
	var part_type_list = [
	"CPU",
	"Video Card",
	"Memory",
	"Motherboard",
	"Storage",
	"Power Supply",
	"Case",
	"Miscellaneous"
];
	var partsNormalized = [];
	var parts_list = pc.parts_list;
	
	
	//rig the sorting process
	for (var i =0 ; i< part_type_list.length ; i++){	
		partsNormalized.push({part_type: part_type_list[i], total_price: 0.0});
	}
	
	//accumulate all part prices by type category
	for (var i =0 ; i< parts_list.length ; i++){
		
		var exists = partsNormalized.find(function(ele, index, arr){
			return ele.part_type == parts_list[i].part_type;
		});
		
		
		var price = parseInt(parts_list[i].part_price);
		var price_alt = parseInt(parts_list[i].part_price_alt);
		price_alt = isFinite(price_alt) ? price_alt : 0.0;
		price = isFinite(price) ? price : price_alt;
		
		
		if (typeof exists ==="undefined"){
			//undefined, add to other category
			partsNormalized[partsNormalized.length-1].total_price+= price;
		}
		else{
			//exists, increase price
			exists.total_price += price
		}
	}
	
	//normalize all parts to percentage of total price
	for(var i = 0 ; i < partsNormalized.length ; i++){
		partsNormalized[i].percent = partsNormalized[i].total_price / pc.total_price;
		partsNormalized[i].percent *= 100.0;
	}
	
	return partsNormalized;
}


//checks if an a build has a particular part type
function hasPart(build, part_type){
	var part = build.parts_list.find(function(ele){
		return ele.part_type === part_type;
	});
	
	return !(typeof part === "undefined");
}

function getGPUCount(build){
	var gpuList = build.parts_list.filter(function(ele){
		return ele.part_type === "Video Card";
	});
	return gpuList.length;
}
