# Infinite Gnossienne

An endless version of Erik Satie's Gnossiennes No. 1.

I parsed a midi file of the piece into artificial 4/4 measures (the piece is in free time, I know, sorry Satie)
and made a markov chain associating the measures across the bass and treble tracks. The result plays back as an endless
version of the comopsition.

Libraries in use:
- [Soundfont-Player](https://github.com/danigb/soundfont-player) for playing the audio
- [VexFlow](https://github.com/0xfe/vexflow) for displaying the sheet music
- [Tracery](https://github.com/galaxykate/tracery) for generating sheet music instruction annotations
