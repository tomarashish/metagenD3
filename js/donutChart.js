donutChart = function module(){
    
    var svg, pie, arc, div, taxonLevel, data;
    
    var margin = { top:5, right:50, left:30, bottom:20},
        width = 300 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom,
        radius = Math.min( width  , height) / 3,
        innerRadius = radius,
        outerRadius = radius - 45;
    
    var color = d3.scale.ordinal() .range(["#8dd3c7","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#b15928","#e5c494","#fccde5","#bc80bd","#ccebc5","#ffed6f","#1f78b4"]);
   
   pie = d3.layout.pie()
                .sort(null)
                .value(function(d){
                    return d.total;
                });
    
            arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

    div = d3.select('body').append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
   //create a function to export and loop the data
    function exports(_selection){
        _selection.each(function(_data){
            
            data = _data;
            taxonLevel = _data[0].TaxonomyRank.toUpperCase();
            var taxonCount = _data.length;  
            
            color.domain(d3.keys(_data[0]).filter(function(key){
                return (key !== "TaxonomyRank" && key != "TaxonomyName" && key != "TaxonomyID" && key != "total" && key!= "values" );
            }));
            
            d3.select(this).select('svg').remove();
            
            // Add the svg canvas
            svg = d3.select(this).append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr('viewBox','0 0 '+ (width + margin.left + margin.right) + " " + 
                         (height - 35 -  margin.bottom))
                .attr('preserveAspectRatio','xMidYMid')
                .append("g")
                 .attr("transform", "translate(" + width/3 +  "," + height /2 + ")");
            
            var taxonArc = svg.selectAll(".arc")
              .data(pie(_data))
            .enter().append("g")
              .attr("class", function(d){ return "arc" +' '+ taxonLevel.toLowerCase() +' ' +d.data.TaxonomyName.replace(/\s+/g, ''); });

            taxonArc.append("path")
                .attr("d", arc)
                .attr("id", function(d){return taxonLevel.toLowerCase() +'-' +d.data.TaxonomyName.replace(/\s+/g, '_'); })
                .style("fill", function(d) { return color(d.data.TaxonomyName); })
                .style("cursor", "hand")
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("click", _clickArc);
            
            //append circle insode donut to create a click event for 
            // selecting all arcs and taxon data
            taxonArc.append("circle")
                .attr("id", "all-circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", 25)
                .attr("fill", "#ffed6f")
                .style("cursor", "hand")
                .on("click", _clickCircle);
            
            //Draw top taxon legends
            drawTopTaxon();
            
            // Append text on all-circle button
            svg.append("text")
               .attr("x", -8)
               .attr("y", height - 272)
               .style("cursor", "hand")
               .style("font-family", "sans-serif")
               .style("font-size", "10px")
               .style("font-weight", "bold")
               .text("All")
               .on("click", _clickCircle);
            
            //Append a text on svg for level
            svg.append("text")
               .attr("x", 50)             
               .attr("y",  - (height - 160) )
               .attr("text-anchor", "middle")
               .style("font-family", "FontAwesome")
               .style("opacity", "0.8")     
               .style("font-size", "9px")
               .style("font-weight", "bold")
               .text("Taxon Level : " +  taxonLevel );
            
            // Append a text for number of levels in taxon
            svg.append("text")
               .attr("x", 5)
               .attr("y", -(height - 185))
               .attr("text-anchor", "middle")
                .style("font-family", "FontAwesome")
                .style("opacity", "0.7")
               .style("font-size", "8px")
               .style("font-weight", "bold")
               .text(" No Of " + taxonLevel + " : " + taxonCount  );
            
            // Append a text for number of levels in taxon
            svg.append("text")
               .attr("x", 110)
               .attr("y", -(height - 185))
               .attr("text-anchor", "middle")
                .style("font-family", "FontAwesome")
                .style("opacity", "0.7")
               .style("font-size", "9px")
               .style("font-weight", "bold")
               .text(" Top 10 sequence");
            
        }); //end of selection
    }//end of exports
    
    function mouseover(){
                    
        // Change opacity of all rect and arc with class of taxonlevel
        var rectClass = "." + taxonLevel.toLowerCase();
        d3.selectAll(rectClass)
            .transition()
            .duration(500)
            .style("opacity", 0.3);

        //Use 
        var arcClass = "."+this.id.split("-")[1];
                     
        d3.selectAll(arcClass)
            .transition()
            .duration(500)
            .style("opacity", 1);
              
        //div tooltip
        div.transition()
            .duration(500)
            .style("opacity", 1);
         
        div.html("Taxon Name : " + this.id.split("-")[1] )
            .style("top", (d3.event.pageY + 5) + "px")
            .style("left", (d3.event.pageX + 5) + "px" );
                      
    }// end of mouseover
    
    function mouseout(){
              
        d3.selectAll("." + taxonLevel.toLowerCase())
            .transition()
            .duration()
            .style("opacity", 1);
        
        //tooltip 
        div.transition()
            .duration(500)
            .style("opacity", 0);
              
    }//end of mouseout
    
    function drawTopTaxon(){
        
        var tempData =  jQuery.extend([], data);
            var topTaxon = [];
            
            //Append legend for top 10 abundant taxon
            tempData.sort(function (a, b) {
				return b.total - a.total;
			});
            
            for(var i =0; i < 10; i++){
               topTaxon.push(tempData[i].TaxonomyName);
            }
            
            var legend = svg.selectAll(".legend")
                .data(topTaxon)
                .enter().append("g")
                .attr("class", "legend")
                .attr("id", function(d){ return "legend-" + d; })
                .attr("transform", function (d, i) { return "translate(-140," + (i * 11 - 50) + ")"; })
                .on("click", _clickArc);
    
            legend.append("rect")
                .attr("x", width )
                .attr("width", 10)
                .attr("height", 6)
                .style("fill", function(d){ return color(d); })
                .style("stroke", function(d){ return color(d); });
            
            legend.append("text")
                .attr("x", width + 15)
                .attr("y", 5)
                .attr("dy", ".35em")
                .style("opacity", "0.75")
                .style("font-family", "FontAwesome")
                .style("font-size", "8px")
                //.style("fill",function(d) { return color(d); } )
                .text(function (d) { return d; });
            
    } //end of drawtoptaxon()
    
    
    function _clickCircle(){
        
        var taxBar = taxonomyBarChart();
       
        var areaId = "#" + taxonLevel.toLowerCase() + "Stack";
        // Remove previos svg element
        d3.select(areaId).select("svg").remove();
        var containerBar = d3.select(areaId)
           .datum(data)
           .call(taxBar);
    }   //end of circleClick()
    
    function _clickArc(){
        
        var taxonName,
            arcId = this.id.split("-");
        
        if( arcId.length > 2){
            
            arcId.shift();
            taxonName = arcId.toString().replace(/,/g,'-');
            
        }else{
            taxonName = arcId[1];
        }
   
        var areaId = "#" + taxonLevel.toLowerCase() + "Stack";
        var barData = [];
        var fill = this.style.fill;
        if(!fill){
            fill = d3.select(this)[0][0].childNodes[0].style.fill;
        }
       
        data.forEach(function(objData){
            
            if(objData.TaxonomyName == taxonName){
                for( var i =0; i < objData.values.length; i++){
                    
                    var sampleName = objData.values[i].x;
                    var value = objData.values[i].y;
                    barData.push({ name : sampleName, taxonRank: taxonLevel, taxonName: taxonName, color: fill, "value": value});
                }
            }
        });
  
        
        if(barData.length > 0){
            d3.select(areaId).select("svg").remove();
            var taxBar = taxonBar();  
            var containerBar = d3.select(areaId)
                .datum(barData)
                .call(taxBar);
        }
    }//end of _clickArc()
    
    
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