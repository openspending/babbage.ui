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

            var bubbleTree = new BubbleTreeComponent();
            var wrapper = element.find('.bubbletree')[0];

            bubbleTree.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            bubbleTree.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) &&
                (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            bubbleTree.on('click', (component, item) => {
              // item.key => drilldown value
              $scope.$emit('babbage-ui.click', component, item);
              // Backward compatibility; should be removed on major version change
              $scope.$emit('bubbletree-click', component, item);
              $scope.$applyAsync();
            });

            bubbleTree.downloader = $scope.downloader;
            bubbleTree.build($scope.endpoint, $scope.cube,
              $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default BubbleTreeDirective