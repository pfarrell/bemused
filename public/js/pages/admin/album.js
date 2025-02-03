export function init() {
  console.log('loaded album scripts');
}

export function update_model(id) {
  const form = document.querySelector('.model');
  return post(form, window.location);
}

export function save_track(base_url, id) {
  const form = document.querySelector(`.trackform${id}`);
  const url = `/admin/track/${id}`;
  return post(form, url);
}

export function add_tag(base_url, album_id) {
  const form = document.getElementById('newtag');
  const url = `album/${album_id}/tags`;
  return put(form, url);
}

export function remove_tag(url) {
  document.querySelector(`.tagform${tag_id}`).remove();
  return del(url);
}

export function save_image(id) {
  const form = document.querySelector('.imageform');
  return post(form, `${window.location}/image);
}

export function update_all_tracks(id) {
  const form = document.querySelector('.globalform');
  const url = `${window.location}/tracks`;
  return patch(form, url);
}

export function delete_track(base_url, id) {
  const url = `${base_url}/admin/track/${id}`;
  document.querySelector(`.trackform${id}`).remove();
  return del(url);
} 
