export class Complex {
  constructor(public real, public imag) {
  }
}

export class DFT {

  execute(samples: number[]): Complex[] {
    const rReal = samples.slice();
    const rImag = this.newArrayOfZeros(samples.length);

    this.transform(rReal, rImag);

    const res: Complex[] = [];
    for (let i = 0; i < samples.length; i++) {
      res.push(new Complex(rReal[i], rImag[i]));
    }
    return res;
  }

  executeInverse(samples: Complex[]): number[] {
    const rReal = Array(samples.length);
    const rImag = Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      rReal[i] = samples[i].real;
      rImag[i] = samples[i].imag;
    }

    this.inverseTransform(rReal, rImag);

    return rReal;
  }

  transform(real, imag) {
    const n = real.length;
    if (n !== imag.length) {
      throw new Error('Mismatched lengths');
    }
    if (n === 0) {
      return;
    } else if ((n & (n - 1)) === 0) {  // Is power of 2
      this.transformRadix2(real, imag);
    } else { // More complicated algorithm for arbitrary sizes
      this.transformBluestein(real, imag);
    }
  }


  /*
   * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
   * The vector can have any length. This is a wrapper function.
   * This transform does not perform scaling, so the inverse is not a true inverse.
   */
  inverseTransform(real, imag) {
    this.transform(imag, real);
  }


  /*
   * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
   * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
   */
  transformRadix2(real, imag) {
    // Length variables
    const n = real.length;
    if (n !== imag.length)
      throw new Error('Mismatched lengths');
    if (n === 1) { // Trivial transform
      return;
    }
    let levels = -1;
    for (let i = 0; i < 32; i++) {
      if (1 << i === n) {
        levels = i;  // Equal to log2(n)
      }
    }
    if (levels === -1) {
      throw new Error('Length is not a power of 2');
    }

    // Trigonometric tables
    const cosTable = new Array(n / 2);
    const sinTable = new Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      cosTable[i] = Math.cos(2 * Math.PI * i / n);
      sinTable[i] = Math.sin(2 * Math.PI * i / n);
    }

    // Bit-reversed addressing permutation
    for (let i = 0; i < n; i++) {
      const j = reverseBits(i, levels);
      if (j > i) {
        let temp = real[i];
        real[i] = real[j];
        real[j] = temp;
        temp = imag[i];
        imag[i] = imag[j];
        imag[j] = temp;
      }
    }

    // Cooley-Tukey decimation-in-time radix-2 FFT
    for (let size = 2; size <= n; size *= 2) {
      const halfsize = size / 2;
      const tablestep = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
          const l = j + halfsize;
          const tpre = real[l] * cosTable[k] + imag[l] * sinTable[k];
          const tpim = -real[l] * sinTable[k] + imag[l] * cosTable[k];
          real[l] = real[j] - tpre;
          imag[l] = imag[j] - tpim;
          real[j] += tpre;
          imag[j] += tpim;
        }
      }
    }

    // Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.
    function reverseBits(x, bits) {
      let y = 0;
      for (let i = 0; i < bits; i++) {
        y = (y << 1) | (x & 1);
        x >>>= 1;
      }
      return y;
    }
  }


  /*
   * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
   * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
   * Uses Bluestein's chirp z-transform algorithm.
   */
  transformBluestein(real, imag) {
    // Find a power-of-2 convolution length m such that m >= n * 2 + 1
    const n = real.length;
    if (n !== imag.length) {
      throw new Error('Mismatched lengths');
    }
    let m = 1;
    while (m < n * 2 + 1) {
      m *= 2;
    }

    // Trignometric tables
    const cosTable = new Array(n);
    const sinTable = new Array(n);
    for (let i = 0; i < n; i++) {
      const j = i * i % (n * 2);  // This is more accurate than j = i * i
      cosTable[i] = Math.cos(Math.PI * j / n);
      sinTable[i] = Math.sin(Math.PI * j / n);
    }

    // Temporary vectors and preprocessing
    const areal = this.newArrayOfZeros(m);
    const aimag = this.newArrayOfZeros(m);
    for (let i = 0; i < n; i++) {
      areal[i] = real[i] * cosTable[i] + imag[i] * sinTable[i];
      aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
    }
    const breal = this.newArrayOfZeros(m);
    const bimag = this.newArrayOfZeros(m);
    breal[0] = cosTable[0];
    bimag[0] = sinTable[0];
    for (let i = 1; i < n; i++) {
      breal[i] = breal[m - i] = cosTable[i];
      bimag[i] = bimag[m - i] = sinTable[i];
    }

    // Convolution
    const creal = new Array(m);
    const cimag = new Array(m);
    this.convolveComplex(areal, aimag, breal, bimag, creal, cimag);

    // Postprocessing
    for (let i = 0; i < n; i++) {
      real[i] = creal[i] * cosTable[i] + cimag[i] * sinTable[i];
      imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
    }
  }


  /*
   * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
   */
  convolveReal(x, y, out) {
    const n = x.length;
    if (n !== y.length || n !== out.length) {
      throw new Error('Mismatched lengths');
    }
    this.convolveComplex(x, this.newArrayOfZeros(n), y, this.newArrayOfZeros(n), out, this.newArrayOfZeros(n));
  }


  /*
   * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
   */
  convolveComplex(xreal, ximag, yreal, yimag, outreal, outimag) {
    const n = xreal.length;
    if (n !== ximag.length || n !== yreal.length || n !== yimag.length
      || n !== outreal.length || n !== outimag.length) {
      throw new Error('Mismatched lengths');
    }

    xreal = xreal.slice();
    ximag = ximag.slice();
    yreal = yreal.slice();
    yimag = yimag.slice();
    this.transform(xreal, ximag);
    this.transform(yreal, yimag);

    for (let i = 0; i < n; i++) {
      const temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
      ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
      xreal[i] = temp;
    }
    this.inverseTransform(xreal, ximag);

    for (let i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
      outreal[i] = xreal[i] / n;
      outimag[i] = ximag[i] / n;
    }
  }


  newArrayOfZeros(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(0);
    }
    return result;
  }

}
