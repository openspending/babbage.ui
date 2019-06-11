import ChartComponent from '../../../components/chart'
import * as _ from 'lodash'
import {createI18NMapper} from '../utils'

export class ChartDirective {
  init(angularModule) {
    angularModule.directive('chart', [
      '$sce',
      function($sce) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
            state: '=',
            downloader: '=?',
            formatValue: '=?',
            messages: '=?',
            colorScale: '&',
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

            let component = new ChartComponent();
            let wrapper = element.find('.chart-babbage')[0];

            component.formatValue = $scope.formatValue;

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
              $scope.status.hasError = !!error;
              $scope.error = !!error && error.message;
              $scope.$applyAsync();
              $scope.$emit('babbage-ui.ready', component, data, error);
            });
            component.on('click', function(component, item) {
              $scope.$emit('babbage-ui.click', component, item);
              $scope.$applyAsync();
            });

            component.downloader = $scope.downloader;
            $scope.$emit('babbage-ui.initialize', component);

            component.build(
              $scope.type,
              $scope.endpoint,
              $scope.cube,
              $scope.state,
              wrapper,
              $scope.colorScale()
            );

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

export default ChartDirective
