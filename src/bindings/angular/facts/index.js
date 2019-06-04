import FactsComponent from '../../../components/facts'
import * as _ from 'lodash'
import {createI18NMapper} from '../utils'

export class FactsDirective {
  init(angularModule) {
    angularModule.directive('facts', [
      '$timeout', '$q', '$filter', '$sce',
      function($timeout, $q, $filter, $sce) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '=',
            downloader: '=?',
            formatValue: '=?',
            messages: '=?'
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope) {
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
                  let pages = [];
                  let num = $scope.num;
                  let range = 3;
                  let low = $scope.current - range;
                  let high = $scope.current + range;

                  if (low < 0) {
                    low = 0;
                    high = Math.min((2 * range) + 1, num);
                  }
                  if (high > num) {
                    high = num;
                    low = Math.max(1, num - (2 * range) + 1);
                  }

                  for (let page = low; page <= high; page++) {
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

            let component = new FactsComponent();
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
              $scope.status.hasError = !!error;
              $scope.error = !!error && error.message;
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