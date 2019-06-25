import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'

export class FactsComponent extends events.EventEmitter {
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

  getTableData(endpoint, cube, params, model) {
    params = _.cloneDeep(params);
    var that = this;

    that.emit('loading', that);
    var api = this.getApiInstance();
    return api.facts(endpoint, cube, params, model)
      .then((data) => {
        that.emit('loaded', that, data);
        that.emit('ready', that, data, null);
        return data;
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }
}

export default FactsComponent
