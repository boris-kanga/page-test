/*

@@params config, variables
config: object like {
	custom: false,
	type: AUTO-SCROLL || CLICK ,
	oneLineTr:true,
	data_information
	
	limit:{ offset: 0, limit:1000, size: 10000},

	class_style:{
			table:"table",
			thead:"custom-thead",
			tr:"custom-tr",
			td:""
		}
	callbacks:{
		get_data:()=>{},
		create:()=>{},
		addlines: ()=>{},
		search:()=>{},
		order:()=>{},
		click_on_line:()=>{},
		click_on_column:()=>{}
	}
}
variables : list of object like {label:, type:, }

*/

function TableObject(id_selector, variables, default_dataset, config) {
	// Tools

	var prepare_config = function(config, default_conf){
		
		let calculated_conf={};
		if (!config) config={}
		Object.keys(default_conf).forEach((k)=>{
			calculated_conf[k]=config[k] || default_conf[k]
		})
		return calculated_conf;
	}
	var self = this;
	function runCallbackFunction(func){
		if (typeof func =='function'){
			var args = Array.prototype.slice.call(arguments, 1);
			return func(...args);
		}
	}
	var Ajax = function () {
	  var httpRequest = false;
	  if (window.XMLHttpRequest) { // Mozilla, Safari,...
	    httpRequest = new XMLHttpRequest();
	    if (httpRequest.overrideMimeType) {
	      httpRequest.overrideMimeType('text/xml');
	    }
	  }else if (window.ActiveXObject) { // IE
	    try {
	      httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
	    }
	    catch (e) {
	      try {
	        httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	      }
	      catch (e) {}
	    }
	  }
	  if (!httpRequest) {
	    alert('Abandon :( Impossible de créer une instance XMLHTTP');
	    return false;
	  }
	  return httpRequest;
	}

	config = prepare_config(config, {
		type:"AUTO-SCROLL", // "CLICK",
		oneLineTr:true,
		custom:false,
		limit:{offset: (default_dataset)? default_dataset.length :0 , limit:1000, size: 10000},
		data_information:null,
		callbacks:{
			before_getting_data:()=>{},
			calculate_truth_data_using_getting_datas:(data)=>data,
			after_getting_data:()=>{},
			error_when_get_data:(data)=>{},

			create:()=>{},
			addlines: ()=>{},
			search:()=>{},
			order:()=>{},
			click_on_line:()=>{},
			click_on_column:()=>{}
		},
		class_style:{
			table:"custom-table styled-table",
			thead:"custom-thead",
			tr:"custom-tr",
			td:""
		}
	});

	config["callbacks"] = prepare_config(config["callbacks"],{
			before_getting_data:()=>{},
			calculate_truth_data_using_getting_datas:(data)=>data,
			after_getting_data:()=>{},
			error_when_get_data:(data)=>{},

			create:()=>{},
			addlines: ()=>{},
			search:()=>{},
			order:()=>{},
			click_on_line:()=>{},
			click_on_column:()=>{}
		})



	this.id_selector=id_selector;
	this.variables=variables;
	this.config=config;

	// Calculation start
	if (config.custom){
		this.th_column=null;
		this.tbody = null;
		this.thead = null;
	}else{
		d3.select(id_selector).style("height", "100%").style("width", "100%");

		function new_search_element(input){
			d3.select(self.id_selector+" .search-container-element")
				.append("span").attr("class", "search-element-item")
				.text(input.value)
		}
		d3.select(id_selector).append("div")
			.attr("class", "search-tools")
			.html(`
				<div class="search-container-element"></div><input style="outline:none" placeholder="Recherche">

			`)
			
		d3.select(id_selector).select(".search-tools input").node().onkeyup=function (e) {
			if (e.keyCode==13){
				new_search_element(this)
				this.value="";
			}
		}
		this.th_column = d3.select(id_selector)
			.append("div")
			.attr("class", "cumstom-table-container hide-scroll")
			.style("height", "calc( 100% - 40px)")
			.style("max-height", "100%")
			.style("max-width", "100%")
			.append("table")
			.attr("class",config.class_style.table)
			.append("thead").attr("class", config.class_style.thead)
				.append("tr")
					.selectAll("th").data(variables).enter()
					.append("th").text((d)=>d.label)
		this.tbody=d3.select(id_selector).select("table").append("tbody");
		this.thead=d3.select(id_selector).select("thead");
		if (this.config["type"]=="AUTO-SCROLL"){
			this.currentData=(default_dataset) ? default_dataset: [];
			this.ON_SCROLLING = false;
			this.last_scroll_top = 0;
			d3.select(id_selector).select(".cumstom-table-container").node().onscroll=(e)=>{
				let target = e.currentTarget;
				if (this.last_scroll_top==target.scrollTop) return;
				this.last_scroll_top = target.scrollTop;
				if ((target.scrollTop+target.offsetHeight+5>=target.scrollHeight) && !this.ON_SCROLLING){
					this.ON_SCROLLING = true;
					console.log("[+] Going to get new datas");
					this.get_data();
					
				}else{
					this.ON_SCROLLING = false;
				}
			}
		}
		

	}

	// Tools
	
	// Méthodes
	this.get_data=()=>{
		if (self.config.data_information == null){ return;}
		/*
		self.config.data_information like 
			{
				method: "POST",
				url: "<?= PATH?>../Ajax/get-stat-data/",
				data:{"post_data": data}
			}
		*/
		runCallbackFunction(self.config.callbacks.before_getting_data)
		
		let args = self.config.data_information;
		let xhr = Ajax();
		xhr.onreadystatechange = (e)=>{
			let response = e.currentTarget;
			if (response.readyState != 4) {return;}
			console.log(response);
			if (response.status == 200){
		    	try{
		    		let dataset = JSON.parse(response.responseText);
			    	self.config.limit.offset+=dataset.length;
			    	//console.log(dataset);
					dataset = runCallbackFunction(self.config.callbacks.calculate_truth_data_using_getting_datas, dataset);
			    	if (dataset.length>0){
			    		//self.config.limit.offset+=dataset.length;
			    		if (self.config["type"]=="AUTO-SCROLL"){
							self.currentData = self.currentData.concat(dataset);
							dataset = self.currentData;
						}
			    		self.create(dataset);
			    	}
					runCallbackFunction(self.config.callbacks.after_getting_data);
		    	}catch(e){
		    		console.log("[-] Une erreur s'est produite");
					runCallbackFunction(self.config.callbacks.error_when_get_data, response.responseText)
		    	}

			}else{
				console.log("[-] Une erreur s'est produite");
				runCallbackFunction(self.config.callbacks.error_when_get_data, response.responseText)

			}

		}
		var data=JSON.stringify({
			"offset": self.config.limit.offset || null,
			"post_data": args.data || null,
		});
		
		var data = new FormData();
		data.append("offset", self.config.limit.offset || null);
		data.append("post_data", JSON.stringify(args.data) || null);
		

		xhr.open(args.method || "POST", args.url, true);
		//xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		
		xhr.send(data);


	};
	this.create =(data)=>{
		if (this.config.custom){

		}else{
			console.log(data)
			this.tbody.selectAll("tr").data(data).enter()
				.insert("tr").attr("class", self.config.class_style.tr)
					.selectAll("td").data((row)=>{return row.slice(0, self.variables.length)}).enter()
					.append("td").text((d)=>{return d})
		}


		
	};
	this.addData =()=>{

	};
	this.search=()=>{

	};
	this.order=()=>{

	};
	if (default_dataset) this.create(default_dataset);
	


	
}