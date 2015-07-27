
ngBabbage.directive('babbageChart', ['$rootScope', '$http', function($rootScope, $http) {
  return {
    restrict: 'EA',
    require: '^babbage',
    scope: {
    },
    templateUrl: 'babbage-templates/chart.html',
    link: function(scope, element, attrs, babbageCtrl) {
      scope.queryLoaded = false;

      var getNames = function(model) {
        var names = {};
        for (var ref in model.refs) {
          var concept = model.refs[ref];
          names[ref] = concept.label || concept.name || ref;
        }
        return names;
      };

      var query = function(model, state) {
        var category = asArray(state.category)[0],
            value = asArray(state.value)[0];

        if (!value || !category) return;

        var q = babbageCtrl.getQuery();
        q.aggregates = [value];
        q.drilldown = [category];

        var order = [];
        for (var i in q.order) {
          var o = q.order[i];
          if ([value, category].indexOf(o.ref) != -1) {
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
          queryResult(res.data, q, model, state, category, value);
        });
      };

      var queryResult = function(data, q, model, state, category, value) {
        var wrapper = element.querySelectorAll('.chart-babbage')[0],
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
                x: category,
                value: [value]
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
        category: {
          label: 'Categories',
          addLabel: 'set bar division',
          types: ['attributes'],
          defaults: [],
          sortId: 0,
          multiple: false
        },
        value: {
          label: 'Value',
          addLabel: 'set bar height',
          types: ['aggregates'],
          defaults: [],
          sortId: 1,
          multiple: false
        }
      });
    }
  }
}]);
