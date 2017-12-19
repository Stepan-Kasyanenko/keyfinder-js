export class AudioData {

  public  samples: number[] = [];
  private channels = 0;
  private frameRate = 0;

  private readIterator: number = 0;
  private writeIterator: number = 0;

  getChannels(): number {
    return this.channels;
  }

  setChannels(inChannels: number): void {
    if (inChannels < 1) {
      throw new Error('New channel count must be > 0');
    }
    this.channels = inChannels;
  }

  getFrameRate(): number {
    return this.frameRate;
  }

  setFrameRate(inFrameRate: number) {
    if (inFrameRate < 1) {
      throw new Error('New frame rate must be > 0');
    }
    this.frameRate = inFrameRate;
  }

  append(that: AudioData): void {
    if (this.channels === 0 && this.frameRate === 0) {
      this.channels = that.channels;
      this.frameRate = that.frameRate;
    }
    if (that.channels !== this.channels) {
      throw new Error('Cannot append audio data with a different number of channels');
    }
    if (that.frameRate !== this.frameRate) {
      throw new Error('Cannot append audio data with a different frame rate');
    }

    this.samples = this.samples.concat(that.samples);
  }

  prepend(that: AudioData) {
    if (this.channels === 0 && this.frameRate === 0) {
      this.channels = that.channels;
      this.frameRate = that.frameRate;
    }
    if (that.channels !== this.channels) {
      throw new Error('Cannot prepend audio data with a different number of channels');
    }
    if (that.frameRate !== this.frameRate) {
      throw new Error('Cannot prepend audio data with a different frame rate');
    }

    this.samples = that.samples.concat(this.samples);
  }

// get sample by absolute index
  getSample(index: number): number {
    if (index >= this.getSampleCount()) {
      throw new Error('Cannot get out-of-bounds sample (' + index + '/' + this.getSampleCount() + ')');
    }
    return this.samples[index];
  }

// get sample by frame and channel
  getSampleByFrame(frame: number, channel: number): number {
    if (frame >= this.getFrameCount()) {
      throw new Error('Cannot get out-of-bounds frame (' + frame + '/' + this.getFrameCount() + ')');
    }
    if (channel >= this.channels) {
      throw new Error('Cannot get out-of-bounds channel (' + channel + '/' + this.channels + ')');
    }
    return this.getSample(frame * this.channels + channel);
  }

// set sample by absolute index
  setSample(index: number, value: number): void {
    if (index >= this.getSampleCount()) {
      throw new Error('Cannot set out-of-bounds sample (' + index + '/' + this.getSampleCount() + ')');
    }

    if (!isFinite(value) || isNaN(value)) {
      throw new Error('Cannot set sample to NaN');
    }
    this.samples[index] = value;
  }

// set sample by frame and channel
  setSampleByFrame(frame: number, channel: number, value: number): void {
    if (frame >= this.getFrameCount()) {
      throw new Error('Cannot set out-of-bounds frame (' + frame + '/' + this.getFrameCount() + ')');
    }
    if (channel >= this.channels) {
      throw new Error('Cannot set out-of-bounds channel (' + channel + '/' + this.channels + ')');
    }
    this.setSample(frame * this.channels + channel, value);
  }

  addToSampleCount(inSamples: number): void {
    const newLength = this.getSampleCount() + inSamples;
    if (this.samples.length < newLength) {
      for (let i = this.samples.length; i < newLength; i++) {
        this.samples.push(0);
      }
    } else {
      this.samples.length = newLength;
    }
  }

  addToFrameCount(inFrames: number): void {
    if (this.channels < 1) {
      throw new Error('Channels must be > 0');
    }
    this.addToSampleCount(inFrames * this.channels);
  }

  getSampleCount(): number {
    return this.samples.length;
  }

  getFrameCount(): number {
    if (this.channels < 1) {
      throw new Error('Channels must be > 0');
    }
    return this.getSampleCount() / this.channels;
  }

  reduceToMono(): void {
    if (this.channels < 2) {
      return;
    }
    const newSamples = [];
    let i = 0;
    while (i < this.samples.length) {
      let sum = 0;
      for (let c = 0; c < this.channels; c++) {
        sum += this.samples[i];
        i++;
      }
      newSamples.push(sum / this.channels);
    }
    this.samples = newSamples;
    this.channels = 1;
  }

// Strictly to be applied AFTER low pass filtering
  downsample(factor: number, shortcut: boolean = true): void {
    if (factor === 1) {
      return;
    }
    if (this.channels > 1) {
      throw new Error('Apply to monophonic only');
    }

    const newSample = [];
    let numSamplesRemaining = this.samples.length;
    let i = 0;
    while (i < this.samples.length) {
      let readAt = this.samples[i];
      let mean = 0;
      if (shortcut) {
        mean = readAt;
        if (numSamplesRemaining >= factor) {
          i = i + factor;
          readAt = this.samples[i];
        } else {
          i = this.samples.length;
          readAt = this.samples[i];
        }
        numSamplesRemaining -= factor;
      } else {
        for (let s = 0; s < factor; s++) {
          if (i < this.samples.length) {
            mean += readAt;
            i++;
            readAt = this.samples[i];
            --numSamplesRemaining;
          }
          mean /= factor;
        }
      }
      newSample.push(mean);
    }
    this.samples = newSample;
    this.setFrameRate(this.getFrameRate() / factor);
  }

  discardFramesFromFront(discardFrameCount: number): void {
    if (discardFrameCount > this.getFrameCount()) {
      throw new Error('Cannot discard ' + discardFrameCount + ' frames of ' + this.getFrameCount());
    }
    const discardSampleCount = discardFrameCount * this.channels;

    this.samples.splice(0, discardSampleCount);
  }

  sliceSamplesFromBack(sliceSampleCount: number): AudioData {

    if (sliceSampleCount > this.getSampleCount()) {
      throw new Error('Cannot slice ' + sliceSampleCount + ' samples of ' + this.getSampleCount());
    }

    const samplesToLeaveIntact = this.getSampleCount() - sliceSampleCount;

    const that: AudioData = new AudioData();
    that.channels = this.channels;
    that.setFrameRate(this.getFrameRate());
    that.addToSampleCount(sliceSampleCount);
    that.samples = this.samples.slice(samplesToLeaveIntact);

    this.samples.length = samplesToLeaveIntact;

    return that;
  }

  resetIterators() {
    this.readIterator = 0;
    this.writeIterator = 0;
  }

  readIteratorWithinUpperBound(): boolean {
    return (this.readIterator < this.samples.length);
  }

  writeIteratorWithinUpperBound(): boolean {
    return (this.writeIterator < this.samples.length);
  }

  advanceReadIterator(by: number = 1): void {
    this.readIterator += by;
  }

  advanceWriteIterator(by: number = 1): void {
    this.writeIterator += by;
  }

  getSampleAtReadIterator(): number {
    return this.samples[this.readIterator] || 0;
  }

  setSampleAtWriteIterator(value: number): void {
    this.samples[this.writeIterator] = value;
  }

}
