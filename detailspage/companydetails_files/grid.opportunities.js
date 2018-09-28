JLL.Grids.OpportunityGrid = (function($) {

    var defaults = {
        tableId: '',
        sDom: '',
        sAjaxSource: '',
        sAjaxDataProp: 'aaData',
        isOpen: true,
        initComplete: null,
        pageSize: 10
    };
    
    var formatEntityReference = function (data, type, row) {
        return "<span>" + data.DisplayName + "</span>";
    };
    
    var formatMoney = function (data, type, row) {
        if (!data || data === 0)
            return "";

        var currencySymbol = "$";
        if (row.CurrencySymbol)
            currencySymbol = row.CurrencySymbol;
        
        var safeData = JLL.FormatCurrency(data, currencySymbol);
        return "<span>" + safeData + "</span>";
    };

    var formatDate = function (data, type, row) {
        return JLL.FormatDate(data);
    };

    var createInstance = function (gridConfig) {
        var table = { };
        table._config = $.extend({}, defaults, gridConfig);
        table.$table = $('#' + table._config.tableId);
        
        var _initComplete = function (oSettings, json) {
            if (table._config.initComplete) {
                table._config.initComplete(oSettings, json);
            }
            JLL.UnblockDetailSubgrid(table.$table);
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
                        var timeSpent = searchEnd - searchStart;
                        ga('send', 'timing', 'RelatedRecords', 'Opportunity', timeSpent, table._config.isOpen ? "Open" : "Closed");
                        fnCallback(json);
                    }
                });
            },
            oLanguage: {
                sSearch: 'Narrow Your Results:',
                sEmptyTable: "No Data Available"
            },
            aoColumns: [
                { sTitle: '', mData: 'Id', bVisible: false },
                { sTitle: 'Name', mData: 'Name', sWidth: '110px', bSortable: true },
                { sTitle: 'Company', mData: 'Company', bVisible: false },
                { sTitle: 'Local Name', mData: 'LocalName', bVisible: false },
                { sTitle: 'Region', mData: 'Region', sWidth: '44px', bSortable: true },
                { sTitle: 'Group', mData: 'Group', sWidth: '59px', bSortable: true },
                { sTitle: 'Service', mData: 'ServiceType', sWidth: '65px', bSortable: true },
                { sTitle: 'Geography', mData: 'Geography', sWidth: '75px', bSortable: true },
                { sTitle: 'Sales Stage', mData: 'CurrentSalesStage', sWidth: '90px', bSortable: true },
                { sTitle: 'Est Close', mData: 'EstCloseDate', sWidth: '55px', sType: 'monthDateYear', mRender: formatDate, bVisible: table._config.isOpen, bSortable: true },
                { sTitle: 'Est Revenue', mData: 'EstRevenue', sWidth: '95px', mRender: formatMoney, sType: 'formatted-num', bVisible: table._config.isOpen, bSortable: true },
                { sTitle: 'Actual Close', mData: 'ActualCloseDate', sWidth: '70px', sType: 'monthDateYear', mRender: formatDate, bVisible: !table._config.isOpen, bSortable: true },
                { sTitle: 'Actual Revenue', mData: 'ActualRevenue', sWidth: '85px', mRender: formatMoney, bVisible: !table._config.isOpen, bSortable: true },
                { sTitle: 'Primary JLL Contact', mData: 'PrimaryJllContact', sWidth: '110px', bSortable: true },
                { sTitle: '', mData: 'CurrencySymbol', bVisible: false },
                { sTitle: 'Status', mData: 'Status', bVisible: !table._config.isOpen }
                
            ],
            bProcessing: true,
            iDisplayLength: table._config.pageSize
        });

        JLL.HandleDataTableProcessing(table.$table);
        
        JLL.BlockDetailSubgrid(table.$table.parent());
        
        table.Count = function () {
            if (table._table && table._table.fnGetData)
                return table._table.fnGetData().length;
            else {
                return 0;
            }
        };
        
        return table;
    };

    return {
        CreateInstance: createInstance
    };
})(jQuery);