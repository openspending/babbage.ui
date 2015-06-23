
var makeSignal = function(name) {
  return 'cubes_' + Math.random().toString(36).replace(/[^a-z]+/g, '');
};

function asArray(obj) {
  objs = obj ? obj : [];
  return angular.isArray(objs) ? objs : [objs];
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
// suggested polyfill for safari & IE
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}
;
var ngCubes = angular.module('ngCubes', ['ngCubes.templates']),
    numberFormat = d3.format("0,000");

ngCubes.filter('numeric', function() {
  return function(val) {
    var fval = parseFloat(val)
    if (isNaN(fval)) {
      return '-';
    }
    return numberFormat(Math.round(fval));
  };
})

ngCubes.factory('cubesApi', ['$http', '$q', function($http, $q) {
  var cache = {};

  var getUrl = function(slicer, cube, endpoint) {
    var api = slicer.slice(),
        api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
        api = api + '/cube/' + cube + '/' + endpoint;
    return api;
  };

  var getModel = function(slicer, cube) {
    var url = getUrl(slicer, cube, 'model');
    if (!angular.isDefined(cache[url])) {
      cache[url] = $http.get(url);
    } 
    return cache[url];
  };

  var flush = function() {
    cache = {};
  };

  return {
    getUrl: getUrl,
    getModel: getModel,
    flush: flush
  };
}]);

ngCubes.directive('cubes', ['$http', '$rootScope', '$location', 'cubesApi',
    function($http, $rootScope, $location, cubesApi) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      slicer: '@',
      cube: '@',
      state: '='
    },
    templateUrl: 'angular-cubes-templates/cubes.html',
    controller: ['$scope', function($scope) {
      var self = this,
          state = angular.extend({}, $scope.state || {}, $location.search());

      self.dataUpdate = makeSignal();
      self.modelUpdate = makeSignal();
      self.queryModel = {};
      
      self.init = function(queryModel) {
        self.queryModel = queryModel;
        cubesApi.getModel($scope.slicer, $scope.cube).then(function(res) {
          $rootScope.$broadcast(self.modelUpdate, res.data, state);
        });
      };

      self.getState = function() {
        return state;
      };

      self.setState = function(s) {
        $location.search(s);
      };

      self.getApiUrl = function(endpoint) {
        return cubesApi.getUrl($scope.slicer, $scope.cube, endpoint);
      };

      self.getQuery = function() {
        var q = {
          drilldown: [],
          aggregates: [],
          cut: state.cut || [],
          page: state.page || 0,
          pagesize: state.pagesize || 20,
          order: []
        };
        return q;
      };

      self.queryParams = function(q) {
        // join arguments and remove empty arguments
        for (var k in q) {
          if (angular.isArray(q[k])) {
            if (['order', 'fields'].indexOf(k) == -1) {
              q[k] = q[k].join('|');
            } else {
              q[k] = q[k].join(',');
            }
          }
          q[k] = q[k] + '';
          if (!q[k].length) {
            delete q[k];
          }
        }
        return {params: q};
      }
 
      // self.query = function() {
      //   var q = self.getQuery(),
      //       endpoint = q.endpoint;
      //   delete q['endpoint'];
      //   $http.get(self.getApiUrl(endpoint), {params: q}).then(function(res) {
      //     $rootScope.$broadcast(self.dataUpdate, res.data, q, state);
      //   });
      // };

    }]
  };
}]);

;
ngCubes.directive('cubesPager', ['$timeout', '$location', function ($timeout, $location) {
  return {
    restrict: 'E',
    scope: {
      'context': '='
    },
    templateUrl: 'angular-cubes-templates/pager.html',
    link: function (scope, element, attrs, model) {
      scope.showPager = false;
      scope.hasPrev = false;
      scope.hasNext = false;
      scope.pages = [];
      scope.cur = 0;
      scope.num = 0;
        
      scope.$watch('context', function(e) {
        if (!scope.context || scope.context.total <= scope.context.pagesize) {
          return;
        }
        scope.current = parseInt(scope.context.page, 10) || 0;
        scope.num = Math.ceil(scope.context.total / scope.context.pagesize)
        var pages = [],
          num = scope.num,
          range = 3,
          low = scope.current - range,
          high = scope.current + range;

        if (low < 0) {
          low = 0;
          high = Math.min((2*range)+1, num);
        }
        if (high > num) {
          high = num;
          low = Math.max(1, num - (2*range)+1);
        }

        for (var page = low; page <= high; page++) {
          // var offset = (page - 1) * scope.context.pagesize;
          pages.push({
            page: page,
            current: page == scope.current,
            //offset: offset
          });
        }
        scope.hasPrev = scope.current > 0;
        scope.hasNext = scope.current < num;
        scope.showPager = num > 1;
        scope.pages = pages;
      });

      scope.setPage = function(page) {
        if (page >= 0 && page <= scope.num) {
          var state = $location.search();
          state.page = page;
          $location.search(state);  
        }
      }
    }
  };
}]);
;var VAL_KEY = '@@@@',
    POS_KEY = '!@!@'

ngCubes.directive('cubesCrosstab', ['$rootScope', '$http', function($rootScope, $http) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/crosstab.html',
  link: function(scope, element, attrs, cubesCtrl) {
    //var model = null, query = {};
    scope.columns = [];
    scope.rows = [];
    scope.table = [];

    var query = function(model, state) {
      state.rows = asArray(state.rows);
      state.columns = asArray(state.columns);
      // TODO: handle a case in which both sets contain the same
      // ref.

      var q = cubesCtrl.getQuery();
      q.aggregates = q.aggregates.concat(state.aggregates);
      q.drilldown = q.drilldown.concat(state.rows);
      q.drilldown = q.drilldown.concat(state.columns);
      q.pagesize = q.pagesize * 10000;

      q.order = asArray(q.order);
      var drilldowns = state.rows.concat(state.columns);
      for (var i in drilldowns) {
        var dd = drilldowns[i];
        // TODO: sorting?
        if (q.order.indexOf(dd) == -1) {
          q.order.push(dd);
        }
      }
      var dfd = $http.get(cubesCtrl.getApiUrl('aggregate'),
                          cubesCtrl.queryParams(q));
      dfd.then(function(res) {
        queryResult(res.data, q, model, state);
      });
    };

    var queryResult = function(data, q, model, state) {
      // console.log('crosstab received data');
      if (!model) return;

      state.rows = asArray(state.rows);
      state.columns = asArray(state.columns);

      var aggregates = model.aggregates.filter(function(agg) {
        return data.aggregates.indexOf(agg.ref) != -1;
      });

      // following code inspired by: 
      // https://github.com/DataBrewery/cubes/blob/master/cubes/formatters.py#L218
      var matrix = {}, table = [],
          row_headers = [], column_headers = [],
          row_keys = [], column_keys = [];

      for (var i in data.cells) {
        var pick = function(k) { return cell[k]; };
        var cell = data.cells[i],
            row_values = state.rows.map(pick),
            row_set = row_values.join(VAL_KEY),
            all_column_values = state.columns.map(pick);

        for (var k in aggregates) {
          var agg = aggregates[k],
              label = agg.label || agg.name,
              column_values = all_column_values.concat([label]);
              column_set = column_values.join(VAL_KEY)

          if (row_keys.indexOf(row_set) == -1) {
            row_keys.push(row_set);
            row_values.key = row_set;
            row_headers.push(row_values);
          }

          if (column_keys.indexOf(column_set) == -1) {
            column_keys.push(column_set);
            column_headers.push(column_values);
          }

          var key = [row_set, column_set].join(POS_KEY);
          matrix[key] = cell[agg.name];
        }
      }

      for (var i in row_keys) {
        var row_key = row_keys[i];
        var row = [];
        for (var j in column_keys) {
          var column_key = column_keys[j];
          var key = [row_key, column_key].join(POS_KEY);
          row.push(matrix[key] || data.aggregates.map(function(a) { return undefined; }));
        }
        table.push(row);
      }
   
      scope.rows = row_headers;
      scope.columns = column_headers;
      scope.table = table;
    };


    $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
      query(model, state);
    });

    // console.log('crosstab init');
    cubesCtrl.init({
      rows: {label: 'Rows', multiple: true},
      columns: {label: 'Columns', multiple: true},
    });
  }
  };
}]);

;
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

;

ngCubes.directive('cubesPanel', ['$rootScope', function($rootScope) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
    },
    templateUrl: 'angular-cubes-templates/panel.html',
    link: function($scope, $element, attrs, cubesCtrl) {
      $scope.state = {};
      $scope.axes = {};

      var update = function() {
        //$scope.state.page = 0;
        cubesCtrl.setState($scope.state);
      };

      $scope.add = function(axis, ref) {
        if (axis.selected.indexOf(ref) == -1) {
          axis.selected.push(ref);
          $scope.state[axis.name] = axis.selected;
          update();
        }
      };

      $scope.remove = function(axis, ref) {
        var i = axis.selected.indexOf(ref);
        if (i != -1) {
          axis.selected.splice(i, 1);
          $scope.state[axis.name] = axis.selected;
          update();
        }
      };

      var makeOptions = function(model) {
        var options = [];
        for (var di in model.dimensions) {
          var dim = model.dimensions[di];
          for (var li in dim.levels) {
            var lvl = dim.levels[li];
            for (var ai in lvl.attributes) {
              var attr = lvl.attributes[ai];
              attr.dimension = dim;
              attr.type = 'attributes';
              if (attr.name != lvl.label_attribute) {
                attr.sub_label = attr.label;
              }
              attr.label = dim.label;
              options.push(attr);
            }
          }
        }

        for (var ai in model.aggregates) {
          var agg = model.aggregates[ai];
          agg.type = 'aggregates';
          options.push(agg);
        }

        for (var mi in model.measures) {
          var mea = model.measures[mi];
          mea.type = 'measures';
          options.push(mea);
        }

        return options;
      }

      var makeAxes = function(state, model) {
        var axes = [],
            options = makeOptions(model);

        if (!cubesCtrl.queryModel) return [];

        for (var name in cubesCtrl.queryModel) {
          var axis = cubesCtrl.queryModel[name];
          axis.name = name;
          axis.sortId = axis.sortId || 1;
          axis.available = [];
          axis.active = [];

          axis.selected = asArray(state[name]);
          if (!axis.selected.length) {
            if (angular.isFunction(axis.defaults)) {
              axis.selected = axis.defaults(model);
            } else {
              axis.selected = asArray(axis.defaults);
            }
          }

          for (var i in options) {
            var opt = options[i];
            if (axis.selected.indexOf(opt.ref) != -1) {
              axis.active.push(opt);
            } else if (axis.types.indexOf(opt.type) != -1) {
              axis.available.push(opt);
            }
          }

          //console.log(axis);
          axes.push(axis);
        }

        return axes.sort(function(a, b) {
          return a.sortId - b.sortId;
        });
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
        $scope.state = state;
        $scope.axes = makeAxes(state, model);
      });
    }
  };
}]);
;
ngCubes.directive('cubesWorkspace', ['$location', function($location) {
  return {
    restrict: 'EA',
    scope: {
      slicer: '@',
      cube: '@'
    },
    templateUrl: 'angular-cubes-templates/workspace.html',
    link: function(scope, element, attrs) {
      scope.state = {};
      scope.view = $location.search().view || 'facts';

      scope.setView = function(view) {
        var state = $location.search();
        state.view = view;
        $location.search(state);
      };
    }
  };
}]);
;angular.module('ngCubes.templates', ['angular-cubes-templates/crosstab.html', 'angular-cubes-templates/cubes.html', 'angular-cubes-templates/facts.html', 'angular-cubes-templates/pager.html', 'angular-cubes-templates/panel.html', 'angular-cubes-templates/workspace.html']);

angular.module("angular-cubes-templates/crosstab.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/crosstab.html",
    "<div class=\"table-cubes\" ng-show=\"rows.length\">\n" +
    "  <table class=\"table table-bordered table-condensed\">\n" +
    "    <thead>\n" +
    "      <tr ng-repeat=\"x in columns[0]\">\n" +
    "        <th ng-repeat=\"r in rows[0]\"></th>\n" +
    "        <th ng-repeat=\"c in columns\">\n" +
    "          {{c[$parent.$index]}}\n" +
    "        </th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "      <tr ng-repeat=\"row in rows\">\n" +
    "        <th ng-repeat=\"r in row\">\n" +
    "          {{r}}\n" +
    "        </th>\n" +
    "        <td ng-repeat=\"val in table[$index] track by $index\" class=\"numeric\">\n" +
    "          {{val | numeric}}\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"alert alert-info\" ng-hide=\"rows.length\">\n" +
    "  <strong>You have not selected any data.</strong> Please choose a set of rows \n" +
    "  and columns to generate a cross-table.\n" +
    "</div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/cubes.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/cubes.html",
    "<div class=\"cubes-frame\" ng-transclude>\n" +
    "</div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/facts.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/facts.html",
    "<div class=\"table-cubes\" ng-show=\"data\">\n" +
    "  <table class=\"table table-bordered table-condensed\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "        <th ng-repeat=\"c in columns\" ng-if=\"c.span\" colspan=\"{{c.span}}\">\n" +
    "          {{ c.header }}\n" +
    "        </th>\n" +
    "      </tr>\n" +
    "      <tr>\n" +
    "        <th ng-repeat=\"c in columns\">\n" +
    "          <span ng-hide=\"c.hide\">{{ c.label }}</span>\n" +
    "        </th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "      <tr ng-repeat=\"row in data\">\n" +
    "        <td ng-repeat=\"c in columns\" ng-class=\"{'numeric': c.numeric}\">\n" +
    "          <span ng-if=\"c.numeric\">\n" +
    "            {{ row[c.ref] | numeric }}\n" +
    "          </span>\n" +
    "          <span ng-if=\"!c.numeric\">\n" +
    "            {{ row[c.ref] }}\n" +
    "          </span>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "<cubes-pager context=\"pagerCtx\"></cubes-pager>\n" +
    "");
}]);

angular.module("angular-cubes-templates/pager.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/pager.html",
    "<ul ng-show=\"showPager\" class=\"pagination pagination-sm\">\n" +
    "  <li ng-class=\"{'disabled': !hasPrev}\">\n" +
    "    <a class=\"ng-link\" ng-click=\"setPage(current - 1)\">&laquo;</a>\n" +
    "  </li>\n" +
    "  <li ng-repeat=\"page in pages\" ng-class=\"{'active': page.current}\">\n" +
    "    <a class=\"ng-link\" ng-click=\"setPage(page.page)\">{{page.page + 1}}</a>\n" +
    "  </li>\n" +
    "  <li ng-class=\"{'disabled': !hasNext}\">\n" +
    "    <a class=\"ng-link\" ng-click=\"setPage(current + 1)\">&raquo;</a>\n" +
    "  </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("angular-cubes-templates/panel.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/panel.html",
    "<div class=\"panel panel-default\" ng-repeat=\"axis in axes\">\n" +
    "  <div class=\"panel-heading\">\n" +
    "    <strong>{{axis.label}}</strong>\n" +
    "\n" +
    "    <div class=\"btn-group\" dropdown ng-show=\"axis.available.length\">\n" +
    "      &mdash;\n" +
    "      <a dropdown-toggle class=\"ng-link\">{{axis.addLabel}}</a>\n" +
    "      <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "        <li ng-repeat=\"opt in axis.available\">\n" +
    "          <a ng-click=\"add(axis, opt.ref)\">\n" +
    "            <strong>{{opt.label}}</strong>\n" +
    "            {{opt.sub_label}}\n" +
    "          </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <table class=\"table\">\n" +
    "    <tr ng-repeat=\"opt in axis.active\">\n" +
    "      <td colspan=\"2\">\n" +
    "        <span class=\"pull-right\">\n" +
    "          <a ng-click=\"remove(axis, opt.ref)\" class=\"ng-link\">\n" +
    "            <i class=\"fa fa-times\"></i>\n" +
    "          </a>\n" +
    "        </span>\n" +
    "        <strong>{{opt.label}}</strong>\n" +
    "        {{opt.sub_label}}\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/workspace.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/workspace.html",
    "<cubes slicer=\"{{slicer}}\" cube=\"{{cube}}\" state=\"state\">\n" +
    "  <div class=\"row\">\n" +
    "    <div class=\"col-md-9\">\n" +
    "      <div ng-if=\"view == 'crosstab'\">\n" +
    "        <cubes-crosstab></cubes-crosstab>\n" +
    "      </div>\n" +
    "      <div ng-if=\"view == 'facts'\">\n" +
    "        <cubes-facts></cubes-facts>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-3\">\n" +
    "      <div class=\"btn-group spaced\" role=\"group\">\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'facts'}\"\n" +
    "          ng-click=\"setView('facts')\">\n" +
    "          <i class=\"fa fa-table\"></i> Line items\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'crosstab'}\"\n" +
    "          ng-click=\"setView('crosstab')\">\n" +
    "          <i class=\"fa fa-cubes\"></i> Crosstab\n" +
    "        </a>\n" +
    "        <!--a type=\"button\" class=\"btn btn-default disabled\">\n" +
    "          <i class=\"fa fa-bar-chart\"></i>\n" +
    "        </a-->\n" +
    "      </div>\n" +
    "      <cubes-panel></cubes-panel>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</cubes>\n" +
    "");
}]);