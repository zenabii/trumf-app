
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

    // Validation
    $('form input').on('keyup', function() {
        $(this).parent().removeClass('has-error');
        $(this).siblings('label').find('span').remove();
    });

    $('#FirstName, #LastName').on('blur', function() {
        if ($(this).val().length < 1) {
            $(this).parent().addClass('has-error');
            $(this).siblings('label').find('span').remove();
            $(this).siblings('label').append('<span> må fylles ut</span>');
        } else if ($(this).val().indexOf('@') != -1) {
            $(this).parent().addClass('has-error');
            $(this).siblings('label').find('span').remove();
            $(this).siblings('label').append('<span> inneholder ugyldig tegn</span>');
        }
    });

    $('#PostalCode').on('blur', function() {
        if ($(this).val().length != 4) {
            $(this).val('');
        }
    });

    $('#Email').on('blur', function() {
        var re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm;
        if ($(this).val().length < 1) {
            $(this).parent().addClass('has-error');
            $(this).siblings('label').find('span').remove();
            $(this).siblings('label').append('<span> må fylles ut</span>');
        } else if (!re.test($(this).val())) {
            $(this).parent().addClass('has-error');
            $(this).siblings('label').find('span').remove();
            $(this).siblings('label').append('<span> er ugyldig</span>');
        }
    });

    $('#Bankkort').on('blur', function() {
        if ($(this).val().length > 0 && ($(this).val().length != 11 || !isValidMod11($(this).val().toString()))) {
            $(this).parent().addClass('has-error');
            $(this).siblings('label').find('span').remove();
            $(this).siblings('label').append('<span> er ugyldig</span>');
        }
    });

    // Submit
    $('form').on('submit', function(e) {
        e.preventDefault();
        $('form input').trigger('blur');
        if (!$('.has-error').length) {
            showTerms();
        }
    });

    $('#continue').on('click', function(e) {
        e.preventDefault();
        if ($('#accept-checkbox').prop('checked')) {
            submitForm();
        } else {
            $('#accept-checkbox').parent().parent().addClass('has-error');
        }
    });

    $('#accept-checkbox').on('change', function() {
        $('#accept-checkbox').parent().parent().removeClass('has-error');
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
    $('#accept-checkbox').prop('checked', false);
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
            "korttype" : "Trumf-kort"
        });
    }
    var reqToken = getToken();
    $.ajax({
        method: 'POST',
        url: 'https://preprod.service-dk.norgesgruppen.no/trumf',
        data: JSON.stringify(postData),
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
        method: 'GET',
        url: 'https://qj8h2vvv7a.execute-api.eu-west-1.amazonaws.com/prod/auth',
    }).done(function(data) {
        localStorage.setItem('ngToken', JSON.stringify(data));
        localStorage.setItem('ngExpires', (Math.floor(Date.now() / 1000) + data.expires_in - 30));
        return true;
    });
}

function isValidMod11(input) {
    var checkDigitIndex = input.length - 1;
    return input.substr(checkDigitIndex) === createMod11(input.substr(0, checkDigitIndex));
}

function createMod11(input) {
    var sum = 0;
    input.split('').reverse().forEach(function (value, index) {
        sum += parseInt(value, 10) * (index % 6 + 2);
    });
    var sumMod11 = sum % 11;
    if (sumMod11 === 0) {
        return '0';
    } else if (sumMod11 === 1) {
        return '-';
    } else {
        return (11 - sumMod11) + '';
    }
}