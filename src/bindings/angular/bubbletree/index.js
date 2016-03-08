import BubbleTreeComponent from '../../../components/pie'

export class BubbleTreeDirective {
  init(angularModule) {
    angularModule.directive('chart', [
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
          templateUrl: 'template.html',
          replace: false,
          link: function($scope, element) {
            var bubbleTree = new BubbleTreeComponent();
            var resizeEvent = bubbleTree.refresh.bind(bubbleTree);
            var wrapper = element.find('.pie-chart')[0];

            bubbleTree.build($scope.type, $scope.endpoint, $scope.cube, $scope.state, wrapper);
            $window.addEventListener('resize', resizeEvent);
            $scope.$on('$destroy', function() {
              $window.removeEventListener('resize', resizeEvent);
            });
          }
        }
      }
    ])
  }
}

export default BubbleTreeDirective