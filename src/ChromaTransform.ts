import {Constants} from './Constants';
import {FftAdapter} from './FftAdapter';

export class ChromaTransform {
  frameRate: number;
  directSpectralKernel: Array<number[]>;
  chromaBandFftBinOffsets: number[];

  constructor(inFrameRate: number) {

    this.frameRate = inFrameRate;
    if (this.frameRate < 1) {
      throw new Error('Frame rate must be > 0');
    }

    if (Constants.getLastFrequency() > this.frameRate / 2.0) {
      throw new Error('Analysis frequencies over Nyquist');
    }

    if (this.frameRate / Constants.FFTFRAMESIZE > (Constants.getFrequencyOfBand(1) - Constants.getFrequencyOfBand(0))) {
      throw new Error('Insufficient low-end resolution');
    }

    this.chromaBandFftBinOffsets = Constants.fillArray(Constants.BANDS);
    this.directSpectralKernel = [];
    for (let i = 0; i < Constants.BANDS; i++) {
      this.directSpectralKernel.push([]);
    }


    const myQFactor = Constants.DIRECTSKSTRETCH * (Math.pow(2, (1.0 / Constants.SEMITONES)) - 1);

    for (let i = 0; i < Constants.BANDS; i++) {

      const centreOfWindow = Constants.getFrequencyOfBand(i) * Constants.FFTFRAMESIZE / inFrameRate;
      const widthOfWindow = centreOfWindow * myQFactor;
      const beginningOfWindow = centreOfWindow - (widthOfWindow / 2);
      const endOfWindow = beginningOfWindow + widthOfWindow;

      let sumOfCoefficients = 0.0;

      this.chromaBandFftBinOffsets[i] = Math.ceil(beginningOfWindow); // first useful fft bin
      for (let fftBin = this.chromaBandFftBinOffsets[i]; fftBin <= Math.floor(endOfWindow); fftBin++) {
        const coefficient = this.kernelWindow(fftBin - beginningOfWindow, widthOfWindow);
        sumOfCoefficients += coefficient;
        this.directSpectralKernel[i].push(coefficient);
      }

      // normalisation by sum of coefficients and frequency of bin; models CQT very closely
      for (let j = 0; j < this.directSpectralKernel[i].length; j++) {
        this.directSpectralKernel[i][j] = this.directSpectralKernel[i][j] / sumOfCoefficients * Constants.getFrequencyOfBand(i);
      }
    }
  }

  kernelWindow(n: number, N: number): number {
    // discretely sampled continuous function, but different to other window functions
    return 1.0 - Math.cos((2 * Math.PI * n) / N);
  }

  chromaVector(fftAdapter: FftAdapter): number[] {
    const chromaVector = Constants.fillArray(Constants.BANDS);
    for (let i = 0; i < Constants.BANDS; i++) {
      let sum = 0.0;
      for (let j = 0; j < this.directSpectralKernel[i].length; j++) {
        const magnitude = fftAdapter.getOutputMagnitude(this.chromaBandFftBinOffsets[i] + j);
        sum += (magnitude * this.directSpectralKernel[i][j]);
      }
      chromaVector[i] = sum;
    }
    return chromaVector;
  }
}
