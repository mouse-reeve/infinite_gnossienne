function createPiano() {
    // initialize audo elements
    for (var i in acoustic_grand_piano) {
        for (var j = 0; j < 2; j++) {
            var note_element = document.createElement('audio');
            note_element.className = i + ' off';
            note_element.id = i + j;
            note_element.src = acoustic_grand_piano[i];
            document.body.append(note_element);
        }
    }
    var play = function (note, track) {
        // TODO: no need to do this every time
        // Notes can overlap slightly, so there are two of each
        var note_elements = document.getElementsByClassName(midi_to_note(note[0]).replace('/', '') + ' off')
        audio = note_elements[0]
        audio.volume = track_options[track].gain;
        audio.play();
        audio.className = audio.className.replace('off', 'on');
        window.setTimeout(stop.bind(null, audio), note[3] * tempo * 1.1);
    };

    var stop = function(audio) {
        // ends a playing note
        audio.className = audio.className.replace('on', 'off');
        var fade = setInterval(function () {
            if (audio.volume - 0.1 > 0) {
                audio.volume -= 0.1;
            } else {
                clearInterval(fade);
                audio.pause()
                audio.currentTime = 0.0;
                audio.className = audio.className.replace('on', 'off');
            }
        }, 50);
    };

    var playNote = function(notes, index, track_id) {
        // smooth tempo changes
        tempo += tempo_variance * (tempo > base_tempo ? -0.01 : 0.001);

        // smooth dynamic changes
        var options = track_options[track_id];
        if (options.gain > options.gain_center) {
            track_options[track_id].gain -= options.gain / 200;
        } else {
            track_options[track_id].gain += options.gain / 200;
        }

        var note = notes[index].split('/');
        var velocity = note[1];
        var delay = note[2] * tempo;

        var note_queue = [];
        if (velocity > 0) {
            note_queue.push(note);
            // handle chords
            while (true) {
                var proposed = notes[index + 1] ? notes[index + 1].split('/') : undefined;
                if (!proposed || proposed[2] > 0 || proposed[1] === 0) {
                    break;
                }
                index += 1;
                note_queue.push(proposed);
            }

            for (var i = 0; i < note_queue.length; i++) {
                play(note_queue[i], track_id);
            }
        }

        if (notes[index + 1]) {
            var next = notes[index + 1].split('/');
            timeouts.push(window.setTimeout(playNote.bind(null, notes, index + 1, track_id), next[2] * tempo));
        }
    };

    playMeasure = function(tokens, restart) {
        // if we're out of room to draw more notes, add a new line
        if (x_pos > length - measure_width) {
            render_staves();
        }

        restart_point = tokens;
        //timeouts.forEach(clearTimeout);
        timeouts = [];
        // wiggle the tempo around
        tempo += tempo_variance * (0.5 - Math.random()) / 8;

        // adjust dynamic
        var new_dynamic;
        if (!current_dynamic || dynamic_age > 5) {
            dynamic_age = 0;
            current_dynamic = current_dynamic == 'p' ? 'f' : 'p';
            new_dynamic = current_dynamic;
            track_options[0].gain = current_dynamic == 'p' ? 0.4 : 1;
            track_options[1].gain = current_dynamic == 'p' ? 0.2 : 0.7;
        } else {
            dynamic_age += 1;
        }

        // annotations
        var annotation;
        if (annotation_age === undefined || annotation_age > 17) {
            annotation = get_annotation();
            annotation_age = 0;
        }
        annotation_age += 1;

        var track_notes = [];
        for (var i = 0; i < tokens.length; i++) {
            track_notes.push(tokens[i].split('|'));
        }

        for (i = 0; i < tokens.length; i++) {
            var notes = track_notes[i];
            var start = notes[0].split('/');
            timeouts.push(window.setTimeout(playNote.bind(null, notes, 0, i),
                start[2] * tempo));
        }

        // draw this measure
        if (!restart) {
            drawNotes(tokens, new_dynamic, annotation);
            x_pos += measure_width;
        }

        // pick the next measure
        var next_tokens = [];
        for (i = 0; i < tokens.length; i++) {
            var options = dists[i][tokens[i]];
            next_tokens.push(weighted_random(options));
        }

        timeouts.push(window.setTimeout(playMeasure.bind(null, next_tokens), measure_length * tempo));
    };

    // done loading, enable the play button
    var start = document.getElementById('start').removeAttribute('disabled');
}
