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
            var wrapper = element.find('.treemap-chart')[0];

            treeMap.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
            treeMap.on('click', (treeMapComponent, item) => {
              $scope.$emit('treemap-click', treeMapComponent, item);
            });

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;

            // TreeMap-Table:
            var itemFilter = (item => item._percentage >= 0.02);
            $scope.treeMapTable = {
              show: false,
              sortAttr: '_percentage',
              sortDesc: true,
              data: null,
              invertSorting: function(){ this.sortDesc = !this.sortDesc; },
              existSmallItems: false,
              itemFilter: itemFilter,
              filterActive: true,
              activateFilter: function(enable) {
                if (enable) {
                  this.filterActive = true;
                  this.itemFilter = itemFilter;
                } else {
                  this.filterActive = false;
                  this.itemFilter = (item => true);
                }
              }
            };
            treeMap.on('textOverflow', treeMapComponent => {
              $scope.treeMapTable.show = true;
              $scope.$apply();
            });
            treeMap.on('dataLoaded', (treeMapComponent, root) => {
              $scope.treeMapTable.data = root;
              $scope.treeMapTable.existSmallItems = !root.children.every(item => item._percentage >= 0.02);
              $scope.$apply();
            });

          }
        }
      }
    ])
  }
}

export default TreemapDirective