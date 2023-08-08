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

class CBar extends D3KBChart{


	constructor(target, data, config){
		super(target, data, config);

		this.draw();
	}	

	draw(){

	}

}