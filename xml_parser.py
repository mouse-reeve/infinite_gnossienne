''' ingest and tokensize notes from musicXML '''
from collections import defaultdict
import random
import sys
from xml.etree import ElementTree

class NotationDistribution(object):
    ''' probabilistic music notation generation data
    musicXML -> musicXML '''

    def __init__(self, filename):
        self.tokens = defaultdict(list)
        self.bass_dist = None
        self.treble_dist = None
        self.identifiers = defaultdict(set)

        self.parse_mxl(filename)

    def parse_mxl(self, filename):
        ''' read through musicXML formatted notation (unzipped)
        this isn't streaming so it'll be slow for large scores '''

        tree = ElementTree.parse(filename).getroot()
        parts = tree.findall('part')

        # TODO: assumes only one part
        measures = parts[0].findall('measure')

        # ---- STEP 1: tokenize
        # identifiers and tokens will be set when this finishes
        for measure in measures:
            self.tokenize_measure(measure)

        # ----- STEP 2: create the bass/melody distribution
        # the bass staff is "2" -- this is brittle
        staff = '2'
        self.bass_dist = {d: defaultdict(lambda: 0) \
                for d in self.identifiers[staff]}
        bass = self.tokens[staff]

        for (idx, note) in enumerate(bass):
            try:
                next_note = bass[idx + 1]
                self.bass_dist[note.identifier][next_note.identifier] += 1
            except IndexError:
                break

        # ----- STEP 3: remove any dead ends
        dead = []
        for (idx, entry) in self.bass_dist.items():
            if not len(entry.keys()):
                dead.append(idx)
        for (idx, entry) in self.bass_dist.items():
            self.bass_dist[idx] = {k: v if not k in dead else 0 \
                    for (k, v) in entry.items()}

        #for (k, entry) in self.bass_dist.items():
        #    print('%s: %s' % (k, dict(entry)))


    def tokenize_measure(self, measure):
        ''' identify and create atomic note group tokens '''
        notes = measure.findall('note')
        notes = sorted(notes, key=lambda n: n.get('staff'))

        measure_tokens = defaultdict(list)
        while len(notes):
            # remove the first note from the list
            note = notes[0]
            notes = notes[1:]
            staff = note.find('staff').text

            is_rest = note.find('rest') is not None

            group = [note]

            if len(notes):
                # gracenotes
                if note.find('grace') is not None or is_rest:
                    note = notes[0]
                    notes = notes[1:]
                    group.append(note)

                # ties
                next_note = notes[0]
                while len(next_note.findall('tie')):
                    notes = notes[1:]
                    group.append(next_note)
                    try:
                        next_note = notes[0]
                    except IndexError:
                        pass

                # chords
                x_pos = note.get('default-x')
                next_note = notes[0]
                while x_pos == next_note.get('default-x'):
                    notes = notes[1:]
                    group.append(next_note)
                    try:
                        next_note = notes[0]
                    except IndexError:
                        pass

            token = NoteToken(group)
            self.identifiers[staff].add(token.identifier)
            measure_tokens[staff].append(token)
        # the notes can be out of order in the measure so we need to sort them
        for (staff, tokens) in measure_tokens.items():
            tokens = sorted(tokens, key=lambda t: t.x_pos)
            #for token in tokens:
            #    print('%f\t%s' % (token.x_pos, token.identifier))
            self.tokens[staff] += tokens



    # ------- let's get generative, friends --------------#
    def generate_measure(self):
        ''' follow the markov probability distribution,
        creating the melody and then the accompanyment
        based on that '''
        # ---- STEP 1: generate the melody (bass staff)
        dist = self.bass_dist

        notes = []
        start = self.tokens['2'][0].identifier
        for _ in range(20):
            notes.append(start)
            options = dist[start]
            try:
                start = weighted_choice(options)
            except IndexError:
                # TODO: remove terminal notes
                print('CRAP!')
                break

        for note in notes:
            print(note)

        music_xml = []
        return '\n'.join(music_xml)


class NoteToken(object):
    ''' an atomic note or set of notes
    gracenotes, chords, and ties should be stored as a unit '''

    def __init__(self, notes):
        self.notes = notes
        self.identifier = get_identifier(notes)
        self.x_pos = None
        for note in notes:
            # the x position should ignore grace notes
            if note.find('grace') is None:
                if note.get('default-x'):
                    self.x_pos = float(note.get('default-x'))
                    break


def get_identifier(notes):
    ''' create a string that uniquely identifies this note token '''
    group_id = []

    # things like x,y position and stem direction aren't meaningful here
    for note in notes:
        identifier = [
            'r' if note.find('rest') is not None else 'n',
            note.find('type').text[0], # .../eigth/quarter/half/whole
            'g' if note.find('grace') is not None else 'r',
            note.find('staff').text,
        ] # should this include tie data?
        pitch = note.find('pitch')
        if pitch is not None:
            identifier += [
                pitch.find('step').text, # CDEFGAB
                pitch.find('octave').text,
            ]

        group_id.append(''.join(identifier))

    return '|'.join(group_id)

def weighted_choice(options):
    ''' prefer likelier followups '''
    if len(options) == 1:
        return options.keys()[0]

    weighted = []
    for (option, weight) in options.items():
        weighted += [option] * weight
    return random.choice(weighted)

if __name__ == '__main__':
    try:
        f = sys.argv[1]
    except IndexError:
        f = 'gnossiennes_1.musicxml'

    notation = NotationDistribution(f)
    notation.generate_measure()
