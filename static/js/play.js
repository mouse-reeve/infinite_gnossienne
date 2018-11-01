var start = function () {
    if (playMeasure) {
        playMeasure(starts);
    }
};
var playMeasure;

var x_pos = 0;
var measure_width = 150;
var clefs = ['treble', 'bass', 'bass'];
var flats = ['A', 'B', 'D', 'E'];
window.onload = function () {
    // ------------ let us annotation ------------- \\
    var length = innerWidth * 0.95;
    var VF = Vex.Flow;
    var div = document.getElementById('notation');

    var staves;
    var context;

    function render_staves() {
        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
        renderer.resize(length, 300);

        context = renderer.getContext();
        staves = [
            new VF.Stave(40, 30, length, { right_bar: false }),
            new VF.Stave(40, 140, length, { right_bar: false }),
            // the secret second bass clef where the whole notes live
            new VF.Stave(40, 140, length, { right_bar: false }),
        ];

        x_pos = 115;
        for (var i = 0; i < staves.length; i++) {
            staves[i].addClef(clefs[i]);
            staves[i].addKeySignature('Ab');
            staves[i].setContext(context).draw();
            staves[i].setNoteStartX(x_pos);
        }
        var connector = new VF.StaveConnector(staves[0], staves[1]);
        var line = new VF.StaveConnector(staves[0], staves[1]);
        connector.setType(VF.StaveConnector.type.BRACE);
        connector.setContext(context);
        connector.setContext(context);
        connector.draw();
        line.setType(VF.StaveConnector.type.SINGLE);
        line.setContext(context);
        line.draw();
    }

    render_staves();

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

        playMeasure = function(tokens) {
            var track_notes = [];
            for (var i = 0; i < tokens.length; i++) {
                track_notes.push(tokens[i].split('|'));
            }

            for (i = 0; i < tokens.length; i++) {
                var notes = track_notes[i];
                var start = notes[0].split('/');
                window.setTimeout(playNote.bind(null, notes, 0, i),
                    start[2] * tempo_modifier);
            }

            // draw this measure
            drawNotes(track_notes);
            x_pos += measure_width;

            // pick the next measure
            var next_tokens = [];
            for (i = 0; i < tokens.length; i++) {
                var options = dists[i][tokens[i]];
                next_tokens.push(weighted_random(options));
            }

            if (x_pos > length - measure_width) {
                render_staves();
            }

            window.setTimeout(playMeasure.bind(null, next_tokens), 1920 * tempo_modifier);
        };

        // done loading
        var start = document.getElementById('start').removeAttribute('disabled');
    });

    // ------------ let us DRAAAAW ------------- \\
    function drawNotes(note_sets) {
        var voices = [];
        for (var i = 0; i < note_sets.length; i++) {
            var notes = note_sets[i];
            voices = voices.concat(get_voice(notes, clefs[i]));
        }

        // I don't know why joining the voices in the loop breakings this but it doooooessss
        var formatter = new VF.Formatter();
        formatter.joinVoices([voices[0]]);
        formatter.joinVoices([voices[1], voices[2]]);
        formatter.format(voices, measure_width);

        var beam_function = function(beam) {
            return beam.setContext(context).draw();
        };
        for (i = 0; i < voices.length; i++) {
            staves[i].setNoteStartX(x_pos);
            var beams = VF.Beam.generateBeams(voices[i].getTickables(), {
                flat_beams: true,
                stem_direction: i >= 1 ? -1 : 1,
            });
            voices[i].draw(context, staves[i]);
            beams.forEach(beam_function);
        }
    }

    function get_voice(notes, clef) {
        notes = notes.filter(function(n) {
            if (n[3] > 0) {
                return n;
            }
        });
        var vf_notes = [];
        var vf_notes_w = [];

        var grace_note;
        var first_note = true;
        for (var i = 0; i < notes.length; i++) {
            // ------------ check for rests
            var rest_note = clef == 'bass' ? 'b/3' : 'e/5';
            if (notes[i] == '70/1/0/1920') {
                // special case: whole note rest
                vf_notes.push(
                    new VF.StaveNote({clef: clef, keys: [rest_note], duration: 'wr'})
                );
                break;
            }
            note = notes[i].split('/');
            if (first_note && note[2] > 25 && note[3] > 60) {
                // we have ourselves a rest
                var rest = get_duration(note[2] - 50) + 'r';
                vf_notes.push(
                    new VF.StaveNote({clef: clef, keys: [rest_note], duration: rest })
                );
            }

            // ------------- note info
            var note_name = midi_to_note(note[0]);
            var duration = parseInt(note[3]);
            var type = get_duration(duration);
            if (duration <= 0) {
                continue;
            }

            // ------------- grace notes
            // stash the grace note away to add it as a modifier to the next note
            if (duration < 100) {
                var gn = new Vex.Flow.GraceNote({keys: [note_name], duration: '8', slash: true });
                grace_note = new Vex.Flow.GraceNoteGroup([gn], true);
                if (flats.indexOf(note_name.split('/')[0]) > -1) {
                    gn.addAccidental(0, new VF.Accidental("n"));
                }
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

            // ------------ create and render vexflow notes
            var params = {clef: clef, keys: names, duration: type };
            params.stem_direction = clef == 'bass' == 1 ? -1 : 1;
            var vf_note = new VF.StaveNote(params);
            // modifiers
            if (grace_note) {
                vf_note.addModifier(0, grace_note.beamNotes());
                grace_note = undefined;
            }
            if (type == 'hd') {
                vf_note.addDotToAll();
            }
            // this works because this piece only has naturals and never on chords
            if (names.length == 1 && flats.indexOf(names[0].split('/')[0]) > -1) {
                vf_note.addAccidental(0, new VF.Accidental("n"));
            }
            // vf_notes_w handles satie doubling up the bass stave
            if (type == 'w') {
                vf_notes_w.push(vf_note);
            } else {
                vf_notes.push(vf_note);
                first_note = false;
            }
        }

        var voice = new VF.Voice({num_beats: 4,  beat_value: 4});
        voice.addTickables(vf_notes);

        var voices = [voice];

        if (vf_notes_w.length > 0) {
            voice = new VF.Voice({num_beats: 4,  beat_value: 4});
            voice.addTickables(vf_notes_w);
            voices.push(voice);
        }
        return voices;
    }
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
    var octave = Math.floor(midi / 12) - 1;
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
