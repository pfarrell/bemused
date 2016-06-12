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

function patch(form, url) {
  $.ajax( {
    url: url,
    data: form.serialize(),
    method: 'patch'
  })
  .done(function(msg) {
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


function get_summary(url, done) {
  $.getJSON(url)
  .done(function(data) {
    done(data);
  })
  .fail(function(data) {
    summary_available=false;
    $('#summary').fadeOut();
    });
}
