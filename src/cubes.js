
var ngCubes = angular.module('ngCubes', ['ngCubes.templates']);

var makeSignal = function(name) {
  return 'cubes_' + Math.random().toString(36).replace(/[^a-z]+/g, '');
};

ngCubes.directive('cubes', ['$http', '$rootScope', function($http, $rootScope) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      slicer: '@',
      cube: '@',
      state: '='
    },
    templateUrl: 'angular-cubes-templates/cubes.html',
    controller: function($scope) {
      var self = this,
          state = $scope.state || {},
          api = $scope.slicer.slice(),
          api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
          api = api + '/cube/' + $scope.cube;

      self.dataUpdate = makeSignal();
      self.modelUpdate = makeSignal();

      self.reset = function() {
        $http.get(api + '/model').then(function(res) {
          $rootScope.$broadcast(self.modelUpdate, res.data);
        });
        self.update({});
      };

      self.getQuery = function() {
        return state.query;
      };

      self.update = function(newQuery) {
        state.query = newQuery;
        var reqQuery = angular.copy(newQuery);
        $http.get(api + '/aggregate').then(function(res) {
          $rootScope.$broadcast(self.dataUpdate, res.data, reqQuery);
        });
      };
    }
  };
}]);

ngCubes.directive('cubesTable', ['$rootScope', function($rootScope) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
      drilldown: '='
    },
    templateUrl: 'angular-cubes-templates/cubes-table.html',
    link: function(scope, element, attrs, cubesCtrl) {
      scope.model = {};
      scope.query = {};
      scope.data = {};

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
        scope.model = model;
        console.log(model);
      });

      $rootScope.$on(cubesCtrl.dataUpdate, function(event, data, query) {
        scope.query = query;
        scope.data = data;
      });

      cubesCtrl.reset();
    }
  };
}]);

