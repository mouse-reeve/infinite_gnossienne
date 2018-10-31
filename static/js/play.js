window.onload = function () {
    // ------------ let us annotation ------------- \\
    var VF = Vex.Flow;
    var div = document.getElementById('notation');
    var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(500, 500);

    var context = renderer.getContext();
    var staves = [
        new VF.Stave(10, 40, 400),
        new VF.Stave(10, 100, 400),
    ];

    var clefs = ['treble', 'bass'];
    for (var i = 0; i < staves.length; i++) {
        staves[i].addClef(clefs[i]);
        staves[i].setContext(context).draw();
    }


    // ------------ let us SIIIIING ---------------- \\
    var track_options = [
        {gain: 1, sustain: 1},
        {gain: 0.3, sustain: 1},
    ];


    Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano').then(function (piano) {
        var tempo_modifier = 1.1;

        var playNote = function(notes, index, track_id) {
            var note = notes[index].split('/');
            var velocity = note[1];
            var delay = note[2] * tempo_modifier;

            var play = [];
            if (velocity > 0) {
                play.push(note[0]);
                // handle chords
                while (true) {
                    var proposed = notes[index + 1] ? notes[index + 1].split('/') : undefined;
                    if (!proposed || proposed[2] > 0 || proposed[1] === 0) {
                        break;
                    }
                    index += 1;
                    play.push(proposed[0]);
                }

                for (var i = 0; i < play.length; i++) {
                    piano.play(play[i], 0, track_options[track_id]);
                }
            }

            if (notes[index + 1]) {
                var next = notes[index + 1].split('/');
                window.setTimeout(playNote.bind(null, notes, index + 1, track_id), next[2] * tempo_modifier);
            }
        };

        var playMeasure = function(token, track_id) {
            var time = 0;
            var notes = token.split('|');

            var start = notes[0].split('/');
            window.setTimeout(playNote.bind(null, notes, 0, track_id),
                start[2] * tempo_modifier);

            var options = dists[track_id][token];
            token = weighted_random(options);

            window.setTimeout(playMeasure.bind(null, token, track_id), 1920 * tempo_modifier);
        };

        playMeasure(starts[0], 0);
        playMeasure(starts[1], 1);
    });

    function drawNotes(notes, staff) {
        var vf_notes = [];

        for (var i = 0; i < 4 && i < notes.length; i++) {
            note = notes[i].split('/');
            var note_name = midi_to_note(note[0]);
            vf_notes.push(
                new VF.StaveNote({clef: clefs[staff], keys: [note_name], duration: "q" })
            );
        }

        var voice = new VF.Voice({num_beats: 4,  beat_value: 4});
        voice.addTickables(vf_notes);
        var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
        voice.draw(context, staves[staff]);
    }

};

function midi_to_note(midi) {
    var octave = Math.round(midi / 12) - 1;
    var note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
    return note + '/' + octave;
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
