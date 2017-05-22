import d3 from 'd3'
import _ from 'lodash'

export var numberFormat = d3.format('0,000');

export const defaultColorScale = d3.scale.category10;

export function buildC3Names(data) {
  var result = {};
  _.each(data.cells, (item) => {
    var dimension = _.first(item.dimensions);
    result[dimension.keyValue] = dimension.nameValue;
  });
  return result;
}

export function buildC3BarNames(data, aggregates) {
  var result = {};
  _.each(data.cells, (item) => {
    var dimension = _.first(item.dimensions);
    if (_.values(result).length == 0) {
      var measure = _.find(item.measures, {key: aggregates});
      result[measure.key] = _.first(measure.key.split('.'));
    }
    result[dimension.keyValue] = dimension.nameValue;
  });
  return result;
}


export function buildC3PieColumns(data, aggregates) {
  return _.map(data.cells, (item) => {
    var dimension = _.first(item.dimensions);
    var measure = _.find(item.measures, {key: aggregates});
    return [dimension.keyValue, measure.value];
  });
}

export function buildC3Columns(data, xDimensionField, seriesDimensionField, aggregates) {
  var i;
  var j;
  var columns = [[xDimensionField]], series = {xDimensionField: 0};

  for (i in data.cells) {
    var seriesDimension;
    var item = data.cells[i];
    var xDimension = _.find(item.dimensions, {keyField: xDimensionField});
    if (seriesDimensionField) {
      seriesDimension = _.find(item.dimensions, {keyField: seriesDimensionField});
    }

    var measure = _.find(item.measures, {key: aggregates});
    var field = seriesDimensionField ? seriesDimension.nameValue : measure.name;

    if (!series[field]) {
      series[field] = columns.push([field]) - 1;
    }
    if (columns[0].indexOf(xDimension.nameValue) < 1) {
      columns[0].push(xDimension.nameValue);
    }
    var index = columns[0].indexOf(xDimension.nameValue);
    columns[series[field]][index] = measure.value;
  }
  var maxLength = Math.max.apply(null, columns.map(function(r) {
    return r.length;
  }));
  for (i = 1; i < maxLength; i++) {
    for (j in columns) {
      columns[j][i] = columns[j][i] || 0;
    }
  }
  return columns;
}


export function buildC3BarColumns(data, aggregates) {
  var result = [];
  var list = [];
  _.each(data.cells, (item) => {
    var dimension = _.first(item.dimensions);
    if (list.length == 0) {
      list.push(dimension.keyField);
    }
    list.push(dimension.nameValue);
  });
  result.push(list);
  list = [];

  _.each(data.cells, (item) => {
    var measures = _.find(item.measures, {key: aggregates});

    if (list.length == 0) {
      list.push(measures.key);
    }
    list.push(measures.value);
  });
  result.push(list);

  return result;
}


export function buildC3Colors(data, colorSchema) {
  return _.map(data.cells, (item, index) => {
    var dimension = _.first(item.dimensions);
    return [dimension.keyValue, colorScale(index, colorSchema)];
  });
}

export function buildC3BarColors(data, colorSchema) {
  return _.map(data.cells, (item, index) => {
    var dimension = _.first(item.dimensions);
    return [dimension.keyValue, colorScale(index, colorSchema)];
  });
}

export function moneyFormat(amount, currency) {
  if (amount && currency) {
    let currencySymbol = {USD: '$', GBP:'£', EUR: '€', JPY: '¥'}[currency];
    let amountFmt = currencySymbol ? currencySymbol + amount :
      amount + ' ' + currency;
    return amountFmt ? amountFmt : '';
  } else {
    return amount ? amount : '';
  }
}

export function defaultFormatValue(value) {
  return numberFormat(Math.round(value))
}
