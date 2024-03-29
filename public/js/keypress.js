var scrubbing, scrubaction, wasplaying = null;

function findBootstrapEnvironment() {
    var envs = ["ExtraSmall", "Small", "Medium", "Large"];
    var envValues = ["xs", "sm", "md", "lg"];

    var $el = $('<div>');
    $el.appendTo($('body'));

    for (var i = envValues.length - 1; i >= 0; i--) {
        var envVal = envValues[i];

        $el.addClass('hidden-'+envVal);
        if ($el.is(':hidden')) {
            $el.remove();
            return envs[i]
        }
    };
}

$(document).ready(function() {
  $('.collapse').on('show.bs.collapse', function() {
    $("#q").focus();
  });
});

function toggle_visible(obj) {
  obj.is(':visible') ?  obj.fadeOut() : obj.fadeIn();
}

$(document).keydown(function(event) {
  if(!keypress_enable || ['q', 'track'].includes(document.activeElement.id)) { return; }
  switch(event.which) {
    case 32: //space bar
      event.preventDefault();
      $(".jp-state-playing").length == 1 ? myPlaylist.pause() : myPlaylist.play();
      break;
    case 63:  //?
    case 191: // shift+backspace
      //dialog?
      break;
    case 80: //p
      toggle_visible($('#player'));
      toggle_visible($('#nav'));
      //toggle_visible($('#visualization'));
      if(album_summary_available) {
        toggle_visible($('#album_summary'));
      }
      if(track_summary_available) {
        toggle_visible($('#track_summary'));
      }
      break;
    case 83: //s
      if(findBootstrapEnvironment() == "ExtraSmall") {
        $("#navbar-collapse").collapse("toggle");
      }
      break;
    case 82: //r
      myPlaylist.shuffle();
      break;
    case 86: //v
      //toggle_visible($('#visualization'));
      break;
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
  if(document.activeElement.id == 'q') { return; }

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
