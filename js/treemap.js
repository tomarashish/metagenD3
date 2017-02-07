treeMap = function module(){

    var margin = {top: 20, right: 20, bottom: 10, left: 10},
          width = 700 - margin.left - margin.right,
          height = 330 - margin.top - margin.bottom,
          formatNumber = d3.format(",d"),
          transitioning;

      /* create x and y scales */
      var x = d3.scale.linear()
      .domain([0, width])
      .range([0, width]);

      var y = d3.scale.linear()
      .domain([0, height])
      .range([0, height]);

      var treemap = d3.layout.treemap()
      .children(function(d, depth) {
        return depth ? null : d._children;
      })
      .sort(function(a, b) { return a.value - b.value; })
      .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
      .round(false);

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    var color = d3.scale.ordinal() .range(["#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#b15928","#e5c494","#fccde5","#bc80bd","#ccebc5","#ffed6f","#1f78b4"]);

    var svg, root, taxonData, grandparent ;

    // create function to export and loop the data
    function exports(_selection){
        _selection.each(function(_data){ 
            root = _data;
    
            //  Remove svg, if already exist
            d3.select(this).select('svg').remove();
            
            /* create svg */
             svg = d3.select(this).append("svg")
                .attr("width","100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 "+ (width + margin.left + margin.right) + " " + 
                         (height + margin.top +  margin.bottom))
                .attr("preserveAspectRatio", "xMidYMid")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .style("shape-rendering", "crispEdges");
        
             grandparent = svg.append("g")
                .attr("class", "grandparent");

           /*grandparent.append("rect")
              .attr("y", -margin.top)
              .attr("width", width)
              .attr("height", margin.top);

           grandparent.append("text")
              .attr("x", 6)
              .attr("y", 6 - margin.top)
              .attr("dy", ".75em");
            */
            initialize(root);
            accumulate(root);
            layout(root);
            display(root);
            
        });
    }//end of exports

    function getColor(d) {
        
        if(d.depth == 0){
            return "grey";
        }
        var fadeColor = 1;
        //console.log(d);
        while (d.depth > 2){d = d.parent;}
       
        var c = d3.lab(color(d.name))
        //.brighter();
        return c;
    }

  function initialize(root) {
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
  }

  // Aggregate the values for internal nodes. This is normally done by the
  // treemap layout, but not here because of our custom implementation.
  function accumulate(d) {
    return (d._children = d.children)
    ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
    : d.value;
  }

  // Compute the treemap layout recursively such that each group of siblings
  // uses the same size (1×1) rather than the dimensions of the parent cell.
  // This optimizes the layout for the current zoom state. Note that a wrapper
  // object is created for the parent node for each group of siblings so that
  // the parent’s dimensions are not discarded as we recurse. Since each group
  // of sibling was laid out in 1×1, we must rescale to fit using absolute
  // coordinates. This lets us use a viewport to zoom.
  function layout(d) {
    if (d._children) {
      treemap.nodes({_children: d._children});
      d._children.forEach(function(c) {
        c.x = d.x + c.x * d.dx;
        c.y = d.y + c.y * d.dy;
        c.dx *= d.dx;
        c.dy *= d.dy;
        c.parent = d;
        layout(c);
      });
    }
  }

  /* display show the treemap and writes the embedded transition function */
  function display(d) {
    /* create grandparent bar at top */
    /*grandparent
      .datum(d.parent)
      /*.on("click", _clickGrandparent)
      .select("text")
      .text(name(d));
      */
      // color header based on grandparent's rate
    /*grandparent
      .datum(d.parent)
      .select("rect")
    .style("fill", "grey");
*/
       drawTaxonBar(d);
       
    var g1 = svg.insert("g", ".grandparent")
      .datum(d)
      .attr("class", "depth");
    /* add in data */
    var g = g1.selectAll("g")
      .data(d._children)
      .enter().append("g");

    /* transition on child click */
    g.filter(function(d) { return d._children; })
      .classed("children", true);

      var groupData = getGroupData();
      
    /* write groups rectangles */
    /*g.selectAll(".group")
      .data(groupData)
      .enter().append("rect")
      .attr("class", "group")
      .call(rect);
      */
      
    /* write parent rectangle */
    g.append("rect")
      .attr("class", "parent")
      .call(rect)
      /* open new window based on the json's URL value for leaf nodes */
      /* Chrome displays this on top */
      .append("title")
      .text(function(d) { return formatNumber(d.value); });

      g.append("text")
        .attr("dy", ".75em")
        .text(function(d) { return d.name; })
        .call(text);
      
      g.on("mouseover", function(d){
           div.transition()
            .duration(750)
            .style("opacity", 1);
          
          div.html(d.name)
             .style("left", function(d){
                var w = d3.select(this).node().clientWidth;
							if( +d3.event.pageX + w > width){
								return (+d3.event.pageX -10- w) +"px";
							}else{
								return (+d3.event.pageX + 20) +"px";
							}
              
          })   //Position of pointer from tooltip from left
            .style("top",  (d3.event.pageY - 20) + "px"); 
          
      })
      .on("mouseout", function(d){
          
          div.transition()
            .duration(750)
            .style("opacity", 0);
      })
     .on("click", _clickChild);
    
    return g;
      
  }//end function display
    
    function getGroupData(){
        
        var gData = [];
        
        gData.push({"name":"male", value:58});
        gData.push({"name":"female", value:32});
        
        return gData;
    }
    
    //click on child sets the stack bar to simble bar chart for particular clicked group 
    function _clickChild(d){
        //console.log(d);
        var taxonName = d.name;
        var barData = [];
        var sampleNames = ["sample1", "sample2", "sample3", "sample4"];
       
        sampleNames.forEach(function(sample){
            
            barData.push({"name":sample, taxonName: d.name, "value":d.value*100, color: color(d.name) });
        });
        
        //remove the previous draw chart and create a new bar chart 
        // for current taxon
        d3.select("#sampleBar").select("svg").remove();
            var taxBar = taxonBar();  
            var containerBar = d3.select("#sampleBar")
                .datum(barData)
                .call(taxBar);
        
    }
    
    //
    function drawTaxonBar(d){
        
        var taxonName = d.name;
        var barData = [];
        var sampleNames = ["group1", "group2", "group3" ];
       
        sampleNames.forEach(function(sample){
            
            barData.push({"name":sample, "value":d.value*10, color: color(d.name) });
        });
        
        //remove the previous draw chart and create a new bar chart 
        // for current taxon
        d3.select("#groupBar").select("svg").remove();
            var taxBar = taxonBar();  
            var containerBar = d3.select("#groupBar")
                .datum(barData)
                .call(taxBar);
     }
    
    function getTaxonData(taxonNames){
        
        //using taxon rank and taxon name cretate a array for stack bar
        //console.log(taxonData);
    }
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

    
  function text(text) {
    text.attr("x", function(d) { return x(d.x) + 6; })
    .attr("y", function(d) { return y(d.y) + 6; })
    .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
  }

  function rect(rect) {
    rect
    //.attr("rx", 4)
    //.attr("ry", 4)
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
    .style("stroke-width", "2px")
    .style("stroke", "#fff")
    .style("fill", getColor);
  }
    
    return exports;
}//end of module