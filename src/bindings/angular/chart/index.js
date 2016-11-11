import ChartComponent from '../../../components/chart'
import _ from 'lodash';

export class ChartDirective {
  init(angularModule) {
    angularModule.directive('chart', [
      function() {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
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

            var component = new ChartComponent();
            var wrapper = element.find('.chart-babbage')[0];

            component.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            component.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) &&
                (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            component.downloader = $scope.downloader;
            component.build($scope.type, $scope.endpoint,
              $scope.cube, $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default ChartDirective