var scrubbing, scrubaction, wasplaying = null;

function toggle_visible(obj) {
  obj.is(':visible') ?  obj.fadeOut() : obj.fadeIn();
}

$(document).keydown(function(event) {
  if(!$("#q").is(":focus")) {
    switch(event.which) {
      case 32: //space bar
        event.preventDefault();
        $(".jp-state-playing").length == 1 ? myPlaylist.pause() : myPlaylist.play();
        break;
      case 63: //?
        $("#dialog").dialog({
          buttons: [
            {
              text: "OK",
              click: function() {
                $(this).dialog("close");
              }
            }
          ]
        });
        break;
      case 80: //p
        toggle_visible($('#jp_container_1')); 
        toggle_visible($('#nav')); 
        break;
      case 82: //r
        myPlaylist.shuffle();
        break;
      //case 83: //s
      //  event.preventDefault();
      //  $("#q").focus();
      //  break;
    }
  }
  switch(event.which) {
    case 37: //left arrow
      myPlaylist.previous(); 
      break;
    case 39: //right arrow
      myPlaylist.next();
      break;
  }
});

//Handles the key down event (so the user can hold a key down to continue)
$(document).keydown(function (e) {
  if($("#q").is(":focus")) { return; }
    wasplaying = $(".jp-state-playing").length == 1;
    //Rewind
    if (e.keyCode == 66 && (!scrubbing)) {
        scrubbing = true;
        //Pause the player
        //$("#jquery_jplayer_1").jPlayer("pause");
        RewindTrack();
        scrubaction = window.setInterval(function () { RewindTrack() }, 200);
    }
    else if (e.keyCode == 70 && (!scrubbing)) {
        scrubbing = true;
        //Pause the player
        //$("#jquery_jplayer_1").jPlayer("pause");
        FastforwardTrack();
        scrubaction = window.setInterval(function () { FastforwardTrack() }, 200);
    }
});
//Ends the action
$(document).keyup(function (e) {
    var returnState = wasplaying ? "play" : "pause";
    //Rewind
    if (e.keyCode == 66) {
      scrubbing = false;
      window.clearInterval(scrubaction);
      $("#jquery_jplayer_1").jPlayer(returnState);
    }
    else if (e.keyCode == 70) {
      scrubbing = false;
      window.clearInterval(scrubaction);
      $("#jquery_jplayer_1").jPlayer(returnState);
    }
});

//Related function
function GetPlayerProgress() {
    return ($('.jp-play-bar').width() / $('.jp-seek-bar').width() * 100);
}

//Handles rewinding
function RewindTrack() {
    //Get current progress and decrement
    var currentProgress = GetPlayerProgress();
    //Rewinds 2% of track length
    var futureProgress = currentProgress - 1.5;
    //If it goes past the starting point - stop rewinding and pause
    if (futureProgress <= 0) {
        scrubbining = false;
        window.clearInterval(scrubaction);
        //$("#jquery_jplayer_1").jPlayer("pause", 0);
    }
    //Continue rewinding
    else {
        $("#jquery_jplayer_1").jPlayer("playHead", parseInt(futureProgress, 10));
    }
}

//Fast forwards the track
function FastforwardTrack() {
    //Get current progress and increment
    var currentProgress = GetPlayerProgress();
    //Fast forwards 2%
    var futureProgress = currentProgress + 1.5;
    //If the percentage exceeds the max - stop fast forwarding at the end.
    if (futureProgress >= 100) {
        scrubbing = false;
        window.clearInterval(scrubaction);
        $("#jquery_jplayer_1").jPlayer("playHead", parseInt($('.jp-duration').text().replace(':', '')));
    }
    else {
        $("#jquery_jplayer_1").jPlayer("playHead", parseInt(futureProgress, 10));
    }
}
