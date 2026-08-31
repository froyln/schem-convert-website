import React, { useEffect, useState } from 'react';

export default function App() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const [targets, setTargets] = useState([]);
  const [file, setFile] = useState(null);
  const [detected, setDetected] = useState(null);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showChanges, setShowChanges] = useState(false);

  useEffect(() => {
    fetch('/api/versions')
      .then((r) => r.json())
      .then((d) => {
        setTargets(d.targets);
        setTarget(d.targets[0]);
      })
      .catch(() => setError('Could not reach the server.'));
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  }

  async function handleFile(f) {
    setFile(f);
    setResult(null);
    setError(null);
    setDetected(null);
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const res = await fetch('/api/inspect', { method: 'POST', body: buf });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not inspect file');
      setDetected(data.label);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvert() {
    if (!file || !target) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch(`/api/convert?to=${encodeURIComponent(target)}`, {
        method: 'POST',
        headers: { 'X-Filename': file.name },
        body: buf,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      setResult(data);
      setShowChanges(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isPreFlattening = detected != null && /1\.12\.2|NBT 4/.test(detected);

  return (
    <div className="page">
      <header className="header">
        <h1>Schem Converter</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="panel">
        <label
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept=".litematic"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? file.name : 'Choose or drop a .litematic file'}
        </label>

        {detected && <p className="detected">Detected: {detected}</p>}
        {isPreFlattening && (
          <p className="warning" role="alert">
            Converting from 1.12.2 (pre-Flattening) is not supported for blocks, signs, or
            items — the result may be wrong.
          </p>
        )}

        <label className="field">
          Target version
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {targets.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <button
          className="convert"
          onClick={handleConvert}
          disabled={!file || !target || busy}
        >
          {busy ? 'Converting…' : 'Convert'}
        </button>

        <div aria-live="polite">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {result && (
            <div className="result">
              <button className="download" onClick={download}>
                Download {result.filename}
              </button>

              <button
                className="changes-toggle"
                onClick={() => setShowChanges((v) => !v)}
                aria-expanded={showChanges}
              >
                <span className={`chevron ${showChanges ? 'open' : ''}`}>▸</span>
                {showChanges ? 'Hide changes' : 'Show changes'}
              </button>
              <div className={`changes-body ${showChanges ? 'open' : ''}`}>
                <div>
                  <Report report={result.report} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

function Report({ report }) {
  const total = report.blocks.length + report.items.length + report.notes.length;
  if (total === 0) {
    return <p className="report-empty">No substitutions needed.</p>;
  }
  return (
    <div className="report">
      <ReportSection title="Blocks" lines={report.blocks} />
      <ReportSection title="Items" lines={report.items} />
      <ReportSection title="Notes" lines={report.notes} />
    </div>
  );
}

function ReportSection({ title, lines }) {
  if (lines.length === 0) return null;
  return (
    <div className="report-section">
      <h2>{title}</h2>
      <ul>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
