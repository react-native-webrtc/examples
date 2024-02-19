import { EventEmitter } from "events"
import { io, Socket } from "socket.io-client"

export type SignalingMessage = { type: string; payload: any }

/**
 * Serves as a bridge between two clients to pass messages
 *
 * **Note**: Messages are first sent to the server and then forwarded to the desired client
 */
export class SignalingChannel extends EventEmitter {
  private socket: Socket
  private _remoteClientId: string | null = null
  get remoteClientId() {
    return this._remoteClientId
  }

  /**
   *
   * @param localClientId id of the current client
   */
  constructor(private localClientId: string) {
    super()
    if (!process.env.EXPO_PUBLIC_SIGNALING_SERVER_URL) {
      throw new Error("EXPO_PUBLIC_SIGNALING_SERVER_URL is not defined")
    }
    this.socket = io(process.env.EXPO_PUBLIC_SIGNALING_SERVER_URL, {
      transports: ["websocket"],
      query: {
        localClientId,
      },
    })
    this.socket.on("message", (message: SignalingMessage) => {
      this.emit("message", message)
    })
    this.socket.on("connectTo", (remoteClientId: string) => {
      this._remoteClientId = remoteClientId
      console.log(`${this.localClientId} accepted connectTo ${remoteClientId}`)
    })
    this.socket.on("disconnectFrom", (remoteClientId: string) => {
      if (this._remoteClientId !== remoteClientId) {
        throw new Error("Remote client id did not match while disconnecting")
      }
      this._remoteClientId = null
      this.emit("disconnected")
      console.log(`${this.localClientId} accepted disconnect`)
    })
  }

  /**
   * Connect to the remote client by sending the current client id to the remote client
   * This will let the other client know which client it's connecting to
   * @param remoteClientId id of the remote client
   */
  connect(remoteClientId: string) {
    this._remoteClientId = remoteClientId
    console.log(`${this.localClientId} want to connectTo ${remoteClientId}`)
    this.socket.emit("connectTo", remoteClientId)
  }

  /**
   * Disconnect from the remote client
   */
  disconnect() {
    this.socket.emit("disconnectFrom", this._remoteClientId)
    this._remoteClientId = null
    console.log(`${this.localClientId} want to disconnect`)
  }

  /**
   * Send message to the remote client
   * @param message message to send
   */
  send(message: SignalingMessage) {
    if (!this._remoteClientId) {
      throw new Error(`Attempted to send message without remote client id | type: ${message.type}`)
    }
    this.socket.emit(
      "message",
      {
        remoteClientId: this._remoteClientId,
        message,
      },
      (ack: any) => {
        console.log(`ack`, ack)
      }
    )
  }

  /**
   * Close the connection
   */
  close() {
    this.socket.close()
  }
}
