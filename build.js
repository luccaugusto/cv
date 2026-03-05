const nunjucks = require('nunjucks');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

nunjucks.configure('templates', { autoescape: false });

const builds = [
    { template: 'cv-swe.njk', data: 'data/en.yaml', variant: 'swe', dir: 'eng' },
    { template: 'cv-pm.njk',  data: 'data/en.yaml', variant: 'pm',  dir: 'eng' },
    { template: 'cv-swe.njk', data: 'data/pt.yaml', variant: 'swe', dir: 'pt' },
    { template: 'cv-pm.njk',  data: 'data/pt.yaml', variant: 'pm',  dir: 'pt' },
];

async function main() {
    const htmlFiles = [];

    for (const { template, data: dataFile, variant, dir } of builds) {
        const data = yaml.load(fs.readFileSync(dataFile, 'utf8'));
        const html = nunjucks.render(template, data);
        const baseName = data.output_filename[variant];
        const htmlPath = path.join(dir, `${baseName}.html`);
        const pdfPath = path.join(dir, `${baseName}.pdf`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(htmlPath, html);
        console.log(`Built ${htmlPath}`);
        htmlFiles.push({ htmlPath, pdfPath });
    }

    const browser = await puppeteer.launch();
    for (const { htmlPath, pdfPath } of htmlFiles) {
        const page = await browser.newPage();
        const fileUrl = `file://${path.resolve(htmlPath)}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
        await page.close();
        console.log(`Exported ${pdfPath}`);
    }
    await browser.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
