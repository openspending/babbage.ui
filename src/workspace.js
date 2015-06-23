
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
