
var ngCubes = angular.module('ngCubes', ['ngCubes.templates']);

ngCubes.directive('cubes', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      slicer: '=',
      cube: '='
    },
    templateUrl: 'angular-cubes-templates/cubes.html',
    controller: function($scope) {
      $scope.query = {'huhu': 'haha'};

      console.log($scope.slicer);

      this.getQuery = function() {
        return $scope.query;
      };
    }
  };
}]);

ngCubes.directive('cubesTable', ['$http', function($http) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
      drilldown: '='
    },
    templateUrl: 'angular-cubes-templates/cubes-table.html',
    link: function(scope, element, attrs, cubesCtrl) {
      console.log(cubesCtrl.getQuery());
    }
  };
}]);

