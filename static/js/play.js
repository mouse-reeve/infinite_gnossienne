window.onload = function () {
    // ------------ let us annotation ------------- \\
    var VF = Vex.Flow;
    var div = document.getElementById('notation');
    var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(500, 500);

    var context = renderer.getContext();
    var staves = [
        new VF.Stave(10, 40, 400),
        new VF.Stave(10, 150, 400),
        // the secret second bass clef where the whole notes live
        new VF.Stave(10, 150, 400),
    ];

    var clefs = ['treble', 'bass', 'bass'];
    for (var i = 0; i < staves.length; i++) {
        if (clefs[i]) {
            staves[i].addClef(clefs[i]);
            staves[i].setContext(context).draw();
        }
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

            // draw this measure
            drawNotes(notes, track_id);

            // pick the next measure
            var options = dists[track_id][token];
            token = weighted_random(options);

            //window.setTimeout(playMeasure.bind(null, token, track_id), 1920 * tempo_modifier);
        };

        playMeasure(starts[0], 0);
        playMeasure(starts[1], 1);
    });

    function drawNotes(notes, staff) {
        //console.log(notes);
        var vf_notes = [];
        var vf_notes_w = [];

        var grace_note;
        var first_note = true;
        for (var i = 0; i < notes.length; i++) {
            // ------------ check for rests
            if (notes[i] == '70/1/0/1920') {
                // special case: whole note rest
                vf_notes.push(
                    new VF.StaveNote({clef: clefs[staff], keys: ['b/4'], duration: 'wr'})
                );
                break;
            }
            note = notes[i].split('/');
            if (first_note && note[2] > 25 && note[3] > 60) {
                // we have ourselves a rest
                var rest = get_duration(note[2] - 50) + 'r';
                vf_notes.push(
                    new VF.StaveNote({clef: clefs[staff], keys: ['b/4'], duration: rest })
                );
                //console.log(rest);
            }

            // ------------- note info
            var note_name = midi_to_note(note[0]);
            var duration = parseInt(note[3]);
            var type = get_duration(duration);
            if (duration <= 0) {
                continue;
            }
            //console.log(type);

            // ------------- grace notes
            // stash the grace note away to add it as a modifier to the next note
            if (duration < 100) {
                var gn = new Vex.Flow.GraceNote({keys: [note_name], duration: '16', slash: true });
                grace_note = new Vex.Flow.GraceNoteGroup([gn], true);
                continue;
            }

            // ------------ chords
            var names = [note_name];
            while (true) {
                var proposed = notes[i + 1] ? notes[i + 1].split('/') : undefined;
                if (!proposed || proposed[2] > 0 || proposed[1] === 0) {
                    break;
                }
                i += 1;
                var proposed_name = midi_to_note(proposed[0]);
                names.push(proposed_name);
            }
            //console.log(names);

            // ------------ create and render vexflow notes
            var vf_note = new VF.StaveNote({clef: clefs[staff], keys: names, duration: type });
            // modifiers
            if (grace_note) {
                vf_note.addModifier(0, grace_note.beamNotes());
                grace_note = undefined;
            }
            if (type == 'hd') {
                vf_note.addDotToAll();
            }
            // TODO: accidentals
            // handle satie doubling up the bass stave
            if (type == 'w') {
                vf_notes_w.push(vf_note);
            } else {
                vf_notes.push(vf_note);
                first_note = false;
            }
        }

        var voice = new VF.Voice({num_beats: 4,  beat_value: 4});
        voice.addTickables(vf_notes);
        var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
        voice.draw(context, staves[staff]);
        if (vf_notes_w.length > 0) {
            voice = new VF.Voice({num_beats: 4,  beat_value: 4});
            voice.addTickables(vf_notes_w);
            formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
            voice.draw(context, staves[2]);
        }
    }
    //drawNotes(["72/100/480/239", "72/0/239/0", "75/100/1/239", "75/0/239/0", "74/100/1/479", "74/0/479/0", "72/100/1/479", "72/0/479/0"]);

};

function get_duration(duration) {
    var type = 'w';
    if (duration <= 240) {
        type = '8';
    } else if (duration <= 480) {
        type = 'q';
    } else if (duration <= 960) {
        type = 'h';
    } else if (duration < 1773) {
        type = 'hd';
    }
    return type;
}

function midi_to_note(midi) {
    var octave = Math.round(midi / 12) - 1;
    var note = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][(midi % 12)];
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
