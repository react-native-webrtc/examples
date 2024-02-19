[<img src="https://avatars.githubusercontent.com/u/42463376" alt="React Native WebRTC Examples" style="height: 6em;" />](https://github.com/react-native-webrtc/examples)

# React Native Expo App

This is a demo app of using WebRTC with React Native. It's built with Expo and uses a [custom development build](https://docs.expo.dev/develop/development-builds/introduction/).

## How to build

The easy way to build this app is to use Expo's build service (EAS). Although you can [build it locally](https://docs.expo.dev/build-reference/local-builds/) if you prefer.

Before you can build the app you need a few things:

1. An Expo account
2. Create a new project on EAS
3. Update `extra.eas.projectId` in `client/app.json` with your project ID

After you linked your project to EAS, you can run `yarn build:dev` on the `client` directory to start a dev build.

This will generate a custom Expo client that contains `react-native-webrtc` and other packages that are not available on the Expo Go app.

Take a look at `client/package.json` to see other build scripts.

## How to run

1. Clone this repo
2. Run `yarn install` on both `client` and `server` directories (in separate terminals)
3. Update `EXPO_PUBLIC_SIGNALING_SERVER_URL` in `client/.env` with your signaling server URL (this can be your computer's IP address)
4. Run `yarn start` on both `client` and `server` directories
5. Install the custom dev client on your mobile devices
6. Make sure the server and both devices are on the same network
7. Open the app on two devices and start a video call

## How it works

For the client, there are three files that you want to take a look at (the rest can be ignored):

1. `client/App.tsx` - This is the main entry point of the app. It contains the UI and links everything together.
2. `client/src/signaling.ts` - This contains a class that lets you create [signaling channels](https://webrtc.org/getting-started/peer-connections#signaling).
3. `client/src/useWebRTC.ts` - This is the most interesting file. It contains all the logic for creating and managing WebRTC connections.

The server is only used for signling. It's a simple [Socket.IO](https://socket.io/) server that relays messages between clients.