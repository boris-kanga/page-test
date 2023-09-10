function WordCloud(id_selector, words, config={}){

    let _parent = d3.select(id_selector).node();
    let _parent_dim = _parent.getBoundingClientRect()
    config = {
	    width: config.width || _parent_dim.width || 100,
	    height: config.height || _parent_dim.height || 100,
	    maxFontSize: config.maxFontSize || 50
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
    let padding = config.padding || 10;
    let width = config.width - padding;
    let height = config.height - padding;

    // create g element, the root of all elements
    let root = this.svg.append("g")
          .attr("transform", "translate("+[padding/2, padding/2]+")");
    let max_count = Math.max(...words.map(x=>x.count))
    var layout = d3.layout.cloud()
          .size([width, height])
          .words(words)
          .rotate(()=>0)
          .fontSize((d)=>config.maxFontSize * d.count/max_count)
          .on("end", ()=>{
              root
                .append("g")
                  .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                  .selectAll("text")
                    .data(words)
                  .enter().append("text")
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .attr("text-anchor", "middle")
                    .attr("fill", (d, i)=>d3.schemePaired[i%d3.schemePaired.length])
                    .attr("transform", function(d) {
                        if (Math.abs(d.x)>layout.size()[0]/2){
                            d.x = 0;
                        }
                        if (Math.abs(d.y)>layout.size()[1]/2){
                            d.y = 0;
                        }
                        d.rotate=0;
                      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; });

          });
    layout.start();



}