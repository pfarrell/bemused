function notify(msg) {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification("▶ " + msg.artist + " " + msg.title);
    setTimeout(notification.close.bind(notification), 4000);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(msg);
        setTimeout(notification.close.bind(notification), 4000);
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them any more.
}
