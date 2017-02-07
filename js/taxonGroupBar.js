taxonGroupBar = function module(){
    
    var margin = { top:0, left:100, right:90, bottom:0},
        width = 550 - margin.left - margin.right,
        height = 50;
    
    var svg, data;
    
    var x = d3.scale.linear()
        .range([0, width]);
    
    var y = d3.scale.ordinal()
        .rangeRoundBands([0, height])
     
    var stack = d3.layout.stack();
    
    var color = d3.scale.ordinal() .range(["#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#b15928","#e5c494","#fccde5","#bc80bd","#ccebc5","#ffed6f","#1f78b4"]);
    
  //create a function to export and loop the data
    function exports(_selection){
        _selection.each(function(_data){
           
            data = _data;
            stack(_data);
            
            x.domain([0, d3.max(_data, function(d){
                return d3.max(d, function(d){
                    return d.y0 + d.y;
                });
            })]);
            
            y.domain(d3.range(_data[0].length));
            
            svg = d3.select(this).append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 "+ (width + margin.left + margin.right) + " " + 
                         (height + margin.top +  margin.bottom))
                .attr("preserveAspectRatio", "xMidYMid")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            var groups = svg.selectAll("g")
                .data(_data)
                .enter()
                .append("g")
                .style("fill", function(d, i){ return color(i); });
            
            var rects = groups.selectAll("rect")
                .data(function(d){
                    return d;
                })
                .enter()
                .append("rect")
                .attr("x", function(d){
                    return x(d.y0);
                })
                .attr("y", 20)
                .attr("height", 20)
                .attr("width", function(d){
                    return x(d.y);
                });

            var groupName = ["Group1_A", "Group1_B"];
            
            var legend = svg.selectAll(".legend")
            .data(groupName)
          .enter().append("g")
            .attr("class", "legend")
            .attr('id',function(d){ return d.replace(/\s+/g, ''); })
            .attr("transform", function (d, i) { return "translate(50," + i * 20 + ")"; });
            
             legend.append("rect")
           .attr("x", width - 20)
            .attr("width", 15)
            .attr("height", 10)
            .style("fill",function(d,i) { return color(i); } )
            .style("stoke",function(d,i) { return color(i); } );

        legend.append("text")
            .attr("x", width )
            .attr("y", 5)
            .attr("dy", ".35em")
            .style("font-size", "8px")
            .text(function (d) { return d; });
            
             svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", 7)
                .attr("text-anchor", "middle")
                //.style("opacity", "0.8")
            	.style("font-family", "FontAwesome")
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .text("Experiment Group");
            
        })//end of selection
    }//end of exports
    
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
    
    return exports;
}//end of module