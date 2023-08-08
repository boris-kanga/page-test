/*
@@params target, data, config:
	target:
		str: selector for the SVG element or the parent of the generated SVG Element we created,
		DOMElement: The SVG Element or the parent of the generated SVG Element we created,

	data as the chart needed,

	config:



*/


class D3KBChart{
	#target;
	#data;
	#config;
	_default_config = {};
	modify = true;

	constructor(target, data, config){
		// try to resolve target
		if (typeof target === "string"){
			target = document.querySelector(target);
		} else if (target instanceof Element || target === null){

		}else if (target.get){
			target = target.get(0);
		}else if (target.node){
			target = target.node();
		}
		if (!(target instanceof Element)) throw "Bad target argument given";
		if (target.tagName !== "SVG"){
			let tar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			target.append(tar);
			target = tar;
		}
		this.#target = target;
        let empty = {};
        if (Array.isArray(data)){
            empty =  [];
        }
		this.#data = Object.assign(empty, data);
		this.#config = config;

	}
	get svg(){return this.#target}
	get root(){return this.#target.parentNode}
	get config(){
	    if (this.modify) this.#config = this.#prepare_config(this.#config);
	    return this.#config;
	}
	put_config_var(key, value){
	    this.#config[key] = value;
	}
	get dataset(){
	    if (this.modify) this.#data = this.#prepare_data(this.#data);
	    return this.#data;
	}
	set dataset(data){ this.#data = data;}

	get_default_config(){return this._default_config;}

    _map_color(domain, color="var(--orange)"){
        if (typeof color === "string") color = ["#fff", color];
        let colors = [];
        if (! Array.isArray(color)) throw "Bad color value given";
        for (let col of color){
            let res = /(?:var\()?(--[\w\d_]+)\)/.exec(col);
            if (res){
                col = getComputedStyle(document.documentElement)
                    .getPropertyValue(res[1]);
            }
            colors.push(col);
        }
        return d3.scaleLinear().domain(domain || [0, 1])
            .range(color);
    }
    _color(index){
        let color = this.config.color || d3.schemeSet3;
        this.modify = false;
        return color[index % color.length];
    }
	#prepare_config(config){
        config = config || this.get_default_config();
        var default_config = this.get_default_config();
	    let parent_ = this.root;
	    config.width = config.width || parent_.offsetWidth || 50;
	    config.height = config.height || parent_.offsetHeight || 50;

        config = Object.assign(default_config, config);

		return config;

	}
	get_center(elem, svg){
        var  ctm = elem.getCTM();
        var  bbox = elem.getBBox();

        // Calculate the centre of the group
        var cx = bbox.x + bbox.width/2;
        var cy = bbox.y + bbox.height/2;

        // Transform cx,cy by the group's transform
        var pt = (svg || this.svg).createSVGPoint();
        pt.x = cx;
        pt.y = cy;
        pt.r = 1
        pt = pt.matrixTransform(ctm);
        return {x: pt.x, y: pt.y, width: bbox.width, height: bbox.height};
    }

	nearest(x, y, nodes){
        let min_val = Infinity;
        let final_node = null;
        let index = 0;
        let selected_index = null;
        for(let node of nodes){
            let p = this.get_center(node);
            let c = Math.abs(x-p.x);
            if ((c < min_val) && (c < this.config.width/Math.max(nodes.length, 5))){
                min_val = c;
                final_node = node;
                selected_index = index;
                if (min_val<1) return {"node": final_node, "index": selected_index};
            }
            index ++;
        }
        return {"node": final_node, "index": selected_index};
	}

	#prepare_data(data){
		return data;
	}

	static create(type, target, data, config){
	    // class method
	}


}