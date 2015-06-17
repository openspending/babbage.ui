
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

        cubesCtrl.registerQueryProcessor(function(q, state) {
            q.endpoint = 'facts';
            q.page = scope.page;
            return q;
        });

        $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
            // scope.model = model;
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
                        // attr.dimension = dim;
                        refs[attr.ref] = {
                            ref: attr.ref,
                            label: attr.label || attr.name
                        };
                    }
                }
            }
            // console.log(refs);
        });

        $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q, state) {
            scope.data = data;
            if (!data.length) return;

            var frst = data[0];
            columns = [];
            for (var k in frst) {
                columns.push(refs[k]);
            }
            scope.columns = columns;
        });

        cubesCtrl.init({
            columns: {label: 'Columns', multiple: true},
        });
    }
  };
}]);

