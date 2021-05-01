d3.queue()
    .defer(d3.csv, "data/output/party_control.csv")
    .await(function(error, data_all) {
        if (error) throw error;

        /// remove nebraska for now
        var data_all = data_all
            .filter(({ state }) => state !== "Nebraska");

        // convert columns to numeric
        data_all.forEach(function(data) {
            data.year = +data.year;
            data.fips = +data.fips;
            data.pop = +data.pop;
            data.government_cont = +data.government_cont;
            data.govparty_c = +data.govparty_c;
            data.hs_cont_alt = +data.hs_cont_alt;
            data.sen_cont_alt = +data.sen_cont_alt;
            data.hs_dem_prop_all = +data.hs_dem_prop_all;
            data.hs_rep_prop_all = +data.hs_rep_prop_all;
            data.sen_dem_prop_all = +data.sen_dem_prop_all;
            data.sen_rep_prop_all = +data.sen_rep_prop_all;
            data.pres_vote_rep = +data.pres_vote_rep;
        })
        console.log(data_all);

        // filter to 2021
        var data21 = data_all.filter(({ year }) => year === 2021);
        var oldWidth = 0;

        function render() {

            // 700 x 440 is roughly the map aspect ratio so bubbles end up centered in states
            //margins???
            var width = 700;
            var height = 450;

            var r = 40;
            var textSize = 10;
            var nodePadding = 2;

            let ts = ['NA', 'full_dem', 'lean_dem', 'lean_rep', 'full_rep'];
            let heads = [0.1, 0.35, 0.55, 0.8];

            // color scale
            var color = d3.scaleOrdinal()
                .domain(ts)
                .range(['#dddddd', '#4393c3', '#92c5de', '#f4a582', '#d6604d']);

            // size scale
            let pop_max = d3.max(data21, function(d) { return d.pop; });
            var size = d3.scaleSqrt()
                .domain([0, pop_max]) // get from data
                .range([0, 30]); // max radius

            // x scale for control
            var xContScale = d3.scaleOrdinal()
                .domain(ts)
                .range([width * 0.5, width * 0.15, width * 0.4, width * 0.6, width * 0.85]);

            // x scale for pres vote
            var xVoteScale = d3.scaleLinear()
                .domain([0.2, 0.8])
                .range([width * 0, width * 1]);

            var yLegScale = d3.scaleLinear()
                .domain([0, 16])
                .range([height * .8, height * 0.2]);

            // dummy scale
            var dummyScale = d3.scaleLinear()
                .domain([-1000, 1000])
                .range([200, 200]);

            // SECTION 1

            // add svg
            var svg = d3.select('#graph')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('id', 'mySvg');

            // set up nodes and labels: all located at the center of the svg area to start
            var node = svg.append("g")
                .selectAll("node")
                .data(data21)
                .enter()
                .append("circle")
                .attr('class', 'myNode')
                .attr("r", 0)
                .attr("cx", d => xContScale(d.government_cont_text))
                .attr("cy", height / 2)
                .style("fill", d => color(d.government_cont_text))

            var label = svg.append("g")
                .selectAll("labelText")
                .data(data21)
                .enter()
                .append("text")
                .text(d => d.state_abbrev)
                .attr("class", "label")
                .style("text-anchor", "middle")
                .style("font-size", textSize)
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr("opacity", 0);

            ts = ['All Dem', '2D 1R', '1D 2R', 'All Rep'];
            svg.append("g").selectAll('.headerLabel')
                .data(heads).enter()
                .append('text')
                .text(function(d, i) {
                    return ts[i]
                })
                .attr('class', 'headerLabel')
                .attr('x', function(d) {
                    return (width * d)
                })
                .attr('y', height * 0.25);

            // GRAPH SCROLL WITH LISTENER
            var gs = d3.graphScroll()
                .container(d3.select('.container-1'))
                .graph(d3.selectAll('container-1 #graph'))
                //.eventId('uniqueId1') // namespace for scroll and resize events
                .sections(d3.selectAll('.container-1 #sections > div'))
                .on('active', function(i) {
                    console.log(i)
                    var xScales = [xContScale, xVoteScale];
                    var xInputs = ['government_cont_text', 'pres_vote_rep'];
                    var yScales = [dummyScale, dummyScale];
                    var yInputs = [0, 0]; // figure out why /4 instead of /2

                    let strength_x = (i === 1) ? 0.5 : 0.2; //Force X is 0 at 2. graph


                    // Features of the forces applied to the nodes
                    let simulation = d3.forceSimulation()
                        .force("x", d3.forceX().strength(strength_x).x(function(d) {
                            return xScales[i](d[xInputs[i]])
                        }))
                        .force("y", d3.forceY().strength(0.1).y(function(d) {
                            return yScales[i](0)
                        }))
                        .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
                        .force("collide", d3.forceCollide().strength(0.5).radius(d => size(d.pop) + nodePadding).iterations(1)) // Force that avoids circle overlapping
                        .nodes(data21)
                        .on("tick", function(d) {
                            node
                                .attr("cx", function(d) {
                                    return d.x;
                                })
                                .attr("cy", function(d) {
                                    return d.y;
                                })
                            label
                                .attr("x", function(d) { return d.x; })
                                .attr("y", function(d) { return d.y + textSize / 2 - 2; }) // adds half of text size to vertically center in bubbles
                        });

                    node.transition().delay(400).attr("r", d => size(d.pop));
                    label.transition().delay(400).attr("opacity", 1);


                    //Marginally smoother transitions
                    simulation.alphaTarget(0.3);
                    var t = d3.timer(function(elapsed) {
                        if (elapsed > 1000) {
                            simulation.alphaTarget(0); //After 1500ms, rest
                            console.log("Time Passed")
                            t.stop()
                        };
                    }, 1);

                }); // end 'active' listener

            d3.select('#source').styles({ 'margin-bottom': window.innerHeight - 450 + 'px', padding: '100px' })

        } // end render function

        // initial render
        render()

    }); // end d3.csv