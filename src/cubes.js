
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

ngCubes.factory('cubesApi', ['$http', '$q', 'slugifyFilter', function($http, $q, slugifyFilter) {
  var cache = {};

  var getUrl = function(slicer, cube, endpoint) {
    var api = slicer.slice(),
        api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
        api = api + '/cube/' + cube + '/' + endpoint;
    return api;
  };

  var getCached = function(url) {
    if (!angular.isDefined(cache[url])) {
      cache[url] = $http.get(url);
    }
    return cache[url];
  };

  var getModel = function(slicer, cube) {
    return getCached(getUrl(slicer, cube, 'model')).then(function(res) {
      var model = res.data;
      model.refs = {};
      model.refKeys = {};

      for (var i in model.measures) {
        var measure = model.measures[i];
        measure.numeric = true;
        measure.hideLabel = true;
        model.refs[measure.ref] = measure;
      }

      for (var di in model.dimensions) {
        var dim = model.dimensions[di];
        for (var li in dim.levels) {
          var lvl = dim.levels[li];
          for (var ai in lvl.attributes) {
            var attr = lvl.attributes[ai],
                nested = attr.ref.indexOf('.') != -1;
            attr.dimension = dim;
            attr.hideLabel = slugifyFilter(attr.label) == slugifyFilter(dim.label);
            model.refs[attr.ref] = attr;
            model.refKeys[attr.ref] = nested ? dim.name + '.' + lvl.key : attr.ref;
          }
        }
      }
      return model;
    });
  };

  var getDimensionMembers = function(slicer, cube, dimension) {
    return getCached(getUrl(slicer, cube, 'members/' + dimension));
  };

  var flush = function() {
    cache = {};
  };

  return {
    getUrl: getUrl,
    getModel: getModel,
    getDimensionMembers: getDimensionMembers,
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
        cubesApi.getModel($scope.slicer, $scope.cube).then(function(model) {
          $rootScope.$broadcast(self.modelUpdate, model, state);
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

      self.getDimensionMembers = function(dimension) {
        return cubesApi.getDimensionMembers($scope.slicer, $scope.cube, dimension);
      };

      self.getSorts = function() {
        var sorts = [],
            order = state.order || '',
            order = asArray(order.split(','));
        for (var i in order) {
          var parts = order[i].split(':'),
              sort = {};
          sort.ref = parts[0],
          sort.direction = parts[1] || null;
          sorts.push(sort);
        }
        return sorts;
      };

      self.getSort = function(ref) {
        var sorts = self.getSorts();
        for (var i in sorts) {
          if (sorts[i].ref == ref) {
            return sorts[i];  
          } 
        }
        return {ref: ref};
      };

      self.pushSort = function(ref, direction) {
        var sorts = self.getSorts().filter(function(s) {
          return s.ref != ref;
        });
        sorts.unshift({ref: ref, direction: direction});
        state.order = self.mergeSorts(sorts);
        self.setState(state);
      };

      self.removeSorts = function(ref) {
        var sorts = self.getSorts().filter(function(s) {
          return s.ref != ref;
        });
        return self.mergeSorts(sorts);
      };

      self.mergeSorts = function(order) {
        var sorts = [];
        order = asArray(order);
        for (var i in order) {
          var o = order[i];
          if (angular.isObject(o) && o.ref.length) {
            o.direction = o.direction || 'asc';
            o = o.ref + ':' + o.direction;
            sorts.push(o);
          }
        }
        return sorts.join(',');
      };

      self.getQuery = function() {
        var q = {
          drilldown: [],
          aggregates: [],
          cut: state.cut || [],
          page: state.page || 0,
          pagesize: state.pagesize || 30,
          order: self.getSorts()
        };
        return q;
      };

      self.queryParams = function(q) {
        q.order = self.mergeSorts(q.order);

        // join arguments and remove empty arguments
        for (var k in q) {
          if (angular.isArray(q[k])) {
            if (['order', 'fields'].indexOf(k) != -1) {
              q[k] = q[k].join(',');
            } else {
              q[k] = q[k].join('|');
            }
          }
          q[k] = q[k] + '';
          if (!q[k].length) {
            delete q[k];
          }
        }
        return {params: q};
      }
    }]
  };
}]);

