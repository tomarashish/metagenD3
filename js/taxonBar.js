taxonBar = function module(){
    
    var div, svg;
    
    var margin = {top:50, right:10, left:50, bottom:50},
        width = 500 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;
    
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0.5);
    
    var y = d3.scale.linear()
        .range([height, 0]);
    
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(6)
        .tickFormat(d3.format("0%"));
    
    div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
     
     var color = d3.scale.ordinal() .range(["#8dd3c7","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#b15928","#e5c494","#fccde5","#bc80bd","#ccebc5","#ffed6f","#1f78b4"]);
    
     function exports(_selection){
        _selection.each(function(_data){
       
            x.domain(_data.map(function(d){ return d.name}));
            //y.domain([0, d3.max(_data, function(d) {return d.value;})]);
            y.domain([0,1]);
            
            var key = function(d) {
	               return d.name;
               };
           
            var taxonRank = _data[0].taxonRank;
            var taxonName = _data[0].taxonName;
            
            svg = d3.select(this).append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 "+ (width + margin.left + margin.right) + " " + 
                         (height + margin.top +  margin.bottom - 20))
                .attr("preserveAspectRatio", "xMidYMid")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            svg.selectAll(".bar")
              .data(_data)
              .enter().append("rect")
              .attr("class", "bar")
              //.attr("id", function(d){ return 'bar-' + d.name + "-" + d.value;})
              //.on("mouseover", mouseover)
              //.on("mouseout", mouseout)
              .attr("x", function(d) { return x(d.name); })
              .attr("width", x.rangeBand())
              .transition()
              .ease("bounce")
              .duration(800)
              .attr("y", function(d) { return y(d.value); })
              .attr("height", function(d) { return height - y(d.value); })
              .attr("fill", function(d){ return d.color});
        
             svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0, "+height+")")
                .style("opacity", "0.8")
                .style("font-family", "FontAwesome")
                .style("font-weight", "bold")
                .style("font-size", "8px")
                .call(xAxis);
            
            svg.append("g")
                .attr("class", "y axis")
                .style("opacity", "0.8")
                .style("font-family", "FontAwesome")
                .style("font-size", "7px")
                .call(yAxis);
                /*.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 5)
                .attr("dy", ".71em")
                .style("opacity", "0.6")
                .style("font-family", "FontAwesome")
                .style("font-size", "8px")
                .style("text-anchor", "end")
                .text("Total Count");*/

            svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", 2 - (margin.top /1.5))
                .attr("text-anchor", "middle")  
                .style("font-family", "FontAwesome")
                .style("font-size", "8px")
                .style("font-weight", 'bold')
                .text("Taxon Rank : " + taxonRank);
            
            svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", 2 - (margin.top /2))
                .attr("text-anchor", "middle")
                .style("font-family", "FontAwesome")
                .style("font-weight", 'bold')
                .style("font-size", "7px")
                .text("Taxon Name : " + taxonName );
            
        }); //end of selection
    } //end of export
    
    function mouseover(){
        
        div.transition()
            .duration(750)
            .style("opacity", 1);
        
        var barId = this.id.split("-");
        var name = barId[1],
            count = barId[2];
        
        div.html("sample Name : " + name + "<br/>" + "Count : " + count)
            .style("top", (d3.event.pageY ) + "px")
            .style("left", (d3.event.pageX ) + "px");
        
    }
    function mouseout(){
    
        div.transition()
            .duration(750)
            .style("opacity", 0);
        
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
    exports.yAxis = function(_){
        if(!arguments.length) return yAxis;
        yAxis = _;
        return exports;
    }
    
    return exports;
}