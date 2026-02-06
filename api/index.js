module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, q, cik, type } = req.query;

  try {
    if (action === 'search' && q) {
      const r = await fetch('https://www.sec.gov/files/company_tickers.json', {
        headers: { 'User-Agent': 'Metly contact@metly.ai' }
      });
      const data = await r.json();
      const results = Object.values(data)
        .filter(c => c.ticker?.toLowerCase().includes(q.toLowerCase()) || c.title?.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 15)
        .map(c => ({ cik: String(c.cik_str).padStart(10, '0'), ticker: c.ticker, name: c.title }));
      return res.json({ results });
    }

    if (action === 'filings' && cik) {
      const r = await fetch(`https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`, {
        headers: { 'User-Agent': 'Metly contact@metly.ai' }
      });
      const data = await r.json();
      const recent = data.filings?.recent || {};
      const filings = [];
      for (let i = 0; i < Math.min(10, recent.form?.length || 0); i++) {
        if (!type || recent.form[i]?.includes(type)) {
          filings.push({
            form: recent.form[i],
            date: recent.filingDate[i],
            url: `https://www.sec.gov/Archives/edgar/data/${cik.padStart(10,'0')}/${recent.accessionNumber[i]?.replace(/-/g,'')}/${recent.primaryDocument[i]}`
          });
        }
      }
      return res.json({ name: data.name, cik: data.cik, filings });
    }

    return res.json({ status: 'ok', try: '?action=search&q=pfizer' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
