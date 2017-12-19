import {Constants} from './Constants';
import {AudioData} from './AudioData';
import {Chromagram} from './Chromagram';
import {ChromaTransformFactory} from './ChromaTransformFactory';
import {ChromaTransform} from './ChromaTransform';
import {TemporalWindowFactory} from './TemporalWindowFactory';
import {FftAdapter} from './FftAdapter';

export class SpectrumAnalyser {
  protected chromaTransform: ChromaTransform;
  protected tw: number[];

  constructor(frameRate: number, spFactory: ChromaTransformFactory, twFactory: TemporalWindowFactory) {
    this.chromaTransform = spFactory.getChromaTransform(frameRate);
    this.tw = twFactory.getTemporalWindow(Constants.FFTFRAMESIZE);
  }

  chromagramOfWholeFrames(audio: AudioData, fftAdapter: FftAdapter): Chromagram {

    if (audio.getChannels() !== 1) {
      throw new Error('Audio must be monophonic to be analysed');
    }

    const frmSize = fftAdapter.getFrameSize();
    if (audio.getSampleCount() < frmSize) {
      return new Chromagram(0);
    }

    const hops = 1 + ((audio.getSampleCount() - frmSize) / Constants.HOPSIZE);
    const ch: Chromagram = new Chromagram(hops);

    for (let hop = 0; hop < hops; hop++) {

      audio.resetIterators();
      audio.advanceReadIterator(hop * Constants.HOPSIZE);

      let twIt = 0;
      for (let sample = 0; sample < frmSize; sample++) {
        fftAdapter.setInput(sample, audio.getSampleAtReadIterator() * this.tw[twIt]);
        audio.advanceReadIterator();
        twIt++; // std::advance(twIt, 1);
      }

      fftAdapter.execute();

      const cv: number[] = this.chromaTransform.chromaVector(fftAdapter);
      let cvIt = 0;
      for (let band = 0; band < Constants.BANDS; band++) {
        ch.setMagnitude(hop, band, cv[cvIt]);
        cvIt++; // std::advance(cvIt, 1);
      }
    }
    return ch;
  }
}
