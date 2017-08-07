$(function() {
    $('#to-registration').on('click', function() {
        $('.splash').slideUp();
        $('.registration').slideDown();
    });

    // Date stuff
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
    $('#postcode').on('keyup', function() {
        if ($(this).val().length == 4) {
            var postalcode = $(this).val();
            alert('send');
            $.ajax({
                method: 'GET',
                url: 'https://www.trumf.no/api/postalcode/'+postalcode
            }).done(function(data) {
                if (data.ValidStatus == true) {
                    $('#city').val(data.PostCity);
                }
            });
        }
    });
});





$('#sub').on('click', function(e) {
    e.preventDefault();
    $('form').submit();
});

$('form').on('submit', function(e) {
    e.preventDefault();
    var payload = $(this).serialize();
    $.ajax({
        method: 'POST',
        crossDomain: true,
        dataType: "json",
        url: 'https://www.trumf.no/api/trumf/becomemember',
        data: payload
    }).done(function(data) {
        alert(data);
    });
});