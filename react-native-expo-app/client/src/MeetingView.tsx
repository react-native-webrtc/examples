import CallEnd from "assets/svgs/CallEnd"
import CameraSwitch from "assets/svgs/CameraSwitch"
import MicOff from "assets/svgs/MicOff"
import MicOn from "assets/svgs/MicOn"
import VideoOff from "assets/svgs/VideoOff"
import VideoOn from "assets/svgs/VideoOn"
import IconContainer from "./IconContainer"
import { FC } from "react"
import { View } from "react-native"
import { MediaStream, RTCView } from "react-native-webrtc"

type Props = {
  localStream?: MediaStream
  remoteStream?: MediaStream
  onLeave?: () => void
  onToggleMic?: () => void
  onToggleCamera?: () => void
  onSwitchCamera?: () => void
  isMuted?: boolean
  isCameraOn?: boolean
  isFrontCamera?: boolean
}

const MeetingView: FC<Props> = ({
  localStream,
  remoteStream,
  onLeave,
  onToggleCamera,
  onSwitchCamera,
  onToggleMic,
  isCameraOn,
  isMuted,
  isFrontCamera,
}) => {

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050A0E",
      }}
    >
      <View
        style={{
          flex: 1,
        }}
      >
        {remoteStream ? (
          <RTCView
            objectFit={"cover"}
            style={{
              flex: 1,
              backgroundColor: "#050A0E",
              marginTop: 8,
            }}
            streamURL={remoteStream.toURL()}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: "#222" }} />
        )}
      </View>
      <View style={{
        position: "absolute",
        bottom: 84,
        right: 0,
        width: 120,
        height: 160,
      }}>
        {localStream ? (
          <RTCView
            objectFit={"cover"}
            style={{ flex: 1, backgroundColor: "#050A0E" }}
            streamURL={localStream.toURL()}
            mirror={isFrontCamera}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: "#222" }} />
        )}
      </View>
      <View
        style={{
          marginVertical: 12,
          flexDirection: "row",
          justifyContent: "space-evenly",
        }}
      >
        <IconContainer
          style={{}}
          backgroundColor={"red"}
          onPress={() => {
            onLeave?.()
          }}
          Icon={() => {
            return <CallEnd height={26} width={26} fill="#FFF" />
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={isMuted ? "#fff" : "transparent"}
          onPress={() => {
            onToggleMic?.()
          }}
          Icon={() => {
            return isMuted ? (
              <MicOff height={28} width={28} fill="#1D2939" />
            ) : (
              <MicOn height={24} width={24} fill="#FFF" />
            )
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={!isCameraOn ? "#fff" : "transparent"}
          onPress={() => {
            onToggleCamera?.()
          }}
          Icon={() => {
            return isCameraOn ? (
              <VideoOn height={24} width={24} fill="#FFF" />
            ) : (
              <VideoOff height={36} width={36} fill="#1D2939" />
            )
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: "#2B3034",
          }}
          backgroundColor={"transparent"}
          onPress={() => {
            onSwitchCamera?.()
          }}
          Icon={() => {
            return <CameraSwitch height={24} width={24} fill="#FFF" />
          }}
        />
      </View>
    </View>
  )
}
export default MeetingView
