import SanKeyChartComponent from '../../../components/sankey'

export class SanKeyChartDirective {
  init(angularModule) {
    angularModule.directive('sanKeyChart', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '='
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            var sanKeyChart = new SanKeyChartComponent();
            var resizeEvent = sanKeyChart.refresh.bind(sanKeyChart);
            var wrapper = element.find('.sankey-chart')[0];

            sanKeyChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
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

export default SanKeyChartDirective