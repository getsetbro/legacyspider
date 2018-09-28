// Set up all global namespaces for javascript files to use

(function ($) {

    if (!window.JLL) {
        window.JLL = { };
    }

    if (!JLL.Grids) {
        JLL.Grids = { };
    }

    if (!JLL.Search) {
        JLL.Search = { };
    }

    if (!JLL.Lookup) {
        JLL.Lookup = { };
    }

    if (!JLL.Contact) {
        JLL.Contact = { };
    }

    if (!JLL.Company) {
        JLL.Company = { };
    }

    if (!JLL.Property) {
        JLL.Property = { };
    }
    
    if(!JLL.Lease) {
        JLL.Lease = { };
    }

    if (!JLL.StaticList) {
        JLL.StaticList = {};
    }

    if (!JLL.Index) {
        JLL.Index = {};
    }

    var _localStorageKey = 'JLL_TENANT_HISTORY';
    var _localStorageCountryKey = 'JLL_TENANT_COUNTRY';
    var _maxHistoryLength = 10;

    var saveCountryFilter = function (countryName) {

        var key = _localStorageCountryKey;
        $.Storage.set(key, countryName);
    };

    var getCountryFilter = function (type) {
        var key = _localStorageCountryKey;
        var countryJson = $.Storage.get(key);
        if (countryJson) {
            if (countryJson == 'North America') {
                console.log(countryJson);
                countryJson = 'Global';
            }
            return countryJson;
        }
        return null;
    };

    var addToHistory = function (id, displayName, url, type, contactphone, address1, address2, city, state, zip) {

        if (type !== historyTypeEnum.COMPANY && type !== historyTypeEnum.CONTACT && type !== historyTypeEnum.PROPERTY && type !== historyTypeEnum.LEASE && type !== historyTypeEnum.SEARCH) {
            $.growlUI('Invalid history type.');
            return;
        }

        var key = _localStorageKey + type.name;

        var historyTemp = $.Storage.get(key);
        var history = new Array();

        if (historyTemp) {
            history = JSON.parse(historyTemp);
        }

        var urlExists = false;
        var index = -1;
        $.each(history, function (i, e) {
            if (e.url === url) {
                urlExists = true;
                index = i;
            }
        });

        if (!urlExists) {
            history.unshift({ displayName: displayName, url: url, id: id, type: type });
            while (history.length > _maxHistoryLength) {
                history.pop();
            }
        } else {
            // pull the existing item to the top of the list
            var historyRec = history.splice(index, 1);
            history.unshift({ displayName: displayName, url: url, id: id, type: type });
        }

        var historyString = JSON.stringify(history);
        $.Storage.set(key, historyString);
    };
    
    var removeFromHistory = function (url, type) {

        if (type !== historyTypeEnum.COMPANY && type !== historyTypeEnum.CONTACT && type !== historyTypeEnum.PROPERTY && type !== historyTypeEnum.LEASE && type !== historyTypeEnum.SEARCH) {
            $.growlUI('Invalid history type.');
            return;
        }

        var key = _localStorageKey + type.name;

        var historyTemp = $.Storage.get(key);
        var history = new Array();

        if (historyTemp) {
            history = JSON.parse(historyTemp);
        }

        var urlExists = false;
        var pos = -1;
        $.each(history, function (i, e) {
            if (e.url === url) {
                urlExists = true;
                pos = i;
            }
        });

        if (urlExists) {
            history.splice(pos, 1);

            while (history.length > _maxHistoryLength) {
                history.pop();
            }

            var historyString = JSON.stringify(history);
            $.Storage.set(key, historyString);
        }
    };

    var getHistory = function(type) {

        if (type !== historyTypeEnum.COMPANY && type !== historyTypeEnum.CONTACT && type !== historyTypeEnum.PROPERTY && type !== historyTypeEnum.LEASE && type !== historyTypeEnum.SEARCH) {
            $.growlUI('Invalid history type.');
            return null;
        }

        var key = _localStorageKey + type.name;
        var historyJson = $.Storage.get(key);
        if (historyJson) {
            var historyArray = JSON.parse(historyJson);
            $.each(historyArray, function (i, e) {
                if (e.displayName && e.displayName.length > 0)
                    e.displayName = $('<div />').html(e.displayName).text();
            });

            if(historyArray.length > 0)
                return historyArray;
        }
        return null;
    };

    var addSort = function (attribute,order) {

        var key = _localStorageKey + "sort";

        var historyTemp = $.Storage.get(key);
        var history = new Array();

        history.unshift({ Attribute: attribute, Order: order });

        var historyString = JSON.stringify(history);
        $.Storage.set(key, historyString);
    };

    var getSort = function () {

        var key = _localStorageKey + "sort";
        var historyJson = $.Storage.get(key);
        if (historyJson) {
            var historyArray = JSON.parse(historyJson);
            if (historyArray.length > 0) {
                return historyArray;
            }
        }
        return null;
    };

    var blockElement = function(el) {
        $(el).block({
            message: '<span class="message">Loading...</span>',
            blockMsgClass: 'loading-overlay',
            css: {
                border: 'none',
                width: '100%',
                height: '100%',
                minHeight: '30px',
                padding: '14px 0 2px 0',
            },
            overlayCSS: { backgroundColor: 'rgb(190, 190, 190)', filter: 'alpha(opacity=80)', opacity:0.8 }
        });
    };

    var unblockElement = function(el) {
        $(el).unblock();
    };

    var datefromISO = function (s) {
        var D = new Date('2011-06-02T09:34:29+02:00');
        if (!D || +D !== 1307000069000) {
            var day, tz,
            rx = /^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
            p = rx.exec(s) || [];
            if (p[1]) {
                day = p[1].split(/\D/);
                for (var i = 0, L = day.length; i < L; i++) {
                    day[i] = parseInt(day[i], 10) || 0;
                };
                day[1] -= 1;
                day = new Date(Date.UTC.apply(Date, day));
                if (!day.getDate()) return NaN;
                if (p[5]) {
                    tz = (parseInt(p[5], 10) * 60);
                    if (p[6]) tz += parseInt(p[6], 10);
                    if (p[4] == '+') tz *= -1;
                    if (tz) day.setUTCMinutes(day.getUTCMinutes() + tz);
                }
                return day;
            }
            return NaN;
        }
        else {
            return new Date(s);
        }
    };

    var formatDate = function (d) {
        if (!d) return '';
        if (d == '1/1/0001') return '';
        if (d == '01/01/0001') return '';

        var date = new Date(d);
        if (isNaN(date))  date = JLL.DatefromISO(d);
        // #59870 - null or DateTime.Min values were returning as 1/1/1 or 12/31/0
        if (date.getFullYear() < 1900) return '';
        // null values are returning 12/31/1900
        if (date.getFullYear() == 1900 && date.getMonth() == 12 && date.getDate() == 31) return '';

        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    };

    var formatNumber = function (n) {
        if (!isNumeric(n)) {
            n = nullSafeString(n);
            n = $.parseNumber(n, { format: "#,###", locale: "us" });
        }
        return $.formatNumber(n, { format: "#,###", locale: "us" });
    };

    var formatDecimal = function (n) {
        if (!isNumeric(n)) {
            n = nullSafeString(n);
            n = $.parseNumber(n, { format: "#,###.#0", locale: "us" });
        }
        
        return $.formatNumber(n, { format: "#,###.#0", locale: "us" });
    };

    var formatCurrency = function (n, c) {
        if (!n) {
            if (n !== 0 && n !== '0')
                return '';
        }
        
        if (!isNumeric(n)) {
            n = nullSafeString(n);
            n = $.parseNumber(n, { format: "#,###.00", locale: "us" });
        }
        if (!c) c = '';
        return $.formatNumber(n, { format: c + "#,###.00", locale: "us" });
    };
    
    var nullSafeString = function (s) {
        return !s ? '' : s;
    };

    var isNumeric = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    var getActivityIconClass = function (activityType) {
        if (activityType === 4201) return "icon-calendar-2"; // appointment
        if (activityType === 4202) return "icon-email"; // email
        if (activityType === 4203) return "icon-print"; // fax
        if (activityType === 4206) return "icon-hammer"; // case resolution
        if (activityType === 4207) return "icon-doc-text"; // letter
        if (activityType === 4208) return "icon-box-1"; // opportunity close
        if (activityType === 4210) return "icon-phone"; // phone call
        if (activityType === 4212) return "icon-check-1"; // task
        if (activityType === 4251) return "icon-calendar-inv"; // recurring appointment

        return '';
    };

    var historyTypeEnum = {
        CONTACT: { value: 0, name: 'Contact', entityName: 'contact' },
        COMPANY: { value: 1, name: 'Company', entityName: 'account' },
        PROPERTY: { value: 2, name: 'Property', entityName: 'jll_property' },
        SEARCH: { value: 3, name: 'Search Result', entityName: '' },
        LEASE: { value: 4, name: 'Lease', entityName: 'awx_lease' },
    };

    var formatExcelExport = function (node) {
        $(node).removeClass('DTTT_button');
        var span = $(node).find('span');
        span.html("<a class='export-button'>Export</a>");
    };

    var _allDigitsPattern = /\d/g;
    var _stripFormatting = function (inputString) {
        var digits = inputString.match(_allDigitsPattern, '');
        return (digits != null) ? digits.join('') : '';
    };

    var _applyFormatting = function (inputString) {
        var seg1 = inputString.substr(0, 3),
            seg2 = inputString.substr(3, 3),
            seg3 = inputString.substr(6, 4),
            seg4 = inputString.substr(10, inputString.length),
            formatted = '';

        formatted += (seg1 != '') ? '(' + seg1 : '';
        formatted += (seg2 != '') ? ') ' + seg2 : '';
        formatted += (seg2.length == 3) ? '-' : '';
        formatted += seg3;
        formatted += (seg4 != '') ? ' x' + seg4 : '';

        return formatted;
    };

    var formatPhoneNumber = function (e) {
        if ($(e.currentTarget).val() == '') return;

        var $input = $(e.currentTarget),
            currentVal = _stripFormatting($input.val());

        var formatted = _applyFormatting(currentVal);

        $input.val(formatted);

        //move focus to end of box
        $input.focus();
    };

    var togglePhoneFormatting = function(e) {
        var $inputs = $(e.currentTarget).closest('.modal').find('input[field*="Phone"]');
        if (e.currentTarget.checked) {
            $inputs.each(function(i, el) {
                var $el = $(el);
                $el.val(_applyFormatting($el.val()));
                $el.on('keyup', formatPhoneNumber);
            });
        } else {
            $inputs.each(function(i, el) {
                var $el = $(el);
                $el.val(_stripFormatting($el.val()));
                $el.off('keyup');
            });

        }
    };

    var sortJllContactsDesc = function (x, y) {
        var roles = ['Pursuit Lead - Secondary', 'Pursuit Lead', 'Transaction Manager', 'Account Manager',
                     'Account Director', 'Account Executive', 'Account Lead', 'CRM Oversight', 'CRM'];

        if (x === 'CRM') {
            return 1;
        }
        else if (x === '') {
            return -1;
        }
        else if (y === '') {
            return 1;
        }
        else if (x === 'CRM Oversight') {
            return (y !== 'CRM') ? 1 : -1;
        }
        else if (x === 'Account Lead') {
            return ($.inArray(y, roles.slice(7)) === -1) ? 1 : -1;
        }
        else if (x === 'Account Executive') {
            return ($.inArray(y, roles.slice(6)) === -1) ? 1 : -1;
        }
        else if (x === 'Account Director') {
            return ($.inArray(y, roles.slice(5)) === -1) ? 1 : -1;
        }
        else if (x === 'Account Manager') {
            return ($.inArray(y, roles.slice(4)) === -1) ? 1 : -1;
        }
        else if (x === 'Transaction Manager') {
            return ($.inArray(y, roles.slice(3)) === -1) ? 1 : -1;
        }
        else if (x === 'Pursuit Lead') {
            return ($.inArray(y, roles.slice(2)) === -1) ? 1 : -1;
        }
        else if (x === 'Pursuit Lead - Secondary') {
            return ($.inArray(y, roles.slice(1)) === -1) ? 1 : -1;
        }
        else {
            if ($.inArray(y, roles) > -1) {
                return -1;
            }
            return (x > y) ? -1 : 1;
        }
    };

    var sortJllContactsAsc = function (x, y) {
        var roles = ['Pursuit Lead - Secondary', 'Pursuit Lead', 'Transaction Manager', 'Account Manager',
                     'Account Director', 'Account Executive', 'Account Lead', 'CRM Oversight', 'CRM'];

        if (x === 'CRM') {
            return -1;
        }
        else if (x === '') {
            return 1;
        }
        else if (y === '') {
            return -1;
        }
        else if (x === 'CRM Oversight') {
            return (y !== 'CRM') ? -1 : 1;
        }
        else if (x === 'Account Lead') {
            return ($.inArray(y, roles.slice(7)) === -1) ? -1 : 1;
        }
        else if (x === 'Account Executive') {
            return ($.inArray(y, roles.slice(6)) === -1) ? -1 : 1;
        }
        else if (x === 'Account Director') {
            return ($.inArray(y, roles.slice(5)) === -1) ? -1 : 1;
        }
        else if (x === 'Account Manager') {
            return ($.inArray(y, roles.slice(4)) === -1) ? -1 : 1;
        }
        else if (x === 'Transaction Manager') {
            return ($.inArray(y, roles.slice(3)) === -1) ? -1 : 1;
        }
        else if (x === 'Pursuit Lead') {
            return ($.inArray(y, roles.slice(2)) === -1) ? -1 : 1;
        }
        else if (x === 'Pursuit Lead - Secondary') {
            return ($.inArray(y, roles.slice(1)) === -1) ? -1 : 1;
        }
        else {
            if ($.inArray(y, roles) > -1) {
                return 1;
            }
            return (x > y) ? 1 : -1;
        }
    };

    var blockDetailSubgrid = function ($table) {
        blockGrid($table.parent());
    };

    var blockDetailsTable = function($table) {
        blockGrid($table);
    };

    function blockGrid($element) {
        $element.block({
            message: '<span class="message">Processing</span>&nbsp;<img class="grid-loading-icon" src ="' + url + '" />',
            blockMsgClass: 'loading-overlay',
            overlayCSS: { backgroundColor: 'rgb(190, 190, 190)', filter: "alpha(opacity=80)", opacity: 0.8, "z-index": 1032 },
            css: {
                padding: '14px 0 2px 0',
                width: '250px',
                top: '50%',
                left: '50%',
                textAlign: 'center',
                color: '#999',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'wait',
                "z-index": 1033
            }
        });
    }

    var blockPage = function() {
        $.blockUI({
            message: '<span class="message">Loading...</span>',
            blockMsgClass: 'loading-overlay',
            css: {
                border: 'none',
                width: '30%',
                minHeight: '30px',
                padding: '14px 0 2px 0',
                "z-index": 1033
            },
            overlayCSS: { backgroundColor: 'rgb(190, 190, 190)', filter: 'alpha(opacity=80)', opacity: 0.8, "z-index": 1032 }
        });
    };

    var unblockPage = function() {
        $.unblockUI();
    };

    var unblockDetailSubgrid = function($table) {
        $table.parent().unblock();
    };


    var unblockDetailsTable = function($table) {
        $table.unblock();
    };

    var handleDataTableProcessing = function($table) {
        $table.dataTable().bind("processing",
            function(e, oSettings, bShow) {
                if (bShow) {
                    $table.parent().parent().find(["#", oSettings.sTableId, "_processing"].join('')).hide();
                    if ($table.parent().parent().find(["#", oSettings.sTableId, "_filter input:focus"].join('')).length > 0) {
                        JLL.BlockDetailsTable($table.parent());
                    } else {
                        JLL.BlockDetailSubgrid($table.parent());
                    }
                } else {
                    JLL.UnblockDetailsTable($table.parent());
                    JLL.UnblockDetailSubgrid($table.parent());
                }
            });
    };

    var getUserDisplayLength = function () {
        var key = _localStorageKey + 'userDisplayLength',
            value = parseInt($.Storage.get(key), 10);
        return value || 10;
    };

    var setUserDisplayLength = function (e) {
        var key = _localStorageKey + 'userDisplayLength',
            value = $(e.currentTarget).val();
        $.Storage.set(key, value);
    };

    var filterTableOnEnter = function (tbl) {
        //var tblId = tbl.fnSettings().sTableId;
        //$('#' + tblId + '_filter input').unbind();
        //$('#' + tblId + '_filter input').bind('keyup', function(e) {
        //    if (e.keyCode == 13) {
        //        tbl.fnFilter($(this).val());
        //    }
        //});
    };

    var removeFromArray = function(array, matchFunction) {
        var index = -1;
        $.each(array, function(i, v) {
            if (index == -1 && matchFunction(v)) {
                index = i;
            }
        });

        array.splice(index, 1);
    };

    var loadDialog = function ($button, afterLoad, data) {
        var $dialog;
        $dialog = $($button.attr("href"));

        loadDialogNoButton($dialog, afterLoad, data);
    };

    var loadDialogNoButton = function ($dialog, afterLoad, data) {
        blockElement($dialog);

        $.ajax({
            type: "GET",
            url: $dialog.data("dialogurl"),
            data: data,
            success: function (data) {
                $dialog.html(data)
                if (afterLoad) {
                    afterLoad();
                }
                unblockElement($dialog);
            },
            cache: false
        });
    }

    JLL.AddToHistory = addToHistory;
    JLL.RemoveFromHistory = removeFromHistory;
    JLL.GetHistory = getHistory;
    JLL.HistoryType = historyTypeEnum;
    JLL.GetUserDisplayLength = getUserDisplayLength;
    JLL.SetUserDisplayLength = setUserDisplayLength;

    JLL.BlockPage = blockPage;
    JLL.BlockDetailSubgrid = blockDetailSubgrid;
    JLL.UnblockDetailSubgrid = unblockDetailSubgrid;
    JLL.BlockDetailsTable = blockDetailsTable;
    JLL.UnblockDetailsTable = unblockDetailsTable;
    JLL.BlockElement = blockElement;
    JLL.UnblockElement = unblockElement;
    JLL.UnblockPage = unblockPage;
    JLL.LoadDialog = loadDialog;
    JLL.LoadDialogNoButton = loadDialogNoButton;

    JLL.HandleDataTableProcessing = handleDataTableProcessing;
    JLL.FilterTableOnEnter = filterTableOnEnter;

    JLL.RemoveFromArray = removeFromArray;

    JLL.FormatDate = formatDate;    
    JLL.FormatNumber = formatNumber;
    JLL.FormatDecimal = formatDecimal;
    JLL.FormatCurrency = formatCurrency;
    JLL.FormatExcelExportButton = formatExcelExport;
    JLL.FormatPhoneNumber = formatPhoneNumber;
    JLL.TogglePhoneFormatting = togglePhoneFormatting;
    JLL.DatefromISO = datefromISO;
    
    JLL.GetActivityIconClass = getActivityIconClass;
    JLL.NullSafeString = nullSafeString;

    JLL.SortJllContactsAsc = sortJllContactsAsc;
    JLL.SortJllContactsDesc = sortJllContactsDesc;

    JLL.AddSort = addSort;
    JLL.GetSort = getSort;

    JLL.SaveCountryFilter = saveCountryFilter;
    JLL.GetCountryFilter = getCountryFilter;
    
    JLL.InitGlobalEvents = function (url) {
        var image = new Image();
        image.src = url;
        $('#form-search').on('submit', function (e) {
            var input = $(this).find("input").val();
            if (input.length == 0) {
                e.preventDefault();
                $.growlUI("Please enter a search phrase");
                return false;
            }
            return true;
        });
        if ($("input").placeholder) {
            $("input").placeholder();
        }
    };

    $.extend($.fn.dataTableExt.oStdClasses, {
        "sWrapper": "dataTables_wrapper form-inline"
    });

    JLL.FocusFirstInputOnDialogShown = function ($dialog) {
        $dialog.on('shown', function () {
            $('input:visible:first', $dialog).focus();
        });
    };

    JLL.GetLastSearchUsed = function () {
        var regexResult = new RegExp(/[\\?&]listid=([^&#]*)/).exec(location.search);
        if (regexResult && regexResult.length > 1) {
            return decodeURIComponent(regexResult[1]);
        }

        return null;
    };
    
    // DataTables Plugin to sort formatted numbers
    $.extend(jQuery.fn.dataTableExt.oSort, {
        "formatted-num-pre": function (a) {
            a = (a === "-" || a === "") ? 0 : a.replace(/[^\d\-\.]/g, "");
            return parseFloat(a);
        },

        "formatted-num-asc": function (a, b) {
            return a - b;
        },

        "formatted-num-desc": function (a, b) {
            return b - a;
        }
    });

    // DataTables Plugin to sort dates
    $.extend(jQuery.fn.dataTableExt.oSort, {
        'monthDateYear-pre': function (s) {
            function isValidDate(d) {
                if (Object.prototype.toString.call(d) !== "[object Date]")
                    return false;
                return !isNaN(d.getTime());
            }
            var date = new Date(s.replace('<span>', '').replace('</span>', ''));
            
            return isValidDate(date) ? date : -1;
        },

        'monthDateYear-asc': function (a, b) {
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        },

        'monthDateYear-desc': function (a, b) {
            return ((a < b) ? 1 : ((a > b) ? -1 : 0));
        }
    });
    
    $.fn.dataTableExt.oApi.fnMultiFilter = function (oSettings, oData) {
        for (var key in oData) {
            if (oData.hasOwnProperty(key)) {
                for (var i = 0, iLen = oSettings.aoColumns.length ; i < iLen ; i++) {
                    if (oSettings.aoColumns[i].sTitle == key) {
                        /* Add single column filter */
                        oSettings.aoPreSearchCols[i].sSearch = oData[key];
                        break;
                    }
                }
            }
        }
        this.oApi._fnReDraw(oSettings);
    };
    
    $.fn.dataTableExt.oApi.fnClearColumnFilters = function (oSettings) {
        /* Remove global filter */
        //oSettings.oPreviousSearch.sSearch = "";

        ///* Remove the text of the global filter in the input boxes */
        //if (typeof oSettings.aanFeatures.f != 'undefined') {
        //    var n = oSettings.aanFeatures.f;
        //    for (var i = 0, iLen = n.length ; i < iLen ; i++) {
        //        $('input', n[i]).val('');
        //    }
        //}

        /* Remove the search text for the column filters - NOTE - if you have input boxes for these
         * filters, these will need to be reset
         */
        for (var i = 0, iLen = oSettings.aoPreSearchCols.length ; i < iLen ; i++) {
            oSettings.aoPreSearchCols[i].sSearch = "";
        }

        /* Redraw */
        //oSettings.oApi._fnReDraw(oSettings);
    };

})(jQuery);