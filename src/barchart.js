
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
        q.pagesize = 50;

        var dfd = $http.get(babbageCtrl.getApiUrl('aggregate'),
                            babbageCtrl.queryParams(q));
        dfd.then(function(res) {
          queryResult(res.data, q, model, state);
        });
      };

      var queryResult = function(data, q, model, state) {
        var x = asArray(state.x)[0],
            y = asArray(state.y)[0];

        var wrapper = element.querySelectorAll('.barchart-babbage')[0],
            size = babbageCtrl.size(wrapper, function(w) {
              return 100 + (w * 0.035) * data.cells.length;
            });

        d3.select(wrapper)
          .style("width", size.width + "px")
          .style("height", size.height + "px");

        var insertLinebreaks = function (t, d, width) {
          var el = d3.select(t);
          var p = d3.select(t.parentNode);
          p.append("foreignObject")
              .attr('x', -width - 10)
              .attr('y', -10)
              .attr("width", width)
              .attr("height", 200)
            .append("xhtml:p")
              .attr('style','word-wrap: break-word; text-align:right;')
              .html(d);

          el.remove();
        };

        nv.addGraph(function() {
          var chart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d[x]; })
                .y(function(d) { return d[y]; })
                .margin({left: size.width * 0.3, top: 0})
                .barColor(ngBabbageGlobals.colorScale.range())
                .showControls(false)
                .showLegend(false)
                .duration(250);

          chart.xAxis
            .staggerLabels(true);

          chart.yAxis
            .staggerLabels(true);

          d3.select(wrapper).select('svg')
              .datum([{values: data.cells}])
              .call(chart);

          d3.select(wrapper).select('.nv-x.nv-axis')
            .selectAll('text')
              .each(function(d, i) { insertLinebreaks(this, d, size.width * 0.3 ); });

          nv.utils.windowResize(chart.update);
          return chart;
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
