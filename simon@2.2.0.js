/* global FastClick synth Cookie*/
var simon = {
  dialog(label = '', description = '', classname) {
    document.getElementById('dialog').className = 'mdc-dialog';
    if (classname) {
      document.getElementById('dialog').classList.add(classname);
    }
    document.getElementById('dialog-label').innerHTML = label;
    document.getElementById('dialog-description').innerHTML = description;
    simon.elements.dialog.show();
    document.getElementById('fab').classList.add('mdc-fab--exited');
    document.getElementById('extended_fab').classList.add('mdc-fab--exited');
    mdc.autoInit.default(simon.elements.dialog.root_);
  },
  elements: {
    toggles: {}
  },
  ingame: false,
  speed: 250,
  input: [],
  tiles: {
    all() {
      this.flash('green', true);
      this.flash('red', true);
      this.flash('yellow', true);
      this.flash('blue', true);
    },
    flash(colour, mute) {
      if (!mute) {
        switch (colour) {
          case 'green':
            synth.playNote('bf', 4, simon.speed);
            break;
          case 'red':
            synth.playNote('gs', 4, simon.speed);
            break;
          case 'yellow':
            synth.playNote('fs', 4, simon.speed);
            break;
          case 'blue':
            synth.playNote('ds', 4, simon.speed);
            break;
        }
      }
      simon.tiles.tiles[colour].classList.add('active');
      setTimeout(() => {
        simon.tiles.tiles[colour].classList.remove('active');
      }, simon.speed);
    },
    click(e) {
      var colour = e.target.id;
      if (simon.ingame) {
        simon.input.push(colour);
        simon.tiles.flash(colour);
        //compare sequences
        for (var i = 0; i < simon.input.length; i++) {
          if (simon.input[i] === simon.sequences.sequence[i]) {
            if (simon.input.length === simon.sequences.sequence.length) {
              simon.scores.score++;
              simon.push.set(simon.scores.score);
              simon.scores.display();
              simon.input = [];
              simon.tiles.disable();
              simon.loop();
            }
          } else {
            simon.input = [];
            simon.end();
            break;
          }
        }
      }
    },
    enable() {
      for (var tile in this.tiles) {
        this.tiles[tile].style.pointerEvents = 'all';
      }
    },
    disable() {
      for (var tile in this.tiles) {
        this.tiles[tile].style.pointerEvents = 'none';
      }
    },
    init() {
      this.tiles.green = document.getElementById('green');
      this.tiles.red = document.getElementById('red');
      this.tiles.yellow = document.getElementById('yellow');
      this.tiles.blue = document.getElementById('blue');
      for (var tile in this.tiles) {
        this.tiles[tile].addEventListener('click', simon.tiles.click, true);
      }
      this.disable();
    },
    tiles: {}
  },
  start() {
    document.getElementById('fab').classList.add('mdc-fab--exited');
    document.getElementById('extended_fab').classList.add('mdc-fab--exited');
    document.getElementById('start_screen').style.pointerEvents = 'none';
    simon.ingame = true;
    simon.speed = 250
    simon.tiles.init();
    simon.scores.score = 0;
    simon.sequences.sequence = [];
    simon.countdown.start();
    simon.push = firebase.database().ref('games/').push();
  },
  end() {
    simon.tiles.disable();
    simon.tiles.all();
    synth.playNote('fs', 4, simon.speed * 2);
    simon.ingame = false;
    simon.elements.display.innerText = 'Simon+';
    document.getElementById('start_screen').style.pointerEvents = 'all';
    if (!simon.highscore.update()) {
      simon.gameover();
    }
  },
  gameover() {
    simon.leaderboard.display(5).then(() => {
      simon.dialog('Game Over', `<div><h2 class="mdc-dialog__header__title" hidden>Game Over</h2>Score: ${simon.scores.score}<br>
    High Score: ${simon.highscore.highscore}</div><div>
    <h2 class="mdc-dialog__header__title">Leaderboard</h2>
    ${simon.leaderboard.list.outerHTML}</div>
    <button id="start-button" class="mdc-button mdc-button--raised mdc-elevation--z4" tabIndex="-1" data-mdc-auto-init="MDCRipple">
      Play Again?
    </button>
    `, 'gameover');
      document.getElementById('fab').classList.remove('mdc-fab--exited');
      document.getElementById('start-button').addEventListener('click', () => {
        simon.elements.dialog.close();
        setTimeout(simon.start, 120);
      });
      if (simon.defferedPrompt && !window.navigator.standalone) {
        document.getElementById('extended_fab').classList.remove('mdc-fab--exited');
        document.getElementById('extended_fab').addEventListener('click', e => {
          document.getElementById('extended_fab').classList.add('mdc-fab--exited');
          simon.defferedPrompt.prompt();
          simon.deferredPrompt.userChoice.then(choice => {
            if (choice.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
            } else {
              console.log('User dismissed the A2HS prompt');
            }
          });
        });
      } else if (/iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && navigator.userAgent.indexOf('CriOS') == -1 && !navigator.standalone) {
        document.getElementById('extended_fab').classList.remove('mdc-fab--exited');
      }
    });
  },
  share() {
    if (navigator.share) {
      navigator.share({
        title: 'Simon+',
        text: 'Beat my record in Simon+!',
        url: 'https://steventang.tk/simon/',
      }).catch((error) => console.warn(error));
    } else if (!/Snapchat/.test(navigator.userAgent)) {
      simon.elements.bottom_sheet.show();
      if (!document.querySelector('#bottom_sheet a').classList.contains('mdc-ripple-upgraded')) {
        mdc.autoInit.default(simon.elements.bottom_sheet.root_);
        document.querySelectorAll('#bottom_sheet a').forEach(child => child.addEventListener('click', () => {
          setTimeout(() => simon.elements.bottom_sheet.close(), 120);
        }));
      }
    }
  },
  information() {
    simon.dialog('Information', `<div class="information">
        Simon+ is a memory game, your goal is to repeat the sequence of colours.<br>
        Simon+ is a Progressive Web App that works offline.<br><br>
        Created by <a href="https://steventang.tk">Steven Tang</a><br>
        Version 2.2.0<div>`);
  },
  countdown: {
    remaining: 3,
    start() {
      setTimeout(() => {
        simon.elements.display.innerText = simon.countdown.remaining;
        simon.elements.display.classList.add('scale');
        setTimeout(() => {
          simon.elements.display.classList.remove('scale');
        }, simon.speed);

        simon.tiles.all();

        synth.playNote('c', 4, simon.speed);

        simon.countdown.remaining--;
        if (this.remaining > 0) {
          simon.countdown.start();
        } else {
          setTimeout(() => {
            synth.playNote('c', 5, simon.speed * 2);
            simon.countdown.remaining = 3;
            simon.loop();
          }, simon.speed * 3.5);
        }
      }, simon.speed * 2);
    }
  },
  leaderboard: {
    display(n) {
      this.list = document.createElement('div');
      for (let i = 0; i < 2; i++) {
        let list = document.createElement('ul');
        list.classList.add('mdc-list');
        this.list.appendChild(list);
      }
      return firebase.database().ref('leaderboard/').orderByChild('score').limitToLast(n).once('value')
        .then((snapshot) => {
          let n = 0;
          snapshot.forEach((child, index) => {
            let data = child.val();
            let item = document.createElement('li');
            item.classList.add('mdc-list-item');
            item.innerHTML = `<span class="mdc-list-item__graphic material-icons" aria-hidden="true">sentiment_very_satisfied</span>
          <span class="mdc-list-item__text">${data.name}</span>
          <span class="mdc-list-item__meta" aria-hidden="true">${data.score}</span>`;
            index = n > 4 ? 0 : 1;
            this.list.childNodes[index].insertBefore(item, this.list.childNodes[index].firstChild);
            n++;
          });
          if (n > 5) {
            simon.leaderboard.list.classList.add('di-list');
          }
        });
    },
    update(name = '') {
      var pusher = firebase.database().ref('leaderboard/').push();
      pusher.set({
        name: name,
        push: simon.push.key,
        score: simon.highscore.highscore
      }).then(() => {
        simon.push.set(null);
        pusher.update({
          push: null
        });
      });
    }
  },
  scores: {
    display() {
      simon.elements.display.innerText = this.score;
      simon.elements.display.classList.add('scale');
      setTimeout(() => {
        simon.elements.display.classList.remove('scale');
      }, simon.speed);
    },
    score: 0,
  },
  highscore: {
    update() {
      Cookie.set('simon_highscore', this.highscore, 10000);
      if (simon.scores.score > this.highscore) {
        this.highscore = simon.scores.score;
        simon.dialog('New Highscore!', `<div class="mdc-text-field" data-mdc-auto-init="MDCTextField">
          <input type="text" id="name-textfield" class="mdc-text-field__input" pattern=".{1,32}" length="32" required>
          <label class="mdc-floating-label" for="name-textfield">Name</label>
          <div class="mdc-line-ripple"></div>
        </div><button id="submit-button" class="mdc-button mdc-button--raised" data-mdc-auto-init="MDCRipple">
          Submit
        </button>`);
        document.getElementById('submit-button').addEventListener('click', () => {
          let name = document.getElementById('name-textfield');
          if (name.checkValidity()) {
            simon.leaderboard.update(name.value);
            simon.gameover();
          }
        })
        return true;
      } else {
        simon.push.set(null);
        return false;
      }
    },
    highscore: 0
  },
  sequences: {
    i: 0,
    sequence: [],
    update() {
      var colours = ['green', 'red', 'yellow', 'blue'];
      this.sequence.push(
        colours[Math.floor(Math.random() * 4)]
      );
    },
    display() {
      setTimeout(function() {
        simon.tiles.flash(simon.sequences.sequence[simon.sequences.i]);
        simon.sequences.i++;
        if (simon.sequences.i < simon.sequences.sequence.length && simon.ingame) {
          simon.sequences.display();
        } else {
          simon.sequences.i = 0;
          simon.tiles.enable();
        }
      }, simon.speed * 3);
    }
  },
  loop() {
    if (this.ingame) {
      this.scores.display();
      this.sequences.update();
      this.sequences.display();
      this.speed -= 5;
    }
  },
  configure: {
    volume(boolean) {
      if (boolean) {
        synth.config.volume = 0;
        simon.elements.toggles.volume.on = true;
        Cookie.set('simon_volume', true, 10000);
      } else {
        synth.config.volume = 100;
        simon.elements.toggles.volume.on = false;
        Cookie.set('simon_volume', false, 10000);
      }
    },
    darkmode(boolean) {
      if (boolean) {
        document.body.classList.add('mdc-theme--dark');
        simon.elements.toggles.darkmode.on = true;
        Cookie.set('simon_darkmode', true, 10000);
      } else {
        document.body.classList.remove('mdc-theme--dark');
        simon.elements.toggles.darkmode.on = false;
        Cookie.set('simon_darkmode', false, 10000);
      }
    }
  },
  init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/simon/dev/sw.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    }
    window.addEventListener('beforeinstallprompt', e => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      simon.defferedPrompt = e;
    });

    FastClick.attach(document.body);

    document.body.addEventListener('touchmove', e => e.preventDefault(), {
      passive: false
    });

    var config = {
      apiKey: "AIzaSyB3iyaTqHbr1aYPhATUYSrI8ebXFH3vHHI",
      authDomain: "simonplus-b609f.firebaseapp.com",
      databaseURL: "https://simonplus-b609f.firebaseio.com",
      projectId: "simonplus-b609f",
      storageBucket: "simonplus-b609f.appspot.com",
      messagingSenderId: "811018003376"
    };
    firebase.initializeApp(config);

    mdc.autoInit.default.register('MDCIconToggle', mdc.iconToggle.MDCIconToggle);
    mdc.autoInit.default.register('MDCTextField', mdc.textfield.MDCTextField);
    mdc.autoInit.default.register('MDCRipple', mdc.ripple.MDCRipple);
    [
      document.querySelector('#fab'),
      document.querySelector('#extended_fab')
    ].map(e => mdc.ripple.MDCRipple.attachTo(e));
    [
      document.querySelector('header'),
      document.querySelector('main'),
    ].map(e => mdc.autoInit.default(e));

    simon.elements.toggles.volume = mdc.iconToggle.MDCIconToggle.attachTo(document.getElementById('volume_toggle'));
    simon.elements.toggles.volume.root_.addEventListener('MDCIconToggle:change', event => {
      simon.configure.volume(event.detail.isOn);
    });

    simon.elements.toggles.darkmode = mdc.iconToggle.MDCIconToggle.attachTo(document.getElementById('darkmode_toggle'));
    simon.elements.toggles.darkmode.root_.addEventListener('MDCIconToggle:change', event => {
      simon.configure.darkmode(event.detail.isOn);
    });

    document.getElementById('leaderboard_toggle').addEventListener('MDCIconToggle:change', () => {
      simon.leaderboard.display(10).then(() => {
        simon.dialog('Leaderboard', simon.leaderboard.list.outerHTML);
      })
    });
    document.getElementById('information_toggle').addEventListener('MDCIconToggle:change', simon.information);
    document.getElementById('start_screen').addEventListener('click', simon.start);
    document.querySelector('#fab').addEventListener('click', simon.share)

    simon.elements.dialog = new mdc.dialog.MDCDialog(document.querySelector('#dialog'));
    simon.elements.dialog.listen('MDCDialog:cancel', function() {
      if(document.getElementById('dialog-label').textContent == 'New Highscore!') {
        simon.push.set(null);
      }
    });
    simon.elements.bottom_sheet = new mdc.dialog.MDCDialog(document.querySelector('#bottom_sheet'));
    simon.elements.display = document.getElementById('display');

    simon.highscore.highscore = Cookie.get('simon_highscore') || 0;
    simon.configure.volume(Cookie.get('simon_volume'));
    simon.configure.darkmode(Cookie.get('simon_darkmode'));

    if (!Cookie.get('simon_visited')) {
      simon.information();
      Cookie.set('simon_visited', true, 10000);
    }
  },

};
simon.init();
