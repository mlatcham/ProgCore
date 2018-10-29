﻿/// <reference path="~/content/scripts/jquery-3.1.1.min.js" />
/// <reference path="~/content/scripts/lib/typeahead.bundle.min.js" />
/// <reference path="~/content/scripts/lib/jquery-confirm.min.js" />


///////////////////////////////////////////////////////////////////
//
// Youbiquitous YBQ : app starter 
// Copyright (c) Youbiquitous srls 2018
//
// Author: Dino Esposito (http://youbiquitous.net)
//

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
};


// **************************************************************************************************//

// <summary>
// Root object for any script function used throughout the application
// </summary>
var Ybq = Ybq || {};
Ybq.Internal = {};
Ybq.RootServer = "";        // Should be set to /vdir when deployed


// <summary>
// Return a root-based path
// </summary>
Ybq.fromServer = function (relativeUrl) {
    return Ybq.RootServer + relativeUrl;
};

// <summary>
// Copy text to the clipboard
// </summary>
Ybq.copyToClipboard = function(text) {
    var el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

// <summary>
// Root object for any script function used throughout the application
// </summary>
Ybq.configureCommonElements = function () {
    // Any A element should blur itself after clicking
    $("a").click(function (e) {
        this.blur();
    });
    //$("select").change(function (e) {
    //    this.blur();
    //    if ($(this).attr('tabIndex') !== undefined) {
    //        var index = parseInt($(this).attr('tabIndex')) + 1;
    //        $(':input[tabindex=' + index + ']')[0].focus();
    //    }
    //});
    $(".alert .alert-autoclose").click(function (e) {
        $(this).hide();
    });
    $("input[data-digits-only]")
        //.attr("onkeypress", "return event.charCode >= 48 && event.charCode <= 57")
        .on("keypress",
            function(event) {
                if (event.charCode < 48 || event.charCode > 57) {
                    event.preventDefault();
                    return false;
                }
            })
        .on("keyup", function () {
            var buffer = $(this).val();
            var maxLength = parseInt($(this).attr("maxlength"));
            if (buffer.length > maxLength) {
                $(this).val("");
                return false;
            }
            var minVal = parseInt($(this).attr("min"));
            var maxVal = parseInt($(this).attr("max"));
            var number = parseInt(buffer);
            if (number < minVal || number > maxVal) {
                $(this).val("");
                return false;
            }
            return true;
        });

    $("input[data-alphanumeric]").attr("onkeypress", "return /[a-zA-Z0-9-_]/.test(event.charCode)");

    $("input[data-click-on-enter]").each(function () {
        $(this).attr("onkeyup",
            "Ybq.clickOnEnter(event, '" + $(this).data("click-on-enter") + "')");
    });
    $(".table-hover tbody tr td").click(function () {
        var attr = $(this).attr("data-notselectable");
        if (typeof attr !== typeof undefined && attr !== false) {
            return;
        }
        var tr = $(this).closest("tr");
        var url = tr.data("url");
        if (url.length > 0)
            Ybq.gotoRelative(url);
    });

    // INPUT TYPE=FILE
    $(".ybq-inputfile").each(function () {
        // Hide the INPUT FILE
        var inputFile = $(this).find("input[type=file]").first();
        inputFile.hide();

        // Sets references to internal components
        var baseId = "#" + $(inputFile).attr("id");
        var isDefinedId = baseId + "-isdefined";
        var previewId = baseId + "-preview";
        var removerId = baseId + "-remover";
        var placeholderId = baseId + "-placeholder";
        var isAnyImageLinked = ($(isDefinedId).val() === "true");

        // Sets up the image placeholder  
        if (isAnyImageLinked) {
            $(placeholderId).hide();
        } else {
            $(placeholderId).show();
        }

        $(placeholderId).click(function () {
            inputFile.click();
        });

        // Sets up the image preview
        $(previewId).data("fileid", baseId);
        if (isAnyImageLinked)
            $(previewId).show();
        else
            $(previewId).hide();
        $(previewId).click(function () {
            inputFile.click();
        });

        // Sets up the remover
        if (isAnyImageLinked)
            $(removerId).show();
        else
            $(removerId).hide();
        $(removerId).click(function () {
            inputFile.val("");
            $(previewId).removeAttr("src").removeAttr("title");
            $(previewId).hide();
            $(placeholderId).show();
            $(this).hide();
            $(isDefinedId).val("false");
            return false;
        });

        // Display selected image
        inputFile.change(function (evt) {
            var files = evt.target.files;
            if (files && files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $(previewId).attr("src", e.target.result);
                    $(previewId).show();
                    $(placeholderId).hide();
                    $(removerId).show();
                    $(isDefinedId).val("true");
                };
                reader.readAsDataURL(files[0]);
            }
        });
        inputFile.click(function (ev) {
            return ev.stopPropagation();
        });
    });

    Ybq.imgLoadError = function (img) {
        var placeholderId = $(img).data("fileid") + "-placeholder";
        $(img).hide();
        $(placeholderId).append("not found");
        $(placeholderId).show();
        var removerId = $(img).data("fileid") + "-remover";
        $(removerId).hide();
    };

};

Ybq.selectableTable = function() {
    $(".table-hover tbody tr td").click(function() {
        var attr = $(this).attr("data-notselectable");
        if (typeof attr !== typeof undefined && attr !== false) {
            return;
        }
        var tr = $(this).closest("tr");
        var url = tr.data("url");
        if (url.length > 0)
            Ybq.gotoRelative(url);
    });
};

// <summary>
// Set SRC in case of missing images
// </summary>
Ybq.defaultImage = function(img, defaultImg) {
    img.onerror = "";
    img.src = defaultImg;
};

// <summary>
// Helper function to post the content of a HTML form
// </summary>
Ybq.postForm = function (formSelector, success, error) {
    var form = $(formSelector);
    var formData = new FormData(form[0]);
    form.find("input[type=file]").each(function () {
        formData.append($(this).attr("name"), $(this)[0].files[0]);
    });

    Ybq.notifyBeginOfOperation(formSelector);
    $.ajax({
        cache: false,
        url: form.attr("action"),
        type: form.attr("method"),
        dataType: "html",
        data: formData,
        processData: false,
        contentType: false,  
        success: function (data) { Ybq.notifyEndOfOperation(formSelector); success(data); },
        error: function (data) { Ybq.notifyEndOfOperation(formSelector); error(data); }
    });
};

// <summary>
// Helper function to disable controls in the form and show a LOADING message
// </summary>
Ybq.notifyBeginOfOperation = function(formSelector) {
    $(formSelector + " input").attr("disabled", "disabled");
    $(formSelector + " button").attr("disabled", "disabled");
    $(formSelector + " a").attr("disabled", "disabled");
    $(formSelector + "-loader").show();
};

// <summary>
// Helper function to re-enable controls in the form and hide any LOADING message
// </summary>
Ybq.notifyEndOfOperation = function(formSelector) {
    $(formSelector + "-loader").hide();
    $(formSelector + " button").removeAttr("disabled");
    $(formSelector + " a").removeAttr("disabled");
    $(formSelector + " input").removeAttr("disabled");
};

// <summary>
// Helper function to call a remote URL (GET)
// </summary>
Ybq.invoke = function (url, success, error) {
    $.ajax({
        cache: false,
        url: Ybq.fromServer(url),
        success: success,
        error: error
    });
};

// <summary>
// Jump to the given ABSOLUTE URL (no transformation made on the URL)
// </summary>
Ybq.goto = function(url) {
    window.location = url;
};

// <summary>
// Jump to the given RELATIVE URL (modified with ROOTSERVER)
// </summary>
Ybq.gotoRelative = function(url) {
    window.location = Ybq.fromServer(url);
};

// <summary>
// Helper function to call a remote URL (POST)
// </summary>
Ybq.post = function (url, data, success, error) {
    $.ajax({
        cache: false,
        url: Ybq.fromServer(url),
        type: 'post',
        data: data,
        success: success,
        error: error
    });
};

// <summary>
// Display a timed alert message
// </summary>
Ybq.toast = function(selector, message, success, partial) {
    var ms = 2500;

    $(selector).removeClass("alert-success alert-danger alert-info alert-warning");
    $(selector).html(message);
    $(selector).addClass(success
        ? (partial ? "alert-warning" : "alert-success")
        : "alert-danger");
    $(selector).show();
    window.setTimeout(function() {
            $(selector).hide();
        },
        ms);
};

// <summary>
// Display a modal message to dismiss (uses jquery.confirm.min.js)
// </summary>
Ybq.alert = function (message, success, partial) {
    var done = "<i class='fa fa-check text-success'></i>";
    var fail = "<i class='fa fa-close text-danger'></i>";
    var warn = "<i class='fa fa-warning text-warning'></i>";
    var title = done;
    var type = "green";
    if (success) {
        if (partial) {
            title = warn;
            type = "orange";
        }
    } else {
        title = fail;
        type = "red";
    }

    var defer = $.Deferred();
    $.confirm({
        keyboardEnabled: true,
        title: title + " " + message,
        type: type,
        content: " ",
        autoClose: "ok|3000",
        buttons: {
            ok: {
                keys: ['Enter'],
                text: "OK",
                action: function() {
                    defer.resolve("true");
                }
            }
        }
    });
    return defer.promise();
};

// <summary>
// Validate an email address
// </summary>
Ybq.validateEmail = function(email) {
    var re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

// <summary>
// Format a number with currency and thousands
// </summary>
Ybq.formatNumber = function(num, sep, currency) {
    if (sep == null)
        sep = ",";
    if (currency == null)
        currency = "";
    var temp = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return temp + " " + currency;
};

// <summary>
// Supports hidden-mobile style
// </summary>
Ybq.mobilize = function() {
    try {
        var mobi = WURFL.is_mobile;
        if (mobi) {
            $(".hidden-mobile").hide();
        }
    } catch (e) {
        console.log(e);
    }
};

// <summary>
// Clicks the selected button if Enter is pressed
// </summary>
Ybq.clickOnEnter = function(event, selector) {
    if (event.keyCode === 13) {
        $(selector).click();
    }
};

// <summary>
// Clear error visuals from form written following conventions
// </summary>
Ybq.clearFormAfterTimeout = function(formSelector, ms) {
    var timeout = 2500;
    if (ms != undefined)
        timeout = ms;
    window.setTimeout(function() {
            $(formSelector + "-loader").hide();
            $(formSelector + " div.has-feedback").removeClass("has-error");
            $(formSelector + "-message").html("").hide();

            ////
            $(formSelector + " input").removeAttr("has-error");
        },
        timeout);
};

// <summary>
// Client-side validation
// </summary>
Ybq.canAcceptValueOf = function(formSelector, fieldId, acceptableCondition, errorMessage, labelId) {
    var fieldSelector = "#" + fieldId;
    var input = $(fieldSelector).val();
    if (acceptableCondition(input))
        return true;

    // Error visuals on
    if (labelId == undefined || labelId.length === 0) {
        labelId = fieldId;
    }
    $(formSelector + "-message")
        .removeClass("alert-success alert-danger alert-warning")
        .addClass("alert-info")
        .show().html(errorMessage);
    $(formSelector + "-group-" + labelId).addClass("has-error");
    $(fieldSelector).focus();
    return false;
};

// <summary>
// Show errors on given input fields
// </summary>
Ybq.invalidateInputField = function(formSelector, focusfieldSelector, errorMessage) {
    $(formSelector + "-message")
        .removeClass("alert-success alert-danger alert-warning")
        .addClass("alert-info")
        .show().html(errorMessage);
    $(focusfieldSelector).focus();
    return false;
};

// <summary>
// Clear error visuals from large (tabbed) form written following conventions
// </summary>
Ybq.canAcceptFormContent = function(formSelector, fieldValidators) {
    var pendingErrors = 0;
    var errorDict = [];

    // Reset UI
    Ybq.Internal.resetAllTabs(formSelector);
    for (var key in fieldValidators) {
        if (fieldValidators.hasOwnProperty(key)) {
            var fv = fieldValidators[key];
            var fieldSelector = "#" + fv.fieldId;
            var currentValue = $.trim($(fieldSelector).val());
            if (!fv.validator(currentValue)) {
                $(formSelector + "-group-" + fv.fieldId).addClass("has-error");
                Ybq.Internal.tabErrorOn(formSelector, fv.tabId, true);

                // Put focus on first input with invalid data in the tab
                if (errorDict[fv.tabId] === undefined) {
                    errorDict[fv.tabId] = fv.fieldId;
                    $(fieldSelector).focus();
                }
                pendingErrors++;
            } else {
                $(formSelector + "-group-" + fv.fieldId).removeClass("has-error");
            }
        }
    }

    return (pendingErrors === 0);
};

// <summary>
// INTERNAL function: resets all tabs in a large form written following conventions
// </summary>
Ybq.Internal.resetAllTabs = function(formSelector) {
    $("div[role=tabpanel]").each(function() {
        var tabIcon = formSelector + "-" + $(this).attr("id") + "-haserror";
        $(tabIcon).hide();
    });
};

// <summary>
// INTERNAL function: set/reset error mode on a specific tab in a large form written following conventions
// </summary>
Ybq.Internal.tabErrorOn = function(formSelector, name, status) {
    var tabIcon = formSelector + "-" + name + "-haserror";
    if (status) {
        $(tabIcon).show();
    } else {
        $(tabIcon).hide();
    }
};



// **************************************************************************************************//

// OPTIONAL LINKS 
//      handlebars-v4-0-2            


// <summary>
// WRAPPER for common operations on Twitter TypeAhead
// </summary>
var TypeAheadContainerSettings = function() {
    var that = {};
    that.postOnSelection = false;
    that.displayKey = 'value';
    that.hintUrl = '';
    that.targetSelector = '';
    that.buddySelector = '';
    that.submitSelector = '';
    that.showHint = true;
    that.maxNumberOfHints = 10;
    that.highlight = true;
    return that;
};

var TypeAheadContainer = function(options) {
    var settings = new TypeAheadContainerSettings();
    jQuery.extend(settings, options);

    // Set up the default Bloodhound hint adapter
    this.hintAdapter = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace(settings.displayKey),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: settings.maxNumberOfHints,
        remote: settings.hintUrl
    });

    // Register handlers
    $(settings.targetSelector).on('typeahead:selected',
        function(e, datum) {
            $(settings.targetSelector).attr("data-itemselected", 1);
            $(settings.buddySelector).val(datum.id);

            // Post on selection
            if (settings.postOnSelection) {
                $(settings.submitSelector).click();
            }
        });
    $(settings.targetSelector).on('blur',
        function() {
            var typeaheadItemSelected = $(settings.targetSelector).attr("data-itemselected");
            if (typeaheadItemSelected !== "1") {
                $(settings.targetSelector).val("");
                $(settings.buddySelector).val("");
            }
        });
    $(settings.targetSelector).on('input',
        function() {
            var typeaheadItemSelected = $(settings.targetSelector).attr("data-itemselected");
            if (typeaheadItemSelected === "1") {
                $(settings.targetSelector).attr("data-itemselected", 0);
                $(settings.buddySelector).val('');
                $(settings.targetSelector).val('');
            }
        });

    // Initializer
    this.attach = function() {
        this.hintAdapter.initialize();
        $(settings.targetSelector).typeahead(
            {
                hint: settings.showHint,
                highlight: settings.highlight,
                limit: settings.maxNumberOfHints,
                autoSelect: false,
            },
            {
                displayKey: settings.displayKey,
                source: this.hintAdapter.ttAdapter(),
                templates: {
                    suggestion: function(data) {
                        return "<p><span>" +
                            data.value +
                            "</span><i class='pull-right'>" +
                            (data.label == null ? "" : data.label) +
                            "</i></p>";
                    }
                }
            }
        );
    };
};

// **************************************************************************************************//

// <summary>
// Ensures all Bootstrap dropdown match size of the screen
// </summary>
Ybq.fixDropdowns = function() {
    $(document).on("shown.bs.dropdown",
        ".dropdown",
        function() {
            // calculate the required sizes, spaces
            var $ul = $(this).children(".dropdown-menu");
            var $button = $(this).children(".dropdown-toggle");
            var ulOffset = $ul.offset();
            // how much space would be left on the top if the dropdown opened that direction
            var spaceUp = (ulOffset.top - $button.height() - $ul.height()) - $(window).scrollTop();
            // how much space is left at the bottom
            var spaceDown = $(window).scrollTop() + $(window).height() - (ulOffset.top + $ul.height());
            // switch to dropup only if there is no space at the bottom AND there is space at the top, or there isn't either but it would be still better fit
            if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown))
                $(this).addClass("dropup");
            // how much space is left rightside
            var spaceRight = $(window).width() - (ulOffset.left + $ul.width());
            //alert(spaceRight);
            if (spaceRight < 10)
                $ul.addClass("dropdown-menu-right");
        }).on("hidden.bs.dropdown",
        ".dropdown",
        function() {
            // always reset after close
            $(this).removeClass("dropup");
        });
};

// <summary>
// Handles MultipleViewResult responses
// </summary>
Ybq.processMultipleAjaxResponse = function (response) {
    var chunkSeparator = "---|||---";
    var tokens = response.split(chunkSeparator);
    return tokens;
};

// <summary>
// Displays a popup window with printer-friendly content
// </summary>
Ybq.printPopup = function (url, target, config) {
    if (target == null || target.length === 0)
        target = "_blank"; // or an app-specific window name of your choice
    if (config == null || config.length === 0) {
        config = "toolbar=no,scrollbars=yes,resizable=yes,top=100,left=100,width=580,height=720;";
    }
    window.open(Ybq.fromServer(url), target, config);
}

