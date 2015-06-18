
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
      //scope.view = null;

      var loadState = function() {
        scope.state = $location.search();
        if (!scope.state.view) {
          scope.state.view = 'facts';
          scope.updateState(scope.state);
        }
      };

      var getCubesCtrl = function() {
        var els = element[0].querySelectorAll('cubes');
        for (var i in els) {
          var el = els[i];
          return angular.element(el).controller('cubes');
        }
      };

      scope.setView = function(view) {
        var ctrl = getCubesCtrl(),
            state = ctrl.getState();
        state.view = view;
        ctrl.setState(state);
      };

      scope.updateState = function(state) {
        scope.state = state;
        $location.search(state);
      };

      loadState();
    }
  };
}]);
