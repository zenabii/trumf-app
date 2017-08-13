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
    $('#postcode').on('keyup', function() {
        if ($(this).val().length == 4) {
            var postalcode = $(this).val();
            $.ajax({
                method: 'GET',
                url: 'https://www.trumf.no/api/postalcode/'+postalcode
            }).done(function(data) {
                if (data.ValidStatus == true) {
                    $('#City').val(data.PostCity);
                }
            });
        }
    });

    // Submit
    $('form').on('submit', function(e) {
        e.preventDefault();
        var payload = $(this).serialize();
        $.ajax({
            method: 'POST',
            url: 'https://www.trumf.no/api/trumf/becomemember',
            dataType: 'json',
            data: payload,
            success: function(data) {
                alert('200');
            },
            error: function(xhr, textStatus, errorThrown) {
                console.log(xhr.responseText);
                console.log('status: '+textStatus);
                console.log('error: '+errorThrown);
            }
        });
    });

});