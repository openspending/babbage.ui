
ngCubes.directive('cubesWorkspace', ['$location', function($location) {
  return {
    restrict: 'EA',
    scope: {
      slicer: '@',
      cube: '@'
    },
    templateUrl: 'angular-cubes-templates/workspace.html',
    link: function(scope, element, attrs, cubesCtrl) {
      scope.state = {};

      var loadState = function() {
        scope.state = $location.search();
      };

      scope.updateState = function(state) {
        $location.search(state);
      };

      loadState();
    }
  };
}]);
