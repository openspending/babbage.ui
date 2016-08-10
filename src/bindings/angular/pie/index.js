import PieChartComponent from '../../../components/pie'

export class PieChartDirective {
  init(angularModule) {
    angularModule.directive('pieChart', [
      function() {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '=',
            downloader: '=?'
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            var pieChart = new PieChartComponent();
            var wrapper = element.find('.pie-chart')[0];

            pieChart.downloader = $scope.downloader;
            pieChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default PieChartDirective