"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Audio for the hero: a looping piano bed plus synthesised machine SFX.
 *
 * Sound is ON by default. It cannot, however, literally autoplay — Chrome,
 * Safari and Firefox all block audible playback until the visitor has
 * interacted with the page, and there is no flag that opts out of that. So the
 * track is armed immediately and starts on the very first gesture (a click,
 * key, touch or scroll). In practice the visitor hears it the moment they do
 * anything at all, and if they never interact, nothing was going to play in any
 * browser regardless of how it was written.
 *
 * The SFX are Web Audio oscillators rather than files — a few lines, no extra
 * payload beside the piano bed.
 */
const TRACK_SRC = "/piano.mp3";
const BED_VOLUME = 0.22;

export function useMachineAudio() {
  const [enabled, setEnabled] = useState(true);
  /** True once a gesture has actually unlocked playback. */
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  // Mirrored into a ref so the mount-time unlock listeners read the live value
  // without re-subscribing. Written in an effect — assigning during render is
  // a tearing hazard under concurrent rendering.
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Create the element once. `preload="none"` keeps the 3.7 MB track off the
  // critical path — it is only fetched when playback is actually attempted.
  useEffect(() => {
    const el = new Audio();
    el.src = TRACK_SRC;
    el.loop = true;
    el.volume = BED_VOLUME;
    el.preload = "none";
    audioRef.current = el;

    const start = () => {
      if (!enabledRef.current) return Promise.reject(new Error("muted"));
      return el.play().then(() => setPlaying(true));
    };

    // Try immediately; browsers will usually refuse for a first-time visitor.
    void start().catch(() => {
      // Refused — arm the first gesture instead. `once` on each, and all four
      // are torn down as soon as one succeeds.
      const events: (keyof WindowEventMap)[] = [
        "pointerdown",
        "keydown",
        "touchstart",
        "wheel",
      ];
      const unlock = () => {
        void start()
          .then(cleanup)
          .catch(() => {
            /* still blocked; leave the listeners armed */
          });
      };
      const cleanup = () => events.forEach((e) => window.removeEventListener(e, unlock));
      events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
      return cleanup;
    });

    return () => {
      el.pause();
      el.src = "";
      audioRef.current = null;
    };
  }, []);


  const context = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  /** One short tone with a quick decay — reads as a machine blip, not a beep. */
  const tone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "square", gain = 0.04) => {
      const ctx = context();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(amp).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [context]
  );

  /** Two-tone chirp when a new line appears. */
  const blip = useCallback(() => {
    if (!enabled) return;
    tone(880, 0.06);
    window.setTimeout(() => tone(1180, 0.05), 60);
  }, [enabled, tone]);

  /** Duller, lower knock when the unit is poked. */
  const thunk = useCallback(() => {
    if (!enabled) return;
    tone(160, 0.16, "sine", 0.09);
    tone(90, 0.22, "triangle", 0.05);
  }, [enabled, tone]);

  /**
   * Start/stop from the click itself rather than from an effect watching
   * `enabled` — the gesture is what unblocks playback, so the play() call has
   * to happen inside the handler to count as user-initiated.
   */
  const toggle = useCallback(() => {
    const el = audioRef.current;
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);

    if (!el) return;
    if (next) {
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
      // The same gesture also unlocks the SFX context.
      context();
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [context]);

  return { enabled, playing, toggle, blip, thunk };
}
