import d3 from 'd3'
import _ from 'lodash'

var defaultColorSchema = [
  "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
  "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D",
  "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B",
  "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
];

var scale = d3.scale.ordinal();

export var numberFormat = d3.format("0,000");

export function colorScale(index, colorSchema) {
  scale.range(
    _.isArray(colorSchema) || defaultColorSchema
  );

  return scale(index);
};

export function buildC3Names(data) {
  var result = {};
  _.each(data.cells, (item) => {
    var dimension = _.first(item.dimensions);
    result[dimension.keyValue] = dimension.nameValue;
  });
  return result;
};

export function buildC3Columns(data, aggregates) {
  var result = _.map(data.cells, (item) => {
    var dimension = _.first(item.dimensions);
    var measure = _.find(item.measures, {key: aggregates});
    return [dimension.keyValue, measure.value];
  });
  return result;
};

export function buildC3Colors(data, colorSchema) {
  var result = _.map(data.cells, (item, index) => {
    var dimension = _.first(item.dimensions);
    return [dimension.keyValue, colorScale(index, colorSchema)];
  });
  return result
};
