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
  var data21 = data_all
    .filter(({year}) => year === 2021);
  console.log(data21); 


  var oldWidth = 0

  function render(){
    if (oldWidth == innerWidth) return
    oldWidth = innerWidth

    var width = height = d3.select('#graph').node().offsetWidth;
    var r = 40;
    var textSize = 10;
    var nodePadding = 2;


    if (innerWidth <= 925){
      width = innerWidth
      height = innerHeight*.7
    }

    // return console.log(width, height)

    // color scale
    var color = d3.scaleOrdinal()
      .domain(['NA', 'full_dem', 'lean_dem', 'lean_rep', 'full_rep'])
      .range(['#dddddd', '#4393c3', '#92c5de', '#f4a582', '#d6604d']);

    // size scale
    var size = d3.scaleSqrt()
      .domain([0, 39368078])
      .range([0, 30]); // max radius

    // x scale for control
    var xContScale = d3.scaleOrdinal()
      .domain(['NA', 'full_dem', 'lean_dem', 'lean_rep', 'full_rep'])
      .range([width * 0.5, width * 0.2, width * 0.4, width * 0.6, width * 0.8]);
    // x scale for pres vote
    var xVoteScale = d3.scaleLinear()
      .domain([0.2, 0.8])
      .range([width * 0, width * 1]);
    // x scale for longitude
    var xLonScale = d3.scaleLinear()
      .domain([0.2, 0.8])
      .range([width * 0, width * 1]);
    // y scale for latitude
    var yLatScale = d3.scaleLinear()
      .domain([0.2, 0.8])
      .range([width * 0, width * 1]);

    // SECTION 1

    var svg = d3.select('#graph').html('')
      .append('svg')
        .attrs({width: width, height: height})

    // set up circles: all located at the center of the svg area
    var node = svg.append("g")
      .selectAll("circle")
      .data(data21)
      .enter()
      .append("circle")
      .attr("r", d=> size(d.pop))
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .style("fill", d=> color(d.government_cont_text));

    // set up labels
    var label = svg.append("g")
      .selectAll("text")
      .data(data21)
      .enter()
      .append("text")
      .text(d=> d.state_abbrev)
      .attr("class", "label")
      .style("text-anchor", "middle")
      .style("font-size", textSize)
      .attr("x", width / 2)
      .attr("y", height / 2);


    // GRAPH SCROLL WITH LISTENER

    var gs = d3.graphScroll()
        .container(d3.select('.container-1'))
        .graph(d3.selectAll('container-1 #graph'))
        .eventId('uniqueId1')  // namespace for scroll and resize events
        .sections(d3.selectAll('.container-1 #sections > div'))
        // .offset(innerWidth < 900 ? innerHeight - 30 : 200)
        .on('active', function(i){
          
          // steps: (TURN WORD WRAP OFF FOR EASIER VIEW)
          //              0                         1                 2                         3
          var xScales =   [xContScale,              xVoteScale,       xContScale,               xVoteScale];
          var xInputs =   ['government_cont_text',  'pres_vote_rep',  'government_cont_text',   'pres_vote_rep'];

          // Features of the forces applied to the nodes:
          var simulation = d3.forceSimulation()
              // x positions, depending on step
              .force("x", d3.forceX().strength(0.01).x( function(d){ return xScales[i](d[xInputs[i]]) }))
              .force("y", d3.forceY().strength(0.1).y( height / 2 ))
              .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
              .force("charge", d3.forceManyBody().strength(0)) // Nodes are attracted one each other of value is > 0
              .force("collide", d3.forceCollide().strength(0.1).radius(d=> size(d.pop) + nodePadding).iterations(1)) // Force that avoids circle overlapping

          // Apply these forces to the nodes and update their positions.
          // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
          simulation
              .nodes(data21)
              .on("tick", function(d){
                node
                    .attr("cx", function(d){ return d.x; })
                    .attr("cy", function(d){ return d.y; })
                label
                    .attr("x", function(d){ return d.x; })
                    .attr("y", function(d){ return d.y + textSize / 2 - 2; })
              });


        })


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

