
ngCubes.directive('cubesFacts', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
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
    scope.pagerCtx = {};

    var query = function(model, state) {
      var q = cubesCtrl.getQuery();
      q.fields = asArray(state.fields);
      if (q.fields.length == 0) {
        q.fields = defaultFields(model);
      }

      var aq = angular.copy(q);
      aq.drilldown = aq.fields = [];
      aq.page = 0;
      var facts = $http.get(cubesCtrl.getApiUrl('facts'),
                            cubesCtrl.queryParams(q)),
          aggs = $http.get(cubesCtrl.getApiUrl('aggregate'),
                            cubesCtrl.queryParams(aq));
      $q.all([facts, aggs]).then(function(res) {
        queryResult(res[0].data, res[1].data, q, state);
      });
    };

    var queryResult = function(data, aggs, q, state) {
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
          prev = null, prev_idx = 0;
      for (var i in keys) {
        var column = refs[keys[i]],
            header = column.dimension ? column.dimension : column;
        if (header.name == prev) {
          columns[prev_idx].span += 1;
          column.span = 0;
        } else {
          column.span = 1;
          column.label = column.label || column.name;
          column.header = header.label || header.name;
          column.hide = column.header == column.label;
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

    $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
      for (var i in model.measures) {
        var measure = model.measures[i];
        measure.numeric = true;
        refs[measure.ref] = measure;
      }
      for (var di in model.dimensions) {
        var dim = model.dimensions[di];
        for (var li in dim.levels) {
          var lvl = dim.levels[li];
          for (var ai in lvl.attributes) {
            var attr = lvl.attributes[ai];
            attr.dimension = dim;
            refs[attr.ref] = attr;
          }
        }
      }
      query(model, state);
    });

    // console.log('facts init');
    cubesCtrl.init({
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

