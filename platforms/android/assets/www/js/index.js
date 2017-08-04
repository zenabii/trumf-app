$(function() {
    $('#to-registration').on('click', function() {
        $('.splash').slideUp();
        $('.registration').slideDown();
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