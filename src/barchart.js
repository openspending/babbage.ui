
ngCubes.directive('cubesBarchart', ['$rootScope', '$http', function($rootScope, $http) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
    },
    templateUrl: 'angular-cubes-templates/barchart.html',
    link: function(scope, element, attrs, cubesCtrl) {
      var query = function(model, state) {
        var x = asArray(state.x)[0],
            y = asArray(state.y)[0];

        var q = cubesCtrl.getQuery();
        q.aggregates = x;
        if (!x) {
          return;
        }
        q.drilldown = [y];

        var order = [];
        for (var i in q.order) {
          var o = q.order[i];
          if ([x, y].indexOf(o.ref) != -1) {
            order.push(o);
          }
        }
        if (!order.length) {
          order = [{ref: y, direction: 'desc'}];
        }

        q.order = order;
        q.page = 0;
        q.pagesize = 50;

        var dfd = $http.get(cubesCtrl.getApiUrl('aggregate'),
                            cubesCtrl.queryParams(q));
      dfd.then(function(res) {
        queryResult(res.data, q, model, state);
      });
      };
      var queryResult = function(data, q, model, state) {
        var x = asArray(state.x)[0],
            y = asArray(state.y)[0];
        shorthand = {
          "data": {
              "values": data.cells
            },
          "marktype": "bar",
          "encoding": {
              "y": {"type": "O","name": y},
              "x": {"type": "Q","name": x}
            }
        };
        wrapper = element.querySelectorAll('.barchart-cubes')[0]
        spec = vl.compile(shorthand);
        vg.parse.spec(spec, function(chart) {
          var view = chart({el:wrapper})
            .update();
        });
      };
      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
        query(model, state);
      });
      cubesCtrl.init({
        y: {
          label: 'Y',
          addLabel: 'set Y',
          types: ['attributes'],
          defaults: [],
          sortId: 0,
          multiple: false
        },
        x: {
          label: 'X',
          addLabel: 'set x',
          types: ['aggregates'],
          defaults: [],
          sortId: 1,
          multiple: false
        },
      });
    }
  }
}]);
