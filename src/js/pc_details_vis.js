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
	left: 90,
	bottom: 50,
	right: 50
};
var width = 1000 - margin.left * 2;
var height = 500 - margin.top * 2;

var xScale = d3.scale.linear().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().orient("bottom");
var yAxis = d3.svg.axis().orient("left");

var firstRun = true;




//Asthetic controls
var pointSize = 6;

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
	console.log("Build details for:" + selected_build.build_id);
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
		{label: "Name: ", val: pc.name},
		{label: "Name: ", val: pc.name},
		{label: "Name: ", val: pc.name}
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
			return d.part_name;
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
	// recompute the max value for the x and y and size scales
	var maxValX = d3.max(build_list, function (d) { return +d.total_price;});
	var maxValY = d3.max(build_list, function (d) { return +d.total_price;});
	xScale.domain([0, maxValX]);
	yScale.domain([0, maxValY]);
	
	root = d3.select("#graphics");

	//start of chart, top left
	root = root.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

	// Create X Axis
	root.append("g")
		.attr("class", "xAxis")
		.attr("transform", "translate(0," + height + ")")
		// this is what creates the axis
		.call(xAxis)
			//create axis labels
			.append("text")
			.attr("class", "label")
			.attr("transform", "translate(" + X_AXIS_POSITION.left + "," + X_AXIS_POSITION.top +")")
			.style("text-anchor", "end");

	// Create Y Axis
	root.append("g")
		.attr("class", "yAxis")
		.call(yAxis)
			.append("text")
			.attr("class", "label")
			.attr("transform", "translate(" + Y_AXIS_POSITION.left + "," + Y_AXIS_POSITION.top + ")rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end");
		
	//create each pc build
	root.selectAll(".pc").data(build_list)
		.enter()
		.append("g")
		.attr("class", "pc_build")
		.attr("transform", function(d) {
			//locate the points
			var xValue = xScale(d.total_price);
			return "translate(" +
				xValue + "," + 
				height + ")";
		})
		.on("click", function(d){
			window.alert("This build id is: " + d.build_id);
		})
		.append("circle")
			.attr("r", 0);
			
	//create list of software
	var softwareItem = d3.select("#software-list").selectAll(".software").data(software_req_list)
		.enter()
		.append("div")
			.attr("class", "software")
			.append("div")
				.attr("class", "software-no-run")
			
	softwareItem.append("img")
		.attr("class", "software-icon")
		.attr("src", "./images/cross.png");	
		
	softwareItem.append("div")
		.attr("class", "software-label")
		.html(function(d){ return d.name;});		
		
}


function updateVis() {
	// recompute the max value for the x and y and size scales
	var maxValX = d3.max(build_list, function (d) { return +d.total_price;});
	var maxValY = d3.max(build_list, function (d) { return +d.total_gpu_score;});
	xScale.domain([0, maxValX]);
	yScale.domain([0, maxValY]);

	
	//check the checkboxes to see if they have changed
	var gpuEnabled = [
		$("#gpucheckbox1").is(':checked'),
		$("#gpucheckbox2").is(':checked'),
		$("#gpucheckbox3").is(':checked'),
		$("#gpucheckbox4").is(':checked')
	];
		
		
	// here we will change the position and radius of each circle
	root.selectAll(".pc_build").data(build_list)
		.attr("transform", function(d) {
			//locate the points
			var xValue = xScale(d.total_price);
			var yValue = yScale(d.total_gpu_score);
			return "translate(" +
				xValue + "," + 
				yValue + ")";
		});
		
	
	root.selectAll(".pc_build").data(build_list)
		.select("circle")
			.transition()
			.ease("elastic")
			.duration(1000)
			.delay(function(d, i){
				if (firstRun === true){
					return (750 * d.total_gpus) + (d.total_price/15);
				}
				return (gpuEnabled[d.total_gpus-1] == true ? 1 :0) + (d.total_price/30);
			})
			.attr("r", function(d) {		
				//circle radius
				return gpuEnabled[d.total_gpus-1] == true ? pointSize : 0 ;
			})
			.attr("class", function(d){
				if (d.total_gpus > 4) {console.log("Warning: too many GPUs"); console.log(d);}
				return "gpu" + d.total_gpus;
			});
	


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
