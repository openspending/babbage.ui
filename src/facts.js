
ngCubes.directive('cubesFacts', ['$rootScope', function($rootScope) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/facts.html',
  link: function(scope, element, attrs, cubesCtrl) {
    var refs = {};

    scope.page = 0;
    scope.data = [];
    scope.columns = [];

    var queryProcessor = function(q, state) {
      q.endpoint = 'facts';
      q.page = scope.page;
      return q;
    };

    var unsubModel = $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
      for (var i in model.measures) {
        var measure = model.measures[i];
        measure.numeric = true;
        refs[measure.ref] = measure;
      }
      for (var di in model.dimensions) {
        var dim = model.dimensions[di];
        for (var li in dim.levels) {
          var lvl = dim.levels[li];
          for (var ai in lvl.attributes) {
            var attr = lvl.attributes[ai];
            attr.dimension = dim;
            refs[attr.ref] = attr;
          }
        }
      }
    });

    var unsubData = $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q, state) {
      // console.log('facts received data');
      scope.data = data;
      if (!data.length) return;

      var frst = data[0],
          keys = [];
      for (var k in frst) {
        keys.push(k);
      }
      keys = keys.sort();

      var columns = [],
          prev = null, prev_idx = 0;
      for (var i in keys) {
        var column = refs[keys[i]],
            header = column.dimension ? column.dimension : column;
        if (header.name == prev) {
          columns[prev_idx].span += 1;
          column.span = 0;
        } else {
          column.span = 1;
          column.label = column.label || column.name;
          column.header = header.label || header.name;
          column.hide = column.header == column.label;
          prev = header.name;
          prev_idx = columns.length;
        }
        columns.push(column);
      }
      console.log(columns);
      scope.columns = columns;
    });

    // console.log('facts init');
    cubesCtrl.init({
      columns: {label: 'Columns', multiple: true},
    }, queryProcessor);

    scope.$on('$destroy', function() {
      unsubModel();
      unsubData();
    });
  }
  };
}]);

