import TableComponent from '../../../components/table'

export class BabbageTableDirective {
  init(angularModule) {
    angularModule.directive('babbageTable', [
      '$timeout', '$window',
      function($timeout, $window) {
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

            babbageTable.getTableData($scope.endpoint, $scope.cube, $scope.state).then( (tableData) => {
              $timeout(()=>{
                $scope.tableData = tableData;
              });
            });

          }
        }
      }
    ])
  }
}

export default BabbageTableDirective