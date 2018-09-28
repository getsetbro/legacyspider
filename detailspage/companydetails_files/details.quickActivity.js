// Set up all global namespaces for javascript files to use

JLL.QuickActivity = function () {
    var PHONECALL = 4210;
    var APPOINTMENT = 4201;
    var TASK = 4212;
    var NULLDATE = "0001-01-01T00:00:00";

    var userSecurity = {
        JllActivity1MonthNextCallDate: false,
        JllActivity3MonthsNextCallDate: false,
        JllActivityCallBusinessTypeRequired: false,
        JllActivityNoDefaultNextCallDate: false,
        JllActivityNoDueDateNoEmailRemainder: false,
        JllActivityAutoCreateNewCallDate: false
    };
    var isloaded = false;
    var isPinned = false;
    var validRecordTypes = null;

    var regardingOptions = {
        account: [
            { entity: "opportunity", label: "Opportunity" },
            { entity: "awx_lease", label: "Lease" },
            { entity: "awx_propertysale", label: "Sale" }
        ],
        contact: [
            { entity: "opportunity", label: "Opportunity" },
            { entity: "awx_lease", label: "Lease" },
            { entity: "awx_propertysale", label: "Sale" }
        ],
        awx_lease: [],
        awx_property: []
    };

    var _config = {
        getUserSecurity: '',
        getActivityUrl: '',
        createPhoneCallUrl: '',
        createAppointmentUrl: '',
        createTaskUrl: '',
        getRelatedRecordsUrl: '',
        getUserListsUrl : '',
        isSearchResultsPage: false,
        activitiesGridRefreshMethod: null,
        parentCompanyId: ''
    };

    var $userListLoading = $('#user-list-loading');
    var pvtconfirmModal =
              $('<div class="modal fade">' +
                  '<div class="modal-dialog">' +
                  '<div class="modal-content">' +
                  '<div class="modal-header">' +
                    '<a class="close" data-dismiss="modal" >&times;</a>' +
                    '<h4>' + 'Confirm (Message to be displayed till 10/04/2018)' + '</h4>' +
                  '</div>' +

                  '<div class="modal-body">' +
                    '<p>' + 'Are you sure you want to create a private activity? <br/>Only you will be able to see it unless you choose to share publicly by updating the activity?' + '</p>' +
                  '</div>' +

                  '<div class="modal-footer">' +
                    '<a href="#!" id="cancelpvtButton" class="btn">Cancel</a>' +
                    '<a href="#!" id="savepvtButton" class="btn btn-primary" data-loading-text="Saving">Save Private</a>' +
                  '</div>' +
                  '</div>' +
                  '</div>' +
                '</div>');

    var publicconfirmModal =
              $('<div class="modal fade">' +
                  '<div class="modal-dialog">' +
                  '<div class="modal-content">' +
                  '<div class="modal-header">' +
                    '<a class="close" data-dismiss="modal" >&times;</a>' +
                    '<h4>' + 'Confirm (Message to be displayed till 10/04/2018)' + '</h4>' +
                  '</div>' +

                  '<div class="modal-body">' +
                    '<p>' + 'Are you sure you want to create a public activity? <br/>Everyone will be able to see this activity. To keep this activity to yourself select "cancel" and switch to "private".' + '</p>' +
                  '</div>' +

                  '<div class="modal-footer">' +
                    '<a href="#!" id="cancelpubButton" class="btn" >Cancel</a>' +
                    '<a href="#!" id="savepubButton" class="btn btn-primary" data-loading-text="Saving">Save Public</a>' +
                  '</div>' +
                  '</div>' +
                  '</div>' +
                '</div>');


    var init = function (config) {
        $.extend(_config, config);

        $(document).mouseup(function (e) {
            var $container = $("#pop-out-container");

            //need to see if the target is part of a "datepicker dropdown-menu"
            var isInDatePicker = $(e.target).parents(".datepicker.dropdown-menu");

            if ($container.has(e.target).length === 0
                && !isPinned
                && isInDatePicker.length == 0
                && $container.hasClass("spanShowQuickActivity")
                && e.target.id != 'savepvtButton'
                && e.target.id != 'savepubButton'
                && e.target.id != 'cancelpvtButton'
                && e.target.id != 'cancelpubButton')
            {
                toggleVisibility();
            }
        });

        

        $.ajax({
            type: "POST",
            url: _config.getUserSecurity,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                userSecurity = response;

                if (userSecurity.JllActivityCallBusinessTypeRequired) {
                    $("#callType span, #businessTypePhoneCall span, #businessTypeAppointment span").show();
                }

                $("#pop-out-tab-container, #close-quickactivity").live("click", false, toggleVisibility);
                if (_config.isSearchResultsPage) {
                    $("#pop-out-container").hide();
                    $("#cancel-quick-activity").live("click", closeCompletely);
                }
                else {
                    $("#cancel-quick-activity").hide();
                    $("#cancel-quick-activity").live("click", closeAndClear);
                }

                isloaded = true;
            },
            error: function (a, b, c) {
                alert("Error loading security roles: " + b);
            }
        });

        $("#pin-quickactivity").live("click", togglePin);
        

        $("#activities").find("#appointment,#task,#phonecall").live("click", toggleSelectedActivity);

        $(".date").datepicker();
        
        
        $("#btn-left-message").live("click", setLeftMessageDefaults);
        $("#btn-traded-message").live("click", setTradedMessageDefaults);

        $("#saveAsCompleted").live('click', setPhoneCallDueRequired);
        setPhoneCallDueRequired();
        $("#originalstartdateparent").live("changeDate", setAppointmentEndDate);
        $("[field='originalstartdate-time']").live("change", setAppointmentEndDate);

        $("select[field$='time']").each(function () {
            var $select = $(this);

            for (var h = 0; h < 24; h++) {
                var pm = h >= 12;
                var num = h % 12;
                if (pm && num == 0)
                    num = 12;
                $select.append("<option hours='" + h + "' minutes='" + 0 + "'>" + (num < 10 ? "0" + num : num) + ":00 " + (pm ? "PM" : "AM") + "</option>");
                $select.append("<option hours='" + h + "' minutes='" + 30 + "'>" + (num < 10 ? "0" + num : num) + ":30 " + (pm ? "PM" : "AM") + "</option>");
            }
        });

        setDefaultDates();

        resetRegardingField();
        $("[field='qa_regarding-entity']").live("change", setRegardingState);

        

        $('#search-user-list').typeahead({
            source: function (query, process) {
                $userListLoading.show();
                return $.ajax({
                    url: _config.getUserListsUrl,
                    type: 'post',
                    dataType: 'json',
                    data: { search: query },
                    success: function (result) {
                        var resultList = new Array();
                        //var existingUserLists = _userListGrid.Ids();

                        // filter out marketing lists the person is already on.
                        $.each(result, function (i, e) {
                            //if ($.inArray(e.Id, existingUserLists) >= 0)
                            //    return;

                            resultList.push(JSON.stringify({ id: e.Id, name: e.FullName }));
                        });

                        $userListLoading.hide();
                        return process(resultList);
                    }
                });
            },
            matcher: function (obj) {
                var item = JSON.parse(obj);
                if (item.name != null)
                  return ~item.name.toLowerCase().indexOf(this.query.toLowerCase());
            },
            sorter: function (items) {
                var beginswith = [], caseSensitive = [], caseInsensitive = [], item, aItem;
                while (aItem = items.shift()) {
                    item = JSON.parse(aItem);
                    if (!item.name.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(JSON.stringify(item));
                    else if (~item.name.indexOf(this.query)) caseSensitive.push(JSON.stringify(item));
                    else caseInsensitive.push(JSON.stringify(item));
                }

                return beginswith.concat(caseSensitive, caseInsensitive);
            },
            highlighter: function (obj) {
                var item = JSON.parse(obj);
                var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
                return item.name.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                    return '<strong>' + match + '</strong>';
                });
            },
            updater: function (obj) {
                var item = JSON.parse(obj);
                $('#selected-userlist-id').attr('value', item.id);
                return item.name;
            },
            items: 10,
            minLength: 2
        });
        
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

    var refreshGridCounts = function (oSettings) {
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
    };

    var setDefaultDates = function () {
        var $phoneDueDate = $("[field='scheduledend-phonecall']");
        var $taskDueDate = $("[field='scheduledend-task']");
        var $apptStartDate = $("[field='originalstartdate']");
        var $apptEndDate = $("[field='scheduledendappt']");

        var currentDateTime = new Date();
        var apptEndTime = new Date();
        apptEndTime.setMinutes(currentDateTime.getMinutes() + 30);

        $phoneDueDate.datepicker('setValue', currentDateTime);
        setTimePickerValue('[field="scheduledend-phonecall-time"]', currentDateTime);

        $taskDueDate.datepicker('setValue', currentDateTime);
        setTimePickerValue('[field="scheduledend-task-time"]', currentDateTime);

        $apptStartDate.datepicker('setValue', currentDateTime);
        $apptEndDate.datepicker('setValue', currentDateTime);
        setTimePickerValue('[field="originalstartdate-time"]', currentDateTime);
        setTimePickerValue('[field="scheduledendappt-time"]', apptEndTime);
    }

    var setTimePickerValue = function (timeSelector, timeObject) {
        var $timeSelect = $(timeSelector);
        var hours = timeObject.getHours();
        var minutes = timeObject.getMinutes();

        if (minutes >= 30) {
            minutes = 0;
            hours = hours + 1;
        }
        else if (minutes < 30 && minutes > 0) {
            minutes = 30;
        }

        $timeSelect
            .find('[hours="' + hours + '"][minutes="' + minutes + '"]')
            .attr('selected', 'selected');
    }

    var setAppointmentEndDate = function () {
        var $startDate = $("[field='originalstartdate']");
        var $startTime = $("[field='originalstartdate-time'] option:selected");

        var $endDate = $("[field='scheduledendappt']");

        var start = new Date($startDate.val());
        if ($startTime.attr("minutes") == "30")
            start.setHours(Number($startTime.attr("hours")) + 1);
        else {
            start.setHours(Number($startTime.attr("hours")), 30);
        }

        $endDate.datepicker('setValue', start);

        selectTime("[field='scheduledendappt-time']", start);
    };

    var togglePin = function () {
        var $pin = $("#pin-quickactivity");

        $pin.toggleClass("btn-primary").toggleClass("active");

        isPinned = $pin.hasClass("btn-primary");
    };

    
    var setPhoneCallDueRequired = function () {
        var $that = $("#saveAsCompleted");
        var $dueDates = $("#phoneCallDueDate span, #taskDueDate span");

        if ($that.is(":checked")
            || userSecurity.JllActivityNoDueDateNoEmailRemainder) {
            $dueDates.hide();
        }
        else {
            $dueDates.show();
        }
    };

    var setLeftMessageDefaults = function () {
        var $that = $(this);

        if ($that.hasClass("active")) {
            $that.removeClass("active");
            $("[field='subject']").val("");
            $("[field='description']").val("");
            $("[field='avajll_calltype']").find("option:first").attr("selected", "selected");
            $("[field='avajll_leftmessage']").prop("checked", false);
            $("[field='avajll_tradedmessage']").prop("checked", false);
            return false;
        }

        var today = new Date();
        $("[field='subject']").val("Left Message on " + today.toLocaleDateString());
        $("[field='description']").val("Left Message on " + today.toLocaleDateString());
        $("[field='avajll_calltype']").find("option[value='4']").attr("selected", "selected");
        $("[field='avajll_leftmessage']").prop("checked", true);
        $("[field='avajll_tradedmessage']").prop("checked", false);
    };

    var setTradedMessageDefaults = function () {
        var $that = $(this);

        if ($that.hasClass("active")) {
            $that.removeClass("active");
            $("[field='subject']").val("");
            $("[field='description']").val("");
            $("[field='avajll_calltype']").find("option:first").attr("selected", "selected");
            $("[field='avajll_leftmessage']").prop("checked", false);
            $("[field='avajll_tradedmessage']").prop("checked", false);
            return false;
        }

        var today = new Date();
        $("[field='subject']").val("Traded Message on " + today.toLocaleDateString());
        $("[field='description']").val("Traded Message on " + today.toLocaleDateString());
        $("[field='avajll_calltype']").find("option[value='4']").attr("selected", "selected");
        $("[field='avajll_tradedmessage']").prop("checked", true);
        $("[field='avajll_leftmessage']").prop("checked", false);
    };

    var toggleSelectedActivity = function () {
        var $this = $(this);
        var $parent = $this.parent();
        var $data = $("#pop-out-data");

        $parent.children("[id]").removeClass("btn-primary");
        $this.addClass("btn-primary");

        $data.find(".section").each(function () {
            var section = $(this);
            if (section.hasClass($this[0].id)) {
                section.show();
            }
            else {
                section.hide();
            }
        });
    };

    var closeCompletely = function () {
        clearFields();

        var $container = $("#pop-out-container");
        $container.hide("slide", { direction: "right" }, 500);
        
    };

    var closeAndClear = function () {
        clearFields();

        $("#activities").find("#appointment,#task,#phonecall").removeAttr("disabled");

        toggleVisibility(false);

        $("#cancel-quick-activity").hide();
    };

    var newActivity = function () {
        var defaultuser = $("#search-user-list").attr("defaultvalue");
        $("#search-user-list").val(defaultuser);
        var userid = $("#selected-userlist-id").attr("defaultvalue");
        $("#selected-userlist-id").val(userid);

        
        clearFields();
        $("#activities").find("#appointment,#task,#phonecall").removeAttr("disabled");
        $("#cancel-quick-activity").hide();

        toggleVisibility();
    }

    /* Generic Confirm func */
    function confirmPrivate(heading, question, cancelButtonTxt, okButtonTxt, callback) {
        pvtconfirmModal.find('#savepvtButton').off();
        pvtconfirmModal.find('#cancelpvtButton').off();
        pvtconfirmModal.find('#savepvtButton').click(function (event) {
            save();
        });

        pvtconfirmModal.find('#cancelpvtButton').click(function (event) {
            pvtconfirmModal.modal('hide');
        }); 
        
        pvtconfirmModal.modal('show');
    };

    function confirmPublic(heading, question, cancelButtonTxt, okButtonTxt, callback) {
        publicconfirmModal.find('#savepubButton').off();
        publicconfirmModal.find('#cancelpubButton').off();

        publicconfirmModal.find('#savepubButton').click(function (event) {
            save();
        });

        publicconfirmModal.find('#cancelpubButton').click(function (event) {
            publicconfirmModal.modal('hide');
        });



        publicconfirmModal.modal('show');
    };
    /* END Generic Confirm func */

    var toggleVisibility = function (keepOpen) {
        if (isloaded) {
            
            var $container = $("#pop-out-container");
            if ($container.hasClass("spanShowQuickActivity") && keepOpen === true) {
                $container.show();
                return;
            }
            else if (!$container.hasClass("spanShowQuickActivity")) {
                $container.show();
            }
            $container.toggleClass("spanpeek", 250);
            $container.toggleClass("spanShowQuickActivity",250);

            $("#pop-out-data, #pop-out-tab-container").toggle();
        }
        
    };

    var clearFields = function () {
        $("[field='subject']").val('').removeAttr("disabled");
        $("[field='description']").val('').removeAttr("disabled");
        
        $("[field='avajll_calltype']").val('').removeAttr("disabled");
        $("[field^='scheduledend']:not([field$='time'])").val('').removeAttr("disabled");
        $("[field$='time'] option[minutes='0'][hours='0']").attr("selected", "selected");
        $("[field$='time']").removeAttr("disabled");
        $("[field='avajll_nextcalldate']").val('').removeAttr("disabled");
        $("[field^='avajll_businesstype']").val('').removeAttr("disabled");
        $("[field='originalstartdate']").val('').removeAttr("disabled");
        $("[field='scheduledendappt']").val('').removeAttr("disabled");
        $("[field='avajll_scheduledstart']").val('').removeAttr("disabled");
        $(":checked").removeAttr("checked");
        $("input[type='checkbox']").removeAttr("disabled");
        $('#save-quick-activity').button('reset').show();
        $("#phoneCallDueDate span, #taskDueDate span").show();

        $("#quickActivityId").val('');
        $("#cancel-quick-activity").hide();
        $("#activities").find("#appointment,#task,#phonecall").removeAttr("disabled");
        $('#record-name').html('').removeAttr("disabled");

        $("[field='qa_regarding-entity']").removeAttr("disabled");

        $('#saveAsCompleted').attr("checked", "checked");

        $("#btn-left-message, #btn-traded-message").removeClass("active");
    
        
        $("#make_public").prop('disabled', false);
        $("#make_private").prop('disabled', false);
        $("#make_private").trigger("click");
        $('#savepvtButton').button('reset');
        $('#savepubButton').button('reset');

        setDefaultDates();
        resetRegardingField();
        setPhoneCallDueRequired();
    };

    var disableFields = function () {
        $("[field='subject']").attr("disabled", "disabled");
        $("[field='description']").attr("disabled", "disabled");
        
        $("[field='avajll_calltype']").attr("disabled", "disabled");
        $("[field^='scheduledend']:not([field$='time'])").attr("disabled", "disabled");
        $("[field$='time']").attr("disabled", "disabled");
        $("[field='avajll_nextcalldate']").attr("disabled", "disabled");
        $("[field^='avajll_businesstype']").attr("disabled", "disabled");
        $("[field='originalstartdate']").attr("disabled", "disabled");
        $("[field='scheduledendappt']").attr("disabled", "disabled");
        $("[field='avajll_scheduledstart']").attr("disabled", "disabled");
        $("input[type='checkbox']").attr("disabled", "disabled");
        $('#save-quick-activity').button('reset').hide();

        $("#cancel-quick-activity").show();
        $('#record-name').html('').attr("disabled", "disabled");;

        resetRegardingField();

        $("[field='qa_regarding-entity']").attr("disabled", "disabled");
        $("[field='qa_regarding-id']").attr("disabled", "disabled");
    };
    

    var setRegardingState = function (selectedRecordId) {
        var entitySelect = $("[field='qa_regarding-entity']");
        var idSelect = $("[field='qa_regarding-id']");
        var $defaultRegarding = $("#default_regarding");

        idSelect.empty();

        if (entitySelect.find(".default:selected").length > 0) {
            idSelect.attr("disabled", "disabled");
            idSelect.append("<option class='default' selected='selected' value='" + $defaultRegarding.attr("oid") + "'></option>");
        }
        else {
            var defaultTypeName = $defaultRegarding.attr("otype");
            var defaultId = $defaultRegarding.attr("oid");

            $("[field='qa_regarding-id']").hide();
            $("#pop-out-container").find(".spinner").show();

            // Search for records related to the parent account
            var id = (defaultTypeName == 'contact') ? _config.parentCompanyId : defaultId;

            var jsondata = JSON.stringify({
                criteria: {
                    ParentEntityId: id,
                    ParentEntityType: 'account',
                    RelatedEntityType: entitySelect.find(":selected").val()
                }
            });

            var action = _config.getRelatedRecordsUrl;
            $.ajax({
                type: "POST",
                url: action,
                data: jsondata,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    //if (!response || response.length == 0)
                    //    return;
                    if (response && response.length > 0) {
                        for (var i = 0; i < response.length; i++) {
                            idSelect.append("<option value='" + response[i].Id + "'>" + response[i].DisplayName + "</option>");
                        }

                        //if loading existing find existing and select it
                        if (selectedRecordId && typeof (selectedRecordId) === "string") {
                            idSelect.find("[value='" + selectedRecordId + "']").attr("selected", "selected");
                        }

                        if (!entitySelect.attr("disabled")) {
                            idSelect.removeAttr("disabled");
                        }
                    }

                    $("#pop-out-container").find(".spinner").hide();
                    $("[field='qa_regarding-id']").show();
                },
                error: function (a, b, c) {
                }
            });
        }
    };

    var regardingRecordsExist = function (id, typeName, selectedTypes, callback) {
        if (validRecordTypes === null) {

            var jsondata = JSON.stringify({
                criteria: {
                    ParentEntityId: id,
                    ParentEntityType: typeName,
                    RelatedEntityTypes: selectedTypes
                }
            });

            var action = _config.getRelatedRecordsExistUrl;
            var records = $.ajax({
                type: "POST",
                url: action,
                data: jsondata,
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).success(callback);
        } else {
            callback(validRecordTypes);
        }
    };

    var resetRegardingField = function () {
        $("[field='qa_regarding-entity']").empty();
        $("[field='qa_regarding-id']").attr("disabled", "disabled");
        $("[field='qa_regarding-id']").empty();

        var $defaultRegarding = $("#default_regarding");
        var typeName = $defaultRegarding.attr("otype");
        var id = $defaultRegarding.attr("oid");

        $("[field='qa_regarding-entity']").append("<option class='default' selected='selected' value='" + typeName + "'>Primary Record</option>");
        $("[field='qa_regarding-id']").append("<option class='default' selected='selected' value='" + id + "'></option>");

        // Only add options to the regarding dropdown if this
        // is a company or a contact with a parent company
        if (typeName == 'account' || _config.parentCompanyId) {

            var options = regardingOptions[typeName];
            if (options && options.length > 0) {
                var entities = [];
                for (var i = 0; i < options.length; i++) {
                    entities.push(options[i].entity);
                }

                // For contact, check for records related to the parent company
                if (typeName == 'contact') {
                    id = _config.parentCompanyId;
                }

                regardingRecordsExist(id, 'account', entities,
                function (vrt) {

                    $("[field='qa_regarding-entity']")
                        .find('option').remove().end()
                        .append("<option class='default' selected='selected' value='" + typeName + "'>Primary Record</option>");

                    validRecordTypes = vrt;
                    for (var i = 0; i < validRecordTypes.length; i++) {
                        for (var j = 0; j < options.length; j++) {
                            if (options[j].entity == validRecordTypes[i]) {
                                $("[field='qa_regarding-entity']").append("<option value='" + options[j].entity + "'>" + options[j].label + "</option>");
                                break;
                            }
                        }
                    }
                });
            }
        }
    };

    var performSave = function (action, model) {
        $('#save-quick-activity').button('loading');
        $('#savepvtButton').button('loading');
        $('#savepubButton').button('loading');

        var entityType = $("button.btn-primary").attr("id");
        ga('send', 'event', 'Activity', 'Create', entityType);

        $.ajax({
            type: "POST",
            url: action,
            data: JSON.stringify({ model: model }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                clearFields();
                if (!isPinned) {
                    if (_config.isSearchResultsPage) {
                        closeCompletely();
                    }
                    else {
                        toggleVisibility(false);
                    }
                }

                if (_config.activitiesGridRefreshMethod)
                    _config.activitiesGridRefreshMethod();

                $.growlUI("Success", "Successfully saved activity");
                pvtconfirmModal.modal('hide');
                publicconfirmModal.modal('hide');
                
            },
            error: function (a, b, c) {
                alert("Error saving activity: " + b);
                $('#save-quick-activity').button('reset');
                $('#savepvtButton').button('reset');
                $('#savepubButton').button('reset');

            }
        });
    };

    var formatDate = function (dateString) {
        if (dateString.length > 0) {
            return new Date(dateString);
        }
        return null;
    };

    var fixTwoDigitYear = function (dateString, date) {
        var fullYear = date.getFullYear();
        if (dateString.indexOf(fullYear) === -1 &&
            dateString.indexOf(fullYear.toString().substring(2, 4)) !== -1) {
            date.setFullYear(fullYear + 100);
        }
    }

    var FormatDateForSave = function (dateSelector, timeSelector, name) {
        var dateString = $(dateSelector).val();
        var date = formatDate(dateString);

        if (date != null && !isValidDate(date)) {
            $.growlUI(name + " is an invalid date. Please update before saving.");
            return "error";
        }
        else if (date == null)
            return null;

        fixTwoDigitYear(dateString, date);

        var time = $(timeSelector);
        if (time.val() != '') {
            date.setHours(
                parseInt(time.attr("hours") || 0),
                parseInt(time.attr("minutes") || 0)
            );
        }

        return date;
    };

    function isValidDate(d) {
        if (Object.prototype.toString.call(d) !== "[object Date]")
            return false;
        return !isNaN(d.getTime());
    }

    var setupRolesData = function (entityType, record) {
        if (entityType == "phonecall" || entityType == "task") {
            if (!record.SaveAsCompleted && record.DueDate == null && !userSecurity.JllActivityNoDueDateNoEmailRemainder) {
                $.growlUI("Due Date is required by your security role. Please populate before saving.");
                return false;
            }
        }
        if (entityType == "phonecall") {
            if (record.SaveAsCompleted && !record.NextCallDate && !record.DoNotSetNextCallDate) {
                var today = new Date();
                if (userSecurity.JllActivity1MonthNextCallDate) {
                    record.NextCallDate = new Date(new Date(today).setDate(today.getDate() + 30));
                }
                else if (userSecurity.JllActivity3MonthsNextCallDate) {
                    record.NextCallDate = new Date(new Date(today).setDate(today.getDate() + 90));
                }
                else
                    record.NextCallDate = null;
            }
            if (userSecurity.JllActivityCallBusinessTypeRequired) {
                if (record.CallType == null || record.BusinessType == null
                || record.CallType == 0 || record.BusinessType == 0) {
                    $.growlUI("Please populate all required fields before saving.");
                    return false;
                }
            }
        }
        else if (entityType == "appointment") {
            if (userSecurity.JllActivityCallBusinessTypeRequired) {
                if (record.BusinessType == null || record.BusinessType == 0) {
                    $.growlUI("Please populate all required fields before saving.");
                    return false;
                }
            }
        }

        return true;
    };

    var validate = function () {
        var regardingType = $("[field='qa_regarding-entity'] :selected").val();
        var regardingId = $("[field='qa_regarding-id'] :selected").val();

        if (!regardingId || !regardingType) {
            $.growlUI("Please select a Regarding record.");
            return;
        }

        var record = {};
        record.Regarding = {
            EntityTypeName: regardingType,
            Id: regardingId
        };

        var id = $("#quickActivityId").val();
        if (id) {
            record.Id = id;
        }

        var entityType = $("button.btn-primary").attr("id");
        record.ActivityType = entityType;
        record.Subject = $("[field='subject']").val();
        record.ActivityOwner = {
            Id: $("[field='ownerid']").val(),
            DisplayName: $('#search-user-list').val()
        };
        record.IsPrivate = $("[field='IsPrivate']").val();


        if (record.Subject == null || record.Subject == "") {
            $.growlUI("Please populate all required fields before saving.");
            return;
        }

        if (record.ActivityOwner == null || record.ActivityOwner == "") {
            $.growlUI("Please populate all required fields before saving.");
            return;
        }

        record.Description = $("[field='description']").val();
        record.SaveAsCompleted = $("[field='saveAsCompleted']:checked").length == 1;


        switch (entityType) {
            case "phonecall":
                var $defaultRegarding = $("#default_regarding");
                var recipientTypeName = $defaultRegarding.attr("otype");
                var recipientId = $defaultRegarding.attr("oid");

                if (recipientTypeName === 'account' || recipientTypeName === 'contact') {
                    record.Recipient = {
                        EntityTypeName: recipientTypeName,
                        Id: recipientId
                    };
                    record.RecipientTypeCode = recipientTypeName === 'account' ? 1 : 2;
                }

                if (userSecurity.JllActivity1MonthNextCallDate || userSecurity.JllActivity3MonthsNextCallDate || userSecurity.JllActivityCallBusinessTypeRequired) {
                    record.ActivityRole = true;
                } else {
                    record.ActivityRole = false;
                }

                record.CallType = Number($("[field='avajll_calltype']").val());
                record.LeftMessage = $("[field='avajll_leftmessage']:checked").length == 1;
                record.TradedMessage = $("[field='avajll_tradedmessage']:checked").length == 1;
                record.DoNotSetNextCallDate = $("[field='avajll_donotsetnextcalldate']:checked").length == 1;
                record.OmitFromRapSheet = $("[field='avajll_omitfromrapsheet-phonecall']:checked").length == 1;
                record.DueDate =
                    FormatDateForSave("[field='scheduledend-phonecall']",
                                      "[field='scheduledend-phonecall-time'] :selected",
                                      "Due Date");
                if (record.DueDate == "error")
                    return;

                record.NextCallDate =
                    FormatDateForSave("[field='avajll_nextcalldate']",
                                      "[field='avajll_nextcalldate-time'] :selected",
                                      "Next Call Date");
                if (record.NextCallDate == "error")
                    return;

                record.BusinessType = Number($("[field='avajll_businesstype-phonecall']").val());

                if (record.SaveAsCompleted) {
                    record.PerformedDate = new Date();
                }
                else {
                    record.PerformedDate = null;
                }

                if (setupRolesData(entityType, record)) {
                    if (record.IsPrivate == "true")
                        confirmPrivate();
                    else
                        confirmPublic();
                }

                break;
            case "appointment":
                record.BusinessType = $("[field='avajll_businesstype-appointment']").val();

                record.StartTime =
                    FormatDateForSave("[field='originalstartdate']",
                                      "[field='originalstartdate-time'] :selected",
                                      "Start Time");
                if (record.StartTime == "error")
                    return;

                record.EndTime =
                    FormatDateForSave("[field='scheduledendappt']",
                                      "[field='scheduledendappt-time'] :selected",
                                      "End Time");
                if (record.EndTime == "error")
                    return;

                record.OmitFromRapSheet = $("[field='avajll_omitfromrapsheet-appointment']:checked").length == 1;

                if (record.StartTime == null || record.EndTime == null) {
                    $.growlUI("Please populate all required fields before saving.");
                    return;
                }

                if (record.StartTime > record.EndTime) {
                    $.growlUI("Start Time must be before End Time.");
                    return;
                }

                if (setupRolesData(entityType, record)) {
                    if (record.IsPrivate == "true")
                        confirmPrivate();
                    else
                        confirmPublic();

                }

                break;
            case "task":
                record.DueDate =
                    FormatDateForSave("[field='scheduledend-task']",
                                      "[field='scheduledend-task-time'] :selected",
                                      "Due Date");
                if (record.DueDate == "error")
                    return;

                record.PerformedDate =
                    FormatDateForSave("[field='avajll_scheduledstart']",
                                      "[field='avajll_scheduledstart-task-time'] :selected",
                                      "Date Performed");
                if (record.PerformedDate == "error")
                    return;

                if (record.SaveAsCompleted && record.PerformedDate == null) {
                    record.PerformedDate = new Date();
                }
                else {
                    record.NextCallDate = null;
                }

                if (setupRolesData(entityType, record)) {
                    if (record.IsPrivate == "true")
                        confirmPrivate();
                    else
                        confirmPublic();

                }

                break;
        }
    }

    var save = function () {
        //$("#pop-out-private").hide();
        //$("#pop-out-container").show();

        var regardingType = $("[field='qa_regarding-entity'] :selected").val();
        var regardingId = $("[field='qa_regarding-id'] :selected").val();

        // No regarding data so let the user know and return
        if (!regardingId || !regardingType) {
            $.growlUI("Please select a Regarding record.");
            return;
        }

        var record = {};
        record.Regarding = {
            EntityTypeName: regardingType,
            Id: regardingId
        };

        var id = $("#quickActivityId").val();
        if (id) {
            record.Id = id;
        }

        var entityType = $("button.btn-primary").attr("id");
        record.ActivityType = entityType;
        record.Subject = $("[field='subject']").val();
        record.ActivityOwner = {
            Id: $("[field='ownerid']").val(),
            DisplayName : $('#search-user-list').val()
        };
        record.IsPrivate = $("[field='IsPrivate']").val();
        

        if (record.Subject == null || record.Subject == "") {
            $.growlUI("Please populate all required fields before saving.");
            return;
        }

        if (record.ActivityOwner == null || record.ActivityOwner == "") {
            $.growlUI("Please populate all required fields before saving.");
            return;
        }

        record.Description = $("[field='description']").val();
        record.SaveAsCompleted = $("[field='saveAsCompleted']:checked").length == 1;
        

        switch (entityType) {
            case "phonecall":
                var $defaultRegarding = $("#default_regarding");
                var recipientTypeName = $defaultRegarding.attr("otype");
                var recipientId = $defaultRegarding.attr("oid");

                if (recipientTypeName === 'account' || recipientTypeName === 'contact') {
                    record.Recipient = {
                        EntityTypeName: recipientTypeName,
                        Id: recipientId
                    };
                    record.RecipientTypeCode = recipientTypeName === 'account' ? 1 : 2;
                }

                if (userSecurity.JllActivity1MonthNextCallDate || userSecurity.JllActivity3MonthsNextCallDate || userSecurity.JllActivityCallBusinessTypeRequired) {
                    record.ActivityRole = true;
                } else {
                    record.ActivityRole = false;
                }

                record.CallType = Number($("[field='avajll_calltype']").val());
                record.LeftMessage = $("[field='avajll_leftmessage']:checked").length == 1;
                record.TradedMessage = $("[field='avajll_tradedmessage']:checked").length == 1;
                record.DoNotSetNextCallDate = $("[field='avajll_donotsetnextcalldate']:checked").length == 1;
                record.OmitFromRapSheet = $("[field='avajll_omitfromrapsheet-phonecall']:checked").length == 1;
                record.DueDate =
                    FormatDateForSave("[field='scheduledend-phonecall']",
                                      "[field='scheduledend-phonecall-time'] :selected",
                                      "Due Date");
                if (record.DueDate == "error")
                    return;

                record.NextCallDate =
                    FormatDateForSave("[field='avajll_nextcalldate']",
                                      "[field='avajll_nextcalldate-time'] :selected",
                                      "Next Call Date");
                if (record.NextCallDate == "error")
                    return;

                record.BusinessType = Number($("[field='avajll_businesstype-phonecall']").val());

                if (record.SaveAsCompleted) {
                    record.PerformedDate = new Date();
                }
                else {
                    record.PerformedDate = null;
                }

                if (setupRolesData(entityType, record)) {
                    performSave(_config.createPhoneCallUrl, record);
                }

                break;
            case "appointment":
                record.BusinessType = $("[field='avajll_businesstype-appointment']").val();

                record.StartTime =
                    FormatDateForSave("[field='originalstartdate']",
                                      "[field='originalstartdate-time'] :selected",
                                      "Start Time");
                if (record.StartTime == "error")
                    return;

                record.EndTime =
                    FormatDateForSave("[field='scheduledendappt']",
                                      "[field='scheduledendappt-time'] :selected",
                                      "End Time");
                if (record.EndTime == "error")
                    return;

                record.OmitFromRapSheet = $("[field='avajll_omitfromrapsheet-appointment']:checked").length == 1;

                if (record.StartTime == null || record.EndTime == null) {
                    $.growlUI("Please populate all required fields before saving.");
                    return;
                }

                if (record.StartTime > record.EndTime) {
                    $.growlUI("Start Time must be before End Time.");
                    return;
                }

                if (setupRolesData(entityType, record)) {
                    performSave(_config.createAppointmentUrl, record);
                }

                break;
            case "task":
                record.DueDate =
                    FormatDateForSave("[field='scheduledend-task']",
                                      "[field='scheduledend-task-time'] :selected",
                                      "Due Date");
                if (record.DueDate == "error")
                    return;

                record.PerformedDate =
                    FormatDateForSave("[field='avajll_scheduledstart']",
                                      "[field='avajll_scheduledstart-task-time'] :selected",
                                      "Date Performed");
                if (record.PerformedDate == "error")
                    return;

                if (record.SaveAsCompleted && record.PerformedDate == null) {
                    record.PerformedDate = new Date();
                }
                else {
                    record.NextCallDate = null;
                }

                if (setupRolesData(entityType, record)) {
                    performSave(_config.createTaskUrl, record);
                }

                break;
        }
    };

    function selectTime(timeSelector, timeObject) {
        var hours = timeObject.getHours();
        var minutes = timeObject.getMinutes();
        if (minutes >= 0 && minutes < 30)
            minutes = 0;
        if (minutes >= 30 && minutes < 60)
            minutes = 30;

        $(timeSelector + " option[hours='" +
            hours +
            "'][minutes='" +
            minutes +
            "']").attr("selected", "selected");
    }

    var load = function (model) {
        $("#cancel-quick-activity").show();
        $("#activities").find("#appointment,#task,#phonecall").removeAttr("disabled");

        if (model.Id) {
            $("#quickActivityId").val(model.Id);
        }

        if (model.Subject) {
            $("[field='subject']").val(model.Subject);
        }

        if (model.Description) {
            $("[field='description']").val(model.Description);
        }
        
        if (model.ActivityOwner) {
            $("[field='ownerid']").text(model.ActivityOwner.Id);
            $('#search-user-list').val(model.ActivityOwner.DisplayName);
        }

        
        if (!model.IsActive) {
            disableFields();
            if (model.IsPrivate) {
                $("#make_private").prop('disabled', false);
                $("#make_public").prop('disabled', false);
                $('#save-quick-activity').button('reset').show();
            }
        }

        switch (model.ActivityType) {
            case APPOINTMENT:
                $("#activities").find("#appointment").addClass("active").click();
                $("#activities").find("#task,#phonecall").attr("disabled", "disabled");
                if (model.OmitFromRapSheet) {
                    $("[field='avajll_omitfromrapsheet-appointment']").attr("checked", "checked");
                }
                if (model.BusinessType !== null) {
                    $("[field='avajll_businesstype-appointment']").find("option[value='" + model.BusinessType + "']").attr("selected", "selected");
                }
                if (model.StartTime && model.StartTime != NULLDATE) {
                    var start = new JLL.DatefromISO(model.StartTime);
                    $("[field='originalstartdate']").datepicker('setValue', start);

                    selectTime("[field='originalstartdate-time']", start);
                }
                if (model.EndTime && model.EndTime != NULLDATE) {
                    var end = new JLL.DatefromISO(model.EndTime);
                    $("[field='scheduledendappt']").datepicker('setValue', end);

                    selectTime("[field='scheduledendappt-time']", end);
                }
                break;
            case PHONECALL:
                $("#activities").find("#phonecall").addClass("active").click();
                $("#activities").find("#appointment,#task").attr("disabled", "disabled");
                if (model.BusinessType !== null) {
                    $("[field='avajll_businesstype-phonecall']").find("option[value='" + model.BusinessType + "']").attr("selected", "selected");
                }
                if (model.CallType !== null) {
                    $("[field='avajll_calltype']").find("option[value='" + model.CallType + "']").attr("selected", "selected");
                }
                if (model.DueDate && model.DueDate != NULLDATE) {
                    var due = new JLL.DatefromISO(model.DueDate);
                    $("[field='scheduledend-phonecall']").datepicker('setValue', due);
                    selectTime("[field='scheduledend-phonecall-time']", due);
                }
                if (model.NextCallDate && model.NextCallDate != NULLDATE) {
                    var nextCall = new JLL.DatefromISO(model.NextCallDate);
                    $("[field='avajll_nextcalldate']").datepicker('setValue', nextCall);
                    selectTime("[field='avajll_nextcalldate-time']", nextCall);
                }
                if (model.LeftMessage) {
                    $("[field='avajll_leftmessage']").attr("checked", "checked");
                }
                if (model.TradedMessage) {
                    $("[field='avajll_tradedmessage']").attr("checked", "checked");
                }
                if (model.DoNotSetNextCallDate) {
                    $("[field='avajll_donotsetnextcalldate']").attr("checked", "checked");
                }
                if (model.OmitFromRapSheet) {
                    $("[field='avajll_omitfromrapsheet-phonecall']").attr("checked", "checked");
                }
                break;
            case TASK:
                $("#activities").find("#task").addClass("active").click();
                $("#activities").find("#appointment,#phonecall").attr("disabled", "disabled");
                if (model.DueDate && model.DueDate != NULLDATE) {
                    var due = new JLL.DatefromISO(model.DueDate);
                    $("[field='scheduledend-task']").datepicker('setValue', due);
                    selectTime("[field='scheduledend-task-time']", due);
                }
                if (model.PerformedDate && model.PerformedDate != NULLDATE) {
                    var perfDate = new JLL.DatefromISO(model.PerformedDate);
                    $("[field='avajll_scheduledstart']").datepicker('setValue', perfDate);
                    selectTime("[field='avajll_scheduledstart-task-time']", perfDate);
                }
                break;
            default:
        }

        //need to select type and load available and include current regarding
        $("[field='qa_regarding-entity'] option[value='" + model.Regarding.EntityTypeName + "']").attr("selected", "selected");
        //document.getElementById('saveAsCompleted').checked = false;
        $('#saveAsCompleted').attr("checked", model.SaveAsCompleted);
        //$('#saveAsCompleted').checked = model.SaveAsCompleted;
        $("[field='IsPrivate']").val(model.IsPrivate);
        if (model.IsPrivate) {
            $("#make_private").trigger("click");
            $("#make_public").prop('disabled', false);
            $("#make_private").prop('disabled', false);
        }
        else {
            $("#make_public").trigger("click");
            $("#make_public").prop('disabled', true);
            $("#make_private").prop('disabled', true);
        }
        
        setRegardingState(model.Regarding.Id);
        

    };

    var openActivityScreenFromGrid = function (element) {
        if (isloaded) {
            var $element = $(element);
            var id = $element.attr("oid");
            var type = $element.attr("otype");
            var name = $element.attr("oname");
            if (!id || !type)
                return;

            var $regarding = $("#default_regarding");
            $regarding.attr("oid", id);
            $regarding.attr("otype", type);

            clearFields();
            $('#record-name').html(name);
            $("#cancel-quick-activity").show();
            toggleVisibility(true);
        }
    };

    var openActivityScreenFromMyActivities = function (element) {
        
        if (isloaded) {
            var $element = $(element);
            var id = $element.attr("oid");
            var type = $element.attr("otype");

            $.ajax({
                type: "POST",
                url: _config.getActivityUrl,
                data: JSON.stringify({ id: id, activityType: type }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    var $regarding = $("#default_regarding");
                    var regarding = response.Regarding;
                    $regarding.attr("oid", regarding.Id);
                    $regarding.attr("otype", regarding.EntityTypeName);
                    clearFields();
                    $("#record-name").html(regarding.Name);
                    load(response);
                    toggleVisibility(true);
                },
                error: function (a, b, c) {
                    alert("Error loading activity: " + b);
                }
            });
        }
    }

    var loadActivityDataFromDetails = function (element) {
        
        if (isloaded) {
            var $element = $(element);
            var id = $element.attr("oid");
            var type = $element.attr("otype");
            $.ajax({
                type: "POST",
                url: _config.getActivityUrl,
                data: JSON.stringify({ id: id, activityType: type }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    clearFields();
                    load(response);
                    toggleVisibility(true);
                },
                error: function (a, b, c) {
                    alert("Error loading activity: " + b);
                }
            });
        }
    };

    return {
        init: init,
        openActivityScreenFromGrid: openActivityScreenFromGrid,
        toggleVisibility: toggleVisibility,
        newActivity: newActivity,
        save: save,
        loadActivityDataFromDetails: loadActivityDataFromDetails,
        openActivityScreenFromMyActivities: openActivityScreenFromMyActivities,
        validate: validate
    };
}();