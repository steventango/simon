window.AudioContext = window.AudioContext || window.webkitAudioContext;
var synth = {
  context: new window.AudioContext,
  config: {
    volume: 100,
    instrument: "sine",
  },
  newInstrument: function(name, real, imag) {
    // TODO: test
    synth.instruments[name] = {};
    synth.instruments[name].wave = this.context.createPeriodicWave(real, imag);
  },
  oscillators: {},
  play: function(frequency, duration, start, volume = synth.config.volume, instrument) {
    if (!synth.oscillators[frequency]) {
      var oscillator = this.context.createOscillator();
      var gain = this.context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0;
      oscillator.connect(gain);
      oscillator.start();
      gain.connect(synth.analyser);
      synth.analyser.connect(this.context.destination);
      synth.oscillators[frequency] = {
        oscillator: oscillator,
        gain: gain
      };
    }
    if (!instrument) {
      instrument = synth.config.instrument;
    }
    switch (instrument) {
      case 'sine':
        synth.oscillators[frequency].oscillator.type = 'sine';
        break;
      case 'square':
        synth.oscillators[frequency].oscillator.type = 'square';
        break;
      case 'sawtooth':
        synth.oscillators[frequency].oscillator.type = 'sawtooth';
        break;
      case 'triangle':
        synth.oscillators[frequency].oscillator.type = 'triangle';
        break;
      default:
        if (synth.instruments.hasOwnProperty(instrument)) {
          synth.oscillators[frequency].oscillator.setPeriodicWave(this.instruments[instrument]);
        } else {
          console.error('Error: ' + instrument + ' is not a valid instrument.');
        }
        break;
    }
    setTimeout(function() {
      synth.oscillators[frequency].gain.gain.value = volume / 100;
    }, start || 0);
    if (synth.oscillators[frequency].timeout) {
      window.clearTimeout(synth.oscillators[frequency].timeout);
    }
    synth.oscillators[frequency].timeout = setTimeout(function() {
      synth.oscillators[frequency].gain.gain.setTargetAtTime(0, synth.context.currentTime, 0.015);
      delete synth.oscillators[frequency];
    }, (start || 0) + duration);
  },
  stop: function(frequency, noise) {
    if (frequency) {
      synth.oscillators[frequency].gain.gain.setTargetAtTime(0, synth.context.currentTime, 0.015);
      delete synth.oscillators[frequency];
    } else if (noise) {
      //stop noise
    } else {
      for (var key in synth.oscillators) {
        if (!synth.oscillators.hasOwnProperty(key)) continue;
        var obj = synth.oscillators[key];
        for (var prop in obj) {
          if (!obj.hasOwnProperty(prop)) continue;
          obj.gain.gain.setTargetAtTime(0, synth.context.currentTime, 0.015);
        }
      }
      //stop noise here too
    }
  },
  playNote: function(note, octave, duration, start, volume, instrument) {
    var frequency = this.convert.noteToFrequency(note, octave);
    this.play(frequency, duration, start, volume, instrument);
  },
  playMidi: function(note, octave, duration, start, volume, instrument) {
    var frequency = this.convert.midiToFrequency(midi);
    this.play(frequency, duration, start, volume, instrument);
  },
  playBeat: function() {},
  playMSON: function(mson) {
    for (var key in mson.instruments) {
      var volume = mson.instruments[key].volume;
      var notes = mson.instruments[key].notes;
      var total = 0;
      for (var i = 0; i < notes.length; i++) {
        synth.playNote(notes[i][0], notes[i][1], notes[i][2], total, volume, key.toString());
        console.log(notes[i][0] + ',' + notes[i][1] + ',' + notes[i][2] + ',' + total + ',' + volume + ',' + key.toString());
        total += notes[i][2];
      }
    }
  },
  scales: {
    major: [
      [2, 2, 1, 2, 2, 2, 1]
    ],
    natural_minor: [
      [2, 1, 2, 2, 1, 2, 2]
    ],
    harmonic_minor: [
      [2, 1, 2, 2, 1, 3, 1]
    ],
    melodic_minor: [
      [2, 1, 2, 2, 2, 2, 1],
      [2, 1, 2, 2, 1, 2, 2]
    ],
    dorian_mode: [
      [2, 1, 2, 2, 2, 1, 2]
    ],
    mixolydian_mode: [
      [2, 2, 1, 2, 2, 1, 2]
    ],
    ahava_raba_mode: [
      [1, 3, 1, 2, 1, 2, 2]
    ],
    chromatic: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    pentatonic_major: [
      [2, 2, 3, 2, 3]
    ],
    pentatonic_minor: [
      [3, 2, 2, 3, 2]
    ]
  },
  triads: {
    major: [0, 4, 3],
    minor: [0, 3, 3],
    diminished: [0, 3, 3],
    augmented: [0, 4, 4]
  },
  getScale: function(root, octave, type, octaves) {
    var steps = synth.scales[type][0];
    var slength = synth.scales[type][0].length;
    var scale = [];
    var steps2;
    if (type === 'natural_minor') {
      steps2 = synth.scales[type][1];
    }
    var cstep = synth.convert.noteToHalfSteps(root, octave);
    var j, i, frequency;
    for (j = 0; j < octaves; j++) {
      for (i = 0; i < slength; i++) {
        scale.push(synth.convert.halfstepsToNote(cstep));
        cstep += steps[i];
      }
    }
    scale.push(synth.convert.halfstepsToNote(cstep));
    for (j = octaves; j > 0; j--) {
      for (i = slength; i > 0; i--) {
        scale.push(synth.convert.halfstepsToNote(cstep));
        if (!steps2) {
          cstep = cstep - steps[i - 1];
        } else {
          cstep = cstep - steps2[i - 1];
        }
      }
    }
    scale.push(synth.convert.halfstepsToNote(cstep));
    return scale;
  },
  playScale: function(root, octave, type, octaves, duration, volume, instrument) {
    var notes = synth.getScale(root, octave, type, octaves);
    //temp
    for (var i = 0; i < notes.length; i++) {
      synth.playNote(notes[i][0], notes[i][1], duration, i * duration, volume, instrument);
    }
  },
  getTriad: function(root, octave, type) {
    var triad = [];
    var cstep = synth.convert.noteToHalfSteps(root, octave);
    for (var i = 0; i < 3; i++) {
      cstep += synth.triads[type][i];
      triad.push(synth.convert.halfstepsToNote(cstep));
    }
    return triad;
  },
  playTriad: function(root, octave, type, duration, type2, reverse, volume, instrument) {
    var notes = synth.getTriad(root, octave, type);
  },
  noise: {
    white: function(duration) {
      var bufferSize = 2 * synth.context.sampleRate,
        noiseBuffer = synth.context.createBuffer(1, bufferSize, synth.context.sampleRate),
        output = noiseBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      var whiteNoise = synth.context.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.start(0);
      whiteNoise.connect(synth.analyser);
      synth.analyser.connect(synth.context.destination);
      setTimeout(function() {
        whiteNoise.stop();
      }, duration);
    },
    pink: function(duration) {
      var bufferSize = 4096;
      var pinkNoise = (function() {
        var b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        var node = synth.context.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = function(e) {
          var output = e.outputBuffer.getChannelData(0);
          for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
          }
        };
        return node;
      })();
      pinkNoise.connect(synth.analyser);
      synth.analyser.connect(synth.context.destination);
      setTimeout(function() {
        pinkNoise.disconnect(synth.analyser);
      }, duration);
    },
    brown: function(duration) {
      var bufferSize = 4096;
      var brownNoise = (function() {
        var lastOut = 0.0;
        var node = synth.context.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = function(e) {
          var output = e.outputBuffer.getChannelData(0);
          for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
          }
        };
        return node;
      })();
      brownNoise.connect(synth.analyser);
      synth.analyser.connect(synth.context.destination);
      setTimeout(function() {
        brownNoise.disconnect(synth.analyser);
      }, duration);
    }
  },
  convert: {
    noteToHalfSteps: function(note, octave) {
      note = note.toLowerCase();
      switch (note) {
        case "a":
          note = 0;
          break;
        case "as":
        case "a#":
        case "bf":
        case "bb":
          note = 1;
          break;
        case "b":
          note = 2;
          break;
        case "c":
          note = -9;
          break;
        case "cs":
        case "c#":
        case "df":
        case "db":
          note = -8;
          break;
        case "d":
          note = -7;
          break;
        case "ds":
        case "d#":
        case "ef":
        case "eb":
          note = -6;
          break;
        case "e":
          note = -5;
          break;
        case "f":
          note = -4;
          break;
        case "fs":
        case "f#":
        case "gf":
        case "gb":
          note = -3;
          break;
        case "g":
          note = -2;
          break;
        case "gs":
        case "g#":
        case "af":
        case "ab":
          note = -1;
          break;
        default:
          console.log("Error: " + note + " is not a valid note");
          break;
      }
      octave -= 4;
      octave *= 12;
      var halfsteps = note + octave;
      return halfsteps;
    },
    noteToFrequency: function(note, octave) {
      var halfsteps = this.noteToHalfSteps(note, octave);
      return 440 * Math.pow((1.0594630943592953), halfsteps);
    },
    halfstepsToFrequency: function(halfsteps) {
      return 440 * Math.pow((1.0594630943592953), halfsteps);
    },
    frequencyToHalfSteps: function(frequency) {
      var halfsteps = Math.round(Math.log(frequency / 440) / Math.log(1.0594630943592953));
      return halfsteps;
    },
    frequencyToOctave: function(frequency) {
      var halfsteps = this.frequencyToHalfSteps(frequency);
      var octave = Math.ceil(halfsteps / 12);
      octave += 4;
      if (octave < 0) {
        octave = 0;
      }
      return octave;
    },
    halfstepsToNote: function(halfsteps) {
      var octave = this.frequencyToOctave(this.halfstepsToFrequency(halfsteps));
      var halfstepsx = -((octave - 4) * 12 - halfsteps);
      var note;
      switch (halfstepsx) {
        case 0:
          note = "a";
          break;
        case 1:
          note = "bf";
          break;
        case -10:
        case 2:
          note = "b";
          break;
        case 3:
        case -9:
          note = "c";
          break;
        case 4:
        case -8:
          note = "cs";
          break;
        case 5:
        case -7:
          note = "d";
          break;
        case -6:
          note = "ef";
          break;
        case -5:
          note = "e";
          break;
        case -4:
          note = "f";
          break;
        case -3:
          note = "fs";
          break;
        case -2:
          note = "g";
          break;
        case -1:
          note = "gs";
          break;
        default:
          console.log("Error: " + halfstepsx + " is not a valid halfstep");
          break;
      }
      return [note, octave];
    },
    frequencyToNote: function(frequency) {
      var halfsteps = this.frequencyToHalfSteps(frequency);
      return this.halfstepsToNote(halfsteps);
    },
    midiToFrequency: function(midi) {
      return Math.pow(2, (midi - 69) / 12) * 440;
    },
    frequencyToMidi: function(frequency) {
      return 69 + 12 * (Math.log2(frequency / 440));
    },
  },
  oscilloscope: function(canvasid) {
    synth.analyser.fftSize = 2048;
    var bufferLength = synth.analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    synth.analyser.getByteTimeDomainData(dataArray);
    // draw an oscilloscope of the current audio source
    var canvas = document.getElementById(canvasid);
    var canvasCtx = canvas.getContext('2d');
    var WIDTH = 720;
    var HEIGHT = 480;

    function draw() {
      requestAnimationFrame(draw);
      synth.analyser.getByteTimeDomainData(dataArray);
      canvasCtx.fillStyle = '#000000';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#00ff00';
      canvasCtx.beginPath();
      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;
      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    }
    draw();
  }
};
(function() {
  synth.instruments = {
    electric_piano: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0]),
      new Float32Array([0, 0, 1, 0, 1])),
    piano2: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0]),
      new Float32Array([1, 0.1, 0.3, 0.1, 0.1])),
    flute: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      new Float32Array([1, 9, 3.6, 1.6, 0.3, 0.1, 0, 0.1, 0, 0.1])),
    oboe: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      new Float32Array([1, 0.9, 2.1, 0.2, 0.23, 0.26, 0.55, 0.3, 0.2, 0, 0, 0, 0, 0])),
    clarinet: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      new Float32Array([1, 0.35, 0.253, 0.1, 0.6, 0.2, 0.1, 0, 0, 0, 0, 0, 0])),
    horn: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      new Float32Array([1, 0.4, 0.25, 0.2, 0.09, 0.07, 0.08, 0.06, 0.05, 0])),
    violin: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0]),
      new Float32Array([0, 1.6, 0.9, 1, 0.5])),
    guitar: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      new Float32Array([1, 0.68, 1.3, 0.15, 0.16, 0.15, 0, 0.1, 0.2, 0.4, 0.1, 0])),
    laser: synth.context.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      new Float32Array([1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1])),
  };
  synth.analyser = synth.context.createAnalyser();
  document.addEventListener("DOMContentLoaded", function() {
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (iOS) {
      document.querySelector('body').addEventListener('touchend', function startOsc() {
        synth.play(440, 0, 0, 0);
        document.querySelector('body').removeEventListener('touchend', startOsc, false);
      }, false);
    }
    document.body.addEventListener('click', function() {
      synth.context.resume();
    });
  }, false);
})();
