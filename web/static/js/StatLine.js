function StatLine(id_selector, dataset, config={}){
    let _parent = d3.select(id_selector).node();
    let _parent_dim = _parent.getBoundingClientRect()
    config = {
	    width: config.width || _parent_dim.width || 100,
	    height: config.height || _parent_dim.height || 100,
	    line_weight: config.line_weight || 3
	};

    let _get_svg = (sel)=>{
        if (typeof sel === "string"){
            if (!/^[^\d|a-z](.*)$/i.exec(sel) && !document.querySelector(sel)){
                sel = "#" + sel
            }
			sel = document.querySelector(sel);
		} else if (sel instanceof Element || sel === null){

		}else if (sel.get){
			sel = sel.get(0);
		}else if (sel.node){
			sel = sel.node();
		}
		if (!(sel instanceof Element)) throw "Bad target argument given";
		if (sel.tagName !== "SVG"){
			let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			sel.append(svg);
			sel = svg;
		}
		return sel;
    }
    this.svg = d3.select(_get_svg(_parent))
        .attr("width", config.width)
        .attr("height", config.height);
    let line_weight = config.line_weight || 5;
    let padding = config.padding || 50;
    let width = config.width - 25;
    let height = config.height - 40;

    // create g element, the root of all elements
    let root = this.svg.append("g")
          .attr("transform", "translate("+[15, 10]+")");

    let x = d3.scaleLinear()
          .domain([0, Math.max(...dataset.map(d=>d.values.length - 1))])
          .range([ 0, width])

    //Math.min(...dataset.map(d=>Math.min(...d.values.map(y=>y.y)))) - 0.1
    let y = d3.scaleLinear()
			.domain([0,1])
			.range([height, 0]);
	let yAxis = root.append("g")
    	.attr("class", "axis")
    	.attr("font-size", 9)
    	.call(d3.axisLeft(y).ticks(3).tickFormat((d, i)=>{
    	    if (i==0) return "0"
    	    if (i==2) return "100"
    	    return ""
    	}));
    yAxis.select(".domain").remove();
    yAxis.selectAll(".tick").each((v, i, nodes)=>{
        let tick = d3.select(nodes[i]);
        if (i <= 1) return tick.remove();
        tick.select("line").remove();
        let value = tick.select("text").html();
        tick.select("text").html("").attr("fill", "red").append("tspan").text(value).attr("dx", 15)
        tick.select("text").append("tspan").text("%").attr("dy", -5)
            .attr("font-size", "5px")
        ;
    });
    root.append("line").attr("x2", x(dataset[0].values.length-1))
        .attr("y2", 0).attr("x1", 5).attr("y1", 0).attr("stroke", "red").attr("stroke-width", 3)
        ;
    /*
    let xAxisTop = root.append("g")
    	.attr("class", "axis")
		//.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));
	*/
	let xAxisBottom = root.append("g")
    	.attr("class", "axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisTop(x));
    xAxisBottom.selectAll(".tick")
        .each((v, i, nodes)=>{
            let d = dataset[0].values[i];
            let tick = d3.select(nodes[i]);
            tick.select("line").attr("y2", 7)
            tick.select("text").html("").attr("y", 15).append("tspan").text(d.x)
            if (d.month) tick.select("text").append("tspan").text(d.month).attr("dy", 9).attr("dx", -10)
        })

	root.selectAll(".axis path.domain").attr("stroke-dasharray", 5).attr("stroke-width", 3);
    /*
    root.selectAll(".tick text")
			.attr("transform", "rotate(0)")
			.attr("x", 0)
			.attr("y", 9)
			.style("alignment-baseline", "middle")
    		.style("text-anchor", "middle")
    		.attr("fill", "blue");
    */
    root.selectAll(".line")
        .data(dataset)
        .enter()
        .append("path").attr("class", "line")
        .attr("d", (d, i)=>{
            return (d3.line()
                    // curveCardinal
                    .curve(d3["curveLinear"])
                    .x((d,i) => {return x(i)})
                    .y(d => {return y(d.y)})
                    )(d.values);
        })
        .attr("fill", "#0000")
        .attr("stroke-width", line_weight)
        .attr("stroke", (d, i)=> i==0? "#6f42c1": "#ffc107")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round");

    this.dataset = dataset;

    this.update = (_data)=>{
        console.log(_data);
        root.selectAll(".line").remove();
        root.selectAll(".line")
        .data(_data)
        .enter()
        .append("path").attr("class", "line")
        .attr("d", (d, i)=>{
            console.log(d, i);
            if (!d.active) return "M0 0";
            return (d3.line()
                    // curveCardinal
                    .curve(d3["curveLinear"])
                    .x((d,i) => {return x(i)})
                    .y(d => {return y(d.y)})
                    )(d.values);
        })
        .attr("fill", "#0000")
        .attr("stroke-width", line_weight)
        .attr("stroke", (d, i)=> i==0? "#6f42c1": "#ffc107")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round");

    }
}