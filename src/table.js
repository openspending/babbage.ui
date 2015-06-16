
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
      scope.rows = [];
      scope.table = [];

      cubesCtrl.registerQueryProcessor(function(q, state) {
        state.rows = asArray(state.rows);
        state.columns = asArray(state.columns);

        var multiplier = Math.max((state.rows.length + 1) * (state.columns.length + 1), 1);
        q.pagesize = q.pagesize * multiplier;
        return q;
      });

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, m) {
        model = m;
      });

      $rootScope.$on(cubesCtrl.dataUpdate, function(event, data) {
        console.log('data recv', data);
      });

      cubesCtrl.init({
        rows: {label: 'Rows', multiple: true},
        columns: {label: 'Columns', multiple: true},
      });
    }
  };
}]);

