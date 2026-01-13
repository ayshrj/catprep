import { useEffect, useRef, useState } from "react"

import { recordAudio } from "@/lib/audio-utils"

interface UseAudioRecordingOptions {
  transcribeAudio?: (blob: Blob) => Promise<string>
  onTranscriptionComplete?: (text: string) => void
}

export function useAudioRecording({
  transcribeAudio,
  onTranscriptionComplete,
}: UseAudioRecordingOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(!!transcribeAudio)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const activeRecordingRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  useEffect(() => {
    const checkSpeechSupport = async () => {
      const hasMediaDevices = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      )
      setIsSpeechSupported(
        (hasMediaDevices && !!transcribeAudio) || speechRecognitionSupported
      )
    }

    checkSpeechSupport()
  }, [speechRecognitionSupported, transcribeAudio])

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  const stopRecording = async () => {
    if (!transcribeAudio && speechRecognitionSupported) {
      stopSpeechRecognition()
      return
    }

    setIsRecording(false)
    setIsTranscribing(true)
    try {
      // First stop the recording to get the final blob
      recordAudio.stop()
      // Wait for the recording promise to resolve with the final blob
      const recording = await activeRecordingRef.current
      if (transcribeAudio) {
        const text = await transcribeAudio(recording)
        onTranscriptionComplete?.(text)
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
    } finally {
      setIsTranscribing(false)
      setIsListening(false)
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
        setAudioStream(null)
      }
      activeRecordingRef.current = null
    }
  }

  const toggleListening = async () => {
    if (!transcribeAudio && speechRecognitionSupported) {
      if (!isListening) {
        try {
          const SpeechRecognition =
            // @ts-expect-error missing type
            window.SpeechRecognition || window.webkitSpeechRecognition
          const recognition = new SpeechRecognition()
          recognitionRef.current = recognition
          recognition.continuous = false
          recognition.interimResults = false
          recognition.onresult = (event: any) => {
            const results = Array.from(event.results || [])
            const transcript = results
              .map((result: any) => result?.[0]?.transcript ?? "")
              .join(" ")
              .trim()
            if (transcript) {
              onTranscriptionComplete?.(transcript)
            }
          }
          recognition.onerror = () => {
            setIsListening(false)
          }
          recognition.onend = () => {
            setIsListening(false)
          }
          setIsListening(true)
          recognition.start()
        } catch (error) {
          console.error("Speech recognition error:", error)
          setIsListening(false)
        }
      } else {
        stopSpeechRecognition()
      }
      return
    }

    if (!isListening) {
      try {
        setIsListening(true)
        setIsRecording(true)
        // Get audio stream first
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        setAudioStream(stream)

        // Start recording with the stream
        activeRecordingRef.current = recordAudio(stream)
      } catch (error) {
        console.error("Error recording audio:", error)
        setIsListening(false)
        setIsRecording(false)
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop())
          setAudioStream(null)
        }
      }
    } else {
      await stopRecording()
    }
  }

  return {
    isListening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    toggleListening,
    stopRecording,
  }
}
