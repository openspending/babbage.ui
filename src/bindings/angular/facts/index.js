import FactsComponent from '../../../components/facts'

export class FactsDirective {
  init(angularModule) {
    angularModule.directive('facts', [
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
            function update() {
              $q((resolve, reject) => {
                facts.getTableData($scope.endpoint, $scope.cube, $scope.state)
                  .then(resolve)
                  .catch(reject)
              })
                .then((tableData) => {
                  $scope.tableData = tableData;
                  $scope.current = parseInt(tableData.info.page-1, 10) || 0;
                  $scope.num = Math.ceil(tableData.info.total / tableData.info.pageSize);
                  var pages = [];
                  var num = $scope.num;
                  var range = 3;
                  var low = $scope.current - range;
                  var high = $scope.current + range;

                  if (low < 0) {
                    low = 0;
                    high = Math.min((2*range)+1, num);
                  }
                  if (high > num) {
                    high = num;
                    low = Math.max(1, num - (2*range)+1);
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

            var facts = new FactsComponent();

            $scope.getSort = function(field) {
              return _.find($scope.state.order, {key: field});
            }

            $scope.setSort = function(key, direction) {
              $scope.state.order = [{key: key, direction: direction}];
              update();
            }

            $scope.setPage = function(page) {
              if (page >= 0 && page <= $scope.num) {
                $scope.state.page = page+1;
                update();
              }
            }

            update();
          }
        }
      }
    ])
  }
}

export default FactsDirective