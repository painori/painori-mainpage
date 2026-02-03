const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public/locales');

const translations = {
    ko: { aggregated: "집계" },
    en: { aggregated: "Counted" },
    ja: { aggregated: "集計" },
    zh: { aggregated: "统计" },
    'zh-TW': { aggregated: "統計" },
    vi: { aggregated: "Đã đếm" },
    // Simplified fallback
};

const defaultTrans = { aggregated: "Counted" };

fs.readdir(localesDir, (err, files) => {
    if (err) {
        console.error("Could not list directory.", err);
        process.exit(1);
    }

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const langCode = file.replace('.json', '');
        const filePath = path.join(localesDir, file);

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            let json = JSON.parse(data);

            const trans = translations[langCode] || defaultTrans;

            json['stats_aggregated'] = trans.aggregated;

            fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
            console.log(`Updated ${file}`);
        } catch (e) {
            console.error(`Error updating ${file}`, e);
        }
    });
});
