import { Api } from '../../api'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class PivotTableComponent extends events.EventEmitter {
  constructor() {
    super();
  }

  getPivotData(endpoint, cube, params) {
    params = _.cloneDeep(params);

    params.group = _.union(params.cols, params.rows);
    var cols = params.cols;
    var rows = params.rows;

    params.cols = undefined;
    params.rows = undefined;

    var that = this;

    this.emit('beginAggregate', this);
    var measures = {};
    var dimensions = [];

    return api.getDimensions(endpoint, cube)
      .then((result) => {
        dimensions = {};
        _.each(result, (item) => {
          dimensions[item.key] = item.code;
        });

        return api.getMeasures(endpoint, cube);
      })
      .then((result) => {
        measures = {};
        _.each(result, (item) => {
          measures[item.key] = item.name;
        });

        params.page = 0;
        params.pagesize = 2000;

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

        this.emit('endAggregate', that, data);
        return result;
      });
  }

}

export default PivotTableComponent