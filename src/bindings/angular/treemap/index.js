import TreeMapComponent from '../../../components/treemap'
import * as _ from 'lodash'
import {createI18NMapper} from '../utils';

class TreemapDirective {
  init(angularModule) {
    angularModule.directive('treeMap', [
      '$sce',
      function($sce) {
        return {
          restrict: 'EA',
          scope: {
            colorSchema: '@',
            endpoint: '@',
            cube: '@',
            state: '=',
            model: '=',
            downloader: '=?',
            formatValue: '=?',
            messages: '=?',
            colorScale: '&',
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              hasError: false,
              isCutOff: false,
              cutoff: 0
            };

            $scope.i18n = createI18NMapper($scope.messages);
            $scope.$watch('messages', function(newValue, oldValue) {
              if (newValue !== oldValue) {
                $scope.i18n = createI18NMapper($scope.messages);
              }
            }, true);
            $scope.trustAsHtml = function(value) {
              return $sce.trustAsHtml(value);
            };

            let component = new TreeMapComponent();
            let wrapper = element.find('.treemap-chart')[0];

            component.formatValue = $scope.formatValue;

            // TreeMap-Table:
            $scope.treeMapTable = {
              show: true,
              sortAttr: 'percentage',
              sortDesc: true,
              data: null,
              invertSorting: function(){ this.sortDesc = !this.sortDesc; },
              toggle: () => {
                let treeMapTable = $scope.treeMapTable;
                let treeMapSection = $('.treemap-table');
                treeMapTable.show ? treeMapSection.fadeOut() : treeMapSection.fadeIn();
                treeMapTable.show = !treeMapTable.show;
              },
              selectTableRow: (item) => {
                $scope.$emit('babbage-ui.click', component, item);
                // Backward compatibility; should be removed on major version change
                $scope.$emit('treemap-click', component, item);
                $scope.$applyAsync();
              }
            };
            component.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            component.on('loaded', (treeMapComponent, data, root) => {
              $scope.treeMapTable.data = root;
              $scope.$applyAsync();
            });
            component.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) && (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.status.hasError = !!error;
              $scope.error = !!error && error.message;
              $scope.$applyAsync();
              $scope.$emit('babbage-ui.ready', component, data, error);
            });
            component.on('click', (component, item) => {
              $scope.$emit('babbage-ui.click', component, item);
              // Backward compatibility; should be removed on major version change
              $scope.$emit('treemap-click', component, item);
              $scope.$applyAsync();
            });
            component.downloader = $scope.downloader;
            $scope.$emit('babbage-ui.initialize', component);

            component.build(
              $scope.endpoint,
              $scope.cube,
              $scope.state,
              wrapper,
              $scope.colorScale(),
              $scope.model
            );

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

export default TreemapDirective
