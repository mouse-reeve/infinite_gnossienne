''' infinite music from a midi file, mostly if that midi is gnossiennes no 1 '''
from mido import MidiFile

from collections import defaultdict
import json
import sys

class NotationDistribution(object):
    ''' probabilistic music notation generation data '''

    def __init__(self, filename):
        # keep track of the first note in the original piece
        self.starts = [None, None]

        # markov chain probability tables for each track
        self.track_dists = []
        # relationship between simulatanous notes between tracks
        self.joint_dist = defaultdict(lambda: defaultdict(lambda: 0))

        self.measure_length = 1920

        # populates the distributions
        self.parse_midi(filename)


    def parse_midi(self, filename):
        ''' create probability distributions from a midi file
         distributions look like
         {note: {option: probability, option: probability}, note: {..}, ...} '''

        mid = MidiFile(filename)
        tracks = mid.tracks
        # probability that one note follows another in a track
        for (idx, track) in enumerate(tracks):
            dist = defaultdict(lambda: defaultdict(lambda: 0))
            tokens = self.tokenize_track(track)
            for i in range(len(tokens) - 1):
                one = tokens[i]['identifier']
                two = tokens[i + 1]['identifier']
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
            self.track_dists.append(dist)

        # probability of a note in a track given the behavior of the other track


    def tokenize_track(self, track):
        ''' group 4/4 measures together (1920 ms) -- sorry satie '''
        # controls and settings get added back later
        notes = [n for n in track if n.type == 'note_on']

        tokens = []
        group = []
        running_time = 0
        rest_token = {
            'identifier': '70/1/0/1920',
            'notes': [],
        }
        for note in notes:
            running_time += note.time
            # we're done, process the note group into a token
            if running_time >= self.measure_length and note.velocity > 0:
                add_rest = False
                # we have a stray full measure rest
                if group[-1][0].time > 3000:
                    with_rest = group[-1]
                    with_rest[0].time -= self.measure_length
                    with_rest[1] -= self.measure_length
                    group[-1] = with_rest

                    with_rest = group[-2]
                    with_rest[2] -= self.measure_length
                    group[-2] = with_rest
                    add_rest = True

                identifier = []
                for n in group:
                    duration = n[2] - n[1]
                    if not n[0].velocity > 0:
                        duration = 0
                    identifier.append('%d/%d/%d/%d' % \
                            (n[0].note, n[0].velocity, n[0].time, duration))
                identifier = '|'.join(identifier)
                token = {
                    'notes': group,
                    'identifier': identifier
                }
                tokens.append(token)
                if add_rest:
                    tokens.append(rest_token)
                group = []
                running_time = note.time

            # and let's get on with the next group
            note.velocity = 100 if note.velocity else 0

            note = [note, running_time, 0] # note, start time, end time

            # a note ender
            if note[0].velocity == 0:
                # we have to search backwards in the group to find the start
                for (idx, n) in enumerate(group[::-1]):
                    if n[0].note == note[0].note:
                        group[len(group) - 1 - idx][2] = running_time
                        break
            group.append(note)

        return tokens



if __name__ == '__main__':
    try:
        f = sys.argv[1]
    except IndexError:
        f = 'gnossiennes_1.mid'

    notation = NotationDistribution(f)
    json.dump(notation.track_dists, open('dists.json', 'w'))
