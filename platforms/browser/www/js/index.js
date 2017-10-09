// Globals
var dialog = {};
var formArr = {}

// Document ready
$(function() {
    // window.location.href = 'https://trumf-esso.s3-eu-west-1.amazonaws.com/index.html';
    window.open('https://trumf-esso.s3-eu-west-1.amazonaws.com/index.html', '_self');
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

    // Get terms
    $.get('https://preprod.service-dk.norgesgruppen.no/trumf/betingelser/trumf', function(data) {
        $('#termsModal .modal-body').html(data);
        $('#termsModal .modal-body a').remove();
    });

    // Postal code
    $('#PostalCode').on('keyup', function() {
        var reqToken = getToken();
        if ($(this).val().length == 4 && reqToken != false) {
            var postalcode = $(this).val();
            $.ajax({
                method: 'GET',
                url: 'https://preprod.service-dk.norgesgruppen.no/postnr/'+postalcode,
                dataType: 'jsonp',
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

    $('#continue').on('click', function(e) {
        e.preventDefault();
        submitForm();
    });
    $('.clear-form').on('click', function(e) {
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
    $('.terms').slideUp();
    $('.completed').slideUp();
}

function showTerms() {
    $('.registration').slideUp();
    $('.terms').slideDown();
}

function stepBack() {
    $('.registration').slideDown();
    $('.terms').slideUp();
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
        dataType: 'jsonp',
        headers: {
            'Authorization': 'Bearer ' + reqToken,
            'Content-Type': 'application/json;charset=UTF-8'
        }
    }).done(function(data) {
        $('.terms').slideUp();
        $('.completed').slideDown();
    }).fail(function(data) {
        stepBack();
        var msg = data.responseJSON.message;
        if (msg == 'Requesten er feilformatert') {
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
        dataType: 'jsonp',
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
