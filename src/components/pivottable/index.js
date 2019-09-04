import { Api } from '../../api'
import _ from 'lodash'
import events from 'events'

export class PivotTableComponent extends events.EventEmitter {
  constructor() {
    super();

    this._api = null;

    this.downloader = null;

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

  getPivotData(endpoint, cube, params, model) {
    params = _.cloneDeep(params);

    params.group = _.union(params.cols, params.rows);
    var cols = params.cols;
    var rows = params.rows;

    params.cols = undefined;
    params.rows = undefined;

    var that = this;

    that.emit('loading', that);
    var measures = {};
    var dimensions = [];

    var api = this.getApiInstance();
    var dimensionsFromModel = api.getDimensionsFromModel(model)
    dimensions = {};
    _.each(dimensionsFromModel, (item) => {
        dimensions[item.key] = item.code;
    });

    var measuresFromModel = api.getMeasuresFromModel(model);
    measures = {};
    _.each(measuresFromModel, (item) => {
      measures[item.key] = item.name;
    });

    params.page = 0;
    params.pagesize = 2000;

    return api.aggregate(endpoint, cube, params, model)
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

        that.emit('loaded', that, data);
        that.emit('ready', that, data, null);
        return result;
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }

}

export default PivotTableComponent
