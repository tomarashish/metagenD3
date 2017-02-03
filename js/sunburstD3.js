/*jslint devel: true, debug: true, evil: false, sloppy: false, todo: true, indent: 4, maxlen: 75, maxerr: 50*/
sunburstD3 = function module() {

    if (window.d3 === undefined) {
        throw 'd3.js library is not found';
    }
    
    //Initializing variables
    var svg, div, path, node, trail,trail_width, pngSvg;
    
    var hue = d3.scale.category10();

    var luminance = d3.scale.sqrt()
        .domain([0, 1e6])
        .clamp(true)
        .range([90, 20]);
    
    // Layout variables using current size of chart
    var $chart_container = $(this),
        width =  $chart_container.width() ,
        height = $chart_container.width(),
        radius = Math.min(width, height) / 2;

    //Setting breadcrumbs point for drawing svg polygon 
    var b = {
        w: 0, h: 30, s: 5, t: 5
    };
      
    // setting d3 partition layout 
    var partition = d3.layout.partition()
            .sort(null)
            .value(function(d) { return d.mean; });
    
    // x axis linear scale, change to sqrt to change arc angle
    var x = d3.scale.linear()
            .range([0, 2 * Math.PI]);

    // y axis sqrt scale, change to linear scale to 
    // make inner angele of arc smaller
    var y = d3.scale.linear()
           .range([0, radius]);

    // Setting deafault d3 color category 
    var color = d3.scale.category20();
    
    // Custom color category 
    //var colors = d3.scale.ordinal()
                    //.range(["#5687d1","#7b615c","#de783b","#6ab975","#a173d1","#bbbbbb"]);
    
    // Setting arc start & end angle and inner & outer radius
    // Setting corner radius is option can be commented. 
    // Corner radius property is to give a different look 
    // to arcs i.e. rounded corners.
    var arc = d3.svg.arc()
                .startAngle(function(d){ 
                    return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
                .endAngle(function(d) { 
                    return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
                .innerRadius(function(d) { return Math.max(0, y(d.y)); })
                .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
                //.cornerRadius(function(d) { return 8}); //http://bl.ocks.org/mbostock/b7671cb38efdfa5da3af
    
    // create function to export and loop the data
    function exports(_selection){
        _selection.each(function(_data){ 
            
            d3.selection.prototype.dblTap = function(callback) {
                var last = 0;
                return this.each(function() {
                        d3.select(this).on("touchstart", function(e) {
                        if ((d3.event.timeStamp - last) < 500) {
                            return callback(e);
                        }
                        last = d3.event.timeStamp;
                    });
                });
            }
            
            // Keep track of the node that is currently being displayed as the root.
            // variable needed to reset all charts. 
            node = _data;
    
            // Filtering the data which have 0 mean
            /* var nodes = partition.nodes(_data)
                            .filter(function(d) {
                                //console.log(d.mean);
                            return (d.mean > 0 ); 
                        });
            
            */
            // initalizing breadcrumbtrail to represent the hierarchy 
            // of nodes from parent till current selection. 
            _initializeBreadcrumbTrail();
            //  Remove svg, if already exist
            d3.select(this).select('svg').remove();
            
            //d3 tooltip
            div = d3.select('body') //select tooltip div over body
                .append("div") 
                .attr("class", "tooltip")
                .style("opacity", 0);
            
            // Add the svg canvas
            svg = d3.select(this).append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr('viewBox','0 0 '+ Math.min(width,height)+' '+Math.min(width,height))
                .attr('preserveAspectRatio','xMinYMin')
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + (height / 2 ) + ")");

            //Creating a svg path with passed root node 
            this.path = svg.datum(_data).selectAll("path")
                    .data(partition.nodes)
                    .enter().append("path")
                    .attr("d", arc)
                    .style("cursor", "pointer")
                    .attr("stroke-width", 1)
                    .attr("stroke", "#FFF")
                    .style("fill", getColor)
                    .each(stash);    //Adding stash method for selection of data (selection of d.mean) 
                    
            // If device supports touch event
            // Show tooltip on click/tap event
            // Zoom the arc on double tap event
            if(isTouchSupported){	
                
                this.path
                    .on("click", function(d){
                                    d3.selectAll('#div').style("visibility", "hidden");
                                     _mouseover(d); 
                            })
                    .dblTap(function(d){
                    
                        //To stop window zooming on double tap
                       d3.event.preventDefault();
                        _clickArc(d);
                })
            }
            
            //For non touch device
            // Show tooltip on mouseover 
            // Zoom the arc on mouse click event
            if(!isTouchSupported){
                
                this.path
                    .on("click", _clickArc)
                    .on("mouseover", _mouseover)
                    .on("mouseout", _mouseout);
            }
            
            // Creating an array of chart object
            chartObj.push(this);
        
            // Creating click event on the save button of sample charts
                
            // Getting the chart div element id and replacing the "sample" suffix 
            // with the "save" suffix to dynamically get the save button id for 
            // particular chart div (e.g. sampleChart to saveChart).
            var id = "save" + this.id
              
            //As the id is without the # so appending the # for making d3 selection 
            var saveChartId = "#"+ id;
            //selction of chart div and binding click to exportAsImage 
            d3.select(saveChartId).on("click", exportAsImage);
    });
    }//End of export

    // D3 selction for dropdown input element
    // Selecting all input radio buttons and changing the data 
    // for all charts with respected radio button data selection.
    // Data selection have two option 1. creating d3 partion with default size
    // and 2. creating the partition with mean value of data
    d3.selectAll("input").on("change", function change() {
    
        //Getting the value from selection
        // If radio option selection value is size return 1 
        // else return d.mean
        var value = this.value === "size"
                    ? function() { return 1; }
                    : function(d) { return d.mean; };
        
        // Iterating over all the objects to change partition value
        // for change in data selection
        chartObj.forEach(function(obj){
            
            obj.path
                .data(partition.value(value).nodes)
                .transition()
                .duration(1000)
                .attrTween("d", arcTweenData);
            });
     });
        
    
    function stash(d) {

      this.x0 = d.x;
      this.dx0 = d.dx;
  
    }
    
    // When switching data: interpolate the arcs in data space.
    function arcTweenData(a, i) {
    var i = d3.interpolate({x: this.x0, dx: this.dx0}, a);
        return function(t) {
            var b = i(t);
            this.x0 = b.x;
            this.dx0 = b.dx;
            return arc(b);
        };
    }
    
    //Setting reset and image save button as d3 element
    $('#reset').on('click', _resetZoom);
    
    // Click function to zoom in or zoom out based on 
    // situation of current node
    function _clickArc(d) {
        
        //transition for main graphs
        // Iterate through all the graph object and serach for id
        // of the clicked node in other objects
        chartObj.forEach(function(obj){
    
            // Get the node path for each chart object
            newPath = getNodePath(obj.__data__, d.id);
         
            //check for the newpath variable
            if(newPath){
                    
                    obj.path
                        .transition()
                        .duration(1000)
                        .attrTween("d", arcTween(newPath));
                }

        });
            
        //Getting array of name for breadcrumbs trail
        var seqArray = getAncestor(d);
        current_breadcrumbs = seqArray;
        
        // Update breadcrumbs for a click made on any sunburst 
        // Such that the pattern changed in reference sunburst represents 
        // the breadcrumbs
        _updateBreadcrumbs(seqArray);    
    }
    
    // To get path of node of each chart
    // Receives two argument 1 : data obejct and
    // 2 : id to be searched i.e. clicked node
    function getNodePath(dataObj, searchId){
        
        // Check for id of clicked node and current chart object data
        if(searchId === dataObj.id ){
            
            return dataObj;
        }
        else{
            if(dataObj.children){
                
                for( var i = 0; i < dataObj.children.length; i++){
                    var path = getNodePath(dataObj.children[i], searchId);
                    
                    if(path){
                        return path;
                    }
                
                }
            }
        }
    }

    //Reset all charts from zoom level to root node 
    function _resetZoom() {
        
        //Selection all path and passing root node to reset all charts
       
        d3.selectAll("path")
            .transition()
            .duration(1000)
            .attrTween("d", arcTween(node));
        
        //On reset chart hide breadcrumb trail
        d3.select("#trail")
                .style("visibility", "hidden");
        
        // On reset chart clear current_breadcrumbs variable 
        current_breadcrumbs = "";
    }
    
    function _mouseover(d){
       
        div.transition()
				.duration(500)	
				.style("opacity", 0);
        div.transition()
            .duration(200)
            .style("opacity", .8);
        
        //Adding name , id and ncbi link to taxon id
        div.html('<b>'+"Name : " + d.name + '<br>' 
                + '<a href="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' 
                + d.id + "\" >" + "NCBI TaxID : "+ d.id + "</a>" + '<br> Mean : ' 
                + d.mean + '</b>')
            .style("left", (d3.event.pageX + 8)+ "px")   //Position of pointer from tooltip from left
            .style("top",  (d3.event.pageY - 20) + "px"); //Position of pointer from tooltip from top

        //fade all the segment of arc on mouseover
        // Activate the once which are acncestor of current node
        chartObj.forEach(function(obj){
        
            obj.path
                .style("opacity", .2);
            
        });
        
        //Get ancestor of current node 
        var seqArray = getAncestor(d);

        //updating breadcrumbs
         _updateBreadcrumbs(seqArray);
 
        chartObj.forEach(function(obj){ 
            
            
            var newPath = getNodePath(obj.__data__, d.id);
            seqArray = getAncestor(newPath);
            
            if(newPath.mean != 0){
                obj.path
                    .filter(function(newPath){
                        return (seqArray.indexOf(newPath) >= 0);})
                    .style("opacity", 1);
            }
        });   
    }//end of mouseover

    //mouseout 
    function _mouseout(d){
         
         div.transition()
                .duration(10)
                .style("opacity", 0);	 //The tooltip disappears
        
        // Transition each segment to full opacity and then reactivate it.
        d3.selectAll("path")
            .style("opacity", 1);
        
        // Hide the breadcrumb trail
        if(!current_breadcrumbs){
            d3.select("#trail")
                .style("visibility", "hidden");
        }else{
             _updateBreadcrumbs(current_breadcrumbs);   
        }
    }//end of mouseout
    
    //Get ancestor of a child
    //Return a array of elements containing the names from root till current level
    function getAncestor(node){
        
        var path = [];
        var current = node;
        
        // Itterating over the node and creating an array of names 
        // starting with root / first parent  
        while(current.parent){
            path.unshift(current) 
            current = current.parent;
        }
        return path;
    }

    //funcntion to initializ breadcrumbs
    function _initializeBreadcrumbTrail(){
        
        //Setting height and width for breadcrumbtrail on #sequence
        var $trail_container = $("#sequence");
        
            trail_width =  $trail_container.width(),
            trail_height = $trail_container.height();
        
        $("#sequence").empty();
        trail = d3.select("#sequence").append('svg')
            .attr("width", 1400)   //hardcoded 1400 px. To be fixed later (current window size and dynamically adding each breadcrumbs width)
            .attr("height", 50)
            .attr('viewBox','0 0 '+ Math.min(trail_height,trail_width)+' '+Math.min(trail_height,trail_width))
            .style("overflow-x","scroll")
            .attr('preserveAspectRatio','xMinYMin')
            .attr("id", "trail");  
    }//end of  _initializeBreadcrumbTrail

    // Generate a string that describes the points of a breadcrumb polygon.
    function breadcrumbPoints(d, i) {
        var points = [];

        //Normalization of width acc. to length of text 
        //with increase in font size increase the multiplier number
        var length_norm_factor = 9;
        
        b.w = length_norm_factor * d.name.length ;
        
        points.push("0,0");
        points.push(b.w + ",0");
        points.push(b.w + b.t + "," + (b.h ));    //remove this to make breadcrumbs square
        points.push(b.w + "," + (b.h));
        points.push("0," + (b.h));
    
        // Commenting following line for vertical breadcrumbs format
        if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
            points.push(b.t + "," + (b.h ));
        } 
 
        return points.join(" ");
    }//end of breadcruumbPOints

    //Click function for breadcrumbs
    function clickBreadcrumb(d){
    
        /* If node is having depth more than 1 we need to redraw the sunburst. 
           Get the ancestor of current node and update the breadcrumbs   
        */
        if(d.depth > 1){
        // On click of a breadcrumb element redraw the sunburst 
        // with current node in center
    
        _clickArc(d);
            /* Redraw breadcrumbs till the current node
               In case to see the ancestory till parent node pass
               the d.parent instead of d 
            */
            
            var new_child = getAncestor(d);
            current_node = d;
            // Update the breadcrumbs from root till the clicked node
            _updateBreadcrumbs(new_child);
        }
    
        /*  If node is having depth 1 or less than one, reset the path to 
            root node as we cannot see any effect on click of last node.
            In this case we need not update the breadcrumbs
        */
        if(d.depth <= 1){
            //Get the parent/ root node and reset the path
            _clickArc(d.parent);
            $("#trail").empty();
        }
    
    }//end of clickbreadcrumbs
    
function _updateBreadcrumbs(nodeArray){
    var translate = 0;
    
    // Data join; key function combines name and depth (= position in sequence).
    var g = d3.select("#trail")
        .selectAll("g")
        .data(nodeArray, function(d) { return d.name + d.depth; });
    
   /* Add breadcrumb and label for entering nodes.
      Adding a click event on breadcrumbs polygon to redraw the sunburst 
      with current or click node in center.
    */
    var entering = g.enter().append("g");
        entering.append("polygon")
            .attr("points", breadcrumbPoints)
            .style("cursor", "pointer")
            .style("fill", getColor)
            .on("click", function(d){ clickBreadcrumb(d) });
    
    //Passing normalized value to attr x for setting text to polygon
    entering.append("svg:text")
            .attr("x", function (d) {  return (( d.name.length * 9 + b.t ) / 2); })
            .attr("y", (b.h) / 2)
            .attr("dy", "0.35em")
            .style("font-size", 15 + "px")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.name;
        });
    
     //polygonWidth = translate;
     //if(polygonWidth > trail_width){ trail_width = polygonWidth};
    
    // Set position for entering and updating nodes.
        g.attr("transform", function(d) {
            var str = "translate(" + translate + ", 0)"
            translate += d.name.length * 9   + b.t;
            return str;
        });
   
    
    g.exit().remove();

  // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
      .style("visibility", "");
    
}
    
// Interpolate the scales!
function arcTween(d) {
    
    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(y.domain(), [d.y, 1]),
        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
    return function(d, i) {
        return i 
          ? function(t) { return arc(d); }
        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
    };
}
    
// Function to get same color for child based on color of parent. 
// Using d3.hsl as color palette
function getColor(d) {
  
    if(d.depth == 0){
        return "white";
    }
    var fadeColor = 1;
    
    while (d.depth > 2){d = d.parent;}
    var c = d3.lab(color(d.name))
    //.brighter();
    return c;
}

/*
function colour(d) {
  if (d.children) {
    // There is a maximum of two children!
    var colours = d.children.map(colour),
        a = d3.hsl(colours[0]),
        b = d3.hsl(colours[1]);
    // L*a*b* might be better here...
    return d3.hsl((a.h + b.h) / 2, a.s * 1, a.l / 1);
  }
  return d.colour || "#fff";
}
*/
//Saving the svg element as png on save button 
function exportAsImage(){
    
    // variable for image name
    var chartName, svg ;
  
    // Getting svg name from this.id, replacing this.id by save
    // save prefix is for button and replacing it with sample to
    // get the svg chart div name 

    var id = this.id.replace("save","");
    chartName = this.value; 
    var chartId = "#"+ id + ' ' +'svg';
    svg = document.querySelector( chartId );
    
    var svgData = new XMLSerializer().serializeToString( svg );
    
    var canvas = document.createElement( "canvas" );
    var ctx = canvas.getContext( "2d" );
 
    canvas.height = height;
    canvas.width = width;
    var dataUri = '';
    dataUri = 'data:image/svg+xml;base64,' + btoa(svgData);
 
    var img = document.createElement( "img" );
    img.onload = function() {
        ctx.drawImage( img, 0, 0 );
        
            // Initiate a download of the image
            var a = document.createElement("a");
    
            a.download = chartName + ".png";
            a.href = canvas.toDataURL("image/png");
            document.querySelector("body").appendChild(a);
            a.click();
            document.querySelector("body").removeChild(a);
 
            // Image preview in case of "save image modal"
            
            /*var imgPreview = document.createElement("div");
              imgPreview.appendChild(img);
              document.querySelector("body").appendChild(imgPreview);
            */
    };
    
    img.src = dataUri;
}
    
    //export function to modules
    exports.width = function(_){
        if(!argument.length) return width;
        width = _;
        return exports;
    }
    
    exports.height = function(_){
        if(!argument.length) return height;
        height = _;
        return exports;
    }
    
    exports.name = function(_){
        if(!argument.length) return name;
        name = _;
        return exports;
    }
    
    exports.mean = function(_){
        if(!argument.length) return mean;
        mean = _;
        return exports;
    }
    
    exports.options = function(_data){
        if(!arguments.length) return options;
        options = _data;
        return options;
    }
    //d3.rebind(exports, dispatch, "on");
    return exports;
    
}
