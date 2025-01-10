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

function build_favorites_entities(track) {
  return "<a id=\"fave_track_" + track.id + "\" title=\"unfavorite '" + track.title + "'\" class='" + (track.favorited == "true" ? "" : "hidden") + "'  onClick=\"javascript:unfavorite_track('" + track.favorite_url + "')\"><div class='glyphicon glyphicon-heart'></div></a><a id=\"unfave_track_" + track.id + "\" title=\"favorite '" + track.title + "'\" class='" + (track.favorited == "false" ? "" : "hidden") + "' onClick=\"javascript:favorite_track('" + track.favorite_url + "')\"><div class='glyphicon glyphicon-heart-empty'></div></a>"
}

function favorite_track(url) {
  var form=$(".track_favorites");
  return post(form, url, favorite_callback, failure_callback);
}

function unfavorite_track(url) {
  return del(url, unfavorite_callback, failure_callback);
}

function favorite_callback(data) {
  $("#fave_track_" + data.target_id).removeClass("hidden");
  $("#unfave_track_" + data.target_id).addClass("hidden");
}

function unfavorite_callback(data) {
  $("#unfave_track_" + data.target_id).removeClass("hidden");
  $("#fave_track_" + data.target_id).addClass("hidden");
}

function failure_callback(data) {
  alert(data);
}

