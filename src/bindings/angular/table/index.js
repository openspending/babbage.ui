import TableComponent from '../../../components/table'
import _ from 'lodash'

export class BabbageTableDirective {
  init(angularModule) {
    angularModule.directive('babbageTable', [
      '$q', '$filter',
      function($q, $filter) {
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

            var component = new TableComponent();

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
              $scope.$applyAsync();
            });

            $q((resolve, reject) => {
              component.downloader = $scope.downloader;
              component.getTableData($scope.endpoint, $scope.cube, $scope.state)
                .then(resolve)
                .catch(reject)
            })
              .then((tableData) => {
                $scope.tableData = tableData;
              });
          }
        }
      }
    ])
  }
}

export default BabbageTableDirective