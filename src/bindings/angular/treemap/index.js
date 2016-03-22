import TreeMapComponent from '../../../components/treemap'

class TreemapDirective {
  init(angularModule) {
    angularModule.directive('treeMap', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '='
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            var treeMap = new TreeMapComponent();
            var resizeEvent = treeMap.refresh.bind(treeMap);
            var wrapper = element.find('.treemap-chart')[0];

            treeMap.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
            treeMap.on('click', (treeMapComponent, item) => {
              $scope.$emit('treemap-click', treeMapComponent, item);
            });

            $window.addEventListener('resize', resizeEvent);
            $scope.$on('$destroy', function() {
              $window.removeEventListener('resize', resizeEvent);
            });

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default TreemapDirective