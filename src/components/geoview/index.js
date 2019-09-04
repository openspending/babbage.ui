import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'
import render from './render'

export class GeoViewComponent extends events.EventEmitter {
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

  getGeoMapData(endpoint, cube, params, model) {
    params = _.cloneDeep(params);
    var result = {};

    var that = this;

    that.emit('loading', that);

    var api = this.getApiInstance();
    return api.aggregate(endpoint, cube, params, model)
      .then((data) => {
        _.each(data.cells, (cell) => {
          var dimension = _.first(cell.dimensions);
          var measure = _.find(cell.measures, {key: params.aggregates});
          //TODO: Remove when not necessary
          var nameValue = dimension.nameValue.replace(/^[-0-9 .]+/, '');
          result[nameValue] = measure.value;
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

  build(options) {
    return render(options, this.getApiInstance());
  }

}

export default GeoViewComponent
