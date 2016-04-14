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

  build(chartType, endpoint, cube, params, wrapper, colorSchema) {
    params = _.cloneDeep(params);

    var that = this;
    this.wrapper = wrapper;

    this.emit('beginAggregate', this);

    if (chartType == 'line') {
      params.order = params.order || [{key: _.first(params.group), direction: ':asc'}];
    }

    var series;
    var groupFields = _.first(params.group);
    if (params.series) {
      params.group = _.union(params.group, params.series);
      series = _.first(params.series);
      params.series = undefined;
      params.order = params.order || [
        {key: series, direction: 'asc'},
        {key: params.aggregates, direction: 'desc'}
      ];
    }

    if (series && chartType == 'line') {
      chartType = 'area';
    }

    params.page = 0;
    params.pagesize = 2000;

    api.aggregate(endpoint, cube, params).then((data) => {

        var columns = Utils.buildC3Columns(data, groupFields, series, params.aggregates);
        var types = {};
        var c3Groups = _.map(_.slice(columns, 1), (column) => {return column[0]});
        _.each(_.slice(columns, 1), (column) => {
          types[column[0]] = chartType;
        });

        that.chart = c3.generate({
          bindto: that.wrapper,
          data: {
            names: Utils.buildC3BarNames(data, params.aggregates),
            columns: columns,
            color: function(color, d) {
              var c = d.id || d;
              if ((chartType == 'bar') && !series) {
                c = d.index;
              };
              return Utils.colorScale(c);
            },
            type: chartType || 'bar',
            x: _.first(_.first(columns)),
            groups: [c3Groups],
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
