function prepare_chart_config(config, dataset, default_conf, custom_args){
	if (!dataset){
		dataset=[];
	}
	if (!custom_args) {
		custom_args={};
	}
	let calculated_conf={};
	if (!config) config={}
	calculated_conf.width=config.width || default_conf.width;
	calculated_conf.height = config.height || default_conf.height;
	calculated_conf.margin = config.margin || default_conf.margin || {};
	calculated_conf.color = config.color || [];

	var color=calculated_conf.color;

	if (color.length){
		c={};
		dataset.forEach((x, i)=>{
			c[x[0]]=color[i%color.length];
		});
		color=c;
	}
	else if (! Object.keys(color).length){
		c=d3.schemePaired;
		color={};
		dataset.forEach((x, i)=>{
			color[x[0]]=c[i%c.length];
		})
	}else{
		for (let i=0; i<Object.keys(color).length; i++){
			c=Object.keys(color)[i];
			if (color[c].includes("--")){
				color[c]="var("+color[c]+")";
			}
		}
	}
	calculated_conf.color=color;

	["top","right", "bottom", "left"].forEach((x)=>{
		if (!calculated_conf["margin"][x]) calculated_conf["margin"][x]=0;
	});
	if (!Object.keys(custom_args).length) custom_args={};

	Object.keys(custom_args).forEach((c)=>{

		calculated_conf[c]=(typeof config[c]==="undefined")? custom_args[c]: config[c];
	});
	return [calculated_conf, dataset];
};

function CLine(id_selector,dataset, config){
	//dataset: [ {name: line1, values=[ {x: value, y: value}]} ]

	if (!dataset) dataset=[];
	let keys = dataset.map((d)=>[d.name, 0]);
	config=prepare_chart_config(config, keys, {width:500, height:300, margin:{"left":50, "top":50, "bottom":20, right:20}},
		{ xaxis_type:"linear", "line-stroke-width":1.5, "radius-points": 0, "point-color": null, "point-stroke-color": null,
		"point-stroke-width":0, "x-axis-format":(x_v)=>x_v,
		"display-grid":false, "grid-x-axis":true, "grid-y-axis":true,"grid_epais":1, "grid_color": "#ccc"

		});
	//dataset=config[1];

	config = config[0];
	var margin= config.margin;
	var width = config.width - margin.left - margin.right;
	var height = config.height - margin.top - margin.bottom;
	var color = config.color;

	this.legend_container =d3.select(id_selector)
		.append("div")
		.attr("class", "chart-legend")
		.style("width", width+"px")
		.style("display", "flex")
		.style("justify-content", "center");

	svg = d3.select(id_selector)
	  .append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)

	this.svg = svg.append("g")
	    .attr("transform",
	          "translate(" + margin.left + "," + margin.top + ")");

	this.tooltip=this.svg.append("g")
    	//.style("display", "none")
    	.attr("class", "my-tooltip");

    this.tooltip.append("rect")
    	.attr("width", 120)
    	.attr("height", 50)
    	.attr("y", -25)
    	.attr("rx", 5)
    	.attr("ry", 5)
    	.style("fill", "#303030EE");
    this.tooltip.append("path")
    	.attr("class", "arrow-left")
    	.attr("d", "M -5,0 1,5 1,-5 Z")
    	.style("fill", "#303030EE")
    	.style("opacity", "0")
    this.tooltip.append("path")
    	.attr("class", "arrow-right")
    	.attr("d", "M 0,0 0,5 5,0 0,-5 Z")
    	.style("fill", "#303030EE")
    	.attr("transform","translate("+this.tooltip.select("rect").attr("width")+" ,0)")
    	.style("opacity", "0")

     this.tooltip.append("g").attr("class","content")
    	.attr("transform","translate(15, "+(15-this.tooltip.select("rect").attr("height")/2)+")")
    	.style("fill", "#fff")
    	.style("font-size", "15px")

	// Add X axis --> it is a date format

	this.dataset = [];
	this.config = config;
	this.id_selector = id_selector;

	this.lines = null;
	this.points = null;


	this.generate_new_xaxis=(data)=>{
		let width =  this.config.width - this.config.margin.left - this.config.margin.right;
    	let data_range =[];
    	data.forEach((d)=>{
    		data_range = data_range.concat(d.values);
    	})
    	if (this.config.xaxis_type=="linear"){

    		return d3.scaleLinear()
					  .domain([0, d3.max(data_range, function(d) { return +d.x; })])
					  .range([ 0, width ]);
    	}else if (this.config.xaxis_type=="time"){
    		var max=new Date(Math.max.apply(null, data_range.map((d)=>d.x)));
    		max.setHours(23, 59, 59);
			var min=new Date(Math.min.apply(null, data_range.map((d)=>d.x)));
    		min.setHours(0, 0, 0);

    		return d3.scaleTime()
  					.domain([min,max])
  					.range([ 0, width]);

    	}
    }
    var x = this.generate_new_xaxis(dataset);

    this.xAxis=this.svg.append("g")
    	.attr("class", "axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(dataset, function(d) { return d3.max(d.values, (dd)=>+dd.y); })])
      .range([ height, 0 ]);
    this.scaleX=x;
    this.scaleY=y;
    this.yAxis=this.svg.append("g")
    	.attr("class", "axis")
    	.call(d3.axisLeft(y).ticks(2));

    this.hide_var ={};
    this.x_axis_label_height = null
    dataset.forEach((d)=>{
    	this.hide_var[d.name]=false;
    })

    this.draw_grid = (x_axis, y_axis, epais, col)=>{
    	var margin= this.config.margin;
    	epais = epais || this.config.grid_epais
    	col = col || this.config.grid_color
    	let width = this.config.width - margin.left - margin.right;
    	let height = this.config.height - margin.top - margin.bottom;
    	this.svg.selectAll("g.grid").remove();
    	if (y_axis){
    		y_axis=this.svg.append("g").attr("class", "grid y-axis-grid");
    		y_axis.selectAll(".grid-line").data(this.scaleY.ticks()).enter()
    			.append("line").attr("class", "grid-line")
    			.style("stroke", col).style("stroke-width", 1)
    			.attr("x2", width)
    			.attr("y1", d=>this.scaleY(d)).attr("y2", d=>this.scaleY(d))
    		y_axis.lower();
    	}
    	if (x_axis){
    		x_axis = this.svg.append("g").attr("class", "grid x-axis-grid");
    		x_axis.selectAll(".grid-line").data(this.scaleX.ticks()).enter()
    			.append("line").attr("class", "grid-line")
    			.style("stroke", col).style("stroke-width", 1)
    			.attr("y2", this.scaleY(this.scaleY.range()[1]))
    			.attr("x1", d=> this.scaleX(d)).attr("x2", d=> this.scaleX(d))
    		x_axis.lower();
    	}
    }
    this.remove=(name)=>{
    	try{
    		delete this.hide_var[name];
    	}catch(e){}
    	this.create_legend(this.dataset);
    	return this.update(this.dataset.filter((d)=>d.name!=name));
    }

    this.append= (data, name)=>{
    	data=[{"name":name, values: data}];
    	if (this.dataset== [] || this.dataset == null){

    	}else{
    		data = this.dataset.concat(data);
    	}
    	this.hide_var[name]=false;
    	this.create_legend(this.dataset);
    	return this.update(data);

    }
    var self = this;
    this.update= function(data, config) {
    	let test = null
    	if (!config) config=this.config;
    	if (!data) {data=this.dataset || [];};
		let keys = data.map((d)=>[d.name, 0]);
		config=prepare_chart_config(config, keys, {width:this.config.width, height:this.config.height, margin:this.config.margin}, {
			xaxis_type:this.config.xaxis_type, "line-stroke-width":this.config["line-stroke-width"],
			"radius-points": this.config["radius-points"], "point-color": this.config["point-color"],
			"point-stroke-color": this.config["point-stroke-color"], "point-stroke-width":this.config["point-stroke-width"],
			"x-axis-format":this.config["x-axis-format"],
			"display-grid":this.config["display-grid"],  "grid-x-axis":this.config["grid-x-axis"], "grid-y-axis":this.config["grid-y-axis"],
			"grid_epais":this.config.grid_epais, "grid_color":this.config.grid_color

		})[0];
		//this.config=config;
		this.config = Object.assign(this.config, config)
		var margin= config.margin;
		var width = config.width - margin.left - margin.right;
		var height = config.height - margin.top - margin.bottom;
		var color = config.color;
		// calculation of transition params
		keys=this.dataset.map(d=>d.name);
		let _dataset=[]

		let data_with_hide_var = data.filter((d)=> !self.hide_var[d.name])
		data_with_hide_var.forEach((d)=>{
			if (keys.includes(d.name)){
				_dataset.push(this.dataset.filter((dd)=>dd.name==d.name)[0])
			}else{
				_dataset.push({"name": d.name, values:d.values.map(dd=>{ return {x:dd.x, y: 0}})})
			}

		});

		this.svg.selectAll(".line").remove();
		this.svg.selectAll(".etiquette").remove();
		this.svg.selectAll(".line-points").remove();

     	// Give these new data to update line
      	var x = this.generate_new_xaxis(data_with_hide_var);
		this.xAxis.call(d3.axisBottom(x));
		let ticks_label = this.xAxis.selectAll(".tick").nodes();
		this.xAxis.selectAll("text")
			.attr("transform", "rotate(0)")
			.attr("x", 0)
			.attr("y", 9)
			.style("alignment-baseline", "middle")
    		.style("text-anchor", "middle");

		for(let i=0; i<ticks_label.length-1; i++){
			t=ticks_label[i].getBBox();
			t.x = ticks_label[i].transform.baseVal.getItem(0).matrix.e
			//t.y = ticks_label[i].transform.baseVal.getItem(0).matrix.y
			t.length = t.x+t.width+5;
			ttx = ticks_label[i+1].transform.baseVal.getItem(0).matrix.e
			if (t.length>=ttx){
				console.log("Need to put label on oblique position");
				//height -=t.height;
				this.xAxis.selectAll("text")
					.attr("class", "label-60deg")
					.attr("y", 0)
    				.attr("x", 9)
    				.attr("dy", ".35em")
    				.attr("transform", "rotate(60)")
    				.style("text-anchor", "start");

    			if (this.x_axis_label_height==null){
    				this.x_axis_label_height = t.height;
    			}
    			m = Math.max.apply(null, this.xAxis.selectAll(".tick").nodes().map((d)=>d.getBBox().height));
    			height -=Math.max((m-this.x_axis_label_height), 0);
				break
			}
		}
		this.xAxis.attr("transform", "translate(0," + height + ")")

		var y = d3.scaleLinear()
			.domain([0, d3.max(data_with_hide_var, function(d) { return d3.max(d.values, (dd)=>+dd.y); })])
			.range([ height, 0 ]);
		this.yAxis.transition().duration(750).call(d3.axisLeft(y))

		this.lines=this.svg
			.selectAll(".line")
		    .data(_dataset)
		    .enter()
		    .append("g")
		    .attr("class", "line")
		    	.append("path")
			    .attr("d", function (d) {
			        return (d3.line()
			        	.curve(d3["curveLinear"])
			            .x(d => x(d.x))
			            .y(d => y(d.y)))(d.values)
			    })
			    .attr("fill", "none")
			    .attr("stroke", (d)=>config.color[d.name])
		    	.attr("stroke-width", config["line-stroke-width"])

		this.lines=this.svg.selectAll(".line path").data(data_with_hide_var).transition().duration(750)
			    .attr("d", function (d) {
			        return (d3.line()
			        	.curve(d3["curveLinear"])
			            .x(d => x(d.x))
			            .y(d => y(d.y)))(d.values)
			    })
			    .attr("fill", "none")
			    .attr("stroke", (d)=>config.color[d.name])
		    	.attr("stroke-width", config["line-stroke-width"]);
		this.points = this.svg.selectAll(".line-points")
			.data(data_with_hide_var).enter()
			.append("g")
			.attr("class", "line-points")
			.selectAll(".item-point").data((line, i)=>{return line.values.map((d)=>{
				return {x:d.x, y:d.y, "i": i, "name": line.name};
			})}).enter()
				.append("circle")
				.attr("class", "item-point")

				.attr("cx", d => x(d.x))
				.attr("cy",d=> y(d.y))
				.attr("r", self.config["radius-points"] ||  config["line-stroke-width"])
				.style("cursor", "pointer")
				.style("fill", (d)=>config["point-color"] || config.color[d.name])
				.style("stroke", (d)=>config["point-stroke-color"] || config.color[d.name])
				.style("stroke-width", (d)=>config["point-stroke-width"])
				.on("mousemove", (e, d)=>{
				    console.log(d)
					if (self.tooltip.style("display")=="block") {
						return;
					}
					let circle = d3.select(e.currentTarget);
					circle.transition().duration(100).attr("r", (self.config["radius-points"] ||  config["line-stroke-width"])*1.5);

					self.tooltip.select(".content").html(`<text style="font-weight:bold" alignment-baseline="middle">${self.config["x-axis-format"](d.x)}</text>
						<g transform="translate(0 20)">
							<rect fill='${self.config.color[d.name]}' width='20' height='10' y="-5" stroke="#CCC" stroke-width="1"></rect>
							<text x="30" alignment-baseline="middle">${Math.round(d.y*10)/10}</text>
							</g>`);

					let w = Math.max(parseFloat(self.tooltip.select(".content").node().getBBox().width)+20, 120)
					self.tooltip.select("rect").attr("width", w);
					self.tooltip.select(".arrow-right")
    					.attr("transform","translate("+w+" ,0)") ;
					self.tooltip.style("display", "block")
						.attr("transform", ()=>{
							let tooltip_x = x(d.x);
							let tooltip_y=y(d.y);
							let w =parseFloat(self.tooltip.select("rect").attr("width"));
							//let h = self.tooltip.select("rect").attr("height");

							if (tooltip_x+w>width){
								tooltip_x-=w;
								tooltip_x-=2*self.config["radius-points"] ||  2*self.config["line-stroke-width"] || 2
								self.tooltip.select(".arrow-right").style("opacity", 1);
								self.tooltip.select(".arrow-left").style("opacity", 0);

							}else{
								tooltip_x+=2*self.config["radius-points"] || 2*self.config["line-stroke-width"] || 2
								self.tooltip.select(".arrow-left").style("opacity", 1);
								self.tooltip.select(".arrow-right").style("opacity", 0);
							}

							return "translate("+[tooltip_x, tooltip_y]+")";
						});
				})
				.on("mouseleave", (e, d, i)=>{
					let circle = d3.select(e.currentTarget);
					circle.transition().duration(100).attr("r", self.config["radius-points"] ||  config["line-stroke-width"])
					setTimeout(()=>{
						self.tooltip.style("display", "none");
					}, 500)

				})

		this.points.style("opacity", 0).transition().duration(750)
			.style("opacity", 1)
		this.tooltip.style("display", "none")
		this.tooltip.remove();
		this.svg.node().appendChild(this.tooltip.node());
    	this.dataset=data;
    	this.scaleX=x;
   		this.scaleY=y;
   		if (this.config["display-grid"]) this.draw_grid(this.config["grid-x-axis"], this.config["grid-y-axis"],this.config.grid_epais, this.config.grid_color);
    };

	this.update(dataset);
	this.create_legend = (dataset)=>{
		this.legend_container.node().innerHTML="";
		this.legend_container.selectAll(".item-legend")
			.data(dataset).enter()
		    .append("div")
		    .attr("class", "item-legend")
		    .style("display", "flex")
		    .style("margin", "0 10px 0 10px")
		    .style("padding", "2px 5px 2px 5px")
			.style("align-items", "center")
			.style("cursor", "pointer")
		    .html((d)=>{
		    	return `<span class="rect-element" style='background:${self.config.color[d.name]}; --w:30px; --h:12px; margin-right: 5px'></span>
		    	<span class="legend-label" style="font-size:10px">${d.name}</span>`
		    })
		    .on("click", (e, d)=>{
		    	let target = e.currentTarget;
		    	if (target.classList.contains("no-active")){
		    		target.classList.remove("no-active");
		    		self.hide_var[d.name]=false;
		    	}else{
		    		target.classList.add("no-active");
					self.hide_var[d.name]=true;

		    	}
		    	self.update()

		    })
		    .on("mouseenter", (d)=>{
		    	let path = null;
		    	self.lines.each((dd, i)=>{
		    		if (d.name==dd.name){
		    			path=self.lines.nodes()[i];
		    		}
		    	});
		    	d3.select(path).raise();
		    });
	}
	this.create_legend(dataset);
}
