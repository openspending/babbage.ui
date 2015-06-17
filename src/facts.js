
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
        var agg = model.measures[i];
        refs[agg.ref] = {
          ref: agg.ref,
          numeric: true,
          label: agg.label || agg.name
        };
      }
      for (var di in model.dimensions) {
        var dim = model.dimensions[di];
        for (var li in dim.levels) {
          var lvl = dim.levels[li];
          for (var ai in lvl.attributes) {
            var attr = lvl.attributes[ai];
            refs[attr.ref] = {
              ref: attr.ref,
              label: attr.label || attr.name
            };
          }
        }
      }
    });

    var unsubData = $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q, state) {
      console.log('facts received data');
      scope.data = data;
      if (!data.length) return;

      var frst = data[0];
      columns = [];
      for (var k in frst) {
        columns.push(refs[k]);
      }
      scope.columns = columns;
    });

    console.log('facts init');
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

