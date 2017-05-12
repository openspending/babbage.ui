'use strict';

import * as _ from 'lodash';

export const defaultI18NMessages = {
  loadingData: '<strong>Loading data.</strong> Please wait...',
  noDataAvailable: '<strong>No data to display.</strong>',
  tooManyCategories: '<strong>Too many categories.</strong> ' +
    'The breakdown you have selected contains many ' +
    'different categories, only the {count} biggest are shown.',
  chooseRowsAndColumns: '<strong>You have not selected any data.</strong> ' +
    'Please choose a set of rows ' +
    'and columns to generate a cross-table.',
  tooMuchData: '<strong>Oh snap!</strong> ' +
    'The query returns too much data and can\'t be ' +
    'displayed in the table.',
  showList: 'Show list',
  hideList: 'Hide list',
  title: 'Title',
  amount: 'Amount',
  percentage: 'Share',
  total: 'Total',
  others: 'Others',
};

function getValueOrDefault(value, defaultValue) {
  if (_.isNull(value) || _.isUndefined(value) || (value === '')) {
    return defaultValue;
  }
  return value;
}

function processVariables(message, variables) {
  if (!_.isString(message)) {
    return message;
  }
  let result = message;
  _.each(variables, function(value, key) {
    if (!_.isUndefined(value) && !_.isNull(value)) {
      let pattern = new RegExp('\\{' + key + '\\}', 'g');
      result = result.replace(pattern, value);
    }
  });
  return result;
}

export function createI18NMapper(messages) {
  if (_.isFunction(messages)) {
    return function(key, variables) {
      return processVariables(getValueOrDefault(messages(key), key), variables);
    }
  }

  messages = _.extend({}, messages);
  return function(key, variables) {
    return processVariables(getValueOrDefault(messages[key],
      // Fallback to default message table
      getValueOrDefault(defaultI18NMessages[key], key)), variables);
  };
}

export function createDefaultI18NMapper() {
  return createI18NMapper(defaultI18NMessages);
}
