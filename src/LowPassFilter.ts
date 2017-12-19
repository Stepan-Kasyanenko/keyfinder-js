import {AudioData} from './AudioData';
import {Workspace} from './Workspace';
import {Constants, temporal_window_t} from './Constants';
import {WindowFunction} from './WindowFunction';
import {InverseFftAdapter} from './FftAdapter';

export class LowPassFilter {
  private priv: LowPassFilterPrivate;

  constructor(order: number, frameRate: number, cornerFrequency: number, fftFrameSize: number) {
    this.priv = new LowPassFilterPrivate(order, frameRate, cornerFrequency, fftFrameSize);
  }

  filter(audio: AudioData, workspace: Workspace, shortcutFactor: number): void {
    this.priv.filter(audio, workspace, shortcutFactor);
  }

  getCoefficients(): number[] {
    return this.priv.coefficients;
  }

}

class LowPassFilterPrivate {
  order: number;
  delay: number;         // always order / 2
  impulseLength: number; // always order + 1
  gain: number;
  coefficients: number[];

  constructor(inOrder: number, frameRate: number, cornerFrequency: number, fftFrameSize: number) {
    if (inOrder % 2 !== 0) {
      throw new Error('LPF order must be an even number');
    }
    if (inOrder > fftFrameSize / 4) {
      throw new Error('LPF order must be <= FFT frame size / 4');
    }
    this.order = inOrder;
    this.delay = this.order / 2;
    this.impulseLength = this.order + 1;
    const cutoffPoint = cornerFrequency / frameRate;
    const ifft: InverseFftAdapter = new InverseFftAdapter(fftFrameSize);

    // Build frequency domain response
    const tau = 0.5 / cutoffPoint;
    for (let i = 0; i < fftFrameSize / 2; i++) {
      let input = 0.0;
      if (i / fftFrameSize <= cutoffPoint) {
        input = tau;
      }
      ifft.setInput(i, input, 0.0);
      ifft.setInput(fftFrameSize - i - 1, input, 0.0);
    }

    // inverse FFT to determine time-domain response
    ifft.execute();


    this.coefficients = Constants.fillArray(this.impulseLength);
    const centre = this.order / 2;
    this.gain = 0.0;
    const win: WindowFunction = new WindowFunction();

    for (let i = 0; i < this.impulseLength; i++) {
      // Grabbing the very end and the very beginning of the real FFT output?
      const index = (fftFrameSize - centre + i) % fftFrameSize;
      let coeff = ifft.getOutput(index);
      coeff *= win.window(temporal_window_t.WINDOW_HAMMING, i, this.impulseLength);
      this.coefficients[i] = coeff;
      this.gain += coeff;
    }

    ifft.destroy();
  }

  filter(audio: AudioData, workspace: Workspace, shortcutFactor: number): void {

    if (audio.getChannels() > 1) {
      throw new Error('Monophonic audio only');
    }

    let buffer: number[] = workspace.lpfBuffer;

    if (buffer === null) {
      workspace.lpfBuffer = Constants.fillArray(this.impulseLength);
      buffer = workspace.lpfBuffer;
    } else {
      // clear delay buffer
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = 0;
      }
    }

    let bufferFront = 0;
    let bufferBack: number;
    let bufferTemp: number;

    const sampleCount = audio.getSampleCount();
    audio.resetIterators();

    let sum = 0;
// for each frame (running off the end of the sample stream by delay)
    for (let inSample = 0; inSample < sampleCount + this.delay; inSample++) {
      // shuffle old samples along delay buffer
      bufferBack = bufferFront;
      bufferFront++;
      if (bufferFront === buffer.length) {
        bufferFront = 0;
      }

      // load new sample into back of delay buffer
      if (audio.readIteratorWithinUpperBound()) {
        buffer[bufferBack] = audio.getSampleAtReadIterator() / this.gain;
        audio.advanceReadIterator();
      } else {
        buffer[bufferBack] = 0.0; // zero pad once we're past the end of the file
      }
      // start doing the maths once the delay has passed
      const outSample = inSample - this.delay;
      if (outSample < 0) {
        continue;
      }
      // if shortcut != 1, only do the maths for the useful samples (this is mathematically dodgy, but it's faster and it usually works)
      if (outSample % shortcutFactor > 0) {
        continue;
      }
      sum = 0.0;
      bufferTemp = bufferFront;
      let coefficientIterator = 0;
      while (coefficientIterator < this.coefficients.length) {
        sum += this.coefficients[coefficientIterator] * buffer[bufferTemp];
        coefficientIterator++;
        bufferTemp++;
        if (bufferTemp === buffer.length) {
          bufferTemp = 0;
        }
      }
      audio.setSampleAtWriteIterator(sum);
      audio.advanceWriteIterator(shortcutFactor);
    }
  }
}
