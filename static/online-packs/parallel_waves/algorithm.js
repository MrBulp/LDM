export function generate({width, height, params}) {
  const margin = Math.min(15, width / 8, height / 8);
  const count = Math.round(params.lines);
  const amplitude = Math.min(params.amplitude, margin / 2);
  const paths = [];
  for (let row = 0; row < count; row++) {
    const y = margin + row * (height - 2 * margin) / (count - 1);
    const points = [];
    for (let sample = 0; sample <= 240; sample++) {
      const t = sample / 240;
      points.push([margin + t * (width - 2 * margin), y + amplitude * Math.sin(t * Math.PI * 2 * params.cycles)]);
    }
    paths.push(points);
  }
  return {width, height, paths};
}
