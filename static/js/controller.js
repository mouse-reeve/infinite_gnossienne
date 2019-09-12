// controls and settings for the app

var start = function () {
    // the button disable should prevent this function from being called
    // if playMeasure is still undefined
    if (playMeasure) {
        // remove the button
        document.getElementById('start').outerHTML = '';
        document.getElementById('pause').style.display = 'inline';
        play();
    }
};

var play = function(restart) {
    if (restart) {
        document.getElementById('pause').style.display = 'inline';
        document.getElementById('play').style.display = 'none';
    }
    playMeasure(restart_point, restart);
};
var pause = function () {
    document.getElementById('pause').style.display = 'none';
    document.getElementById('play').style.display = 'inline';
    timeouts.forEach(clearTimeout);
    var ons = document.getElementsByClassName('on');
    for (var i = 0; i < ons.length; i++) {
        ons[i].pause();
        ons[i].currentTime = 0;
        ons[i].className = ons[i].className.replace('on', 'off');
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
// measrues since we last added an annotation
var annotation_age;

// --------------- midi player settings --------------------\\
// the varying gain on notes played
var current_dynamic;
// how many measures the current dynamic has been active for
var dynamic_age = 0;
var tempo_range = [1.1, 1.3]
var tempo = tempo_range.reduce(function(a, b) { return a + b; }) / 2;
// 0 = no variance, always play at base tempo.
var tempo_variance = 0.001;
var tempo_direction = -1;
// TODO: measure length should be computed rather than hard-coded
var measure_length = 1920;
var track_options = [
    {gain: 0.8, gain_center: 0.8},
    {gain: 0.2, gain_center: 0.1},
];
// this stores all the window.setTimeout events that exist
var timeouts = [];
// the current set of notes, so that you can restart after pause
var restart_point = starts;

window.onload = function () {
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

