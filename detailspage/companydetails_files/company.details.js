JLL.Company.Details = function() {

    var _companyActivitiesTable;
    var _companymyActivitiesTable;
    var _companyLeasesTable;
    var _companySalesTable;
    var _contactsTable;
    var _jllContactsTable;

    var _openOpsTable;
    var _openOpsLoaded = false;
    var _closedOpsTable;
    var _closedOpsLoaded = false;
   

    var _config = {
        id: '',
        displayName: '',
        url: '',
        leaseJsonUrl: '',
        leaseDetailUrl: '',
        contactJsonUrl: '',
        contactDetailsUrl: '',
        activityJsonUrl: '',
        addToListUrl: '',
        jllcontactJsonUrl: '',
        propertyDetailsUrl: '',
        addToHistory: '',
        createListUrl: '',
        privateActivitiesJsonUrl:''
    };

    var init = function(config) {
        $.extend(_config, config);

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: _config.addToHistory,
            data: {
                id: _config.id,
                type: "Company"
            },
            success: function (url) {

            },
            error: function () {
                console.log('Error while saving company history Information.');
            }
        });


        JLL.AddToHistory(_config.id, _config.displayName, _config.url, JLL.HistoryType.COMPANY);
        
        $(".staticlist").StaticListControl(
                {
                    listType: "account",
                    recordId: _config.id,
                    getListsUrl: _config.staticListsUrl,
                    getRelatedListsUrl: _config.relatedListsUrl,
                    addToListUrl: _config.addToListUrl,
                    removeFromListUrl: _config.removeFromListUrl,
                    createListUrl: _config.createListUrl
                });

        loadLeases();
        loadContacts();
        loadActivities();
        loadMyActivities();
        loadJllContacts();
        loadSales();
        loadOpportunities();
    };

    var getOpportunityCount = function (callback) {
        var opportunityCount;
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: _config.opportunityCountUrl,
            success: function (data) {
                opportunityCount = data;
                callback(opportunityCount);
            },
            error: function () {
                console.log('Error while getting opportunity count');
            }
        });
    };

    var formatEntityReference = function (data, type, row) {
        return "<span>" + data.DisplayName + "</span>";
    };    

    var formatCheckbox = function (data, type, row) {
        if (data) {
            return "<span><input type='checkbox' disabled='disabled' checked='checked' /></span>";
        }
        else {
            return "<span><input type='checkbox' disabled='disabled' /></span>";
        }
    };
    
    var formatLeaseAddress = function (data, type, row) {
        var value = "<a href='" + _config.leaseDetailsUrl + "/" + row.Id + "'>";

        value += data.DisplayName + "<br/>";

        value += '<div>';

        value += formatCSZ(row);

        value += '</div></a>';
        return value;
    };

    var formatContactCSZ = function(data, type, row) { return formatCSZ(row, false); };
    var formatCSZ = function(row, showCountry) {
        var value = "";
        if (row.City)
            value += row.City;

        if (row.City && row.State)
            value += ", ";

        if (row.State)
            value += row.State;

        if (showCountry && row.Country)
            value += " " + JLL.NullSafeString(row.Country.DisplayName);
        return value;
    };

    var loadJllContacts = function () {
        $.fn.dataTableExt.oSort['jllcontact-role-desc'] = JLL.SortJllContactsDesc;
        $.fn.dataTableExt.oSort['jllcontact-role-asc'] = JLL.SortJllContactsAsc;

        var $contactsGrid = $('#jllcontact-results-table');
        _jllContactsTable = $contactsGrid.dataTable({
            sDom: "<'row'<'span5'><'span5'f>r>t<'row'<'#jllcontact-buttons'><'span5'p>>",
            sPaginationType: 'bootstrap',
            sAjaxSource: _config.jllcontactJsonUrl,
            sAjaxDataProp: '',
            oLanguage: {
                sSearch: 'Narrow Your Results:',
                sEmptyTable: "No Data Available"
            },
            fnInitComplete: function (oSettings, json) {
                initComplete(oSettings, json);
                JLL.UnblockDetailSubgrid($contactsGrid);
            },
            aoColumns: [
                { sTitle: '', mData: 'Id', bVisible: false },
                { sTitle: 'Name', mData: 'Name', mRender: elipsisSpan },
                { sTitle: 'Region', mData: 'Region' },
                { sTitle: 'City', mData: 'City', mRender: elipsisSpan },
                { sTitle: 'State', mData: 'State' },
                { sTitle: 'Country', mData: 'Country', mRender: elipsisSpan },
                { sTitle: 'Business Line', mData: 'BusinessLine', mRender: elipsisSpan },
                { sTitle: 'Role', mData: 'Role', sType: 'jllcontact-role' }
            ],
            aaSorting: [[7, 'asc']],
            bProcessing: true,
            iDisplayLength: 10
        });

        JLL.BlockDetailSubgrid($contactsGrid);
        
        $('#btn-addcontact').on('click', function () {
            loadContactDialog();
        });

        $('#jllcontact-buttons')
            .addClass('span5');

        if ($("#dlg-addjllcontact").length > 0) {
            $('#jllcontact-buttons')
                .html(addJLLContactButtonHtml);

            $('#btn-addjllcontact').on('click', function () {
                if (JLL && JLL.AddJllContact) {
                    JLL.AddJllContact.ClearValues();
                }
                else {
                    loadJllContactDialog();
                }
            });
            $('#btn-addjllcontact-me').on('click', function () {
                if (JLL && JLL.AddJllContact) {
                    JLL.AddJllContact.SetAsSelf();
                }
                else {
                    loadJllContactDialog(true);
                }
            });
            
        }

        $contactsGrid.find('th').eq(6).click(function () {
            _jllContactsTable.fnSettings().aoColumns[7].sType = 'string';
        });
    };

    var loadContactDialog = function () {
        JLL.LoadDialog($('#btn-addcontact'),function () {
            JLL.Contact.Create.config.CurrentEntity = 'CompanyDetails';
            JLL.Contact.Create.setParentCompanyField(_config.id, _config.displayName);
        },
            { Id: _config.id });
    };

    var loadJllContactDialog = function (asMe) {

        JLL.LoadDialog($('#btn-addjllcontact'),
            function () {
                if (asMe) {
                    JLL.AddJllContact.SetAsSelf();
                }
            },
            { Id: _config.id });
    };
    
    var loadLeases = function() {
        _companyLeasesTable = JLL.Grids.LeaseGrid.CreateInstance({
            tableId: "lease-results-table",
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sAjaxSource: _config.leaseJsonUrl,
            leaseDetailsUrl: _config.leaseDetailUrl,
            showInternalContact: false,
            showRent: false,
            showTenant: false,
            initComplete: initComplete
        });
    };

    var formatEmail = function (data, type, row) {
        if (data)
            return "<a href='mailto:" + data + "'>" + data + "</a>";
        else
            return "";
    };

    var formatSize = function (data, type, row) {
        var safeData = JLL.FormatNumber(data) + " sqft";
        return "<span>" + safeData + "</span>";
    };

    var formatMoney = function (data, type, row) {
        var safeData = JLL.FormatCurrency(data, row.CurrencySymbol);
        return "<span>" + safeData + "</span>";
    };
    
    var formatPhones = function (data, type, row) {
        var value = "<span>";
        if (row.OfficePhone) {
            value += "Office:&nbsp;" + row.OfficePhone;
            if (row.MobilePhone)
                value += "</span><br /><span>";
        }
        if (row.MobilePhone)
            value += "Mobile:&nbsp;" + row.MobilePhone;
        value += "</span>";

        return value;
    };

    var formatName = function (data, type, row) {
        return elipsisSpan("<span><a href='" + _config.contactDetailsUrl + "/" + row.Id + "'>" + JLL.NullSafeString(row.DisplayName) + "</a></span>"
            + "</br><span class='muted'>" + JLL.NullSafeString(row.JobTitle) + "</span>");
    };

    var elipsisSpan = function(string) {
        return "<span class='ellipsis'>" + string + "</span>";
    };

    var loadActivities = function () {
        _companyActivitiesTable = JLL.Grids.ActivityGrid.CreateInstance({
            tableId: 'activity-results-table',
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sAjaxSource: _config.activityJsonUrl,
            sAjaxDataProp: 'aaData',
            initComplete: initComplete,
            drawCallback: function (settings) {
                refreshGridCounts(settings);
            }
        });
    };

    var loadMyActivities = function () {
        _companymyActivitiesTable = JLL.Grids.ActivityGrid.CreateInstance({
            tableId: 'myactivity-results-table',
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sAjaxSource: _config.privateActivitiesJsonUrl,
            sAjaxDataProp: 'aaData',
            initComplete: initComplete,
            drawCallback: function (settings) {
                refreshGridCounts(settings);
            }
        });
    };

    var loadSales = function () {
        _companySalesTable = JLL.Grids.SalesGrid.CreateInstance({
            tableId: 'sales-results-table',
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sAjaxSource: _config.companySalesJsonUrl,
            sAjaxDataProp: 'aaData',
            initComplete: initComplete,
            propertyDetailsUrl : _config.propertyDetailsUrl
        });
    };

    var loadOpportunities = function() {
        _openOpsTable = JLL.Grids.OpportunityGrid.CreateInstance({
            tableId: 'open-opportunity-results-table',
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sAjaxSource: _config.openOpportunitiesJsonUrl,
            sAjaxDataProp: 'aaData',
            isOpen: true,
            initComplete: oppsInitComplete,
            pageSize: 10
        });
        
        _closedOpsTable = JLL.Grids.OpportunityGrid.CreateInstance({
            tableId: 'closed-opportunity-results-table',
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sAjaxSource: _config.closedOpportunitiesJsonUrl,
            isOpen: false,
            initComplete: oppsInitComplete,
            pageSize: 10
        });
    };

    var oppsInitComplete = function (oSettings, json) {
        
        if (oSettings.sTableId === 'closed-opportunity-results-table') _closedOpsLoaded = true;
        if (oSettings.sTableId === 'open-opportunity-results-table') _openOpsLoaded = true;

        if (_openOpsLoaded && _closedOpsLoaded) {
            var closedCount = _closedOpsTable.$table.dataTable().fnSettings().fnRecordsTotal()
            var openCount = _openOpsTable.$table.dataTable().fnSettings().fnRecordsTotal();
            getOpportunityCount(function (count) {
                var tableUpdate = ".update-from-opportunity-results-table";
                $(tableUpdate).each(function () {
                    if (count) {
                        this.innerHTML = this.innerHTML + '<span class="details-menu-count">(' + count + ')</span>';
                    }
                    else {
                        this.innerHTML = this.innerHTML + '<span class="details-menu-count">(0)</span>';
                    }
                });
            });
        }
    };
    
    var initComplete = function (oSettings, json) {
        var sourceTable = ".update-from-" + oSettings.sTableId;
        $(sourceTable).each(function () {
            var count = (json === undefined) ? oSettings.fnRecordsTotal() : json.length;
            if (count) {
                this.innerHTML = this.innerHTML + '<span class="details-menu-count">(' + count + ')</span>';                
            }
            else {
                this.innerHTML = this.innerHTML + '<span class="details-menu-count">(0)</span>';
            }
        });
    };
    
    var loadContacts = function() {
        var $contactsGrid = $('#contact-results-table');
        _contactsTable = $contactsGrid.dataTable({
            sDom: "<'row'<'span5'><'span5'f>r><'tableParentDiv' t<'row'<'span5 offset5'p>>>",
            sPaginationType: 'bootstrap',
            sAjaxSource: _config.contactJsonUrl,
            sAjaxDataProp: 'aaData',
            bServerSide: true,
            aaSorting: [[1, "asc"]], // zero-based sort index
            oLanguage: {
                sSearch: 'Narrow Your Results:',
                sEmptyTable: "No Data Available"
            },
            fnInitComplete: function(oSettings, json) {
                initComplete(oSettings, json);
                JLL.UnblockDetailSubgrid($contactsGrid);
            },
            aoColumns: [
                { sTitle: '', mData: 'Id', bVisible: false },
                { sTitle: 'Last Name', mData: 'LastName', bVisible: false },
                { sTitle: 'Name/Title', mData: 'JobTitle', aDataSort: [1, 13], mRender: formatName },
                { sTitle: 'Email', mData: 'Email', mRender: formatEmail },
                { sTitle: 'City/State', mData: 'City', aDataSort: [4, 5], mRender: formatContactCSZ },
                { sTitle: 'State', mData: 'State', bVisible: false },
                { sTitle: 'Country', mData: 'Country', bVisible: false },
                { sTitle: 'Contactable By', mData: 'ContactableBy' },
                { sTitle: 'Primary JLL Contact', mData: 'JLLContact' },
                { sTitle: 'Phones', mData: 'OfficePhone', mRender: formatPhones, sWidth: '200px' },
                { sTitle: 'Office', mData: 'OfficePhone', bVisible: false },
                { sTitle: 'Mobile', mData: 'MobilePhone', bVisible: false },
                { sTitle: '', mData: 'DisplayName', bVisible: false },
                { sTitle: '', mData: 'FirstName', bVisible: false }
            ],
            bProcessing: true,
            iDisplayLength: 10            
        });

        JLL.BlockDetailSubgrid($contactsGrid);
        JLL.HandleDataTableProcessing($contactsGrid);
    };

    var refreshGridCounts = function (oSettings,json) {
        var sourceTable = ".update-from-" + oSettings.sTableId;
        $(sourceTable).each(function () {
            var count = (json === undefined) ? oSettings.fnRecordsTotal() : json.length;

            var $countSpan = $("a.details-menu-count").siblings('span');

            if (count) {
                $(sourceTable + ' span ').html('(' + count + ')');
            } else {
                $(sourceTable + ' span ').html('(0)');
            }
        });
    };
    
    var refreshActivitiesGrid = function() {
        JLL.Grids.ActivityGrid.RefreshInstance(_companyActivitiesTable,
            function (oSettings) {
                var sourceTable = ".update-from-" + oSettings.sTableId;
                $(sourceTable).each(function () {
                    var count = oSettings.fnRecordsTotal();
                    var $countSpan = $(".details-menu-count", this);

                    if (count) {
                        $countSpan.html('(' + count + ')');
                    } else {
                        $countSpan.html('(0)');
                    }
                });
            });

        JLL.Grids.ActivityGrid.RefreshInstance(_companymyActivitiesTable,
            function (oSettings) {
                var sourceTable = ".update-from-myactivity-results-table" ;
                $(sourceTable).each(function () {
                    var count = oSettings.fnRecordsTotal();
                    var $countSpan = $(".details-menu-count", this);

                    if (count) {
                        $countSpan.html('(' + count + ')');
                    } else {
                        $countSpan.html('(0)');
                    }
                });
            });

    };

    var refreshContactsGrid = function () {
        if (_contactsTable) {
            _contactsTable.fnReloadAjax(null, refreshGridCounts);
       }
    };

    var refreshJllContactsGrid = function () {
        if (_jllContactsTable)
            _jllContactsTable.fnReloadAjax(null, refreshGridCounts);
    };

    return {
        init: init,
        refreshActivitiesGrid: refreshActivitiesGrid,
        refreshJllContactsGrid: refreshJllContactsGrid,
        refreshContactsGrid: refreshContactsGrid
    };
}();