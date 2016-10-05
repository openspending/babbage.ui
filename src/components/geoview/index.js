import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class GeoViewComponent extends events.EventEmitter {
  constructor() {
    super();
    this.downloader = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  getGeoMapData(endpoint, cube, params) {
    params = _.cloneDeep(params);
    var result = {};

    var that = this;

    that.emit('loading', that);

    api.downloader = this.downloader;
    return api.aggregate(endpoint, cube, params)
      .then((data) => {
        _.each(data.cells, (cell) => {
          var dimension = _.first(cell.dimensions);
          var measure = _.find(cell.measures, {key: params.aggregates});
          var nameValue = dimension.nameValue.replace(/^[-0-9 .]+/,''); //TODO: Remove when not necessary
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

}

export default GeoViewComponent