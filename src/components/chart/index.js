import { Api } from '../../api/index'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'

export class ChartComponent extends events.EventEmitter {
  constructor() {
    super();

    this._api = null;

    this.wrapper = null;
    this.chart = null;
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

  getValueFormatter(currency) {
    var formatValue = this.formatValue;
    if (!_.isFunction(formatValue)) {
      formatValue = Utils.defaultFormatValue;
    }
    return function(value) {
      return Utils.moneyFormat(formatValue(value), currency);
    };
  }

  build(chartType, endpoint, cube, params, wrapper, colorScale, model) {
    params = _.cloneDeep(params);

    var that = this;
    this.wrapper = wrapper;

    if (colorScale === undefined) {
      colorScale = Utils.defaultColorScale();
    }

    that.emit('loading', that);

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

    var api = this.getApiInstance();
    api.aggregate(endpoint, cube, params, model)
      .then((data) => {
        var columns = Utils.buildC3Columns(data, groupFields, series, params.aggregates);
        var types = {};
        var c3Groups = _.map(_.slice(columns, 1), (column) => {return column[0]});
        var showLegend = (c3Groups.length > 1);
        _.each(_.slice(columns, 1), (column) => {
          types[column[0]] = chartType;
        });

        var currency = data.currency[params.aggregates];
        var valueFormat = that.getValueFormatter(currency);

        var colors = {};
        _.each(columns, (value, index) => {
          colors[value[0]] = colorScale(index);
        });

        that.chart = c3.generate({
          bindto: that.wrapper,
          data: {
            names: Utils.buildC3BarNames(data, params.aggregates),
            columns: columns,
            color: colors,
            type: chartType || 'bar',
            x: _.first(_.first(columns)),
            groups: [c3Groups],
            types: types,
            onclick: (d, element) => {
              that.emit('click', that, d);
            }
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
                format: valueFormat,
                culling: true,
                fit: true
              },
              lines: [{value: 0}]
            }
          },
          tooltip: {
            format: {
              value: valueFormat
            }
          },
          legend: {
            show: showLegend
          }
        });

        that.emit('loaded', that, data);
        that.emit('ready', that, data, null);
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }
}

export default ChartComponent
