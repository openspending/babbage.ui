import TableComponent from '../../../components/table'

export class BabbageTableDirective {
  init(angularModule) {
    angularModule.directive('babbageTable', [
      '$timeout', '$q',
      function($timeout, $q) {
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
            var babbageTable = new TableComponent();

            $q((resolve, reject) => {
              babbageTable.getTableData($scope.endpoint, $scope.cube, $scope.state)
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