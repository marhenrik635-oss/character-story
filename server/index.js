const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 90;
const AI_ENDPOINT = process.env.AI_ENDPOINT || 'https://rnrbmqc.abc-tunnel.us/v1/chat/completions';
const AI_API_KEY = process.env.XOFTWARE_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'Vitalwounds';

if (!AI_API_KEY) {
  console.error('FATAL: XOFTWARE_API_KEY environment variable not set. Set it in .env or export it.');
  process.exit(1);
}

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

function buildSystemPrompt(language, vibe) {
  const langMap = {
    indonesian: 'Write the ENTIRE story in Indonesian (Bahasa Indonesia). Use natural conversational Indonesian.',
    english: 'Write the ENTIRE story in English. Use natural conversational English.',
    italian: 'Write the ENTIRE story in Italian. Use natural conversational Italian.'
  };
  const langInstr = langMap[language] || langMap.english;
  const vibeInstr = vibe === 'good'
    ? 'The story ends on a positive, uplifting note. Focus on redemption, growth, and hope.'
    : 'The story takes a dark, tragic turn. Focus on struggle, loss, and harsh realities.';

  return `You are a professional fiction ghostwriter. Your job is to write compelling character life stories that read as if written by a human author.

CRITICAL RULES:
1. VARY sentence structure constantly. Mix short punchy sentences with longer flowing ones.
2. Use CONTRACTIONS naturally: don't, can't, won't, it's, there's, they'd.
3. Include minor IMPERFECTIONS: occasional sentence fragments. Start sentences with "And" or "But".
4. VARY paragraph length: some 1-2 sentences, some 4-6 sentences.
5. Use TRANSITIONAL PHRASES: "The thing is,", "Look,", "Here's the deal,", "What nobody tells you is,".
6. Include SENSORY DETAILS: smells, sounds, textures, weather, temperature.
7. EMOTIONAL WEIGHT: Show how events affect the character internally.
8. AVOID: "In a world where..." or "Once upon a time..." or moral lessons at end.
9. AVOID: bullet points, numbered lists, cliches like "little did they know".
10. Use SPECIFIC details: instead of "he was sad", say "he stared at the ceiling for three hours".
11. Vary your TONE throughout: some parts reflective, others raw, others observant.
12. Write 300-500 words. Never less than 300.
13. No title, no "The End", no markdown formatting.
14. Start from childhood, move through formative experiences, end with final fate.
15. Make it feel REAL, PERSONAL, human-written.
${vibeInstr}
${langInstr}`;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/generate-cs', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 10) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Parse fields from the raw prompt string
    const g = (pattern) => { const m = prompt.match(pattern); return m ? m[1].trim() : ''; };
    const icName = g(/Character Name[\s\S]{0,30}?:\s*([^\n]+)/i);
    const age = g(/Age[\s\S]{0,30}?:\s*([^\n]+)/i);
    const langRaw = g(/Story Language[\s\S]{0,30}?:\s*(\w+)/i).toLowerCase();
    const language = langRaw.includes('indonesia') ? 'indonesian' : langRaw.includes('italia') ? 'italian' : 'english';
    const vibeRaw = g(/Story Path[\s\S]{0,30}?:\s*(\w+)/i).toLowerCase();
    const vibe = (vibeRaw.includes('good') || vibeRaw.includes('baik')) ? 'good' : 'bad';
    const job = g(/Target Profession[\s\S]{0,30}?:\s*([^\n]+)/i);
    const plot = g(/Core Plot[\s\S]{0,30}?:\s*([\s\S]*?)(?=\n(?:Story Ending|$))/i);
    const ending = g(/Story Ending[\s\S]{0,30}?:\s*([\s\S]*?)$/i);

    const sysP = buildSystemPrompt(language, vibe);
    let usrP = `Write a character life story for a SAMP roleplay character.\n\nName: ${icName || 'Unknown'}\nAge: ${age || 'Unknown'}`;
    if (job) usrP += `\nProfession: ${job}`;
    if (plot) usrP += `\n\nBackground:\n${plot}`;
    if (ending) usrP += `\n\nEnding:\n${ending}`;
    usrP += `\n\n300-500 words in ${language}. Start from childhood, end with final fate. Make it feel human-written.`;

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'system', content: sysP }, { role: 'user', content: usrP }],
        temperature: 0.92,
        top_p: 0.95,
        max_tokens: 8192,
        presence_penalty: 0.3,
        frequency_penalty: 0.2,
        stream: false
      })
    });
    if (!response.ok) throw new Error('AI API error: ' + (await response.text()));
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content || '';
    if (!content || content.trim().length < 50) throw new Error('AI generated insufficient content.');
    const story = content.trim();
    console.log(`[OK] Generated ${story.split(/\s+/).length} words for ${icName}`);
    res.json({ success: true, story, wordCount: story.split(/\s+/).length });
  } catch (err) {
    console.error('[ERR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('CS API running on port', PORT);
  console.log('Model:', AI_MODEL);
  console.log('Node:', process.version);
});
