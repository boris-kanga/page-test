function CJauge(){
    let svg = d3.select("#chart-root svg");
    let d_path = "M 20 250 A 230 230 0 0 1 " ;

    this.update = (value)=>{
        /*
            value may like
            {
                nb: 10,
                total: 100,
                reject: 2,
                title: "reçus"
            }
        */
        let {nb, total, reject, title} = value;
        let percent = 100*nb/total;
        reject = (reject>=0)? reject: 0;
        // validate and reject
        let reject_angle = reject*Math.PI/nb;
        let reject_start_point = {
            x: 250 + 130*Math.cos(reject_angle),
            y: 250 + 130*Math.sin(reject_angle)
        }

        // L 250 250 Z
        svg.select("#validate").attr("d", "M 120 250 A 130 130 0 0 0 "+[
                reject_start_point.x, reject_start_point.y]+"")

        svg.select("#reject").attr("d", "M 380 250 A 130 130 0 0 1 "+[
                reject_start_point.x, reject_start_point.y]+"")

        // text
        svg.select("#info-validate").attr("transform", "rotate("+(
                    (reject_angle*180)/(2*Math.PI)
                    )+" 250 250)")
                    .select(".info-text").text("Validé " + (nb-reject));

        svg.select("#info-reject").attr("transform", "rotate("+(
                    (reject_angle*180)/(2*Math.PI)-90
                    )+" 250 250)")
                    .select(".info-text").text("Rejeté " + reject)


        // jauge updating
        svg.select("#main-jauge")
            .transition().duration(750).tween("updating", (d, index, sel_list)=>{
                let sel = sel_list[index];
                let current_percent = d3.select(sel).attr("data-percent") || 0;
                let i = d3.interpolate(current_percent, percent);
                d3.select(sel).attr("data-percent", percent);
                return (t)=>{
                    let pp = i(t);
                    let x = 250 - 230 * Math.cos(pp*Math.PI/100);
                    let y = 250 - 230 * Math.sin(pp*Math.PI/100);
                    let text = Math.round(nb*pp/percent).toString();
                    let repeat_zero = Math.max(0, nb.toString().length - text.length);
                    svg.select(".main-value").text("0".repeat(repeat_zero) +text);

                    d3.select(sel).attr("d", d_path + [x, y]);

                    svg.selectAll(".point-end").attr("cx", x).attr("cy", y);
                    // adding of arrow

                    svg.select("#chart-aiguille")
                        .attr("transform", "rotate(" + [pp*1.8, 250, 250] +") ")


                };
            });
    }
}