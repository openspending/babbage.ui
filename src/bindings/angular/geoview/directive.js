'use strict';

var _ = require('lodash');

module.exports = function(ngModule) {
  ngModule.directive('geoview', [
    '$window', '$timeout', '$q',
    function($window, $timeout, $q) {
      return {
        restrict: 'EA',
        scope: {
          component: '=',  // GeoViewComponent instance
          countryCode: '@',
          currencySign: '@?',
          values: '=?',
          cosmoEndpoint: '@',
          formatValue: '=?'
        },
        template: '<div class="babbage-geoview"></div>',
        replace: false,
        link: function($scope, element) {
          var handle = null;

          var resizeHandlers = [];

          function removeResizeListeners() {
            resizeHandlers.forEach(function(callback) {
              $window.removeEventListener('resize', callback);
            });
            resizeHandlers = [];
          }

          // This helps to avoid double-rendering of map when re-initializing
          // during rendering with previous params
          var lastParams = {
            countryCode: null,
            component: null
          };
          function createHandle(countryCode, data, currencySign, component) {
            if (
              (lastParams.countryCode == countryCode) &&
              (lastParams.component == component)
            ) {
              return;
            }

            lastParams.countryCode = countryCode;
            lastParams.component = component;

            if (handle) {
              handle.destroy();
              element.empty();
              removeResizeListeners();
            }
            $q((resolve, reject) => {
              component.build({
                container: element.find('.babbage-geoview').get(0),
                code: countryCode,
                data: {},
                cosmoApiUrl: $scope.cosmoEndpoint,
                formatValue: $scope.formatValue,
                bindResize: function(callback) {
                  resizeHandlers.push(callback);
                  $window.addEventListener('resize', callback);
                }
              }).then(resolve).catch(reject)
            })
              .then((result) => {
                // Check if countryCode did not change while loading data
                if (
                  (lastParams.countryCode == countryCode) &&
                  (lastParams.component == component)
                ) {
                  handle = result;
                  handle.updateData(data(), currencySign());
                  $scope.$emit('babbage-ui.internal.geoview-ready');
                } else {
                  result.destroy();
                  element.empty();
                }
              });
          }

          function init() {
            if ($scope.countryCode && $scope.component) {
              createHandle($scope.countryCode, function() {
                return _.extend({}, $scope.values);
              }, function() {
                return $scope.currencySign;
              }, $scope.component);
            }
          }

          function update() {
            if (handle) {
              handle.updateData(_.extend({}, $scope.values),
                $scope.currencySign);
            }
          }

          init();

          $scope.$watch('values', function(newValue, oldValue) {
            if (newValue !== oldValue) {
              update();
            }
          }, true);

          $scope.$watch('currencySign', function(newValue, oldValue) {
            if (newValue !== oldValue) {
              update();
            }
          }, true);

          $scope.$watch('countryCode', function(newValue, oldValue) {
            if ((newValue !== oldValue) || !handle) {
              init();
            }
          });

          $scope.$watch('component', function(newValue, oldValue) {
            if ((newValue !== oldValue) || !handle) {
              init();
            }
          });

          $scope.$on('$destroy', function() {
            lastParams = null;
            removeResizeListeners();
            if (handle) {
              handle.destroy();
            }
          });
        }
      };
    }
  ]);
};
