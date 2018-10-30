''' infinite music from a midi file, mostly if that midi is gnossiennes no 1 '''
from mido import MidiFile, MidiTrack, Message

from collections import defaultdict
import random
import sys

class NotationDistribution(object):
    ''' probabilistic music notation generation data '''

    def __init__(self, filename):
        self.tokens = defaultdict(list)
        self.identifiers = defaultdict(set)
        self.starts = [None, None]
        self.track_dists = [
            defaultdict(lambda: defaultdict(lambda: 0)),
            defaultdict(lambda: defaultdict(lambda: 0)),
        ]
        self.joint_dist = defaultdict(lambda: defaultdict(lambda: 0))

        self.parse_midi(filename)


    def parse_midi(self, filename):
        ''' this isn't streaming so it'll be slow for large scores '''

        mid = MidiFile(filename)
        tracks = mid.tracks
        # probability that one note follows another in a track
        for (idx, track) in enumerate(tracks):
            dist = self.track_dists[idx]
            tokens = tokenize_track(track)
            for i in range(len(tokens) - 1):
                one = tokens[i]
                two = tokens[i + 1]
                if self.starts[idx] is None:
                    self.starts[idx] = one
                dist[one][two] += 1

            # remove dead ends (or just make them very improbable)
            dead = []
            for (idx, entry) in dist.items():
                if not len(entry.keys()):
                    dead.append(idx)
            for (idx, entry) in dist.items():
                dist[idx] = {k: v if not k in dead else 0 \
                        for (k, v) in entry.items()}

        # probability of a note in a track given the behavior of the other track

    def generate_music(self, time=(3 * 60 * 1000)):
        ''' produce new midi data from the distributions
        this should probably be re-written browser-side '''
        self.starts.reverse()
        mid = MidiFile()
        for dist in self.track_dists:
            track = MidiTrack()
            mid.tracks.append(track)
            start = self.starts.pop()
            group = start
            count = 0
            while count < time:
                for note in group.split('|'):
                    note = Message.from_str(note)
                    count += note.time
                    track.append(note)
                options = dist[group]
                try:
                    group = weighted_choice(options)
                except IndexError:
                    print(group)
                    group = start
        mid.save('new.mid')


def tokenize_track(track):
    ''' find indivisible groups of notes '''
    notes = [n for n in track if n.type == 'note_on']
    tokens = []
    while notes:
        base_note = notes[0].note
        group = []
        while notes:
            note = notes[0]
            note.velocity = 100 if note.velocity else 0
            group.append(note.__str__())
            notes = notes[1:]
            if not notes:
                break
            if notes[0].note == base_note:
                break
        group = '|'.join(group)
        tokens.append(group)
    return tokens


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
        f = 'gnossiennes_1.mid'

    notation = NotationDistribution(f)
    notation.generate_music()
