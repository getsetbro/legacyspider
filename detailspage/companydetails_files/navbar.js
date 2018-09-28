
JLL.NavBar = function () {
    var _config = {
        GetStaticListsUrl: '',
        StaticListUrl: '',
        LogoutActionUrl: '',
        LogoutUrl: '',
        MyStaticLists: {},
        SaveAdminUrl: '',
        ReleaseNotesUrl: '',
        ShowInitialReleaseNotes:false,
        Version: '',
        RecentlyViewedUrl: '',
        CompanyUrl: '',
        ContactUrl: '',
        EmailUrl: ''
    };

    var _contactConfig = {
        CompanyId: '',
        CompanyName: ''
    };

    var __recentSearchTemplate =
'{#template MAIN}' +
    '{#if $T == null} <li><a href="#">No history available</a></li> {#/if}' +
    '{#foreach $T as r}' +
        '{#include RECENTITEM root=$T.r}' +
    '{#/for}' +
'{#/template MAIN}' +

'{#template RECENTITEM}' +
    '<li><a href="{$T.url}">{$T.displayName}</a></li>' +
'{#/template RECENTITEM}';
    

    var __historyTemplate =
'{#template MAIN}' +
    '<li class="dropdown-submenu">' +
	    '<a tabindex="-1"><i class="icon-briefcase-1"></i> Companies</a>' +
        '{#include RECENTLIST root=$T.RecentCompanies}' +
    '</li>' +
    '<li class="dropdown-submenu">' +
        '<a tabindex="-1"><i class="icon-building"></i> Properties</a>' +
        '{#include RECENTLIST root=$T.RecentProperties}' +
    '</li>' +
    '<li class="dropdown-submenu">' +
        '<a tabindex="-1"><i class="icon-vcard"></i> Contacts</a>' +
        '{#include RECENTLIST root=$T.RecentContacts}' +
    '</li>' +    
    '<li class="dropdown-submenu">' +
        '<a tabindex="-1"><i class="icon-docs-1"></i> Leases</a>' +
        '{#include RECENTLIST root=$T.RecentLeases}' +
    '</li>' +
'{#/template MAIN}' +

'{#template RECENTLIST}' +
    '<ul class="dropdown-menu">' +
        '{#if $T == null} <li><a href="#">No history available</a></li> {#/if}' +
        '{#foreach $T as r}' +
            '{#include RECENTITEM root=$T.r}' +
        '{#/for}' +
    '</ul>' +
'{#/template RECENTLIST}' +

'{#template RECENTITEM}' +
    '<li><a href="{$T.url}">{$T.displayName}</a></li>' +
'{#/template RECENTITEM}';

    var __myListsTemplate =
'{#template MAIN}' +
    '<li class="dropdown-submenu">' +
        '<a><i class="icon-briefcase-1"></i> Company</a>' +
        '{#include PERSONALLISTS root=$T.CompanyLists}' +
    '</li>' +
    '<li class="dropdown-submenu">' +
    '<a><i class="icon-building"></i> Property</a>' +
    '{#include PERSONALLISTS root=$T.PropertyLists}' +
    '</li>' +
        '<li class="dropdown-submenu">' +
        '<a><i class="icon-vcard"></i> Contacts</a>' +
        '{#include PERSONALLISTS root=$T.ContactLists}' +
    '</li>' +
        '<li class="dropdown-submenu">' +
        '<a><i class="icon-docs-1"></i> Leases</a>' +
        '{#include PERSONALLISTS root=$T.LeaseLists}' +
    '</li>' +
'{#/template MAIN}' +
    
'{#template PERSONALLISTS}' +
    '<ul class="dropdown-menu scrolling-dropdown">' +
        '{#if $T == null || $T.length == 0}<li><a>No lists available</a></li> {#/if}' +
        '{#foreach $T as l}' +
            '{#include PERSONALLIST root=$T.l}' +
        '{#/for}' +
    '</ul>' +
'{#/template PERSONALLISTS}' +
    
'{#template PERSONALLIST}' +
    '<li><a href="{$P.url}/{$T.Id}">{$T.Name}</a></li>' +
'{#/template PERSONALLIST}';

    var $btnCreateNewLease = $('#btn-create-new-lease');
    var $btnCreateNewContact = $('#btn-create-new-contact');
    var $btnCreateNewCompany = $('#btn-create-new-company');
    var $btnCreateNewProperty = $('#btn-create-new-property');
    var $btnReleaseNotes = $('#btn-releasenotes');
    var $btnContactUs = $('#btn-contactus');

    var $historyList = $('#ul-recent-history');
    var $searchList = $('#ul-recent-searches');
    var $myList = $('#li-my-lists');
    var $releaseDialog = $('#dlg-create-releasenotes');

    var init = function (config) {
        $.extend(_config, config);
        
        if (typeof console == "undefined") {

            this.console = { log: function () { } };

        }

        $btnCreateNewLease.click(function () {
            if (JLL && JLL.Lease && JLL.Lease.Create) {
                JLL.Lease.Create.reset();
            }
            else {
                loadDialog($btnCreateNewLease);
            }
        });
        $btnCreateNewCompany.click(function () {
            if (JLL && JLL.Company && JLL.Company.Create) {
                JLL.Company.Create.reset();
            }
            else {
                loadDialog($btnCreateNewCompany)
            }
        });
        $btnCreateNewContact.click(function () {
            if (JLL && JLL.Contact && JLL.Contact.Create) {
                JLL.Contact.Create.reset();
            }
            else {
                loadDialog($btnCreateNewContact, function () {
                    if (_contactConfig.CompanyId) {
                        JLL.Contact.Create.setParentCompany(_contactConfig.CompanyId, _contactConfig.CompanyName);
                        JLL.Contact.Create.setParentCompanyField(_contactConfig.CompanyId, _contactConfig.CompanyName);
                    }
                });
            }
        });
        $btnCreateNewProperty.click(function () {
            if (JLL && JLL.Property && JLL.Property.Create) {
                JLL.Property.Create.reset();
            }
            else {
                loadDialog($btnCreateNewProperty);
            }
        });
        $btnReleaseNotes.click(function () {
            $("#lookup-ReleaseNotes").show();
            
        });
        $btnContactUs.click(function () {
            $("#lookup-Contactus").show();

        });
        if (_config.ShowInitialReleaseNotes == 'False') {
            $("#lookup-ReleaseNotes").show();
            $("#spnNotification").show();
            $("btn-close-releasenotes").show();
        }
        else {
            $("#lookup-ReleaseNotes").hide();
            $("#spnNotification").hide();
            $("btn-close-releasenotes").hide();
        }

        buildHistoryList();
        _getStaticListsUrl = config.GetStaticListsUrl;
        _StaticListUrl = config.StaticListUrl;
        buildMyLists();
    };

    var buildHistoryList = function () {
        var companyArray = [];
        var contactArray = [];

        var historyList = {
            RecentCompanies: [],
            RecentContacts: [],
            RecentProperties: JLL.GetHistory(JLL.HistoryType.PROPERTY),
            RecentLeases: JLL.GetHistory(JLL.HistoryType.LEASE),
            RecentSearches: JLL.GetHistory(JLL.HistoryType.SEARCH)
        };

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: _config.RecentlyViewedUrl,
            success: function (json) {
                if (json) {
                    $.each(json.Companies, function (i, e) {
                        if (e.CompanyName && e.CompanyName.length > 0) {
                            companyArray.push({ displayName: e.CompanyName, id: e.Id, url: _config.CompanyUrl + '/'+ e.Id, type: JLL.HistoryType.Company });
                            
                        }
                    });
                    historyList.RecentCompanies = companyArray;
                    $.each(json.Contacts, function (i, e) {
                        if (e.FullName && e.FullName.length > 0) {
                            contactArray.push({ displayName: e.FullName, id: e.Id, url: _config.ContactUrl + '/' + e.Id, type: JLL.HistoryType.Contact });

                        }
                    });
                    historyList.RecentContacts = contactArray;
                    $historyList.processTemplate(historyList);
                }

            },
            error: function () {
                console.log('Error while saving getting recent views.');
            }
        });
        
        $historyList.setTemplate(__historyTemplate);
        
        $searchList.setTemplate(__recentSearchTemplate);
        $searchList.processTemplate(historyList.RecentSearches);
    };

    var _getStaticListsUrl;
    var _StaticListUrl;
    var buildMyLists = function() {
        if (!JLL.StaticList.MyLists) {
            JLL.StaticList.MyLists = {};
        }
        updateMyLists(_config.MyStaticLists);
    };

    var updateMyLists = function(newLists) {
        JLL.StaticList.MyLists = newLists;

        $myList.setTemplate(__myListsTemplate);
        $myList.setParam('url', _StaticListUrl);
        $myList.processTemplate(JLL.StaticList.MyLists);

    };

    
    var openReleaseDialog = function () {
        //window.open(_config.ReleaseNotesUrl);
        //$releaseDialog.modal('hide');
    };
    var closeReleaseDialog = function () {
        
        $("#lookup-ReleaseNotes").hide();
    }
    var closeContactUs = function () {
        var $dialog = $('#lookup-Contactus');
        $dialog.find("[field]").each(function () {
            var $field = $(this);
            if ($field.is("input")) {
                $field.attr("value", "");
            }
            if ($field.is("textarea")) {
                $field.attr("value", "");

            }
        });

        $("#lookup-Contactus").hide();
    }
    var emailContactUs = function () {
        var $dialog = $('#lookup-Contactus');
        var subject;
        var message;
        $dialog.find("[field]").each(function () {
            var $field = $(this);
            if ($field.is("input")) {
                if ($field.attr("field") == 'ContactUsSubject')
                    subject = $field.attr('value');
            }
            if ($field.is("textarea")){
                if ($field.attr("field") == 'ContactUsMessage')
                    message = $field.attr('value');
            }
        });
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: _config.EmailUrl,
            data: {
                subject: subject,
                message: message
            },
            success: function (url) {
                
                $.growlUI("Success", "Your email has been sent to the Broker Tools team and they will be in touch as soon as possible.",6000);
                closeContactUs();
            },
            error: function () {
                alert('Error while sending Email.');
            }
        });

        

    }
    var setReleaseDialog = function () {
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: _config.ReleaseNotesUrl,
            success: function (url) {
                closeReleaseDialog();
                $("#spnNotification").hide();
            },
            error: function () {
                alert('Error while saving Release Info.');
                $("#lookup-ReleaseNotes").hide();
            }
        });

        
    }

    var saveAdmin = function () {
        var $dialog = $('#admin-body');
        var releaseNotesUrl;
        var resetPreference;
        var version;
        $dialog.find("[field]").each(function () {
            var $field = $(this);
            if ($field.is("input")) {
                var type = $field.attr("type");
                if ($field.attr("field") == 'ReleaseNotesUrl')
                    releaseNotesUrl = $field.attr('value');
                else if ($field.attr("field") == 'Version')
                    version = $field.attr('value');
                else if (type == "checkbox")
                    resetPreference = $field.attr("checked") == "checked";
            }
            
            
        });

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: _config.SaveAdminUrl,
            data: {
                ReleaseNotesUrl: releaseNotesUrl,
                ResetPreference: resetPreference,
                Version: version
            },
            success: function (url) {
                alert('Successfully saved Admin Information.');
            },
            error: function () {
                alert('Error while saving Admin Information.');
            }
        });
    };

    var loadDialog = function ($button, afterLoad) {
        JLL.LoadDialog($button, afterLoad);
    }


    var setParentCompany = function(companyId, companyName) {
        _contactConfig.CompanyId = companyId;
        _contactConfig.CompanyName = companyName;
    };

    return {
        init: init,
        buildMyLists: buildMyLists,
        updateMyLists: function(newLists) {
            updateMyLists(newLists);
        },
        setParentCompany: setParentCompany,
        openReleaseDialog: openReleaseDialog,
        setReleaseDialog: setReleaseDialog,
        closeReleaseDialog: closeReleaseDialog,
        emailContactUs: emailContactUs,
        closeContactUs: closeContactUs,

        saveAdmin: saveAdmin
    };
}();