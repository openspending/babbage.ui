import TreeMapComponent from '../../../components/treemap'
import _ from 'lodash'

class TreemapDirective {
  init(angularModule) {
    angularModule.directive('treeMap', [
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

            var treeMap = new TreeMapComponent();
            var wrapper = element.find('.treemap-chart')[0];

            // TreeMap-Table:
            $scope.treeMapTable = {
              show: true,
              sortAttr: '_percentage',
              sortDesc: true,
              data: null,
              invertSorting: function(){ this.sortDesc = !this.sortDesc; },
              toggle: () => {
                let treeMapTable = $scope.treeMapTable;
                let treeMapSection = $(".treemap-table");
                treeMapTable.show ? treeMapSection.fadeOut() : treeMapSection.fadeIn();
                treeMapTable.show = !treeMapTable.show;
              },
              selectTableRow: (item) => {
                $scope.$emit('treemap-click', treeMap, item);
                $scope.$applyAsync();
              }
            };
            treeMap.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            treeMap.on('loaded', (treeMapComponent, data, root) => {
              $scope.treeMapTable.data = root;
              $scope.$applyAsync();
            });
            treeMap.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) && (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            treeMap.on('click', (treeMapComponent, item) => {
              $scope.$emit('treemap-click', treeMapComponent, item);
              $scope.$applyAsync();
            });
            treeMap.downloader = $scope.downloader;
            treeMap.build($scope.endpoint, $scope.cube, $scope.state, wrapper);
          }
        }
      }
    ])
  }
}

export default TreemapDirective