/**
 * ng-csv module
 * Export Javascript's arrays to csv files from the browser
 *
 * Author: asafdav - https://github.com/asafdav
 */
angular.module('ngCsv.directives').
    directive('ngCsv', ['$parse', '$q', 'CSV', '$document', '$timeout', function ($parse, $q, CSV, $document, $timeout) {
    return {
      restrict: 'AC',
      scope: {
        data: '&ngCsv',
        filename: '@filename',
        header: '&csvHeader',
        columnOrder: '&csvColumnOrder',
        txtDelim: '@textDelimiter',
        decimalSep: '@decimalSeparator',
        quoteStrings: '@quoteStrings',
        fieldSep: '@fieldSeparator',
        lazyLoad: '@lazyLoad',
        addByteOrderMarker: "@addBom",
        ngClick: '&',
        charset: '@charset',
        label: '&csvLabel'
      },
      controller: [
        '$scope',
        '$element',
        '$attrs',
        '$transclude',
        function ($scope, $element, $attrs, $transclude) {
          $scope.csv = '';

          if (!angular.isDefined($scope.lazyLoad) || $scope.lazyLoad != "true") {
            if (angular.isArray($scope.data)) {
              $scope.$watch("data", function (newValue) {
                $scope.buildCSV();
              }, true);
            }
          }

          $scope.getFilename = function () {
            return $scope.filename || 'download.csv';
          };

          function getBuildCsvOptions() {
            var options = {
              txtDelim: $scope.txtDelim ? $scope.txtDelim : '"',
              decimalSep: $scope.decimalSep ? $scope.decimalSep : '.',
              quoteStrings: $scope.quoteStrings,
              addByteOrderMarker: $scope.addByteOrderMarker
            };
            if (angular.isDefined($attrs.csvHeader)) options.header = $scope.$eval($scope.header);
            if (angular.isDefined($attrs.csvColumnOrder)) options.columnOrder = $scope.$eval($scope.columnOrder);
            if (angular.isDefined($attrs.csvLabel)) options.label = $scope.$eval($scope.label);

            options.fieldSep = $scope.fieldSep ? $scope.fieldSep : ",";

            // Replaces any badly formatted special character string with correct special character
            options.fieldSep = CSV.isSpecialChar(options.fieldSep) ? CSV.getSpecialChar(options.fieldSep) : options.fieldSep;

            return options;
          }

          /**
           * Creates the CSV and updates the scope
           * @returns {*}
           */
          $scope.buildCSV = function () {
            var deferred = $q.defer();
            var data = null;

            $element.addClass($attrs.ngCsvLoadingClass || 'ng-csv-loading');

            data = $scope.data();
            if(angular.isFunction(data)){
              data = data();
            }

            CSV.stringify(data, getBuildCsvOptions()).then(function (csv) {
              $scope.csv = csv;
              $element.removeClass($attrs.ngCsvLoadingClass || 'ng-csv-loading');
              deferred.resolve(csv);
            });
            $scope.$apply(); // Old angular support

            return deferred.promise;
          };
        }
      ],
      link: function (scope, element, attrs) {
        element.bind('click', function (e) {
          scope.buildCSV().then(function (csv) {

            var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
            var csvURL =  null;
            if (navigator.msSaveBlob) {
              navigator.msSaveBlob(csvData, scope.getFilename());
            } else {
              if(navigator.userAgent.toLowerCase().indexOf('chrome') === -1 ) {
                var downloadContainer = angular.element('<div data-tap-disabled="true"><a></a></div>');
                var downloadLink = angular.element(downloadContainer.children()[0]);
                downloadLink.attr('href', window.URL.createObjectURL(csvData));
                downloadLink.attr('download', scope.getFilename());
                if(navigator.userAgent.toLowerCase().indexOf('safari') === -1) {
                  downloadLink.attr('target', '_blank');
                }

                $document.find('body').append(downloadContainer);
                $timeout(function () {
                  downloadLink[0].click();
                  downloadLink.remove();
                }, null);
              } else {
                csvURL = window.URL.createObjectURL(csvData);

                var tempLink = document.createElement('a');
                tempLink.href = csvURL;
                tempLink.setAttribute('download', scope.getFilename());
                tempLink.click();
              }

            }

          });
          scope.$apply();
        });
      }
    };
  }]);
