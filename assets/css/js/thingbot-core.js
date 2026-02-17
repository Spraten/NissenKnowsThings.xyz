// assets/js/thingbot-core.js
// ThingBot "OS" foundation:
// - Terminal printing
// - Avatar moods
// - Program manager (shell, facts, pong, etc.)

(function () {
  // DOM references
  const terminalBody = document.getElementById("terminal-body");
  const terminalInput = document.getElementById("terminal-input");
  const terminalSend = document.getElementById("terminal-send");
  const avatarEl = document.getElementById("thingbot-avatar");

  if (!terminalBody || !terminalInput || !terminalSend) {
    console.warn("[ThingBot] terminal elements missing in HTML");
    return;
  }

  // ------------------------
  // Avatar / mood management
  // ------------------------

  const MOODS = ["neutral", "happy", "thinking", "warning", "angry", "sleep"];

  function setMood(mood) {
    if (!avatarEl) return;
    if (!MOODS.includes(mood)) mood = "neutral";
    avatarEl.setAttribute("data-mood", mood);
  }

  // ---------------
  // Terminal helpers
  // ---------------

  /**
   * Low-level printer for terminal.
   * type: "user" | "bot" | "system"
   */
  function printLine(text, type = "bot") {
    const p = document.createElement("p");
    p.classList.add("term-line");

    if (type === "bot") {
      p.classList.add("term-line-bot");
    } else if (type === "user") {
      p.classList.add("term-line-user");
    } else if (type === "system") {
      p.classList.add("term-line-muted");
    }

    // Simple inline code style: `something`
    const formatted = text.replace(
      /`([^`]+)`/g,
      '<span class="term-inline-code">$1</span>'
    );
    p.innerHTML = formatted;

    terminalBody.appendChild(p);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function clearTerminal() {
    terminalBody.innerHTML = "";
  }

  /**
   * Optional: wrapper preserving your old signature writeToTerminal(text, color)
   * so you can re-use older snippets if you want.
   */
  function writeToTerminal(text, color) {
    const p = document.createElement("p");
    p.classList.add("term-line");
    p.style.color = color || "#ffffff";
    p.textContent = text;
    terminalBody.appendChild(p);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // -------------------------
  // Program manager / routing
  // -------------------------

  /**
   * Programs are simple objects:
   * {
   *   id: "shell",
   *   name: "Main Shell",
   *   description: "...",
   *   onEnter(ctx) {},
   *   onExit(ctx) {},
   *   onInput(line, ctx) {}
   * }
   *
   * ctx gives programs controlled powers:
   *   ctx.print(text, type)
   *   ctx.clear()
   *   ctx.setMood(mood)
   *   ctx.switchProgram(id)
   */

  const programs = {};
  let currentProgramId = null;

  function registerProgram(program) {
    if (!program || !program.id) {
      console.warn("[ThingBot] attempted to register invalid program", program);
      return;
    }
    programs[program.id] = program;
  }

  function getProgramContext() {
    return {
      print: printLine,
      clear: clearTerminal,
      setMood,
      switchProgram,
      writeToTerminal, // compatibility helper
    };
  }

  function switchProgram(id) {
    const next = programs[id];
    if (!next) {
      printLine(`[ThingBot] program \`${id}\` not found.`, "bot");
      return;
    }

    const prev = programs[currentProgramId];
    const ctx = getProgramContext();

    if (prev && typeof prev.onExit === "function") {
      prev.onExit(ctx);
    }

    currentProgramId = id;
    clearTerminal();

    if (typeof next.onEnter === "function") {
      next.onEnter(ctx);
    }
  }

  function handleInputFromUser(rawLine) {
    const line = rawLine.trim();
    if (!line) return;

    // echo command
    printLine("> " + line, "user");

    if (!currentProgramId || !programs[currentProgramId]) {
      printLine(
        "[ThingBot] no active program. booting shell...",
        "system"
      );
      switchProgram("shell");
    }

    const program = programs[currentProgramId];
    const ctx = getProgramContext();

    if (typeof program.onInput === "function") {
      program.onInput(line, ctx);
    } else {
      printLine(
        `[ThingBot] program \`${program.id}\` does not handle input yet.`,
        "bot"
      );
    }
  }

  // -------------
  // Shell program
  // -------------

  const shellProgram = {
    id: "shell",
    name: "ThingBot Shell",
    description: "Main dispatcher for ThingBot programs.",
    onEnter(ctx) {
      setMood("neutral");
      ctx.print("[ThingBot] shell ready.", "bot");
      ctx.print("type `help` for commands.", "system");
    },
    onExit(ctx) {
      ctx.print("[ThingBot] leaving shell...", "system");
    },
    onInput(line, ctx) {
      const [cmd, ...args] = line.split(/\s+/);
      const argString = args.join(" ");

      switch (cmd.toLowerCase()) {
        case "help":
          ctx.print("[ThingBot] available commands:", "bot");
          ctx.print("- `help`          : show this help", "system");
          ctx.print("- `programs`      : list known programs", "system");
          ctx.print("- `run <name>`    : start a program", "system");
          ctx.print("- `mood <state>`  : change avatar mood", "system");
          ctx.print("- `clear`         : clear the terminal", "system");
          break;

        case "programs": {
          ctx.print("[ThingBot] installed programs:", "bot");
          Object.values(programs).forEach(p => {
            ctx.print(
              `- \`${p.id}\` : ${p.name || "no name"}`
            , "system");
          });
          break;
        }

        case "run": {
          if (!argString) {
            ctx.print("[ThingBot] usage: `run <program-id>`", "bot");
            return;
          }
          ctx.print(`[ThingBot] launching \`${argString}\`...`, "bot");
          ctx.switchProgram(argString);
          break;
        }

        case "mood": {
          if (!argString) {
            ctx.print(
              "[ThingBot] usage: `mood <neutral|happy|thinking|warning|angry|sleep>`",
              "bot"
            );
            return;
          }
          setMood(argString.toLowerCase());
          ctx.print(`[ThingBot] mood set to \`${argString}\`.`, "bot");
          break;
        }

        case "clear":
          ctx.clear();
          break;

        default:
          ctx.print(
            `[ThingBot] unknown command: \`${cmd}\`. try \`help\`.`,
            "bot"
          );
      }
    },
  };

  // -------------------
  // Facts program (stub)
  // -------------------

  const factsProgram = {
    id: "facts",
    name: "Fact Core",
    description: "ThingBot tells you random facts.",
    onEnter(ctx) {
      setMood("happy");
      ctx.print("[ThingBot] fact core online.", "bot");
      ctx.print("commands:", "system");
      ctx.print("- `fact`    : show a random fact", "system");
      ctx.print("- `back`    : return to shell", "system");
    },
    onExit(ctx) {
      ctx.print("[ThingBot] shutting down fact core...", "system");
    },
    onInput(line, ctx) {
      const [cmd, ...rest] = line.split(/\s+/);
      switch (cmd.toLowerCase()) {
        case "fact":
          // For now, just stub. Later you can fetch from data.json.
          setMood("thinking");
          ctx.print(
            "[ThingBot] here's a placeholder fact: computers are just very fast rocks.",
            "bot"
          );
          setTimeout(() => setMood("happy"), 300);
          break;

        case "back":
          ctx.switchProgram("shell");
          break;

        default:
          ctx.print(
            "[ThingBot] commands in this program: `fact`, `back`.",
            "bot"
          );
      }
    },
  };

  // ------------------
  // Pong program (stub)
  // ------------------

  const pongProgram = {
    id: "pong",
    name: "Pong Arena",
    description: "Play pong vs ThingBot (future).",
    onEnter(ctx) {
      setMood("thinking");
      ctx.print("[ThingBot] pong arena loading (stub).", "bot");
      ctx.print(
        "eventual idea: render a simple pong UI and controls here.",
        "system"
      );
      ctx.print("for now, use `back` to return to shell.", "system");
    },
    onExit(ctx) {
      setMood("neutral");
    },
    onInput(line, ctx) {
      const [cmd] = line.split(/\s+/);
      if (cmd.toLowerCase() === "back") {
        ctx.switchProgram("shell");
      } else {
        ctx.print("[ThingBot] pong is just a concept for now. try `back`.", "bot");
      }
    },
  };

  // ----------------------
  // Register programs & boot
  // ----------------------

  registerProgram(shellProgram);
  registerProgram(factsProgram);
  registerProgram(pongProgram);

  // wire input events
  function submitFromInput() {
    const value = terminalInput.value;
    terminalInput.value = "";
    handleInputFromUser(value);
  }

  terminalSend.addEventListener("click", () => {
    submitFromInput();
    terminalInput.focus();
  });

  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitFromInput();
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearTerminal();
    }
  });

  window.addEventListener("load", () => {
    terminalInput.focus();
    // initial boot
    switchProgram("shell");
  });

  // Expose some utilities globally if you want to play in console
  window.ThingBotCore = {
    switchProgram,
    setMood,
    printLine,
    writeToTerminal,
  };
})();

