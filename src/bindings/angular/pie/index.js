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

            var component = new PieChartComponent();
            var wrapper = element.find('.pie-chart')[0];

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
                (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
              $scope.$emit('babbage-ui.ready', component, data, error);
            });
            component.on('click', function(component, item) {
              // item.id => drilldown value
              $scope.$emit('babbage-ui.click', component, item);
              $scope.$applyAsync();
            });

            component.downloader = $scope.downloader;
            $scope.$emit('babbage-ui.initialize', component);
            component.build($scope.endpoint, $scope.cube,
              $scope.state, wrapper);

            $scope.$emit('babbage-ui.create');
            $scope.$on('$destroy', function() {
              $scope.$emit('babbage-ui.destroy');
            });
          }
        }
      }
    ])
  }
}

export default PieChartDirective