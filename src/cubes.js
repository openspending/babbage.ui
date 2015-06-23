
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
      self.stateUpdate = makeSignal();
      self.modelUpdate = makeSignal();
      self.queryModel = {};
      self.queryProcessor = null,
      
      self.init = function(queryModel, queryProcessor) {
        self.queryModel = queryModel;
        self.queryProcessor = queryProcessor;
        cubesApi.getModel($scope.slicer, $scope.cube).then(function(res) {
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

      self.getApiUrl = function(endpoint) {
        return cubesApi.getUrl($scope.slicer, $scope.cube, endpoint);
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
        $http.get(self.getApiUrl(endpoint), {params: q}).then(function(res) {
          $rootScope.$broadcast(self.dataUpdate, res.data, q, state);
        });
      };

    }]
  };
}]);

