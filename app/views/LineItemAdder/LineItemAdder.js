'use strict';

(function() {
  angular.module('cashewApp.LineItemAdder', [])

  .directive('lineItemAdder', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/LineItemAdder/LineItemAdder.html',
      controller: 'LineItemAdder',
      controllerAs: 'adder'
    };
  })

  .controller('LineItemAdder', ['$scope', 'LineItemsService', function($scope, LineItemsService) {
    var me = this;
    var an_id = 0;

    var getNextId = function() {
      return ++an_id;
    };
    var newLineItemDate = function() {
      return {M:null,D:null,'?':getNextId()};
    };
    var newLineItem = function() {
      var item = {};
      item.period = 'mo';
      item.type = 'minus';
      item.dates = [newLineItemDate()];
      return item;
    };
    var isInvalidDate = function(d) {
      if (d.M) {
        if (!d.D) {
          return true;
        }
        switch (parseInt(d.M)) {
          case 1:
          case 3:
          case 5:
          case 7:
          case 8:
          case 10:
          case 12:
            return d.D > 31;
          case 2:
            return d.D > 28;
          case 4:
          case 6:
          case 9:
          case 11:
            return d.D > 30;
          default:
            return false;
        }
        return isNaN(d.M) || d.D && isNaN(d.D);
      }
      return d.D && isNaN(d.D);
    };

    me.lineItem = newLineItem();
    me.errorMessage = null;

    me.preparePayable = function() {
      me.lineItem.type = 'minus';
    };

    me.prepareEarnable = function() {
      me.lineItem.type = 'plus';
      me.lineItem.varies = false;
      me.lineItem.split = false;
    };

    me.getErrorMessage = function(item) {
      var i, d, j, seen = [];
      if (!item.name) {
        return "Please enter a name.";
      }
      if (!item.varies && (!item.amount || parseFloat(item.amount) <= 0)) {
        return "Amount should be more than zero.";
      }
      if (item.period === 'mo') {
        for (i in item.dates) {
          d = item.dates[i];
          if (d.D && !isNaN(d.D)) {
            if (d.D <= 28) {
              for (j in seen) {
                if (seen[j] === d.D) {
                  return "Duplicate date: " + d.D;
                }
              }
              seen.push(d.D);
            } else {
              return "For monthly items, only days up to 28 are supported.";
            }
          }
        }
        if (seen.length < item.dates.length) {
          return "Please ensure all date fields are complete and valid.";
        }
      } else if (item.period === 'yr') {
        for (i in item.dates) {
          d = item.dates[i];
          if (d.M && !isInvalidDate(d)) {
            for (j in seen) {
              if (seen[j].D === d.D && seen[j].M === d.M) {
                return "Duplicate date: " + d.M + "/" + d.D;
              }
            }
            seen.push(d);
          }
        }
        if (seen.length < item.dates.length) {
          return "Please ensure all date fields are complete and valid.";
        }
      }
      return null;
    };

    me.addItem = function() {
      var item;

      me.errorMessage = me.getErrorMessage(me.lineItem);
      if (me.errorMessage !== null) {
        return;
      }

      item = {};
      item.name = me.lineItem.name;
      item.type = me.lineItem.type;

      if (!!me.lineItem.amount) {
        item.amount = Math.abs(me.lineItem.amount);
      }

      item.freq = {};
      item.freq.per = me.lineItem.period;
      item.freq.on = [];

      if (item.freq.per === 'yr') {
        item.freq.split = !!me.lineItem.split;
      }

      me.lineItem.dates.forEach(function(date) {
        var on = {};
        if (item.freq.per === 'yr' && date.M) {
          on.M = parseInt(date.M);
        }
        on.D = date.D;
        item.freq.on.push(on);
      });

      LineItemsService.put(item);

      me.lineItem = newLineItem();
    };

    me.allowAddingDate = function() {
      var i, elem;
      if (me.lineItem.period==='mo') {
        for (i = 0; i < me.lineItem.dates.length; ++i) {
          elem = me.lineItem.dates[i];
          if (!elem.D) {
            return false;
          }
        }
      } else if (me.lineItem.period==='yr') {
        for (i = 0; i < me.lineItem.dates.length; ++i) {
          elem = me.lineItem.dates[i];
          if (!elem.D || !elem.M || isInvalidDate(elem)) {
            return false;
          }
        }
      }
      return true;
    };

    me.showSplitPayableOption = function(lineItem) {
      return lineItem.period === 'yr' && lineItem.type === 'minus' && !!lineItem.amount;
    };

    me.addDateToLineItem = function() {
      me.lineItem.dates.push(newLineItemDate());
    };

    me.removeDateFromLineItem = function(d) {
      me.lineItem.dates.forEach(function(elem, i, arr) {
        if (elem['?'] === d['?']) {
          arr.splice(i, 1);
          return;
        }
      });
    };
  }]);
}());
