import { Api } from '../../api/index'
import * as Utils from '../utils.js'
import _ from 'lodash'
import events from 'events'
import BubbleTree from 'bubbletree'
window.BubbleTree = BubbleTree;

export class BubbleTreeComponent extends events.EventEmitter {

  constructor() {
    super();

    this._api = null;

    this.wrapper = null;
    this.bubbleTree = null;
    this.downloader = null;
    this.formatValue = null;

    // Prevent from throwing exception in EventEmitter
    this.on('error', (sender, error) => {
      console.trace(error);
    });
  }

  getApiInstance() {
    if (!this._api) {
      this._api = new Api();
    }
    this._api.downloader = this.downloader;
    return this._api;
  }

  getValueFormatter(currency) {
    var formatValue = this.formatValue;
    if (!_.isFunction(formatValue)) {
      formatValue = Utils.defaultFormatValue;
    }
    return function(value) {
      return Utils.moneyFormat(formatValue(value), currency);
    };
  }

  generateBubbleTreeData (cells, params) {
    // BubbleTree cannot build nodes with zero amount
    var children = [];
    _.each(cells, (cell) => {
      var dimension = _.first(cell.dimensions);
      var measure = _.find(cell.measures, {key: params.aggregates});
      if (measure.value > 0) {
        children.push({
          label: dimension.nameValue,
          key: dimension.keyValue,
          amount: measure.value
        });
      }
    });
    var result = {
      label: 'Total',
      key: null,
      amount: _.reduce(
        children,
        function(result, item) {
          return result + item.amount;
        },
        0
      ),
      children: children
    };
    return result.amount > 0 ? result : null;
  };

  build(endpoint, cube, params, wrapper, colorSchema) {
    var that = this;
    this.wrapper = wrapper;

    that.emit('loading', that);

    var api = this.getApiInstance();
    api.aggregate(endpoint, cube, params)
      .then((data) => {
        var bubbleTreeData = that.generateBubbleTreeData(
          data.cells,
          params
        );

        var currency = data.currency[params.aggregates];
        var valueFormat = that.getValueFormatter(currency);

        if (bubbleTreeData) {
          that.bubbleTree = new BubbleTree({
            autoColors: true,
            data: bubbleTreeData,
            container: wrapper,
            formatValue: valueFormat,
            nodeClickCallback: (node) => {
              if (node.level > 0) {
                that.emit('click', that, node);
              }
            }
          });
        }

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
