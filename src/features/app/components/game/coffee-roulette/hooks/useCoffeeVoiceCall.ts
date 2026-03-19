import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gamesApi, type IceServersResponse } from '@/features/app/api/games';

type VoiceStatus = 'idle' | 'requesting_microphone' | 'connecting' | 'connected' | 'error';

type GamesSocketLike = {
  isConnected: boolean;
  socket: any;
  emit: <T = any>(event: string, data?: any) => Promise<T | void>;
  on: (event: string, handler: (...args: any[]) => void) => () => void;
};

type CoffeeVoiceSdpMessage = {
  sessionId: string;
  pairId: string;
  fromParticipantId: string;
  sdp: string;
};

type CoffeeVoiceIceCandidateMessage = {
  sessionId: string;
  pairId: string;
  fromParticipantId: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment?: string | null;
  };
};

export function useCoffeeVoiceCall(params: {
  sessionId: string;
  pairId: string;
  myParticipantId: string;
  partnerParticipantId: string;
  isOfferer: boolean;
  eventId?: string;
  gamesSocket?: GamesSocketLike;
  onRemoteHangup?: () => void;
}) {
  const { sessionId, pairId, myParticipantId, isOfferer, eventId, gamesSocket, onRemoteHangup } = params;

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const localUnsubscribersRef = useRef<Array<() => void>>([]);
  const offerReceivedRef = useRef(false);
  const offerRequestTimersRef = useRef<number[]>([]);

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [iceServersCache, setIceServersCache] = useState<IceServersResponse['iceServers'] | null>(null);

  const iceServers = useMemo(() => {
    return iceServersCache ?? [{ urls: ['stun:stun.l.google.com:19302'] }];
  }, [iceServersCache]);

  const stopVoice = useCallback(
    async (opts?: { emitHangup?: boolean }) => {
      const emitHangup = opts?.emitHangup ?? true;

      // Stop listeners first to avoid race conditions during teardown.
      for (const unsub of localUnsubscribersRef.current) unsub();
      localUnsubscribersRef.current = [];

      // Cancel any pending offer requests.
      for (const t of offerRequestTimersRef.current) clearTimeout(t);
      offerRequestTimersRef.current = [];
      offerReceivedRef.current = false;

      try {
        if (emitHangup && gamesSocket?.isConnected) {
          // Best-effort hangup so the other side can close immediately.
          void gamesSocket.emit('coffee:voice_hangup', { sessionId, pairId }).catch(() => {});
        }
      } catch {
        // ignore
      }

      try {
        peerRef.current?.getSenders().forEach((s) => {
          try {
            s.track?.stop();
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }

      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }

      try {
        peerRef.current?.close();
      } catch {
        // ignore
      }

      peerRef.current = null;
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      setRemoteStream(null);
      setIsMuted(false);
      setStatus('idle');
      setError(null);
    },
    [gamesSocket?.isConnected, pairId, sessionId]
  );

  // Keep teardown safe on unmount.
  useEffect(() => {
    return () => {
      void stopVoice({ emitHangup: true });
    };
  }, [stopVoice]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted; // if currently muted, enable; else disable below
    });
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  const startVoice = useCallback(async () => {
    if (!gamesSocket?.socket || !gamesSocket.isConnected) {
      setStatus('error');
      setError('SOCKET_DISCONNECTED');
      return;
    }

    setStatus('requesting_microphone');
    setError(null);

    try {
      if (!iceServersCache && eventId) {
        const res = await gamesApi.getIceServers(eventId);
        setIceServersCache(res.iceServers);
      } else if (!iceServersCache) {
        // If eventId missing (shouldn't happen), use default STUN-only.
        setIceServersCache(null);
      }

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = localStream;
      setIsMuted(false);

      const pc = new RTCPeerConnection({ iceServers: iceServers as any });
      peerRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setStatus('connected');
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('error');
          setError('CONNECTION_FAILED');
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('connected');
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        const candidate = ev.candidate.toJSON();
        void gamesSocket.emit('coffee:voice_ice_candidate', {
          sessionId,
          pairId,
          candidate: {
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            usernameFragment: (candidate as any).usernameFragment ?? null,
          },
        }).catch((err) => {
          console.warn('[useCoffeeVoiceCall] ice emit failed', err);
        });
      };

      pc.ontrack = (ev) => {
        const stream = ev.streams?.[0] ?? null;
        if (!stream) return;
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      };

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Socket listeners for negotiation messages.
      // These must be attached before we start sending offers/answers.
      localUnsubscribersRef.current.forEach((u) => u());
      localUnsubscribersRef.current = [];

      const unsubOffer = gamesSocket.on('coffee:voice_offer', (msg: CoffeeVoiceSdpMessage) => {
        if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
        // Answerer handles offers only.
        if (isOfferer) return;
        const p = peerRef.current;
        if (!p) return;

        void (async () => {
          console.log('[useCoffeeVoiceCall] received offer', {
            sessionId,
            pairId,
            fromParticipantId: msg.fromParticipantId,
            sdpLength: msg.sdp.length,
          });
          offerReceivedRef.current = true;
          setStatus('connecting');
          await p.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
          const answer = await p.createAnswer();
          await p.setLocalDescription(answer);
          await gamesSocket.emit('coffee:voice_answer', {
            sessionId,
            pairId,
            sdp: answer.sdp || p.localDescription?.sdp,
          });
        })().catch((e) => {
          console.error('[useCoffeeVoiceCall] handle offer failed', e);
          setStatus('error');
          setError(e instanceof Error ? e.message : 'OFFER_HANDLE_FAILED');
        });
      });

      const unsubAnswer = gamesSocket.on('coffee:voice_answer', (msg: CoffeeVoiceSdpMessage) => {
        if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
        // Offerer handles answers only.
        if (!isOfferer) return;
        const p = peerRef.current;
        if (!p) return;

        void (async () => {
          console.log('[useCoffeeVoiceCall] received answer', {
            sessionId,
            pairId,
            fromParticipantId: msg.fromParticipantId,
            sdpLength: msg.sdp.length,
          });
          setStatus('connecting');
          await p.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
        })().catch((e) => {
          console.error('[useCoffeeVoiceCall] handle answer failed', e);
          setStatus('error');
          setError(e instanceof Error ? e.message : 'ANSWER_HANDLE_FAILED');
        });
      });

      const unsubIce = gamesSocket.on('coffee:voice_ice_candidate', (msg: CoffeeVoiceIceCandidateMessage) => {
        if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
        const p = peerRef.current;
        if (!p) return;

        void p.addIceCandidate(msg.candidate as any).catch(() => {});
      });

      const unsubHangup = gamesSocket.on('coffee:voice_hangup', (msg: { sessionId: string; pairId: string }) => {
        if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
        console.log('[useCoffeeVoiceCall] remote hangup');
        void stopVoice({ emitHangup: false }).then(() => onRemoteHangup?.());
      });

      localUnsubscribersRef.current.push(unsubOffer, unsubAnswer, unsubIce, unsubHangup);

      // Negotiation
      if (isOfferer) {
        setStatus('connecting');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        try {
          await gamesSocket.emit('coffee:voice_offer', {
            sessionId,
            pairId,
            sdp: offer.sdp || pc.localDescription?.sdp,
          });
        } catch (e) {
          console.error('[useCoffeeVoiceCall] voice_offer emit failed', e);
          throw e;
        }
      }

      // If we are the answerer and the offer may have already been emitted
      // (e.g. we enabled voice late), request the most recent offer from backend.
      if (!isOfferer) {
        const requestOffer = () => {
          if (!gamesSocket?.isConnected) return;
          if (offerReceivedRef.current) return;
          void gamesSocket
            .emit('coffee:voice_request_offer', { sessionId, pairId })
            .catch((err) => {
              // OFFER_NOT_READY is expected sometimes; keep retrying.
              console.warn('[useCoffeeVoiceCall] voice_request_offer failed', err);
            });
        };

        // First request immediately, then retry a few times.
        requestOffer();
        const timers = [1200, 2600, 4200];
        for (const delay of timers) {
          const id = window.setTimeout(() => {
            if (offerReceivedRef.current) return;
            requestOffer();
          }, delay);
          offerRequestTimersRef.current.push(id);
        }
      }

      setStatus('connecting');
    } catch (e) {
      console.error('[useCoffeeVoiceCall] startVoice failed', e);
      setStatus('error');
      setError(e instanceof Error ? e.message : 'MIC_OR_NEGOTIATION_FAILED');
      await stopVoice({ emitHangup: false });
    }
  }, [
    eventId,
    gamesSocket,
    iceServersCache,
    iceServers,
    isOfferer,
    pairId,
    onRemoteHangup,
    sessionId,
    stopVoice,
  ]);

  return {
    status,
    error,
    remoteStream,
    isMuted,
    startVoice,
    stopVoice,
    toggleMute,
  };
}

