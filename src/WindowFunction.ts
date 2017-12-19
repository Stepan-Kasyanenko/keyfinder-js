import {Constants, temporal_window_t} from './Constants';

export class WindowFunction {

  window(windowType: temporal_window_t, n: number, N: number): number {
    switch (windowType) {
      case temporal_window_t.WINDOW_BLACKMAN:
        return 0.42 - (0.5 * Math.cos((2 * Math.PI * n) / (N - 1))) + (0.08 * Math.cos((4 * Math.PI * n) / (N - 1)));
      case temporal_window_t.WINDOW_HAMMING:
        return 0.54 - (0.46 * Math.cos((2 * Math.PI * n) / (N - 1)));
    }
  }

  gaussianWindow(n: number, N: number, sigma: number): number {
    return Math.exp(-1 * (Math.pow(n - (N / 2), 2) / (2 * sigma * sigma)));
  }

  convolve(input: number[], window: number[]): number[] {

    const inputSize = input.length;
    const padding = window.length / 2;
    const convolved = Constants.fillArray(inputSize);

// TODO: this implements zero padding for boundary effects, write something mean-based later.
    for (let sample = 0; sample < inputSize; sample++) {
      let convolution = 0.0;
      for (let k = 0; k < window.length; k++) {
        const frm = sample - padding + k;
        if (frm >= 0 && frm < inputSize) {
          // don't run off either end
          convolution += input[frm] * window[k] / window.length;
        }
      }
      convolved[sample] = convolution;
    }
    return convolved;
  }
}
