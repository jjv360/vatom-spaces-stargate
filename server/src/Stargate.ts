/**
 * Represents a stargate on the network.
 */
export class Stargate {

    /** Stargate ID */
    id = ''

    /** Current state */
    state : 'idle' | 'dialing' | 'chevron-locked' | 'incoming' | 'outgoing' = 'idle'

    /** Date of the last state change */
    stateLastModified = Date.now()

    /** App-specific metadata */
    metadata : any = {}

    /** Currently active glyphs */
    activeGlyphs = ''

}