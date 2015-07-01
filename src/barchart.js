
ngCubes.directive('cubesBarchart', ['$rootScope', '$http', function($rootScope, $http) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
    },
    templateUrl: 'angular-cubes-templates/barchart.html',
    link: function(scope, element, attrs, cubesCtrl) {
      scope.queryLoaded = false;
      var isAggregate = function(aggregates, type) {
        var isAggregate = aggregates.some(function(a) {
          return (a.name == type);
        });
        return isAggregate;
      }
      var getAggregate = function(model, x, y) {
        var aggregate;
        if(isAggregate(model.aggregates, x)) {
          aggregate = x;
        }
        if(isAggregate(model.aggregates, y)) {
          aggregate = y;
        }
        return aggregate;
      }
      var query = function(model, state) {
        var x = asArray(state.x)[0],
            y = asArray(state.y)[0];

        var q = cubesCtrl.getQuery();
        q.aggregates = getAggregate(model, x, y);
        if (!q.aggregates) {
          return;
        }
        var drilldown = (q.aggregates == y) ? x : y;
        q.drilldown = [drilldown];

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
        xType = isAggregate(model.aggregates, x) ? "Q" : "O";
        yType = isAggregate(model.aggregates, y) ? "Q" : "O";
        ySlug = y.replace(/\./g,"-");
        xSlug = x.replace(/\./g,"-");
        var dataCells = [];
        data.cells.forEach(function(d) {
          dCell = {};
          Object.keys(d).forEach(function(key){
              var value = d[key];
              key = key.replace(/\./g,'-');
              dCell[key] = value;
          });
          dataCells.push(dCell);
        });

        shorthand = {
          "data": {
              "values": dataCells
            },
          "marktype": "bar",
          "encoding": {
              "y": {"type": yType, "name": ySlug},
              "x": {"type": xType, "name": xSlug}
            }
        };
        wrapper = element.querySelectorAll('.barchart-cubes')[0]
        spec = vl.compile(shorthand);
        vg.parse.spec(spec, function(chart) {
          var view = chart({el:wrapper})
            .update();
        });
        scope.queryLoaded = true;
      };
      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
        query(model, state);
      });
      cubesCtrl.init({
        y: {
          label: 'Y',
          addLabel: 'set Y',
          types: ['attributes', 'aggregates'],
          defaults: [],
          sortId: 0,
          multiple: false
        },
        x: {
          label: 'X',
          addLabel: 'set x',
          types: ['attributes', 'aggregates'],
          defaults: [],
          sortId: 1,
          multiple: false
        },
      });
    }
  }
}]);
