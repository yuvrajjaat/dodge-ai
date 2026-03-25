const { checkGuardrails } = require('../middleware/guardrails');
const { chatCompletion } = require('../llm/openrouter');
const { buildSqlPrompt, buildResponsePrompt } = require('../llm/prompts');

function cleanSql(raw) {
  let sql = raw.trim();
  // Strip markdown fences
  sql = sql.replace(/^```(?:sql)?\s*/i, '').replace(/\s*```$/i, '');
  sql = sql.trim();
  // Remove trailing semicolon (better-sqlite3 doesn't want it in .prepare)
  if (sql.endsWith(';')) sql = sql.slice(0, -1).trim();
  return sql;
}

function formatSimpleResult(question, results) {
  if (results.length === 0) return 'No matching records were found.';

  // Single value result (e.g., COUNT)
  if (results.length === 1) {
    const keys = Object.keys(results[0]);
    if (keys.length === 1) {
      return `The answer is: **${results[0][keys[0]]}**`;
    }
  }
  return null; // Not simple — use LLM
}

async function handleQuery(req, res, db) {
  const { query } = req.body;

  // 1. Guardrails
  const guard = checkGuardrails(query);
  if (!guard.allowed) {
    return res.status(400).json({ answer: guard.message, data: [], sql: null });
  }

  try {
    // 2. Generate SQL
    const sqlSystemPrompt = buildSqlPrompt();
    let sqlResponse = await chatCompletion([
      { role: 'system', content: sqlSystemPrompt },
      { role: 'user', content: query },
    ], { temperature: 0, maxTokens: 512 });

    let sql = cleanSql(sqlResponse);

    // Check for NOT_ANSWERABLE
    if (sql.toUpperCase().includes('NOT_ANSWERABLE')) {
      return res.json({
        answer: 'This question cannot be answered from the available SAP O2C dataset.',
        data: [],
        sql: null,
      });
    }

    // Validate it's a SELECT
    if (!sql.toUpperCase().startsWith('SELECT')) {
      return res.json({
        answer: 'I could not generate a valid query for your question. Please try rephrasing.',
        data: [],
        sql: null,
      });
    }

    // 3. Execute SQL
    let results;
    try {
      results = db.prepare(sql).all();
    } catch (sqlError) {
      // Retry: send error back to LLM
      console.log('SQL error, retrying:', sqlError.message);
      const retryResponse = await chatCompletion([
        { role: 'system', content: sqlSystemPrompt },
        { role: 'user', content: query },
        { role: 'assistant', content: sql },
        {
          role: 'user',
          content: `That SQL caused this error: ${sqlError.message}\nPlease fix the SQL query. Output ONLY the corrected SQL.`,
        },
      ], { temperature: 0, maxTokens: 512 });

      const retrySql = cleanSql(retryResponse);
      if (!retrySql.toUpperCase().startsWith('SELECT')) {
        return res.json({
          answer: 'I had trouble querying the data. Please try rephrasing your question.',
          data: [],
          sql: null,
        });
      }

      try {
        sql = retrySql;
        results = db.prepare(sql).all();
      } catch (retryError) {
        console.log('Retry also failed:', retryError.message);
        return res.json({
          answer: 'I could not find the data to answer that question. Please try rephrasing.',
          data: [],
          sql: null,
        });
      }
    }

    // 4. Format response
    let answer = formatSimpleResult(query, results);
    if (!answer) {
      try {
        const responseMessages = buildResponsePrompt(query, results);
        answer = await chatCompletion(responseMessages, { temperature: 0.3, maxTokens: 512 });
      } catch (formatError) {
        console.log('Response formatting error:', formatError.message);
        // Fallback: return raw data summary
        answer = results.length === 0
          ? 'No matching records were found.'
          : `Found ${results.length} result(s). See the data below.`;
      }
    }

    return res.json({ answer, data: results.slice(0, 50), sql });

  } catch (error) {
    console.error('Query pipeline error:', error);

    if (error.message.includes('API error 429')) {
      return res.status(429).json({
        answer: 'The AI service is rate-limited. Please try again in a moment.',
        data: [],
        sql: null,
      });
    }

    return res.status(500).json({
      answer: 'An error occurred while processing your question. Please try again.',
      data: [],
      sql: null,
    });
  }
}

module.exports = handleQuery;
