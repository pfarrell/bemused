function post(form, url) {
  $.ajax( {
      url: url,
      data: form.serialize(),
      method: 'post',
  })
  .done(function(msg) {
  });
}

function del(url) {
  $.ajax({
    url: url,
    method: 'delete'
  });
}

function put(form, url) {
  $.ajax( {
    url: url,
    data: form.serialize(),
    method: 'put',
  })
  .done(function(msg) {
  });
}

function get(url, success, failure) {
  $.getJSON(url)
    .done(success)
    .fail(failure);
}


function get_summary(url) {
  $.getJSON(url)
  .done(function(data) {
      $('#summary').append("<div class='summary'><p class='text'>" + data.summary + "</p>");
      $('#summary').append("<div class='links'><a target='_' href='" + data.url + "'>wikipedia</a></div></div>");
  })
  .fail(function(data) {
    summary_available=false;
    $('#summary').fadeOut();
    });
}
