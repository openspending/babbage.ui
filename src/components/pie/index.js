import Api from '../../api'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'underscore'

var api = new Api();

class PieChartComponent {

  constructor() {
    this.wrapper = null;
    this.chart = null;
  }

  refresh() {
    var bounds = wrapper.getBoundingClientRect();
    this.chart.resize({
      height: bounds.height,
      width: bounds.width
    });
  }

  build(endpoint, cube, params, wrapper, colorSchema) {
    this.wrapper = wrapper;

    var data = api.aggregate(endpoint, cube, params);

    this.chart = c3.generate({
      bindto: this.wrapper,
      data: {
        names: Utils.buildNames(data),
        columns: Utils.buildColumns(data),
        colors: Utils.buildColors(data, colorSchema),
        type: 'pie'
      }
    });

  }
}

export default PieChartComponent