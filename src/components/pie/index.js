import { Api } from '../../api/index'
import d3 from 'd3'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'

export class PieChartComponent extends events.EventEmitter {

  constructor(i18n) {
    super();

    this._api = null;

    this.wrapper = null;
    this.chart = null;
    this.downloader = null;

    this.formatValue = null;

    this.i18n = i18n;

    if (this.i18n === undefined) {
      this.i18n = (val) => val;
    }

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

  build(endpoint, cube, params, wrapper, maxSlices=5, colorScale) {
    params = _.cloneDeep(params);

    var that = this;
    this.wrapper = wrapper;

    if (colorScale === undefined) {
      colorScale = Utils.defaultColorScale();
    }

    return this._getData(endpoint, cube, params, maxSlices)
      .then((data) => {
        var columns = Utils.buildC3PieColumns(data, params.aggregates);
        var colors = {};
        _.each(columns, (value, index) => {
          colors[value[0]] = colorScale(index);
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

        that.emit('ready', that, data, null);
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }

  _getData(endpoint, cube, params, maxSlices) {
    var that = this;
    that.emit('loading', that);

    var api = this.getApiInstance();
    return api.aggregate(endpoint, cube, params)
      .then((data) => that._groupSlicesIfMoreThan(data, maxSlices))
      .then((data) => {
        that.emit('loaded', that, data);
        return data;
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }

  _groupSlicesIfMoreThan(data, maxSlices) {
    if (maxSlices <= 0) {
      throw RangeError(`Can't create a pie chart with less than 1 slice (asked for ${maxSlices} slices)`);
    }
    if (!_.isArray(data.cells) || maxSlices === undefined || data.cells.length <= maxSlices) {
      return data;
    }

    const that = this;

    const individualCells = data.cells.slice(0, maxSlices - 1);
    const othersCell = {
      dimensions: data.cells[0].dimensions.map((dimension) => {
        return Object.assign(
          {},
          dimension,
          {
            keyValue: 'others',
            nameValue: that.i18n('others'),
          }
        );
      }),

      // Set measures as the total values minus the individual cell's values
      measures: data.cells[0].measures.map((measure) => {
        const individualCellsTotal = individualCells.reduce((total, cell) => {
          const cellMeasure = cell.measures.find((m) => m.key === measure.key);
          return total + cellMeasure.value;
        }, 0);

        return Object.assign(
          {},
          measure,
          {
            value: data.summary[measure.key] - individualCellsTotal,
          }
        );
      }),
    };


    return Object.assign(
      {},
      data,
      {
        cells: [
          ...individualCells,
          othersCell,
        ]
      }
    );
  }
}

export default PieChartComponent