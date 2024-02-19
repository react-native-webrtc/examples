import TextInputContainer from "./TextInputContainer"
import { FC, useState } from "react"
import { Keyboard, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"

type Props = {
  localClientId: string
  onCall: (remoteClientId: string) => void
}

const JoinView: FC<Props> = ({ localClientId, onCall }) => {
  const [otherUserId, setOtherUserId] = useState("")

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050A0E",
        justifyContent: "center",
        paddingHorizontal: 42,
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <>
          <View
            style={{
              padding: 35,
              backgroundColor: "#1A1C22",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#D0D4DD",
              }}
            >
              Your Caller ID
            </Text>
            <View
              style={{
                flexDirection: "row",
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  color: "#ffff",
                  letterSpacing: 6,
                }}
              >
                {localClientId}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#1A1C22",
              padding: 40,
              marginTop: 25,
              justifyContent: "center",
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#D0D4DD",
                textAlign: "center",
              }}
            >
              Enter the other user's ID
            </Text>
            <TextInputContainer
              placeholder={"Enter Caller ID"}
              value={otherUserId}
              setValue={setOtherUserId}
              keyboardType={"number-pad"}
            />
            <TouchableOpacity
              onPress={() => {
                onCall(otherUserId)
              }}
              style={{
                height: 50,
                backgroundColor: "#5568FE",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 12,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                Call Now
              </Text>
            </TouchableOpacity>
          </View>
        </>
      </TouchableWithoutFeedback>
    </View>
  )
}
export default JoinView
