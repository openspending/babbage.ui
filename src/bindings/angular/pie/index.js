import PieChartComponent from '../../components/pie'

class PieChartDirective {
  init(angularModule) {
    angularModule.directive('pieChart', [
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
            var resizeEvent = PieChartComponent.refresh().bind(PieChartComponent);
            var wrapper = element.find('.pie-chart')[0];

            PieChartComponent.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
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