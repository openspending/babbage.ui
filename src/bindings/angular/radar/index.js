import RadarChartComponent from '../../../components/radar'
import RadarChart from "radar-chart-d3";

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

            radarChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default RadarChartDirective