var build_list;

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
	left: 70,
	bottom: 50,
	right: 50
};
var width = 1000 - margin.left * 2;
var height = 500 - margin.top * 2;

var xScale = d3.scale.linear().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().orient("bottom");
var yAxis = d3.svg.axis().orient("left");

//Asthetic controls
var pointSize = 4;


//Pre-render data filters
var min_price = 1;
var max_price = 10000;

var min_gpu_performance = 1;
var max_gpu_performance = 500000;

var min_cpu_performance = 1;
var max_cpu_performance = 500000;


formatData(pc_list);
createButtons();
createVis();
updateVis();

function formatData(data) {
	build_list = data;
	
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
	console.log("Total complete PCs in Database: " + build_list.length);
	
	
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
			.attr("x", width)
			.attr("y", -6)
			.style("text-anchor", "end");

	// Create Y Axis
	root.append("g")
		.attr("class", "yAxis")
		.call(yAxis)
			.append("text")
			.attr("class", "label")
			.attr("transform", "rotate(-90)")
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
	
	//create list of software
	var softwareItem = d3.select("#software-list").selectAll(".software")
		.data([
			{id:"software1", label: "1"},
			{id:"s0", label: "2"},
			{id:"s2", label: "3"},
			{id:"s4", label: "4"}
		])
		.enter()
		.append("div")
			.attr("class", "software")
			.append("div")
				.attr("class", "software-run-min")
			
	softwareItem.append("img")
		.attr("class", "software-icon")
		.attr("src", "./images/check.png");	
		
	softwareItem.append("div")
		.attr("class", "software-label")
		.html(function(d){ return d.id;});		
		
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
		.transition()
		.duration(1000)
		.delay(function(d, i){
			return 0;
		})
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
			.attr("r", function(d) {		
				//circle radius
				return pointSize;
			})
			.attr("class", function(d){
				var count = d.total_gpus;
				if (count > 4) {console.log("Warning: too many GPUs"); console.log(d);}
				return "gpu" + (gpuEnabled[count-1] == true ? count : "Hidden");
			});


	// update the scales for the x and y axes
	xAxis.scale(xScale);
	yAxis.scale(yScale);
	
	// redraw the axis, ticks, and labels
	root.select(".xAxis").call(xAxis)
		.select(".label").text("Total Price");
	root.select(".yAxis").call(yAxis)
		.select(".label").text("Performance");
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
		.enter()
		.append("label")
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
