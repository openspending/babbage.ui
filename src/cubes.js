
var ngCubes = angular.module('ngCubes', ['ngCubes.templates']);

var makeSignal = function(name) {
  return 'cubes_' + Math.random().toString(36).replace(/[^a-z]+/g, '');
};

ngCubes.filter('numeric', function() {
  return function(val) {
    return numeral(val).format('0,0');
  };
})

ngCubes.directive('cubes', ['$http', '$rootScope', function($http, $rootScope) {
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
    controller: function($scope) {
      var self = this,
          state = $scope.state || {},
          queryProcessors = [],
          api = $scope.slicer.slice(),
          api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
          api = api + '/cube/' + $scope.cube;

      self.dataUpdate = makeSignal();
      self.stateUpdate = makeSignal();
      self.modelUpdate = makeSignal();
      self.queryModel = {};

      self.init = function(queryModel) {
        self.queryModel = queryModel;
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
        state = s;
        $rootScope.$broadcast(self.stateUpdate, state);
        if ($scope.changeState) {
          $scope.changeState(state);
        }
      };

      self.registerQueryProcessor = function(f) {
        queryProcessors.push(f);
      };

      self.getQuery = function() {
        var q = {
          drilldown: [],
          aggregates: [],
          cut: [],
          page: 0,
          pagesize: 20,
          order: []
        };
        for (var i in queryProcessors) {
          var f = queryProcessors[i];
          q = f(q, state);
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
        var q = self.getQuery();
        $http.get(api + '/aggregate', {params: q}).then(function(res) {
          $rootScope.$broadcast(self.dataUpdate, res.data, q, state);
        });
      };
    }
  };
}]);

