var VAL_KEY = '@@@@',
    POS_KEY = '!@!@'

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

      $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q, state) {
        if (!model) return;

        state.rows = asArray(state.rows);
        state.columns = asArray(state.columns);
        //state.aggregates = asArray(state.aggregates);
        //var aggregates = state.aggregates ? state.aggregates : data.aggregates;

        // following code inspired by: 
        // https://github.com/DataBrewery/cubes/blob/master/cubes/formatters.py#L218
        var matrix = {}, table = [], row_headers = [], column_headers = [];

        var pick = function(cell) { return function(key) { return cell[key]; }};

        for (var i in data.cells) {
            var cell = data.cells[i],
                row_values = state.rows.map(pick(cell)),
                column_values = cell_rows = state.columns.map(pick(cell)),
                row_set = row_values.join(VAL_KEY),
                column_set = column_values.join(VAL_KEY);

            if (row_headers.indexOf(row_set) == -1) {
                row_headers.push(row_set);
            }

            if (column_headers.indexOf(column_set) == -1) {
                column_headers.push(column_set);
            }

            var key = [row_set, column_set].join(POS_KEY);
            matrix[key] = data.aggregates.map(pick(cell));
        }

        console.log(matrix);
        scope.table = table;

      });

      cubesCtrl.init({
        rows: {label: 'Rows', multiple: true},
        columns: {label: 'Columns', multiple: true},
      });
    }
  };
}]);

