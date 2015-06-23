
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

