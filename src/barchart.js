
ngBabbage.directive('babbageBarchart', ['$rootScope', '$http', function($rootScope, $http) {
  return {
    restrict: 'EA',
    require: '^babbage',
    scope: {
    },
    templateUrl: 'babbage-templates/barchart.html',
    link: function(scope, element, attrs, babbageCtrl) {
      scope.queryLoaded = false;

      var isAggregate = function(aggregates, ref) {
        return angular.isDefined(aggregates[ref]);
      };

      var getAggregates = function(model, x, y) {
        var aggregates = [];
        if (isAggregate(model.aggregates, x)) {
          aggregates.push(x);
        }
        if (isAggregate(model.aggregates, y)) {
          aggregates.push(y);
        }
        return aggregates;
      };

      var query = function(model, state) {
        var x = asArray(state.x)[0],
            y = asArray(state.y)[0];

        var q = babbageCtrl.getQuery();
        q.aggregates = getAggregates(model, x, y);
        if (!q.aggregates.length) {
          return;
        }

        q.drilldown = [x, y].filter(function(e) {
          return q.aggregates.indexOf(e) == -1;
        });

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
        q.pagesize = 500;

        var dfd = $http.get(babbageCtrl.getApiUrl('aggregate'),
                            babbageCtrl.queryParams(q));
        dfd.then(function(res) {
          queryResult(res.data, q, model, state);
        });
      };

      var getNames = function(model) {
        var names = {};
        for (var ref in model.refs) {
          var concept = model.refs[ref];
          names[ref] = concept.label || concept.name || ref;
        }
        return names;
      };

      var queryResult = function(data, q, model, state) {
        var x = asArray(state.x)[0],
            y = asArray(state.y)[0];

        var wrapper = element.querySelectorAll('.barchart-babbage')[0],
            size = babbageCtrl.size(wrapper, function(w) {
              return w * 0.6;
            });

        d3.select(wrapper)
          .style("width", size.width + "px")
          .style("height", size.height + "px");

        var chart = c3.generate({
          bindto: wrapper,
          data: {
              json: data.cells,
              names: getNames(model),
              color: ngBabbageGlobals.colorScale,
              order: null,
              keys: {
                x: x,
                value: [y]
              },
              type: 'bar'
          },
          grid: {
            focus: {
              show: false
            }
          },
          axis: {
              x: {
                  type: 'category',
                  tick: {
                    culling: true,
                    fit: true
                  }
              },
              y : {
                 tick: {
                     format: ngBabbageGlobals.numberFormat,
                     culling: true,
                     fit: true
                 }
             }
          }
        });

        scope.queryLoaded = true;
      };

      var unsubscribe = babbageCtrl.subscribe(function(event, model, state) {
        query(model, state);
      });
      scope.$on('$destroy', unsubscribe);

      babbageCtrl.init({
        y: {
          label: 'Y Axis',
          addLabel: 'set Y axis',
          types: ['attributes', 'aggregates'],
          defaults: [],
          sortId: 0,
          multiple: false
        },
        x: {
          label: 'X Axis',
          addLabel: 'set X axis',
          types: ['attributes', 'aggregates'],
          defaults: [],
          sortId: 1,
          multiple: false
        },
      });
    }
  }
}]);
