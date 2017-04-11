$("#gifgen").submit(function (event) {
    event.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/face',
        data: {
            'faceurl': $('#faceurl').val(),
            'resize': $('#resize').val(),
            'caption': $('#caption').val()
        },
        success: function (filename) {
            $('#gif').html('<img src="/'+filename+'"/>');
        }
    });
});