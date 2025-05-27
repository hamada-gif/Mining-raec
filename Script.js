const database = firebase.database();
const connectedRef = database.ref('.info/connected'); // Reference to connection status

// UI Elements
const roomScreen = document.getElementById("room-screen");
const gameScreen = document.getElementById("game-screen");
const playerNameInput = document.getElementById("player-name");
const roomIdInput = document.getElementById("room-id");
const roomError = document.getElementById("room-error");
const displayRoomId = document.getElementById("display-room-id");
const playerTurnDisplay = document.getElementById("player-turn");
const questionBox = document.getElementById("question");
const challengeBox = document.getElementById("challenge");
const scoreboard = document.getElementById("scoreboard");
const emojiContainer = document.getElementById("emoji-container");
const answerInput = document.getElementById("answer-input");
const submitAnswerBtn = document.getElementById("submit-answer-btn");
const answersList = document.getElementById("answers-list");

// Game State Variables
let currentRoomId = null;
let currentPlayerName = null;
let gameRef = null;
let playersRef = null;
let gameStateRef = null;
let answersRef = null;
let playerPresenceRef = null; // For online status
let gameData = {}; // Local cache of game data
let gameStateUnsubscribe = null; // To store the unsubscribe function for game state
let answersUnsubscribe = null; // To store the unsubscribe function for answers
let presenceUnsubscribe = null; // To store the unsubscribe function for presence

// Questions and Challenges (Keep these as they are)
const questions = [
  "هل شخصيتك على وسائل التواصل الاجتماعي هي نفس شخصيتك في الواقع؟",
  "ما هي الصفات الجميلة في شخصيتك؟",
  "هل أنت راضي عن نفسك وعن كل ما حققته في حياتك؟",
  "من هو الشخص الذي تفكر فيه طوال الوقت؟",
  "ما هي المشكلة الأكبر التي واجهتك في حياتك؟",
  "صف نفسك في كلمة واحدة؟",
  "ما هو الموقف المحرج الذي تعرضت له في السابق؟",
  "متى أعجبت بأول فتاة في حياتك؟",
  "هل وقعت في السابق في الحب؟",
  "ما هي أسماء البنات والأولاد المفضلة لك؟",
  "ما هو الشيء الذي يحزنك كثيراً؟",
  "ما أسوأ فترة مررت بها في حياتك؟",
  "هل يمكنك التعامل مع المواقف التي تحرجك أم لا؟",
  "ما هي أكثر صفة تكرهها في الناس؟",
  "ما هو أكبر درس تعلمته من فشل معين مررت به؟",
  "ما هو الشيء الذي لا يمكنك العيش بدونه؟",
  "ما هو أكثر موقف مضحك حصل لك وممكن تحكيه بسهولة؟",
  "إذا اكتشفت أن صديقك المفضل يكذب عليك، ماذا ستفعل؟",
  "ما هو أكثر شيء تخجل من الاعتراف به أمام الآخرين؟",
  "هل سبق وقلت شيئاً لشخص ندمت عليه لاحقاً؟",
  "إذا طلب منك أحد الاعتراف بشيء محرج قمت به، ماذا ستختار؟",
  "ما هو أكثر موقف جعلك تشعر بالخجل الشديد في حياتك؟",
  "ما هو أكثر شيء تندم عليه عندما تكون بمفردك؟",
  "هل سبق وكنت السبب في مشكلة كبيرة لشخص تعرفه؟",
  "ما هو أكثر شيء جعلك تشعر بالإهانة ولم تنساه؟",
  "إذا أخطأت في حق شخص تحبه، هل تعتذر فوراً أم تتجاهل الأمر؟",
  "ما هو أكبر سر كشفته دون قصد؟",
  "هل هناك شيء تخاف من أن يعرفه أحد عنك؟",
  "ما هي أكثر صفة تعجبك في شخصيتي؟",
  "ما هو أكثر موقف جعلك تضحك بسببي؟",
  "ما هو أكثر موقف تمنيت فيه إنك تساعدني أكتر؟",
  "إذا كنت تستطيع السفر إلى أي مكان في العالم، أين ستكون وجهتك؟",
  "ما هو أكبر حلم تحقق لك حتى الآن؟",
  "ما هي اللحظة التي شعرت فيها بالسعادة المطلقة؟",
  "ما هو الشيء الذي تندم عليه أكثر شيء؟",
  "من هو الشخص الذي تعتبره مصدر إلهام في حياتك؟",
  "إذا كنت تستطيع تغيير شيء واحد في شخصيتك، ماذا سيكون؟",
  "ما هو القرار الذي غير مسار يومك كله؟",
  "ماذا تفعل عندما تواجه أزمة شخصية؟",
  "ما هو الشيء الذي يجعلك تشعر بالراحة والطمأنينة؟",
  "ما هو الشيء الذي لا يمكنك العيش بدونه؟",
  "إذا كان بإمكانك تغيير أي حدث في التاريخ، فما هو؟",
  "ماذا تفعل عندما تواجه موقفًا محرجًا أمام الآخرين؟"
];

const challenges = [
  "قم بالاتصال على والدتك وقل لها إنك سوف تتزوج.",
  "قم بالرقص في الشارع.",
  "قم بإعطاء أول شخص تراه 200 أوقية.",
  "قم بالاتصال على الإسعاف وأخبرهم أنك مجنون.",
  "تتصل بأصدقائك وتخبرهم يعطوك مبلغ مالي.",
  "أن تمضي خمس دقائق وأنت تضحك من دون سبب.",
  "قم بشرب لتر من الماء.",
  "كل بصلة.",
  "اتصل بأعز أصدقائك وأخبره أن صداقتكم انتهت.",
  "ما هو الشيء الذي لا يمكنك العيش بدونه؟",
  "قم بكتابة بيت شعري.",
  "اكتب حرف كاف فقط.",
  "ضع مبلغاً مالياً في الشارع واتركه.",
  "اقرأ ما تيسر من القرآن.",
  "أعطني حكمة.",
  "أعطني مثل حساني.",
  "صور نفسك وأنت تمشي على أربع.",
  "ارسم قلباً على يدك واصوره.",
  "غنّ مقطع أغنية بصوت عالٍ.",
  "استخدم فلتر سناب شات مضحك وشاركه.",
  "اتحدث باللهجة المصرية لمدة دقيقة.",
  "ارقص على أنغام بدون موسيقى.",
  "ارسم لوحة عشوائية وشاركها.",
  "قل نكتة تضحك الجميع.",
  "صور فيديو تقول فيه أنك نادم على شيء.",
  "أطلب من شخص غريب الدعاء لك.",
  "قفز عشر مرات مع صرخة كل مرة.",
  "قل جملة من تأليفك باللهجة الحسانية.",
  "أخبرنا بسر بسيط عن نفسك.",
  "خذ صورة سيلفي غريبة وشاركها.",
  "قل لنا معلومة غريبة تعرفها.",
  "اتحدث مع الجماد لدقيقة.",
  "تقمص شخصية مشهورة وتحدث بصوتها.",
  "اصنع صوت حيوان بصوتك.",
  "قل كلمة سرية واختر شخصاً يخمن معناها.",
  "شاركنا موقف محرج مضحك.",
  "قل بيت شعري حزين بصوت درامي.",
  "أكتب اسمك بأنفك.",
  "اصرخ بكلمة \'أنا غريب\' في الغرفة.",
  "أغمض عينيك وتحدث عن شيء تحبه.",
  "قل لنا ماذا ستفعل لو أصبحت مليونيراً.",
  "ارسم خريطة لمدينتك من ذاكرتك.",
  "اتحدث عن أكثر طعام تكرهه وكأنك تحبه."
];

// --- Room Management ---

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom() {
  console.log("DEBUG: createRoom() called."); // DEBUG
  currentPlayerName = playerNameInput.value.trim();
  if (!currentPlayerName) {
    roomError.textContent = "الرجاء إدخال اسمك.";
    console.log("DEBUG: Create room failed: No player name."); // DEBUG
    return;
  }
  roomError.textContent = "";
  console.log("DEBUG: Player name:", currentPlayerName); // DEBUG

  currentRoomId = generateRoomId();
  roomIdInput.value = currentRoomId; // Show the created room ID
  console.log("DEBUG: Generated Room ID:", currentRoomId); // DEBUG

  try {
      // Use compat syntax: database.ref() and ref.child()
      gameRef = database.ref(`rooms/${currentRoomId}`);
      playersRef = gameRef.child('players');
      gameStateRef = gameRef.child('gameState');
      answersRef = gameRef.child('answers');
      console.log("DEBUG: Firebase refs created (compat):", gameRef.toString()); // DEBUG
  } catch (e) {
      console.error("DEBUG: Error creating Firebase refs:", e); // DEBUG
      roomError.textContent = "خطأ في تهيئة Firebase. تأكد من الإعدادات.";
      return;
  }

  // Set initial game state
  const initialPlayers = {};
  initialPlayers[currentPlayerName] = { score: 0, online: true };

  console.log("DEBUG: Setting initial game state for room:", currentRoomId); // DEBUG
  // Use compat syntax: gameRef.set() and firebase.database.ServerValue.TIMESTAMP
  gameRef.set({
    players: initialPlayers,
    gameState: {
      currentPlayerName: currentPlayerName, // First player starts
      currentQuestionIndex: -1, // Will be set on first turn
      usedIndices: [],
      status: "waiting", // Waiting for more players or start
      host: currentPlayerName // Mark the creator as host (optional)
    },
    answers: {},
    createdAt: firebase.database.ServerValue.TIMESTAMP // Use compat server timestamp
  }).then(() => {
    console.log(`DEBUG: Room ${currentRoomId} created successfully in Firebase by ${currentPlayerName}`); // DEBUG
    joinRoomInternal();
  }).catch(error => {
    console.error("DEBUG: Firebase Error creating room: ", error); // DEBUG
    roomError.textContent = `حدث خطأ أثناء إنشاء الغرفة في Firebase: ${error.message}. تأكد من صحة databaseURL وقواعد الأمان.`;
  });
}

function joinRoom() {
  console.log("DEBUG: joinRoom() called."); // DEBUG
  currentPlayerName = playerNameInput.value.trim();
  const roomIdToJoin = roomIdInput.value.trim().toUpperCase();

  if (!currentPlayerName) {
    roomError.textContent = "الرجاء إدخال اسمك.";
    console.log("DEBUG: Join room failed: No player name."); // DEBUG
    return;
  }
  if (!roomIdToJoin) {
    roomError.textContent = "الرجاء إدخال رمز الغرفة.";
    console.log("DEBUG: Join room failed: No room ID."); // DEBUG
    return;
  }
  roomError.textContent = "";
  console.log("DEBUG: Player name:", currentPlayerName, "Room ID:", roomIdToJoin); // DEBUG

  currentRoomId = roomIdToJoin;
  try {
      // Use compat syntax: database.ref() and ref.child()
      gameRef = database.ref(`rooms/${currentRoomId}`);
      playersRef = gameRef.child('players');
      gameStateRef = gameRef.child('gameState');
      answersRef = gameRef.child('answers');
      console.log("DEBUG: Firebase refs created for joining (compat):", gameRef.toString()); // DEBUG
  } catch (e) {
      console.error("DEBUG: Error creating Firebase refs for joining:", e); // DEBUG
      roomError.textContent = "خطأ في تهيئة Firebase. تأكد من الإعدادات.";
      return;
  }

  // Check if room exists first
  console.log("DEBUG: Checking if room exists:", currentRoomId); // DEBUG
  // Use compat syntax: gameRef.get()
  gameRef.get().then((roomSnapshot) => {
      if (!roomSnapshot.exists()) {
          roomError.textContent = "الغرفة غير موجودة. تأكد من الرمز.";
          console.log("DEBUG: Join room failed: Room not found."); // DEBUG
          currentRoomId = null;
          gameRef = null;
          return;
      }
      console.log("DEBUG: Room found. Checking player name:", currentPlayerName); // DEBUG
      // Room exists, now check player name
      // Use compat syntax: playersRef.child().get()
      playersRef.child(currentPlayerName).get().then((playerSnapshot) => {
          if (playerSnapshot.exists()) {
              roomError.textContent = "هذا الاسم مستخدم بالفعل في هذه الغرفة.";
              console.log("DEBUG: Join room failed: Player name taken."); // DEBUG
              currentRoomId = null; // Reset room ID
              gameRef = null;
          } else {
              // Add player to the room
              console.log("DEBUG: Player name available. Adding player to room."); // DEBUG
              const updates = {};
              updates[`/rooms/${currentRoomId}/players/${currentPlayerName}`] = { score: 0, online: true };

              // Use compat syntax: database.ref().update()
              database.ref().update(updates).then(() => {
                  console.log(`DEBUG: ${currentPlayerName} joined room ${currentRoomId} successfully in Firebase.`); // DEBUG
                  joinRoomInternal();
              }).catch(error => {
                  console.error("DEBUG: Firebase Error joining room: ", error); // DEBUG
                  roomError.textContent = `حدث خطأ أثناء الانضمام للغرفة في Firebase: ${error.message}.`;
              });
          }
      }).catch(error => {
          console.error("DEBUG: Firebase Error checking player name: ", error); // DEBUG
          roomError.textContent = `حدث خطأ أثناء التحقق من اسم اللاعب: ${error.message}.`;
      });
  }).catch(error => {
      console.error("DEBUG: Firebase Error checking room existence: ", error); // DEBUG
      roomError.textContent = `لا يمكن العثور على الغرفة أو حدث خطأ: ${error.message}. تأكد من صحة databaseURL وقواعد الأمان.`;
  });
}

function joinRoomInternal() {
  console.log("DEBUG: Executing joinRoomInternal for player:", currentPlayerName, "in room:", currentRoomId); // DEBUG
  roomScreen.classList.remove("active");
  gameScreen.classList.add("active");
  displayRoomId.textContent = currentRoomId;

  // Set up presence (online status)
  // Use compat syntax: playersRef.child()
  playerPresenceRef = playersRef.child(`${currentPlayerName}/online`);
  console.log("DEBUG: Setting up presence for:", playerPresenceRef.toString()); // DEBUG

  // Use the globally defined connectedRef (which is already compat)
  // Use compat syntax: connectedRef.on('value', ...)
  presenceUnsubscribe = connectedRef.on('value', (snap) => {
    console.log("DEBUG: Firebase connection status:", snap.val()); // DEBUG
    if (snap.val() === true) {
      console.log("DEBUG: Connection established. Setting presence to true."); // DEBUG
      // Use compat syntax: playerPresenceRef.set() and playerPresenceRef.onDisconnect().set()
      playerPresenceRef.set(true);
      // Set disconnect operation
      playerPresenceRef.onDisconnect().set(false).then(() => {
         console.log(`DEBUG: ${currentPlayerName} presence onDisconnect set.`); // DEBUG
      }).catch(e => console.error("DEBUG: Error setting onDisconnect:", e)); // DEBUG
    } else {
        console.log("DEBUG: Connection lost or not established yet."); // DEBUG
    }
  });

  // Start listening to game state changes
  console.log("DEBUG: Starting listeners for game state and answers."); // DEBUG
  listenToGameState();
  listenToAnswers();

  // Host triggers the first turn if needed
  console.log("DEBUG: Checking if host needs to trigger first turn."); // DEBUG
  // Use compat syntax: gameStateRef.get()
  gameStateRef.get().then(snapshot => {
      const state = snapshot.val();
      if (state && state.host === currentPlayerName && state.currentQuestionIndex === -1) {
          console.log("DEBUG: Host detected. Triggering first turn selection."); // DEBUG
          selectNextQuestionAndPlayer();
      } else {
          console.log("DEBUG: Not host or game already started. No first turn trigger needed."); // DEBUG
      }
  }).catch(e => console.error("DEBUG: Error getting game state for host check:", e)); // DEBUG
}

// --- Game Logic & Sync --- Listeners

function listenToGameState() {
  // Detach previous listener if exists
  if (gameStateUnsubscribe) {
      console.log("DEBUG: Detaching previous game state listener."); // DEBUG
      // Use compat syntax: gameRef.off('value', listenerFunction)
      gameRef.off('value', gameStateUnsubscribe); // Assuming gameStateUnsubscribe stores the listener function
      gameStateUnsubscribe = null; // Reset the stored listener
  }

  console.log("DEBUG: Attaching game state listener to:", gameRef.toString()); // DEBUG
  // Define the listener function separately to be able to detach it
  const gameStateListener = (snapshot) => {
    if (!snapshot.exists()) {
      console.warn("DEBUG: Game state listener: Room deleted or does not exist."); // DEBUG
      alert("تم حذف الغرفة أو لم تعد موجودة.");
      goBackToRoomScreen();
      return;
    }
    gameData = snapshot.val();
    console.log("DEBUG: Game data updated via listener: ", gameData); // DEBUG
    updateUI();
  };
  // Use compat syntax: gameRef.on('value', ...)
  gameRef.on('value', gameStateListener, (error) => {
      console.error("DEBUG: Firebase error in game state listener:", error); // DEBUG
      // Handle error appropriately, maybe notify user
  });
  gameStateUnsubscribe = gameStateListener; // Store the listener function itself for detaching
}

function listenToAnswers() {
    // Detach previous listener if exists
    if (answersUnsubscribe) {
        console.log("DEBUG: Detaching previous answers listener."); // DEBUG
        // Use compat syntax: answersRef.off('value', listenerFunction)
        answersRef.off('value', answersUnsubscribe);
        answersUnsubscribe = null;
    }

    console.log("DEBUG: Attaching answers listener to:", answersRef.toString()); // DEBUG
    const answersListener = (snapshot) => {
        answersList.innerHTML = ''; // Clear previous answers
        if (snapshot.exists()) {
            console.log("DEBUG: Answers data received:", snapshot.val()); // DEBUG
            snapshot.forEach((childSnapshot) => {
                const answerData = childSnapshot.val();
                const listItem = document.createElement('li');
                const timestamp = answerData.timestamp ? new Date(answerData.timestamp).toLocaleTimeString() : '';
                listItem.textContent = `(${timestamp}) ${answerData.playerName}: ${answerData.text}`;
                answersList.prepend(listItem); // Prepend to show newest first
            });
        } else {
            console.log("DEBUG: No answers yet."); // DEBUG
        }
    };
    // Use compat syntax: answersRef.on('value', ...)
    answersRef.on('value', answersListener, (error) => {
        console.error("DEBUG: Firebase error in answers listener:", error); // DEBUG
    });
    answersUnsubscribe = answersListener; // Store the listener function for detaching
}


function updateUI() {
  // console.log("DEBUG: Updating UI with data:", gameData); // DEBUG (can be verbose)
  if (!gameData || !gameData.gameState || !gameData.players) {
      console.log("DEBUG: Update UI skipped: Waiting for full game data...");
      return; // Not fully loaded yet
  }

  const state = gameData.gameState;
  const players = gameData.players;

  // Update Player Turn Display
  if (state.currentPlayerName) {
    playerTurnDisplay.textContent = `دور: ${state.currentPlayerName}`;
  } else {
    playerTurnDisplay.textContent = "انتظار اللاعبين...";
  }

  // Update Question and Challenge
  if (state.currentQuestionIndex !== undefined && state.currentQuestionIndex >= 0 && state.currentQuestionIndex < questions.length) {
    questionBox.textContent = questions[state.currentQuestionIndex];
    challengeBox.textContent = challenges[state.currentQuestionIndex];
  } else {
    questionBox.textContent = "...";
    challengeBox.textContent = "...";
  }

  // Update Scoreboard
  scoreboard.innerHTML = "<h3>النقاط:</h3>";
  const sortedPlayers = Object.entries(players)
      .sort(([, a], [, b]) => b.score - a.score) // Sort by score descending
      .map(([name, data]) => `${name}${data.online ? '' : ' (غير متصل)'}: ${data.score}`);

  scoreboard.innerHTML += sortedPlayers.join(" | ");

  // Enable/Disable controls based on turn
  const isMyTurn = state.currentPlayerName === currentPlayerName;
  const buttons = gameScreen.querySelectorAll('.btn-group button');
  buttons.forEach(btn => btn.disabled = !isMyTurn);
  submitAnswerBtn.disabled = !isMyTurn; // Also disable answer submission if not my turn

  // Show/hide answer section based on game state (optional, maybe always show?)
  // const answerSection = document.getElementById('answer-section');
  // answerSection.style.display = isMyTurn ? 'block' : 'none';
}

// --- Game Actions ---

function selectOption(optionType) {
  console.log(`DEBUG: selectOption called with type: ${optionType}`); // DEBUG
  if (!gameRef || !gameStateRef || !currentPlayerName || gameData?.gameState?.currentPlayerName !== currentPlayerName) {
    console.error("DEBUG: Cannot select option - game not ready or not player's turn.");
    return;
  }

  const updates = {};
  let scoreChange = 0;

  if (optionType === 'question') {
    scoreChange = 1; // Points for choosing question
    updates[`/gameState/status`] = `answered_question`;
  } else if (optionType === 'challenge') {
    scoreChange = 2; // Points for choosing challenge
    updates[`/gameState/status`] = `accepted_challenge`;
  } else {
      console.error("DEBUG: Invalid option type selected:", optionType);
      return;
  }

  updates[`/players/${currentPlayerName}/score`] = (gameData.players[currentPlayerName]?.score || 0) + scoreChange;
  console.log(`DEBUG: Updating score for ${currentPlayerName} by ${scoreChange}`); // DEBUG

  // Use compat syntax: gameStateRef.update() and playersRef.update()
  // We can update multiple locations using database.ref().update()
  database.ref().update(updates).then(() => {
      console.log(`DEBUG: Option '${optionType}' selected and score updated.`); // DEBUG
      // Select next question and player AFTER score update is successful
      selectNextQuestionAndPlayer();
  }).catch(error => {
      console.error("DEBUG: Firebase error updating score/status for option selection: ", error);
  });
}

function submitAnswer() {
    console.log("DEBUG: submitAnswer() called."); // DEBUG
    const answerText = answerInput.value.trim();
    if (!answerText) {
        alert("الرجاء كتابة إجابتك.");
        return;
    }

    if (!answersRef || !currentPlayerName) {
        console.error("DEBUG: Cannot submit answer - answersRef or currentPlayerName is not set.");
        return;
    }

    const newAnswer = {
        playerName: currentPlayerName,
        text: answerText,
        timestamp: firebase.database.ServerValue.TIMESTAMP // Use compat server timestamp
    };

    console.log("DEBUG: Pushing new answer:", newAnswer); // DEBUG
    // Use compat syntax: answersRef.push()
    answersRef.push(newAnswer).then(() => {
        console.log("DEBUG: Answer submitted successfully."); // DEBUG
        answerInput.value = ''; // Clear input field
        // Optionally, trigger next turn or update status here if needed
        // For now, just logs the answer. Turn progression happens via selectOption/skipTurn
    }).catch(error => {
        console.error("DEBUG: Firebase error submitting answer: ", error); // DEBUG
    });
}


function skipTurn() {
  console.log("DEBUG: skipTurn() called."); // DEBUG
  if (!gameRef || !gameStateRef || !currentPlayerName || gameData?.gameState?.currentPlayerName !== currentPlayerName) {
    console.error("DEBUG: Cannot skip turn - game not ready or not player's turn.");
    return;
  }

  console.log(`DEBUG: ${currentPlayerName} chose to skip.`); // DEBUG
  // Just move to the next player without changing score or status
  selectNextQuestionAndPlayer();
}

function selectNextQuestionAndPlayer() {
  console.log("DEBUG: Selecting next question and player..."); // DEBUG
  if (!gameRef || !gameStateRef || !playersRef) {
      console.error("DEBUG: Cannot select next - refs not initialized.");
      return;
  }

  // Use compat syntax: gameRef.get()
  gameRef.get().then(snapshot => {
      if (!snapshot.exists()) {
          console.error("DEBUG: Cannot select next - room data not found.");
          return;
      }
      const currentData = snapshot.val();
      const players = currentData.players;
      const state = currentData.gameState;
      const playerNames = Object.keys(players).filter(name => players[name].online); // Consider only online players

      if (playerNames.length === 0) {
          console.log("DEBUG: No online players left.");
          // Optionally update game status to 'ended' or 'paused'
          gameStateRef.update({ currentPlayerName: null, status: 'paused' });
          return;
      }

      // Determine the next player
      const currentPlayerIndex = playerNames.indexOf(state.currentPlayerName);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerNames.length;
      const nextPlayerName = playerNames[nextPlayerIndex];

      // Determine the next question/challenge index
      let usedIndices = state.usedIndices || [];
      let nextQuestionIndex = -1;
      const availableIndices = Array.from(Array(questions.length).keys()).filter(i => !usedIndices.includes(i));

      if (availableIndices.length > 0) {
          nextQuestionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          usedIndices.push(nextQuestionIndex);
          if (usedIndices.length >= questions.length) {
              usedIndices = []; // Reset if all questions used
              console.log("DEBUG: All questions used, resetting indices.");
          }
      } else {
          // This should ideally not happen if reset logic is correct, but handle it
          console.warn("DEBUG: No available questions left, resetting indices.");
          usedIndices = [];
          if (questions.length > 0) {
              nextQuestionIndex = Math.floor(Math.random() * questions.length);
              usedIndices.push(nextQuestionIndex);
          } else {
              console.error("DEBUG: No questions defined!");
              // Handle error - maybe end game?
              return;
          }
      }

      const updates = {
          currentPlayerName: nextPlayerName,
          currentQuestionIndex: nextQuestionIndex,
          usedIndices: usedIndices,
          status: 'turn_started' // Indicate a new turn has begun
      };

      console.log(`DEBUG: Next turn: Player=${nextPlayerName}, QIndex=${nextQuestionIndex}`); // DEBUG
      // Use compat syntax: gameStateRef.update()
      gameStateRef.update(updates).then(() => {
          console.log("DEBUG: Game state updated for next turn."); // DEBUG
      }).catch(error => {
          console.error("DEBUG: Firebase error updating game state for next turn: ", error);
      });

  }).catch(error => {
      console.error("DEBUG: Firebase error getting game data for next turn selection: ", error);
  });
}

// --- Utility & Cleanup ---

function goBackToRoomScreen() {
  console.log("DEBUG: Going back to room screen."); // DEBUG
  // Clean up listeners and refs
  if (gameStateUnsubscribe && gameRef) {
      gameRef.off('value', gameStateUnsubscribe);
      gameStateUnsubscribe = null;
      console.log("DEBUG: Detached game state listener.");
  }
  if (answersUnsubscribe && answersRef) {
      answersRef.off('value', answersUnsubscribe);
      answersUnsubscribe = null;
      console.log("DEBUG: Detached answers listener.");
  }
  if (presenceUnsubscribe && connectedRef) {
      connectedRef.off('value', presenceUnsubscribe);
      presenceUnsubscribe = null;
      console.log("DEBUG: Detached presence listener.");
  }
  if (playerPresenceRef) {
      // Attempt to remove presence data cleanly if possible
      playerPresenceRef.remove().catch(e => console.warn("DEBUG: Minor error removing presence on exit:", e));
      playerPresenceRef.onDisconnect().cancel(); // Cancel disconnect handler
      console.log("DEBUG: Cleaned up presence.");
  }

  // Reset game state variables
  currentRoomId = null;
  currentPlayerName = null;
  gameRef = null;
  playersRef = null;
  gameStateRef = null;
  answersRef = null;
  playerPresenceRef = null;
  gameData = {};
  answersList.innerHTML = ''; // Clear answers log
  scoreboard.innerHTML = ''; // Clear scoreboard
  questionBox.textContent = '...';
  challengeBox.textContent = '...';
  playerTurnDisplay.textContent = '';

  // Switch screens
  gameScreen.classList.remove("active");
  roomScreen.classList.add("active");
  roomIdInput.value = ''; // Clear room ID input
  roomError.textContent = ''; // Clear any previous errors
}

// Optional: Add a leave button or handle browser close/refresh
window.addEventListener('beforeunload', () => {
    // This is a fallback, onDisconnect is more reliable
    if (playerPresenceRef) {
        playerPresenceRef.set(false); // Try to set offline immediately
    }
});

// Initial setup: Ensure only room screen is visible
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOM Content Loaded. Initializing UI.");
    gameScreen.classList.remove('active');
    roomScreen.classList.add('active');
    // Add event listeners to buttons programmatically (alternative to inline onclick)
    // Example:
    // const createBtn = document.querySelector('#room-screen button:nth-of-type(2)');
    // if (createBtn) createBtn.addEventListener('click', createRoom);
    // const joinBtn = document.querySelector('#room-screen button:nth-of-type(1)');
    // if (joinBtn) joinBtn.addEventListener('click', joinRoom);
    // ... add listeners for other buttons ...
});

