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

//Pre-render data filters
var min_price = 1;
var max_price = 10000;

var min_gpu_performance = 1;
var max_gpu_performance = 500000;

var min_cpu_performance = 1;
var max_cpu_performance = 500000;

var max_gpu_count = 4;
var max_cpu_count = 2;

//===============================
var margin = {
	top : 60,
	left: 90,
	bottom: 50,
	right: 50
};
var width = Math.max($(window).width(), 1000) * 0.55 - margin.left * 2;
var height = 500 - margin.top * 2;

var xScale = d3.scale.linear().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().orient("bottom");
var yAxis = d3.svg.axis().orient("left");

var firstRun = true;

//===============================
//Asthetic controls
var pointSize = 6;
var MAX_Y_PADDING_PERCENT = 1.2;
var CHART_POINT_LEFT_CUTOFF_PERCENT = 0.01;

var X_AXIS_POSITION = {
	top: 45,
	left: width/2
};

var Y_AXIS_POSITION = {
	top: height/2 + (-50),
	left: -1 * margin.left
};

var HOVER_MENU_PARAMS ={
	width: 200,
	height: 115,
	rx: 5,
	ry: 5,
	
	
	button_width: 85,
	button_height: 30,	
	button_rx: 2,
	button_ry: 2,
	button_pad_right: 5,
	button_pad_bottom: 5,
	
	button_label_padding_top: 19,
	button_label_padding_left: 5,
	
	mouse_offset_x: 10,
	mouse_offset_y: 10,
	
	label_padding_left: 5,
	label_spacing_top: 17,
	max_name_length: 27
	
	//see CSS for color and fill of hover menu
};

var SLIDER_PARAMETERS ={
	width: 600,
	height: 200,
	
	step: 50,
	min: 0,
	max: max_price,
	min_diff: 250,
	init_upper_value: max_price,
	init_lower_value: min_price
	
};

var TOOLTIP_SHOWUP_DELAY = 0;

var X_AXIS_LABEL = "Total Price (USD)";
var Y_AXIS_LABEL = "Passmark 3D Score";

var REC_REQ_ICON = "images/check.png";
var MIN_REQ_ICON = "images/dash.png";
var NO_REQ_ICON =  "images/cross.png";
var NO_SELECT_ICON = "images/question.png";

var CHECKBOX_CHECKED_IMG = "./images/checkbox-checked.png";
var CHECKBOX_UNCHECKED_IMG = "./images/checkbox-unchecked.png";


//runtime variables (change and update for effect)
var xMax = max_price;
var xMin = min_price;

//initialize
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
		return 0;
	});
	
	
	console.log("Total complete & valid PCs in Database: " + build_list.length);

	//==================================================
	//software list data formattting
	
	software_req_list = software_data;
	//set all nulls to zero
	for ( var i= 0; i< software_req_list.length ; i++){
		var d = software_req_list[i];
		software_req_list[i].min_cpu_bench = d.min_cpu_bench == "null" ? 0 : d.min_cpu_bench;
		software_req_list[i].min_gpu_bench = d.min_gpu_bench == "null" ? 0 : d.min_gpu_bench;
		software_req_list[i].rec_cpu_bench = d.rec_cpu_bench == "null" ? 0 : d.rec_cpu_bench;
		software_req_list[i].rec_gpu_bench = d.rec_gpu_bench == "null" ? 0 : d.rec_gpu_bench;

	}
	software_req_list = software_req_list.sort(function(a,b){
		//combine the total score for recommended requirements from both cpu and gpu
		//ignore nulls by setting them to default as zero
		var totalMinScoreA = a.rec_cpu_bench + a.rec_gpu_bench;
		var totalMinScoreB = b.rec_cpu_bench + b.rec_gpu_bench;
		
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
			.attr("visibility", "hidden");
		
	hover_menu.append("rect")
		.attr("class", "hover-menu-box")
		.attr("width", HOVER_MENU_PARAMS.width)
		.attr("height", HOVER_MENU_PARAMS.height)
		.attr("rx", HOVER_MENU_PARAMS.rx)
		.attr("ry", HOVER_MENU_PARAMS.ry);
	
	hover_menu.append("polygon")
		.attr("class", "hover-menu-box")
		.attr("transform", "translate(" + 0 + "," + HOVER_MENU_PARAMS.height + ")")
		.attr("points", "5,-30 " +  "30,-5 " + 
		((-1 * HOVER_MENU_PARAMS.mouse_offset_x)+ "," + HOVER_MENU_PARAMS.mouse_offset_y));
		
	//hover labels	
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-name-label")
		.attr("x", HOVER_MENU_PARAMS.label_padding_left)
		.attr("y", 1 * HOVER_MENU_PARAMS.label_spacing_top)
		.text("Build Name");	
		
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-cpu-detail")
		.attr("x", HOVER_MENU_PARAMS.label_padding_left)
		.attr("y", 2 * HOVER_MENU_PARAMS.label_spacing_top)
		.text("CPU Score");	
		
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-gpu-detail")
		.attr("x", HOVER_MENU_PARAMS.label_padding_left)
		.attr("y", 3 * HOVER_MENU_PARAMS.label_spacing_top)
		.text("GPU Score");
		
	hover_menu.append("text")
		.attr("class", "hover-menu-label")
		.attr("id", "hover-menu-pc-total-price")
		.attr("x", HOVER_MENU_PARAMS.label_padding_left)
		.attr("y", 4 * HOVER_MENU_PARAMS.label_spacing_top)
		.text("Total Price");
		
	//hover button
	hover_menu.append("rect")
		.attr("id", "hover-menu-button")
		.attr("x", HOVER_MENU_PARAMS.width - HOVER_MENU_PARAMS.button_width - HOVER_MENU_PARAMS.button_pad_right)
		.attr("y", HOVER_MENU_PARAMS.height - HOVER_MENU_PARAMS.button_height - HOVER_MENU_PARAMS.button_pad_bottom)
		.attr("width", HOVER_MENU_PARAMS.button_width)
		.attr("height", HOVER_MENU_PARAMS.button_height)
		.attr("rx", HOVER_MENU_PARAMS.button_rx)
		.attr("ry", HOVER_MENU_PARAMS.button_rx);;
		
	hover_menu.append("text")
		.attr("id", "hover-menu-button-label")
		.attr("x", HOVER_MENU_PARAMS.width - HOVER_MENU_PARAMS.button_width - HOVER_MENU_PARAMS.button_pad_right + HOVER_MENU_PARAMS.button_label_padding_left)
		.attr("y", HOVER_MENU_PARAMS.height - HOVER_MENU_PARAMS.button_height - HOVER_MENU_PARAMS.button_pad_bottom + HOVER_MENU_PARAMS.button_label_padding_top)
		.text("Build Details");
		
	//add event to click on graph background to hide hover
	$("#graphics").click(function(e){
		if (e.toElement.id == "graphics"){
			hideHoverMenu();
		}
	});
	
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
		
	//apply tooltips to each software
	addSoftwareListToolTips();
	
	hideHoverMenu();		//deactivate software menu

}

function updateVis() {	
	// recompute the max value for the x and y and size scales
	var maxValX = d3.max(build_list, function (d) { return +d.total_price;});
	var maxValY = d3.max(build_list, function (d) { return +d.total_gpu_score;});
	maxValY *= MAX_Y_PADDING_PERCENT;
	xScale.domain([xMin, xMax]);
	yScale.domain([0, maxValY]);


	filterVis(true);
	
	


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

function filterVis(show){
	// recompute the max value for the x and y and size scales
	var maxValX = d3.max(build_list, function (d) { return +d.total_price;});
	var maxValY = d3.max(build_list, function (d) { return +d.total_gpu_score;});
	maxValY *= MAX_Y_PADDING_PERCENT;
	xScale.domain([xMin, xMax]);
	yScale.domain([0, maxValY]);

	
	//check the checkboxes to see if they have changed
	var gpuEnabled = [
		$("#gpu-checkbox1").is(':checked'),
		$("#gpu-checkbox2").is(':checked'),
		$("#gpu-checkbox3").is(':checked'),
		$("#gpu-checkbox4").is(':checked')
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
			.ease(show ? "elastic": "quad")
			.duration(show ? 1000: 250)
			.delay(function(d, i){
				if (firstRun === true){
					return (750 * d.total_gpus) + (d.total_price/15);
				}
				return (gpuEnabled[d.total_gpus-1] == true ? 1 :0) + (d.total_price/30);
			})
			.attr("visibility", function(d){
				var diff = (xMax - xMin)* CHART_POINT_LEFT_CUTOFF_PERCENT;
				return (d.total_price >= (xMin + diff)) && (d.total_price <= xMax) ? "visible" : "hidden";
			})
			.attr("r", function(d) {		
				//circle radius
				return gpuEnabled[d.total_gpus-1] == true ? pointSize : 0 ;
			})
			.attr("class", function(d){
				if (d.total_gpus > 4) {console.log("Warning: too many GPUs"); console.log(d);}
				return "pc-point " + "gpu" + d.total_gpus;
			});
}

function hideHoverMenu(){
	$("#hover-menu-group").attr("visibility", "hidden")
	
	var softwareItem = d3.select("#software-list").selectAll(".software")
		.select("div")
		.attr("class", "software-no-select")
			.select("img")
			.attr("class", "software-icon")
			.attr("src", NO_SELECT_ICON);	
	//reapply tooltips
	addSoftwareListToolTips();
}

function showHoverMenu(build_id, x, y){
	var MAX_NAME_LENGTH = HOVER_MENU_PARAMS.max_name_length;
	var pc = getPC(build_id);

	$("#hover-menu-group").attr("visibility", "visible");
	$("#hover-menu-group").attr("transform", "translate(" + (x + HOVER_MENU_PARAMS.mouse_offset_x)+ "," + (y - HOVER_MENU_PARAMS.mouse_offset_y - HOVER_MENU_PARAMS.height) + ")");

	var pcNameTruncated = pc.name.length >= MAX_NAME_LENGTH ? pc.name.substring(0, MAX_NAME_LENGTH) + "..." : pc.name;
	var hoverText = document.createElement("title");
	hoverText.innerHTML = pc.name;
	$("#hover-menu-pc-name-label").text(pcNameTruncated);
	$("#hover-menu-pc-name-label").append(hoverText);
	$("#hover-menu-pc-cpu-detail").text("CPU Score: " + pc.total_cpu_score);
	$("#hover-menu-pc-gpu-detail").text("GPU Score: " + pc.total_gpu_score);
	$("#hover-menu-pc-total-price").text("Total Price: $" + pc.total_price);
	$("#hover-menu-button").attr("build",build_id);
	$("#hover-menu-button").click(function(){
		openDetailWindow($("#hover-menu-button").attr("build"));
	});
	$("#hover-menu-button-label").click(function(){
		openDetailWindow($("#hover-menu-button").attr("build"));
	});
	
	updateSoftwareReqList(build_id);
}
function updateSoftwareReqList(build_id){
	var pc = getPC(build_id);

	var new_software_list=[];
	new_software_list = software_req_list;

	//Assign priorities for runnable
	for (var i = 0 ; i < new_software_list.length; i++){
		var software = new_software_list[i];

		if ((pc.total_cpu_score >= software.rec_cpu_bench) && (pc.total_gpu_score >= software.rec_gpu_bench)){
			new_software_list[i].sort_priority = 2;
		}
		else if ((pc.total_cpu_score >= software.min_cpu_bench) && (pc.total_gpu_score >= software.min_gpu_bench)){
			new_software_list[i].sort_priority = 1;
		}
		else{
			new_software_list[i].sort_priority = 0;
		}
	}
	
	//sort by priority, then by total score
	new_software_list = new_software_list.sort(function(a,b){
		var totalScoreA = a.rec_cpu_bench + a.rec_gpu_bench;
		var totalScoreB = b.rec_cpu_bench + b.rec_gpu_bench;
		
		if (a.sort_priority > b.sort_priority) { 
			return 1;
		}
		else if (a.sort_priority < b.sort_priority) { 
			return -1;
		}
		else{
			//tie breaker
			if ( totalScoreA> totalScoreB){
				return -1;
			}
			else if (totalScoreA < totalScoreB){
				return 1;
			}
			else{
				return 0;
			}
		}
		
	});
	
	//replace the software list
	d3.select("#software-list").selectAll(".software").remove();
	var softwareItem = d3.select("#software-list").selectAll(".software").data(new_software_list)
		.enter()
		.append("div")
			.attr("class", "software")
			.append("div")
				.attr("class", function(d){
					if (d.sort_priority == 2){
						return "software-run-rec";
					}
					else if (d.sort_priority == 1){
						return "software-run-min";
					}
					else{
						return "software-no-run";
					}
				});
			
	softwareItem.append("img")
		.attr("class", "software-icon")
		.attr("src", function(d){
			if (d.sort_priority == 2){
				return REC_REQ_ICON;
			}
			else if (d.sort_priority == 1){
				return MIN_REQ_ICON;
			}
			else{
				return NO_REQ_ICON;
			}
		});	
		
	softwareItem.append("div")
		.attr("class", "software-label")
		.html(function(d){ return d.name;});
		

	//apply the Jquery UI tooltips again
	addSoftwareListToolTips();
}

function addSoftwareListToolTips(){
	//add tooltips
	
	$(".software-no-select").attr("title", "No pc selected. Select a PC from the chart.");
	$(".software-no-run").attr("title", "Does not meet minimum requirments");
	$(".software-run-min").attr("title", "Meets minimum requirments");
	$(".software-run-rec").attr("title", "Meets recommended requirements");
	$(document).tooltip({
		show: { effect: "blind", duration: TOOLTIP_SHOWUP_DELAY }
	});
	
}

// this function is to demonstrate how we can bind anything to html elements, not just data!
function createButtons() {

	$("#price-slider").rangeSlider({
		step: SLIDER_PARAMETERS.step,
		bounds: {
			min: SLIDER_PARAMETERS.min,
			max: SLIDER_PARAMETERS.max,
		},
		defaultValues:{
			min: SLIDER_PARAMETERS.init_lower_value, 
			max: SLIDER_PARAMETERS.init_upper_value
		},
		slide: function( event, ui ) {
			
		},
		range: {
			min: SLIDER_PARAMETERS.min_diff, 
			max: SLIDER_PARAMETERS.max*2
		}
	});
	
	$("#price-slider").on("valuesChanging", function(e, data){
		hideHoverMenu();
			console.log(data);
		if (data.values.max - data.values.min < SLIDER_PARAMETERS.min_diff){
			return false;
		}
		
		xMin = data.values.min;
		xMax = data.values.max;
		$("#range-label").html( "$" + data.values.min + " - <br>$" + data.values.max );
		updateVis();
	});
	
	//initialize range label
	$("#range-label").html("$" + SLIDER_PARAMETERS.min + " - <br>$" + SLIDER_PARAMETERS.max);
	$("#price-slider").width(width);
	
	var gpuCheckData = [
		{id:"gpu-checkbox1", label: "1", value: 1},
		{id:"gpu-checkbox2", label: "2", value: 2},
		{id:"gpu-checkbox3", label: "3", value: 3},
		{id:"gpu-checkbox4", label: "4", value: 4}
	];
	
	var checkboxGroup = d3.select("#checkboxes").selectAll(".checkboxGroup")
		.data(gpuCheckData)
		.enter();
	
	checkboxGroup = checkboxGroup.append("div")
	
	//create a list group
	checkboxGroup = checkboxGroup
		.attr("class", "gpu-checkbox-div")
		.attr("id", function(d){return "gpu-checkbox-label" + d.label;})
		.on("click", function(d){
			//change state of the checkbox
			var checkedVal = $("#"+d.id).is(':checked');
			$("#"+d.id).prop('checked', !checkedVal);
			$("#checkbox-img"+d.value).attr("src", !checkedVal ? CHECKBOX_CHECKED_IMG : CHECKBOX_UNCHECKED_IMG)
			//run the update function
			filterVis($("#"+ d.id).is(':checked'));
		});
		
	checkboxGroup.append("label")
		.html(function (d){
			return d.label;
		})
		.append("input")
			.attr("class", "gpu-checkbox")
			.attr("id", function(d){ return d.id})
			.attr("type", "checkbox")
			.attr("checked", "true")
			.on("change", function(d){
				//nothing, see div click event
			});
	checkboxGroup.append("img")
		.attr("class", "checkbox-image")
		.attr("id", function(d){ return "checkbox-img" + d.value;})
		.attr("src", "./images/checkbox-checked.png");
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
		return ele.build_id == build_id;
	});
}
