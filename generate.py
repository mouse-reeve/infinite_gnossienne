''' make a midi file from the dist '''
from mido import MidiFile, MidiTrack, Message
import json
import random

def generate_music(track_dists, starts, time=(0.5 * 60 * 1000)):
    ''' produce new midi data from the distributions
    this should probably be re-written browser-side '''
    starts.reverse()
    mid = MidiFile()
    json_data = []
    for dist in track_dists:
        # create a new track for the generated music
        track = MidiTrack()
        mid.tracks.append(track)

        # create a text version
        json_track = []

        # select the same first note as the original piece
        start = starts.pop()
        token = start
        count = 0
        while count < time:
            for note in token.split('|'):
                note = Message.from_str(note)
                count += note.time
                track.append(note)
                json_track.append({
                    'note': note.note,
                    'velocity': note.velocity,
                    'time': note.time,
                })
            options = dist[token]
            try:
                token = weighted_choice(options)
            except IndexError:
                print('no followup found for token: %s' % token)
                token = start
        json_data.append(json_track)
    mid.save('new.mid')
    json.dump(json_data, open('new.json', 'w'))


def weighted_choice(options):
    ''' prefer likelier followups '''
    if len(options) == 1:
        return options.keys()[0]

    weighted = []
    for (option, weight) in options.items():
        weighted += [option] * weight
    return random.choice(weighted)

