"use client";

/**
 * Thin wrapper over the browser Web Speech API (SpeechRecognition). These types
 * aren't in lib.dom, so we declare the minimal surface we use. Emits finalized
 * transcript chunks via the callback; the caller decides how to append them.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechAlternative {
  readonly transcript: string;
}
interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative;
}
interface SpeechResultList {
  readonly length: number;
  readonly [index: number]: SpeechResult;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechInput(onFinalText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef(onFinalText);
  cbRef.current = onFinalText;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => recRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
      }
      finalText = finalText.trim();
      if (finalText) cbRef.current(finalText);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    rec.onerror = () => {
      recRef.current = null;
      setListening(false);
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  return { supported, listening, toggle };
}
