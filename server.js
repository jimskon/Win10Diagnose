require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const { Configuration, OpenAIApi } = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root requests
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
const OpenAI = require('openai');
const { getSystemErrorMap } = require('util');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Fetch solutions from the database or OpenAI
app.post('/api/get-solutions', (req, res) => {
    const { problem } = req.body;
    console.log("Problem:", problem);

    const query = `
        SELECT id AS solution_id, solution_text, success_count
        FROM solutions
        WHERE problem_description = ?
        ORDER BY success_count DESC;
    `;
    console.log("Query:", query);
    db.query(query, [problem], async (err, results) => {
        if (err) {
          console.log("Error:", err);
          return res.status(500).json({ error: 'Database query failed' });
        }

        if (results.length > 0) {
            // If solutions exist in the database, return them
            res.json({ solutions: results });
        } else {
            // No solutions found, query OpenAI
            console.log("No database solutions found. Querying OpenAI...");
            const aiSolution = await getAISolution(problem);

            if (aiSolution) {
                // Store the AI-generated solution in the database
                const solutionId = await storeAISolution(problem, aiSolution);
                res.json({ solutions: [{ solution_id: solutionId, solution_text: aiSolution, success_count: 0 }] });
            } else {
                res.json({ solutions: [] });
            }
        }
    });
});

// Fetch AI-generated solution
async function getAISolution(problem) {
  try {
      const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
              { role: "system", content: "You are an expert in diagnosing Windows 10 issues." },
              { role: "user", content: `How can I fix this issue? ${problem}` }
          ]
      });

      // Ensure the response is valid before accessing properties
      if (!response || !response.choices || response.choices.length === 0) {
          throw new Error("Invalid OpenAI API response structure");
      }
      console.log("AI response:", response.choices[0].message.content);
      return response.choices[0].message.content;
  } catch (error) {
      console.error("OpenAI API error:", error);
      return "I'm sorry, I couldn't generate a solution at this time. Please try again later.";
  }
}


// Store AI-generated solutions in the database
async function storeAISolution(problem, solution) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO solutions (problem_description, solution_text, success_count)
            VALUES (?, ?, 0);
        `;

        db.query(query, [problem, solution], (err, result) => {
            if (err) {
                console.error("Error storing AI-generated solution:", err);
                reject(err);
            } else {
                console.log("Stored AI-generated solution for future use.");
                resolve(result.insertId);
            }
        });
    });
}

// Store user feedback
app.post('/api/submit-feedback', (req, res) => {
    const { solutionIds } = req.body;

    if (!solutionIds || solutionIds.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const query = `
        UPDATE solutions
        SET success_count = success_count + 1
        WHERE id IN (?);
    `;

    db.query(query, [solutionIds], (err) => {
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
