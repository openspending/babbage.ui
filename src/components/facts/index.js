import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class FactsComponent extends events.EventEmitter {
  constructor() {
    super();
    this.downloader = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  getTableData(endpoint, cube, params) {
    params = _.cloneDeep(params);
    var that = this;

    that.emit('loading', that);
    api.downloader = this.downloader;
    return api.facts(endpoint, cube, params)
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