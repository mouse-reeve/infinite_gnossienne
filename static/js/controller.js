// controls and settings for the app

var start = function () {
    // the button disable should prevent this function from being called
    // if playMeasure is still undefined
    if (playMeasure) {
        // remove the button
        document.getElementById('start').outerHTML = '';
        playMeasure(starts);
    }
};

// function to begin both playing and drawing notes in a measure
var playMeasure;

// --------------- engraving settings --------------------\\
var VF;
var context;
var notation_div;
var length;
// the x_positions of where notes are placed on the stave
var x_pos = 0;
var measure_width = 150;
var staves;
// TODO: I should be able to remove the extra third bar I think
var clefs = ['treble', 'bass', 'bass'];
var flats = ['A', 'B', 'D', 'E'];
// stores vexflow voices containing the data on how to draw a measure
var voice_cache = {};
// tracery grammar for creating annotations
var grammar;
// measrues since we last added an annotation
var annotation_age;

// --------------- midi player settings --------------------\\
// the varying gain on notes played
var current_dynamic;
// how many measures the current dynamic has been active for
var dynamic_age = 0;
var tempo_modifier = 1.1;
var track_options = [
    {gain: 1, sustain: 1, gain_center: 1},
    {gain: 0.3, sustain: 1, gain_center: 0.3},
];

window.onload = function () {
    // ---------------- let us annotate ---------------- \\
    grammar = tracery.createGrammar(grammar_data);

    // ---------------- let us engrave ----------------- \\
    VF = Vex.Flow;
    length = innerWidth * 0.95;
    notation_div = document.getElementById('notation');

    render_staves();

    // ---------------- let us SIIIIING ---------------- \\
    createPiano();
};

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
