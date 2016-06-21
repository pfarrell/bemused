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


function get_summary(url, done, indicator, summary_elem) {
  $.getJSON(url)
  .done(function(data) {
    $(summary_elem).fadeIn();
    done(data);
  })
  .fail(function(data) {
    indicator=false;
    $(summary_elem).fadeOut();
    });
}
