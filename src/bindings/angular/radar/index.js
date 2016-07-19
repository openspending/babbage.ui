import RadarChartComponent from '../../../components/radar'

export class RadarChartDirective {
  init(angularModule) {
    angularModule.directive('radarChart', [
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
            var radarChart = new RadarChartComponent();
            var wrapper = element.find('.radar-chart')[0];
            radarChart.getPivotData($scope.endpoint, $scope.cube, $scope.state).then((result) => {

              radarChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper, result);
            });

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default RadarChartDirective