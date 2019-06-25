import TableComponent from '../../../components/table'
import * as _ from 'lodash'
import {createI18NMapper} from '../utils'

export class BabbageTableDirective {
  init(angularModule) {
    angularModule.directive('babbageTable', [
      '$q', '$filter', '$sce',
      function($q, $filter, $sce) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '=',
            model: '=',
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

            let component = new TableComponent();

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
              $scope.status.hasError = !!error;
              $scope.error = !!error && error.message;
              $scope.$applyAsync();
              $scope.$emit('babbage-ui.ready', component, data, error);
            });

            $q((resolve, reject) => {
              component.downloader = $scope.downloader;
              $scope.$emit('babbage-ui.initialize', component);
              component.getTableData($scope.endpoint, $scope.cube, $scope.state, $scope.model)
                .then(resolve)
                .catch(reject)
            })
              .then((tableData) => {
                $scope.tableData = tableData;
              });

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

export default BabbageTableDirective
