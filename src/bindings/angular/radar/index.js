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
            downloader: '=?',
            formatValue: '=?'
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

            var component = new RadarChartComponent();
            var wrapper = element.find('.radar-chart')[0];

            component.formatValue = $scope.formatValue;

            component.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            component.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) &&
                (data.data.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            component.downloader = $scope.downloader;
            component.build($scope.endpoint, $scope.cube,
              $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default RadarChartDirective