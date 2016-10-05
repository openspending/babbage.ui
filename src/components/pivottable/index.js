import { Api } from '../../api'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class PivotTableComponent extends events.EventEmitter {
  constructor() {
    super();
    this.downloader = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  getPivotData(endpoint, cube, params) {
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

    api.downloader = this.downloader;
    return api.getDimensions(endpoint, cube)
      .then((result) => {
        dimensions = {};
        _.each(result, (item) => {
          dimensions[item.key] = item.code;
        });

        api.downloader = this.downloader;
        return api.getMeasures(endpoint, cube);
      })
      .then((result) => {
        measures = {};
        _.each(result, (item) => {
          measures[item.key] = item.name;
        });

        params.page = 0;
        params.pagesize = 2000;

        api.downloader = this.downloader;
        return api.aggregate(endpoint, cube, params)
      })
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