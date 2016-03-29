import { Api } from '../../api/index'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
var api = new Api();


export class ChartComponent extends events.EventEmitter {

  constructor() {
    super();
    this.wrapper = null;
    this.chart = null;
  }

  refresh() {
    var bounds = this.wrapper.getBoundingClientRect();
    this.chart.resize({
      height: bounds.height,
      width: bounds.width
    });
  }

  build(chartType, endpoint, cube, params, wrapper, colorSchema) {
    params = _.cloneDeep(params);

    var that = this;
    this.wrapper = wrapper;

    this.emit('beginAggregate', this);

    var size = {
      width: this.wrapper.clientWidth,
      height: this.wrapper.clientWidth * 0.6
    };

    d3.select(this.wrapper)
      .style('width', size.width + 'px')
      .style('height', size.height + 'px');

    if (chartType == 'line') {
      params.order = [_.first(params.group)+':asc'];
    }
    api.aggregate(endpoint, cube, params).then((data) => {

        var columns = Utils.buildC3BarColumns(data, params.aggregates);
        var types = {};
        types[columns[1][0]] = chartType;

        that.chart = c3.generate({
          bindto: that.wrapper,
          data: {
            names: Utils.buildC3BarNames(data, params.aggregates),
            columns: columns,
            color: function(color, d) {
              var c = d.id || d;
              if (chartType == 'bar') {
                c = d.index;
              };
              return Utils.colorScale(c);
            },
            type: chartType || 'bar',
            x: _.first(_.first(columns)),
            groups: [[columns[1][0]]],
            types: types,
          },
          point: {
            show: false
          },
          grid: {
            focus: {
              show: false
            }
          },
          axis: {
            x: {
              type: 'category',
              tick: {
                culling: true,
                fit: true
              }
            },
            y: {
              tick: {
                format: d3.format("0,000"),
                culling: true,
                fit: true
              },
              lines: [{value: 0}]
            }
          }
        });

        this.emit('endAggregate', that, data);
      }
    )
    ;
  }
}

export default ChartComponent
