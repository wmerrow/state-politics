// d3.csv('data/xxxx.csv', function (data_all) {

d3.queue()
.defer(d3.csv, "data/output/party_control.csv")
//.defer(d3.csv, "data/parties_first-last.csv")
.await(function(error, data_all) {
  if (error) throw error;

  /// remove nebraska for now
  var data_all = data_all
    .filter(({state}) => state !== "Nebraska");

  // convert columns to numeric
  data_all.forEach(function(data){
      data.year = +data.year;
      data.fips = +data.fips;
      data.pop = +data.pop;
      data.cont = +data.government_cont;
      data.cont_text = data.government_cont_text;
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
  var data21 = data_all.filter(({year}) => year === 2021);

  var oldWidth = 0

  function render(){
    // if (oldWidth == innerWidth) return
    // oldWidth = innerWidth

    // var width = height = d3.select('#graph').node().offsetWidth;

    // if (innerWidth <= 2925){
    //   width = innerWidth
    //   height = innerHeight*.7
    // }

    // console.log(width, height);

    // 700 x 440 is roughly the map aspect ratio so bubbles end up centered in states
    var width = 700;
    var height = 450;

    var r = 40;
    var textSize = 10;
    var nodePadding = 2;

    var contCats = ['NA', 'full_dem', 'lean_dem', 'lean_rep', 'full_rep'];

    // color scale for control categories
    var color = d3.scaleOrdinal()
      .domain(contCats)
      .range(['#dddddd', '#4393c3', '#92c5de', '#f4a582', '#d6604d']);
    // var colortest = d3.scaleOrdinal()
    //   .domain(contCats)
    //   .range(['#dddddd', '#358463', '#795573', '#478149', '#435793']);

    // size scale
    var pop_max = d3.max(data21, function(d) { return d.pop; });
    var size = d3.scaleSqrt()
      .domain([0, pop_max])
      .range([0, 30]); // max radius

    // x scale for longitude
    var xLonScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, 700]);
    // y scale for latitude
    var yLatScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height * 0, height * 1]);
    // x scale for control
    var xContScale = d3.scaleOrdinal()
      .domain(contCats)
      .range([width * 0.5,  width * 0.15,  width * 0.4,  width * 0.6,  width * 0.85]);
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
    var svg = d3.select('#graph').html('')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('id', 'mySvg');

    // // slider dimensions
    // var sliderSize = {
    //     w: width * 0.75,
    //     h: 50
    //   };
    // var sliderMargin = 15;
    // // slider min/max
    // var sliderMin = 1970;
    // var sliderMax = 2021;
    // // slider increment
    // var increment = 1;
    // // array of integers for slider ticks
    // var sliderTicks = [];
    // for (var i = sliderMin; i <= sliderMax; i = i + increment * 5) {
    //   sliderTicks.push(i);
    // };

    // // define the slider
    // var slider = d3.sliderTop()
    //   .min(sliderMin)
    //   .max(sliderMax)
    //   .default(0)
    //   .step(.5) // step between selectable values
    //   .width(sliderSize.w - sliderMargin * 2)
    //   // custom slider symbol
    //   .handle(
    //     d3.symbol()
    //       .type(d3.symbolCircle)
    //       .size(150)()
    //     )
    //   .tickValues(sliderTicks)
    //   .tickPadding(-3)
    //   // tick format
    //   .tickFormat(d3.format("d"))
    //   // remove minus signs and append +D or +R, or change to Even
    //   // .tickFormat((function (v) {
    //   //     if (v == 0) {
    //   //       return 'Even';
    //   //     } else if (v < 0) {
    //   //       return 'D +' + Math.abs(v); 
    //   //     } else if (v > 0) {
    //   //       return 'R +' + Math.abs(v); 
    //   //     };
    //   // }))
    //   .displayValue(true)
    //   // onchange, pass section and slider value to update function to update graphics
    //   .on('onchange', function (value) {
    //     update(value);
    //   });

    // // add slider title
    // // d3.select('#introSlider')
    // //   .append('text')
    // //   .attr('class', 'sliderTitle')
    // //   .text('Scenario')
    // //   .attr('transform', 'translate(' + (sliderWidth) / 2 + ', 21)');

    // svg.append('g')
    //   .attr('transform', 'translate(' + sliderMargin + ',' + (sliderSize.h - 10) + ')')
    //   .call(slider);

    // set up basemap
    var basemap = d3.select('#mySvg').append("svg:image")
      .attr("xlink:href", "img/us_map.svg")
      .attr("width", width) // changed from "width" (to set based on height)
      .attr("x", 0) //margin.left)
      .attr("y", 0)
      .style('display', 'none'); //margin.top);

    // add g after basemap so it goes on top
    var g = svg.append('g');
    var node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1).selectAll(".node");
    var nodes = data21;

    var simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-150))
      .force("forceX", d3.forceX().strength(.1))
      .force("forceY", d3.forceY().strength(.1))
      .force("center", d3.forceCenter())
      .alphaTarget(1)
      .on("tick", ticked);

    function update(nodes,
                    xScale,
                    xInput,
                    yScale,
                    yInput,
                    cScale,
                    cInput) { 

      // transition
      var t = d3.transition()
          .duration(750);

      // Apply the general update pattern to the nodes.

      node = node.data(nodes, d=> d.state);

      node.exit()
        .transition(t)
        .attr("r", 1e-6)
        .remove();

      node
        .transition(t)
        .style("fill", d=> cScale(d[cInput]))
        .attr("r", d=> size(d.pop));

      node = node.enter().append("circle")
        .style("fill", d=> cScale(d[cInput]))
        .attr("r", d=> size(d.pop))
        .merge(node);

      // Update and restart the simulation.
      simulation.nodes(nodes)
        .force("collide", d3.forceCollide().strength(1).radius(d=> size(d.pop) + 10).iterations(1));

      simulation.on('tick', function(){
        node.attr("cx", d=> xScale(d[xInput]))
            .attr("cy", d=> yScale(d[yInput]))
      });

    }

    function ticked() {
      node.attr("cx", d=> xLonScale(d.state_x))
          .attr("cy", d=> yLatScale(d.state_y))
    }





          //     // Features of the forces applied to the nodes
          // var simulation = d3.forceSimulation()
          //   // x and y positions depend on step
          //   .force("x", d3.forceX().strength(.1).x( function(d){ 
          //     return selectedX(d[selectedXinput]) 
          //   }))
          //   .force("y", d3.forceY().strength(.1).y( function(d){
          //     return selectedY(d[selectedYinput])
          //     // if (i > 1) {
          //     //   return selectedY(d[selectedYinput]);
          //     // } else {
          //     //   return 200;
          //     // }
          //   }))
          //   .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
          //   //.force("charge", d3.forceManyBody().strength(10)) // Nodes are attracted one another of value is > 0
          //   .force("collide", d3.forceCollide().strength(0.5).radius(d=> size(d.pop) + nodePadding).iterations(1)) // Force that avoids circle overlapping


    // // draw plot using specified data
    // function drawPlot(selectedData, selectedX, selectedXinput, selectedY, selectedYinput, selectedC, selectedCinput) {
    //   // var circles = g.selectAll("circle")
    //   //   .data(selectedData);

    //   // // if filtered dataset has less circles than already existing, remove excess
    //   // circles.exit()
    //   //   .remove();

    //   // // if filtered dataset has more circles than already existing, transition new ones in
    //   // var new_circles = circles.enter()
    //   //   .append("circle")
    //   //   .attr('class', 'myCircle')
    //   //   .attr("r", d=> size(d.pop))
    //   //   .attr('cx', width/2)
    //   //   .attr('cy', height/2)
    //   //   .style("fill", "#dddddd");

    //   // new_circles.merge(circles)
    //   //   .transition().duration(1500)
    //   //   // .attr("r", d=> size(d.pop)) // UNCOMMENT TO HAVE CIRCLES UPDATE POP
    //   //   .attr('cx', d=> xLonScale(d.state_x))
    //   //   .attr('cy', d=> yLatScale(d.state_y))
    //   //   .style("fill", d=> color(d.cont_text));
 
    //   // // // set up labels
    //   // // var circleLabel = g.selectAll("text")
    //   // //   .data(data21)
    //   // //   .enter()
    //   // //   .append("text")
    //   // //   .text(d=> d.state_short)
    //   // //   .attr("class", "label")
    //   // //   .style("text-anchor", "middle")
    //   // //   .style("font-size", textSize)
    //   // //   .attr('x', d=> xLonScale(d.state_x))
    //   // //   .attr('y', d=> yLatScale(d.state_y));



    //       // set up nodes and labels: all located at the center of the svg area to start
          
    //       var node = svg.append("g")
    //         .selectAll("node")
    //         .data(selectedData)
    //         .enter()
    //         .append("circle")
    //         .attr('class', 'myNode')
    //         .attr("r", d=> size(d.pop))
    //         .attr("cx", width / 2)
    //         .attr("cy", height / 2)
    //         .style("fill", d=> color(d.cont_text));

    //       // var label = svg.append("g")
    //       //   .selectAll("labelText")
    //       //   .data(data21)
    //       //   .enter()
    //       //   .append("text")
    //       //   .text(d=> d.state_abbrev)
    //       //   .attr("class", "label")
    //       //   .style("text-anchor", "middle")
    //       //   .style("font-size", textSize)
    //       //   .attr('x', width / 2)
    //       //   .attr('y', height / 2);



    //       // Apply these forces to the nodes and update their positions.
    //       // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
    //       simulation
    //         .nodes(selectedData)
    //         // positions gradually update on tick
    //         .on("tick", function(d){
              
    //           //// for step 1, fix positions of nodes so they aren't influenced by other forces
    //           // if (i === 1) {
    //           //   node.each(function(dd){
    //           //     dd.x = xScales[i](dd[xInputs[i]]);
    //           //     dd.y = dd.y
    //           //   }) 
    //           // }
    //           /// could do other stepts but need to figure out how to include transitions

    //           node
    //               .attr("cx", function(d){ return d.x; })
    //               .attr("cy", function(d){ return d.y; });
    //           // label
    //           //     .attr("x", function(d){ return d.x; })
    //           //     .attr("y", function(d){ return d.y + textSize / 2 - 2; }); // adds half of text size to vertically center in bubbles
    //         }); // end on tick

    //       // update node colors
    //       node.transition().style("fill", d=> selectedC(d[selectedCinput]));



    // }; // end drawPlot



    // update plot with specified year
    // function update(newYear, newX, newXinput, newY, newYinput, newC, newCinput) {
    //   // filter data set and redraw plot
    //   var newData = data_all
    //     .filter(({year}) => year === newYear);

    //   drawPlot(newData, newX, newXinput, newY, newYinput, newC, newCinput);
    // };






    var contText = ['All Dem', '2D 1R', '1D 2R', 'All Rep'];
    var contPositions = [0.1, 0.35, 0.55, 0.8];

    // add control labels
    var contLabel = svg.append("g").selectAll('.headerLabel')
      .data(contPositions).enter()
      .append('text')
      .text(function(d, i) {
          return contText[i]
      })
      .attr('class', 'headerLabel')
      .attr('x', d=> width * d)
      .attr('y', height * 0.25);

    // add year label
    var yearLabel = svg.append("g")
      .append('text')
      .text(2021)
      .attr('class', 'yearLabel')
      .attr('x', 325)
      .attr('y', height * 0.98);


    // GRAPH SCROLL WITH LISTENER

    var gs = d3.graphScroll()
        .container(d3.select('.container-1'))
        .graph(d3.selectAll('container-1 #graph'))
        .eventId('uniqueId1')  // namespace for scroll and resize events
        .sections(d3.selectAll('.container-1 #sections > div'))
        // .offset(innerWidth < 900 ? innerHeight - 30 : 200)
        .on('active', function(i){
          
          // STEPS (TURN WORD WRAP OFF FOR EASIER VIEW)

          //i             0              1                  2             3             4             5             6             7             8
          //year
          var dataYear =  [2021,         2021,              2021,         1975,         1995,         2010,         2010,         2011,         2021];
          //map
          var map =       ['FALSE',      'FALSE',           'TRUE',       'TRUE',       'TRUE',       'TRUE',       'TRUE',       'TRUE',       'TRUE'];
          //x
          var xScales =   [xContScale,   xVoteScale,        xLonScale,    xLonScale,    xLonScale,    xLonScale,    xLonScale,    xLonScale,    xLonScale];
          var xInputs =   ['cont_text',  'pres_vote_rep',   'state_x',    'state_x',    'state_x',    'state_x',    'state_x',    'state_x',    'state_x'];
          //y
          var yScales =   [dummyScale,   dummyScale,        yLatScale,    yLatScale,    yLatScale,    yLatScale,    yLatScale,    yLatScale,    yLatScale];
          var yInputs =   ['state_y',    'state_y',         'state_y',    'state_y',    'state_y',    'state_y',    'state_y',    'state_y',    'state_y'];
          //color
          var cScales =   [color,        color,             color,        color,        color,        color,        color,        color,        color];
          var cInputs =   ['cont_text',  'cont_text',       'cont_text',  'cont_text',  'cont_text',  'cont_text',  'cont_text',  'cont_text',  'cont_text'];          

          // filter data to desired year
          var newData = data_all
            .filter(({year}) => year === dataYear[i]);

          // update bubbles
          update(newData,
                 xScales[i],
                 xInputs[i],
                 yScales[i],
                 yInputs[i],
                 cScales[i],
                 cInputs[i]);

          // node
          //   .data(data21)
          //   .attr("cx", function(d){ return d.x; })
          //   .attr("cy", function(d){ return d.y; })

          if (i === 0) {
            d3.selectAll('.headerLabel').style('opacity', 1);
          } else {
            d3.selectAll('.headerLabel').style('opacity', 0);
          }

          // basemap - show or hide depending on step
          if (map[i] === 'FALSE') {
            basemap.style('display', 'none');
            //d3.selectAll('.myCircle').style('display', 'none');
            //node.style('opacity', 1);
            //label.style('opacity', 1);
            yearLabel.style('opacity', 0)
          } else if (map[i] === 'TRUE') {
            basemap.style('display', 'block');
            //d3.selectAll('.myCircle').style('display', 'block');
            //node.style('opacity', 0);
            //label.style('opacity', 0);
            yearLabel.style('opacity', 1)
          };

          // update year label
          yearLabel.transition().text(dataYear[i]);

        }); // end 'active' listener


    // SECTION 2

    var svg2 = d3.select('.container-2 #graph').html('')
      .append('svg')
        .attrs({width: width, height: height})

    var path = svg2.append('path')

    var gs2 = d3.graphScroll()
        .container(d3.select('.container-2'))
        .graph(d3.selectAll('.container-2 #graph'))
        .eventId('uniqueId2')  // namespace for scroll and resize events
        .sections(d3.selectAll('.container-2 #sections > div'))
        .on('active', function(i){
          var h = height
          var w = width
          var dArray = [
            [[w/4, h/4], [w*3/4, h/4],  [w*3/4, h*3/4], [w/4, h*3/4]],
            [[0, 0],     [w*3/4, h/4],  [w*3/4, h*3/4], [w/4, h*3/4]],
            [[w/2, h/2], [w, h/4],      [w, h],         [w/4, h]],
            [[w/2, h/2], [w, h/4],      [w, h],         [w/4, h]],
            [[w/2, h/2], [w, h/2],      [0, 0],         [w/4, h/2]],
            [[w/2, h/2], [0, h/4],      [0, h/2],         [w/4, 0]],
          ].map(function(d){ return 'M' + d.join(' L ') })


        })

    d3.select('#source')
        .styles({'margin-bottom': window.innerHeight - 450 + 'px', padding: '100px'})
  
  } // end render function
  
  // initial render
  render()
  
  // listener to render on resize
  d3.select(window).on('resize', render)

}); // end d3.csv

