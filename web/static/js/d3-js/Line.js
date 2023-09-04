/*
@@params target, data, config:
	target the same definition in the file D3KBChart

	data like :
	{
		origin: {name, value},
		evolutions --array--: [
			{
				"dx": [ {name, value}],
				"result" --(str | object like {name, value})--
			}

		]

	}

	config:



*/
// Restant: fill - d3.area; update, legend, grids, zoom,
class KBLine extends D3KBChart{

    static HOVER = {
        TYPE1: 0,
        TYPE2: 1,
        TYPE3: 2 // Line
    }
    #default_config = {
        "hover_type": KBLine.HOVER.TYPE3,
        "on_points_mouseenter": (d)=>{},
        "on_points_mouseleave": (d)=>{},
        fill: "#0000",
        stroke: "var(--orange)",
        "stroke-width": 2

    };

	constructor(target, data, config){
		super(target, data, config);
		this._default_config = this.#default_config;
		data = this.dataset;
        if (data.map){
            //
            if (data[0].name === undefined){
                // data like [{x:_, y:_, tick:_}, ... ]
                this.dataset = [{name: "Dataset 1", values: data}]
            }
        }
        else{
            // data like {"dataset_name": [{x:_, y:_, tick:_}, ... ]}
            this.dataset = object.keys(data).map((k)=>{ return {name: k, values: data[k]}})
        }
		this.draw();
	}

    grid(axis="both"){
        switch (axis){
            case "x":{
                let _dataset = this.dataset;
                //this.scaleX.ticks();
                break;
            }
        }
    }

	draw(){
	    let config = this.config;
	    let _dataset = this.dataset;
        console.log(_dataset);
        let svg = d3.select(this.svg)
                .attr("width", config.width)
                .attr("height", config.height)
                .attr("viewBox", "0 0 " + config.width + " " + config.height)
	    var y = d3.scaleLinear()
			.domain([0, d3.max(_dataset, (d)=>{ return d3.max(d.values, (dd)=>+dd.y); })])
			.range([config.height, 0]);

        var x = d3.scaleLinear()
                .domain([0, d3.max(_dataset, (d)=>{return d3.max(d.values, (dd)=>+parseInt(dd.x)); })])
                .range([0, config.width]);
		var lines = svg
            .selectAll(".line")
            .data(_dataset)
            .enter()
            .append("g")
            .attr("class", "line")
            .append("path")
            .attr("d", (d)=> {
                return (
                    d3.line()
                        .curve(d3["curveLinear"])
                        .x(d => x(parseInt(d.x)))
                        .y(d => y(d.y))
                    )(d.values)
                })
            .attr("fill", (d, index)=>{
                if (typeof config.fill === "function") return config.fill(d, index);
                if (typeof config.fill === "string") return config.fill;
                if (Array.isArray(config.fill)) return config.fill[index % config.fill.length];
                return "#0000";
            })
            .attr("stroke", (d, index)=>{
                if (typeof config.stroke === "function") return config.stroke(d, index);
                if (typeof config.stroke === "string") return config.stroke;
                if (Array.isArray(config.stroke)) return config.stroke[index % config.stroke.length];
                return "#000";
            })
            .attr("stroke-width", (d, index)=>{
                if (typeof config["stroke-width"] === "function") return config["stroke-width"](d, index);
                if (["number", "string"].includes(typeof config["stroke-width"])) return config["stroke-width"];
                if (Array.isArray(config["stroke-width"])) return config["stroke-width"][index % config.stroke.length];
                return 1;
            });

        var points = svg.selectAll(".line-points")
			.data(_dataset).enter()
			.append("g")
			.attr("class", "line-points")
			.selectAll(".item-point").data((line, i)=>{
			    return line.values.map((d)=>{
				return {x: d.x, y:d.y, "i": i, "name": line.name};
			})}).enter()
				.append("circle")
				.attr("class", "item-point")

				.attr("cx", d => x(parseInt(d.x)))
				.attr("cy",d=> y(d.y))
				.attr("r", 0)
				.style("cursor", "pointer")
				//.style("fill", (d)=>config["point-color"] || config.color[d.name])
				//.style("stroke", (d)=>config["point-stroke-color"] || config.color[d.name])
				//.style("stroke-width", (d)=>config["point-stroke-width"])
				.on("mousemove", (e, d)=>{
				    // d like {x:_, y:_, i:_, name:_}
					let circle = d3.select(e.currentTarget);
					circle.transition().duration(100).attr("r", 1*1.5);
				})
				.on("mouseleave", (e, d)=>{
					let circle = d3.select(e.currentTarget);
					circle.transition().duration(100).attr("r", 1);
					/*
					setTimeout(()=>{
						self.tooltip.style("display", "none");
					}, 500)
					*/

				})

        switch (config.hover_type){
            case KBLine.HOVER.TYPE1:{
                break;
            }
            case KBLine.HOVER.TYPE2:{

                break;
            }
            case KBLine.HOVER.TYPE3:{
                 svg.on("mousemove", (e)=>{
                        let pos = [e.offsetX, e.offsetY]
                        let elm = this.nearest(e.offsetX, e.offsetY, svg.selectAll(".item-point").nodes());
                        if (elm.node === null) return;
                        let data = elm.node.__data__;
                        d3.select(".kb-hover-indicator").remove()
                        svg.append("g")
                            .attr("class", "kb-hover-indicator")
                            .append("line")
                            .attr("stroke-width", 1)
                            .attr("x1", x(parseInt(data.x)))
                            .attr("x2", x(parseInt(data.x)))
                            .attr("y1", 0)
                            .attr("y2", config.height)
                            .attr("stroke", "#ccce")
                            .attr("stroke-dasharray",4);

                        config.on_points_mouseenter(data, elm.index);
                        e.stopPropagation();

                    })
                    .on("mouseleave", (e, d)=>{
                        if (e.currentTarget == svg.node()){
                            d3.select(".kb-hover-indicator").remove();
                            config.on_points_mouseleave();
                        }
                        e.stopPropagation();

                    })
                break;
            }
            default:{}
        }


        super.modify = false;
        this.scaleX = x;
        this.scaleY = y;

	}

}