import { Api } from '../../api/index'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class PieChartComponent extends events.EventEmitter {

  constructor() {
    super();
    this.wrapper = null;
    this.chart = null;
  }

  build(endpoint, cube, params, wrapper, colorSchema) {
    params = _.cloneDeep(params);

    var that = this;
    this.wrapper = wrapper;

    this.emit('beginAggregate', this);

    api.aggregate(endpoint, cube, params).then((data) => {

      var columns = Utils.buildC3PieColumns(data, params.aggregates);
      var colors = {};
      _.each(columns, (value, index) => {
        colors[value[0]]= Utils.colorScale(index) ;
      });

      that.chart = c3.generate({
        bindto: that.wrapper,
        data: {
          names: Utils.buildC3Names(data),
          columns: columns,
          colors: colors,
          type: 'pie',
          onclick: (d, element) => {
            that.emit('click', that, d);
          }
        }
      });

      this.emit('endAggregate', that, data);
    });
  }
}

export default PieChartComponent