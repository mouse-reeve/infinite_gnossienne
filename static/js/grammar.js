var grammar_data = {
    'intro': ['so as to', 'don\'t'],
    'adverb': ['very', 'lightly', 'healthily', 'rigorously', 'diligently'],
    'verb': [
        'have', 'ask', 'wonder about', 'consider', 'ponder', 'mediate',
        'desecrate', 'meditate on', 'reject', 'bury', 'conceal', 'request',
        'defer to', 'listen to', 'ignore', 'repudiate', 'light', 'open',
        'widen', 'experiment with', 'console', 'secrete', 'deliver',
        'obtain', 'collect', 'spread out', 'expand', 'join',
        'interrogate', 'answer',
    ],
    'noun': [
        'humility', 'joy', 'despondence', 'loneliness',
        'sadness', 'conviction', 'clarity', 'walls', 'air', 'water', 'darkness',
        'benevolence', 'ill intent', 'questions', 'trepidation', 'fear',
        'tranquility', 'clairvoyance', 'wit', 'a hole', 'the sound',
        'your head', 'your body', 'your hands', 'yourself', 'superiority',
        'ingenuity',
    ],
    'adjective': ['calm', 'gaunt', 'moderate', 'slow', 'alone', 'placid',
        'turgid', 'transformed', 'translucent', 'ingenious',
        'pensive', 'forgetful', 'resourceful', 'illuminated', 'lost',
        'lonely', 'transparent', 'liquid', 'kind', 'polite', 'pensive',
        'magisterial', 'bureaucratic', 'timid', 'benevolent', 'proud',
        'wise', 'lustrous', 'nostalgic', 'indulgent', 'reticent', 'secretive',
    ],
};

function choose_word(list, skip) {
    if (Math.random() < skip) {
        return;
    }
    return list[Math.floor(Math.random() * list.length)];
}

function get_annotation() {
    var text = [];
    var dice_roll = Math.random();
    if (dice_roll < 0.4) {
        // so as to  reject  your hands
        text = [
            choose_word(grammar_data.intro, 0.8),
            choose_word(grammar_data.verb),
            choose_word(grammar_data.noun),
        ];
    } else if (dice_roll < 0.8) {
        // with  humility
        text = [
            choose_word(['with', 'in']),
            choose_word(grammar_data.noun),
        ];
    } else {
        // don't  be  very  timid
        text = [
            choose_word(grammar_data.intro, 0.6),
            'be',
            choose_word(grammar_data.adverb, 0.5),
            choose_word(grammar_data.adjective),
        ];
    }

    text = text.join(' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
}
