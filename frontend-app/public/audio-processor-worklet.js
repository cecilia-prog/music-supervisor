/**
 * @typedef {Object} AudioProcessorMessage
 * @property {number} level - RMS audio level (0-1)
 * @property {ArrayBuffer} audioBytes - Raw audio data buffer
 */

/**
 * Audio worklet processor for real-time audio capture and conversion
 * Converts 32-bit float audio to 16-bit signed integers as per ElevenLabs specs.
 * Calculates RMS level of the audio signal.
 * Processes audio in 128-frame blocks as per WebAudio specification
 *
 *
 */

// @ts-nocheck
class AudioProcessor extends AudioWorkletProcessor {
  /** @type {number} - Standard WebAudio worklet block size */
  static BUFFER_SIZE = 128;
  /** @type {number} - Number of buffers to accumulate before sending */
  static N_BUFFERS = 4;
  /** @type {number} - Bytes per audio frame (mono signed 16-bit as per ElevenLabs specs) */
  static BYTES_PER_FRAME = 2;

  constructor() {
    super();

    /** @type {Int16Array} - Circular buffer for audio samples */
    this.ringBuffer = new Int16Array(AudioProcessor.BUFFER_SIZE * AudioProcessor.N_BUFFERS);
    /** @type {number} - Current write position in ring buffer */
    this.index = 0;
    /** @type {number} - Track messages sent for debugging */
    this.messagesSent = 0;
    
    console.debug('[AudioProcessor Worklet] Constructor initialized');
  }

  process(inputs, _outputs, _params) {
    const input = inputs[0]; // mono only
    if (input.length === 0) return true;

    const inputData = input[0];

    let sumSquares = 0;

    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      this.ringBuffer[this.index] = s < 0 ? s * 0x8000 : s * 0x7fff;
      this.index++;

      sumSquares += s * s;

      if (this.index >= this.ringBuffer.length) {
        const rms = Math.sqrt(sumSquares / this.ringBuffer.length);

        // Log first few messages to verify worklet is processing (debug only)
        if (this.messagesSent < 3) {
          console.debug('[AudioProcessor Worklet] Message #' + this.messagesSent + 
                      ', RMS: ' + rms.toFixed(4));
        }

        // pass in the bytes buffer
        this.port.postMessage({
          level: rms,
          audioBytes: this.ringBuffer.buffer,
        });
        
        this.messagesSent++;
        this.index = 0;
      }
    }
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
