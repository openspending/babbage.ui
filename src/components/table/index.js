import {Api} from '../../api/index.js'
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

  getHeaders(measures, params) {
    var result = [];
    var rows = [];

    rows.push('');
    var measure = _.find(measures, {key: params.aggregates});
    if (measure) {
      rows.push(measure.value);
    } else {
      rows.push(_.first(measures).value);
    }

    result.push(rows);
    return result;
  }

  getTableData(endpoint, cube, params) {
    var result = {
      headers: [],
      columns: []
    };

    var that = this;

    this.emit('beginAggregate', this);
    var measures = {};
    var rows = [];

    return api.getMeasures(endpoint, cube)
      .then((result) => {
        measures = result;
        return api.aggregate(endpoint, cube, params)
      })
      .then((data) => {
        var showKeyFields = that.showKeys(data.cells);

        result.headers = that.getHeaders(measures, params);

        _.each(data.cells, (item) => {
          rows = [];
          var name = (showKeyFields) ? `${item.key}:${item.name}`:  item.key;
          rows.push(name);
          rows.push(item.value);
          result.columns.push(rows);
        });
        this.emit('endAggregate', that, data);

        return result;
      });
  }

}

export default TableComponent