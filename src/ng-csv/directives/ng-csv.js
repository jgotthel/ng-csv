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
            var charset = scope.charset || 'utf-8';
            var blob = new Blob([csv], { type: 'text/csv;charset=' + charset + ';' });
            var filename = scope.getFilename();

            if (window.navigator.msSaveOrOpenBlob)  // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
              window.navigator.msSaveBlob(blob, filename);
            else
            {
              var a = window.document.createElement('a');
              a.href = window.URL.createObjectURL(blob);
              a.download = filename;
              document.body.appendChild(a);
              a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
              document.body.removeChild(a);
            }
          });
          scope.$apply();
        });
      }
    };
  }]);
