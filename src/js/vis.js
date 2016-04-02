var build_list;
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
var hover_menu;

//===============================
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

//===============================
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

var HOVER_MENU_SIZE ={
	width: 200,
	height: 100,
	
	button_width: 90,
	button_height: 30,
	button_pad_right: 3,
	button_pad_bottom: 3
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

formatData(pc_list, software_list);
createButtons();
createVis();
updateVis();

function formatData(pc_data, software_data) {
	build_list = pc_data;
	
	for (var i = 0; i < build_list.length ; i++){
		build_list[i].total_price = parseFloat(build_list[i].total_price);
		build_list[i].total_cpus = parseInt(build_list[i].total_cpus);
		build_list[i].total_gpus = parseInt(build_list[i].total_gpus);
		
	}
	
	var part_type_list_required = [
		"CPU",
		"Video Card",
		"Memory",
		"Motherboard",
		"Storage",
		"Power Supply",
		"Case"
	];
	
	//filter out partial builds
	build_list = build_list.filter(function (ele, index, arr){
		for(var i =0; i < part_type_list_required.length ; i++){
			if (hasPart(ele, part_type_list_required[i]) == false){
				return false;
			}
		}

		return true;
	});
	
	
	/*
	//filter out builds with parts with missing prices
	build_list = build_list.filter(function (ele, index, arr){
		var partsList = ele.parts_list;
		for (var i =0 ; i < partsList.length ; i++){
			if (typeof part_type_list_required.find(function (ele){
					return partsList[i].part_type == ele;
			}) !="undefined"){
				//Is a required part, now check if the price is valid
				if (isFinite(parseInt(partsList[i].part_price)) || isFinite(parseInt(partsList[i].part_price_alt))){}
				else{ return false;}
			}
		}

		return true;
			

	});
	//*/
	
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
	
	
	console.log("Total complete & valid PCs in Database: " + build_list.length);

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
			var yValue = yScale(d.total_gpu_score);
			return "translate(" +
				xValue + "," + 
				yValue + ")";
		})
		.on("click", function(d){
			showHoverMenu(d.build_id, xScale(d.total_price), yScale(d.total_gpu_score));
		})
		.on("mouseover", function(d){
		})
		.append("circle")
			.attr("r", 0);
	
	
	//create a single hover menu (must be done after scatterplots)
	hover_menu = root.selectAll(".pc").data([{}])
		.enter()
		.append("g")
			.attr("id", "hover-menu-group")
			.attr("transform", "translate(" + 0 + "," + 0 + ")")
			.attr("visibility", "visible");
		
	hover_menu.append("rect")
		.attr("id", "hover-menu-box")
		.attr("width", HOVER_MENU_SIZE.width)
		.attr("height", HOVER_MENU_SIZE.height);	
	//hover labels	
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-name-label")
		.attr("x", 0)
		.attr("y", 15)
		.text("Build Name");	
		
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-cpu-detail")
		.attr("x", 0)
		.attr("y", 30)
		.text("CPU Score");	
		
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-gpu-detail")
		.attr("x", 0)
		.attr("y", 45)
		.text("GPU Score");
	//hover button
	hover_menu.append("rect")
		.attr("id", "hover-menu-button")
		.attr("x", HOVER_MENU_SIZE.width - HOVER_MENU_SIZE.button_width - HOVER_MENU_SIZE.button_pad_right)
		.attr("y", HOVER_MENU_SIZE.height - HOVER_MENU_SIZE.button_height - HOVER_MENU_SIZE.button_pad_bottom)
		.attr("width", HOVER_MENU_SIZE.button_width)
		.attr("height", HOVER_MENU_SIZE.button_height)
		.on("click", function(){
			console.log("No Build selected.");
		});
	hover_menu.append("text")
		.attr("id", "hover-menu-button-label")
		.attr("x", HOVER_MENU_SIZE.width - HOVER_MENU_SIZE.button_width - HOVER_MENU_SIZE.button_pad_right + 1)
		.attr("y", HOVER_MENU_SIZE.height - HOVER_MENU_SIZE.button_height - HOVER_MENU_SIZE.button_pad_bottom+15)
		.on("click", function(){
			console.log("No Build selected.");
		})
		.text("Build Details");

	
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

function showHoverMenu(build_id, x, y){
	var MAX_NAME_LENGTH = 20;
	var pc = getPC(build_id);

	
	$("#hover-menu-group").attr("transform", "translate(" + x + "," + y + ")");

	var pcNameTruncated = pc.name.length >= MAX_NAME_LENGTH ? pc.name.substring(0, MAX_NAME_LENGTH) + "..." : pc.name;
	$("#hover-menu-pc-name-label").text(pcNameTruncated);
	$("#hover-menu-pc-cpu-detail").text("CPU Score:" + pc.total_cpu_score);
	$("#hover-menu-pc-gpu-detail").text("CPU Score:" + pc.total_gpu_score);
	$("#hover-menu-button")
		.click(function(){
			openDetailWindow(build_id);
		});
	
	
	updateSoftwareReqList(build_id);
}

function updateSoftwareReqList(build_id){
	var pc = getPC(build_id);
	
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


// this function is to demonstrate how we can bind anything to html elements, not just data!
function createButtons() {

	var buttonsData = [
		{name:"x axis", target: "x"},
		{name:"y axis", target: "y"},
		{name:"size", target: "size"}
	];

	//create a button group
	var buttonGroup = d3.select("#buttons").selectAll(".buttonGroup")
		.data(buttonsData)
		.enter()
		.append("span").attr("class", "buttonGroup");
	

	//buttonGroups.append("label").html(function(d){return d.name;});
	
	var gpuCheckData = [
		{id:"gpucheckbox1", label: "1"},
		{id:"gpucheckbox2", label: "2"},
		{id:"gpucheckbox3", label: "3"},
		{id:"gpucheckbox4", label: "4"}
	];
	
	var checkboxGroup = d3.select("#checkboxes").selectAll(".checkboxGroup")
		.data(gpuCheckData)
		.enter();
	
	checkboxGroup.append("label")
			.html(function (d){
				return d.label;
			})
			.append("input")
				.attr("class", "gpuCheckbox")
				.attr("id", function(d){ return d.id;})
				.attr("type", "checkbox")
				.attr("checked", "true")
				.on("change", function(d){
					updateVis();
				});
	
}


function openDetailWindow(build_id){
	window.open("./pc_details.html?build_id=" + build_id, 
			"detail_window" + build_id,
			'width=1000,height=800,toolbar=0,menubar=0,location=1,status=1,scrollbars=1,resizable=0,titlebar=1,left=0,top=0');
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

function getPC(build_id){
	return build_list.find(function(ele, index, arr){
		return ele.build_id === build_id;
	});
}
