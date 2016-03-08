import Api from '../../api'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'underscore'
import events from 'events'
var api = new Api();


export class BubbleTreeComponent extends events.EventEmitter {

  constructor() {
    super();
    this.wrapper = null;
    this.chart = null;
  }

  refresh() {
    var bounds = this.wrapper.getBoundingClientRect();
    this.chart.resize({
      height: bounds.height,
      width: bounds.width
    });
  }

  build(chartType, endpoint, cube, params, wrapper, colorSchema) {
    var that = this;
    this.wrapper = wrapper;

    this.emit('beginAggregate', this);

    api.aggregate(endpoint, cube, params).then((data) => {
      this.bubbleTree = new BubbleTree({
        autoColors: true,
        data: data,
        container: wrapper
      });

      //that.chart = c3.generate({
      //  bindto: that.wrapper,
      //  data: {
      //    names: Utils.buildC3Names(data),
      //    columns: Utils.buildC3Columns(data),
      //    colors: Utils.buildC3Colors(data, colorSchema),
      //    type: chartType,
      //    onclick: (d, element) => {
      //      that.emit('click', that, d);
      //    }
      //  }
      //});

      this.emit('endAggregate', that, data);
    });
  }
}

export default BubbleTreeComponent
