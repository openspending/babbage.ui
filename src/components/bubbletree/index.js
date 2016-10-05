import { Api } from '../../api/index'
import c3 from 'c3'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
import BubbleTree from 'bubbletree'
window.BubbleTree = BubbleTree;
var api = new Api();

export class BubbleTreeComponent extends events.EventEmitter {

  constructor() {
    super();
    this.wrapper = null;
    this.bubbleTree = null;
    this.downloader = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  generateBubbleTreeData (cells, params) {
    var children = [];
    _.each(cells, (cell) => {
      var dimension = _.first(cell.dimensions);
      var measure = _.find(cell.measures, {key: params.aggregates});
      children.push({
        label: dimension.nameValue,
        amount: measure.value
      });
    });
      return {
        label: 'Total',
        amount: _.reduce(
          children,
          function(result, item) {
            return result + item.amount;
          },
          0
        ),
        children: children
      };
    };

  build(endpoint, cube, params, wrapper, colorSchema) {
    var that = this;
    this.wrapper = wrapper;

    that.emit('loading', that);

    api.downloader = this.downloader;
    api.aggregate(endpoint, cube, params)
      .then((data) => {
        var bubbleTreeData = that.generateBubbleTreeData(
          data.cells,
          params
        );

        that.bubbleTree = new BubbleTree({
          autoColors: true,
          data: bubbleTreeData,
          container: wrapper,
          nodeClickCallback: (node) => {
            if (node.level > 0) {
              that.emit('click', that, node);
            }
          }
        });

        that.emit('loaded', that, data);
        that.emit('ready', that, data, null);
      })
      .catch((error) => {
        that.emit('error', that, error);
        that.emit('ready', that, null, error);
      });
  }
}

export default BubbleTreeComponent
