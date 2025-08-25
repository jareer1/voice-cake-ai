# LiveKit Native Transcription Setup

This document explains how to implement LiveKit's native transcription feature in your VoiceCake AI application.

## Overview

LiveKit provides built-in transcription capabilities through their `TranscriptionService`. This replaces the Web Speech API approach with a more robust, server-side transcription solution.

## Key Changes Made

### 1. Updated Imports
```typescript
import { Room, RoomEvent, Track, TranscriptionSegment } from 'livekit-client';
```

### 2. LiveKit Transcription Event Handler
```typescript
room.on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], participant, publication) => {
  console.log('📝 LiveKit transcription received:', {
    segmentsCount: segments.length,
    participantId: participant?.identity,
    trackId: publication?.trackSid,
    segments: segments.map(s => ({
      id: s.id,
      text: s.text,
      final: s.final,
      startTime: s.startTime,
      endTime: s.endTime,
      language: s.language
    }))
  });

  // Process each transcription segment
  segments.forEach(segment => {
    const speaker = participant?.identity?.includes('agent') || participant?.identity?.includes('ai') ? 'ai' : 'user';
    
    addTranscriptionEntry(
      speaker,
      segment.text,
      segment.endTime ? (segment.endTime - segment.startTime) / 1000 : undefined,
      undefined, // confidence not provided by LiveKit
      segment.final,
      'livekit',
      participant?.identity,
      publication?.trackSid
    );
  });
});
```

### 3. Enhanced Transcription Entry Interface
```typescript
interface TranscriptionEntry {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'ai';
  text: string;
  duration?: number;
  confidence?: number;
  isFinal?: boolean;
  source?: 'livekit' | 'webspeech';
  participantId?: string; // LiveKit participant ID
  trackId?: string; // LiveKit track ID
}
```

## Server-Side Configuration

To enable LiveKit transcription, you need to configure your LiveKit server with transcription settings:

### 1. LiveKit Server Configuration
```yaml
# livekit.yaml
transcription:
  enabled: true
  provider: "deepgram" # or "whisper", "azure", etc.
  api_key: "your_transcription_api_key"
  language: "en-US"
  model: "nova-2" # for DeepGram
```

### 2. Room Creation with Transcription
When creating a LiveKit room, enable transcription:

```typescript
// Server-side room creation
const room = await roomService.createRoom({
  name: roomName,
  emptyTimeout: 10 * 60, // 10 minutes
  maxParticipants: 10,
  metadata: JSON.stringify({
    transcription: {
      enabled: true,
      provider: "deepgram",
      language: "en-US"
    }
  })
});
```

### 3. Client-Side Room Connection
The client automatically receives transcription events when connected to a room with transcription enabled:

```typescript
const room = new Room();
await room.connect(url, token);

// Transcription events are automatically handled
room.on(RoomEvent.TranscriptionReceived, (segments, participant, publication) => {
  // Handle transcription segments
});
```

## Benefits of LiveKit Native Transcription

1. **Server-Side Processing**: Transcription happens on the server, reducing client-side load
2. **Better Accuracy**: Professional transcription services (DeepGram, Whisper, etc.)
3. **Real-time**: Low-latency transcription with interim results
4. **Clean Output**: Only final, complete sentences are saved and displayed
5. **Multi-language Support**: Built-in language detection and support
6. **Speaker Identification**: Automatic speaker diarization
7. **Reliability**: No browser compatibility issues

## Supported Transcription Providers

- **DeepGram**: High accuracy, real-time transcription
- **Whisper**: OpenAI's transcription model
- **Azure Speech Services**: Microsoft's transcription service
- **Google Speech-to-Text**: Google's transcription service

## Migration from Web Speech API

The main changes when migrating from Web Speech API to LiveKit transcription:

1. **Remove Web Speech API code**: No more `SpeechRecognition` instances
2. **Use LiveKit events**: Listen for `TranscriptionReceived` events
3. **Server configuration**: Enable transcription on the LiveKit server
4. **Enhanced data**: Access to participant IDs, track IDs, and timing information
5. **Final-only transcription**: Only complete sentences are saved and displayed

## Final-Only Transcription

The implementation automatically filters out interim transcriptions and only saves/displays final, complete sentences. This prevents the duplicate progressive entries you saw in your example:

**Before (with interim entries):**
```
[20:22:23] Web Agent [LIVEKIT] (interim): Hi,
[20:22:23] Web Agent [LIVEKIT] (interim): Hi, you're
[20:22:23] Web Agent [LIVEKIT] (interim): Hi, you're through
...
[20:22:27] Web Agent [LIVEKIT]: Hi, you're through to Egremont Medical Centre. I am Jess. How can I help you today?
```

**After (final only):**
```
[20:22:27] Web Agent [LIVEKIT]: Hi, you're through to Egremont Medical Centre. I am Jess. How can I help you today?
```

## Example Usage

```typescript
// In your useHumeInference hook
const connectToLiveKitRoom = useCallback(async (sessionData: any) => {
  const room = new Room();
  
  // Set up transcription event listener
  room.on(RoomEvent.TranscriptionReceived, (segments, participant, publication) => {
    segments.forEach(segment => {
      const speaker = participant?.identity?.includes('agent') ? 'ai' : 'user';
      
      addTranscriptionEntry(
        speaker,
        segment.text,
        segment.endTime ? (segment.endTime - segment.startTime) / 1000 : undefined,
        undefined,
        segment.final,
        'livekit',
        participant?.identity,
        publication?.trackSid
      );
    });
  });
  
  await room.connect(sessionData.url, sessionData.token);
}, []);
```

## Troubleshooting

1. **No transcription events**: Ensure transcription is enabled on the server
2. **Missing participant IDs**: Check that participants have proper identities
3. **Audio quality issues**: Ensure proper audio configuration in the room
4. **Language detection**: Verify language settings in server configuration

## Next Steps

1. Configure your LiveKit server with transcription settings
2. Update your room creation logic to enable transcription
3. Test with different transcription providers
4. Implement speaker diarization if needed
5. Add language detection and switching capabilities
