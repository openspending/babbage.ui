import TableComponent from '../../../components/table'

export class BabbageTableDirective {
  init(angularModule) {
    angularModule.directive('babbageTable', [
      '$q',
      function($q) {
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
          link: function($scope) {
            var babbageTable = new TableComponent();

            $q((resolve, reject) => {
              babbageTable.downloader = $scope.downloader;
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