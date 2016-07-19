import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class GeoViewComponent extends events.EventEmitter {
  constructor() {
    super();
  }

  getGeoMapData(endpoint, cube, params) {
    params = _.cloneDeep(params);
    var result = {};

    var that = this;

    this.emit('beginAggregate', this);

    return api.aggregate(endpoint, cube, params).then((data) => {
        _.each(data.cells, (cell) => {
          var dimension = _.first(cell.dimensions);
          var measure = _.find(cell.measures, {key: params.aggregates});
          var nameValue = dimension.nameValue.replace(/^[-0-9 .]+/,''); //TODO: Remove when not necessary
          result[nameValue] = measure.value;
        });

        this.emit('endAggregate', that, data);
        return result;
    });
  }

}

export default GeoViewComponent