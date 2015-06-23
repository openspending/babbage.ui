
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

ngCubes.service('cubesModel', ['$http', function($http) {
  return {};
});

ngCubes.directive('cubes', ['$http', '$rootScope', '$location', function($http, $rootScope, $location) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      slicer: '@',
      cube: '@',
      state: '=',
      changeState: '&'
    },
    templateUrl: 'angular-cubes-templates/cubes.html',
    controller: ['$scope', function($scope) {
      var self = this,
          state = $scope.state || {},
          state = angular.extend({}, state, $location.search()),
          api = $scope.slicer.slice(),
          api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
          api = api + '/cube/' + $scope.cube;

      self.dataUpdate = makeSignal();
      // self.stateUpdate = makeSignal();
      self.modelUpdate = makeSignal();
      self.queryModel = {};
      self.queryProcessor = null,
      
      self.init = function(queryModel, queryProcessor) {
        self.queryModel = queryModel;
        self.queryProcessor = queryProcessor;
        $http.get(api + '/model').then(function(res) {
          $rootScope.$broadcast(self.modelUpdate, res.data);
          $rootScope.$broadcast(self.stateUpdate, state);
          self.query();
        });
      };

      self.getState = function() {
        return state;
      };

      self.setState = function(s) {
        $location.search(s);
      };

      self.getQuery = function() {
        var q = {
          drilldown: [],
          aggregates: [],
          cut: [],
          page: 0,
          pagesize: 20,
          order: [],
          endpoint: 'aggregate'
        };

        if (self.queryProcessor) {
          q = self.queryProcessor(q, state);
        }

        // join arguments and remove empty arguments
        for (var k in q) {
          if (angular.isArray(q[k])) {
            q[k] = q[k].join('|');
          }
          q[k] = q[k] + '';
          if (!q[k].length) {
            delete q[k];
          }
        }
        return q;
      };
 
      self.query = function() {
        var q = self.getQuery(),
            endpoint = q.endpoint;
        delete q['endpoint'];
        $http.get(api + '/' + endpoint, {params: q}).then(function(res) {
          $rootScope.$broadcast(self.dataUpdate, res.data, q, state);
        });
      };

    }]
  };
}]);

;var VAL_KEY = '@@@@',
    POS_KEY = '!@!@'

ngCubes.directive('cubesCrosstab', ['$rootScope', function($rootScope) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/crosstab.html',
  link: function(scope, element, attrs, cubesCtrl) {
    var model = null, query = {};
    scope.columns = [];
    scope.rows = [];
    scope.table = [];

    var queryProcessor = function(q, state) {
      state.rows = asArray(state.rows);
      state.columns = asArray(state.columns);

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
      q.order = q.order.join(',');
      return q;
    };

    var unsubModel = $rootScope.$on(cubesCtrl.modelUpdate, function(event, m) {
      model = m;
    });

    var unsubData = $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q, state) {
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
    });

    // console.log('crosstab init');
    cubesCtrl.init({
      rows: {label: 'Rows', multiple: true},
      columns: {label: 'Columns', multiple: true},
    }, queryProcessor);

    scope.$on('$destroy', function() {
      unsubModel();
      unsubData();
    });
  }
  };
}]);

;
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

    var queryProcessor = function(q, state) {
      q.endpoint = 'facts';
      q.page = scope.page;
      return q;
    };

    var unsubModel = $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
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
    });

    var unsubData = $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, q, state) {
      // console.log('facts received data');
      scope.data = data;
      if (!data.length) return;

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
    });

    // console.log('facts init');
    cubesCtrl.init({
      columns: {label: 'Columns', multiple: true},
    }, queryProcessor);

    scope.$on('$destroy', function() {
      unsubModel();
      unsubData();
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
      $scope.model = null;
      $scope.state = {};

      var attributes = {}, usedAttributes = [];

      var update = function() {
        cubesCtrl.setState($scope.state);
        cubesCtrl.query();
      };

      $scope.getSelectedAggregates = function() {
        var aggregates = [];
        var src = $scope.model ?  $scope.model.aggregates || [] : [];
        for (var i in src) {
          if ($scope.state.aggregates.indexOf(src[i].name) != -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.getAvailableAggregates = function() {
        var aggregates = [];
        var src = $scope.model ? $scope.model.aggregates || [] : [];
        for (var i in src) {
          if ($scope.state.aggregates.indexOf(src[i].name) == -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.addAggregate = function(agg) {
        $scope.state.aggregates.push(agg.name);
        update();
      };

      $scope.removeAggregate = function(agg) {
        var i = $scope.state.aggregates.indexOf(agg.name);
        if (i != -1) {
          $scope.state.aggregates.splice(i, 1);
          update();
        }
      };

      $scope.getAvailableAttributes = function() {
        var available = {};
        for (var ref in attributes) {
          if (usedAttributes.indexOf(ref) == -1) {
            available[ref] = attributes[ref];
          }
        }
        return available;
      };

      $scope.getSelectedAttributes = function(axis) {
        var selected = {};
        for (var ref in attributes) {
          if ($scope.state[axis].indexOf(ref) != -1) {
            selected[ref] = attributes[ref];
          }
        }
        return selected;
      };

      $scope.hasAvailableAttributes = function() {
        for (var i in $scope.getAvailableAttributes()) {
          return true;
        }
        return false;
      };

      $scope.addAttribute = function(axis, ref) {
        $scope.state[axis].push(ref);
        update();
      };

      $scope.removeAttribute = function(axis, ref) {
        var i = $scope.state[axis].indexOf(ref);
        if (i != -1) {
          $scope.state[axis].splice(i, 1);
          update();
        }
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
        $scope.model = model;
        $scope.queryModel = cubesCtrl.queryModel;

        attributes = {};
        for (var di in model.dimensions) {
          var dim = model.dimensions[di];
          for (var li in dim.levels) {
            var lvl = dim.levels[li];
            for (var ai in lvl.attributes) {
              var attr = lvl.attributes[ai];
              attr.dimension = dim;
              attributes[attr.ref] = attr;
            }
          }
        }

      });

      $rootScope.$on(cubesCtrl.stateUpdate, function(event, state) {
        // get list of currently active aggregates.
        state.aggregates = asArray(state.aggregates);
        if ($scope.model && !state.aggregates.length) {
          for (var j in $scope.model.aggregates) {
            state.aggregates.push($scope.model.aggregates[j].name); 
          }
        }

        // get list of currently used attributes
        usedAttributes = [];
        for (var axis in $scope.queryModel) {
          state[axis] = asArray(state[axis]);
          for (var i in state[axis]) {
            usedAttributes.push(state[axis][i]);
          }
        }

        $scope.state = state;
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

      var loadState = function() {
        scope.state = $location.search();
      };

      scope.setView = function(view) {
        var state = $location.search();
        state.view = view;
        $location.search(state);
      };

      scope.updateState = function(state) {
        //$location.search(state);
      };

      loadState();
    }
  };
}]);
;angular.module('ngCubes.templates', ['angular-cubes-templates/crosstab.html', 'angular-cubes-templates/cubes.html', 'angular-cubes-templates/facts.html', 'angular-cubes-templates/panel.html', 'angular-cubes-templates/workspace.html']);

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
    "");
}]);

angular.module("angular-cubes-templates/panel.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/panel.html",
    "<div class=\"panel panel-default\" ng-repeat=\"(axis, spec) in queryModel\">\n" +
    "  <div class=\"panel-heading\">\n" +
    "    <strong>{{spec.label}}</strong>\n" +
    "\n" +
    "    <div class=\"btn-group\" dropdown ng-show=\"hasAvailableAttributes()\">\n" +
    "      &mdash;\n" +
    "      <a dropdown-toggle>Add {{spec.label.toLowerCase()}}</a>\n" +
    "      <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "        <li ng-repeat=\"(ref, a) in getAvailableAttributes()\">\n" +
    "          <a ng-click=\"addAttribute(axis, ref)\">\n" +
    "            <strong>{{a.dimension.label}}</strong> {{a.label}}\n" +
    "          </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <table class=\"table\">\n" +
    "    <tr ng-repeat=\"(ref, a) in getSelectedAttributes(axis)\">\n" +
    "      <td colspan=\"2\">\n" +
    "        <span class=\"pull-right\">\n" +
    "          <a ng-click=\"removeAttribute(axis, ref)\">\n" +
    "            <i class=\"fa fa-times\"></i>\n" +
    "          </a>\n" +
    "        </span>\n" +
    "        <strong>{{a.dimension.label}}</strong> {{a.label}}\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "<div class=\"panel panel-default\" ng-if=\"model\">\n" +
    "  <div class=\"panel-heading\">\n" +
    "    <strong>Values</strong>\n" +
    "\n" +
    "    <div class=\"btn-group\" dropdown ng-show=\"getAvailableAggregates().length\">\n" +
    "      &mdash;\n" +
    "      <a dropdown-toggle>Add value</a>\n" +
    "      <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "        <li ng-repeat=\"a in getAvailableAggregates()\">\n" +
    "          <a ng-click=\"addAggregate(a)\">{{a.label}}</a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <table class=\"table\">\n" +
    "    <tr ng-repeat=\"a in getSelectedAggregates()\">\n" +
    "      <td colspan=\"2\">\n" +
    "        <span class=\"pull-right\">\n" +
    "          <a ng-click=\"removeAggregate(a)\">\n" +
    "            <i class=\"fa fa-times\"></i>\n" +
    "          </a>\n" +
    "        </span>\n" +
    "\n" +
    "        {{a.label}}\n" +
    "\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/workspace.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/workspace.html",
    "<cubes slicer=\"{{slicer}}\" cube=\"{{cube}}\" state=\"state\" change-state=\"updateState(state)\">\n" +
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
    "          tooltip-placement=\"bottom\" tooltip=\"Table\"\n" +
    "          ng-class=\"{'active': state.view == 'facts'}\"\n" +
    "          ng-click=\"setView('facts')\">\n" +
    "          <i class=\"fa fa-table\"></i> Line items\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          tooltip-placement=\"bottom\" tooltip=\"Crosstab\"\n" +
    "          ng-class=\"{'active': state.view == 'crosstab'}\"\n" +
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
