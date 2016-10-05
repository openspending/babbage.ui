import SanKeyChartComponent from '../../../components/sankey'
import _ from 'lodash';

export class SanKeyChartDirective {
  init(angularModule) {
    angularModule.directive('sanKeyChart', [
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

            var sanKeyChart = new SanKeyChartComponent();
            var wrapper = element.find('.sankey-chart')[0];

            sanKeyChart.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            sanKeyChart.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) && (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            sanKeyChart.on('click', (sankeyComponent, item) => {
              $scope.$emit('sankey-click', sankeyComponent, item);
              $scope.$applyAsync();
            });

            sanKeyChart.downloader = $scope.downloader;
            sanKeyChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default SanKeyChartDirective