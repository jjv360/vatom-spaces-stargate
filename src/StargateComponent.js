import { BaseComponent } from "vatom-spaces-plugins"
import { Queue, SharedVars, animateAudioVolume, animateValue, createLoopingAudio } from "./Utils"

/**
 * Logic behind the Stargate.
 */
export class StargateComponent extends BaseComponent {

    /** Operation queue */
    queue = new Queue()

    /** Details of the current gate connection */
    connection = null

    /** Register this component */
    static register(plugin) {

        // Register the component
        plugin.objects.registerComponent(this, {
            id: 'stargate',
            name: 'Stargate',
            hidden: true,
            settings: []
        })

    }

    /** Called on load */
    onLoad() {

        // Loaded
        console.debug(`[Stargate] Loaded stargate component`)

        // Remove chevron glow
        this.plugin.objects.update(this.objectID, {
            emissive_intensity: 0.0001
        }, true)

    }

    /** Called on click */
    onClick() {

        // Show the DHD interface
        this.plugin.menus.displayPopup({
            title: 'Stargate Interface',
            panel: {
                iframeURL: this.plugin.paths.absolute('dhd-interface.html'),
            }
        })

        // Stop if queue is running
        // if (this.queue.isRunning)
        //     return console.debug(`[Stargate] Clicked, but queue is still running`)

        // // Activate the stargate
        // if (this.connection)
        //     this.close()
        // else
        //     this.dial("000000")

    }

    /** Dial an address */
    dial(address) {

        // Do in the queue
        this.queue.do(async () => {

            // Stop if already connected
            if (this.connection?.address == address)    return console.log(`[Stargate] Attempted to dial, but gate is already connected to ${address}`)
            else if (this.connection)                   return console.warn(`[Stargate] Attempted to dial, but gate is already connected to ${this.connection.address}`)

            // Start dialing sequence
            console.debug(`[Stargate] Dialing ${address}`)

            // Create thread to extend the duration of this action ... gate takes a while to connect
            let connectDelayThread = new Promise(resolve => setTimeout(resolve, 5000))

            // Play the activation sound
            await this.plugin.audio.play(this.plugin.paths.absolute('activate.mp3'), {
                x: this.fields.x,
                height: this.fields.height,
                y: this.fields.y,
                radius: 50,
                volume: 1,
            })

            // Create audio for the gate loop ... the ambient sound while the gate is active
            let audioLoopID = await createLoopingAudio(this.plugin.paths.absolute('puddle_loop.mp3'), 0, {
                name: '[Stargate] Audio Loop',
                parent: this.objectID,
            })

            // Create a thread to animate the audio volume slowly
            let audioLoopRaiseThread = animateAudioVolume(audioLoopID, 0, 1, 2000, 500)

            // Make the chevrons glow
            let glowTween = animateValue(0.0001, 30, 500, 0, val => {
                this.plugin.objects.update(this.objectID, {
                    emissive_intensity: val
                }, true)
            })

            // Create the event horizon
            await new Promise(c => setTimeout(c, 1000))
            let eventHorizonID = await this.plugin.objects.create({

                // Object info
                type: 'circle',
                parent: this.objectID,
                name: '[Stargate] Event Horizon',
                clientOnly: true,

                // Transform
                height: 3.5,
                scale: 7,
                rotation_z: Math.PI / 2,

                // Appearance
                doublesided: true,
                shading: 'custom',
                fragment_shader: EventHorizonShader,
                fragment_shader_shadertoy: true,

            })

            // Wait for all threads to finish
            await Promise.all([connectDelayThread, audioLoopRaiseThread, glowTween])

            // Connected!
            this.connection = {
                address,
                direction: 'out',
                audioLoopID,
                eventHorizonID,
            }

        })

    }

    /** Close the gate */
    close() {

        // Add to queue
        this.queue.do(async () => {

            // Stop if not connected
            if (!this.connection)
                return console.warn(`[Stargate] Attempted to close, but gate is already closed`)

            // Close the gate
            console.debug(`[Stargate] Closing gate to ${this.connection.address}`)

            // Play the shutdown sound
            await this.plugin.audio.play(this.plugin.paths.absolute('shutdown.mp3'), {
                x: this.fields.x,
                height: this.fields.height,
                y: this.fields.y,
                radius: 50,
                volume: 1,
            })

            // Create a thread to animate the audio volume slowly
            let audioLoopLowerThread = animateAudioVolume(this.connection.audioLoopID, 1, 0, 2000, 500)

            // Remove chevron glow
            let glowTween = animateValue(30, 0.0001, 500, 0, val => {
                this.plugin.objects.update(this.objectID, {
                    emissive_intensity: val
                }, true)
            })

            // Wait for all threads to finish
            await Promise.all([audioLoopLowerThread, glowTween])

            // Cleanup
            this.plugin.objects.remove(this.connection.audioLoopID)
            this.plugin.objects.remove(this.connection.eventHorizonID)
            this.connection = null

        })

    }

}

/** Stargate event horizon shader ... adapted from https://www.shadertoy.com/view/wlc3zr */
const EventHorizonShader = `

// CC0 license https://creativecommons.org/share-your-work/public-domain/cc0/

//////////////////// 3D OpenSimplex2S noise with derivatives  ////////////////////
//////////////////// Output: vec4(dF/dx, dF/dy, dF/dz, value) ////////////////////

// Permutation polynomial hash credit Stefan Gustavson
vec4 permute(vec4 t) {
    return t * (t * 34.0 + 133.0);
}

// Gradient set is a normalized expanded rhombic dodecahedron
vec3 grad(float hash) {
    
    // Random vertex of a cube, +/- 1 each
    vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
    
    // Random edge of the three edges connected to that vertex
    // Also a cuboctahedral vertex
    // And corresponds to the face of its dual, the rhombic dodecahedron
    vec3 cuboct = cube;
    cuboct[int(hash / 16.0)] = 0.0;
    
    // In a funky way, pick one of the four points on the rhombic face
    float type = mod(floor(hash / 8.0), 2.0);
    vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
    
    // Expand it so that the new edges are the same length
    // as the existing ones
    vec3 grad = cuboct * 1.22474487139 + rhomb;
    
    // To make all gradients the same length, we only need to shorten the
    // second type of vector. We also put in the whole noise scale constant.
    // The compiler should reduce it into the existing floats. I think.
    grad *= (1.0 - 0.042942436724648037 * type) * 3.5946317686139184;
    
    return grad;
}

// BCC lattice split up into 2 cube lattices
vec4 os2NoiseWithDerivativesPart(vec3 X) {
    vec3 b = floor(X);
    vec4 i4 = vec4(X - b, 2.5);
    
    // Pick between each pair of oppposite corners in the cube.
    vec3 v1 = b + floor(dot(i4, vec4(.25)));
    vec3 v2 = b + vec3(1, 0, 0) + vec3(-1, 1, 1) * floor(dot(i4, vec4(-.25, .25, .25, .35)));
    vec3 v3 = b + vec3(0, 1, 0) + vec3(1, -1, 1) * floor(dot(i4, vec4(.25, -.25, .25, .35)));
    vec3 v4 = b + vec3(0, 0, 1) + vec3(1, 1, -1) * floor(dot(i4, vec4(.25, .25, -.25, .35)));
    
    // Gradient hashes for the four vertices in this half-lattice.
    vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
    hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
    hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
    
    // Gradient extrapolations & kernel function
    vec3 d1 = X - v1; vec3 d2 = X - v2; vec3 d3 = X - v3; vec3 d4 = X - v4;
    vec4 a = max(0.75 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
    vec4 aa = a * a; vec4 aaaa = aa * aa;
    vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
    vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
    vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
    
    // Derivatives of the noise
    vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (aa * a * extrapolations)
        + mat4x3(g1, g2, g3, g4) * aaaa;
    
    // Return it all as a vec4
    return vec4(derivative, dot(aaaa, extrapolations));
}

// Rotates domain, but preserve shape. Hides grid better in cardinal slices.
// Good for texturing 3D objects with lots of flat parts along cardinal planes.
vec4 os2NoiseWithDerivatives_Fallback(vec3 X) {
    X = dot(X, vec3(2.0/3.0)) - X;
    
    vec4 result = os2NoiseWithDerivativesPart(X) + os2NoiseWithDerivativesPart(X + 144.5);
    
    return vec4(dot(result.xyz, vec3(2.0/3.0)) - result.xyz, result.w);
}

// Gives X and Y a triangular alignment, and lets Z move up the main diagonal.
// Might be good for terrain, or a time varying X/Y plane. Z repeats.
vec4 os2NoiseWithDerivatives_ImproveXY(vec3 X) {
    
    // Not a skew transform.
    mat3 orthonormalMap = mat3(
        0.788675134594813, -0.211324865405187, -0.577350269189626,
        -0.211324865405187, 0.788675134594813, -0.577350269189626,
        0.577350269189626, 0.577350269189626, 0.577350269189626);
    
    X = orthonormalMap * X;
    vec4 result = os2NoiseWithDerivativesPart(X) + os2NoiseWithDerivativesPart(X + 144.5);
    
    return vec4(result.xyz * orthonormalMap, result.w);
}

//////////////////////////////// End noise code ////////////////////////////////


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    // Normalized pixel coordinates (from 0 to 1 on largest axis)
    vec2 uvOriginal = fragCoord / iResolution.xy;
    vec2 uv = uvOriginal * 16.0;
    
    // Initial input point
    vec3 X = vec3(uv, mod(iTime, 578.0) * 0.8660254037844386);
    
    // Evaluate noise once
    vec4 noiseResult = os2NoiseWithDerivatives_ImproveXY(X);
    
    // Evaluate noise again with the derivative warping the domain
    // Might be able to approximate this by fitting to a curve instead
    noiseResult = os2NoiseWithDerivatives_ImproveXY(X - noiseResult.xyz / 16.0);
    float value = noiseResult.w;
    
    /* You can sort of imitate the effect by fitting a curve instead of calling noise again.
    Not quite as good, and not sure of speed differences.
    Could probably experiment with non-trig curves too.
    float p = asin(noiseResult.w);
    float derivMag = length(noiseResult.xyz);
    float sinScale = derivMag / cos(p);
    float value = sin(p - sinScale * derivMag / 20.0);*/

    // Time varying pixel color
    vec3 col = vec3(.431, .8, 1.0) * (0.5 + 0.5 * value);

    // Output to screen
    fragColor = vec4(col, 1.0);

    // Add glow in the center
    float distanceFromCenter = 1.0 - (length(uvOriginal - 0.5) * 2.0);
    fragColor.rgb *= 5.0 * distanceFromCenter;

}

`