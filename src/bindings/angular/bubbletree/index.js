import BubbleTreeComponent from '../../../components/bubbletree'

export class BubbleTreeDirective {
  init(angularModule) {
    angularModule.directive('bubbletree', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
            state: '='
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            var bubbleTree = new BubbleTreeComponent();
            var wrapper = element.find('.bubbletree')[0];

            bubbleTree.build($scope.endpoint, $scope.cube, $scope.state, wrapper);

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default BubbleTreeDirective