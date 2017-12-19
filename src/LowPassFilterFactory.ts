import {LowPassFilter} from './LowPassFilter';

export class LowPassFilterFactory {
  private lowPassFilters: LowPassFilterWrapper[] = [];

  getLowPassFilter(inOrder: number, inFrameRate: number, inCornerFrequency: number, inFftFrameSize: number): LowPassFilter {
    for (let i = 0; i < this.lowPassFilters.length; i++) {
      const wrapper = this.lowPassFilters[i];
      if (wrapper.getOrder() === inOrder &&
        wrapper.getFrameRate() === inFrameRate &&
        wrapper.getCornerFrequency() === inCornerFrequency &&
        wrapper.getFftFrameSize() === inFftFrameSize) {
        return wrapper.getLowPassFilter();
      }
    }
    const lpf = new LowPassFilter(inOrder, inFrameRate, inCornerFrequency, inFftFrameSize);
    this.lowPassFilters.push(new LowPassFilterWrapper(inOrder, inFrameRate, inCornerFrequency, inFftFrameSize, lpf));
    const newLowPassFilterIndex = this.lowPassFilters.length - 1;
    return this.lowPassFilters[newLowPassFilterIndex].getLowPassFilter();
  }
}

class LowPassFilterWrapper {
  order: number;
  frameRate: number;
  cornerFrequency: number;
  fftFrameSize: number;
  lowPassFilter: LowPassFilter;

  constructor(inOrder: number, inFrameRate: number, inCornerFrequency: number, inFftFrameSize: number, inLowPassFilter: LowPassFilter) {
    this.order = inOrder;
    this.frameRate = inFrameRate;
    this.cornerFrequency = inCornerFrequency;
    this.fftFrameSize = inFftFrameSize;
    this.lowPassFilter = inLowPassFilter;
  }

  getLowPassFilter(): LowPassFilter {
    return this.lowPassFilter;
  }

  getOrder(): number {
    return this.order;
  }

  getFrameRate(): number {
    return this.frameRate;
  }

  getCornerFrequency(): number {
    return this.cornerFrequency;
  }

  getFftFrameSize(): number {
    return this.fftFrameSize;
  }
}
