import CallAnswer from "assets/svgs/CallAnswer"
import { FC } from "react"
import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native"

type Props = {
  style?: StyleProp<ViewStyle>
  remoteClientId: string
  onAnswer: () => void
}

const IncomingView: FC<Props> = ({ remoteClientId, onAnswer }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-around",
        backgroundColor: "#050A0E",
      }}
    >
      <View
        style={{
          padding: 35,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 14,
        }}
      >
        <Text
          style={{
            fontSize: 36,
            marginTop: 12,
            color: "#ffff",
          }}
        >
          {remoteClientId} is calling..
        </Text>
      </View>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onAnswer()
          }}
          style={{
            backgroundColor: "green",
            borderRadius: 30,
            height: 60,
            aspectRatio: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CallAnswer height={28} fill={"#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
export default IncomingView
