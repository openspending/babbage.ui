import { Api } from '../../api'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
import * as TreemapUtils from './utils.js'

var api = new Api();

function positionNode() {
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

export class TreeMapComponent extends events.EventEmitter {
  constructor() {
    super();
    this.wrapper = null;
    this.treemap = null;
  }

  build(endpoint, cube, params, wrapper, colorSchema) {
    params = _.cloneDeep(params);
    var that = this;

    this.wrapper = wrapper;
    var size = {
      width: this.wrapper.clientWidth,
      height: this.wrapper.clientWidth * 0.6
    };

    this.emit('beginAggregate', this);

    this.treemap = d3.layout.treemap()
      .size([size.width, size.height])
      .sticky(true)
      .sort(function(a, b) {
        return a['_value'] - b['_value'];
      })
      .value(function(d) {
        return d['_value'];
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
        var dimension = _.first(data.cells[i].dimensions);
        var measure = _.find(data.cells[i].measures, {key: params.aggregates});
        var cell = {};
        cell._area_fmt = Utils.numberFormat(Math.round(measure.value));
        cell._value = measure.value;
        cell._key = dimension.keyValue;
        cell._name = dimension.nameValue;
        cell._color = Utils.colorScale(i, colorSchema);
        cell._percentage = measure.value / Math.max(data.summary[measure.key], 1);
        root.children.push(cell);
      }

      var node = div.datum(root).selectAll(".node")
        .data(that.treemap.nodes)
        .enter().append("a")
        .attr("href", function(d) {
          return d.href;
        })
        .attr("class", "node")
        .call(positionNode)
        .style("background", '#fff')
        .html(function(d) {
          if (d._percentage < 0.02) {
            return '';
          }
          return d.children ? null : '<span class="amount">' + d._area_fmt + '</span>' + d._name;
        })
        .on("click", (d) => {
          that.emit('click', that, d);
        })
        .on("mouseover", function(d) {
          d3.select(this).transition().duration(200)
            .style({'background': d3.rgb(d._color).darker() });
        })
        .on("mouseout", function(d) {
          d3.select(this).transition().duration(500)
            .style({'background': d._color});
        })
        .transition()
        .duration(500)
        .delay(function(d, i) { return Math.min(i * 30, 1500); })
        .style("background", function(d) { return d._color; });

    // Check & Remove all rectangles with text overlfow:
    var boxContentRemover = (item => $(item).empty());
    var hasTextOverlow = TreemapUtils.checkForTextOverflow("a.node", boxContentRemover);
    if(hasTextOverlow) {
      var listdiv = d3.select(wrapper).append("div")
          .style("position", "relative")
          .style("width", size.width + "px");

      // Add treemap list:
      var nodetable = listdiv.datum(root)
          .append("table")
          .attr("class", "nodetable");
      nodetable.append("tr").html("<th>title</th><th>amount</th><th>share</th>");
      nodetable
          .selectAll(".datarow")
          .data(that.treemap.nodes.sort(function(x, y){
            return x._percentage < y._percentage;
          }))
          .enter()
          .append("tr")
          .attr("class","datarow")
          .html(function(d){
            if (d._percentage < 0.02) {
              return '';
            }
            let name = d.href ? `<a href="${d.href}">${d._name}</a>` : d._name;

            return d.children ? null : `<td><span>${name}</span></td><td>${d._area_fmt}</td><td>${(d._percentage *100).toFixed(2)}%</td>`;
          }).select("td")
          .insert("span", ":first-child")
          .style("background", function(d) { return d._color; })
          .attr("class", "colorbox");
    }
    
    this.emit('endAggregate', that, data);
    });
  }
}

export default TreeMapComponent