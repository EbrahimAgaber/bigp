import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Socratic Tutor API Endpoint
app.post('/api/tutor', async (req, res) => {
  const { question, stage, context } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  // Curated knowledge base for fast fallback or offline answering
  const curatedFallback = getCuratedAnswer(question, stage);

  if (!aiClient) {
    return res.json({
      answer: curatedFallback,
      source: 'curated-expert',
      model: 'Process Control Knowledge Engine',
    });
  }

  try {
    const systemPrompt = `You are an intuitive Lead Product Architect & Senior Process Engineer guiding plant technicians and operators.
Channel Richard Feynman's vivid physical analogies and 3Blue1Brown's visual clarity.
Always explain physical intuition first:
- Speedometer reading: Rate of change of level (dh/dt)
- Inflow vs outflow accumulation
- Linearization: why small sections of curves look like flat roads
- Deviation variables: zero-baseline shift
- Laplace 's': frequency dial that turns derivatives into multiplication so blocks connect like Lego bricks

Give a concise, friendly, 2 paragraph answer using clear everyday physical analogies (like bathtubs, bicycle gears, speedometers, or road curves).
Do not overwhelm with raw equations unless translating them from physical intuition. Keep the tone practical, encouraging, and clear!`;

    const userPrompt = `Operator question: "${question}"
Context: Vessel current level: ${context?.h?.toFixed(2) ?? '4.00'} m, Inflow: ${context?.qi?.toFixed(2) ?? '4.00'} m³/min, Outflow: ${context?.qo?.toFixed(2) ?? '4.00'} m³/min.`;

    // Use timeout race to ensure fast response even if external API is slow or offline
    const geminiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2500)
    );

    const raceResult = await Promise.race([geminiPromise, timeoutPromise]);
    const answer = (raceResult && 'text' in raceResult && raceResult.text) ? raceResult.text : curatedFallback;

    return res.json({
      answer,
      source: raceResult ? 'gemini' : 'curated-expert',
      model: raceResult ? 'gemini-3.8-flash' : 'Process Control Knowledge Engine',
    });
  } catch (error) {
    console.error('Gemini API query error:', error);
    return res.json({
      answer: curatedFallback,
      source: 'curated-fallback',
      model: 'Process Control Knowledge Engine',
    });
  }
});

function getCuratedAnswer(question: string, stage?: number): string {
  const q = question.toLowerCase();
  if (q.includes('square root') || q.includes('sqrt') || q.includes('torricelli') || q.includes('outflow')) {
    return "Great question! Outflow depends on $\\sqrt{h}$ because of Torricelli's Law ($v = \\sqrt{2gh}$). Imagine diving to the bottom of a 4-meter swimming pool versus a 1-meter kiddie pool: the weight of all that water above creates hydrostatic pressure ($P = \\rho g h$). That pressure turns into kinetic energy ($\\frac{1}{2} \\rho v^2$) as water shoots out of the hole. Because kinetic energy goes with $v^2$, the speed $v$ (and flow $q_o$) grows with the square root of height ($\\sqrt{h}$). Quadrupling the height only doubles the outflow speed!";
  }
  if (q.includes('steady state') || q.includes('stop rising') || q.includes('overflow')) {
    return "Steady state is like a financial budget where income exactly equals expenses: Inflow = Outflow! When you open the valve more, water starts accumulating, so the water level goes up. But as it gets deeper, the bottom drain squirts faster and faster! Eventually, the water level reaches the exact height where the exit nozzle pours out whatever you are pouring in. At that magic point, $\\frac{dh}{dt} = 0$, and the level stops changing.";
  }
  if (q.includes('linear') || q.includes('taylor') || q.includes('straight line')) {
    return "Think about Earth: our planet is a sphere (curved), but standing in your living room, the floor feels totally flat! Taylor series linearization does the exact same trick. The true outflow curve is $\\sqrt{h}$, which curves downwards. But if your system only jiggles a tiny bit around its normal operating point $\\bar{h}$, the curve is virtually indistinguishable from a straight tangent line with slope $1/R = \\frac{C_v}{2\\sqrt{\\bar{h}}}$.";
  }
  if (q.includes('deviation') || q.includes('prime') || q.includes('zero') || q.includes('h\'')) {
    return "Imagine your thermostat is normally set to 70°F. If someone asks 'how cold is it in the room right now?', you don't say 'it is 68°F relative to absolute zero (-460°F)'. You say 'it is 2 degrees below normal'. Deviation variables ($h'(t) = h(t) - \\bar{h}$) reset our baseline to 0. This makes calculus equations dramatically simpler because the constant steady-state numbers cancel out, and the starting value at $t=0$ is cleanly zero ($h'(0) = 0$)!";
  }
  if (q.includes('laplace') || q.includes(' s ') || q.includes('transfer function') || q.includes('pole')) {
    return "Laplace transforms are the ultimate mathematical converter! Solving differential equations in time involves calculus (derivatives, integrals, exponential decay). Converting to the frequency domain '$s$' turns derivatives ($\\frac{dh'}{dt}$) into simple high school multiplication by $s$! The transfer function $G(s) = \\frac{K}{\\tau s + 1}$ directly tells you: steady-state gain $K$ determines the final height change, and the pole at $s = -1/\\tau$ determines how quickly it gets there.";
  }
  return "In industrial process dynamics, we model physical systems by balancing conserved quantities: Accumulation = In - Out. As the liquid level shifts, the outlet resistance and tank cross-section dictate how fast the process reaches its new steady state. Try testing different valve inputs in the tank to see this firsthand!";
}

// In development, hook Vite middleware; in production serve static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Process Dynamics Socratic Applet listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
