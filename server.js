require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MariaDB Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'diagnostics'
});

// Connect to MariaDB
db.connect(err => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to MariaDB.');
});

// OpenAI Configuration
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY
}));

// Fetch solutions from the database
app.get('/get-solutions', (req, res) => {
    const { problem } = req.query;

    const query = `
        SELECT solution_id, solution_text, success_count
        FROM solution_feedback
        WHERE problem_description = ?
        ORDER BY success_count DESC;
    `;

    db.query(query, [problem], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });

        if (results.length > 0) {
            // If solutions exist in the database, return them
            res.json({ solutions: results });
        } else {
            // No solutions found, query OpenAI
            console.log("No database solutions found. Querying OpenAI...");
            const aiSolution = await getAISolution(problem);

            if (aiSolution) {
                // Store the AI-generated solution in the database
                storeAISolution(problem, aiSolution);
                res.json({ solutions: [{ solution_id: null, solution_text: aiSolution, success_count: 0 }] });
            } else {
                res.json({ solutions: [] });
            }
        }
    });
});

// Fetch AI-generated solution
async function getAISolution(problem) {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ role: "system", content: "You are an expert in diagnosing Windows 10 issues." },
                       { role: "user", content: `How can I fix this issue? ${problem}` }]
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API error:", error);
        return null;
    }
}

// Store AI-generated solutions in the database
function storeAISolution(problem, solution) {
    const query = `
        INSERT INTO solution_feedback (problem_description, solution_id, solution_text, success_count)
        VALUES (?, NULL, ?, 0);
    `;

    db.query(query, [problem, solution], (err) => {
        if (err) console.error("Error storing AI-generated solution:", err);
        else console.log("Stored AI-generated solution for future use.");
    });
}

// Store user feedback
app.post('/feedback', (req, res) => {
    const { problem, solutionId, solutionText } = req.body;

    if (!problem || (!solutionId && !solutionText)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    let query;
    let params;

    if (solutionId) {
        // If it's a database solution, increment success count
        query = `
            UPDATE solution_feedback
            SET success_count = success_count + 1
            WHERE problem_description = ? AND solution_id = ?;
        `;
        params = [problem, solutionId];
    } else {
        // If it's an AI-generated solution, store it if not already in DB
        query = `
            INSERT INTO solution_feedback (problem_description, solution_id, solution_text, success_count)
            VALUES (?, NULL, ?, 1)
            ON DUPLICATE KEY UPDATE success_count = success_count + 1;
        `;
        params = [problem, solutionText];
    }

    db.query(query, params, (err) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Feedback stored successfully' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
