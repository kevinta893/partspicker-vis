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
	left: 50,
	bottom: 50,
	right: 50
};
var width = 1000 - margin.left * 2;
var height = 500 - margin.top * 2;

var xScale = d3.scale.linear().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().orient("bottom");
var yAxis = d3.svg.axis().orient("left");

//asthetic controls
var pointSize = 4;


//data filters
var min_price = 0;
var max_price = 10000;


formatData(pc_list);
createButtons();
createVis();
updateVis();

function formatData(data) {
	build_list = data;
	
	//narrow the range of PCs by total price 
	var showList = build_list.filter(function (ele, index, arr){
		return (ele.total_price >= min_price) && (ele.total_price <= max_price);
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

//checks if an a build has a particular part type
function hasPart(build, part_type){
	var part = build.parts_list.find(function(ele){
		return ele.part_type === part_type;
	});
	
	return !(typeof part === "undefined");
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
			.append("circle")
			.style("fill", "#ff0000")
			.style("stroke", "#000000")
			.style("stroke-width", 1);
}

function updateVis() {
	// recompute the max value for the x and y and size scales
	var maxValX = d3.max(build_list, function (d) { return +d.total_price;});
	var maxValY = d3.max(build_list, function (d) { return +d.total_price;});
	xScale.domain([0, maxValX]);
	yScale.domain([0, maxValY]);

	
	// here we will change the position and radius of each circle
	root.selectAll(".pc_build").data(build_list)
		.transition()
		.duration(1000)
		.delay(function(d, i){
			return (i/2)*20;
		})
		.attr("transform", function(d) {
			//locate the points
			var xValue = xScale(d.total_price);
			var yValue = yScale(d.total_price);
			return "translate(" +
				xValue + "," + 
				yValue + ")";
		})
		.select("circle")
			.attr("r", function(d) {		
				//circle radius
				return pointSize;
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
	var buttonGroups = d3.select("#buttons").selectAll(".buttonGroup")
		.data(buttonsData).enter()
		.append("span").attr("class", "buttonGroup");
	

	//buttonGroups.append("label").html(function(d){return d.name;});
	


}




















