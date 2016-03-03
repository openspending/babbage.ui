import TreeMapComponent from '../../components/treemap'

class PieChartDirective {
  init(angularModule) {
    angularModule.directive('treeMap', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '='
          },
          template: 'template.html',
          replace: false,
          link: function($scope, element) {
            var resizeEvent = TreeMapComponent.refresh().bind(TreeMapComponent);
            var wrapper = element.find('.treemap-chart')[0];

            TreeMapComponent.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
            $window.addEventListener('resize', resizeEvent);
            $scope.$on('$destroy', function() {
              $window.removeEventListener('resize', resizeEvent);
            });
          }
        }
      }
    ])
  }
}

export default PieChartDirective