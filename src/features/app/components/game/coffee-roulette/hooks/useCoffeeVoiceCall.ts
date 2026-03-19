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
  const answerAppliedRef = useRef(false);
  const offerRequestTimersRef = useRef<number[]>([]);
  const pendingOfferSdpRef = useRef<string | null>(null);
  // ICE candidates may arrive before `setRemoteDescription()` finishes.
  // Buffer them and flush once remote description is set.
  const iceCandidateQueueRef = useRef<any[]>([]);
  const lastPartnerHangupAtRef = useRef<number | null>(null);

  // Mic level meter (Web Audio analyser)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const meterRafRef = useRef<number | null>(null);
  const meterLastUpdateRef = useRef<number>(0);
  const micDataRef = useRef<Uint8Array | null>(null);

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [iceServersCache, setIceServersCache] = useState<IceServersResponse['iceServers'] | null>(null);
  const [showEnableVoicePrompt, setShowEnableVoicePrompt] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micComfort, setMicComfort] = useState<'quiet' | 'ok' | 'loud'>('ok');
  const micComfortRef = useRef<'quiet' | 'ok' | 'loud'>('ok');

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
      answerAppliedRef.current = false;
      pendingOfferSdpRef.current = null;
      iceCandidateQueueRef.current = [];
      setShowEnableVoicePrompt(false);

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
      setMicLevel(0);
      micQuietSinceRef.current = null;
      micLoudSinceRef.current = null;
      setMicComfort('ok');
      micComfortRef.current = 'ok';
      setStatus('idle');
      setError(null);
    },
    [gamesSocket?.isConnected, pairId, sessionId]
  );

  const stopMicMeter = useCallback(async () => {
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = null;

    try {
      micSourceRef.current?.disconnect();
    } catch {
      // ignore
    }
    micSourceRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {
      // ignore
    }
    analyserRef.current = null;

    try {
      await audioContextRef.current?.close();
    } catch {
      // ignore
    }
    audioContextRef.current = null;
    micDataRef.current = null;
  }, []);

  // Ensure we stop mic meter when voice stops.
  useEffect(() => {
    if (status === 'idle') void stopMicMeter();
  }, [status, stopMicMeter]);

  // Mic auto-detect thresholds (hysteresis)
  const MIC_QUIET_ENTER = 0.18;
  const MIC_QUIET_EXIT = 0.24;
  const MIC_LOUD_ENTER = 0.80;
  const MIC_LOUD_EXIT = 0.72;
  const MIC_HOLD_MS = 800;
  const micQuietSinceRef = useRef<number | null>(null);
  const micLoudSinceRef = useRef<number | null>(null);

  // Keep teardown safe on unmount.
  useEffect(() => {
    return () => {
      void stopVoice({ emitHangup: true });
    };
  }, [stopVoice]);

  // ─── Telemetry: modal opened/closed ─────────────────────────────────────────
  useEffect(() => {
    console.log('[CoffeeVoice][telemetry] modal', {
      event: showEnableVoicePrompt ? 'opened' : 'closed',
      sessionId,
      pairId,
      role: isOfferer ? 'offerer' : 'answerer',
    });
  }, [showEnableVoicePrompt, isOfferer, sessionId, pairId]);

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
    setShowEnableVoicePrompt(false);
    answerAppliedRef.current = false;

    try {
      if (!iceServersCache && eventId) {
        const res = await gamesApi.getIceServers(eventId);
        setIceServersCache(res.iceServers);
      } else if (!iceServersCache) {
        // If eventId missing (shouldn't happen), use default STUN-only.
        setIceServersCache(null);
      }

      // Voice quality improvements:
      // - echo cancellation / noise suppression / auto gain (when supported)
      // - mono channel to reduce CPU/latency for 1:1 calls
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });

      localStreamRef.current = localStream;
      setIsMuted(false);
      setMicLevel(0);
      micQuietSinceRef.current = null;
      micLoudSinceRef.current = null;
      setMicComfort('ok');
      micComfortRef.current = 'ok';

      // Setup mic analyser for the level meter.
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioCtx();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        const micSource = audioContext.createMediaStreamSource(localStream);
        micSource.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        micSourceRef.current = micSource;
        micDataRef.current = new Uint8Array(analyser.fftSize);

        const tick = (ts: number) => {
          const a = analyserRef.current;
          const data = micDataRef.current;
          if (!a || !data) return;

          // Throttle UI updates to reduce renders.
          if (ts - meterLastUpdateRef.current >= 60) {
            meterLastUpdateRef.current = ts;
            a.getByteTimeDomainData(data);
            // Compute RMS from time-domain samples.
            let sumSq = 0;
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128;
              sumSq += v * v;
            }
            const rms = Math.sqrt(sumSq / data.length);
            // Normalize: typical speech ~0.05-0.15; map to [0..1].
            const level = Math.max(0, Math.min(1, rms * 4));
            setMicLevel(level);

            const currentComfort = micComfortRef.current;
            if (level < MIC_QUIET_ENTER) {
              if (micQuietSinceRef.current == null) micQuietSinceRef.current = ts;
              micLoudSinceRef.current = null;
              if (ts - micQuietSinceRef.current >= MIC_HOLD_MS && currentComfort !== 'quiet') {
                micComfortRef.current = 'quiet';
                setMicComfort('quiet');
              }
            } else if (level > MIC_LOUD_ENTER) {
              if (micLoudSinceRef.current == null) micLoudSinceRef.current = ts;
              micQuietSinceRef.current = null;
              const loudSince = micLoudSinceRef.current;
              if (loudSince != null && ts - loudSince >= MIC_HOLD_MS && currentComfort !== 'loud') {
                micComfortRef.current = 'loud';
                setMicComfort('loud');
              }
            } else {
              // Hysteresis release back to OK.
              if (currentComfort === 'quiet' && level >= MIC_QUIET_EXIT) {
                micQuietSinceRef.current = null;
                micComfortRef.current = 'ok';
                setMicComfort('ok');
              } else if (currentComfort === 'loud' && level <= MIC_LOUD_EXIT) {
                micLoudSinceRef.current = null;
                micComfortRef.current = 'ok';
                setMicComfort('ok');
              }

              if (level >= MIC_QUIET_EXIT) micQuietSinceRef.current = null;
              if (level <= MIC_LOUD_EXIT) micLoudSinceRef.current = null;
            }
          }
          meterRafRef.current = requestAnimationFrame(tick);
        };

        meterLastUpdateRef.current = 0;
        meterRafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.warn('[CoffeeVoice][telemetry] mic_meter_setup_failed', {
          sessionId,
          pairId,
          error: e instanceof Error ? e.message : String(e),
        });
      }

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

      // Apply sender-side bitrate constraints (best-effort, browser support varies).
      try {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          const sender = pc.getSenders().find((s) => s.track === audioTrack);
          if (sender) {
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            // 64kbps is a good balance for Opus in real-world networks.
            params.encodings[0] = { ...params.encodings[0], maxBitrate: 64000 };
            await sender.setParameters(params);
          }
        }
      } catch (e) {
        console.warn('[CoffeeVoice][telemetry] sender_setParameters_failed', {
          sessionId,
          pairId,
          error: e instanceof Error ? e.message : String(e),
        });
      }

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
        // Guard against duplicate offers.
        if (offerReceivedRef.current) return;

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

          // Flush queued ICE candidates once remote description is set.
          if (iceCandidateQueueRef.current.length > 0) {
            const queued = iceCandidateQueueRef.current;
            iceCandidateQueueRef.current = [];
            console.log('[CoffeeVoice][telemetry] ice_flush_after_offer', {
              sessionId,
              pairId,
              queuedCount: queued.length,
            });
            await Promise.all(
              queued.map((c) =>
                p.addIceCandidate(c).catch((e) => {
                  console.warn('[CoffeeVoice][telemetry] ice_flush_add_failed', {
                    sessionId,
                    pairId,
                    error: e instanceof Error ? e.message : String(e),
                  });
                })
              )
            );
          }
          const answer = await p.createAnswer();
          await p.setLocalDescription(answer);
          // If the partner socket is not connected yet, retry a few times.
          // This prevents sporadic negotiation failures when voice is enabled late.
          const sdpToSend = answer.sdp || p.localDescription?.sdp;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              if (peerRef.current !== p) return; // teardown during retries
              await gamesSocket.emit('coffee:voice_answer', {
                sessionId,
                pairId,
                sdp: sdpToSend,
              });
              break;
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              const canRetry = msg.includes('PARTNER_NOT_CONNECTED') && attempt < 2;
              if (!canRetry) throw e;
              console.warn('[CoffeeVoice][telemetry] answer_emit_retry_partner_offline', {
                sessionId,
                pairId,
                attempt: attempt + 1,
                reason: msg,
              });
              await new Promise((r) => setTimeout(r, 650 * (attempt + 1)));
            }
          }
          console.log('[CoffeeVoice][telemetry] answer_emit', {
            sessionId,
            pairId,
            role: 'answerer',
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
        // Guard against duplicate answers.
        if (answerAppliedRef.current) return;

        void (async () => {
          console.log('[useCoffeeVoiceCall] received answer', {
            sessionId,
            pairId,
            fromParticipantId: msg.fromParticipantId,
            sdpLength: msg.sdp.length,
          });
          answerAppliedRef.current = true;
          setStatus('connecting');
          await p.setRemoteDescription({ type: 'answer', sdp: msg.sdp });

          // Flush queued ICE candidates once remote description is set.
          if (iceCandidateQueueRef.current.length > 0) {
            const queued = iceCandidateQueueRef.current;
            iceCandidateQueueRef.current = [];
            console.log('[CoffeeVoice][telemetry] ice_flush_after_answer', {
              sessionId,
              pairId,
              queuedCount: queued.length,
            });
            await Promise.all(
              queued.map((c) =>
                p.addIceCandidate(c).catch((e) => {
                  console.warn('[CoffeeVoice][telemetry] ice_flush_add_failed', {
                    sessionId,
                    pairId,
                    error: e instanceof Error ? e.message : String(e),
                  });
                })
              )
            );
          }
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
        const candidate = msg.candidate as any;

        // Buffer until remote description exists to avoid addIceCandidate races.
        // This prevents first-attempt failures with `CONNECTION_FAILED`.
        if (!p.remoteDescription) {
          iceCandidateQueueRef.current.push(candidate);
          return;
        }

        void p.addIceCandidate(candidate).catch((e) => {
          console.warn('[CoffeeVoice][telemetry] ice_add_failed', {
            sessionId,
            pairId,
            role: isOfferer ? 'offerer' : 'answerer',
            error: e instanceof Error ? e.message : String(e),
          });
        });
      });

      const unsubHangup = gamesSocket.on('coffee:voice_hangup', (msg: { sessionId: string; pairId: string }) => {
        if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
        console.log('[CoffeeVoice][telemetry] hangup_received', {
          sessionId,
          pairId,
          role: isOfferer ? 'offerer' : 'answerer',
        });
        void stopVoice({ emitHangup: false }).then(() => onRemoteHangup?.());
      });

      localUnsubscribersRef.current.push(unsubOffer, unsubAnswer, unsubIce, unsubHangup);

      // Negotiation
      if (isOfferer) {
        setStatus('connecting');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        try {
          const ackResp = await gamesSocket.emit('coffee:voice_offer', {
            sessionId,
            pairId,
            sdp: offer.sdp || pc.localDescription?.sdp,
          });
          console.log('[CoffeeVoice][telemetry] offer_emit', {
            sessionId,
            pairId,
            role: 'offerer',
            ack: ackResp ?? null,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          // If partner isn't connected yet, backend caches the offer.
          // We should keep peer alive and wait for the answer later.
          if (msg.includes('PARTNER_NOT_CONNECTED')) {
            console.warn('[useCoffeeVoiceCall] partner not connected yet; waiting for offer answer');
            console.log('[CoffeeVoice][telemetry] offer_emit_partner_offline', {
              sessionId,
              pairId,
              role: 'offerer',
              error: msg,
            });
          } else {
            console.error('[useCoffeeVoiceCall] voice_offer emit failed', e);
            throw e;
          }
        }
      }

      // If we are the answerer and the offer may have already been emitted
      // (e.g. we enabled voice late), request the most recent offer from backend.
      if (!isOfferer) {
        const existingOfferSdp = pendingOfferSdpRef.current;
        if (existingOfferSdp) {
          // Consume the pending offer and immediately create an answer.
          pendingOfferSdpRef.current = null;
          offerReceivedRef.current = true;
          setStatus('connecting');
          await pc.setRemoteDescription({ type: 'offer', sdp: existingOfferSdp });

          if (iceCandidateQueueRef.current.length > 0) {
            const queued = iceCandidateQueueRef.current;
            iceCandidateQueueRef.current = [];
            console.log('[CoffeeVoice][telemetry] ice_flush_after_offer_late', {
              sessionId,
              pairId,
              queuedCount: queued.length,
            });
            await Promise.all(
              queued.map((c) =>
                pc.addIceCandidate(c).catch((e) => {
                  console.warn('[CoffeeVoice][telemetry] ice_flush_add_failed', {
                    sessionId,
                    pairId,
                    error: e instanceof Error ? e.message : String(e),
                  });
                })
              )
            );
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          // Same retry logic as in the offer handler.
          const sdpToSend = answer.sdp || pc.localDescription?.sdp;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              if (peerRef.current !== pc) return; // teardown during retries
              await gamesSocket.emit('coffee:voice_answer', {
                sessionId,
                pairId,
                sdp: sdpToSend,
              });
              break;
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              const canRetry = msg.includes('PARTNER_NOT_CONNECTED') && attempt < 2;
              if (!canRetry) throw e;
              console.warn('[CoffeeVoice][telemetry] answer_emit_retry_partner_offline', {
                sessionId,
                pairId,
                attempt: attempt + 1,
                reason: msg,
              });
              await new Promise((r) => setTimeout(r, 650 * (attempt + 1)));
            }
          }
          console.log('[CoffeeVoice][telemetry] answer_emit', {
            sessionId,
            pairId,
            role: 'answerer',
          });
        } else {
          const requestOffer = async () => {
            if (!gamesSocket?.isConnected) return;
            if (offerReceivedRef.current) return;
            const reqResp = await gamesSocket
              .emit('coffee:voice_request_offer', { sessionId, pairId })
              .catch((err) => {
                // OFFER_NOT_READY is expected sometimes; keep retrying.
                console.warn('[useCoffeeVoiceCall] voice_request_offer failed', err);
                return null;
              });

            console.log('[CoffeeVoice][telemetry] offer_requested', {
              sessionId,
              pairId,
              role: 'answerer',
              response: reqResp ?? null,
            });
          };

          // First request immediately, then retry a few times.
          void requestOffer();
          const timers = [1200, 2600, 4200];
          for (const delay of timers) {
            const id = window.setTimeout(() => {
              if (offerReceivedRef.current) return;
              void requestOffer();
            }, delay);
            offerRequestTimersRef.current.push(id);
          }
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

  // ─── Answerer: prompt the user when a voice offer is waiting ─────────────────
  // If the offerer clicked "Enable voice" before we started voice, the backend
  // caches the offer. We poll for it while idle and show a modal prompt.
  useEffect(() => {
    if (!gamesSocket?.on) return;
    if (isOfferer) return;

    const unsubOffer = gamesSocket.on('coffee:voice_offer', (msg: CoffeeVoiceSdpMessage) => {
      if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
      // If voice already started, let `startVoice`'s internal negotiation listeners handle it.
      if (peerRef.current) return;
      if (pendingOfferSdpRef.current) return;
      if (status !== 'idle') return;

      pendingOfferSdpRef.current = msg.sdp;
      offerReceivedRef.current = true;
      lastPartnerHangupAtRef.current = null;
      console.log('[CoffeeVoice][telemetry] offer_received_cached', {
        sessionId,
        pairId,
        role: 'answerer',
        fromParticipantId: msg.fromParticipantId,
      });
      setShowEnableVoicePrompt(true);
    });

    return unsubOffer;
  }, [gamesSocket, isOfferer, pairId, sessionId, status]);

  // Poll for a cached offer while we are idle (answerer role).
  useEffect(() => {
    if (isOfferer) return;
    if (status !== 'idle') return;
    if (!gamesSocket?.isConnected) return;
    if (pendingOfferSdpRef.current) return;
    if (showEnableVoicePrompt) return;

    // If the partner recently hung up, avoid aggressive polling.
    if (lastPartnerHangupAtRef.current && Date.now() - lastPartnerHangupAtRef.current < 10000) return;

    let cancelled = false;
    const delays = [400, 1200, 2400, 4200];

    const timers = delays.map((delay) =>
      window.setTimeout(() => {
        if (cancelled) return;
        if (pendingOfferSdpRef.current) return;
        if (showEnableVoicePrompt) return;
        void (async () => {
          const reqResp = await gamesSocket
            .emit('coffee:voice_request_offer', { sessionId, pairId })
            .catch(() => null);
          console.log('[CoffeeVoice][telemetry] offer_requested', {
            sessionId,
            pairId,
            role: 'answerer',
            response: reqResp ?? null,
          });
        })();
      }, delay)
    );

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [gamesSocket?.isConnected, isOfferer, pairId, sessionId, status, showEnableVoicePrompt]);

  // ─── Answerer: hide modal when partner hangs up (idle state) ────────────
  useEffect(() => {
    if (!gamesSocket?.on) return;
    if (isOfferer) return;

    const unsubHangup = gamesSocket.on('coffee:voice_hangup', (msg: { sessionId: string; pairId: string }) => {
      if (msg.sessionId !== sessionId || msg.pairId !== pairId) return;
      console.log('[CoffeeVoice][telemetry] hangup_received', {
        sessionId,
        pairId,
        role: isOfferer ? 'offerer' : 'answerer',
      });
      lastPartnerHangupAtRef.current = Date.now();

      pendingOfferSdpRef.current = null;
      offerReceivedRef.current = false;
      setShowEnableVoicePrompt(false);
      // Only clear errors/status if we are still waiting for the offer.
      setError(null);
      setStatus('idle');
    });

    return unsubHangup;
  }, [gamesSocket, isOfferer, pairId, sessionId]);

  return {
    status,
    error,
    remoteStream,
    isMuted,
    micLevel,
    micComfort,
    startVoice,
    stopVoice,
    toggleMute,
    showEnableVoicePrompt,
  };
}

