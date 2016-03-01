import d3 from 'd3'
import _ from 'lodash'

var defaultColorSchema = [
  "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
  "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D",
  "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B",
  "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
];

export function buildNames(data) {
  var result = {};
  _.each(data, (item) => {
    result[item.key] = item.name
  });
  return result;
};

export function buildColumns(data) {
  var result = _.map(data, (item) => {
    return [item.key, item.value];
  });
  return result;
};

export function buildColors(data, colorSchema) {
  var scale = d3.scale.ordinal()
    .range(_.isArray(colorSchema) || defaultColorSchema);

  var result = _.map(data, (item, index) => {
    return [item.key, scale(index)];
  });
  return result
};
