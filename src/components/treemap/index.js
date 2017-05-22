import { Api } from '../../api'
import d3 from 'd3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
import * as TreemapUtils from './utils.js'

function positionNode() {
  this.style('left', (d) => {
      return d.x + 'px';
    })
    .style('top', (d) => {
      return d.y + 'px';
    })
    .style('width', (d) => {
      return Math.max(0, d.dx - 1) + 'px';
    })
    .style('height', (d) => {
      return Math.max(0, d.dy - 1) + 'px';
    });
}

export class TreeMapComponent extends events.EventEmitter {

  constructor() {
    super();

    this._api = null;

    this.wrapper = null;
    this.treemap = null;
    this.downloader = null;
    this.formatValue = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  getApiInstance() {
    if (!this._api) {
      this._api = new Api();
    }
    this._api.downloader = this.downloader;
    return this._api;
  }

  getValueFormatter() {
    var formatValue = this.formatValue;
    if (!_.isFunction(formatValue)) {
      formatValue = Utils.defaultFormatValue;
    }
    return formatValue;
  }

  build(endpoint, cube, params, wrapper, colorScale) {
    params = _.cloneDeep(params);
    var that = this;

    if (colorScale === undefined) {
      colorScale = Utils.defaultColorScale();
    }

    this.wrapper = wrapper;
    var size = {
      width: this.wrapper.clientWidth,
      height: this.wrapper.clientWidth * 0.6
    };

    that.emit('loading', that);

    that.treemap = d3.layout.treemap()
      .size([size.width, size.height])
      .sticky(true)
      .sort(function(a, b) {
        return a.value - b.value;
      })
      .value(function(d) {
        return d.value;
      });

    d3.select(wrapper).select('div').remove();
    var div = d3.select(wrapper).append('div')
      .style('position', 'relative')
      .style('width', size.width + 'px')
      .style('height', size.height + 'px');


    var api = this.getApiInstance();
    api.aggregate(endpoint, cube, params)
      .then((data) => {
        var valueFormat = that.getValueFormatter();
        const ratioFormat = d3.format('.1%');

        var root = {};
        root.children = [];
        root.summary = data.summary[params.aggregates];
        root.currency = data.currency[params.aggregates];
        root.summaryFmt = valueFormat(data.summary[params.aggregates]);
        root.summaryFmtCurrency = Utils.moneyFormat(root.summaryFmt,
          root.currency);

        _.each(data.cells, (item, index) => {
          var dimension = _.first(item.dimensions);
          var measure = _.find(item.measures, {key: params.aggregates});
          var cell = {};
          cell.areaFmt = valueFormat(measure.value);
          cell.areaFmtCurrency = Utils.moneyFormat(cell.areaFmt, root.currency);
          cell.value = measure.value;
          cell.key = dimension.keyValue;
          cell.name = dimension.nameValue;
          cell.color = colorScale(index);

          cell.percentage = (measure.value && data.summary && params.aggregates)
            ? (measure.value / Math.max(data.summary[params.aggregates], 1))
            : 0;
          root.children.push(cell);
        });

        var node = div.datum(root).selectAll('.node')
          .data(that.treemap.nodes)
          .enter().append('a')
          .attr('href', function(d) {
            return d.href;
          })
          .attr('class', 'node')
          .attr('title', (d) => `${d.name}\n${d.areaFmtCurrency} (${ratioFormat(d.percentage)})`)
          .call(positionNode)
          .style('background', '#fff')
          .html(function(d) {
            if (d.percentage < 0.02) {
              return '';
            }
            return d.children ? null : `<span class=\'amount\'>${d.areaFmtCurrency}</span>${d.name}`;
          })
          .on('click', (d) => {
            that.emit('click', that, d);
          })
          .on('mouseover', function(d) {
            d3.select(this).transition().duration(200)
              .style({'background': d3.rgb(d.color).darker() });
          })
          .on('mouseout', function(d) {
            d3.select(this).transition().duration(500)
              .style({'background': d.color});
          })
          .transition()
          .duration(500)
          .delay(function(d, i) { return Math.min(i * 30, 1500); })
          .style('background', function(d) { return d.color; });

        // Check & Remove all rectangles with text overflow:
        var boxContentRemover = (item => $(item).empty());
        var hasTextOverflow = TreemapUtils.checkForTextOverflow('a.node', boxContentRemover);
        if (hasTextOverflow) {
          that.emit('textOverflow', that);
        }

        that.emit('loaded', that, data, root);
        that.emit('ready', that, data, null);
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }
}

export default TreeMapComponent