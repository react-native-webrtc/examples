import { useRef, useState } from "react"
import IncomingView from "src/IncomingView"
import JoinView from "src/JoinView"
import MeetingView from "src/MeetingView"
import OutgoingView from "src/OutgoingView"
import { useWebRTC } from "src/useWebRTC"

const App = () => {
  const localClientId = useRef(Math.floor(100000 + Math.random() * 900000).toString())
  const [remoteClientId, setRemoteClientId] = useState("")
  const {
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
  } = useWebRTC(localClientId.current, setRemoteClientId)

  return callState === "idle" ? (
    <JoinView
      localClientId={localClientId.current}
      onCall={(remoteClientIdArg) => {
        setRemoteClientId(remoteClientIdArg)
        makeCall(remoteClientIdArg)
      }}
    />
  ) : callState === "incoming" ? (
    <IncomingView remoteClientId={remoteClientId} onAnswer={acceptCall} />
  ) : callState === "outgoing" ? (
    <OutgoingView remoteClientId={remoteClientId} onCancel={() => null} />
  ) : callState === "connected" ? (
    <MeetingView
      localStream={localStream.current}
      remoteStream={remoteStream.current}
      onLeave={endCall}
      isCameraOn={isCameraEnabled}
      isMuted={!isMicEnabled}
      onSwitchCamera={toggleCameraMode}
      onToggleCamera={toggleCamera}
      onToggleMic={toggleMute}
      isFrontCamera={isFrontCamera}
    />
  ) : null
}
export default App
