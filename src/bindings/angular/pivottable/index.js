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
            downloader: '=?',
            formatValue: '=?',
            maxValueLimit: '@?',
            maxValueMessage: '@?'
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

            var component = new PivotTableComponent();

            component.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.status.isTooMuchData = false;
              $scope.$applyAsync();
            });
            component.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) &&
                (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            var sum = $.pivotUtilities.aggregatorTemplates.sum;

            var formatValue = $scope.formatValue;
            if (!_.isFunction(formatValue)) {
              var numberFormat = $.pivotUtilities.numberFormat;
              formatValue = numberFormat({digitsAfterDecimal: 0});
            }

            var wrapper = element.find('.pivot-table')[0];
            component.downloader = $scope.downloader;
            component.getPivotData($scope.endpoint, $scope.cube, $scope.state)
              .then((result) => {
                var limit = parseInt($scope.maxValueLimit, 10) || 0;
                if (
                  (limit > 0) && _.isArray(result.data) &&
                  (result.data.length > limit)
                ) {
                  $scope.status.isTooMuchData = true;
                } else {
                  $(wrapper).pivot(
                    result.data,
                    {
                      rows: result.rows,
                      cols: result.cols,
                      aggregator: sum(formatValue)(['value']),
                    }
                  );
                }
                $scope.$applyAsync();
              });
          }
        }
      }
    ])
  }
}

export default PivotTableDirective