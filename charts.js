d3.queue()
.defer(d3.csv, "data/output/party_control.csv")
.defer(d3.csv, "data/output/party_control_aggregated.csv")
.await(function(error, data_all, data_all_ag) {
  if (error) throw error;

  /// remove nebraska for now
  var data_all = data_all.filter(({state}) => state !== "Nebraska");
  var data_all_ag = data_all_ag.filter(({cont_text}) => cont_text !== "NA");

  // convert columns to numeric
  data_all.forEach(function(data){
      data.year = +data.year;
      data.fips = +data.fips;
      data.pop = +data.pop;
      data.government_cont = +data.government_cont;
      data.cont_text = data.cont_text;
      data.govparty_c = +data.govparty_c;
      data.hs_cont_alt = +data.hs_cont_alt;
      data.sen_cont_alt = +data.sen_cont_alt;
      data.hs_dem_prop_all = +data.hs_dem_prop_all;
      data.hs_rep_prop_all = +data.hs_rep_prop_all;
      data.sen_dem_prop_all = +data.sen_dem_prop_all;
      data.sen_rep_prop_all = +data.sen_rep_prop_all;
      data.pres_share_dem = +data.pres_share_dem;
      data.pres_share_rep = +data.pres_share_rep;
      data.pres_marg_rep = +data.pres_marg_rep;
    })

    data_all_ag.forEach(function(data){
      data.year = +data.year;
      data.pop = +data.pop;
      data.pop_pct = +data.pop_pct;
      data.pop_yr = +data.pop_yr;
      data.cont_text = data.cont_text;
    })

  // filter to 2021
  var data_all_2021 = data_all.filter(({year}) => year === 2021);
  var data_all_ag_2021 = data_all_ag.filter(({year}) => year === 2021);

      // function for stacking data (for pres bar chart)
      // var myStack = function (dataToStack) {
      //   var total = d3.sum(dataToStack, d => d.pop_pct);
      //   let stackPosition = 0;
      //   return dataToStack.sort((a,b)=>d3.ascending(+a.cont, +b.cont))
      //     .map(d => ({
      //       state: d.state,
      //       rlean: d.rlean,
      //       electors: +d.electors,
      //       startPosition: stackPosition,
      //       endPosition: (stackPosition += +d.electors)
      //     }));
      // };

      // var data_nest = myStack(data_all_ag);
    var mycontCats = ['full_dem', 'full_rep', 'split', 'NA'];
    var contCats = ['full_dem', 'split', 'full_rep', 'NA'];

    var data_nest = d3.nest()
      .key(function(d) { return d.year; })
      .key(function(d) { return d.cont_text; })
      .rollup(function(v) { return d3.sum(v, function(d) { return d.pop_pct; }); })
      .entries(data_all_ag);

    console.log(data_nest);
    
    var years = data_nest.map(function(d) { return d.key; })
    console.log(years);

    var data_stack = [];
    
    data_nest.forEach(function(d, i) {
      d.values = d.values.map(function(e) { return e.value; })
      var t ={}
      mycontCats.forEach(function(e, i) {
        t[e] = d.values[i]
      })
      t.year = d.key;
      data_stack.push(t)
    });
    
    console.log(data_stack);

    var layers = d3.stack().keys(mycontCats)(data_stack);

    console.log(layers);







  var oldWidth = 0;

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
    var scalar = 1.37;
    var width = 700 * scalar;
    var mapAspect = 582.5 / 918.4; // map aspect ratio
    var height = width * mapAspect;
    var mapWidth = width * 0.6;
    var mapHeight = mapWidth * mapAspect;

    var mapMargin = {
      top: 30,
      right: (width - mapWidth) * 0.5,
      bottom: 30,
      left: (width - mapWidth) * 0.5
    }

    var r = 40;
    var textSize = 11;
    var nodePadding = 1;

    // var contMeta = {
    //   "full_dem": {
    //     "label": "Democrat trifecta",
    //     "position": 0.25
    //   },
    //   "split": {
    //     "label": "Split control",
    //     "position": 0.5
    //   },
    //   "full_rep": {
    //     "label": "Republican trifecta",
    //     "position": 0.75
    //   },
    //   "NA": {
    //     "label": "",
    //     "position": 0.5
    //   }
    // };

    var contText = ['Democrat trifecta', 'Split control', 'Republican trifecta', 'Other'];
    var contPositions = [0.25, 0.5, 0.75, 0.5];

    // create object with control metadata to use for lookup
    var contMeta = {};
    contCats.forEach((key, i) => contMeta[key] = {"text": contText[i], "position": contPositions[i]});

    // with categories for lean dem/rep
    // var contCats = ['full_dem', 'lean_dem', 'lean_rep', 'full_rep', 'NA'];
    // var contText = ['Dem. trifecta', '2D 1R', '1D 2R', 'Rep. trifecta', 'Split'];
    // var contPositions = [0.25, 0.5, 0.5, 0.75, 0.5];
    // var contPositions = [0.15, 0.4, 0.6, 0.85, 0.5];

    // color scale for control categories
    var color = d3.scaleOrdinal()
      .domain(contCats)
      .range(['#0078c2', '#a8a8a8', '#d6422b', '#dddddd']);
      // .range(['#0078c2', '#92c5de', '#f4a582', '#d6422b', '#dddddd']);
      //.range(['#4393c3', '#92c5de', '#f4a582', '#d6604d', '#dddddd']);
    // var colortest = d3.scaleOrdinal()
    //   .domain(contCats)
    //   .range(['#358463', '#795573', '#478149', '#435793', '#dddddd']);

    // data min and max
    var pop_max = d3.max(data_all_2021, function(d) { return d.pop; });
    var pop_min = d3.min(data_all_2021, function(d) { return d.pop; });
    var marg_rep_max = d3.max(data_all_2021, function(d) { return d.pres_marg_rep; });
    var marg_rep_min = d3.min(data_all_2021, function(d) { return d.pres_marg_rep; });
    // determine max margin of victory for either Rs or Ds (check if marg_rep_max or marg_rep_max is farther from 0)
    var max_marg = d3.max([marg_rep_max, Math.abs(marg_rep_min)]);

    // size scales
    var sizeChart = d3.scaleSqrt()
      .domain([0, pop_max])
      .range([0, 30 * scalar]); // max radius for charts
    var sizeMap = d3.scaleSqrt()
      .domain([0, pop_max])
      .range([0, 20 * scalar]); // max radius for map
    var sizeText = d3.scaleLinear()
      .domain([pop_min, (pop_max - pop_min) / 2]) // max domain is pop midpoint
      .range([8, 12]) // min and max font size
      .clamp(true); // specifies that values beyond max domain (largest states) should not be larger than max font size in range

    // x scale for longitude
    var xLonScale = d3.scaleLinear()
      .domain([0, 1])
      .range([mapMargin.left, width - mapMargin.right]);
    // y scale for latitude
    var yLatScale = d3.scaleLinear()
      .domain([0, 1])
      .range([mapMargin.top, mapHeight + mapMargin.top]);
    // x scale for control
    var xContScale = d3.scaleOrdinal()
      .domain(contCats)
      .range(contPositions.map(function(x) { return x * width; })); // a new array multiplying each element of contPositions by width 
    // x scale for pres vote
    var xVoteScale = d3.scaleLinear()
      .domain([0 - max_marg, max_marg])
      .range([width * 0.1, width * 0.9]);
    var yLegScale = d3.scaleLinear()
      .domain([0, 16])
      .range([height * .8, height * 0.2]);
    // dummy scale
    var yDefault = 200;
    var dummyScale = d3.scaleLinear()
      .domain([-1000, 1000])
      .range([yDefault, yDefault]);

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
      .attr("width", mapWidth)
      .attr("x", mapMargin.left)
      .attr("y", mapMargin.top)
      .style('opacity', 0);
      // .style('display', 'none'); //margin.top);

    // add g after basemap so it goes on top
    var g = svg.append('g');


    // BAR CHART

    var xYearScale = d3.scaleBand()
        .domain(years)
        .rangeRound([width * 0.1, width * 0.9])
        .paddingInner(0.05)
        .align(0.1);

    var yPopScale = d3.scaleLinear()
        .domain([0, 1])
        .rangeRound([height * 0.82, height * 0.65])
        .nice();

    var barChart = g.append('g').selectAll("g")
      .data(layers)
      .enter().append("g")
        .style("fill", function(d) { 
          if (d.year === '2000') {
            return 'green';
          } else {
            return color(d.key);  
          }
        })
//        .style("fill", function(d) { return color(d.key); })  
        .selectAll("rect")
      .data(function(d) {  return d; })
        .enter().append("rect")
          .attr("x", function(d, i) { return xYearScale(d.data.year); })
          .attr("y", function(d) { return yPopScale(d[1]); })
          .attr("height", function(d) { return yPopScale(d[0]) - yPopScale(d[1]); })
          .attr("width", xYearScale.bandwidth())
          .style('opacity', 0);


    // PRES AXIS

    //add axis
    var axisHeight = yDefault + 25;
    var presAxis = g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (yDefault + (axisHeight / 2)) + ")")
      .call(d3.axisTop(xVoteScale)
              .ticks(10)
              .tickSize(axisHeight)
              //.tickPadding(-3)
              // remove minus signs and append +D or +R, or change to Even
              .tickFormat((function (v) {
                  if (v == 0) {
                    return 'Even';
                  } else if (v < 0) {
                    return 'D +' + d3.format("0")(Math.abs(v*100)); 
                  } else if (v > 0) {
                    return 'R +' + d3.format("0")(Math.abs(v*100)); 
                  };
              }))
            )
      .call(g => g.select(".domain").remove())
      .style('opacity', 0);

    // style axis lines (different style for zero line)
    d3.selectAll("g.axis g.tick line")
        .style("stroke", function(d){
           if (d === 0) {
            return 'black';
           } else {
            return '#cccccc';
           }
        })
        .style("stroke-width", function(d){
           if (d === 0) {
            return 1.5;
           } else {
            return 1;
           }
        })
        .attr("y1", 0 - axisHeight)
        .attr("y2", function(d){
           if (d === 0) {
            return 0;
           } else {
            return 8 - axisHeight;
           }
        });

    // style and position axis text (different style for zero text)
    d3.selectAll("g.axis g.tick text")
        .style("fill", function(d){
           if (d === 0) {
            return 'black';
           } else {
            return '#aaaaaa';
           }
        })
        .attr("dy", -3);

    // BUBBLES

    var node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.75)
      .selectAll(".node");

    var label = g.append("g")
      .selectAll("labelText");

    var simulation = d3.forceSimulation();


    // UPDATE FUNCTION

    // update bubbles and labels using parameters depending on step of scrollytelling
    function update(nodes,
                    xScale,
                    xInput,
                    yScale,
                    yInput,
                    cScale,
                    cInput,
                    sScale,
                    xStr,
                    yStr,
                    collStr,
                    i) { 

      // transition /// keep this line within update, not sure why
      var t = d3.transition().duration(750);

      // Apply the general update pattern to the nodes

      node = node.data(nodes, d=> d.state); /// what is d.state doing?

      node.exit().remove();

      node
        .transition(t)
        .style("fill", d=> cScale(d[cInput]))
        .attr("r", d=> sScale(d.pop));

      node = node.enter().append("circle")
        .style("fill", d=> cScale(d[cInput]))
        .attr("r", d=> sScale(d.pop))
        .merge(node);

      // Apply the general update pattern to the labels

      label = label.data(nodes, d=> d.state); /// what is d.state doing?

      label.exit().remove();

      label
        .transition(t)
        .text(d=> d.state_abbrev)
        .style("text-anchor", "middle")
        .style("font-size", d=> sizeText(d.pop))
        // .style("font-size", textSize)
        .style("stroke", d=> cScale(d[cInput]));

      label = label.enter().append("text")
        .attr("class", "label")
        .text(d=> d.state_abbrev)
        .style("font-size", d=> sizeText(d.pop))
        // .style("font-size", textSize)
        .style("stroke", d=> cScale(d[cInput]))
        .merge(label);

      // update the simulation
      simulation.nodes(nodes)
        .force("x", d3.forceX().strength(xStr).x(d=> xScale(d[xInput])))
        .force("y", d3.forceY().strength(yStr).y(d=> yScale(d[yInput])))
        // avoid collision - change strength and number of iterations to adjust
        .force("collide", d3.forceCollide().strength(collStr).radius(d=> sScale(d.pop) + nodePadding).iterations(10))
        .on('tick', function(){
          node
            // .transition().duration(100) /// transition on each tick to slow down bubbles, but this messes with bubble steps for some reason
            .attr("cx", d=> d.x)
            .attr("cy", d=> d.y);
          label
            // .transition().duration(100) /// transition on each tick to slow down bubbles, but this messes with bubble steps for some reason
            .attr("x", d=> d.x)
            .attr("y", d=> d.y + textSize / 2 - 2); // adds half of text size to vertically center in bubbles
        });

      // re-energize the simulation
      simulation.alpha(1).restart();

      // var t = d3.timer(function(elapsed) {
      //     if (elapsed > 1000) {
      //         simulation.alphaTarget(0); //After 1000ms, rest
      //         //console.log("Time Passed")
      //         t.stop()
      //     };
      // }, 1); // start timer after 1ms

    } // end update function


    // // run update for each map year just to load each year of data to deal with bubble position update issue

    //   var data75 = data_all.filter(({year}) => year === 1975);
    //   var data95 = data_all.filter(({year}) => year === 1995);
    //   var data10 = data_all.filter(({year}) => year === 2010);
    //   var data11 = data_all.filter(({year}) => year === 2011);

    //   update(data75,
    //           xLonScale,
    //           'state_x',
    //           yLatScale,
    //           'state_y',
    //           color,
    //           'cont_text',
    //           0.1,
    //           0.1,
    //           0,
    //           3);

    //   update(data95,
    //           xLonScale,
    //           'state_x',
    //           yLatScale,
    //           'state_y',
    //           color,
    //           'cont_text',
    //           0.1,
    //           0.1,
    //           0,
    //           3);

    //   update(data10,
    //           xLonScale,
    //           'state_x',
    //           yLatScale,
    //           'state_y',
    //           color,
    //           'cont_text',
    //           0.1,
    //           0.1,
    //           0,
    //           3);

    //   update(data11,
    //           xLonScale,
    //           'state_x',
    //           yLatScale,
    //           'state_y',
    //           color,
    //           'cont_text',
    //           0.1,
    //           0.1,
    //           0,
    //           3);

    // LABELING

    // add control labels
    var contLabel = svg.append("g").selectAll('.headerLabel')
      .data(contPositions.slice(0,3)).enter()
      .append('text')
      .text(function(d, i) {
          return contText.slice(0,3)[i];
      })
      .attr('class', 'headerLabel')
      .attr('x', d=> width * d)
      .attr('y', height * 0.12);

    // add control numbers
    var contNumber = svg.append("g").selectAll('.number')
      .data(data_all_ag_2021).enter()
      .append('text')
      .text(d=> d3.format(".0%")(d.pop_pct) + " of the U.S. population")
      .attr('class', 'number')
      .attr('x', d=> width * contMeta[d.cont_text].position) // lookup corresponding position
      .attr('y', height * 0.16);

    // add pres vote label
    var presLabel = svg.append("g")
      .append('text')
      .text('Presidential vote')
      .attr('class', 'presLabel')
      .attr('x', width * 0.5)
      .attr('y', height * 0.09);

    // add year label
    var yearLabel = svg.append("g")
      .append('text')
      .text(2021)
      .attr('class', 'yearLabel')
      .attr('x', width * 0.5)
      .attr('y', height * 0.07);


    // GRAPH SCROLL WITH LISTENER

    var gs = d3.graphScroll()
        .container(d3.select('.container-1'))
        .graph(d3.selectAll('container-1 #graph'))
        .eventId('uniqueId1')  // namespace for scroll and resize events
        .sections(d3.selectAll('.container-1 #sections > div'))
        // .offset(innerWidth < 900 ? innerHeight - 30 : 200)
        .on('active', function(i){
          
          // /// testing
          // var data75 = data_all
          //   .filter(({year}) => year === 1975);
          // STEPS (TURN WORD WRAP OFF FOR EASIER VIEW)

          //i             0              1                  2             3             4             5             6             7             8
          //year
          var dataYear =  [2021,         2021,              2021,         1975,         1995,         2010,         2010,         2011,         2021];
          //var dataTest =  [data_all_2021,         data_all_2021,              data_all_2021,         data75,         1995,         2010,         2010,         2011,         2021];
          //map
          var map =       ['FALSE',      'FALSE',           'TRUE',       'TRUE',       'TRUE',       'TRUE',       'TRUE',       'TRUE',       'TRUE'];
          //x
          var xScales =   [xContScale,   xVoteScale,        xLonScale,    xLonScale,    xLonScale,    xLonScale,    xLonScale,    xLonScale,    xLonScale];
          var xInputs =   ['cont_text',  'pres_marg_rep',   'state_x',    'state_x',    'state_x',    'state_x',    'state_x',    'state_x',    'state_x'];
          //y
          var yScales =   [dummyScale,   dummyScale,        yLatScale,    yLatScale,    yLatScale,    yLatScale,    yLatScale,    yLatScale,    yLatScale];
          var yInputs =   ['state_y',    'state_y',         'state_y',    'state_y',    'state_y',    'state_y',    'state_y',    'state_y',    'state_y'];
          //color
          var cScales =   [color,        color,             color,        color,        color,        color,        color,        color,        color];
          var cInputs =   ['cont_text',  'cont_text',       'cont_text',  'cont_text',  'cont_text',  'cont_text',  'cont_text',  'cont_text',  'cont_text'];          
          //size
          var sScales =   [sizeChart,    sizeChart,         sizeMap,      sizeMap,      sizeMap,      sizeMap,      sizeMap,      sizeMap,      sizeMap];
          //var sInputs =   ['pop',        'pop',             'pop',        'pop',        'pop',        'pop',        'pop',        'pop',        'pop'];          
          //force strs (x, y, collision)
          var xStrs =     [0.1,          0.8,               0.1,          0.1,           0.1,         0.1,          0.1,          0.1,          0.1];
          var yStrs =     [0.1,          0.1,               0.1,          0.1,           0.1,         0.1,          0.1,          0.1,          0.1];
          var collStrs =  [1,            1,                 0,            0,             0,           0,            0,            0,            0];

          /// for some reason there are residual strengths left over from previous view which cause views to appear different depending on strengths of view you were on before
          

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
                 cInputs[i],
                 sScales[i],
                 xStrs[i],
                 yStrs[i],
                 collStrs[i],
                 i);

          // show or hide header labels
          if (i === 0) {
            d3.selectAll('.headerLabel').style('opacity', 1);
            d3.selectAll('.number').style('opacity', 1);
          } else {
            d3.selectAll('.headerLabel').transition().style('opacity', 0);
            d3.selectAll('.number').transition().style('opacity', 0);
          }

          // show or hide pres vote axis and pres vote label
          if (i === 1) {
            presAxis.transition().duration(1000).style('opacity', 1);
            presLabel.transition().duration(1000).style('opacity', 1);
          } else {
            presAxis.style('opacity', 0);
            presLabel.style('opacity', 0);
          }

          // show or hide map and area chart
          if (i < 2) {
            basemap.style('opacity', 0);
            yearLabel.style('opacity', 0);
            barChart.style('opacity', 0);
          } else {
            basemap.transition().duration(500).style('opacity', 1);
            yearLabel.style('opacity', 1);
            barChart.style('opacity', 1);
          };

          // update year label /// need to add interpolation transition effect
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

