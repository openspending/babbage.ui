import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'

export class TableComponent extends events.EventEmitter {
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

  showKeys(items) {
    var result = false;
    _.each(items, (item) => {
      result = result || (item.name != item.key)
    });
    return result;
  }

  getHeaders(dimensions, measures, cells) {
    var result = [];
    var rows = [];
    var cell = _.first(cells);

    if (cell) {
      _.each(cell.dimensions, (dimension) => {
        var dimensionData = _.find(dimensions, {key: dimension.keyField});
        rows.push(dimensionData.code || dimensionData.name);
      });

      _.each(cell.measures, (measure) => {
        var measureInfo = _.find(measures, {key: measure.key});
        rows.push(measureInfo.name || measureInfo.value);
      });
    }

    result.push(rows);

    return result;
  }

  getTableData(endpoint, cube, params) {
    params = _.cloneDeep(params);
    var result = {
      headers: [],
      columns: []
    };

    var that = this;

    that.emit('loading', that);
    var measures = {};
    var dimensions = [];

    var api = this.getApiInstance();
    return api.getDimensions(endpoint, cube)
      .then((result) => {
        dimensions = result;
        return api.getMeasures(endpoint, cube);
      })
      .then((result) => {
        measures = result;
        return api.aggregate(endpoint, cube, params)
      })
      .then((data) => {
        result.headers = that.getHeaders(dimensions, measures, data.cells);
        result.columns = data.cells;
        that.emit('loaded', that, data);
        that.emit('ready', that, data, null);

        return result;
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
        throw error;
      });
  }

}

export default TableComponent
