
ngCubes.directive('cubesWorkspace', ['$location', function($location) {
  return {
    restrict: 'EA',
    scope: {
      slicer: '@',
      cube: '@'
    },
    templateUrl: 'angular-cubes-templates/workspace.html',
    link: function(scope, element, attrs) {
      var getActiveVisualization = function() {
        var active;
        scope.visualizations.some(function(v) {
          if(v.view == scope.view) {
            active = v;
            return true;
          }
        });
        return active;
      }
      scope.state = {};
      scope.visualizationHead = {
        name: 'Visulization',
        icon: 'fa-eye',
        visible: false
      }
      scope.visualizations = [
        {
          name: 'Treemap',
          icon: 'fa-th-large',
          view: 'treemap',
          visible: true
        },
        {
          name: 'Barchart',
          icon: 'fa-bar-chart',
          view: 'barchart',
          visible: true
        }
      ];
      scope.view = $location.search().view || 'facts';
      scope.activeVisualization = getActiveVisualization() || scope.visualizationHead;

      scope.$watch('view', function(view) {
        if(view) {
          scope.activeVisualization = getActiveVisualization() || scope.visualizationHead;
        }
      });
      scope.setView = function(view) {
        var state = $location.search();
        state.view = view;
        $location.search(state);
      };
      scope.status = {
        isopen: false
      };
      scope.toggleDropdown = function($event, view) {
        $event.preventDefault();
        $event.stopPropagation();
        scope.status.isopen = !scope.status.isopen;
        scope.setView(view);
      };
    }
  };
}]);
