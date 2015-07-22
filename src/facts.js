
ngBabbage.directive('babbageFacts', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
  return {
  restrict: 'EA',
  require: '^babbage',
  scope: {
    drilldown: '='
  },
  templateUrl: 'babbage-templates/facts.html',
  link: function(scope, element, attrs, babbageCtrl) {
    scope.page = 0;
    scope.data = [];
    scope.columns = [];
    scope.pagerCtx = {};
    scope.getSort = babbageCtrl.getSort;
    scope.pushSort = babbageCtrl.pushSort;

    var query = function(model, state) {
      var q = babbageCtrl.getQuery();
      q.fields = asArray(state.fields);
      if (q.fields.length == 0) {
        q.fields = defaultFields(model);
      }

      var order = [];
      for (var i in q.order) {
        var o = q.order[i];
        if (q.fields.indexOf(o.ref) != -1) {
          order.push(o);
        }
      }
      q.order = order;

      var aq = angular.copy(q);
      aq.drilldown = aq.fields = [];
      aq.page = 0;
      var facts = $http.get(babbageCtrl.getApiUrl('facts'),
                            babbageCtrl.queryParams(q)),
          aggs = $http.get(babbageCtrl.getApiUrl('aggregate'),
                            babbageCtrl.queryParams(aq));
      $q.all([facts, aggs]).then(function(res) {
        queryResult(res[0].data, res[1].data, q, state, model);
      });
    };

    var queryResult = function(data, aggs, q, state, model) {
      if (!data.length) {
        scope.columns = [];
        scope.data = [];
        scope.pagerCtx = {};
        return;
      };

      var frst = data[0],
          keys = [];

      for (var k in frst) {
        keys.push(k);
      }
      keys = keys.sort();

      var columns = [],
          prev = null,
          prev_idx = 0;

      for (var i in keys) {
        var ref = keys[i],
            column = model.refs[ref],
            header = column.dimension ? column.dimension : column;

        column.ref = ref;

        if (header.name == prev) {
          columns[prev_idx].span += 1;
          column.span = 0;
        } else {
          column.span = 1;
          column.label = column.label || column.name;
          column.header = header.label || header.name;
          column.hide = column.hideLabel;
          prev = header.name;
          prev_idx = columns.length;
        }
        columns.push(column);
      }
      scope.columns = columns;
      scope.data = data;
      scope.pagerCtx = {
        page: q.page,
        pagesize: q.pagesize,
        // FIXME: this is SpenDB-specific:
        total: aggs.summary.fact_count
      }
    };

    var defaultFields = function(model) {
      var defaults = [];
      for (var i in model.measures) {
        var mea = model.measures[i];
        defaults.push(mea.ref);
      }
      for (var i in model.dimensions) {
        var dim = model.dimensions[i];
        for (var j in dim.levels) {
          var lvl = dim.levels[j];
          for (var k in lvl.attributes) {
            var attr = lvl.attributes[k];
            if (attr.name == lvl.label_attribute) {
              defaults.push(attr.ref);
            }
          }
        }
      }
      return defaults;
    };

    var unsubscribe = babbageCtrl.subscribe(function(event, model, state) {
      query(model, state);
    });
    scope.$on('$destroy', unsubscribe);

    // console.log('facts init');
    babbageCtrl.init({
      fields: {
        label: 'Columns',
        addLabel: 'add column',
        types: ['attributes', 'measures'],
        defaults: defaultFields,
        sortId: 0,
        multiple: true
      }
    });
  }
  };
}]);
