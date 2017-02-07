taxonomyBarChart = function module(){
    
    var svg, div, names, stack, xLabels, yStackMax, layers, taxonRank, data;
    
    var margin = { top:50, right:10, left:50, bottom:50},
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
    
    div = d3.select('body').append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    var color = d3.scale.ordinal() .range(["#8dd3c7","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#b15928","#e5c494","#fccde5","#bc80bd","#ccebc5","#ffed6f","#1f78b4"]);
    
    //create a function to export and loop the data
    function exports(_selection){
        _selection.each(function(_data){
          
            d3.select(this).select("svg").remove();
            
            // Add the svg canvas
            svg = d3.select(this).append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr('viewBox','0 0 '+ (width + margin.left + margin.right) + " " + 
                         (height + margin.top +  margin.bottom - 20))
                .attr('preserveAspectRatio','xMinYMin')
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            color.domain(d3.keys(_data[0]).filter(function(key){
                return (key !== "TaxonomyRank" && key != "TaxonomyName" && key != "TaxonomyID" && key != "total" && key!= "values");
            }));
            
       
                taxonRank = _data[0].TaxonomyRank;
            
                _data.forEach(function(d){
                    var sum = 0;
                    d.values = color.domain().map(function(name){
                        sum += parseInt(d[name]);
                        return {
                            taxonName: d.TaxonomyName,
                            x:name,
                            y: parseInt(d[name])
                        }
                    });
                    d.total = sum;
                    //d.total = d.values[0].y;
            });
            
            names = (function(){
                var res = [];
                
                _data.forEach(function(e){
                    res.push(e.TaxonomyName);
                });
                return res;
            });
                
            data = _data;
            stack = d3.layout.stack().offset("expand").values(function(d){return d.values;});
                //.offset("expand")

            drawStackBars(_data);

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
                .text("Per");
                */
            svg.append("text")
                .attr("x", (width / 2))             
                .attr("y", 2 - (margin.top /2))
                .attr("text-anchor", "middle")
                //.style("opacity", "0.8")
            	.style("font-family", "FontAwesome")
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .text(taxonRank.toUpperCase());

        }); //end of selection
    }//end of exports
    
    function drawStackBars(_data){
        
         var layers = stack(_data),
		 xLabels = (function(){
			var res = [];
			
			_data[0].values.forEach(function(e){
				res.push(e.x);
			});
			
			return res;
		})(),
		yStackMax = d3.max(layers, function(layer) { return d3.max(layer.values, function(d) { return d.y0 + d.y; }); });
            
            
        x.domain(xLabels);
        //y.domain([0, yStackMax]);
          y.domain([0,1]);
        var layer = svg.selectAll(".layer")
            .data(layers)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", function(d){
               return color(d.TaxonomyName);
            });
 
        var rect = layer.selectAll("rect")
            .data(function(d){
                return d.values;
            })
            .enter().append("rect")
            .attr("x", function(d){ return x(d.x) + 7; })
            .attr("y", height)
            .attr("class", function(d){return (taxonRank +' ' +d.taxonName.replace(/\s+/g, '')); })
            .attr("id", function(d){ return (d.x + '-'+  + taxonRank+ '-' + d.taxonName.replace(/\s+/g,'_')); })
            .attr("width", x.rangeBand() -10 )
            .attr("height", 0)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

            rect.transition()
            .ease("bounce")
                .duration(800)
                .attr("y", function(d){ return y(d.y0 + d.y); })
            .attr("height", function(d){ return y(d.y0) - y(d.y0 + d.y); });

    }// end of drawStackBars()

    function mouseover(){
        
        var rectClass = "."+taxonRank;
                d3.selectAll(rectClass)
                    .transition()
                    .duration(500)
                    .style("opacity", 0.3);

                var rectId = this.id.split('-');
                var taxonClass = "." + rectId[2];

                d3.selectAll(taxonClass)
                    .transition()
                    .duration(500)
                    .style("opacity", 1);

                //show tooltip 
                div.transition()
                    .duration(500)
                    .style("opacity", 1);

                div.html("Taxon Name : " +rectId[2])
                    .style("left",  function(d){
                          var w = d3.select(this).node().clientWidth;
							if( +d3.event.pageX + w > width){
								return (+d3.event.pageX -10- w) +"px";
							}else{
								return (+d3.event.pageX + 20) +"px";
							}
                    })
                    //Position of pointer from tooltip from left
                    .style("top",  (d3.event.pageY - 20) + "px"); 
        
    }
    
    function mouseout(){
        
        var rectClass = "."+taxonRank;

                d3.selectAll(rectClass)
                    .transition()
                    .duration(500)
                    .style("opacity", 1);

                //hide tooltip 
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
    }
    //d3.selectAll("input").on("change", inputClick);
    
    function inputClick(){
            if(this.value === "bypercent"){
                transitionPercent();
            }else{
                transitionCount();
            }
    }
    
    //transition to percent 
    function transitionPercent(){
        
        y.domain([0,1]);
        stack = d3.layout.stack().offset("expand").values(function(d){return d.values;});
    
        drawStackBars(data);
        //change y axis
        yAxis.tickFormat(d3.format(".0%"));
        svg.selectAll(".y.axis").call(yAxis);
    }
    
    function transitionCount(){
            
        stack = d3.layout.stack().values(function(d){return d.values;});
        
        drawStackBars(data);
		// change the y-axis
		// set the y axis tick format
         //y.domain([0, yStackMax]);
		yAxis.tickFormat(d3.format("s"));
		svg.selectAll(".y.axis").call(yAxis);  
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