import FactsComponent from '../../../components/facts'
import _ from 'lodash';

export class FactsDirective {
  init(angularModule) {
    angularModule.directive('facts', [
      '$timeout', '$q', '$filter',
      function($timeout, $q, $filter) {
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
          link: function($scope) {
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              isCutOff: false,
              cutoff: 0
            };

            $scope.valueFormatter = $filter('number');
            $scope.$watch('formatValue', function() {
              $scope.valueFormatter = _.isFunction($scope.formatValue) ?
                $scope.formatValue : $filter('number');
            });

            function update(component) {
              $q((resolve, reject) => {
                component.downloader = $scope.downloader;
                $scope.$emit('babbage-ui.initialize', component);
                component.getTableData($scope.endpoint, $scope.cube, $scope.state)
                  .then(resolve)
                  .catch(reject)
              })
                .then((tableData) => {
                  $scope.tableData = tableData;
                  $scope.current = parseInt(tableData.info.page - 1, 10) || 0;
                  $scope.num = Math.ceil(tableData.info.total /
                    tableData.info.pageSize);
                  var pages = [];
                  var num = $scope.num;
                  var range = 3;
                  var low = $scope.current - range;
                  var high = $scope.current + range;

                  if (low < 0) {
                    low = 0;
                    high = Math.min((2 * range) + 1, num);
                  }
                  if (high > num) {
                    high = num;
                    low = Math.max(1, num - (2 * range) + 1);
                  }

                  for (var page = low; page <= high; page++) {
                    pages.push({
                      page: page,
                      current: page == $scope.current,
                    });
                  }
                  $scope.hasPrev = $scope.current > 0;
                  $scope.hasNext = $scope.current < num;
                  $scope.showPager = num > 1;
                  $scope.pages = pages;
                });
            }

            var component = new FactsComponent();
            component.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            component.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) &&
                (data.columns.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
              $scope.$emit('babbage-ui.ready', component, data, error);
            });

            $scope.getSort = function(field) {
              return _.find($scope.state.order, {key: field});
            };

            $scope.setSort = function(key, direction) {
              $scope.state.order = [{key: key, direction: direction}];
              update(component);
            };

            $scope.setPage = function(page) {
              if (page >= 0 && page <= $scope.num) {
                $scope.state.page = page + 1;
                update(component);
              }
            };

            update(component);

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

export default FactsDirective