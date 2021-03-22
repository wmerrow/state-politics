// d3.csv('data/xxxx.csv', function (data_all) {

d3.queue()
.defer(d3.csv, "data/output/party_control.csv")
//.defer(d3.csv, "data/parties_first-last.csv")
.await(function(error, data_all) {
    if (error) throw error;


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

    var width = height = d3.select('#graph').node().offsetWidth
    var r = 40


    if (innerWidth <= 925){
      width = innerWidth
      height = innerHeight*.7
    }

    // return console.log(width, height)

    var svg = d3.select('#graph').html('')
      .append('svg')
        .attrs({width: width, height: height})

    var circle = svg.append('circle')
        .attrs({cx: 0, cy: 0, r: r})

    var colors = ['red', 'purple', 'steelblue', 'pink', 'black']
    var gs = d3.graphScroll()
        .container(d3.select('.container-1'))
        .graph(d3.selectAll('container-1 #graph'))
        .eventId('uniqueId1')  // namespace for scroll and resize events
        .sections(d3.selectAll('.container-1 #sections > div'))
        // .offset(innerWidth < 900 ? innerHeight - 30 : 200)
        .on('active', function(i){
          var pos = [ {cx: width - r, cy: r},
                      {cx: r,         cy: r},
                      {cx: width - r, cy: height - r},
                      {cx: width/2,   cy: height/2} ][i]
          
          circle.transition().duration(1000)
              .attrs(pos)
            .transition()
              .style('fill', colors[i])
        })


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


          path.transition().duration(1000)
              .attr('d', dArray[i])
              .style('fill', colors[i])
        })

    d3.select('#source')
        .styles({'margin-bottom': window.innerHeight - 450 + 'px', padding: '100px'})
  }
  render()
  d3.select(window).on('resize', render)




}); // end d3.csv

