
function Timeline(id_selector, config){
	config = {
	    width:config.width || null, point_radius: config.point_radius || 10,
	    line_height: config.line_height || 5,
	    min_value:config.min_value || 0, max_value:config.max_value || 100,
	    on_change:config.on_change, on_drag:config.on_drag,
	    color: {select: "#8b8787"}
	};
    let root = d3.select(id_selector).node();
    if (!config.width) config.width = root.getBoundingClientRect().width || 100;
    let padding = 5;
    let width = config.width - padding;

	let line_width = width - 2*config.point_radius;
	this.svg = d3.select(id_selector)
		.append("svg")
		.attr("class","time-line-svg")
			.attr("width", config.width)
		    .attr("height", config.line_height + 2*config.point_radius + 5)
	  	.append("g")
	    	.attr("transform",
	          	"translate(" + (config.point_radius+padding/2) + "," + (config.point_radius+padding/2) + ")");

	config.width = width;
	let bg_rect = this.svg.append("rect")
		.attr("width", line_width)
		.attr("height", config.line_height)
		.attr("rx", config.line_height)
		.attr("ry",config.line_height)
		.style("fill", "#fff")
		.style("stroke-width", 1)
		.style("stroke", "#ccc")
		;

	let rect_selected_range = this.svg.append("rect")
		.attr("height", config.line_height)
		.style("fill", config.color.select)
		.style('cursor', 'pointer')
		.attr("width",line_width)

	let point_start = this.svg.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", config.point_radius)
		.style("fill", config.color.select)
		.style('cursor', 'pointer')
		.attr("transform", "translate(0,"+(config.line_height/2)+")")

	let point_end = this.svg.append("circle")
		.attr("cx", line_width)
		.attr("cy", 0)
		.attr("r", config.point_radius)
		.style("fill", config.color.select)
		.style('cursor', 'pointer')
		.attr("transform", "translate(0,"+(config.line_height/2)+")")
    //
    this.svg.append("text").attr("class", "hand").text("||").attr("dominant-baseline","middle").attr("text-anchor","middle")
        .attr("fill", "#fff").attr("font-size", "0.5rem")
        .attr("transform", "translate(0,"+(config.line_height/2)+")")
    this.svg.append("text").attr("class", "hand").text("||").attr("dominant-baseline","middle").attr("text-anchor","middle")
        .attr("fill", "#fff").attr("font-size", "0.5rem")
        .attr("x", line_width)
        .attr("transform", "translate(0,"+(config.line_height/2)+")")
	var self=this;

	var drag = d3.drag()
            .subject(function ()
            {
                var t = d3.select(this);
                return {x: t.attr("cx"), y: t.attr("cy"), r: 2};
            })
            .on("start", function (e) {
                (d3.event || e).sourceEvent.stopPropagation(); // silence other listeners
		     })
            .on("drag", function (e) {
            	let x = (d3.event || e).x;
            	if (x<0){x=0;}
            	if (x>line_width){x=line_width;}
            	//console.log(this)
                let point = d3.select(this);
                let index = 0;
                if (this==point_start.node()){
                	if (x>point_end.attr("cx")) {x=point_end.attr("cx");}
                }
                if (this==point_end.node()){
                    index = 1;
                	if (x<point_start.attr("cx")) {x=point_start.attr("cx");}
                }
                point.attr("cx", x);
                rect_selected_range.attr("width", point_end.attr("cx")-point_start.attr("cx"))
					.attr("transform", "translate("+point_start.attr("cx")+",0)");
			    d3.select(self.svg.selectAll(".hand").nodes()[index]).attr("x", (d, i)=>{
			        return d3.select(this).attr("cx");
			    });
                self._trigger_change();
            })
            .on('end', function () {
            	self._trigger_change()
            });

    point_start.call(drag);
    point_end.call(drag);

    this.svg.selectAll("rect").on("click", (e)=>{
    	let event = (d3.event || e);
    	let m = d3.pointer(event);
    	if (event.currentTarget==rect_selected_range.node()){
    		m[0] += parseFloat(point_start.attr("cx"));
    	}
        let index=0;
        let point = point_start;
    	if (Math.abs(m[0]-point_start.attr("cx"))<Math.abs(m[0]-point_end.attr("cx")) &&  ((point_end.attr("cx") - Math.max(m[0], 0))>=0) ||
    		(Math.min(m[0]+config.point_radius, line_width)-point_start.attr("cx"))<0){
    		point_start.attr("cx", Math.max(m[0], 0));
    	}else{
    		point_end.attr("cx", Math.min(m[0]+config.point_radius, line_width));
    		index = 1;
    		point = point_end;
    	}
    	rect_selected_range.attr("width",point_end.attr("cx")-point_start.attr("cx"))
			.attr("transform", "translate("+point_start.attr("cx")+",0)");
        d3.select(self.svg.selectAll(".hand").nodes()[index]).attr("x", (d, i)=>{
			 return point.attr("cx");
		});
		self._trigger_change()
    });

    this.set_value = (value)=>{
        let {minValue, maxValue} = value;
        minValue = line_width*(minValue - config.min_value)/(config.max_value-config.min_value);
        maxValue = line_width*(maxValue - config.min_value)/(config.max_value-config.min_value);
        this.svg
            .transition().duration(750).tween("updating-min", (d, index, sel_list)=>{
                let i_min = d3.interpolate(point_start.attr("cx"), minValue);
                let i_max = d3.interpolate(point_end.attr("cx"), maxValue);
                return (t)=>{
                    // point_min
                    point_start.attr("cx", i_min(t));
                    d3.select(self.svg.selectAll(".hand").nodes()[0]).attr("x", (d, i)=>{
                        return point_start.attr("cx");
                    });
                    // point max
                    point_end.attr("cx", i_max(t));
                    d3.select(self.svg.selectAll(".hand").nodes()[1]).attr("x", (d, i)=>{
                        return point_end.attr("cx");
                    });

                    rect_selected_range.attr("width", point_end.attr("cx")-point_start.attr("cx"))
                        .attr("transform", "translate("+point_start.attr("cx")+",0)");
                }

            })
    }

    this._trigger_change = ()=>{
        if (typeof config.on_change==="function"){
            let value = {
                minValue: config.min_value + (point_start.attr("cx")/line_width)*(config.max_value-config.min_value),
                maxValue: config.min_value + (point_end.attr("cx")/line_width)*(config.max_value-config.min_value)
            };
            config.on_change(value);
        }
    }

    this._trigger_change();

    this.destroy = ()=>{this.svg.node().parentNode.remove()}

}