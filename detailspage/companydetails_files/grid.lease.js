JLL.Grids.LeaseGrid = (function ($) {
    var defaults = {
        tableId: '',
        sDom: '',
        sAjaxSource: '',
        sAjaxDataProp: 'aaData',
        leaseDetailsUrl: '',
        showProperty: true,
        showInternalContact: true,
        showSize: true,
        showRent: true,
        showTenant: true,
        initComplete: null,
        pageSize: 10
    };

    var createInstance = function(gridConfig) {
        var table = { };
        table._config = $.extend({ }, defaults, gridConfig);
        table.$table = $('#' + table._config.tableId);
        var localConfig = table._config;

        var formatEntityReference = function (data, type, row) {
            if (row.Confidential == true || row.DealioConfidential == true)
                return "<span>Confidential</span>";
            else
                return "<span>" + data.DisplayName + "</span>";
        };

        var formatConfidential = function (data, type, row) {
            if (row.Confidential == true || row.DealioConfidential == true)
                return "<span>Confidential</span>";
            else
                return "<span>" + data + "</span>";
        };

        var formatCheckbox = function(data, type, row) {
            if (data) {
                return "<span><input type='checkbox' disabled='disabled' checked='checked' /></span>";
            } else {
                return "<span><input type='checkbox' disabled='disabled' /></span>";
            }
        };

        var formatLeaseAddress = function (data, type, row) {
            var value = "";
            if (row.Confidential == false)
                value = "<a href='" + localConfig.leaseDetailsUrl + "/" + row.Id + "'>";
            else
                value = "<a >";
            

            value += row.Address + "<br/>";
            value += data.DisplayName + "<br/>";

            value += '<div>';

            value += formatCSZ(row);

            value += '</div></a>';
            return value;
        };

        var formatCSZ = function(row) {
            var value = "";
            if (row.City)
                value += row.City;

            if (row.City && row.State)
                value += ", ";

            if (row.State)
                value += row.State;

            if (row.Country)
                value += " " + JLL.NullSafeString(row.Country.DisplayName);
            return value;
        };

        var formatSize = function (data, type, row) {
            if (row.Confidential == true || row.DealioConfidential == true)
                return "<span>Confidential</span>";

            if (!data || data === 0)
                return "<span>0</span>";

            var safeData = JLL.FormatDecimal(data);
            return "<span>" + safeData + "&nbsp;" + row.AreaUOM + "</span>";
        };

        var formatMoney = function (data, type, row) {
            if (row.Confidential == true || row.DealioConfidential == true)
                return "<span>Confidential</span>";


            if (!data || data === 0)
                return "";

            var safeData = JLL.FormatCurrency(data, row.CurrencySymbol);
            return "<span>" + safeData + " /" + row.AreaUOM + "</span>";
        };

        var formatDate = function (data, type, row) {
            if (row.Confidential == true || row.DealioConfidential == true)
                return "<span>Confidential</span>";


            return '<span>' + JLL.FormatDate(data) + '</span>';
        };

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
            oLanguage: {
                sSearch: 'Narrow Your Results:',
                sEmptyTable: "No Data Available"
            },
            fnInitComplete: _initComplete,
            fnServerData: function (sSource, aoData, fnCallback, oSettings) {
                var searchStart = new Date().getTime();
                $.ajax({
                    dataType: 'json',
                    type: 'POST',
                    url: sSource,
                    data: aoData,
                    success: function(json) {
                        var searchEnd = new Date().getTime();
                        var timeSpent = searchEnd - searchStart;
                        ga('send', 'timing', 'RelatedRecords', 'Lease', timeSpent);
                        fnCallback(json);
                    }
                });
            },
            aoColumns: [
                { sTitle: '', mData: 'Id', bVisible: false, bSortable: false },
                { sTitle: 'Tenant', mData: 'Tenant', mRender: formatEntityReference, bVisible: table._config.showTenant, sWidth: '120px', bSortable: true },
                { sTitle: 'Floor', mData: 'Floor', mRender: formatEntityReference, bSortable: true },
                { sTitle: 'Suite/Unit', mData: 'Suite', mRender:formatConfidential, bSortable: true },
                { sTitle: 'Property', mData: 'Property', mRender: formatLeaseAddress, aDataSort: [2, 3, 4, 5], sClass: 'span3', bVisible: table._config.showProperty, bSortable: true },
                { sTitle: 'Town/City', mData: 'City', bVisible: false, bSortable: true },
                { sTitle: 'State', mData: 'State', bVisible: false, bSortable: true },
                { sTitle: 'Country', mData: 'Country', bVisible: false, bSortable: true },
                { sTitle: 'Conf.', mData: 'Confidential', mRender: formatCheckbox, bSortable: false },
                { sTitle: 'Internal Contact', mData: 'InternalContact', mRender: formatEntityReference, bVisible: table._config.showInternalContact, bSortable: false },
                { sTitle: 'Size', mData: 'Size', mRender: formatSize, sWidth: '50px', sType: 'formatted-num', bSortable: true },
                { sTitle: 'Rent', mData: 'Rent', mRender: formatMoney, sWidth: '50px', bVisible: table._config.showRent, bSortable: true },
                { sTitle: 'Exp Date*', mData: 'ExpirationDate', sType: 'monthDateYear', mRender: formatDate, bSortable: true },
                { sTitle: 'Tenant Broker Co', mData: 'TenantBrokerCompany', mRender: formatEntityReference, bSortable: true },
                { sTitle: '', mData: 'CurrencyDecimals', bVisible: false, bSortable: false },
                { sTitle: '', mData: 'CurrencySymbol', bVisible: false, bSortable: false },
                { sTitle: '', mData: 'Address', bVisible: false, bSortable: false }
            ],
            
            bProcessing: true,
            iDisplayLength: 10
        });

        JLL.HandleDataTableProcessing(table.$table);
        JLL.BlockDetailSubgrid(table.$table.parent());
        
        return table;
    };


    return {
        CreateInstance: createInstance
    };

})(jQuery);