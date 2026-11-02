const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

// Exact fractions on BigInt, so share counts never pick up floating-point error.
export class Frac {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new Error('Fraction with zero denominator');
    if (d < 0n) [n, d] = [-n, -d];
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static parse(text) {
    const [n, d = '1'] = String(text).split('/');
    return new Frac(n.trim(), d.trim());
  }

  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }

  // Holdings are never negative, so BigInt truncation is a floor here.
  floor() { return new Frac(this.n / this.d); }
  isZero() { return this.n === 0n; }
  toNumber() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
