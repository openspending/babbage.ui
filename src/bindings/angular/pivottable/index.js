import PivotTableComponent from '../../../components/pivottable'
import PivotTable from 'pivottable'

export class PivotTableDirective {
  init(angularModule) {
    angularModule.directive('pivotTable', [
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
            var pivotTableComponent = new PivotTableComponent();
            var sum = $.pivotUtilities.aggregatorTemplates.sum;
            var numberFormat = $.pivotUtilities.numberFormat;
            var intFormat = numberFormat({digitsAfterDecimal: 0});

            var wrapper = element.find('.pivot-table')[0];
            pivotTableComponent.getPivotData($scope.endpoint, $scope.cube, $scope.state).then((result) => {
              $(wrapper).pivot(
                result.data,
                {
                  rows: result.rows,
                  cols: result.cols,
                  aggregator: sum(intFormat)(["value"])
                }
              );
            });
          }
        }
      }
    ])
  }
}

export default PivotTableDirective