import { Api } from '../../api/index'
import d3 from 'd3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class SanKeyChartComponent extends events.EventEmitter {

  constructor() {
    super();
    this.wrapper = null;
    this.sankey = null;
  }

  build(endpoint, cube, params, wrapper, colorSchema) {
    var that = this;
    this.wrapper = wrapper;

    var unit = 15;
    var margin = {top: unit / 2, right: 1, bottom: 6, left: 1};
    var svg = null;
    var group = null;

    var size = {
      width: this.wrapper.clientWidth,
      height: this.wrapper.clientWidth * 0.6
    };


    this.emit('beginAggregate', this);

    params.group = [params.source, params.target];
    sourceKey = params.source;
    targetKey = params.target;
    params.source = undefined;
    params.target = undefined;

    params.order = params.order || [
      {key: params.aggregates, direction: 'desc'},
      {key: params.source, direction: 'asc'},
      {key: params.target, direction: 'asc'}
    ];

    params.page = 0;
    params.pagesize = 2000;

    unit = Math.max(400, size.height) / 20;

    if (!svg) {
      svg = d3.select(wrapper).append("svg");
      group = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    api.aggregate(endpoint, cube, params).then((data) => {

      size.height = data.cells.length * unit;
      svg.attr("height", size.height + margin.top + margin.bottom);
      svg.attr("width", size.width);

      var graph = {
        nodes: [],
        links: []
      };
      var objs = {};

      var targetScale = d3.scale.ordinal().range(['#ddd', '#ccc', '#eee', '#bbb']);

      _.each(data.cells, (cell) => {
        var source = _.find(cell.dimensions, {keyField: sourceKey});
        var target = _.find(cell.dimensions, {keyField: targetKey});
        var measure = _.find(cell.measures, {key: params.aggregates});

        var sourceId = source.keyValue;
        var targetId = target.keyValue;

        var link = {
          value: measure.value,
          number: d3.format("0,000")(measure.value)
        };

        if (link.value == 0 || !sourceId || !targetId) {
          return;
        }
        sourceId = 'source-' + sourceKey + sourceId;
        targetId = 'target-' + targetKey + targetId;

        if (!objs[sourceId]) {
          graph.nodes.push({
            name: source.nameValue,
            color: Utils.colorScale(sourceId)
          });
          objs[sourceId] = {idx: graph.nodes.length - 1};
        }
        link.source = objs[sourceId].idx;

        if (!objs[targetId]) {
          graph.nodes.push({
            name: target.nameValue,
            color: targetScale(targetId)
          });
          objs[targetId] = {
            idx: graph.nodes.length - 1
          };
        }
        link.target = objs[targetId].idx;
        graph.links.push(link);
      });

      this.sankey = sankey = d3.sankey()
        .nodeWidth(unit)
        .nodePadding(unit * 0.6)
        .size([size.width, size.height]);

      var path = sankey.link();

      sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);

      group.selectAll('g').remove();

      var link = group.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d) {
          return Math.max(1, d.dy);
        })
        .style("stroke", function(d) {
          return d.source.color;
        })
        .sort(function(a, b) {
          return b.dy - a.dy;
        });

      link.append("title")
        .text(function(d) {
          return d.source.name + " → " + d.target.name + "\n" + d.number;
        });

      var node = group.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

      node.append("rect")
        .attr("height", function(d) {
          return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) {
          return d.color;
        })
        .style("stroke", function(d) {
          return d.color;
        })
        .append("title")
        .text(function(d) {
          return d.name
        });

      node.append("text")
        .attr("x", -6)
        .attr("y", function(d) {
          return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) {
          return d.name;
        })
        .filter(function(d) {
          return d.x < size.width / 2;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");


      this.emit('endAggregate', that, data);
    });
  }
}

export default SanKeyChartComponent