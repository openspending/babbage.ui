
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
          state = $scope.state || {q: {}},
          api = $scope.slicer.slice(),
          api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
          api = api + '/cube/' + $scope.cube;

      self.dataUpdate = makeSignal();
      self.modelUpdate = makeSignal();

      self.init = function() {
        $http.get(api + '/model').then(function(res) {
          $rootScope.$broadcast(self.modelUpdate, res.data);
        });
      };

      self.getQuery = function() {
        return state.q;
      };

      self.notifyState = function(state) {
        if ($scope.changeState) {
          $scope.changeState(state);
        }
      };

      self.updateQuery = function(newQuery) {
        var req = angular.copy(newQuery);
        state.q = newQuery;
        state.q.page = 0;
        state.q.pagesize = 20;
        self.notifyState(state);
        $http.get(api + '/aggregate', {params: state.q}).then(function(res) {
          $rootScope.$broadcast(self.dataUpdate, res.data, req);
        });
      };
    }
  };
}]);

