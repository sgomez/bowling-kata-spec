const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const at = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  return (t: number) => {
    if (t <= 0 || t >= 1) return t <= 0 ? 0 : 1;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (at(x1, x2, mid) < t) low = mid;
      else high = mid;
    }
    return at(y1, y2, (low + high) / 2);
  };
};

export const entry = cubicBezier(0.5, 0, 0.9, 0.3);
export const exit = cubicBezier(0.2, 0.8, 0.2, 1);
export const pulse = cubicBezier(0.4, 0, 0.6, 1);
