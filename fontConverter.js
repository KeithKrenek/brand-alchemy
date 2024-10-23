const fs = require('fs');
const path = require('path');
const ttf2woff2 = require('ttf2woff2');

const convertFont = (inputPath, outputPath) => {
  const font = fs.readFileSync(inputPath);
  const woff2 = ttf2woff2(font);
  fs.writeFileSync(outputPath, woff2);
};

const generateFontJs = (fontPath, fontName) => {
  const font = fs.readFileSync(fontPath);
  const base64Font = font.toString('base64');
  
  const jsContent = `
    const ${fontName}Base64 = "${base64Font}";
    export default ${fontName}Base64;
  `;
  
  fs.writeFileSync(`${fontName}.js`, jsContent);
};

// Usage
const fontDir = './fonts';
const outputDir = './src/fonts';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(fontDir).forEach(file => {
  if (path.extname(file).toLowerCase() === '.ttf') {
    const fontName = path.basename(file, '.ttf');
    const inputPath = path.join(fontDir, file);
    const woff2Path = path.join(outputDir, `${fontName}.woff2`);
    
    convertFont(inputPath, woff2Path);
    generateFontJs(woff2Path, fontName);
    
    console.log(`Converted ${file} to WOFF2 and generated JS file.`);
  }
});