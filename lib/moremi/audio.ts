export type Cue = "tap" | "success" | "retry" | "celebrate";

/** Quiet, short UI cues. Audio begins only inside an interaction handler. */
export class WarmAudio {
  private context: AudioContext | null = null;
  private voices: {oscillator:OscillatorNode;gain:GainNode}[] = [];
  private lastTap = -Infinity;

  play(cue: Cue = "tap") {
    try {
      const context = this.context ?? new AudioContext();
      this.context = context;
      const now = context.currentTime;
      if (cue === "tap" && now - this.lastTap < .1) return;
      if (cue === "tap") this.lastTap = now;
      // One short cue at a time, even when little hands tap everywhere.
      this.silence();
      void context.resume().catch(() => {});
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cue === "retry" ? 1000 : 2400;
      filter.Q.value = .5;
      filter.connect(context.destination);
      const notes = cue === "tap" ? [480 * (.96 + Math.random() * .08)]
        : cue === "retry" ? [300, 330]
        : cue === "celebrate" ? [523.25, 659.25, 783.99, 1046.5]
        : [523.25, 659.25, 783.99];
      const duration = cue === "tap" ? .085 : cue === "retry" ? .12 : .32;
      let remaining = notes.length;
      notes.forEach((frequency, i) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const at = now + i * (cue === "retry" ? .13 : .115);
        oscillator.type = cue === "tap" || cue === "retry" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, at);
        if (cue === "tap") oscillator.frequency.exponentialRampToValueAtTime(frequency * .72, at + duration);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.linearRampToValueAtTime(cue === "retry" ? .035 : .045, at + .006);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain); gain.connect(filter);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices = this.voices.filter(v => v.oscillator !== oscillator); if (--remaining === 0) filter.disconnect(); };
        this.voices.push({oscillator,gain});
        oscillator.start(at); oscillator.stop(at + duration + .02);
      });
    } catch { /* All interactions also work silently. */ }
  }

  silence() { const now=this.context?.currentTime??0; for (const {oscillator,gain} of this.voices) { try { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(Math.min(.045,gain.gain.value),now); gain.gain.linearRampToValueAtTime(0,now+.012); oscillator.stop(now+.015); } catch {} } this.voices = []; }
  dispose() { this.silence(); void this.context?.close().catch(() => {}); this.context = null; }
}
