const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Ендпоінт для збереження результатів
app.post('/save-results', (req, res) => {
    const resultData = req.body; // Дані з клієнта

    if (!resultData) {
        return res.status(400).json({ message: 'No data provided' });
    }

    const filePath = path.join(__dirname, 'results.json');

    // Читаємо існуючі результати
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading results file:', err);
            return res.status(500).json({ message: 'Error reading results file' });
        }

        let results = [];
        if (data) {
            results = JSON.parse(data); // Якщо файл існує, парсимо його
        }

        // Додаємо новий результат
        results.push(resultData);

        // Записуємо оновлені результати назад у файл
        fs.writeFile(filePath, JSON.stringify(results, null, 2), (err) => {
            if (err) {
                console.error('Error writing to results file:', err);
                return res.status(500).json({ message: 'Error saving results' });
            }

            res.status(200).json({ message: 'Results saved successfully' });
        });
    });
});

// Ендпоінт для отримання попередніх результатів
app.get('/get-prev-result', (req, res) => {
    const filePath = path.join(__dirname, 'results.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading results file:', err);
            return res.status(500).json({ message: 'Error reading results file' });
        }

        const results = JSON.parse(data);
        res.status(200).json(results);
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});