import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class TableComponent extends events.EventEmitter {
  constructor() {
    super();
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

    _.each(cell.dimensions, (dimension) => {
      var dimensionData = _.find(dimensions, {key: dimension.keyField});
      rows.push(dimensionData.code || dimensionData.name);
    });

    _.each(cell.measures, (measure) => {
      var measureInfo = _.find(measures, {key: measure.key});
      rows.push(measureInfo.name || measureInfo.value);
    });

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

    this.emit('beginAggregate', this);
    var measures = {};
    var dimensions = [];

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
        this.emit('endAggregate', that, data);

        return result;
      });
  }

}

export default TableComponent