import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc"
import RTCIceCandidateEvent from "react-native-webrtc/lib/typescript/RTCIceCandidateEvent"
import RTCTrackEvent from "react-native-webrtc/lib/typescript/RTCTrackEvent"
import { SignalingChannel, SignalingMessage } from "./signaling"

export const useWebRTC = (
  localClientId: string,
  onIncomingCall?: (remoteClientId: string) => void
) => {
  //* state and config ----------------------------------------------------------------------------
  const [callState, setCallState] = useState<"idle" | "outgoing" | "incoming" | "connected">("idle")
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [pendingOffer, setPendingOffer] = useState<RTCSessionDescription>()
  const remoteCandidates = useRef<RTCIceCandidate[]>([])
  const signalingChannel = useMemo(() => new SignalingChannel(localClientId), [localClientId])
  const localStream = useRef<MediaStream>()
  const remoteStream = useRef<MediaStream>(new MediaStream())
  const mediaConstraints = useMemo(
    () => ({
      audio: true,
      video: {
        width: 1080,
        height: 1920,
        frameRate: 60,
      },
    }),
    []
  )
  const iceServers = useMemo(
    () => [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    []
  )
  const [peerConnection, setPeerConnection] = useState(
    new RTCPeerConnection({
      iceServers,
    })
  )
  //* reinitialize --------------------------------------------------------------------------------
  /**
   * Reset everything to the initial state
   *
   * Should be called after the call ends
   */
  const reset = useCallback(() => {
    peerConnection.close()
    localStream.current?.getTracks().forEach((track) => {
      track.stop()
    })
    remoteStream.current.getTracks().forEach((track) => {
      track.stop()
    })
    localStream.current = new MediaStream()
    remoteStream.current = new MediaStream()
    setPeerConnection(
      new RTCPeerConnection({
        iceServers,
      })
    )
    setCallState("idle")
    setPendingOffer(undefined)
    remoteCandidates.current = []
  }, [iceServers, peerConnection])
  //* set up local stream -------------------------------------------------------------------------
  useEffect(() => {
    ;(async () => {
      const stream = await mediaDevices.getUserMedia(mediaConstraints)
      stream?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })
      localStream.current = stream
    })()
  }, [mediaConstraints, peerConnection])
  //* make call -----------------------------------------------------------------------------------
  const makeCall = useCallback(
    async (otherUserIdArg: string) => {
      // connect to the remote client through the signaling server
      signalingChannel?.connect(otherUserIdArg)
      // create offer and send it to the other client
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await peerConnection.setLocalDescription(offer)
      signalingChannel?.send({ type: "offer", payload: offer })
      setCallState("outgoing")
    },
    [peerConnection, signalingChannel]
  )
  //* listen for incoming calls -------------------------------------------------------------------
  useEffect(() => {
    const offerEventListener = async (message: SignalingMessage) => {
      if (message.type === "offer") {
        setPendingOffer(message.payload)
        onIncomingCall?.(signalingChannel.remoteClientId ?? "")
        setCallState("incoming")
      }
    }
    signalingChannel?.on("message", offerEventListener)
    return () => {
      signalingChannel?.off("message", offerEventListener)
    }
  }, [onIncomingCall, signalingChannel])
  //* accept call ---------------------------------------------------------------------------------
  const acceptCall = useCallback(async () => {
    if (!pendingOffer) {
      throw new Error("Attempted to accept call without pending offer")
    }
    // set remote description and send answer
    await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingOffer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    signalingChannel?.send({ type: "answer", payload: answer })
    // add remote candidates that arrived before the remote description was set
    remoteCandidates.current.forEach((candidate) => {
      peerConnection.addIceCandidate(candidate)
    })
  }, [peerConnection, pendingOffer, signalingChannel])
  //* listen for answer to call -------------------------------------------------------------------
  useEffect(() => {
    const answerEventListener = async (message: SignalingMessage) => {
      if (message.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload))
      }
    }
    signalingChannel?.on("message", answerEventListener)
    return () => {
      signalingChannel?.off("message", answerEventListener)
    }
  }, [peerConnection, signalingChannel])
  //* listen for ICE candidates -------------------------------------------------------------------
  useEffect(() => {
    // send ice candidates to the other peer
    const iceCandidateEventListener = (event: RTCIceCandidateEvent<"icecandidate">) => {
      if (event.candidate) {
        signalingChannel?.send({ type: "new-ice-candidate", payload: event.candidate })
      }
    }
    peerConnection.addEventListener("icecandidate", iceCandidateEventListener)
    // receive ice candidates from the other peer
    const newCandidateEventListener = (message: SignalingMessage) => {
      if (message.type === "new-ice-candidate") {
        const iceCandidate = new RTCIceCandidate(message.payload)
        // some candidates might arrive before the remote description is set
        // (we'll add them after the remote description is set)
        if (peerConnection.remoteDescription == null) {
          remoteCandidates.current.push(iceCandidate)
        } else {
          peerConnection.addIceCandidate(iceCandidate)
        }
      }
    }
    signalingChannel.on("message", newCandidateEventListener)
    return () => {
      peerConnection.removeEventListener("icecandidate", iceCandidateEventListener)
      signalingChannel?.off("message", newCandidateEventListener)
    }
  }, [localClientId, peerConnection, signalingChannel])
  //* set up remote stream ------------------------------------------------------------------------
  useEffect(() => {
    const trackEventListener = (event: RTCTrackEvent<"track">) => {
      if (event.track) remoteStream.current.addTrack(event.track)
    }
    peerConnection.addEventListener("track", trackEventListener)
    return () => {
      peerConnection.removeEventListener("track", trackEventListener)
    }
  }, [localClientId, peerConnection])
  //* update call state ---------------------------------------------------------------------------
  useEffect(() => {
    const connectionStateChangeListener = () => {
      switch (peerConnection.connectionState) {
        case "connected":
          setCallState("connected")
          break
        case "closed":
          console.log(`${localClientId} closed connection`)
          break

        default:
          break
      }
    }
    peerConnection.addEventListener("connectionstatechange", connectionStateChangeListener)
    return () => {
      peerConnection.removeEventListener("connectionstatechange", connectionStateChangeListener)
    }
  }, [localClientId, peerConnection])
  //* end call ------------------------------------------------------------------------------------
  const endCall = useCallback(async () => {
    // tell the remote client to disconnect
    signalingChannel?.disconnect()
    reset()
  }, [reset, signalingChannel])
  //* listen for remote disconnection -------------------------------------------------------------
  useEffect(() => {
    const disconnectEventListener = () => {
      reset()
    }
    signalingChannel?.on("disconnected", disconnectEventListener)
    return () => {
      signalingChannel?.off("disconnected", disconnectEventListener)
    }
  }, [reset, signalingChannel])
  //* controls ------------------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    setIsMicEnabled((prev) => !prev)
  }, [])
  const toggleCamera = useCallback(() => {
    setIsCameraEnabled((prev) => !prev)
  }, [])
  const toggleCameraMode = useCallback(() => {
    localStream.current?.getVideoTracks()[0]?._switchCamera()
    setIsFrontCamera((prev) => !prev)
  }, [])
  useEffect(() => {
    localStream.current?.getAudioTracks().forEach((track) => {
      track.enabled = isMicEnabled
    })
  }, [isMicEnabled])
  useEffect(() => {
    localStream.current?.getVideoTracks().forEach((track) => {
      track.enabled = isCameraEnabled
    })
  }, [isCameraEnabled])
  //* debug logs ----------------------------------------------------------------------------------
  useEffect(() => {
    if (signalingChannel) {
      signalingChannel.on("message", (message: SignalingMessage) => {
        console.log(`currentUserId: ${localClientId}, received message`, message.type)
      })
    }
    peerConnection.addEventListener("connectionstatechange", () => {
      console.log(
        `currentUserId: ${localClientId}, connection state: ${peerConnection.connectionState}`
      )
    })
  }, [localClientId, peerConnection, signalingChannel])

  return {
    callState,
    localStream,
    remoteStream,
    makeCall,
    acceptCall,
    endCall,
    isMicEnabled,
    isCameraEnabled,
    isFrontCamera,
    toggleMute,
    toggleCamera,
    toggleCameraMode,
  }
}
