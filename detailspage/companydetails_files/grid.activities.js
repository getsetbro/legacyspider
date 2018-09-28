JLL.Grids.ActivityGrid = (function($) {
    var EDITABLE_ACTIVITIES = [4210, 4201, 4212];

    var defaults = {
        tableId: '',
        sDom: '',
        sAjaxSource: '',
        sAjaxDataProp: 'aaData',
        initComplete: null,
        pageSize: 10,
        isMyActivitiesPage: false,
        bServerSide: true,
        drawCallback: null,
    };

    var _activityTable;
    var _altAjaxSource;
    var _tableStore = {};
    var _stopResize = false;

    var createInstance = function (gridConfig) {
        var table = { };
        table._config = $.extend({}, defaults, gridConfig);
        table.$table = $('#' + table._config.tableId);


        var formatActivityType = function (data, type, row) {
            return '<i style="font-size: 1.5em !important;" class="' + JLL.GetActivityIconClass(data) + '"></i>';
        };

        var formatActivity = function (data, type, row) {
            var date = JLL.DatefromISO(row.CreatedOn);
            var dueDate = JLL.DatefromISO(row.DueDate);
            var dateString = '';
            var dueDateString = '';
            if (row.CreatedOn)
                dateString = JLL.FormatDate(date);
            if(row.DueDate)
                dueDateString = JLL.FormatDate(dueDate);

            var clickEvent = !table._config.isMyActivitiesPage
                ? '" onclick="JLL.QuickActivity.loadActivityDataFromDetails(this)">'
                : '" onclick="JLL.QuickActivity.openActivityScreenFromMyActivities(this)">'
            
            var link = $.inArray(data, EDITABLE_ACTIVITIES) >= 0
                ? ('<a oid="' + row.Id +
                    '" oType="' + data +
                    '" class="activity-subject' +
                    clickEvent +
                    (JLL.NullSafeString(row.Subject)) +
                    '</a>')
                : (JLL.NullSafeString(row.Subject));

            var description = (row.Description)
                ? '<div class="span11 activity-description" style="overflow: hidden; text-overflow: ellipsis; height: auto; max-height: 5em;">' +
                    JLL.NullSafeString(row.Description) +
                    '</div>' +
                    '<div class="span1" style="color:#0A0A0A;">' +
                    '<a class="activity-expand-description" onclick="JLL.Grids.ActivityGrid.ToggleDescription(this)">Show All</a>' + 
                    '</div>'
                : '';
            var url = '';
            if (row.Regarding) {
                if (row.Regarding.EntityTypeName == 'account')
                    url = '/Company/Details/' +  row.Regarding.Id;
                else if (row.Regarding.EntityTypeName == 'contact')
                    url = '/Contact/Details/' + row.Regarding.Id;
            }

            var createdInfo = (!table._config.isMyActivitiesPage)
                ? ' by </span><span style="font-weight: bold;">' +
                  (JLL.NullSafeString(row.OwningUserName)) +
                  '</span>'
                : ' for </span><a href="' + (JLL.NullSafeString(row.Regarding ? url :
                '')) + '"><span style="font-weight: bold;">' +
                    (JLL.NullSafeString(row.Regarding ? row.Regarding.DisplayName : '')) +
                    '</a></span>';

            var citySpan = (!table._config.isMyActivitiesPage)
                ?'<div class="span1">In: ' +
                (JLL.NullSafeString(row.UserCity)) +
                '</div>'
                : '';
            var statusSpan = table._config.isMyActivitiesPage
                ? 'span1'
                : 'span1';
            var linkSpan = table._config.isMyActivitiesPage
                ? "span4"
                : "span3";
            
            if (row.Regarding) {
                row.Regarding.toString = function() {
                    return row.Regarding.DisplayName;
                };
            }
            var imageUrl = '/content/images/SpiderLock_Red.png';
            var strhtml = '<div class="row-fluid">' +
                '<div class="span4"><span class="muted">Created:* ' +
                dateString +
                createdInfo +
                '</div>' +
                '<div class="' + linkSpan + '" style="font-style: italic;">' +
                link +
                '</div>' +
                '<div class="' + statusSpan + '">' +
                (JLL.NullSafeString(row.Status)) +
                '</div>' +
                citySpan +
                '<div class="span2" style="color:#0A0A0A;">' +
                (row.DueDate ? 'Due:* ' + dueDateString : '') +
                '</div>';

            if (row.IsPrivate)
                strhtml += '<div class="span1"><img src="' + imageUrl + '"/></div>';

            strhtml += '</div>' +
                '<div class="row-fluid">' +
                description +
                '</div>';
            
            return strhtml;
        };

        

        var formatEntityReference = function (data, type, row) {
            return "<span>" + data.DisplayName + "</span>";
        };

        var formatDate = function(data, type, row) {
            return "<span>" + JLL.FormatDate(data.DisplayName) + "</span>";
        };

        var _initComplete = function(oSettings, json) {
            if (table._config.initComplete) {
                table._config.initComplete(oSettings, json);
            }

            JLL.UnblockDetailSubgrid(table.$table.parent());
        };

        var _drawCallback = function (oSettings, json) {
            if (table._config.drawCallback) {
                table._config.drawCallback(oSettings, json);
            }
            _stopResize = false;
            showExpandDescription();
        };

        var showExpandDescription = function() {
            var descriptions = $(".activity-description");
            descriptions.each(function(index, element) {
                var $element = $(element);
                var expandDescription = $element.siblings('.span1').children('.activity-expand-description');
                if (element.offsetHeight < element.scrollHeight && (element.scrollHeight - element.offsetHeight > parseInt($element.css("font-size"))) ||
                    element.offsetWidth < element.scrollWidth) {
                    expandDescription.show();
                } else if (expandDescription.is(":visible")) {
                    if (expandDescription[0].innerHTML === "Close") {
                        toggleDescription(expandDescription[0]);
                        _stopResize = false;
                    }
                    expandDescription.hide();
                }
            });
        };

        $(window).resize(function () {
            if (!_stopResize || !window.document.documentMode || window.document.documentMode >8) {
                showExpandDescription();
            }
            _stopResize = false;
        });

        table._table = table.$table.dataTable({
            sDom: table._config.sDom,
            sPaginationType: 'bootstrap',
            sAjaxSource: table._config.sAjaxSource,
            sAjaxDataProp: table._config.sAjaxDataProp,
            fnInitComplete: _initComplete,
            oLanguage: {
                sSearch: 'Narrow Your Results:',
                sEmptyTable: "No Data Available"
            },
            fnDrawCallback: _drawCallback,
            aoColumns: [
                { sTitle: '', mData: 'Id', bVisible: false },//0
                { sTitle: '', mData: 'ActivityType', mRender: formatActivityType, sClass: "span1" },//1
                { sTitle: '', mData: 'ActivityType', mRender: formatActivity },//2
                { sTitle: 'Subject', mData: 'Subject', bVisible: false},//3
                { sTitle: 'Regarding', mData: 'Regarding', bVisible: false},//4
                { sTitle: 'Description', mData: 'Description', bVisible: false},//5                
                { sTitle: 'Start Date', mData: 'ScheduledStart', bVisible: false },//6
                { sTitle: 'Due Date', mData: 'ScheduledEnd', bVisible: false },//7
                { sTitle: 'Owner', mData: 'OwningUserName', bVisible: false },//8
                { sTitle: 'Status', mData: 'Status', bVisible: false },//9
                { sTitle: '', mData: 'CreatedOn', bVisible: false },//10
                { sTitle: '', mData: 'IsActive', bVisible: false }//11
            ],
            aaSorting: [[10, 'desc']],
            bProcessing: true,
            bServerSide: table._config.bServerSide,
            sServerMethod: "POST",
            iDisplayLength: table._config.pageSize
            
        });
        
        JLL.BlockDetailSubgrid(table._table.parent());
        JLL.HandleDataTableProcessing(table._table);

        _activityTable = table._table; //This can probably be removed?
        _tableStore[table._config.tableId] = table._table;
        //sort("createdon", "desc", table._config.tableId);
        return table;
    };

    var sort = function (attribute, sortOrder, tableId) {
        switch (attribute) {
            case "createdon":
                _tableStore[tableId].fnSort([[10, sortOrder]]);
                break;
            case "ownerid":
                _tableStore[tableId].fnSort([[8, sortOrder]]);
                break;
            case "statuscode":
                _tableStore[tableId].fnSort([[9, sortOrder]]);
                break;
            case "regardingid":
                _tableStore[tableId].fnSort([[5, sortOrder]]);
                break;
        }

    }

    var refreshInstance = function (table, callback) {
        if (table && table._table) {
            table._table.fnReloadAjax(null, table._config.updateCounts);
        }
    };

    var toggleDescription = function (linkNode) {
        var isCollapsed = (linkNode.innerHTML === 'Show All'),
            $description = $(linkNode).parent().siblings('.activity-description'),
            maxHeight = (isCollapsed) ? 'none' : '5em';
        _stopResize = true;
        linkNode.innerHTML = (isCollapsed) ? 'Close' : 'Show All';
        $description.css('max-height', maxHeight);
    }

    var setSort = function (that, tableId) {
        var toggle = $(that).parents("div.dropdown:first").children("a.dropdown-toggle");
        toggle.html($(that).html() + '<b class="caret"></b>');

        var attribute = $(that).attr("attribute");
        toggle.attr("attribute", attribute);

        var order = $(that).attr('order');
        var tableId = $(that).closest('.detailSection').find('table').attr('id');
        if (!tableId) {
            //Is my activities page
            tableId = 'my-activities';
        }
        sort(attribute, order, tableId);
    }

    var setFutureFilter = function (that, ajaxSource) {
        var toggle = $(that).parents("div.dropdown:first").children("a.dropdown-toggle");
        toggle.html($(that).html() + '<b class="caret"></b>');
        var setting = _activityTable.fnSettings();
        var initialSource = setting.sAjaxSource;
        setting.sAjaxSource = ajaxSource;
        if (setting.sAjaxSource !== initialSource) {
            _activityTable.fnReloadAjax(null, function () {
                JLL.UnblockDetailSubgrid(_activityTable);
            });
            JLL.BlockDetailSubgrid(_activityTable);
        }
    }

    return {
        CreateInstance: createInstance,
        RefreshInstance: refreshInstance,
        ToggleDescription: toggleDescription,
        setSort: setSort,
        setFutureFilter: setFutureFilter
    };

})(jQuery);