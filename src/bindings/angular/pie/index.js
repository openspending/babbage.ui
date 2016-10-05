import PieChartComponent from '../../../components/pie'
import _ from 'lodash';

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
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              isCutOff: false,
              cutoff: 0
            };

            var pieChart = new PieChartComponent();
            var wrapper = element.find('.pie-chart')[0];

            pieChart.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            pieChart.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) && (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            pieChart.downloader = $scope.downloader;
            pieChart.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default PieChartDirective