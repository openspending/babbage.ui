import _ from 'lodash'

var exportObject;

export function setExportObject(obj) {
  exportObject = obj;
}

export function exportResults(method, results) {
  if (!_.isUndefined(exportObject)) {
    exportObject['_babbage_results_' + method] = results;
  }
}