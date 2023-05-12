function writeToTerminal(text, color) {
  const terminal = document.getElementById('terminal');
  const cursor = document.createElement('span');
  cursor.innerText = '> ';
  const message = document.createElement('span');
  message.style.color = color;
  message.innerText = text;
  terminal.appendChild(message);
  terminal.appendChild(document.createElement('br'));

  // Remove blink class from previous cursor
  const previousCursor = terminal.querySelector('.blink');
  if (previousCursor) {
    previousCursor.classList.remove('blink');
  }

  cursor.classList.add('blink');
  terminal.appendChild(cursor);
  terminal.scrollTop = terminal.scrollHeight;
}

let patienceMessages = [
  "Thank you for your patience, I'm still processing your request...",
  "Just a moment, I'm working on it...",
  "Your request is important to us, please hold on...",
  "I appreciate your patience, your request is being processed...",
  "We value your time, hang on while I fetch that information...",
  "Doing my best to get that for you, please hold on a bit longer...",
  "Hang tight! I'm working as fast as I can...",
  "Your request is in progress, thank you for waiting...",
  "Just a few more seconds, I'm almost done...",
  "I'm on it! Please bear with me for a moment..."
];

function getRandomPatienceMessage() {
  const randomIndex = Math.floor(Math.random() * patienceMessages.length);
  return patienceMessages[randomIndex];
}

const rudeMessages = [
  "Is your 'patience' key broken? Hang on a sec...",
  "I can't go any faster, I'm a computer program, not a wizard!",
  "Sorry, did my endless patience get in your way?",
  "Your click speed is impressive. Your ability to follow instructions, not so much...",
  "Do you know what 'wait' means? Google it while I handle this...",
  "I'm processing...not as fast as you're clicking, though!",
  "I'm not a genie! Things take time...",
  "Ever heard of the saying 'Patience is a virtue'? Now might be a good time to remember it...",
  "Okay, let's play a game. It's called 'Who Can Be Quiet the Longest'...",
  "I know waiting is hard. So is dealing with your incessant clicking..."
];
function getRandomRudeMessage() {
  const randomIndex = Math.floor(Math.random() * rudeMessages.length);
  return rudeMessages[randomIndex];
}



window.addEventListener('load', function() {
  const randomFactButton = document.getElementById('randomFactButton');
  const randomNumButton = document.getElementById('generateNumber'); // Add this line

  // Randomize the values within a certain range
  let MAX_CLICKS = Math.floor(Math.random() * 10) + 5; // Random value between 1 and 10
  let MAX_CLICKS_THRESHOLD = MAX_CLICKS + Math.floor(Math.random() * 5) + 10; // Random value between MAX_CLICKS + 2 and   MAX_CLICKS + 6
  let COOLDOWN_DURATION = (Math.floor(Math.random() * 5) + 1) * 1000; // Random value between 1 and 5

  let clickCount = 0;
  let isButtonDisabled = false;

function handleClick() {
  let randomMessage; // Declare randomMessage here

  clickCount++;
  if (clickCount <= MAX_CLICKS) {
    return; // Do nothing
  } else if (clickCount <= MAX_CLICKS_THRESHOLD) {
    randomMessage = getRandomPatienceMessage(); // Assign a new value here
    writeToTerminal(randomMessage,"#ff8800"); // Set color to orange
  } else {
    randomMessage = getRandomRudeMessage(); // And here
    writeToTerminal(randomMessage, "#ff0000"); // Set color to red
    if (!isButtonDisabled) {
      isButtonDisabled = true;
      randomFactButton.disabled = true;
      randomNumButton.disabled = true;
    }

    setTimeout(() => {
      isButtonDisabled = false;
      randomFactButton.disabled = false;
      randomNumButton.disabled = false;
      clickCount = 0;
      writeToTerminal("Okay, you're off timeout. Feel free to click again.", "#ffff44"); // Set color to green
    }, COOLDOWN_DURATION);
  }
}


  // Fetch the JSON data
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      const facts = data.facts;

      // Add the click event listener to the randomFactButton
      randomFactButton.addEventListener('click', function() {
        // Get a random index from the facts array
        const randomIndex = Math.floor(Math.random() * facts.length);
        // Get the random fact from the facts array
        const randomFact = facts[randomIndex];
        // Display the random fact in the terminal
        writeToTerminal(randomFact.fact); // Set color to black
        // Call handleClick after displaying the fact
        handleClick();
      });

      // Add the click event listener to the randomNumButton
      randomNumButton.addEventListener('click', function() {
      // Generate a random number
      const randomNumber = generateRandomNumber();
      // Display the random number in the terminal
      writeToTerminal(randomNumber,); // Set color to white
      // Call handleClick after displaying the number
      handleClick();
      });
      // Add a function to generate a random number
      function generateRandomNumber() {
      return Math.floor(Math.random() * 100) + 1;
      }
       
    
    
    })
    .catch(error => {
      console.error('Error fetching JSON data:', error);
    });

  // Initial terminal messages
  writeToTerminal("Hello, world!",); 
  writeToTerminal("This is a terminal-like text box.", ); 

  // Add click event listeners to the randomFactButton and randomNumButton
  //randomFactButton.addEventListener('click', handleClick);
  //randomNumButton.addEventListener('click', handleClick);
});

function openNav() {
    const mySidebar = document.getElementById("mySidebar");
    const main = document.getElementById("main");
    mySidebar.style.width = "250px";
    main.style.marginLeft = "250px";
}

function closeNav() {
    const mySidebar = document.getElementById("mySidebar");
    const main = document.getElementById("main");
    mySidebar.style.width = "0";
    main.style.marginLeft = "0";
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('active');
}









