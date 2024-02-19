import { createServer } from 'node:http'
import { Server } from 'socket.io'

export type SignalingMessage = { type: string; payload: any }
type FullSignalingMessage = {
  remoteClientId: string
  message: SignalingMessage
}

const server = createServer()
const io = new Server(server)

io.on('connection', socket => {
  const { localClientId } = socket.handshake.query
  console.log('client connected', localClientId)
  if (!localClientId) {
    socket.disconnect()
    console.warn('client disconnected due to invalid query params')
    return
  }
  // join a room with the client id so that other clients can find it
  socket.join(localClientId as string)
  socket.on('connectTo', (remoteClientId: string) => {
    console.log(`${localClientId} wants to connect to ${remoteClientId}`)
    // check if room exists
    if (!io.sockets.adapter.rooms.has(remoteClientId)) {
      console.warn('remote client not found while connecting')
      return
    }
    // send event to remote client
    io.to(remoteClientId).emit('connectTo', localClientId)
  })
  socket.on('disconnectFrom', (remoteClientId: string) => {
    console.log(`${localClientId} wants to disconnect from ${remoteClientId}`)
    // check if room exists
    if (!io.sockets.adapter.rooms.has(remoteClientId)) {
      console.warn('remote client not found while disconnecting')
      return
    }
    // send event to remote client
    io.to(remoteClientId).emit('disconnectFrom', localClientId)
  })
  socket.on('message', (message: FullSignalingMessage) => {
    const remoteClientId = message.remoteClientId
    console.log(
      `message from ${localClientId} to ${remoteClientId} | type: ${message.message.type}`
    )
    // check if room exists
    if (!io.sockets.adapter.rooms.has(remoteClientId)) {
      console.warn('remote client not found while sending message')
      return
    }
    // send message to remote client
    io.to(remoteClientId).emit('message', message.message)
  })
})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000')
})
