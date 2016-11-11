import {Api} from '../../api/index';
import d3 from 'd3'
import _ from 'lodash';
import events from 'events';
//import RadarChart from 'radar-chart-d3'
var api = new Api();

function RadarChart(wrapper, allData, legendOptions, options) {
  var cfg = {
    w: 600,				//Width of the circle
    h: 600,				//Height of the circle
    margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
    levels: 3,				//How many levels or inner circles should there be drawn
    maxValue: 0, 			//What is the value that the biggest circle will represent
    labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, 	//The opacity of the area of the blob
    dotRadius: 4, 			//The size of the colored circles of each blog
    opacityCircles: 0.1, 	//The opacity of the circles of each blob
    strokeWidth: 2, 		//The width of the stroke around each blob
    roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
    color: d3.scale.category20()	//Color function
  };
  var data = _.map(allData, function(datum) {
    return datum.axes;
  });
  var element = d3.select(wrapper);
  //Put all of the options into a variable called cfg
  _.extend(cfg, options);

  //If the supplied maxValue is smaller than the actual one, replace by the max in the data
  var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i) {
    return d3.max(i.map(function(o) {
      return o.value;
    }));
  }));

  var allAxis = data[0].map(function(i, j) {
    return i.axis;
  });	//Names of each axis
  var total = allAxis.length; //The number of different axes
  var radius = Math.min(cfg.w / 2, cfg.h / 2); //Radius of the outermost circle
  var Format = d3.format(','); //Percentage formatting
  var angleSlice = Math.PI * 2 / total; //The width in radians of each 'slice'

  //Scale for the radius
  var rScale = d3.scale.linear()
    .range([0, radius])
    .domain([0, maxValue]);

  /////////////////////////////////////////////////////////
  //////////// Create the container SVG and g /////////////
  /////////////////////////////////////////////////////////

  //Remove whatever chart with the same id/class was present before
  element.select('svg').remove();

  //Initiate the radar chart SVG
  var svg = element.append('svg')
    .attr('width', '100%')
    .attr('height', cfg.h + cfg.margin.top + cfg.margin.bottom)
    .attr('class', 'radar');

  /////////////////////////////////////////////////////////
  ////////// Glow filter for some extra pizzazz ///////////
  /////////////////////////////////////////////////////////

  //Filter for the outside glow
  var filter = svg.append('defs').append('filter').attr('id', 'glow');
  var feGaussianBlur = filter.append('feGaussianBlur')
    .attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
  var feMerge = filter.append('feMerge');
  var feMergeNode1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  var feMergeNode2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  //Append a g element
  var g = svg.append('g')
    .attr('transform', 'translate(' + (cfg.w / 2 + cfg.margin.left) +
      ',' + (cfg.h / 2 + cfg.margin.top) + ')');

  /////////////////////////////////////////////////////////
  /////////////// Draw the Circular grid //////////////////
  /////////////////////////////////////////////////////////

  //Wrapper for the grid & axes
  var axisGrid = g.append('g').attr('class', 'axisWrapper');

  //Draw the background circles
  axisGrid.selectAll('.levels')
    .data(d3.range(1, (cfg.levels + 1)).reverse())
    .enter()
    .append('circle')
    .attr('class', 'gridCircle')
    .attr('r', function(d, i) {
      return radius / cfg.levels * d;
    })
    .style('fill', '#CDCDCD')
    .style('stroke', '#CDCDCD')
    .style('fill-opacity', cfg.opacityCircles)
    //!.style('filter', 'url(#glow)');

  //Text indicating at what % each level is
  axisGrid.selectAll('.axisLabel')
    .data(d3.range(1, (cfg.levels + 1)).reverse())
    .enter().append('text')
    .attr('class', 'axisLabel')
    .attr('x', 4)
    .attr('y', function(d) {
      return -d * radius / cfg.levels;
    })
    .attr('dy', '0.4em')
    .style('font-size', '10px')
    .attr('fill', '#737373')
    .text(function(d, i) {
      return Format(maxValue * d / cfg.levels);
    });

  /////////////////////////////////////////////////////////
  //////////////////// Draw the axes //////////////////////
  /////////////////////////////////////////////////////////

  //Create the straight lines radiating outward from the center
  var axis = axisGrid.selectAll('.axis')
    .data(allAxis)
    .enter()
    .append('g')
    .attr('class', 'axis');
  //Append the lines
  axis.append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', function(d, i) {
      return rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .attr('y2', function(d, i) {
      return rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .attr('class', 'line')
    .style('stroke', 'white')
    .style('stroke-width', '2px');

  //Append the labels at each axis
  axis.append('text')
    .attr('class', 'legend')
    .style('font-size', '11px')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('x', function(d, i) {
      return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .attr('y', function(d, i) {
      return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .text(function(d) {
      return d;
    })
    .call(wrap, cfg.wrapWidth);

  /////////////////////////////////////////////////////////
  ///////////// Draw the radar chart blobs ////////////////
  /////////////////////////////////////////////////////////

  //The radial line function
  var radarLine = d3.svg.line.radial()
    .interpolate('linear-closed')
    .radius(function(d) {
      return rScale(d.value);
    })
    .angle(function(d, i) {
      return i * angleSlice;
    });

  if (cfg.roundStrokes) {
    radarLine.interpolate('cardinal-closed');
  }

  //Create a wrapper for the blobs
  var blobWrapper = g.selectAll('.radarWrapper')
    .data(data)
    .enter().append('g')
    .attr('class', 'radarWrapper');

  //Append the backgrounds
  blobWrapper
    .append('path')
    .attr('class', 'radarArea')
    .attr('d', function(d, i) {
      return radarLine(d);
    })
    .style('fill', function(d, i) {
      return cfg.color(i);
    })
    .style('fill-opacity', cfg.opacityArea)
    .on('mouseover', function(d, i) {
      //Dim all blobs
      d3.selectAll('.radarArea')
        .transition().duration(200)
        .style('fill-opacity', 0.1);
      //Bring back the hovered over blob
      d3.select(this)
        .transition().duration(200)
        .style('fill-opacity', 0.7);
    })
    .on('mouseout', function() {
      //Bring back all blobs
      d3.selectAll('.radarArea')
        .transition().duration(200)
        .style('fill-opacity', cfg.opacityArea);
    });

  //Create the title for the legend
  var text = svg.append('text')
    .attr('class', 'title')
    .attr('transform', 'translate(90,0)')
    .attr('x', options.w - 70)
    .attr('y', 10)
    .attr('font-size', '12px')
    .attr('fill', '#404040');
  //.text('What % of owners use a specific service in a week');

  //Initiate Legend
  var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('height', 100)
    .attr('width', 200)
    .attr('transform', 'translate(' + cfg.w + ',20)');

  //Create colour squares
  legend.selectAll('rect')
    .data(legendOptions)
    .enter()
    .append('rect')
    .attr('x', options.w - 65)
    .attr('y', function(d, i) {
      return i * 20;
    })
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', function(d, i) {
      return cfg.color(i);
    });

  //Create text next to squares
  legend.selectAll('text')
    .data(legendOptions)
    .enter()
    .append('text')
    .attr('x', options.w - 52)
    .attr('y', function(d, i) {
      return i * 20 + 9;
    })
    .attr('font-size', '11px')
    .attr('fill', '#737373')
    .text(function(d) {
      return d;
    });

  //Create the outlines
  blobWrapper.append('path')
    .attr('class', 'radarStroke')
    .attr('d', function(d, i) {
      return radarLine(d);
    })
    .style('stroke-width', '2px')
    .style('stroke', function(d, i) {
      return cfg.color(i);
    })
    .style('fill', 'none')
    //!.style('filter', 'url(#glow)');

  //Append the circles
  blobWrapper.selectAll('.radarCircle')
    .data(function(d, i) {
      return d;
    })
    .enter().append('circle')
    .attr('class', 'radarCircle')
    .attr('r', cfg.dotRadius)
    .attr('cx', function(d, i) {
      return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .attr('cy', function(d, i) {
      return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .style('fill', function(d, i, j) {
      return cfg.color(j);
    })
    .style('fill-opacity', 0.8);

  /////////////////////////////////////////////////////////
  //////// Append invisible circles for tooltip ///////////
  /////////////////////////////////////////////////////////

  //Wrapper for the invisible circles on top
  var blobCircleWrapper = g.selectAll('.radarCircleWrapper')
    .data(data)
    .enter().append('g')
    .attr('class', 'radarCircleWrapper');

  //Append a set of invisible circles on top for the mouseover pop-up
  blobCircleWrapper.selectAll('.radarInvisibleCircle')
    .data(function(d, i) {
      return d;
    })
    .enter().append('circle')
    .attr('class', 'radarInvisibleCircle')
    .attr('r', cfg.dotRadius * 1.5)
    .attr('cx', function(d, i) {
      return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .attr('cy', function(d, i) {
      return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseover', function(d, i) {
      var newX = parseFloat(d3.select(this).attr('cx')) - 10;
      var newY = parseFloat(d3.select(this).attr('cy')) - 10;

      tooltip
        .attr('x', newX)
        .attr('y', newY)
        .text(Format(d.value))
        .transition().duration(200)
        .style('opacity', 1);
    })
    .on('mouseout', function() {
      tooltip.transition().duration(200)
        .style('opacity', 0);
    });

  //Set up the small tooltip for when you hover over a circle
  var tooltip = g.append('text')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  /////////////////////////////////////////////////////////
  /////////////////// Helper Function /////////////////////
  /////////////////////////////////////////////////////////

  //Taken from http://bl.ocks.org/mbostock/7555321
  //Wraps SVG text
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.4, // ems
        y = text.attr('y'),
        x = text.attr('x'),
        dy = parseFloat(text.attr('dy')),
        tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
        }
      }
    });
  }//wrap

}

export class RadarChartComponent extends events.EventEmitter {
  constructor() {
    super();
    this.wrapper = null;
    this.downloader = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  getPivotData(endpoint, cube, params) {
    params = _.cloneDeep(params);

    params.group = _.union(params.cols, params.rows);
    var cols = params.cols;
    var rows = params.rows;

    params.cols = undefined;
    params.rows = undefined;

    var measures = {};
    var dimensions = {};

    api.downloader = this.downloader;
    return api.getDimensions(endpoint, cube)
      .then((result) => {
        dimensions = {};
        _.each(result, (item) => {
          dimensions[item.key] = item.code;
        });

        api.downloader = this.downloader;
        return api.getMeasures(endpoint, cube);
      })
      .then((result) => {
        measures = {};
        _.each(result, (item) => {
          measures[item.key] = item.value;
        });

        params.page = 0;
        params.pagesize = 2000;
        api.downloader = this.downloader;
        return api.aggregate(endpoint, cube, params);
      })
      .then((data) => {
        var result = {};
        result.data = [];

        result.rows = _.map(rows, (row) => {
          return dimensions[row];
        });
        result.cols = _.map(cols, (col) => {
          return dimensions[col];
        });
        _.each(data.cells, (cell) => {
          var item = {};
          _.each(params.group, (key) => {
            var dimension = _.find(cell.dimensions, {keyField: key});
            item[dimensions[key]] = dimension.nameValue;
          });
          var measure = _.find(cell.measures, {key: params.aggregates});
          item.value = measure.value;
          result.data.push(item);
        });

        return result;
      });
  }

  build(endpoint, cube, params, wrapper) {
    var that = this;
    this.wrapper = wrapper;

    that.emit('loading', that);

    this.getPivotData(endpoint, cube, params)
      .then((result) => {
        var cells = result.data;

        var zeroDimensionIndex = result.rows[0];
        var oneDimensionIndex = result.cols[0];

        var dim0vals = _.uniq(_.map(cells, function(cell) {
          return cell[zeroDimensionIndex];
        }));
        var dim1vals = _.uniq(_.map(cells, function(cell) {
          return cell[oneDimensionIndex];
        }));

        var values = _.map(dim0vals, function(dim0val) {
          var axes = _.map(_.filter(cells, function(cell) {
            return cell[zeroDimensionIndex] == dim0val;
          }), function(cell) {
            return {axis: cell[oneDimensionIndex], value: cell.value}
          });

          axes = _.map(dim1vals, function(dim1val) {
            var found = _.find(axes, function(axis) {
              return axis.axis == dim1val;
            });
            if (found != undefined) {
              return found;
            } else {
              return {axis: dim1val, value: 0};
            }
          });

          var total = _.sum(_.map(axes, function(axis) {
            return axis.value;
          }));
          return {className: dim0val, axes: axes, total: total}
        });

        values = _.reverse(_.sortBy(values, function(clazz) {
          return clazz.total;
        }));
        dim0vals = _.map(values, function(value) {
          return value.className
        });

        var margin = {top: 100, right: 100, bottom: 100, left: 100},
          width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
          height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
        var color = d3.scale.category10();

        var radarChartOptions = {
          w: width,
          h: height,
          margin: margin,
          maxValue: 0.5,
          levels: 5,
          roundStrokes: true,
          color: color
        };

        RadarChart(wrapper, values, dim0vals, radarChartOptions);

        that.emit('loaded', that, result);
        that.emit('ready', that, result, null);
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }
}

export default RadarChartComponent