/**
 * ThingBot Core — Terminal OS + Program Manager
 * A modular, expandable system for running programs inside a simulated terminal.
 */

class ThingBot {
  constructor(terminalSelector, avatarSelector) {
    this.terminalBody = document.querySelector(terminalSelector);
    this.avatar = document.querySelector(avatarSelector);
    this.inputField = document.querySelector('.terminal-input');
    this.sendBtn = document.querySelector('.terminal-btn');
    this.speechBubble = document.querySelector('#tb-speech');
    
    this.buffer = []; // output buffer
    this.mood = 'neutral'; // current avatar mood
    this.currentProgram = null;
    this.history = []; // command history
    this.historyIndex = -1;
    this.facts = [];
    this.faceAnimating = false; // prevent animation spam
    
    // Response tracking
    this.factRequestCount = 0;
    this.responses = {};
    this.responseMood = 'happy'; // tracks which response set to use
    
    // Program registry
    this.programs = {};
    this.registerDefaultPrograms();
    
    // Event listeners
    if (this.inputField) {
      this.inputField.addEventListener('keydown', (e) => this.handleKeyDown(e));
      this.inputField.disabled = false;
    }
    if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.submitInput());
    
    // Boot sequence
    this.boot();
  }

  // ============= Terminal Output =============
  print(text, type = 'normal') {
    const line = document.createElement('div');
    line.className = `term-line term-line-${type}`;
    line.innerHTML = this.formatText(text);
    this.terminalBody.appendChild(line);
    this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
  }

  printMuted(text) { this.print(text, 'muted'); }
  printBot(text) { this.print(text, 'bot'); }
  printError(text) { this.print(`[ERROR] ${text}`, 'error'); }

  formatText(text) {
    // Simple inline code formatting: `code` → <code>code</code>
    return text.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  clear() {
    this.terminalBody.innerHTML = '';
    this.printBot('Terminal cleared.');
  }

  // ============= Avatar Mood =============
  setMood(mood) {
    const moodClass = `mood-${mood}`;
    if (this.avatar) {
      this.avatar.className = this.avatar.className.replace(/mood-\w+/, '');
      this.avatar.classList.add(moodClass);
    }
    this.mood = mood;
    
    // Trigger contextual animations
    setTimeout(() => {
      if (mood === 'happy') this.wiggleBrows();
      else if (mood === 'thinking') this.lookAround('random');
      else if (mood === 'angry') this.shock();
      else if (mood === 'neutral') this.blink();
    }, 150);
  }

  // ============= Face Animations =============
  blink() {
    if (this.faceAnimating) return;
    this.faceAnimating = true;
    
    const eyes = this.avatar.querySelectorAll('.tb-eye');
    eyes.forEach(eye => eye.classList.add('blink'));
    
    setTimeout(() => {
      eyes.forEach(eye => eye.classList.remove('blink'));
      this.faceAnimating = false;
    }, 300);
  }

  lookAround(direction = 'random') {
    if (this.faceAnimating) return;
    this.faceAnimating = true;
    
    const dir = direction === 'random' ? (Math.random() > 0.5 ? 'left' : 'right') : direction;
    const pupils = this.avatar.querySelectorAll('.tb-pupil');
    
    pupils.forEach((p, i) => {
      const animClass = i === 0 ? `look-${dir}` : `look-${dir}`;
      p.classList.add(animClass);
    });
    
    setTimeout(() => {
      pupils.forEach(p => p.classList.remove('look-left', 'look-right'));
      this.faceAnimating = false;
    }, 600);
  }

  shock() {
    if (this.faceAnimating) return;
    this.faceAnimating = true;
    
    const eyes = this.avatar.querySelectorAll('.tb-eye');
    eyes.forEach(eye => eye.classList.add('shock'));
    
    setTimeout(() => {
      eyes.forEach(eye => eye.classList.remove('shock'));
      this.faceAnimating = false;
    }, 300);
  }

  wiggleBrows() {
    if (this.faceAnimating) return;
    this.faceAnimating = true;
    
    const brows = this.avatar.querySelectorAll('.tb-eyebrow');
    brows.forEach(brow => brow.classList.add('wiggle'));
    
    setTimeout(() => {
      brows.forEach(brow => brow.classList.remove('wiggle'));
      this.faceAnimating = false;
    }, 500);
  }

  // ============= Program Manager =============
  registerProgram(name, program) {
    this.programs[name] = program;
  }

  registerDefaultPrograms() {
    this.registerProgram('shell', {
      name: 'Shell',
      onEnter: () => {
        this.printBot('Welcome to ThingBot Shell v1.0');
        this.printMuted('Type `help` for a list of commands.');
        this.setMood('happy');
        this.resetFactCount();
      },
      onInput: (cmd) => this.handleShellInput(cmd),
      onExit: () => {
        this.setMood('neutral');
        this.resetFactCount();
      }
    });

    this.registerProgram('facts', {
      name: 'Facts',
      onEnter: async () => {
        if (this.facts.length === 0) {
          this.printMuted('[facts] Loading fact database...');
          await this.loadFacts();
        }
        if (Object.keys(this.responses).length === 0) {
          this.printMuted('[facts] Loading response library...');
          await this.loadResponses();
        }
        this.printBot('Entering Facts mode. Type `next` for a new fact, or `exit` to leave.');
        this.setMood('happy');
        this.resetFactCount();
      },
      onInput: (cmd) => this.handleFactsInput(cmd),
      onExit: () => {
        this.printMuted('[facts] Exiting Facts mode.');
        this.resetFactCount();
      }
    });

    this.registerProgram('pong', {
      name: 'Pong',
      onEnter: () => {
        this.printBot('Pong mode (placeholder). Type `exit` to leave.');
        this.setMood('happy');
      },
      onInput: (cmd) => {
        if (cmd === 'exit') {
          this.exitProgram();
        } else {
          this.printMuted('Pong: ' + cmd);
        }
      },
      onExit: () => {
        this.printMuted('[pong] Exiting Pong mode.');
      }
    });
  }

  runProgram(name) {
    if (this.currentProgram) {
      this.currentProgram.onExit?.();
    }
    
    const program = this.programs[name];
    if (!program) {
      this.printError(`Program '${name}' not found.`);
      return;
    }
    
    this.currentProgram = program;
    program.onEnter?.();
  }

  exitProgram() {
    if (this.currentProgram) {
      this.currentProgram.onExit?.();
      this.currentProgram = null;
    }
    this.runProgram('shell');
  }

  // ============= Input Handling =============
  handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.submitInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
      this.inputField.value = this.history[this.history.length - 1 - this.historyIndex] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.historyIndex = Math.max(this.historyIndex - 1, -1);
      this.inputField.value = this.historyIndex >= 0 ? this.history[this.history.length - 1 - this.historyIndex] : '';
    }
  }

  submitInput() {
    const cmd = this.inputField.value.trim();
    if (!cmd) return;

    this.print(`nisse$ ${cmd}`, 'prompt');
    this.history.push(cmd);
    this.historyIndex = -1;
    this.inputField.value = '';

    // Route to current program or shell
    if (this.currentProgram && this.currentProgram.onInput) {
      this.currentProgram.onInput(cmd);
    } else {
      this.handleShellInput(cmd);
    }
  }

  // ============= Shell Commands =============
  handleShellInput(cmd) {
    const [action, ...args] = cmd.split(/\s+/);

    switch (action.toLowerCase()) {
      case 'help':
        this.printBot('Available commands:');
        this.printMuted('  run <program>   - Run a program (facts, pong)');
        this.printMuted('  mood <mood>     - Change avatar mood (happy, sad, thinking, angry, sleep, neutral)');
        this.printMuted('  blink           - Make ThingBot blink');
        this.printMuted('  look            - Make ThingBot look around');
        this.printMuted('  clear           - Clear terminal');
        this.printMuted('  exit            - Exit ThingBot');
        break;

      case 'blink':
        this.blink();
        this.printBot('👁️ Blink.');
        break;

      case 'look':
        this.lookAround('random');
        this.printBot('👀 Looking around...');
        break;

      case 'run':
        if (args.length === 0) {
          this.printError('Usage: run <program>');
        } else {
          this.runProgram(args[0].toLowerCase());
        }
        break;

      case 'mood':
        if (args.length === 0) {
          this.printBot(`Current mood: ${this.mood}`);
        } else {
          const newMood = args[0].toLowerCase();
          const validMoods = ['happy', 'sad', 'thinking', 'angry', 'sleep', 'neutral'];
          if (validMoods.includes(newMood)) {
            this.setMood(newMood);
            this.printBot(`Mood changed to: ${newMood}`);
          } else {
            this.printError(`Invalid mood. Valid moods: ${validMoods.join(', ')}`);
          }
        }
        break;

      case 'clear':
        this.clear();
        break;

      case 'exit':
        this.printMuted('Shutting down ThingBot...');
        this.setMood('sleep');
        break;

      default:
        this.printError(`Unknown command: ${action}. Type 'help' for available commands.`);
    }
  }

  // ============= Facts Loading =============
  async loadFacts() {
    try {
      const response = await fetch('assets/data/facts.txt');
      const text = await response.text();
      this.facts = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); // remove empty lines
      return this.facts;
    } catch (err) {
      this.printError(`Failed to load facts: ${err.message}`);
      return [];
    }
  }

  getRandomFact() {
    if (this.facts.length === 0) {
      return 'No facts loaded. Try again later.';
    }
    return this.facts[Math.floor(Math.random() * this.facts.length)];
  }

  // ============= Response Management =============
  async loadResponses() {
    const responseSets = ['happy', 'neutral', 'tired', 'upset'];
    for (const set of responseSets) {
      try {
        const response = await fetch(`assets/data/thingbot-responses/${set}-responses.txt`);
        const text = await response.text();
        this.responses[set] = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      } catch (err) {
        console.warn(`Failed to load ${set}-responses.txt`, err);
        this.responses[set] = ['...'];
      }
    }
  }

  getRandomResponse(moodSet = 'happy') {
    const responses = this.responses[moodSet] || ['...'];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  showSpeechBubble(text, mood = 'happy', duration = 2000) {
    if (!this.speechBubble) return;
    
    // Remove previous animation classes
    this.speechBubble.classList.remove('fade-out', 'mood-happy', 'mood-tired', 'mood-upset');
    
    // Set content and mood
    this.speechBubble.querySelector('.tb-speech-text').textContent = text;
    this.speechBubble.classList.add('active', `mood-${mood}`);
    
    // Auto-hide after duration
    setTimeout(() => {
      this.speechBubble.classList.add('fade-out');
      setTimeout(() => {
        this.speechBubble.classList.remove('active', 'fade-out');
      }, 400);
    }, duration);
  }

  updateFactMoodEscalation() {
    // Escalate mood based on fact request count
    if (this.factRequestCount <= 2) {
      this.responseMood = 'happy';
      this.setMood('happy');
    } else if (this.factRequestCount <= 5) {
      this.responseMood = 'neutral';
      this.setMood('thinking');
    } else if (this.factRequestCount <= 8) {
      this.responseMood = 'tired';
      this.setMood('thinking'); // still thinking but tired
    } else {
      this.responseMood = 'upset';
      this.setMood('angry');
    }
  }

  resetFactCount() {
    this.factRequestCount = 0;
    this.responseMood = 'happy';
  }

  // ============= Program: Facts with Personality =============
  handleFactsInput(cmd) {
    if (cmd === 'exit') {
      this.exitProgram();
    } else if (cmd === 'next') {
      this.factRequestCount++;
      this.updateFactMoodEscalation();
      
      // Show thinking response before fact
      const response = this.getRandomResponse(this.responseMood);
      this.showSpeechBubble(response, this.responseMood, 1200);
      
      // Show fact after brief delay
      setTimeout(() => {
        const fact = this.getRandomFact();
        this.printBot(`📚 ${fact}`);
      }, 800);
    } else {
      this.printMuted(`Unknown command in Facts mode. Type 'next' or 'exit'.`);
    }
  }

  // ============= Boot Sequence =============
  boot() {
    this.printMuted('[BOOT] Initializing ThingBot OS...');
    this.printMuted('[BOOT] Loading core modules...');
    this.printMuted('[BOOT] Connecting to host...');
    
    this.blink();
    setTimeout(() => {
      this.blink();
    }, 400);
    
    setTimeout(() => {
      this.printBot('✓ ThingBot online.');
      this.runProgram('shell');
      this.lookAround();
    }, 800);
  }
}

// ============= Initialize on page load =============
document.addEventListener('DOMContentLoaded', () => {
  const thingbot = new ThingBot('.terminal-body', '.thingbot-hero-bot');
  window.thingBot = thingbot; // expose for debugging & future extensions
});
