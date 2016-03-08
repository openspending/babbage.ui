import ChartComponent from '../../../components/pie'

export class ChartDirective {
  init(angularModule) {
    angularModule.directive('chart', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
            state: '='
          },
          templateUrl: 'template.html',
          replace: false,
          link: function($scope, element) {
            var chart = new ChartComponent();
            var resizeEvent = chart.refresh.bind(chart);
            var wrapper = element.find('.pie-chart')[0];

            chart.build($scope.type, $scope.endpoint, $scope.cube, $scope.state, wrapper);
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

export default ChartDirective