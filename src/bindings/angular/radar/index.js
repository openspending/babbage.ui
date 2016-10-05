import RadarChartComponent from '../../../components/radar'
import _ from 'lodash'

export class RadarChartDirective {
  init(angularModule) {
    angularModule.directive('radarChart', [
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
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              isCutOff: false,
              cutoff: 0
            };

            var radarChart = new RadarChartComponent();
            var wrapper = element.find('.radar-chart')[0];

            radarChart.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            radarChart.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) && (data.data.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            radarChart.downloader = $scope.downloader;
            radarChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default RadarChartDirective