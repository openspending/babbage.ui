import { Api } from '../../api/index'
import _ from 'lodash'
import events from 'events'
var api = new Api();

export class FactsComponent extends events.EventEmitter {
  constructor() {
    super();
    this.downloader = null;
  }
  getTableData(endpoint, cube, params) {
    params = _.cloneDeep(params);
    var that = this;

    this.emit('beginFacts', this);
      api.downloader = this.downloader;
      return api.facts(endpoint, cube, params).then((data) => {
        this.emit('endFacts', that, data);
        return data;
      });
  }

}

export default FactsComponent