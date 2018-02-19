$("#gifgen").submit(function (event) {
    event.preventDefault();
    $('#gif').html('Loading...');
    $.ajax({
        dataType: "json",
        type: 'POST',
        url: '/face',
        data: {
            'faceurl': $('#faceurl').val(),
            'resize': $('#resize').val(),
            'caption': $('#caption').val()
        },
        success: function (data) {
            $('#gif').html('<img src="/'+data.filename+'"/>');
        },
        error: function (data) {
            console.log(data);
            $('#gif').html(data.responseJSON.message);
        }
    });
});