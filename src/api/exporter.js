import _ from 'lodash'

var exportfunc;

export function setExportFunc(func) {
  exportfunc = func;
}

export function exportResults(method, results) {
  if (!_.isUndefined(exportfunc)) {
    exportfunc('_babbage_results_' + method, results);
  }
}