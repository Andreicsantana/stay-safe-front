function playTone(frequencies, durationSec = 0.16) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    let startTime = ctx.currentTime;

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + durationSec);
      startTime += durationSec + 0.06;
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (frequencies.length * (durationSec + 0.06) + 0.2) * 1000);
  } catch {
    // AudioContext blocked or unavailable
  }
}

function speakPtBr(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // speechSynthesis unavailable
  }
}

function vibrate(pattern) {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // vibrate unavailable
  }
}

export function notifyAlertSent() {
  vibrate([200]);
  playTone([523.25, 659.25]);
  speakPtBr("Ajuda enviada");
}

export function notifyAlertAcknowledged() {
  vibrate([100, 50, 100, 50, 300]);
  playTone([587.33, 783.99, 987.77]);
  speakPtBr("Seu cuidador está a caminho");
}

export function notifyCarerNewAlert() {
  vibrate([250, 100, 250]);
  playTone([783.99, 659.25, 783.99]);
}
