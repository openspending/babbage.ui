import PivotTableComponent from '../../../components/pivottable'
import _ from 'lodash';

// Include `pivottable` jquery plugin into bundle. Do not remove this line!
import PivotTable from 'pivottable'

export class PivotTableDirective {
  init(angularModule) {
    angularModule.directive('pivotTable', [
      function() {
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
          link: function($scope, element) {
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              isCutOff: false,
              cutoff: 0
            };

            var pivotTableComponent = new PivotTableComponent();

            pivotTableComponent.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            pivotTableComponent.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) && (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            var sum = $.pivotUtilities.aggregatorTemplates.sum;
            var numberFormat = $.pivotUtilities.numberFormat;
            var intFormat = numberFormat({digitsAfterDecimal: 0});

            var wrapper = element.find('.pivot-table')[0];
            pivotTableComponent.downloader = $scope.downloader;
            pivotTableComponent.getPivotData($scope.endpoint, $scope.cube, $scope.state)
              .then((result) => {
                $(wrapper).pivot(
                  result.data,
                  {
                    rows: result.rows,
                    cols: result.cols,
                    aggregator: sum(intFormat)(['value'])
                  }
                );
                $scope.$applyAsync();
              });
          }
        }
      }
    ])
  }
}

export default PivotTableDirective