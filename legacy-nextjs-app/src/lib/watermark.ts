import sharp from "sharp";

export async function applyTrialWatermark(inputBuffer: Buffer): Promise<Buffer> {
  const watermarkText = "KlipCam Trial";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='200'>
  <rect x='0' y='0' width='800' height='200' fill='none'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' opacity='0.25' font-size='64' font-family='sans-serif'>${watermarkText}</text>
</svg>`;

  const wm = Buffer.from(svg);
  const image = sharp(inputBuffer).composite([{ input: wm, gravity: "southeast" }]);
  return await image.jpeg({ quality: 92 }).toBuffer();
}




