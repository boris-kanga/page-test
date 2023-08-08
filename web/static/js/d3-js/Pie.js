!function(){
	var Donut3D={};
	
	function pieTop(d, rx, ry, ir ){
		if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
		var sx = rx*Math.cos(d.startAngle),
			sy = ry*Math.sin(d.startAngle),
			ex = rx*Math.cos(d.endAngle),
			ey = ry*Math.sin(d.endAngle);
			
		var ret =[];
		ret.push("M",sx,sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",ex,ey,"L",ir*ex,ir*ey);
		ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*sx,ir*sy,"z");
		return ret.join(" ");
	}

	function pieOuter(d, rx, ry, h ){
		var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
		var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);
		
		var sx = rx*Math.cos(startAngle),
			sy = ry*Math.sin(startAngle),
			ex = rx*Math.cos(endAngle),
			ey = ry*Math.sin(endAngle);
			
			var ret =[];
			ret.push("M",sx,h+sy,"A",rx,ry,"0 0 1",ex,h+ey,"L",ex,ey,"A",rx,ry,"0 0 0",sx,sy,"z");
			return ret.join(" ");
	}

	function pieInner(d, rx, ry, h, ir ){
		var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
		var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);
		
		var sx = ir*rx*Math.cos(startAngle),
			sy = ir*ry*Math.sin(startAngle),
			ex = ir*rx*Math.cos(endAngle),
			ey = ir*ry*Math.sin(endAngle);

			var ret =[];
			ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
			return ret.join(" ");
	}

	function getPercent(d){
		return (d.endAngle-d.startAngle > 0.2 ? 
				Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%' : '');
	}	
	
	Donut3D.transition = function(elem, data, rx, ry, h, ir){
		function arcTweenInner(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return pieInner(i(t), rx+0.5, ry+0.5, h, ir);  };
		}
		function arcTweenTop(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return pieTop(i(t), rx, ry, ir);  };
		}
		function arcTweenOuter(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return pieOuter(i(t), rx-.5, ry-.5, h);  };
		}
		function textTweenX(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return 0.6*rx*Math.cos(0.5*(i(t).startAngle+i(t).endAngle));  };
		}
		function textTweenY(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return 0.6*rx*Math.sin(0.5*(i(t).startAngle+i(t).endAngle));  };
		}
		
		var _data = d3.pie().sort(null).value(function(d) {return d.value;})(data);
		
		d3.select(elem).selectAll(".innerSlice").data(_data)
			.transition().duration(750).attrTween("d", arcTweenInner); 
			
		d3.select(elem).selectAll(".topSlice").data(_data)
			.transition().duration(750).attrTween("d", arcTweenTop); 
			
		d3.select(elem).selectAll(".outerSlice").data(_data)
			.transition().duration(750).attrTween("d", arcTweenOuter); 	
			
		d3.select(elem).selectAll(".part-center").data(_data).transition().duration(750)
			.attrTween("cx",textTweenX).attrTween("cy",textTweenY)
			//.text(getPercent);
	}
	
	Donut3D.draw=function(elem, data, x /*center x*/, y/*center y*/,
			rx/*radius x*/, ry/*radius y*/, h/*height*/, ir/*inner radius*/){
	
		var _data = d3.pie().sort(null).value(function(d) {return d.value;})(data);
		
		var slices = d3.select(elem).append("g").attr("transform", "translate(" + x + "," + y + ")")
			.attr("class", "slices");
			
		slices.selectAll(".innerSlice").data(_data).enter().append("path").attr("class", "innerSlice")
			.style("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
			.attr("d",function(d){ return pieInner(d, rx+0.5,ry+0.5, h, ir);})
			.each(function(d){this._current=d;});
		
		slices.selectAll(".topSlice").data(_data).enter().append("path").attr("class", "topSlice")
			.style("fill", function(d) { return d.data.color; })
			.style("stroke", function(d) { return d.data.color; })
			.attr("d",function(d){ return pieTop(d, rx, ry, ir);})
			.each(function(d){this._current=d;});
		
		slices.selectAll(".outerSlice").data(_data).enter().append("path").attr("class", "outerSlice")
			.style("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
			.attr("d",function(d){ return pieOuter(d, rx-.5,ry-.5, h);})
			.each(function(d){this._current=d;});

		slices.selectAll(".part-center").data(_data).enter().append("circle").attr("class", "part-center")
			.attr("cx",function(d){ return 0.6*rx*Math.cos(0.5*(d.startAngle+d.endAngle));})
			.attr("cy",function(d){ return 0.6*ry*Math.sin(0.5*(d.startAngle+d.endAngle));})
			.attr("r", 0.5)
			.attr("fill", "#0000")
			//.text(getPercent)
			.each(function(d){this._current=d;});
	}
	
	this.Donut3D = Donut3D;
}();



class KBPie extends D3KBChart{
    static LEGEND_POINT_SIZE = 8;
    static LEGEND = {
        TYPE1: 0,
        TYPE2: 1,
        NO: 100
    }
    #default_config = {
        donutWidthRatio: 0,
        profondeur3d: 0,
        //
        legend_orientation: "RIGHT",
        legend_type: KBPie.LEGEND.TYPE1
    };

	constructor(target, data, config){
		super(target, data, config);
		this._default_config = this.#default_config;
		data = this.dataset;
        this.dataset = data.map((d, index)=>{return {label:d[0] || d.name || d.label, value:d[1] || d.value, color:this._color(index), active: true, _index:index}})

		this.draw();

	}

	update(){
	    let config = this.config;
	    let svg = d3.select(this.svg)
	    let _dataset = this.dataset.map(d=>{
	        d = Object.assign({}, d);
	        if (d.active) return d;
	        d["value"] = 0;
	        return d;
	    });
	    let graph = svg.select("g.graph");

	    Donut3D.transition(graph.node(), _dataset,
			config.radius, config.radius,
			config.profondeur3d, config.donutWidthRatio);
	    svg.selectAll(".ticks").remove();
        setTimeout(()=>this.add_ticks(this), 755);
	}

	draw(){

	    let config = this.config;
	    let _dataset = this.dataset;
	    let svg = d3.select(this.svg)
                .attr("width", config.width)
                .attr("height", config.height)
                .attr("viewBox", "0 0 " + config.width + " " + config.height);

        let legend = svg.append("g").attr("class", "legend");
        let graph = svg.append("g").attr("class", "graph");
        let legend_items = legend.selectAll("g.legend-item")
                .data(_dataset).enter().append("g")
                    .attr("class", "legend-item active")
                    .style("cursor", "pointer")
                    .on("click", (e, d, i)=>{
                        let target = e.currentTarget;
                        let data = this.dataset;
                        if (target.classList.contains("active")){
                            target.classList.remove("active");
                            d3.select(target).select("text").style("text-decoration", "line-through")
                            // action
                            data[d._index]["active"] = false;
                        }else{
                            target.classList.add("active");
                            d3.select(target).select("text").style("text-decoration", "none"),
                            // action
                            data[d._index]["active"] = true;
                        }
                        this.dataset = data;
                        this.update();
                    })

        let graph_translation = {x: 0, y: 0};

	    let height = config.height - config.profondeur3d;
	    let width = config.width - config.profondeur3d;
	    let legend_orientation = config.legend_orientation;

        var radius = Math.min(width, height)/2;

	    if (legend_orientation === "AUTO"){
	        if (width > height){
	            legend_orientation = "RIGHT";

	        }else{
                legend_orientation = "TOP";
	        }
	    }
	    if (legend_orientation === "TOP" || legend_orientation === "BOTTOM"){

            legend_items.append("rect").attr("x", 0).attr("y", 0)
	            .attr("width", KBPie.LEGEND_POINT_SIZE)
	            .attr("height", KBPie.LEGEND_POINT_SIZE)
	            .attr("fill", (d)=>d.color)
	            .attr("stroke-width", 0.5).attr("stroke", "#888")
	        legend_items.append("text")
	            .attr("x", KBPie.LEGEND_POINT_SIZE + 5)
	            .attr("y", 0)
	            .attr("dominant-baseline","hanging")

	            .attr("fill", "#000")
	            .text((d)=>d.label)
	            .style("font-size", KBPie.LEGEND_POINT_SIZE+"px")
	            .style("text-shadow", "1px 1px 1px #0003")
	        legend_items.each((_, i, nodes)=>{
	            if (i>0){
	                let pos = this.get_center(nodes[i-1]);
	                d3.select(nodes[i]).attr("transform", "translate("+[5+pos.x+pos.width/2,0]+")")
	            }
	            //console.log( i, nodes)
	            });
	        //
	        let dx = 0
	        let dy = KBPie.LEGEND_POINT_SIZE * 2

	        width = width - dx;
	        height = height - dy
	        let legend_dx = Math.max((Math.min(width, height) - this.get_center(legend.node()).width)/2, 0);
	        if (legend_orientation === "TOP"){
	            graph_translation = {x: dx, y: dy};
	            graph.attr("transform", "translate("+[dx, dy]+')');
	            legend.attr("transform", "translate("+[legend_dx, 0]+")");
	        }else{
	            graph_translation = {x: 0, y: 0};
	            legend.attr("transform", "translate("+[legend_dx, dy+Math.min(width, height) - 5]+")");
	        }



	    }else if (legend_orientation === "LEFT" || legend_orientation === "RIGHT"){

	        legend_items.append("rect").attr("x", 0).attr("y", (d, i)=> 2 * i * KBPie.LEGEND_POINT_SIZE)
	            .attr("width", KBPie.LEGEND_POINT_SIZE)
	            .attr("height", KBPie.LEGEND_POINT_SIZE)
	            .attr("fill", (d)=>d.color)
	            .attr("stroke-width", 0.5).attr("stroke", "#888")
	        legend_items.append("text")
	            .attr("x", KBPie.LEGEND_POINT_SIZE + 5)
	            .attr("y", (d, i)=>(i*2*KBPie.LEGEND_POINT_SIZE + KBPie.LEGEND_POINT_SIZE/2 + 1))
	            .attr("dominant-baseline","middle")
	            .attr("fill", "#000")
	            .text((d)=>d.label)
	            .style("font-size", KBPie.LEGEND_POINT_SIZE+"px")
	            .style("text-shadow", "1px 1px 1px #0003")
	        let legend_pos = this.get_center(legend.node());

	        let d_OP = distanceKB(legend_pos.width, legend_pos.height, radius, radius);
	        d_OP = Math.min(radius, d_OP);
	        let alpha = Math.sign(1) * Math.acos((radius-legend_pos.width)/(d_OP || 1));
	        let dx = Math.cos(alpha)*radius - (radius-legend_pos.width) + 5;
	        let dy = Math.sin(alpha) * radius - (radius - legend_pos.height) + 5;

	        width = width - dx;
	        height = height - dy;

	        if (legend_orientation === "LEFT"){
	            graph_translation = {x: dx, y: dy};
	            graph.attr("transform", "translate("+[dx, dy]+')');
	        }else{
	            legend.attr("transform", "translate("+[Math.min(width, height) - dx + 15, 0]+")");
	        }
	    }

	    radius = Math.min(width, height)/2;
	    this.put_config_var("radius", radius);
	    this.put_config_var("graph_translation", graph_translation);

        //Donut3D.draw(elem, data, cx, cy, rx, ry, 3d, donuts)
        Donut3D.draw(graph.node(), _dataset, radius, radius, radius, radius, config.profondeur3d, config.donutWidthRatio);

        this.add_ticks();
        super.modify = false;
	}

	add_ticks(self){
	    self = self || this;
	    let config = this.config;
	    let radius = config.radius;
	    let graph_translation = config.graph_translation;
	    let svg = d3.select(this.svg);
	    svg.selectAll(".ticks").remove();
	    let graph = svg.select("g.graph");
	    let center = this.get_center(graph.node());

        switch (config.legend_type){
            case KBPie.LEGEND.TYPE1: {
                d3.selectAll(".part-center")
                    .each((d, index, nodes)=>{
                        if (!d.data.active) {return;}
                          let node = nodes[index];
                          let d_radius = 20 + radius;
                          //if (index != 1) return;
                          let pos = this.get_center(node);
                          let cx = pos.x;
                          let cy = pos.y;

                          if (d.endAngle-d.startAngle > 0.2){
                            svg.append("g").attr("class", "ticks").append("text").attr("x", cx).attr("y", cy)
                                .attr("dominant-baseline","middle").attr("text-anchor","middle")
                                .text(Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%')
                          }else{
                            let d_radius = 20 + radius;
                            //let distance = distanceKB(center.x, center.y, cx, cy);

                            //let alpha = Math.acos((center.x-cx)/distance) * Math.sign((center.x-cx)/distance);
                            let alpha = Math.PI - (d.endAngle+d.startAngle)/2 //* Math.sign(alpha);


                            let x2 = radius - d_radius * Math.cos(alpha) + graph_translation.x;
                            let y2 = radius + Math.sin(alpha) * d_radius + graph_translation.y ;

                            let x_border = radius - radius * Math.cos(alpha) + graph_translation.x;
                            let y_border = radius + Math.sin(alpha) * radius + graph_translation.y;

                            let g = svg.append("g").attr("class", "ticks")
                            g.append("line")
                                .attr("x1", x_border)
                                .attr("y1", y_border)
                                .attr("x2", x2)
                                .attr("y2", y2)
                                .attr("stroke-width", 1)
                                .attr("stroke", "#888")
                                .attr("stroke-dasharray",4);
                            g.append("text")
                                .attr("dominant-baseline","middle")
                                .attr("x", x2).attr("y", y2)
                                .text(Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%')

                          }

                    })



                break;
            }
            case KBPie.LEGEND.TYPE2: {
                d3.selectAll(".part-center")
                    .each((d, index, nodes)=>{
                          let node = nodes[index];
                          let d_radius = 20 + radius;
                          //if (index != 1) return;
                          let pos = this.get_center(node);
                          let cx = pos.x;
                          let cy = pos.y;
                          // retravailler pos au cas où donutWidthRatio est définie

                          //let distance = Math.sqrt((center.x - cx)**2 + (center.y - cy)**2);
                          //let alpha = Math.acos((radius-cx)/distance) * Math.sign((radius-cx)/distance)
                          let alpha = Math.PI - (d.endAngle+d.startAngle)/2 //* Math.sign(alpha);

                          let x2 = radius - d_radius * Math.cos(alpha) + graph_translation.x;
                          let y2 = radius + Math.sin(alpha) * d_radius + graph_translation.y ;

                          let x_border = radius - radius * Math.cos(alpha);
                          let y_border = radius + Math.sin(alpha) * radius;

                          svg.append("line")
                            .attr("x1", cx)
                            .attr("y1", cy)
                            .attr("x2", x2)
                            .attr("y2", y2)
                            .attr("stroke-width", 1)
                            .attr("stroke", "red")
                            .attr("stroke-dasharray",4);

                          svg.append("path")
                            .attr("d", "M "+x_border+" "+y_border+" L "+x2+" "+y2+" v -20")
                            .attr("fill", "none")
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("stroke-linejoin", "round")
                    })
                break;
            }
            default:{}
        }

	}
}