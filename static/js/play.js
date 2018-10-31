window.onload = function () {
    var notation = [[], []];
    var idx = 0;

    var track_options = [
        {gain: 1, sustain: 1},
        {gain: 0.4, sustain: 1},
    ];

    Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano').then(function (piano) {
        var tempo_modifier = 1.1;

        var playNote = function(notes, index, track_id) {
            var note = notes[index].split('/');
            var delay = note[2] * tempo_modifier;
            if (note[1] > 0) {
                piano.play(note[0], delay, track_options[track_id]);

                midi_to_note(note[0]);
            }
            if (notes[index + 1]) {
                window.setTimeout(playNote.bind(null, notes, index+1, track_id), delay);
            }
        };

        var playMeasure = function(token, track_id) {
            var time = 0;
            var notes = token.split('|');
            playNote(notes, 0, track_id);

            var options = dists[track_id][token];
            token = weighted_random(options);

            window.setTimeout(playMeasure.bind(null, token, track_id), 1920 * tempo_modifier);
        };

        playMeasure(starts[0], 0);
        playMeasure(starts[1], 1);
    });


};

function midi_to_note(midi) {
    var octave = Math.round(midi / 12) - 1;
    var note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
    console.log(note, octave);
}

function weighted_random(options) {
    // {identifier:  1, identifier: 6, ...}
    var listed = [];
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
        var option = keys[i];
        var weight = options[option];
        for (j = 0; j < weight; j++) {
            listed.push(option);
        }
    }

    return listed[Math.floor(Math.random() * listed.length)];
}
