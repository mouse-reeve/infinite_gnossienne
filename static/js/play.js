window.onload = function () {
    var notation = [[], []];
    var idx = 0;

    Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano').then(function (piano) {
        var time_mod = 750;
        var track_options = [
            {gain: 1, sustain: 1},
            {gain: 0.4, sustain: 1},
        ];
        for (var i = 0; i < midi_data.length; i++) {
            var track = midi_data[i];
            var options = track_options[i];
            var running_time = 0;
            var active_notes = {};
            for (var j = 0; j < track.length; j++) {
                var note = track[j];
                running_time += note.time;
                if (note.velocity > 0) {
                    var midi_note = piano.start(note.note, running_time / time_mod, options);
                    active_notes[note.note] = running_time;
                } else {
                    // a note completes, we have enough information to display it (or at least, we have start and end time)
                    var start = active_notes[note.note];
                    notation[i].push([note.note, start, running_time]);
                }
            }
        }
    }).then(function() {
        console.log('the music begins');
    });

};
