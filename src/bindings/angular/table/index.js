import TableComponent from '../../../components/table'

export class BabbageTableDirective {
  init(angularModule) {
    angularModule.directive('babbageTable', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '='
          },
          template: require('template.html'),
          replace: false,
          link: function($scope, element) {
            var babbageTable = new BabbageTableDirective();

            $scope.tableData = babbageTable.getTableData($scope.endpoint, $scope.cube, $scope.state);
          }
        }
      }
    ])
  }
}

export default BabbageTableDirective