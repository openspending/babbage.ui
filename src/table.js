
ngCubes.directive('cubesTable', ['$rootScope', function($rootScope) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
      drilldown: '='
    },
    templateUrl: 'angular-cubes-templates/table.html',
    link: function(scope, element, attrs, cubesCtrl) {
      var model = null, query = {};
      scope.columns = [];
      scope.headers = [];
      scope.table = [];

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, m) {
        model = m;
      });

      $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q) {
        query = q;
        if (!model) {
          return;
        }

        var headers = [], columns = [], dimensions = [];
        for (var d in data.levels) {
          for (var j in model.dimensions) {
            var dim = model.dimensions[j];
            if (dim.name == d) {
              dimensions.push(dim);
            }
          }
        }
        for (var i in dimensions) {
          var d = dimensions[i], dprefix = d.name + '.',
              span = 0;
          for (var j in data.attributes) {
            var a = data.attributes[j];
            if (a.startsWith(dprefix)) {
              var name = a.split('.')[1];
              columns.push({
                name: name,
                column: a,
                type: 'text'
              });
              span++;
            }
          }
          headers.push({
            label: d.label,
            colspan: span
          })
        }

        // aggregates metadata
        for (var i in data.aggregates) {
          var a = data.aggregates[i];
          for (var j in model.aggregates) {
            var attr = model.aggregates[j];
            if (attr.name == a) {
              attr.type = 'numeric';
              attr.column = attr.name;
              attr.colspan = 1;
              columns.push(attr);
              headers.push(attr);
            }
          }
        }

        scope.table = data.cells;
        if (data.cells.length == 0 && data.cells.length == 0) {
          scope.table = [data.summary];
        }
        scope.columns = columns;
        scope.headers = headers;
      });

      cubesCtrl.init();
      cubesCtrl.updateQuery(cubesCtrl.getQuery());
    }
  };
}]);

