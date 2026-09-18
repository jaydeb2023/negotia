// Writes a completed practice session to Supabase.

import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { traineeName, transcript, outcome, casesOrdered, behaviourScore } = req.body;

    const { data, error } = await supabase.from('sessions').insert([
      {
        trainee_name: traineeName || 'Unknown',
        transcript,
        outcome: outcome || 'incomplete',
        cases_ordered: casesOrdered || 0,
        behaviour_score: behaviourScore || 0,
      },
    ]);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
