import Api from '../../api'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'underscore'
import events from 'events'

var api = new Api();

export class TreeMapComponent extends events.EventEmitter {
  constructor() {
    super();
    this.wrapper = null;
    this.treemap = null;
  }

  refresh() {
    //var bounds = this.wrapper.getBoundingClientRect();
    //this.chart.resize({
    //  height: bounds.height,
    //  width: bounds.width
    //});
  }

  positionNode() {
    this.style("left", (d) => {
        return d.x + "px";
      })
      .style("top", (d) => {
        return d.y + "px";
      })
      .style("width", (d) => {
        return Math.max(0, d.dx - 1) + "px"
      })
      .style("height", (d) => {
        return Math.max(0, d.dy - 1) + "px"
      });
  };

  build(endpoint, cube, params, wrapper, colorSchema) {
    var that = this;

    this.wrapper = wrapper;
    var size = wrapper.getBoundingClientRect();

    this.emit('beginAggregate', this);

    this.treemap = d3.layout.treemap()
      .size([size.width, size.height])
      .sticky(true)
      .sort(function(a, b) {
        return a[area] - b[area];
      })
      .value(function(d) {
        return d[area];
      });

    d3.select(wrapper).select("div").remove();
    var div = d3.select(wrapper).append("div")
      .style("position", "relative")
      .style("width", size.width + "px")
      .style("height", size.height + "px");


    api.aggregate(endpoint, cube, params).then((data) => {

      var root = {
        children: []
      };

      for (var i in data.cells) {
        var cell = data.cells[i];
        cell._area_fmt = Utils.numberFormat(Math.round(cell.value));
        cell._key = cell.key;
        cell._name = cell.name;
        cell._color = Utils.colorScale(i, colorSchema);
        cell._percentage = cell.value / Math.max(data.summary, 1);
        root.children.push(cell);
      }

      var node = div.datum(root).selectAll(".node")
        .data(that.treemap.nodes)
        .enter().append("a")
        .attr("href", function(d) {
          return d.href;
        })
        .attr("class", "node")
        .call(that.positionNode.bind(that))
        .style("background", '#fff')
        .html(function(d) {
          if (d._percentage < 0.02) {
            return '';
          }
          return d.children ? null : '<span class="amount">' + d._area_fmt + '</span>' + d._name;
        })
        .on("click", (d) => {
          that.emit('click', that, d);
        });

      this.emit('endAggregate', that, data);
    });
  }
}

export default TreeMapComponent