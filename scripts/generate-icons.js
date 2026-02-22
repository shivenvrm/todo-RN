const sharp = require("sharp");
const fs = require("fs");

const input = process.argv[2];

if (!input) {
  console.log("Usage: node generate-icons.js logo.png");
  process.exit(1);
}

const sizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const outputDir = "android_icons";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function generate() {
  for (const folder in sizes) {
    const size = sizes[folder];
    const dir = `${outputDir}/${folder}`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await sharp(input)
      .resize(size, size)
      .toFile(`${dir}/ic_launcher.png`);

    console.log(`✅ Created ${folder} (${size}px)`);
  }

  console.log("\n🎉 All Android icons generated!");
}

generate();