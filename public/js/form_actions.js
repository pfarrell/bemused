function post(form, url, success_cb, failure_cb) {
  $.ajax( {
      url: url,
      data: form.serialize(),
      method: 'post',
      success: success_cb,
  });
}

function del(url, success_cb, failure_cb) {
  $.ajax({
    url: url,
    method: 'delete',
    success: success_cb,
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
    window[indicator]=true;
    $(summary_elem).fadeIn();
    done(data);
  })
  .fail(function(data) {
    window[indicator=false];
    $(summary_elem).fadeOut();
    });
}
