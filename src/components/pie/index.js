import { Api } from '../../api/index'
import d3 from 'd3'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class PieChartComponent extends events.EventEmitter {

  constructor() {
    super();
    this.wrapper = null;
    this.chart = null;
    this.downloader = null;

    this.formatValue = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
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

  build(endpoint, cube, params, wrapper, colorSchema) {
    params = _.cloneDeep(params);

    var that = this;
    this.wrapper = wrapper;

    that.emit('loading', that);

    api.downloader = this.downloader;
    api.aggregate(endpoint, cube, params)
      .then((data) => {
        var columns = Utils.buildC3PieColumns(data, params.aggregates);
        var colors = {};
        _.each(columns, (value, index) => {
          colors[value[0]] = Utils.colorScale(index);
        });

        var currency = data.currency[params.aggregates];
        var valueFormat = that.getValueFormatter(currency);

        var ratioFormat = d3.format('.1%');
        that.chart = c3.generate({
          bindto: that.wrapper,
          data: {
            names: Utils.buildC3Names(data),
            columns: columns,
            colors: colors,
            type: 'pie',
            onclick: (d, element) => {
              that.emit('click', that, d);
            }
          },
          pie: {
            label: {
              format: (value, ratio, id) => {
                return valueFormat(value);
              }
            }
          },
          tooltip: {
            format: {
              value: (value, ratio, id, index) => {
                return valueFormat(value) + ' (' + ratioFormat(ratio) + ')';
              }
            }
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

export default PieChartComponent