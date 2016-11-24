import BubbleTreeComponent from '../../../components/bubbletree'
import _ from 'lodash'

export class BubbleTreeDirective {
  init(angularModule) {
    angularModule.directive('bubbletree', [
      function() {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
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

            var component = new BubbleTreeComponent();
            var wrapper = element.find('.bubbletree')[0];

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
            });
            component.on('click', (component, item) => {
              // item.key => drilldown value
              $scope.$emit('babbage-ui.click', component, item);
              // Backward compatibility; should be removed on major version change
              $scope.$emit('bubbletree-click', component, item);
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

export default BubbleTreeDirective