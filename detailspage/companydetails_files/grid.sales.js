JLL.Grids.SalesGrid = (function($) {

    var defaults = {
        tableId: '',
        sDom: '',
        sAjaxSource: '',
        sAjaxDataProp: 'aaData',
        initComplete: null,
        pageSize: 10
    };
    var localConfig;

    var formatMoney = function (data, type, row) {
        if (!data || data === 0)
            return "";

        var safeData = JLL.FormatCurrency(data, row.CurrencySymbol);

        return "<span>" + safeData + "</span>";
    };

    var formatDate = function(data, type, row) {
        var safeData = JLL.FormatDate(data);
        return "<span>" + safeData + "</span>";
    };
    
    var formatEntityReference = function (data, type, row) {
        return "<span>" + data.DisplayName + "</span>";
    };

    var formatProperty = function (data, type, row) {
        if (localConfig.propertyDetailsUrl != undefined) {
            var value = "<a href='" + localConfig.propertyDetailsUrl + "/" + data.Id + "'>";
            value += data.DisplayName;
            value += '</a>';
            return value;
        }
        else {
            return "<span>" + data.DisplayName + "</span>";
        }
    };

var createInstance = function (gridConfig) {
var table = { };
table._config = $.extend({ }, defaults, gridConfig);
localConfig = table._config;
table.$table = $('#' +table._config.tableId);

        var _initComplete = function (oSettings, json) {
            if (table._config.initComplete) {
                table._config.initComplete(oSettings, json);
            }
            JLL.UnblockDetailSubgrid(table.$table.parent());
        };

        table._table = table.$table.dataTable({
                sDom: table._config.sDom,
            sPaginationType: 'bootstrap',
                sAjaxSource: table._config.sAjaxSource,
            sServerMethod: "POST",
            bServerSide: true,
                sAjaxDataProp: table._config.sAjaxDataProp,
                fnInitComplete: _initComplete,
                fnServerData: function (sSource, aoData, fnCallback, oSettings) {
                var searchStart = new Date().getTime();
                $.ajax({
                    dataType: 'json',
                    type: 'POST',
                    url: sSource,
                    data: aoData,
                        success: function (json) {
                        var searchEnd = new Date().getTime();
                        var timeSpent = searchEnd -searchStart;
                        ga('send', 'timing', 'RelatedRecords', 'Sales', timeSpent);
                            fnCallback(json);
                }
            });
        },
                oLanguage: {
                    sSearch: 'Narrow Your Results:',
                    sEmptyTable: "No Data Available"
        },
                aoColumns: [
                    { sTitle: '', mData: 'Id', bVisible: false
            },
                    { sTitle: 'Buyer/Owner', mData: 'BuyerOwner', mRender: formatEntityReference, bSortable: false
            },
                    { sTitle: 'Property', mData: 'Property', mRender: formatProperty
            },
                    { sTitle: 'Property Type', mData: 'PropertyType'
            },
                    { sTitle: 'Sale Date*', mData: 'SaleDate', mRender: formatDate, bSortable: false
            },
                    { sTitle: 'Sale Price', mData: 'SalePrice', mRender: formatMoney, sType: 'formatted-num', bSortable: false
            },
                    { sTitle: 'City', mData: 'City'
            },
                    { sTitle: 'State', mData: 'State'
            },
                    { sTitle: 'Country', mData: 'Country' }
        ],
            bProcessing: true,
                iDisplayLength: table._config.pageSize
        });

        JLL.BlockDetailSubgrid(table.$table.parent());
        JLL.HandleDataTableProcessing(table.$table);

        return table;
        };

    return {
                CreateInstance: createInstance
    };
})(jQuery);