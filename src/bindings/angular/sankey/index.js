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
            var wrapper = element.find('.sankey-chart')[0];

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;

            sanKeyChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);

            sanKeyChart.on('click', (sankeyComponent, item) => {
              $scope.$emit('sankey-click', sankeyComponent, item);
            });
          }
        }
      }
    ])
  }
}

export default SanKeyChartDirective