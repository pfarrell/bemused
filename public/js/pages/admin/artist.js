export function init() {
  console.log('loaded artist scripts');
}

export function add_tag(owner_id) {
  var url = "#{url_for('/artist/')}" + owner_id + '/tags'; 
  var form= $("#newtag");
  return put(form, url);
}

export function remove_tag(url) {
  $('.tagform' + tag_id).remove();
  return del(url);
}

export function update_model(id) {
  var form=$(".model");
  return post(form, window.location);
}

export function save_image(id) {
  var form= $(".imageform");
  var url = `${window.location}/image`;
  return post(form, url);
}
