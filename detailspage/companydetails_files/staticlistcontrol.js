(function ($) {
    var listTypes = {
        account: 1,
        contact: 2,
        awx_lease: 10031,
        awx_property: 10048,
    };

    $.fn.GetListTypeByEntity = function(entityName) {
        if(typeof (listTypes[entityName]) !== "undefined") {
            return listTypes[entityName];
        }
        return null;
    };

   $.fn.StaticListControl = function (config) {
       return this.each(function () {
            var data = {
                $element: $(this),
                config: config
            };
            if (!config.newListControl) {
                buildFullControl(data);
            }
            else {
                buildNewListControl(data);
            }
        });
    };

   var buildFullControl = function (data) {
       var listTypeNumber = $.fn.GetListTypeByEntity(data.config.listType);

       var typeString = "";
       if (listTypeNumber === listTypes.account)
           typeString = "Company";
       else if (listTypeNumber === listTypes.contact)
           typeString = "Contact";
       else if (listTypeNumber === listTypes.awx_lease)
           typeString = "Lease";
       else if (listTypeNumber === listTypes.awx_property)
           typeString = "Property";
       
       data.$element.append("<div style='height:30px;'>" +
                    "<span style='float:left;' class='badge badge-grey btn-entity-image'><i class='icon-list-ul'></i></span>" +
                    "<span class='entity-btn-label' style='display:inline-block;line-height:20px;'>" + 
                        "<div class='row-fluid dropdown'>" +
                            "<a href='#' class='dropdown-toggle personalListToggle' data-toggle='dropdown'>Personal Lists </a>" +
                            "<ul class='dropdown-menu maxHeightDropDown personalList' style='width:220px;max-width:220px'></ul>" +
                        "</div>" +
                        "<div class='row-fluid'>" + 
                            "<div class='muted ellipsis personal-list-information' style=''><span class='icon-spinner icon-spin'></span>Loading...</div>" +
                            "<div class='muted spinner adding personal-list-information' style='display:none;'><span class='icon-spinner icon-spin'></span>Adding...</div>" +
                            "<div class='muted spinner removing personal-list-information' style='display:none;'><span class='icon-spinner icon-spin'></span>Removing...</div>" +
                        "</div>" +
                    "</span>" +
                    "<div></div>" + 
                "</div>");

       data.typeString = '';
        data.$element.append("<div id='newStaticListModal" +
            data.config.recordId +
            "' class='modal hide fade' tabindex='-1' role='dialog' aria-labelledby='newStaticListModalLabel' aria-hidden='true'>" +
            "<div class='modal-header'>" +
            "<h3 id='newStaticListModalLabel'>New " + typeString + " List</h3>" +
            "</div>" +
            "<div class='modal-body'>" +
            "<div class='control-group'>" +
            "<label class='control-label' for='listName'>List Name <span style='color: #ff0000;'>*</span></label>" +
            "<div class='controls'>" +
            "<input type='text' id='listName" +
            data.config.recordId +
            "'>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "<div class='modal-footer'>" +
            "<button class='btn newListClose' type='button' data-dismiss='modal' aria-hidden='true'>Cancel</button>&nbsp;&nbsp;&nbsp;" +
            "<button class='btn btn-primary newListSave' type='button' data-loading-text='Saving...'>Save List</button>" +
            "</div>" +
            "</div>");

        $('#newStaticListModal' + data.config.recordId).on('shown', function () {
            $('#listName' + data.config.recordId).focus();
        });

        data.$element.find(".newListClose").live("click", data, closeDialog);
        data.$element.find(".newListSave").live("click", data, saveList);
        data.$element.find(".dropdown-toggle.personalListToggle").click(expandContainer);
        $('#listName' +data.config.recordId).live("keydown", data, triggerSave);

        getAvailableLists(data);
    };

    var buildNewListControl = function (data) {
        var listTypeNumber = $.fn.GetListTypeByEntity(data.config.listType);

        var typeString = "";
        var icon = "";
        if (listTypeNumber === listTypes.account) {
            typeString = "Company";
            icon = "icon-briefcase-1";
        }
        else if (listTypeNumber === listTypes.contact) {
            typeString = "Contact";
            icon = "icon-vcard";
        }
        else if (listTypeNumber === listTypes.awx_lease) {
            typeString = "Lease";
            icon = "icon-docs-1";
        }
        else if (listTypeNumber === listTypes.awx_property) {
            typeString = "Property";
            icon = "icon-building";
        }

        data.typeString = typeString;
        data.$element.append("<span class='badge btn-entity-image' style='background-color: #c9c9c9'>" +
            "<i class='" + icon + "' ></i></span><span class='new-list-button'><a href='#newStaticListModal" + typeString + "' role='button' data-toggle='modal'>Create New " + typeString + " List </a></span>");

        data.$element.append("<div id='newStaticListModal" + typeString + "' class='modal hide fade' tabindex='-1' role='dialog' aria-labelledby='newStaticListModalLabel' aria-hidden='true'>" +
            "<div class='modal-header'>" +
            "<h3 id='newStaticListModalLabel'>New " + typeString + " List</h3>" +
            "</div>" +
            "<div class='modal-body'>" +
            "<div class='control-group'>" +
                "<label class='control-label' for='listName'>List Name <span style='color: #ff0000;'>*</span></label>" +
                "<div class='controls'>" +
                    "<input type='text' id='listName' class='listName" + typeString + "'>" +
                "</div>" +
                "</div>" +
            "</div>" +
            "<div class='modal-footer'>" +
            "<button class='btn newListClose' type='button' data-dismiss='modal' aria-hidden='true'>Cancel</button>" +
            "<button class='btn btn-primary newListSave" + typeString + "' type='button' data-loading-text='Saving...'>Save List</button>" +
            "</div>" +
            "</div>");

        $(".newListClose").on("click", data, closeDialog);
        $(".newListSave" + typeString).on("click", data, saveList);
        $('.listName' + typeString).live("keydown", data, triggerSave);
    };

    var closeDialog = function (e) {
        var data = e.data;

        data.$element.find("[id^='listName']").val('');
    };
    
    var saveList = function (e) {
        var data = e.data;
        
        var newName = data.$element.find("[id^='listName']").val();
        
        var listType = listTypes[data.config.listType];
        var action = data.config.createListUrl;
        var jsondata = JSON.stringify({ entityId: { entityTypeName: data.config.listType, Id: data.config.recordId }, listType: listType, listName: newName });

        if (newName == '') {
            $.growlUI("Please enter a list name before saving.");
            return;
        }
        
        $('.newListSave' + data.typeString).button('loading');
        ga('send', 'event', 'StaticList', 'Create');
        
        $.ajax({
            type: "POST",
            url: action,
            data: jsondata,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                if (response) {
                    if (!data.config.newListControl) {
                        var $hostGrid = data.$element.parents(".dataTables_wrapper");

                        if ($hostGrid.length > 0) {
                            $hostGrid.find("ul.personalList").each(function () {
                                addNewListNameToList($(this), newName, data, response);
                            });
                        }
                        else {
                            addNewListNameToList(data.$element.parent().find("ul.personalList"), newName, data, response);
                        }

                        var $element = data.$element.parent().find(".personalListLink:contains('" + newName + "')");

                        hideListCount($element, true);
                        selectList({ $element: $element }, false);
                        updateAndShowListCount($element);
                    }
                    else {
                        
                        var table = $('#' + data.config.listType + "-list-results-table").dataTable();
                        var today = new Date();
                        var newListObject = {
                            CreatedOn: Date(),
                            Icon: null,
                            Id: response,
                            LastActivity: (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear(),
                            ListMemberCount: 0,
                            ListType: listType,
                            ModifiedOn: Date(),
                            Name: newName
                        };
                        if (listType == listTypes.account) JLL.StaticList.MyLists.CompanyLists.push(newListObject);
                        if (listType == listTypes.contact) JLL.StaticList.MyLists.ContactLists.push(newListObject);
                        if (listType == listTypes.awx_lease) JLL.StaticList.MyLists.LeaseLists.push(newListObject);
                        if (listType == listTypes.awx_property) JLL.StaticList.MyLists.PropertyLists.push(newListObject);

                        table.fnAddData(newListObject);
                    }

                    if (JLL.NavBar && JLL.NavBar.updateMyLists) JLL.NavBar.updateMyLists(JLL.StaticList.MyLists);
                    
                    $.growlUI("Success", "Successfully saved personal list");
                }
                $('.newListSave' + data.typeString).button('reset');
                data.$element.find(".newListClose").click();
            },
            error: function (a, b, c) {
            }
        });
    };

    var expandContainer = function () {
        var container = $("results-content");
        var initialParentHeight = container.height();
        container.height(initialParentHeight + $(this).siblings("ul").height());
        $(this).closest(".dropdown-menu").blur(function () {
            container.height(initialParentHeight);
        });
    }

    var triggerSave = function (e) {
        var data = e.data;
        if (e.keyCode === 13) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            else {
                window.event.cancelBubble = true;
            }
            data.$element.find('button[class*=" newListSave"],[class^="newListSave"]').click();
        }
    }

    var addNewListNameToList = function($ul, listName, data, listId) {
        $ul.append("<li><a class='personalListLink' href='#'><span class='ellipsis' style='width:120px;display:inline-block;' data-listid='" + listId + "'>" + listName + "</span>"
                                + "<span class='icon-star selectedStaticList' style='display:none;'/><span class='btn btn-square pull-right icon-plus personalListBtn'/></a></li>");

        var unsortables = $ul.find("li.divider, li.newList").remove();

        $ul.find("li").sort(function (a, b) {
            return $(a).text().toLowerCase().localeCompare($(b).text().toLowerCase());
        }).each(function () {
            $ul.append(this);
        });

        $ul.append(unsortables);
        
        $ul.find("li").each(function () {
            $(this).find("a").die("click").live("click", data.config, toggleList);
        });
    };
    
    var loadLists = function (data, lists) {
        var $ul = data.$element.find("ul");
        
        for (var i = 0; i < lists.length; i++) {
            $ul.append("<li><a class='personalListLink' href='#'><span class='ellipsis' style='width:120px;display:inline-block;' data-listid='" + lists[i].Id +"'>" + lists[i].Name + "</span>"
                + "<span class='icon-star selectedStaticList' style='display:none;'/><span class='btn btn-square pull-right icon-plus personalListBtn'/></a></li>");
        }

        $ul.find("li").each(function () {
            $(this).find("a").live("click", data.config, toggleList);
        });
        
        $ul.append("<li class='divider'/><li class='newList'><a href='#newStaticListModal" +
                data.config.recordId +
                "' role='button' data-toggle='modal'>Create a new list...</a></li>");

        getRelatedLists(data);
    };

    var loadSelectedLists = function (data, lists) {
        for (var i = 0; i < lists.length; i++) {
            data.$element.find("a:contains('" + lists[i] + "')").each(function () {
                if(lists[i] == $(this).text()) {
                    selectList({
                        $element: $(this),
                        config: data.config
                    }, false);
                }
            });
        }
        
        if (lists.length == 0) {
            data.$element.find(".muted:not(.spinner)").text("Not on any lists");
        }
        else if (lists.length == 1) {
            data.$element.find(".muted:not(.spinner)").width(90);
            data.$element.find(".muted:not(.spinner)").text("On: " + lists[0]);
        }
        else {
            data.$element.find(".muted:not(.spinner)").text("On: " + lists.length + " lists");
        }
        
        data.$element.find('.dropdown-toggle').dropdown();
    };

    var toggleList = function(e) {
        var $element = $(e.srcElement);
        if ($element.is("span")) {
            $element = $element.parents("a:first");
        }
        
        var data = {
            $element: $element,
            config: e.data
        };
        
        if($element.find(".icon-star:visible").length == 0) {
            selectList(data, true);
        }
        else {
            unSelectList(data, true);
        }
    };

    var selectList = function (data, addToList) {
        data.$element.addClass("selectedStaticList");
        data.$element.parents("li:first").find(".icon-star").show();
        data.$element.parents("li:first")
            .find(".icon-plus")
            .removeClass("icon-plus").addClass("icon-minus")
            .addClass(".selectedStaticList");
        
        if (addToList && data.config && data.config.addToListUrl) {
            hideListCount(data.$element, true);
            
            var jsondata = JSON.stringify({ entityId: { entityTypeName: data.config.listType, Id: data.config.recordId }, listId: data.$element.children('span').data('listid') });

            ga('send', 'event', 'StaticListMember', 'Create');
            $.ajax({
                type: "POST",
                url: data.config.addToListUrl,
                data: jsondata,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    updateAndShowListCount(data.$element);

                    if (!response.Success) {
                        alert("An error occurred while adding this record to the " + data.$element.text() + " list :\n" + response.Errors.join("\n"));
                        unSelectList(data, false);
                    }
                }
            });
        }
    };
    
    var unSelectList = function (data, removeFromList) {
        data.$element.removeClass("selectedStaticList");
        data.$element.parents("li:first").find(".icon-star").hide();
        data.$element.parents("li:first")
            .find(".icon-minus")
            .removeClass("icon-minus").addClass("icon-plus")
            .removeClass(".selectedStaticList");

        if (removeFromList && data.config && data.config.removeFromListUrl) {
            hideListCount(data.$element, false);
            
            var jsondata = JSON.stringify({ entityId: { entityTypeName: data.config.listType, Id: data.config.recordId }, listId: data.$element.children('span').data('listid') });

            ga('send', 'event', 'StaticListMember', 'Delete');
            $.ajax({
                type: "POST",
                url: data.config.removeFromListUrl,
                data: jsondata,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    updateAndShowListCount(data.$element);
                    
                    if (!response.Success) {
                        alert("An error occurred while removing this record to the " + data.$element.text() + " list :\n" + response.Errors.join("\n"));
                        selectList(data, false);
                    }
                }
            });
        }
    };
    
    var hideListCount = function ($element, adding) {
        if (adding) {
            $element.parents(".dropdown").find(".personal-list-information.adding").show();
            $element.parents(".dropdown").find(".personal-list-information:not(.adding, .modal)").hide();
        }
        else {
            $element.parents(".dropdown").find(".personal-list-information.removing").show();
            $element.parents(".dropdown").find(".personal-list-information:not(.removing, .modal)").hide();
        }
    };

    var updateAndShowListCount = function ($element) {
        $element.parents(".dropdown").find(".personal-list-information.spinner").hide();
        var $listLabel = $element.parents(".dropdown").find(".personal-list-information:not(.spinner, .modal)").show();
        
        var $star = $element.parents(".details").parent().prev("tr:first").find(".searchExpanderColumn i");

        var $list = $element.parents(".dropdown").find("a.selectedStaticList");
        if ($list.length == 0) {
            $listLabel.text("Not on any lists");
            $star.css("display", "none");
        } else if ($list.length == 1) {
            $listLabel.width(110);
            $listLabel.html("On: " + $list.text());
            $star.css("display", "block");
        } else {
            $listLabel.text("On: " + $list.length + " lists");
            $star.css("display", "block");
        }
    };
    
    var getAvailableLists = function (data) {
        var listType = listTypes[data.config.listType];
        var action = data.config.getListsUrl;

        if (listType == listTypes.contact) loadLists(data, JLL.StaticList.MyLists.ContactLists);
        if (listType == listTypes.account) loadLists(data, JLL.StaticList.MyLists.CompanyLists);
        if (listType == listTypes.awx_lease) loadLists(data, JLL.StaticList.MyLists.LeaseLists);
        if (listType == listTypes.awx_property) loadLists(data, JLL.StaticList.MyLists.PropertyLists);
    };

    var getRelatedLists = function (data) {
        var id = data.config.recordId;
        var listType = listTypes[data.config.listType];
        var action = data.config.getRelatedListsUrl;
        $.ajax({
            type: "POST",
            url: action,
            data: JSON.stringify({ id: id, listType: listType }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                loadSelectedLists(data, response);
            },
            error: function (a, b, c) {
            }
        });
    };
    
})(jQuery);