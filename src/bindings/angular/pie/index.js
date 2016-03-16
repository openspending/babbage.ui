import PieChartComponent from '../../../components/pie'

export class PieChartDirective {
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
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            var pieChart = new PieChartComponent();
            var resizeEvent = pieChart.refresh.bind(pieChart);
            var wrapper = element.find('.pie-chart')[0];

            pieChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
            $window.addEventListener('resize', resizeEvent);
            $scope.$on('$destroy', function() {
              $window.removeEventListener('resize', resizeEvent);
            });

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default PieChartDirective