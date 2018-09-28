JLL.Company.Update = function () {
    var $dialog = $('#dlg-update-company');
    var $btnClose = $('#btn-close-update-company');
    var $btnSave = $('#btn-save-update-company');

    var $lookupCountry = $('#id-lookup-update-company-avajll_country');
    var $selectState = $dialog.find("[field='State']");

    var subIndustryDefaultValue = '';
    
    
    var _config = {
        CompanyUpdateUrl: '',
        CompanyDetailsUrl: '',
        CompanyEditUrl: '',
        SubIndustryOptions: '',
        StatesByCountry: '',
        GetSubIndustryUrl: ''
    };

    var statesByCountry;
    var populateStates = function () {
        $.ajax({
            type: "POST",
            url: _config.StatesByCountry,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                statesByCountry = response;
                updateStates();
                loadDefaultState();
            }
        });
    };

    //Telephone handling
    var $telInput;
    var $errorMsg;
    var $validMsg;

    var resetTel = function () {
        $telInput.removeClass("error");
        $errorMsg.addClass("hide");
        $validMsg.addClass("hide");
    };

    var setupTel = function (input, errormsg, validmsg) {
        $telInput = $(input);
        $errorMsg = $(errormsg);
        $validMsg = $(validmsg);

        // initialise plugin
        $telInput.intlTelInput({
            separateDialCode: true,
            nationalMode: false,
            autoPlaceholder: true,
            utilsScript: "*"
        });

        // on blur: validate
        $telInput.blur(function () {
            resetTel();
            if ($.trim($telInput.val())) {
                if ($telInput.intlTelInput("isValidNumber")) {
                    $validMsg.removeClass("hide");
                } else {
                    $telInput.addClass("error");
                    $errorMsg.removeClass("hide");
                }
            }
        });

        // on keyup / change flag: reset
        $telInput.on("keyup change", resetTel);
    };

    var getTelNumber = function () {
        var t = $telInput.intlTelInput("getNumber");
        if (t === "+" + $telInput.intlTelInput("getSelectedCountryData").dialCode)
            return "";
        return t;
    };

    var isTelValid = function () {
        return $telInput.intlTelInput("isValidNumber");
    };


    var init = function (config) {
        $.extend(_config, config);

        populateStates();
        
        $dialog.find('.company-multicheck').click(function (e) {
            $(this).toggleClass("checked");
            $(this).find("span").toggleClass("icon-ok");
            setValues(this);
            return false;
        });

        $dialog.on('click', 'a', function (e) {
            $(this).parent().siblings().find("a").removeClass("checked");
            $(this).parent().siblings().find("span").removeClass("icon-ok");

            $(this).toggleClass("checked");
            $(this).find("span").toggleClass("icon-ok");
            setValues(this, "div.dropdown:first");

            if ($(this).parents("ul:first").siblings("a:first").attr('field') === "Industry") {
                var $ul = $dialog.find('#subIndustry');
                $ul.siblings("a:first").html('None <b class="caret"></b>');
                $ul.find("span").removeClass("checked");
                $ul.find("span").removeClass("icon-ok");
                updateSubIndustry(this);
            }
            return true;
        });

        loadDefaultValues();

        setupTel('#phone', '#error-msg', '#valid-msg'); //Activate telephone handling

        $btnSave.click(updateCompany);
        $lookupCountry.on("lookupChanged", updateStates);
    };    

    

    var updateStates = function () {
        if (!statesByCountry)
            return;

        var options = statesByCountry[$lookupCountry.attr("oid")];
        $selectState.empty();
        $selectState.append('<option></option>');
        $.each(options, function (index, value) {
            $selectState.append($("<option></option>")
                .attr("value", value).text(value));
        });
    };

    var loadDefaultState = function () {
        var fields = ['State'];
        var fieldsLen = fields.length;
        var select;

        for (var i = 0; i < fieldsLen; i++) {
            select = $dialog.find("[field='" + fields[i] + "']");
            if (select && select.attr("defaultValue") != '')
                select.val(select.attr("defaultValue"));
        }
    };

    var loadDefaultValues = function () {
        
        //industry
        var industry = $dialog.find("[field='Industry']");
        if (industry && industry.attr("defaultValue") != '') {
            var $results = industry.parent().find("li:contains('" + industry.attr("defaultValue") + "')").filter(function () {
                return $(this).text() === industry.attr("defaultValue");
            });
            $results.find(" a").click();
        }
        //subindustry
        var subindustry = $dialog.find("[field='SubIndustry']");
        if (subindustry && subindustry.attr("defaultValue") != '') {
            subIndustryDefaultValue = subindustry.attr("defaultValue");
            subindustry.parent().find("li:contains('" + subindustry.attr("defaultValue") + "') a").click();
        }
        //practice groups
        var practiceGroups = $dialog.find("[field='PracticeGroup']");
        if (practiceGroups && typeof (practiceGroups.attr("defaultValue")) !== "undefined") {
            var groups = practiceGroups.attr("defaultValue").split(", ");
            for (var i = 0; i < groups.length; i++)
            {
                practiceGroups.parent().find("li:contains('" + groups[i] + "') a").click();
            }
        }
    };
    
    var refreshForm = function () {
        $.ajax({
            type: "GET",
            url: _config.CompanyEditUrl,
            dataType: "html",
            cache: false,
            success: function (resultdata) {
                $('#dlg-update-company').html(resultdata);
            }
        });
    };
    
    var setValues = function (selectedValue, selector) {
        var newValue;
        var checkboxes = [];
        
        $(selectedValue).parents("ul:first").find(".checked").each(
        function () {
            checkboxes.push($(this).text());
        });
        
        if (checkboxes.length == 13) {
            newValue = "All Types";
        }
        else if (checkboxes.length == 0) {
            newValue = "None";
        }
        else {
            
            newValue = checkboxes.join(',');
            
        }
        if (!selector) {
            selector = "div.dropup:first";
        }
        
        var parent = $(selectedValue).parents(selector).children("a.dropdown-toggle");
        
        parent.attr("title", newValue);
        if (newValue.length > 65)
            newValue = newValue.substring(0, 65) + "...";
        parent.html(newValue + " <b class='caret'></b>");
    };
    
    var validate = function (company) {
        if (company.CompanyName == "") {
            $.growlUI("Company Name is required.");
            return false;
        }

        if (company.AddressLine1 == "") {
            $.growlUI("Address Line 1 is required.");
            return false;
        }
        if (company.City == "") {
            $.growlUI("City is required.");
            return false;
        }
        if (company.ZipCode == "") {
            $.growlUI("Zip Code is required.");
            return false;
        }
        if (company.State == "") {
            $.growlUI("State is required.");
            return false;
        }

        //should be object if it loaded a value
        if (typeof (company.Country) === "string") {
            $.growlUI("Country is required.");
            return false;
        }

        company.MainPhone = getTelNumber();

        if (company.MainPhone !== "" && !isTelValid()) {
            $.growlUI("Telephone format '" + company.MainPhone + "' is not valid.");
            return false;
        }

        return true;
    };

    var buildCompanyObject = function () {
        var company = {};
        $dialog.find("[field]").each(function () {
            var $field = $(this);
            if ($field.is("input")) {
                var type = $field.attr("type");

                if (type == "text") {
                    if ($field.attr("oid") != null && $field.attr("otype") != null) {
                        company[$field.attr("field")] = { Id: $field.attr("oid"), EntityTypeName: $field.attr("otype"), DisplayName: $field.attr("value") };
                    }
                    else {
                        company[$field.attr("field")] = $field.val();
                    }
                }
                else if (type == "checkbox") {
                    company[$field.attr("field")] = $field.attr("checked") == "checked";
                }
            }
            else if ($field.is("select")) {
                var value = $field.find(":selected");
                if (value.length == 1) {
                    company[$field.attr("field")] = value.val();
                }

            }
            else if ($field.is("textarea")) {
                company[$field.attr("field")] = $field.val();
            }
            else if ($field.is("a")) {
                if ($field.attr("field") == 'PracticeGroup') {
                    var practiceGroups = [];
                    $field.siblings("ul").find(".checked").each(
                        function () {
                            if ($(this).attr("fieldName")) {
                                practiceGroups.push($(this).attr("fieldName") + "|true");
                            }
                        });

                    $field.siblings("ul").find("a:not(.checked)").each(
                        function () {
                            if ($(this).attr("fieldName")) {
                                practiceGroups.push($(this).attr("fieldName") + "|false");
                            }
                        });

                    company[$field.attr("field")] = practiceGroups.join(";");
                }
                else {
                    var $ul = $field.siblings("ul");
                    var temp = $ul.find(".checked").attr("value");
                    company[$field.attr("field")] = temp;
                }
            }
            

        });

        company.Id = $btnSave.attr("oid");

        return company;
    };

    var updateCompany = function () {
        var isdisabled = $btnSave.attr('disabled');
        if (typeof (isdisabled) == "undefined") {

            $btnSave.button('loading');

            var company = buildCompanyObject();

            if (!validate(company)) {
                $btnSave.button('reset');
                return false;
            }

            ga('send', 'event', 'Company', 'Update');
            $.ajax({
                type: "POST",
                url: _config.CompanyUpdateUrl,
                data: JSON.stringify({ model: company }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response == "INVALID") {
                        alert('Address can’t be validated.  Please correct one of the following: Postal Code, Street Address, City or State.');
                        $btnSave.button('reset');
                    }
                    else {
                        var queryString = window.location.search;
                        if (!queryString) {
                            queryString = "?";
                        }
                        else {
                            queryString += "&";
                        }
                        queryString += "afterUpdate=true"
                        window.open(_config.CompanyDetailsUrl + "/" + response + queryString, "_self");
                    }
                },
                error: function (a, b, c) {
                    alert('An error occurred while updating this company.  Please try again.  If this condition persists, contact a system adminstrator. ' + b);
                    $btnSave.button('reset');
                }
            });
        }
    };

    var updateSubIndustry = function (obj) {
        //console.log(_config.SubIndustryOptions);
        //for (var i = 0; i <= _config.SubIndustryOptions.length; i++) {
        //    console.log(_config.SubIndustryOptions[i]);

        //}
        
        var industry = obj.getAttribute("value");
        
        var subIndustry;
        $.ajax({
            type: "POST",
            url: _config.GetSubIndustryUrl,
            data: JSON.stringify({ industryCode: industry }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                subIndustry = response.Options;
                $ul.empty();

                for (var i = 0, l = subIndustry.length; i < l; i++) {
                    $ul.append('<li><a class="singlecheck" value="' + subIndustry[i].Value + '">' + subIndustry[i].Key + '<span class="pull-right"></span></a></li>')
                }
                var x = $dialog.find("[field='SubIndustry']");
                
                if (subIndustryDefaultValue != '' && subIndustryDefaultValue != undefined)
                {
                    x.html(subIndustryDefaultValue + '<b class="caret"></b>');
                    x.parent().find("li:contains('" + subIndustryDefaultValue + "') a").click();
                    subIndustryDefaultValue = '';
                    
                }
                else
                    x.html('None <b class="caret"></b>');
            },
            error: function () {


            }
        });
        var $ul = $('#subIndustry');
        $ul.find(".singlecheck").each(function () {
            
            $(this).parent().css("display", "none");

        });


        //console.log($ul);

    };


    

    return {
        init: init,
        updateSubIndustry: updateSubIndustry
    };
}();