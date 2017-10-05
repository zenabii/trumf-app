// Globals
var dialog = {};
var formArr = {}

// Document ready
$(function() {
    $('#to-registration').on('click', function() {
        $('.splash').slideUp();
        $('.registration').slideDown();
    });

    // Date
    for (var i = 1; i <= 31; i++) {
        $('select#day').append(`
            <option value="`+i+`">`+i+`</option>
        `);
    }
    for (var i = 2001; i >= 1900; i--) {
        $('select#year').append(`
            <option value="`+i+`">`+i+`</option>
        `);
    }

    // Postal code
    $('#PostalCode').on('keyup', function() {
        var reqToken = getToken();
        if ($(this).val().length == 4 && reqToken != false) {
            var postalcode = $(this).val();
            $.ajax({
                method: 'GET',
                url: 'https://preprod.service-dk.norgesgruppen.no/postnr/'+postalcode,
                headers: {
                    'Authorization': 'Bearer ' + reqToken,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                }
            }).done(function(data) {
                if (data.postSted != undefined) {
                    $('#City').val(data.postSted);
                }
            });
        }
    });

    // Submit
    $('form').on('submit', function(e) {
        e.preventDefault();
        formArr = $(this).serializeArray();
        showTerms();
    });

    // Modal - terms
    dialog = document.querySelector('dialog');
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    $('#confirm-terms').on('click', function(e) {
        e.preventDefault();
        dialog.close();
        submitForm();
    });
    $('#close-terms').on('click', function(e) {
        e.preventDefault();
        dialog.close();
    });
    $('#back-complete').on('click', function(e) {
        e.preventDefault();
        clearForm();
    });
});

function clearForm() {
    $('input').val('');
    $('select').each(function(i, el) {
        el.selectedIndex = 0;
    });
    $('.warning').hide();
    $('.splash').slideDown();
    $('.registration').slideUp();
    $('.completed').slideUp();
}

function showTerms() {
    dialog.showModal();
}

function submitForm() {
    $('.warning').hide();
    var postData = {
        "gateadresse" : $('#Address').val(),
        "poststed" : $('#City').val(),
        "postnr" : $('#PostalCode').val(),
        "medlemmer" : [
            {
                "fornavn" : $('#FirstName').val(),
                "etternavn" : $('#LastName').val(),
                "fodselsdato" : $('#year').val() + '-' + $('#month').val() + '-' + $('#day').val(),
                "kjonn" : "U",
                "mobilnr" : $('#Mobile').val(),
                "epostadresse" : $('#Email').val(),
                "registreringskanal" : "app",
                "registreringskjedeid" : 9940,
                "media" : []
            }
        ]
    };
    if ($('#Bankkort').val().length == 11) {
        postData.medlemmer[0].media.push({
            "mediaId" : $('#Bankkort').val(),
            "korttype" : "Bankkort"
        });
    }
    if ($('#Trumfkort').val().length == 9) {
        postData.medlemmer[0].media.push({
            "mediaId" : $('#Trumfkort').val(),
            "korttype" : "Bankkort"
        });
    }
    var reqToken = getToken();
    $.ajax({
        method: 'POST',
        url: 'https://preprod.service-dk.norgesgruppen.no/trumf',
        data: JSON.stringify(postData),
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + reqToken,
            'Content-Type': 'application/json;charset=UTF-8'
        }
    }).done(function(data) {
        $('.registration').slideUp();
        $('.completed').slideDown();
    }).fail(function(data) {
        var msg = data.responseJSON.message;
        if (msg = 'Requesten er feilformatert') {
            msg = 'En feil har oppstått. Vennligst kontroller skjemaet og prøv igjen.'
        }
        $('.warning').html('<div class="warning-message">'+msg+'</div>');
        document.body.scrollTop = 0;
        $('.warning').show();
    });
}

function getToken() {
    if (verifyToken()) {
        var token = JSON.parse(localStorage.getItem('ngToken'));
        return token.access_token;
    } else {
        return false;
    }
}

function verifyToken() {
    var ngToken = JSON.parse(localStorage.getItem('ngToken'));
    var ngExpires = localStorage.getItem('ngExpires');
    if (ngToken == undefined) {
        var gotToken = requestToken();
    } else {
        gotToken = true;
    }
    if (gotToken != false && ngExpires != undefined && ngExpires > Math.floor(Date.now() / 1000)) {
        return true;
    } else {
        return requestToken();
    }
}

function requestToken() {
    $.ajax({
        method: 'POST',
        url: 'https://oamtest.norgesgruppen.no/ms_oauth/oauth2/endpoints/oauthservice/tokens',
        headers: {
            'Authorization': 'Basic TkdUX0Vzc29fQjJCOjdKQmVrbVdxbFlyeVhkUURERQ==',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        data: {
            grant_type: 'client_credentials',
            scope: 'NGT-B2B.esso NGT-B2B.info'
        }
    }).done(function(data) {
        localStorage.setItem('ngToken', JSON.stringify(data));
        localStorage.setItem('ngExpires', (Math.floor(Date.now() / 1000) + data.expires_in - 30));
        return true;
    });
}
