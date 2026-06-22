// Import GSAP if using module bundler (Vite handles this automatically)
// Since we loaded GSAP via CDN in HTML, it is available globally as 'gsap'.

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  const state = {
    wishes: "They say home is a place, but with you, I've realized that home is actually a person. Thank you for being my safe harbor and for loving me in ways I never knew I needed. Looking at the calendar, June 18th is easily my favorite day because it's the day you were born to change my world. I hope your day is as beautiful as the soul you have. I love you, today and for all the years to come. Happy Birthday Love.",
    activePage: 'page-welcome',
    isPlayingMusic: false,
    synthTimer: null,
    isCandleLit: false,
    isCandleBlown: false,
    isCakeCut: false,
    polaroidImages: {
      p1: null,
      p2: null
    },
    musicSource: 'synth', // 'synth' or 'youtube'
    ytPlayerReady: false,
    currentYtVideoId: null,
    volume: 0.5
  };

  // --- AUDIO SYNTHESIZER (Happy Birthday Music Box) ---
  // Beautiful music box synth using Web Audio API
  let audioCtx = null;
  let synthInterval = null;
  let currentNoteIndex = 0;

  const notes = [
    { note: "C4", dur: 0.5 }, { note: "C4", dur: 0.5 }, { note: "D4", dur: 1.0 }, { note: "C4", dur: 1.0 }, { note: "F4", dur: 1.0 }, { note: "E4", dur: 2.0 },
    { note: "C4", dur: 0.5 }, { note: "C4", dur: 0.5 }, { note: "D4", dur: 1.0 }, { note: "C4", dur: 1.0 }, { note: "G4", dur: 1.0 }, { note: "F4", dur: 2.0 },
    { note: "C4", dur: 0.5 }, { note: "C4", dur: 0.5 }, { note: "C5", dur: 1.0 }, { note: "A4", dur: 1.0 }, { note: "F4", dur: 1.0 }, { note: "E4", dur: 1.0 }, { note: "D4", dur: 2.0 },
    { note: "AS4", dur: 0.5 }, { note: "AS4", dur: 0.5 }, { note: "A4", dur: 1.0 }, { note: "F4", dur: 1.0 }, { note: "G4", dur: 1.0 }, { note: "F4", dur: 2.0 }
  ];

  const frequencies = {
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
    "A4": 440.00, "AS4": 466.16, "B4": 493.88, "C5": 523.25
  };

  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playNote(freq, duration) {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    // Create oscillator and gain nodes
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Music box sound profile: Triangle wave + Lowpass filter + long decay
    osc.type = 'triangle';
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    // Schedule volume envelope
    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    // Soft attack scaled by state.volume
    gainNode.gain.linearRampToValueAtTime(0.3 * state.volume, now + 0.05);
    // Long decay to emulate music box tines scaled by state.volume
    gainNode.gain.exponentialRampToValueAtTime(0.001 * state.volume, now + duration * 1.8);

    // Play slight chime overtone
    const overtoneOsc = audioCtx.createOscillator();
    const overtoneGain = audioCtx.createGain();
    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(audioCtx.destination);
    overtoneOsc.type = 'sine';
    overtoneOsc.frequency.value = freq * 2; // Octave higher
    overtoneGain.gain.setValueAtTime(0, now);
    // Scaled by state.volume
    overtoneGain.gain.linearRampToValueAtTime(0.08 * state.volume, now + 0.02);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001 * state.volume, now + duration * 0.8);

    osc.frequency.value = freq;
    
    osc.start(now);
    osc.stop(now + duration * 2);
    overtoneOsc.start(now);
    overtoneOsc.stop(now + duration);
  }

  function startSynthMelody() {
    initAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    currentNoteIndex = 0;
    
    function scheduleNext() {
      if (!state.isPlayingMusic) return;
      
      const currentNote = notes[currentNoteIndex];
      const freq = frequencies[currentNote.note];
      const stepDuration = currentNote.dur * 0.6; // Tempo scaling factor

      playNote(freq, stepDuration);
      
      currentNoteIndex = (currentNoteIndex + 1) % notes.length;
      synthInterval = setTimeout(scheduleNext, stepDuration * 1000 + 100);
    }
    
    scheduleNext();
  }

  function stopSynthMelody() {
    if (synthInterval) {
      clearTimeout(synthInterval);
      synthInterval = null;
    }
  }

  // --- MUSIC POPUP & YOUTUBE PLAYER ---
  // Restore saved music preferences from localStorage
  const savedYtUrl = localStorage.getItem('bday_yt_url');
  const savedYtVideoId = localStorage.getItem('bday_yt_video_id');
  const savedVolume = localStorage.getItem('bday_volume');
  const savedMusicSource = localStorage.getItem('bday_music_source');

  if (savedYtVideoId) {
    state.currentYtVideoId = savedYtVideoId;
    state.musicSource = 'youtube';
  }
  if (savedMusicSource) {
    state.musicSource = savedMusicSource;
  }
  if (savedVolume !== null) {
    state.volume = parseFloat(savedVolume);
  }

  let ytPlayer = null;

  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
      height: '0',
      width: '0',
      videoId: '',
      playerVars: {
        'autoplay': 0,
        'controls': 0,
        'disablekb': 1,
        'fs': 0,
        'rel': 0,
        'showinfo': 0,
        'modestbranding': 1
      },
      events: {
        'onReady': () => {
          state.ytPlayerReady = true;
          ytPlayer.setVolume(state.volume * 100);
          // Auto-play saved YouTube video on page load
          if (state.currentYtVideoId && state.musicSource === 'youtube') {
            playYouTubeVideo(state.currentYtVideoId);
          }
        },
        'onStateChange': (event) => {
          // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
          if (event.data === 1) {
            state.isPlayingMusic = true;
            updatePlayerUI(true);
          } else if (event.data === 2 || event.data === 0) {
            state.isPlayingMusic = false;
            updatePlayerUI(false);
          }
        },
        'onError': (event) => {
          let errorMsg = "Could not play this video. It might be restricted or deleted.";
          if (event.data === 2) errorMsg = "Invalid YouTube video ID.";
          if (event.data === 100 || event.data === 150) errorMsg = "This video is restricted from playing in embedded players.";
          
          addChatMessage("System", `⚠️ Error: ${errorMsg}`, true);
          alert(errorMsg);
          switchToSynth();
        }
      }
    });
  };

  // Load YouTube script dynamically
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  const musicToggle = document.getElementById('music-toggle');
  const musicIcon = musicToggle.querySelector('.music-icon');
  const musicPopup = document.getElementById('music-popup');
  const musicPopupClose = document.getElementById('music-popup-close');
  const disk = document.getElementById('spinning-disk');
  const tonearm = document.getElementById('tonearm');
  const playPauseBtnPopup = document.getElementById('player-play-pause-btn');
  const volumeSlider = document.getElementById('player-volume-slider');
  const ytUrlInput = document.getElementById('yt-url-input');
  const ytPlayBtn = document.getElementById('yt-play-btn');
  const switchToSynthBtn = document.getElementById('switch-to-synth-btn');
  const nowPlayingTitle = document.getElementById('now-playing-title');

  // Restore saved state into UI elements
  if (savedYtUrl) {
    ytUrlInput.value = savedYtUrl;
  }
  volumeSlider.value = state.volume * 100;
  if (state.musicSource === 'youtube' && state.currentYtVideoId) {
    nowPlayingTitle.textContent = "Playing: YouTube Music 🎵";
  }

  function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function playYouTubeVideo(videoId) {
    state.musicSource = 'youtube';
    state.currentYtVideoId = videoId;
    
    // Save to localStorage for persistence
    localStorage.setItem('bday_yt_video_id', videoId);
    localStorage.setItem('bday_music_source', 'youtube');
    
    stopSynthMelody();
    
    if (state.ytPlayerReady && ytPlayer) {
      ytPlayer.loadVideoById({
        videoId: videoId
      });
      ytPlayer.setVolume(state.volume * 100);
      ytPlayer.playVideo();
      state.isPlayingMusic = true;
      updatePlayerUI(true);
      nowPlayingTitle.textContent = "Playing: YouTube Music 🎵";
      addChatMessage("System", "Playing music from YouTube! 🎧", true);
    } else {
      addChatMessage("System", "Loading YouTube player... Please wait.", true);
    }
  }

  function switchToSynth() {
    state.musicSource = 'synth';
    state.currentYtVideoId = null;
    
    // Clear saved YouTube data from localStorage
    localStorage.removeItem('bday_yt_video_id');
    localStorage.removeItem('bday_yt_url');
    localStorage.setItem('bday_music_source', 'synth');
    
    if (ytPlayer && state.ytPlayerReady) {
      try {
        ytPlayer.stopVideo();
      } catch(e) {}
    }
    
    nowPlayingTitle.textContent = "Playing: Sweet Synth 🎵";
    addChatMessage("System", "Switched back to Sweet Synth melody. 🎶", true);
    
    toggleMusic(true);
  }

  function updatePlayerUI(isPlaying) {
    if (isPlaying) {
      disk.classList.add('playing');
      tonearm.classList.add('playing');
      playPauseBtnPopup.textContent = '⏸';
      musicIcon.classList.add('active');
    } else {
      disk.classList.remove('playing');
      tonearm.classList.remove('playing');
      playPauseBtnPopup.textContent = '▶';
      musicIcon.classList.remove('active');
    }
  }

  function toggleMusic(forcePlay = null) {
    const play = forcePlay !== null ? forcePlay : !state.isPlayingMusic;
    state.isPlayingMusic = play;

    if (play) {
      musicIcon.classList.add('active');
      if (state.musicSource === 'synth') {
        startSynthMelody();
      } else if (state.musicSource === 'youtube' && ytPlayer && state.ytPlayerReady) {
        ytPlayer.playVideo();
      }
      updatePlayerUI(true);
    } else {
      musicIcon.classList.remove('active');
      if (state.musicSource === 'synth') {
        stopSynthMelody();
      } else if (state.musicSource === 'youtube' && ytPlayer && state.ytPlayerReady) {
        ytPlayer.pauseVideo();
      }
      updatePlayerUI(false);
    }
  }

  // --- EVENT LISTENERS FOR MUSIC CONTROLLER ---
  musicToggle.addEventListener('click', () => {
    musicPopup.classList.add('active');
  });

  musicPopupClose.addEventListener('click', () => {
    musicPopup.classList.remove('active');
  });

  musicPopup.addEventListener('click', (e) => {
    if (e.target === musicPopup) {
      musicPopup.classList.remove('active');
    }
  });

  playPauseBtnPopup.addEventListener('click', () => {
    toggleMusic();
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    state.volume = val;
    localStorage.setItem('bday_volume', val);
    
    if (ytPlayer && state.ytPlayerReady) {
      ytPlayer.setVolume(val * 100);
    }
  });

  ytPlayBtn.addEventListener('click', () => {
    const url = ytUrlInput.value.trim();
    if (!url) return;
    
    const videoId = getYouTubeId(url);
    if (videoId) {
      localStorage.setItem('bday_yt_url', url);
      playYouTubeVideo(videoId);
    } else {
      alert("Invalid YouTube URL! Please copy a valid link from your browser.");
      addChatMessage("System", "⚠️ Invalid YouTube URL entered.", true);
    }
  });

  ytUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      ytPlayBtn.click();
    }
  });

  switchToSynthBtn.addEventListener('click', () => {
    switchToSynth();
  });

  // --- CHAT SYSTEM ---
  const chatMessagesList = document.getElementById('chat-messages-list');
  const chatInputField = document.getElementById('chat-input-field');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const panelTabs = document.querySelectorAll('.panel-tab');

  function addChatMessage(sender, text, isSystem = false) {
    if (!chatMessagesList) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${isSystem ? 'system-msg' : ''}`;
    msg.innerHTML = `<span class="chat-sender">${sender}:</span> ${text}`;
    chatMessagesList.appendChild(msg);
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;

    // Slide/fade animation for messages
    gsap.from(msg, { y: 15, opacity: 0, duration: 0.3, ease: "power2.out" });
  }

  // Initial messages
  setTimeout(() => {
    addChatMessage("System", "Stream starting soon... 🌸", true);
  }, 300);
  setTimeout(() => {
    addChatMessage("Boyfriend", "Happy Birthday, my princess! I hope you like this stream setup I built for you. Click the envelope to open your present! 🎁");
  }, 1000);

  // Send message on input
  function sendUserChatMessage() {
    const text = chatInputField.value.trim();
    if (!text) return;
    chatInputField.value = '';
    
    addChatMessage("Princess", text);

    // BF cute responses
    const bfResponses = [
      "Aww you are so sweet! 💕",
      "You are the most beautiful girl in the world! 🌸",
      "Sending you a million virtual kisses! 😘😘😘",
      "My heart belongs to you forever! ❤️",
      "Happy Birthday, sweetheart! 🎉",
      "I'm so lucky to have you as my girl! 🎀"
    ];
    
    setTimeout(() => {
      const resp = bfResponses[Math.floor(Math.random() * bfResponses.length)];
      addChatMessage("Boyfriend", resp);
    }, 1200 + Math.random() * 800);
  }

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendUserChatMessage);
  }
  if (chatInputField) {
    chatInputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendUserChatMessage();
    });
  }

  // Tab lock/unlock system
  function unlockTab(pageId) {
    const tab = document.querySelector(`.panel-tab[data-target="${pageId}"]`);
    if (tab && tab.classList.contains('locked')) {
      tab.classList.remove('locked');
      addChatMessage("System", `[${tab.querySelector('span').textContent}] tab unlocked! 🔓`, true);
      
      // Elastic pop on unlock
      gsap.fromTo(tab, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
    }
  }

  panelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      if (tab.classList.contains('locked')) {
        addChatMessage("System", "This panel is currently locked! Complete current activities to unlock. 🔒", true);
        
        // Wiggle animation
        gsap.to(tab, { x: 5, duration: 0.1, yoyo: true, repeat: 3, onComplete: () => gsap.set(tab, { x: 0 }) });
        return;
      }
      navigateTo(target);
    });
  });

  // --- TRANSITIONS & NAV SYSTEM ---
  function navigateTo(pageId) {
    const currentPage = document.getElementById(state.activePage);
    const nextPage = document.getElementById(pageId);

    if (!currentPage || !nextPage) return;

    // Outro animation for current page
    const tl = gsap.timeline({
      onComplete: () => {
        currentPage.classList.remove('active');
        nextPage.classList.add('active');
        
        // Intro animation for next page
        runPageIntro(pageId);
      }
    });

    tl.to(currentPage, {
      opacity: 0,
      scale: 0.95,
      duration: 0.4,
      ease: "power2.inOut"
    });

    state.activePage = pageId;

    // Update bottom panel tabs active state
    panelTabs.forEach(tab => {
      if (tab.dataset.target === pageId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function runPageIntro(pageId) {
    const nextPage = document.getElementById(pageId);
    if (!nextPage) return;
    
    gsap.set(nextPage, { display: 'flex', opacity: 0, scale: 0.95 });
    
    const tl = gsap.timeline();
    tl.to(nextPage, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.2)"
    });

    // Page-specific initializers
    if (pageId === 'page-wishes') {
      startTypingWishes();
      // Animate calendar & love letter card slide-in
      gsap.from('.calendar-container, .love-letter-card', {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "back.out(1.4)"
      });
      unlockTab('page-maze');
      addChatMessage("Boyfriend", "Here is my birthday letter to you, my love! Check out the June calendar too. 🥰");
    } else if (pageId === 'page-maze') {
      initMazeGame();
      // Animate camera container & maze game card slide-in
      gsap.from('.camera-layout-container, .maze-game-container', {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "back.out(1.2)"
      });
      addChatMessage("Boyfriend", "Can you guide the avocado 🥑 to the strawberry 🍓? Drag it along the path! 💕");
    } else if (pageId === 'page-memories') {
      // Animate collage & stamps slide-in
      gsap.from('.memories-collage-page, .scraps-layout-container', {
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out"
      });
      addChatMessage("Boyfriend", "Look at all these sweet photos of us! We have so many beautiful moments. Click 'Blow Candles!' when you're ready! 🍰");
    } else if (pageId === 'page-cake') {
      resetCakeState();
      initCake3DIfNeeded();
      if (window.cake3D_resize) window.cake3D_resize();
      gsap.from('.cake-3d-viewport', { scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.2)" });
      gsap.from('.cake-action-bar', { y: 30, opacity: 0, duration: 0.6, delay: 0.3, ease: "power2.out" });
      addChatMessage("Boyfriend", "I baked a 3D strawberry cake for you! 🎂 Drag to rotate it, then light the candle!");
    } else if (pageId === 'page-video') {
      gsap.from('.video-frame', { scale: 0.8, rotation: -5, opacity: 0, duration: 0.8, ease: "back.out(1.5)" });
      gsap.from('#final-wish-letter', { y: 50, opacity: 0, duration: 0.8, delay: 0.4, ease: "power2.out" });
      addChatMessage("Boyfriend", "Here is our stream highlight video! Or click 'Play Heart Show' for romantic visual patterns. Don't forget to send me a heart! 😘");
    }
  }

  // --- PAGE 1: WELCOME SCREEN ---
  const mainEnvelope = document.getElementById('main-envelope');
  const startBtn = document.getElementById('start-btn');

  mainEnvelope.addEventListener('click', (e) => {
    if (e.target.closest('#start-btn')) return; // ignore envelope click if clicked start button
    if (!mainEnvelope.classList.contains('open')) {
      mainEnvelope.classList.add('open');
      toggleMusic(true); // Autoplay audio on envelope open interaction
      addChatMessage("System", "Princess opened the secret envelope! 💌", true);
      setTimeout(() => {
        addChatMessage("Boyfriend", "Yay! Go ahead and click Start to read my letter! 💕");
      }, 800);
    }
  });

  startBtn.addEventListener('click', () => {
    unlockTab('page-wishes');
    addChatMessage("System", "Princess started the birthday adventure! 🚀", true);
    navigateTo('page-wishes');
  });

  // --- PAGE 2: NOTEBOOK WISHES & ALBUM ---
  const wishesTextContainer = document.getElementById('wishes-text');
  const editWishesBtn = document.getElementById('edit-wishes-btn');
  const saveWishesBtn = document.getElementById('save-wishes-btn');
  const wishesEditBox = document.querySelector('.wishes-edit-box');
  const wishesInput = document.getElementById('wishes-input');
  let typingTween = null;

  function startTypingWishes() {
    if (!wishesTextContainer) return;
    wishesTextContainer.innerHTML = '';
    wishesInput.value = state.wishes;

    const words = state.wishes.split(' ');
    
    // Create word spans for elegant word-by-word fade-in typing
    wishesTextContainer.innerHTML = words.map(w => `<span class="word" style="opacity:0; display:inline-block; margin-right:4px;">${w}</span>`).join('');
    
    if (typingTween) typingTween.kill();
    
    typingTween = gsap.to(wishesTextContainer.querySelectorAll('.word'), {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      duration: 0.4,
      ease: "power1.out"
    });
  }

  editWishesBtn.addEventListener('click', () => {
    wishesEditBox.classList.toggle('hidden');
  });

  saveWishesBtn.addEventListener('click', () => {
    state.wishes = wishesInput.value;
    wishesEditBox.classList.add('hidden');
    startTypingWishes();
    addChatMessage("System", "Princess updated the wishes text. 📝", true);
  });

  // Photo uploading logic for all slots
  const uploaders = document.querySelectorAll('.photo-uploader');
  uploaders.forEach(uploader => {
    uploader.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const targetId = uploader.dataset.target;
      const slotContainer = document.getElementById(targetId);
      const imgEl = slotContainer.querySelector('.polaroid-image, .stamp-image');
      const placeholder = slotContainer.querySelector('.polaroid-placeholder, .stamp-placeholder');

      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imgEl.src = event.target.result;
          imgEl.classList.remove('hidden');
          placeholder.classList.add('hidden');

          // Cute pulse scale on upload
          gsap.fromTo(slotContainer, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" });
          addChatMessage("System", `Princess uploaded a new photo. 📷`, true);
        };
        reader.readAsDataURL(file);
      }
    });
  });

  // --- LOVE MAZE GAME INTERACTIVITY ---
  let isDraggingAvocado = false;
  let mazeCompleted = false;

  function initMazeGame() {
    const avocado = document.getElementById('maze-avocado');
    const strawberry = document.getElementById('maze-strawberry');
    const board = document.getElementById('maze-board-svg');
    const statusMsg = document.getElementById('maze-message');

    // Reset maze state
    avocado.style.left = '12px';
    avocado.style.top = '12px';
    mazeCompleted = false;
    statusMsg.innerText = "Drag 🥑 to 🍓!";
    statusMsg.style.color = '#ffd166';

    // Drag events using pointer events for touch & mouse compatibility
    avocado.addEventListener('pointerdown', (e) => {
      if (mazeCompleted) return;
      isDraggingAvocado = true;
      avocado.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    board.addEventListener('pointermove', (e) => {
      if (!isDraggingAvocado || mazeCompleted) return;
      const rect = board.getBoundingClientRect();
      let x = e.clientX - rect.left - 14; // offset half width of avocado
      let y = e.clientY - rect.top - 14;

      // Clamp positions inside the board limits
      x = Math.max(8, Math.min(rect.width - 36, x));
      y = Math.max(8, Math.min(rect.height - 36, y));

      avocado.style.left = `${x}px`;
      avocado.style.top = `${y}px`;

      // Check distance to strawberry
      const strawberryRect = strawberry.getBoundingClientRect();
      const avocadoRect = avocado.getBoundingClientRect();
      const dist = Math.hypot(
        (avocadoRect.left + avocadoRect.width/2) - (strawberryRect.left + strawberryRect.width/2),
        (avocadoRect.top + avocadoRect.height/2) - (strawberryRect.top + strawberryRect.height/2)
      );

      if (dist < 24) {
        mazeCompleted = true;
        isDraggingAvocado = false;
        statusMsg.innerText = "Adventure Completed! 💖";
        statusMsg.style.color = '#ffccd5';
        triggerConfetti(avocado, 15, ['🌸', '✨', '🎀', '🥑', '🍓']);
        
        // Soft animation
        gsap.to(avocado, { scale: 1.3, duration: 0.3, yoyo: true, repeat: 1 });
        unlockTab('page-memories');
        addChatMessage("Boyfriend", "OMG you did it! 💖 You are so good at this! Now check out the memories tab!");
      }
    });

    const stopDrag = (e) => {
      if (isDraggingAvocado) {
        isDraggingAvocado = false;
        try {
          avocado.releasePointerCapture(e.pointerId);
        } catch(err) {}
      }
    };

    avocado.addEventListener('pointerup', stopDrag);
    avocado.addEventListener('pointercancel', stopDrag);
  }

  // Next Page Button (Blow Candles on memories page)
  document.getElementById('to-cake-btn').addEventListener('click', () => {
    unlockTab('page-cake');
    navigateTo('page-cake');
  });

  // --- NEXT PAGE BUTTONS ON EVERY PAGE ---
  const pageOrder = ['page-welcome', 'page-wishes', 'page-maze', 'page-memories', 'page-cake', 'page-video'];
  const nextBtnMap = {
    'next-from-welcome': 'page-wishes',
    'next-from-wishes': 'page-maze',
    'next-from-maze': 'page-memories',
    'next-from-memories': 'page-cake',
    'next-from-cake': 'page-video'
  };

  Object.entries(nextBtnMap).forEach(([btnId, targetPage]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        unlockTab(targetPage);
        navigateTo(targetPage);
        addChatMessage("System", `Navigated to next page! ➡️`, true);
      });
    }
  });

  // --- PAGE 3: 3D CAKE (Three.js) ---
  const toVideoBtn = document.getElementById('to-video-btn');
  const cakeInstruction = document.getElementById('cake-instruction');

  function resetCakeState() {
    state.isCandleLit = false;
    state.isCandleBlown = false;
    state.isCakeCut = false;
    if (window.cake3D_reset) window.cake3D_reset();
  }

  // Initialize 3D cake when navigating to cake page
  let cake3DInitialized = false;
  function initCake3DIfNeeded() {
    if (!cake3DInitialized && window.initCake3D) {
      window.initCake3D(addChatMessage, triggerConfetti, state);
      cake3DInitialized = true;
    }
  }

  // Button handlers for 3D cake
  document.getElementById('light-candle-btn').addEventListener('click', () => {
    if (window.cake3D_lightCandle) window.cake3D_lightCandle();
  });
  document.getElementById('blow-candle-btn').addEventListener('click', () => {
    if (window.cake3D_blowCandle) window.cake3D_blowCandle();
  });
  document.getElementById('cut-cake-btn').addEventListener('click', () => {
    if (window.cake3D_cutCake) window.cake3D_cutCake();
  });
  document.getElementById('explode-cake-btn').addEventListener('click', () => {
    if (window.cake3D_explode) window.cake3D_explode();
  });

  toVideoBtn.addEventListener('click', () => {
    unlockTab('page-video');
    navigateTo('page-video');
  });

  // --- PAGE 4: VIDEO WISHES & FINAL PAGE ---
  const videoEl = document.getElementById('birthday-video');
  const videoPlaceholder = document.getElementById('video-placeholder-container');
  const videoUpload = document.getElementById('video-upload');
  const playVisualizerBtn = document.getElementById('play-visualizer-btn');
  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const sendHeartBtn = document.getElementById('send-heart-btn');
  const restartJourneyBtn = document.getElementById('restart-journey-btn');

  // Auto-detect preloaded video
  if (videoEl.getAttribute('src')) {
    videoEl.classList.remove('hidden');
    videoPlaceholder.classList.add('hidden');
    document.getElementById('custom-controls').classList.remove('hidden');
  }

  // Video Uploader
  videoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videoEl.src = url;
      videoEl.classList.remove('hidden');
      videoPlaceholder.classList.add('hidden');
      
      // Show custom controls
      document.getElementById('custom-controls').classList.remove('hidden');
      videoEl.play();
    }
  });

  // TV Fallback Interactive heart Visualizer
  let canvasCtx = null;
  let visualizerActive = false;
  let animFrameId = null;

  playVisualizerBtn.addEventListener('click', () => {
    videoPlaceholder.classList.add('hidden');
    visualizerCanvas.classList.remove('hidden');
    
    // Start canvas particle visualization
    startCanvasVisualizer();
  });

  function startCanvasVisualizer() {
    canvasCtx = visualizerCanvas.getContext('2d');
    visualizerActive = true;
    
    // Resize canvas
    const resizeCanvas = () => {
      visualizerCanvas.width = visualizerCanvas.parentElement.clientWidth;
      visualizerCanvas.height = visualizerCanvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles list
    const particles = [];

    class VisualHeart {
      constructor() {
        this.x = Math.random() * visualizerCanvas.width;
        this.y = visualizerCanvas.height + 20;
        this.size = Math.random() * 20 + 10;
        this.speed = Math.random() * 2 + 1;
        this.wobble = Math.random() * 2;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        this.hue = Math.random() * 40 + 330; // Pinks & Reds
        this.alpha = Math.random() * 0.5 + 0.5;
      }

      update() {
        this.y -= this.speed;
        this.x += Math.sin(this.wobble) * 0.8;
        this.wobble += this.wobbleSpeed;
        if (this.y < -20) {
          this.y = visualizerCanvas.height + 20;
          this.x = Math.random() * visualizerCanvas.width;
        }
      }

      draw() {
        canvasCtx.save();
        canvasCtx.translate(this.x, this.y);
        canvasCtx.globalAlpha = this.alpha;
        canvasCtx.fillStyle = `hsla(${this.hue}, 100%, 75%, ${this.alpha})`;
        
        // Draw SVG path styled heart
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, 0);
        canvasCtx.bezierCurveTo(-this.size/2, -this.size/2, -this.size, 0, 0, this.size);
        canvasCtx.bezierCurveTo(this.size, 0, this.size/2, -this.size/2, 0, 0);
        canvasCtx.closePath();
        canvasCtx.fill();
        canvasCtx.restore();
      }
    }

    // Spawn initial particles
    for (let i = 0; i < 20; i++) {
      particles.push(new VisualHeart());
    }

    function renderLoop() {
      if (!visualizerActive) return;
      
      // Semi transparent background for nice trails
      canvasCtx.fillStyle = 'rgba(74, 40, 52, 0.2)';
      canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Draw cute note visualizer bars based on beat of the synthesized audio
      if (state.isPlayingMusic) {
        canvasCtx.fillStyle = 'rgba(255, 179, 198, 0.4)';
        const count = 12;
        const barWidth = visualizerCanvas.width / count;
        const bounce = Math.sin(Date.now() * 0.01) * 30 + 30;
        
        for (let i = 0; i < count; i++) {
          const h = (Math.sin(i * 0.5 + Date.now() * 0.005) + 1.2) * bounce;
          canvasCtx.fillRect(i * barWidth + 2, visualizerCanvas.height - h, barWidth - 4, h);
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    }

    renderLoop();
  }

  // Custom TV controls play pause
  const playPauseBtn = document.getElementById('video-play-pause');
  const muteBtn = document.getElementById('video-mute');
  const progressBarFilled = document.getElementById('video-progress-filled');
  const progressContainer = document.getElementById('video-progress-container');

  playPauseBtn.addEventListener('click', () => {
    if (videoEl.paused) {
      videoEl.play();
      playPauseBtn.textContent = '⏸';
    } else {
      videoEl.pause();
      playPauseBtn.textContent = '▶';
    }
  });

  videoEl.addEventListener('timeupdate', () => {
    const pct = (videoEl.currentTime / videoEl.duration) * 100;
    progressBarFilled.style.width = `${pct}%`;
  });

  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoEl.currentTime = pos * videoEl.duration;
  });

  muteBtn.addEventListener('click', () => {
    videoEl.muted = !videoEl.muted;
    muteBtn.textContent = videoEl.muted ? '🔇' : '🔊';
  });

  // Floating heart burst button
  sendHeartBtn.addEventListener('click', () => {
    const phrases = ["Love You! 💖", "You are the best! 🌸", "Happy Birthday! 🎀", "Muah! 😘", "My Princess 👑"];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Spawn floating words & hearts
    spawnFloatingMessage(phrase);
    
    // Scale button on click
    gsap.fromTo(sendHeartBtn, { scale: 0.9 }, { scale: 1.1, yoyo: true, repeat: 1, duration: 0.15 });

    addChatMessage("System", "Princess sent a heart to Boyfriend! ❤️", true);
    setTimeout(() => {
      addChatMessage("Boyfriend", "Aww thank you, my princess! I love you so much! 😘💕");
    }, 800);
  });

  function spawnFloatingMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'floating-heart-msg';
    msg.textContent = text;
    msg.style.position = 'fixed';
    msg.style.left = `${Math.random() * 60 + 20}vw`;
    msg.style.bottom = '10vh';
    msg.style.color = '#ff4d6d';
    msg.style.fontSize = '1.3rem';
    msg.style.fontWeight = 'bold';
    msg.style.zIndex = '999';
    msg.style.textShadow = '2px 2px 0 #fff';
    msg.style.pointerEvents = 'none';

    document.body.appendChild(msg);

    // Floating text rise & sway animation
    gsap.to(msg, {
      y: -500,
      x: `+=${Math.random() * 80 - 40}`,
      opacity: 0,
      scale: 1.5,
      rotation: Math.random() * 30 - 15,
      duration: 3,
      ease: "power1.out",
      onComplete: () => msg.remove()
    });
  }

  // Reset/Restart everything
  if (restartJourneyBtn) {
    restartJourneyBtn.addEventListener('click', () => {
      visualizerActive = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      
      // Reset video
      videoEl.pause();
      videoEl.currentTime = 0;
      videoEl.classList.add('hidden');
      document.getElementById('custom-controls').classList.add('hidden');
      videoPlaceholder.classList.remove('hidden');
      visualizerCanvas.classList.add('hidden');

      // Reset envelope
      mainEnvelope.classList.remove('open');
      gsap.to('body', { backgroundColor: '#e8899a', duration: 0.5 });

      toggleMusic(false);

      // Relock tabs
      panelTabs.forEach(tab => {
        if (tab.dataset.target !== 'page-welcome') {
          tab.classList.add('locked');
        }
      });

      // Reset 3D cake
      if (window.cake3D_reset) window.cake3D_reset();

      addChatMessage("System", "Adventure restarted. 🔄", true);
      navigateTo('page-welcome');
    });
  }


  // --- PARTICLES ENGINE (GSAP helper for bursts) ---
  function triggerConfetti(target, count, emotes) {
    const rect = target.getBoundingClientRect();
    const parentRect = document.body.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const elements = Array.isArray(emotes) ? emotes : [emotes];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.textContent = elements[Math.floor(Math.random() * elements.length)];
      p.style.position = 'fixed';
      p.style.left = `${centerX}px`;
      p.style.top = `${centerY}px`;
      p.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
      p.style.pointerEvents = 'none';
      p.style.zIndex = '1000';
      p.style.userSelect = 'none';

      document.body.appendChild(p);

      // Radial burst physics style animation via GSAP
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 150 + 80;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity - 100; // upward bias

      gsap.to(p, {
        x: `+=${dx}`,
        y: `+=${dy}`,
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        scale: 0.5,
        duration: Math.random() * 1.5 + 1.0,
        ease: "power2.out",
        onComplete: () => p.remove()
      });
    }
  }

  // --- INITIAL INITS ---
  // Ensure the body is setup correctly and welcome screen loads
  runPageIntro('page-welcome');
});
