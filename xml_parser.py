''' ingest and tokensize notes from musicXML '''
from collections import defaultdict
import sys
from xml.etree import ElementTree

class NotationDistribution(object):
    ''' probabilistic music notation generation data
    musicXML -> musicXML '''

    def __init__(self, filename):
        self.bass_distribution = defaultdict(list)
        self.treble_distribution = defaultdict(list)
        self.parse_mxl(filename)

    def parse_mxl(self, filename):
        ''' read through musicXML formatted notation (unzipped)
        this isn't streaming so it'll be slow for large scores '''

        tree = ElementTree.parse(filename).getroot()
        parts = tree.findall('part')

        # TODO: assumes only one part
        measures = parts[0].findall('measure')

        for measure in measures:
            self.parse_measure(measure)
            break

    def parse_measure(self, measure):
        notes = measure.findall('note')

        tokens = []
        while len(notes):
            # remove the first note from the list
            note = notes[0]
            notes = notes[1:]

            group = [note]

            rest = note.find('rest')
            if len(notes) and rest is None:
                # group gracenotes
                if note.find('grace') is not None:
                    note = notes[0]
                    notes = notes[1:]
                    group.append(note)

                # ties
                next_note = notes[0]
                while len(next_note.findall('tie')):
                    notes = notes[1:]
                    group.append(note)
                    try:
                        next_note = notes[0]
                    except IndexError:
                        break

                # chords
                x_pos = note.get('default-x')
                next_note = notes[0]
                while x_pos == next_note.get('default-x'):
                    notes = notes[1:]
                    group.append(next_note)
                    try:
                        next_note = notes[0]
                    except IndexError:
                        break

            tokens.append(NoteToken(group))
        return tokens


    def generate_measure(self):
        ''' follow the markov probability distribution,
        creating the melody and then the accompanyment
        based on that '''
        music_xml = []
        return '\n'.join(music_xml)


class NoteToken(object):
    ''' an atomic note or set of notes
    gracenotes, chords, and ties should be stored as a unit '''

    def __init__(self, notes):
        self.notes = notes
        self.identifier = get_identifier(notes)
        print(self.identifier)


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

if __name__ == '__main__':
    try:
        f = sys.argv[1]
    except IndexError:
        f = 'gnossiennes_1.musicxml'

    notation = NotationDistribution(f)
