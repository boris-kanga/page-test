
function LinePrevision(target, data, config){

    _get_svg = (sel)=>{
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
    this.svg = d3.select(_get_svg(target))
        .attr("width", config.width || 50)
        .attr("height", config.height || 50);
    let width = config.width - 10;
    let height = config.height - 10;
    let root = this.svg.append("g")
          .attr("transform", "translate("+[2.5, 2.5]+")");

    _mean = (_data)=>{
        if (!_data.length) return 0;
        return _data.map(d=>d.y).reduce((a, b)=>a+b, 0)/_data.length;
    }
    _std = (_data)=>{
        if (!_data.length) return 0;
        m = _mean(_data);
        return Math.pow(_data.map(d=>d.y).map((x)=> Math.pow(x-m, 2)).reduce((a,b)=>a+b, 0)/_data.length, 0.5)
    }

    this.draw = (point)=>{

        let m = _mean(data), s = _std(data);
        let temp_point = point || m;
        let prevision = {min: m-s, max: m+s};
        var y = d3.scaleLinear()
			.domain([d3.min(data, (d)=>{ return Math.min(d.y, prevision.min, temp_point); }),
			    d3.max(data, (d)=>{return Math.max(d.y, prevision.max, temp_point); })])
			.range([height, 0]);

		var x = d3.scaleLinear()
                .domain([0, data.length])
                .range([0, width]);
        let _prev_max = Object.assign([], data);
        let _prev_min = Object.assign([], data);
        _prev_max.push({x: data.length, y:prevision.max});
        _prev_min.push({x: data.length, y:prevision.min})

        root.selectAll(".line")
            .data([_prev_max, _prev_min, data])
            .enter()
            .append("path").attr("class", "line")
            .attr("d", (d, i)=>{
                return (d3.line()
                        .curve(d3["curveLinear"])
                        .x(d => x(d.x))
                        .y(d => y(d.y))
                        )(d);
            })
            .attr("fill", "#0000")
            .attr("stroke-width", 1)
            .attr("stroke", "#fff")
            .attr("stroke-dasharray", (d, i)=> (i<2)? 5: 0)
            .attr("stroke-linecap","round")
        ;
        let last_point = data[data.length-1];
        root.append("polygon")
            .attr("points", ""+[x(last_point.x), y(last_point.y)] +" "+
                            [x(data.length), y(prevision.max)] + " " +
                            [x(data.length), y(m)])
            .attr("class", "region-max")
        root.append("polygon")
            .attr("points", ""+[x(last_point.x), y(last_point.y)] +" "+
                            [x(data.length), y(prevision.min)] + " " +
                            [x(data.length), y(m)])
            .attr("class", "region-min")

        root.selectAll("polygon")
            .attr("fill", "#007bff55")

        if (point){
            root.append("circle")
                .attr("cx", x(data.length)).attr("cy", y(point))
                .attr("fill", "var(--red)").attr("r", 3)
            ;
        }
    }

}