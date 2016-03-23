'use strict';

var geoview = require('../../../components/geoview/render');
var api = require('../../../components/geoview/api');

module.exports = function(ngModule) {
  ngModule.directive('geoview', [
    '$window', '$timeout',
    function($window, $timeout) {
      return {
        restrict: 'EA',
        scope: {
          countryCode: '@',
          currencySign: '@?',
          values: '=?',
          cosmoEndpoint: '@'
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

          function createHandle(countryCode, data, currencySign) {
            api.loadGeoJson($scope.cosmoEndpoint, countryCode)
              .then(function(geoJson) {
                console.log('===============');
                console.log(geoJson);
                // Check if countryCode did not change while loading data
                if ($scope.countryCode != countryCode) {
                  return;
                }
                $timeout(function() {
                  removeResizeListeners();
                  handle = geoview({
                    container: element.find('.babbage-geoview').get(0),
                    code: countryCode,
                    geoObject: geoJson,
                    data: data(),
                    currencySign: currencySign(),
                    bindResize: function(callback) {
                      resizeHandlers.push(callback);
                      $window.addEventListener('resize', callback);
                    }
                  });
                });
              });
          }

          if ($scope.countryCode) {
            handle = createHandle($scope.countryCode, function() {
              return $scope.values || {};
            }, function() {
              return $scope.currencySign;
            });
          }

          $scope.$watch('values', function(newValue, oldValue) {
            if (newValue === oldValue) {
              return;
            }
            if (handle) {
              handle.updateData(newValue || {}, $scope.currencySign);
            }
          }, true);

          $scope.$watch('currencySign', function(newValue, oldValue) {
            if (newValue === oldValue) {
              return;
            }
            if (handle) {
              handle.updateData($scope.values || {}, newValue);
            }
          }, true);

          $scope.$watch('countryCode', function(newValue, oldValue) {
            if (newValue === oldValue) {
              return;
            }
            createHandle(newValue, function() {
              return $scope.values || {};
            }, function() {
              return $scope.currencySign;
            });
          });

          $scope.$on('$destroy', function() {
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
