/**
 * Event Voice Chat Hook — WebRTC P2P audio for group event chats
 * Manages multiple RTCPeerConnections for N-to-N mesh topology
 * Patterns adapted from useCoffeeVoiceCall
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { gamesApi } from '@/api/games';

type VoiceStatus = 'idle' | 'requesting_microphone' | 'connecting' | 'connected' | 'error';

interface EventsSocketLike {
  isConnected: boolean;
  emit: (event: string, data?: any) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => (() => void) | void;
  off?: (event: string, handler?: (...args: any[]) => void) => void;
}

export interface UseEventVoiceChatParams {
  eventId: string;
  myParticipantId: string;
  eventsSocket?: EventsSocketLike;
}

export function useEventVoiceChat(params: UseEventVoiceChatParams) {
  const { eventId, myParticipantId, eventsSocket } = params;

  // State
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<string[]>([]);
  const [voiceStatuses, setVoiceStatuses] = useState<Record<string, 'idle' | 'active' | 'muted'>>({});
  const [micLevel, setMicLevel] = useState(0);
  const [iceServersCache, setIceServersCache] = useState<any[] | null>(null);

  // Refs
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Mic metering
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterRafRef = useRef<number | null>(null);
  const meterLastUpdateRef = useRef<number>(0);
  const micDataRef = useRef<Uint8Array | null>(null);

  const iceServers = useMemo(() => {
    return iceServersCache ?? [{ urls: ['stun:stun.l.google.com:19302'] }];
  }, [iceServersCache]);

  // ─── Start Voice Chat ───
  const startVoice = useCallback(async () => {
    if (!eventsSocket?.isConnected) {
      setError('Socket not connected');
      return;
    }

    try {
      setStatus('requesting_microphone');
      setError(null);

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      localStreamRef.current = stream;

      // 2. Fetch ICE servers
      try {
        const iceResponse = await gamesApi.getIceServers();
        setIceServersCache(iceResponse.iceServers || []);
      } catch (iceErr) {
        console.warn('[EventVoice] Failed to fetch ICE servers, using defaults', iceErr);
      }

      // 3. Join voice room
      try {
        await eventsSocket.emit('event:voice_join', {
          eventId,
          participantId: myParticipantId,
        });
      } catch (joinErr: any) {
        throw new Error(`Failed to join voice room: ${joinErr?.message || 'Unknown error'}`);
      }

      // 4. Register socket listeners
      const unsubOffer = eventsSocket.on('event:voice_offer', (data: any) => {
        console.log('[EventVoice] Received offer from', data.fromParticipantId);
        handleIncomingOffer(data);
      });

      const unsubAnswer = eventsSocket.on('event:voice_answer', (data: any) => {
        console.log('[EventVoice] Received answer from', data.fromParticipantId);
        handleIncomingAnswer(data);
      });

      const unsubIce = eventsSocket.on('event:voice_ice_candidate', (data: any) => {
        handleIceCandidate(data);
      });

      const unsubJoined = eventsSocket.on('event:voice_participant_joined', (data: any) => {
        if (data.participantId !== myParticipantId) {
          console.log('[EventVoice] User joined:', data.participantId);
          connectToParticipant(data.participantId);
          setRemoteParticipants((prev) => {
            if (prev.includes(data.participantId)) return prev;
            return [...prev, data.participantId];
          });
        }
      });

      const unsubLeft = eventsSocket.on('event:voice_participant_left', (data: any) => {
        if (data.participantId) {
          console.log('[EventVoice] User left:', data.participantId);
          disconnectFromParticipant(data.participantId);
          setRemoteParticipants((prev) => prev.filter((p) => p !== data.participantId));
        }
      });

      const unsubStatus = eventsSocket.on('event:voice_status', (data: any) => {
        setVoiceStatuses((prev) => ({
          ...prev,
          [data.participantId]: data.status,
        }));
      });

      unsubscribersRef.current = [unsubOffer, unsubAnswer, unsubIce, unsubJoined, unsubLeft, unsubStatus].filter(
        Boolean
      ) as Array<() => void>;

      // 5. Start mic level metering
      startMicMeter(stream);

      setStatus('connected');
    } catch (err: any) {
      console.error('[EventVoice] startVoice error:', err);
      setStatus('error');
      setError(err?.message || 'Failed to start voice');
      stopVoice().catch(() => {});
    }
  }, [eventId, myParticipantId, eventsSocket]);

  // ─── Stop Voice Chat ───
  const stopVoice = useCallback(async () => {
    try {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        pc.close();
      });
      peerConnectionsRef.current.clear();

      // Clear remote streams
      remoteStreamsRef.current.clear();

      // Unsubscribe from socket events
      unsubscribersRef.current.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribersRef.current = [];

      // Stop mic metering
      if (meterRafRef.current) {
        cancelAnimationFrame(meterRafRef.current);
        meterRafRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Leave voice room
      if (eventsSocket?.isConnected) {
        try {
          await eventsSocket.emit('event:voice_leave', {
            eventId,
            participantId: myParticipantId,
          });
        } catch (err) {
          console.warn('[EventVoice] Failed to emit voice_leave:', err);
        }
      }

      setStatus('idle');
      setRemoteParticipants([]);
      setVoiceStatuses({});
      setMicLevel(0);
    } catch (err: any) {
      console.error('[EventVoice] stopVoice error:', err);
    }
  }, [eventId, myParticipantId, eventsSocket]);

  // ─── Toggle Mute ───
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    const newMuted = !isMuted;

    audioTracks.forEach((track) => {
      track.enabled = !newMuted;
    });

    setIsMuted(newMuted);

    // Broadcast status
    if (eventsSocket?.isConnected) {
      eventsSocket.emit('event:voice_status', {
        eventId,
        participantId: myParticipantId,
        status: newMuted ? 'muted' : 'active',
      });
    }
  }, [isMuted, eventId, myParticipantId, eventsSocket]);

  // ─── Connect to Participant ───
  const connectToParticipant = useCallback(
    async (participantId: string) => {
      try {
        if (peerConnectionsRef.current.has(participantId)) {
          console.log('[EventVoice] Already connected to', participantId);
          return;
        }

        console.log('[EventVoice] Creating peer connection with', participantId);
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionsRef.current.set(participantId, pc);

        // Add local tracks
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        // Handle remote stream
        const remoteStream = new MediaStream();
        remoteStreamsRef.current.set(participantId, remoteStream);

        pc.ontrack = (event) => {
          console.log('[EventVoice] Got remote track from', participantId);
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            eventsSocket?.emit('event:voice_ice_candidate', {
              eventId,
              fromParticipantId: myParticipantId,
              toParticipantId: participantId,
              candidate: {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                usernameFragment: event.candidate.usernameFragment,
              },
            });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log(`[EventVoice] Connection state with ${participantId}:`, pc.connectionState);
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            setTimeout(() => {
              if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                console.log('[EventVoice] Closing connection with', participantId);
                disconnectFromParticipant(participantId);
              }
            }, 5000);
          }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await eventsSocket?.emit('event:voice_offer', {
          eventId,
          fromParticipantId: myParticipantId,
          toParticipantId: participantId,
          sdp: offer.sdp,
        });

        console.log('[EventVoice] Sent offer to', participantId);
      } catch (err) {
        console.error('[EventVoice] connectToParticipant error:', err);
      }
    },
    [eventId, myParticipantId, eventsSocket, iceServers]
  );

  // ─── Handle Incoming Offer ───
  const handleIncomingOffer = useCallback(
    async (data: any) => {
      try {
        const { fromParticipantId, sdp } = data;

        let pc = peerConnectionsRef.current.get(fromParticipantId);
        if (!pc) {
          console.log('[EventVoice] Creating peer connection (answer) with', fromParticipantId);
          pc = new RTCPeerConnection({ iceServers });
          peerConnectionsRef.current.set(fromParticipantId, pc);

          // Add local tracks
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((track) => {
              pc!.addTrack(track, localStreamRef.current!);
            });
          }

          // Handle remote stream
          const remoteStream = new MediaStream();
          remoteStreamsRef.current.set(fromParticipantId, remoteStream);

          pc.ontrack = (event) => {
            console.log('[EventVoice] Got remote track from', fromParticipantId);
            event.streams[0].getTracks().forEach((track) => {
              remoteStream.addTrack(track);
            });
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              eventsSocket?.emit('event:voice_ice_candidate', {
                eventId,
                fromParticipantId: myParticipantId,
                toParticipantId: fromParticipantId,
                candidate: {
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex,
                  usernameFragment: event.candidate.usernameFragment,
                },
              });
            }
          };

          pc.onconnectionstatechange = () => {
            console.log(`[EventVoice] Connection state with ${fromParticipantId}:`, pc.connectionState);
          };
        }

        // Set remote description and send answer
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await eventsSocket?.emit('event:voice_answer', {
          eventId,
          fromParticipantId: myParticipantId,
          toParticipantId: fromParticipantId,
          sdp: answer.sdp,
        });

        console.log('[EventVoice] Sent answer to', fromParticipantId);
      } catch (err) {
        console.error('[EventVoice] handleIncomingOffer error:', err);
      }
    },
    [eventId, myParticipantId, eventsSocket, iceServers]
  );

  // ─── Handle Incoming Answer ───
  const handleIncomingAnswer = useCallback((data: any) => {
    try {
      const { fromParticipantId, sdp } = data;
      const pc = peerConnectionsRef.current.get(fromParticipantId);
      if (pc && pc.remoteDescription === null) {
        pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
      }
    } catch (err) {
      console.error('[EventVoice] handleIncomingAnswer error:', err);
    }
  }, []);

  // ─── Handle ICE Candidate ───
  const handleIceCandidate = useCallback((data: any) => {
    try {
      const { fromParticipantId, candidate } = data;
      const pc = peerConnectionsRef.current.get(fromParticipantId);
      if (pc && candidate.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      // Ignore ICE failures - they're best effort
      console.debug('[EventVoice] Ice candidate error (ignored):', err);
    }
  }, []);

  // ─── Disconnect from Participant ───
  const disconnectFromParticipant = useCallback((participantId: string) => {
    const pc = peerConnectionsRef.current.get(participantId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(participantId);
    }
    remoteStreamsRef.current.delete(participantId);
  }, []);

  // ─── Mic Metering ───
  const startMicMeter = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      micDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        const now = performance.now();
        if (now - meterLastUpdateRef.current < 100) {
          meterRafRef.current = requestAnimationFrame(updateMeter);
          return;
        }
        meterLastUpdateRef.current = now;

        if (analyserRef.current && micDataRef.current) {
          (analyserRef.current.getByteFrequencyData as any)(micDataRef.current);
          const average = micDataRef.current.reduce((a, b) => a + b) / micDataRef.current.length;
          const normalized = Math.min(average / 255, 1);
          setMicLevel(normalized);
        }

        meterRafRef.current = requestAnimationFrame(updateMeter);
      };

      meterRafRef.current = requestAnimationFrame(updateMeter);
    } catch (err) {
      console.warn('[EventVoice] Failed to start mic meter:', err);
    }
  }, []);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      if (status !== 'idle') {
        stopVoice().catch(() => {});
      }
    };
  }, []);

  return {
    status,
    error,
    isMuted,
    micLevel,
    remoteParticipants,
    voiceStatuses,
    startVoice,
    stopVoice,
    toggleMute,
    remoteStreamsRef,
  };
}
