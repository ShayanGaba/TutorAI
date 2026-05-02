import { useState, useRef, useCallback } from "react";

export function useVoice(onTranscriptChange: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          finalTranscriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show both final + interim in input field
      const displayText = (finalTranscript + interimTranscript).trim();
      onTranscriptChange(displayText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [isSupported, isListening, onTranscriptChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    return finalTranscriptRef.current.trim();
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
