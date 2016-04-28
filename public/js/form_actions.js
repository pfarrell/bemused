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
