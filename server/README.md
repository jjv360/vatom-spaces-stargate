# Stargate: Server

This server manages the entire Stargate network. It is responsible for maintaining gate status on the network. Every gate has a unique ID based on where it's located.

This is a Docker image, which can be run with Google Cloud Run.

## Protocol

Connect via WebSocket. All messages are JSON objects.

```js
// Send up after connecting
{
    action: 'connect',
    gate: '123456',                                                         // <-- Gate ID code
    register: true,                                                         // <-- If true and the gate doesn't exist, it will be registerd
}

// Sent down after a successful connection. A 'state' message will be sent after this. If the connection fails, the socket will be closed.
{
    action: 'connected',
}

// Send up to update the gate app-specific metadata. Only the gate itself should send this.
{
    action: 'update',
    permission: 'any' | 'blocked' | 'incoming-only' | 'outgoing-only',      // <-- Define if this gate can be accessed by other gates
    metadata: {...},                                                        // <-- App-specific metadata. Will be merged with existing metadata.
}

// Send up to dial from the current gate to a remote gate
{
    action: 'dial',
    glyph: '1',                                                             // <-- Individual glyph to dial
}

// Send up to shutdown the gate or cancel a dial. Note that it may not always work.
{
    action: 'shutdown',
}

// Sent down when the gate state changes
{
    action: 'state',
    state: 'idle' | 'dialing' | 'chevron-locked' | 'incoming' | 'outgoing',
    activeGlyphs: '1234',                                                   // <-- Dialled glyphs so far
    metadata: {...},
}
```

When dialling a gate:
- Send 'dial' along with an individual glyph. The gate dials once enough glyphs have been locked.
- Gate changes state to 'dialing', and then either 'chevron-locked' if another glyph is needed, 'idle' if the dial failed, or 'outgoing' if successful

## Development

To deploy:

```sh
# Build the image
docker build . -t stargate-network --platform linux/amd64

# Run it
docker run -it -p 8080:8080 stargate-network
```