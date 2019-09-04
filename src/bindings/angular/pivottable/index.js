import PivotTableComponent from '../../../components/pivottable'
import * as _ from 'lodash'
import {createI18NMapper} from '../utils'

// Include `pivottable` jquery plugin into bundle. Do not remove this line!
import 'pivottable'
const jQuery = require('jquery');

export class PivotTableDirective {
  init(angularModule) {
    angularModule.directive('pivotTable', [
      '$sce',
      function($sce) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            state: '=',
            model: '=',
            downloader: '=?',
            formatValue: '=?',
            maxValueLimit: '@?',
            messages: '=?'
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
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

            let component = new PivotTableComponent();

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
              $scope.status.hasError = !!error;
              $scope.error = !!error && error.message;
              $scope.$applyAsync();
              $scope.$emit('babbage-ui.ready', component, data, error);
            });

            let sum = jQuery.pivotUtilities.aggregatorTemplates.sum;

            let formatValue = $scope.formatValue;
            if (!_.isFunction(formatValue)) {
              let numberFormat = jQuery.pivotUtilities.numberFormat;
              formatValue = numberFormat({digitsAfterDecimal: 0});
            }

            let wrapper = element.find('.pivot-table')[0];
            component.downloader = $scope.downloader;
            $scope.$emit('babbage-ui.initialize', component);
            component.getPivotData($scope.endpoint, $scope.cube, $scope.state, $scope.model)
              .then((result) => {
                let limit = parseInt($scope.maxValueLimit, 10) || 0;
                if (
                  (limit > 0) && _.isArray(result.data) &&
                  (result.data.length > limit)
                ) {
                  $scope.status.isTooMuchData = true;
                } else {
                  jQuery(wrapper).pivot(
                    result.data,
                    {
                      rows: result.rows,
                      cols: result.cols,
                      aggregator: sum(formatValue)(['value']),
                    }
                  );
                  $scope.$emit('babbage-ui.table-ready', component);
                }
                $scope.$applyAsync();
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

export default PivotTableDirective
