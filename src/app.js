var ngCubesGlobals = ngCubesGlobals || {};
ngCubesGlobals.numberFormat = d3.format("0,000");
ngCubesGlobals.categoryColors = [
    "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
    "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D",
    "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B",
    "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
    ];
ngCubesGlobals.colorScale = d3.scale.ordinal().range(ngCubesGlobals.categoryColors);

var ngCubes = angular.module('ngCubes', ['ngCubes.templates']);

ngCubes.filter('numeric', function() {
  return function(val) {
    var fval = parseFloat(val)
    if (isNaN(fval)) {
      return '-';
    }
    return ngCubesGlobals.numberFormat(Math.round(fval));
  };
});
