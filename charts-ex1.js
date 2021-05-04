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
    var nodePadding = 1;

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

    // BUBBLES

    var node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .selectAll(".node");

    var label = g.append("g")
      .selectAll("labelText");
      //.attr("class", "label")

    //var simulation = d3.forceSimulation();
    
    // update bubbles and labels using parameters depending on step of scrollytelling
    function update(nodes,
                    xScale,
                    xInput,
                    yScale,
                    yInput,
                    cScale,
                    cInput,
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
        .attr("r", d=> size(d.pop));

      node = node.enter().append("circle")
        .style("fill", d=> cScale(d[cInput]))
        .attr("r", d=> size(d.pop))
        .merge(node);

      // Apply the general update pattern to the labels

      label = label.data(nodes, d=> d.state); /// what is d.state doing?

      label.exit().remove();

      label
        .transition(t)
        .text(d=> d.state_abbrev)
        .style("text-anchor", "middle")
        .style("font-size", textSize);

      label = label.enter().append("text")
        .text(d=> d.state_abbrev)
        .style("text-anchor", "middle")
        .style("font-size", textSize)
        .merge(label);

      // create the simulation
      var simulation = d3.forceSimulation().nodes(nodes)
        .force("x", d3.forceX().strength(xStr).x(d=> xScale(d[xInput])))
        .force("y", d3.forceY().strength(yStr).y(d=> yScale(d[yInput])))
        // avoid collision - change strength and number of iterations to adjust
        .force("collide", d3.forceCollide().strength(collStr).radius(d=> size(d.pop) + nodePadding).iterations(10))
        .on('tick', function(){
          node
            //.transition().duration(50) /// transition on each tick to slow down bubbles, but this messes with bubble steps for some reason
            .attr("cx", d=> d.x)
            .attr("cy", d=> d.y);
          label
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


    // run update for each map year just to load each year of data to deal with bubble position update issue

      var data75 = data_all.filter(({year}) => year === 1975);
      var data95 = data_all.filter(({year}) => year === 1995);
      var data10 = data_all.filter(({year}) => year === 2010);
      var data11 = data_all.filter(({year}) => year === 2011);

      update(data75,
              xLonScale,
              'state_x',
              yLatScale,
              'state_y',
              color,
              'cont_text',
              0.1,
              0.1,
              0,
              3);

      update(data95,
              xLonScale,
              'state_x',
              yLatScale,
              'state_y',
              color,
              'cont_text',
              0.1,
              0.1,
              0,
              3);

      update(data10,
              xLonScale,
              'state_x',
              yLatScale,
              'state_y',
              color,
              'cont_text',
              0.1,
              0.1,
              0,
              3);

      update(data11,
              xLonScale,
              'state_x',
              yLatScale,
              'state_y',
              color,
              'cont_text',
              0.1,
              0.1,
              0,
              3);

    // LABELING

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
          
          // /// testing
          // var data75 = data_all
          //   .filter(({year}) => year === 1975);
          // STEPS (TURN WORD WRAP OFF FOR EASIER VIEW)

          //i             0              1                  2             3             4             5             6             7             8
          //year
          var dataYear =  [2021,         2021,              2021,         1975,         1995,         2010,         2010,         2011,         2021];
          //var dataTest =  [data21,         data21,              data21,         data75,         1995,         2010,         2010,         2011,         2021];
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
          //force strs (x, y, collision)
          var xStrs =     [0.1,          0.8,                 0.1,          0.1,           0.1,         0.1,          0.1,          0.1,          0.1];
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
                 xStrs[i],
                 yStrs[i],
                 collStrs[i],
                 i);

          // show or hide header labels
          if (i === 0) {
            d3.selectAll('.headerLabel').style('opacity', 1);
          } else {
            d3.selectAll('.headerLabel').style('opacity', 0);
          }

          // show or hide basemap
          if (map[i] === 'FALSE') {
            basemap.transition().style('opacity', 0);
            //d3.selectAll('.myCircle').style('display', 'none');
            //node.style('opacity', 1);
            //label.style('opacity', 1);
            yearLabel.style('opacity', 0)
          } else if (map[i] === 'TRUE') {
            basemap.style('display', 'block')
              .transition().style('opacity', 1);
            //d3.selectAll('.myCircle').style('display', 'block');
            //node.style('opacity', 0);
            //label.style('opacity', 0);
            yearLabel.style('opacity', 1)
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

