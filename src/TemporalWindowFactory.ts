import {Constants, temporal_window_t} from './Constants';
import {WindowFunction} from './WindowFunction';

export class TemporalWindowFactory {
  private temporalWindows: TemporalWindowWrapper[] = [];

  getTemporalWindow(frameSize: number): number[] {
    for (let i = 0; i < this.temporalWindows.length; i++) {
      const wrapper: TemporalWindowWrapper = this.temporalWindows[i];
      if (wrapper.getFrameSize() === frameSize) {
        return wrapper.getTemporalWindow();
      }
    }
    this.temporalWindows.push(new TemporalWindowWrapper(frameSize));
    const newTemporalWindowIndex = this.temporalWindows.length - 1;
    return this.temporalWindows[newTemporalWindowIndex].getTemporalWindow();
  }
}

class TemporalWindowWrapper {
  temporalWindow: number[];

  constructor(frameSize: number) {
    const win: WindowFunction = new WindowFunction();
    this.temporalWindow = Constants.fillArray(frameSize);
    let twIt = 0;
    for (let i = 0; i < frameSize; i++) {
      this.temporalWindow[twIt] = win.window(temporal_window_t.WINDOW_BLACKMAN, i, frameSize);
      twIt++; // std::advance(twIt, 1);
    }
  }

  getFrameSize(): number {
    return this.temporalWindow.length;
  }

  getTemporalWindow(): number[] {
    return this.temporalWindow;
  }
}
