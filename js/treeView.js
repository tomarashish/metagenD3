treeView = function module(){
     
     var margin = {top: 10, right: 10, bottom: 10, left: 50},
        // $chartContainer = $(this),
         width = 916 - margin.right - margin.left,
        height = 600 - margin.top - margin.bottom;
     
     var svg, diagonal, widthScale, root;
     
     diagonal = d3.svg.diagonal()
                .projection(function(d){return [d.y , d.x]; });
     
     widthScale = d3.scale.linear().range([2, 105]);
     
     var tree = d3.layout.tree()
        .size([height, width]);
     
     function exports(_selection){
         _selection.each(function(_data){
            
            svg = d3.select(this).append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewbox", "0 0" +Math.min(width,height) + ""+ Math.min(width,height))
                .attr("preserveAspectRation", "xMinYMin")
                .append("g")
                .attr("transform", "translate("+margin.left + "," + margin.top+")")
                .append("g");
             
            widthScale.domain([0, _data.size]);
             
            root = _data;
            root.x0 = height / 2;
            root.y0 = 0;

            function collapseAll(d) {
                if (d.children && d.children.length === 0) {
                    d.children = null;
                }
                if(d.children){
                    d._children = d.children;
                    d._children.forEach(collapseAll);
                    d.children = null;
                }
            }

            collapseAll(root);
            expand(root);
            update(root);
             
         }); //end of export
     }
     
     function expandAll(d){
         expand(d,30);
     }
     
     function expand(d,i){
         var local_i = i;
         
         if(typeof local_i === 'undefined'){
             local_i = 2;
         }
         
         if(local_i > 0){
             if(d._children){
                 d.children = d._children;
                 d._children = null;
             }
             
             if(d.children){
                 d.children.forEach(function (c){ expand(c, local_i -1);});
                 
             }
         }
     }
     
     function collapse(d){
         if(d.children){
             d._children = d.children;
             d._children = null;
         }
     }
     
     function nodeSize(d){
         if(d.selected){
             return widthScale(d.size);
         }else{
             return 2;
         }
     }
     
     function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
         
        update(d);
     }
     
     function update(source){
         
         var nodes = tree.nodes(root).reverse(),
             links = tree.links(nodes);
        
         //Normalize for fixed depth
         nodes.forEach(function (d) { d.y = d.depth * 180; });

        // Update the nodes
        var node = svg.selectAll("g.node")
            .data(nodes, function(d,i ) { return d.id || (d.id = ++i); });
         
         //Enter new nodes at parent's previous position
         var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .style("cursor", "pointer")
            .attr("transform", function (d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", click);
         
         nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("stroke-width", "1.5px")
            .style("stroke", function(d){
             if(d.selected){
                 return d.color || '#aaa';
             }else{
                 return '#aaa';
             }
         })
         .style("fill", function(d){
             if(d.selected){
                 return d._children ? d.color || "#aaa" : "#fff";
             }else{
                 return "#aaa";
             }
         });
         
         nodeEnter.append("text")
            .attr("x", function(d){
                return d.children || d._children ? -10 : 10; })
            .attr("dy", ".35em")
             .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
            .text(function (d) { return d.name; })
            .style("font", "10px sans-serif")
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(500)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", nodeSize)
            .style("fill-opacity", function (d) { return d._children ? 1 : 0; })
            .style("stroke", function (d) {
                if (d.selected) {
                    return d.color || "#aaa";
                } else {
                    return "#aaa";
                }
            })
            .style("fill", function (d) {
                if (d.selected) {
                    return d._children ? d.color || "#aaa" : "#fff";
                } else {
                    return "#aaa";
                }

            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(750)
            .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links
        var link = svg.selectAll("path.link")
            .data(links, function (d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .style("fill", "none")
            .style("stroke-opacity", "0.5")
            .style("stroke-linecap", "round")
            .style("stroke", function (d) {
                if (d.source.selected) {
                    return d.target.color;
                } else {
                    return "#aaa";
                }
            })
            .style("stroke-width", 1e-6)
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(1000)
            .attr("d", diagonal)
            .style("stroke", function (d) {
                if (d.source.selected) {
                    return d.target.color;
                } else {
                    return "#aaa";
                }
            })
            .style("stroke-width", function (d) {
                if (d.source.selected) {
                    return widthScale(d.size) + "px";
                } else {
                    return "4px";
                }
            });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(500)
            .style("stroke-width", 1e-6)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
            
     }// end update
     
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
    
    //d3.rebind(exports, dispatch, "on");
    return exports;
     
 };
 