import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TradeData {
  time: string;
  price: number;
  volume: number;
  score: number;
  latency: number;
}

function generateMockTrade(prev?: TradeData): TradeData {
  const basePrice = prev ? prev.price : 67400;
  const delta = (Math.random() - 0.49) * 120;
  const score = Math.random() > 0.93 ? 0.82 + Math.random() * 0.15 : Math.random() * 0.75;
  return {
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    price: Math.max(65000, basePrice + delta),
    volume: score > 0.80 ? 8 + Math.random() * 40 : 0.1 + Math.random() * 2,
    score,
    latency: Math.floor(180 + Math.random() * 120),
  };
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  if (payload.score > 0.80) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={12} fill="rgba(255,24,1,0.2)" />
        <circle cx={cx} cy={cy} r={6} fill="#FF1801" />
        <circle cx={cx} cy={cy} r={2.5} fill="#fff" />
      </g>
    );
  }
  if (payload.score > 0.60) {
    return <circle cx={cx} cy={cy} r={3} fill="#FFD700" opacity={0.9} />;
  }
  return <circle cx={cx} cy={cy} r={2} fill="#39FF14" opacity={0.7} />;
};

const ScoreBar = ({ score }: { score: number }) => {
  const pct = Math.min(100, score * 100);
  const color = score > 0.80 ? '#FF1801' : score > 0.60 ? '#FFD700' : '#39FF14';
  const sectors = [33, 66, 100];
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ width: '100%', height: '6px', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, #39FF14, ${color})`,
          transition: 'width 0.2s ease',
          boxShadow: `0 0 8px ${color}80`,
        }} />
        {sectors.map(s => (
          <div key={s} style={{
            position: 'absolute', left: `${s}%`, top: 0, bottom: 0,
            width: '1px', background: '#1a1a1a',
          }} />
        ))}
      </div>
    </div>
  );
};

const Ticker = ({ value, prefix = '', suffix = '', decimals = 2, color = '#E8E8E0' }: any) => {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      prev.current = value;
    }
  }, [value]);
  return (
    <span style={{
      color: flash ? '#fff' : color,
      textShadow: flash ? `0 0 16px ${color}` : 'none',
      transition: 'color 0.15s, text-shadow 0.15s',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {prefix}{typeof value === 'number' ? value.toFixed(decimals) : value}{suffix}
    </span>
  );
};

const DRSIndicator = ({ active }: { active: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 14px',
    background: active ? '#00C800' : '#111',
    border: `1px solid ${active ? '#00C800' : '#222'}`,
    transition: 'all 0.1s',
    boxShadow: active ? '0 0 20px rgba(0,200,0,0.4)' : 'none',
  }}>
    <div style={{
      width: '8px', height: '8px',
      background: active ? '#fff' : '#333',
      clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
      transition: 'all 0.1s',
    }} />
    <span style={{
      fontSize: '10px', letterSpacing: '3px', fontFamily: 'var(--font-data)',
      color: active ? '#fff' : '#333', fontWeight: 'bold',
    }}>DRS</span>
  </div>
);

const TyreCompound = ({ score }: { score: number }) => {
  const compound = score > 0.80 ? { label: 'SOFT', color: '#FF1801', symbol: 'S' }
    : score > 0.60 ? { label: 'MEDIUM', color: '#FFD700', symbol: 'M' }
    : { label: 'HARD', color: '#E8E8E0', symbol: 'H' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%',
        border: `3px solid ${compound.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '9px', fontWeight: 'bold', color: compound.color,
        fontFamily: 'var(--font-data)',
        boxShadow: `0 0 8px ${compound.color}40`,
      }}>{compound.symbol}</div>
      <span style={{ fontSize: '8px', color: compound.color, letterSpacing: '2px', fontFamily: 'var(--font-data)' }}>
        {compound.label}
      </span>
    </div>
  );
};

const RPMGauge = ({ score }: { score: number }) => {
  const pct = score;
  const maxAngle = 240;
  const angle = -120 + pct * maxAngle;
  const r = 36;
  const cx = 44, cy = 44;
  const polarToCart = (deg: number, radius: number) => ({
    x: cx + radius * Math.cos((deg - 90) * Math.PI / 180),
    y: cy + radius * Math.sin((deg - 90) * Math.PI / 180),
  });
  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const start = polarToCart(startDeg, radius);
    const end = polarToCart(endDeg, radius);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };
  const needleTip = polarToCart(angle, r - 6);
  const needleBase1 = polarToCart(angle + 90, 4);
  const needleBase2 = polarToCart(angle - 90, 4);
  const color = score > 0.80 ? '#FF1801' : score > 0.60 ? '#FFD700' : '#39FF14';

  return (
    <svg width="88" height="88" style={{ overflow: 'visible' }}>
      {/* Track */}
      <path d={arcPath(-120, 120, r)} fill="none" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" />
      {/* Green zone */}
      <path d={arcPath(-120, -40, r)} fill="none" stroke="#39FF14" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
      {/* Yellow zone */}
      <path d={arcPath(-40, 60, r)} fill="none" stroke="#FFD700" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
      {/* Red zone */}
      <path d={arcPath(60, 120, r)} fill="none" stroke="#FF1801" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
      {/* Active arc */}
      <path d={arcPath(-120, angle, r)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      {/* Needle */}
      <polygon
        points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={5} fill="#111" stroke={color} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={2} fill={color} />
      {/* Score label */}
      <text x={cx} y={cy + 18} textAnchor="middle" fill={color} fontSize="9"
        fontFamily="'Barlow Condensed', monospace" fontWeight="700" letterSpacing="1">
        {(score * 100).toFixed(0)}
      </text>
    </svg>
  );
};

export default function App() {
  const [data, setData] = useState<TradeData[]>(() => {
    const seed: TradeData[] = [];
    let t: TradeData | undefined;
    for (let i = 0; i < 30; i++) { t = generateMockTrade(t); seed.push(t); }
    return seed;
  });
  const [latestTrade, setLatestTrade] = useState<TradeData>(data[data.length - 1]);
  const [isWhale, setIsWhale] = useState(false);
  const [whaleHistory, setWhaleHistory] = useState<TradeData[]>([]);
  const [tick, setTick] = useState(0);
  const [useWS, setUseWS] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lapTime, setLapTime] = useState(0);
  const [sector, setSector] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setLapTime(p => p + 0.1), 100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSector(s => s === 3 ? 1 : s + 1), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (useWS) return;
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const newTrade = generateMockTrade(last);
        newTrade.time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLatestTrade(newTrade);
        const anomaly = newTrade.score > 0.80;
        setIsWhale(anomaly);
        if (anomaly) setWhaleHistory(h => [newTrade, ...h].slice(0, 6));
        setTick(t => t + 1);
        return [...prev, newTrade].slice(-50);
      });
    }, 600);
    return () => clearInterval(interval);
  }, [useWS]);

  useEffect(() => {
    if (!useWS) return;
    const ws = new WebSocket('ws://localhost:8765');
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      const newTrade: TradeData = { time: new Date().toLocaleTimeString('en-US', { hour12: false }), ...incoming };
      setLatestTrade(newTrade);
      const anomaly = incoming.score > 0.80;
      setIsWhale(anomaly);
      setData(prev => [...prev, newTrade].slice(-50));
      if (anomaly) setWhaleHistory(prev => [newTrade, ...prev].slice(0, 6));
    };
    return () => ws.close();
  }, [useWS]);

  const priceColor = latestTrade.score > 0.80 ? '#FF1801' : latestTrade.score > 0.60 ? '#FFD700' : '#39FF14';
  const sessionHigh = Math.max(...data.map(d => d.price));
  const sessionLow = Math.min(...data.map(d => d.price));
  const avgScore = data.slice(-10).reduce((a, b) => a + b.score, 0) / Math.min(10, data.length);
  const formatLap = (s: number) => `${Math.floor(s / 60).toString().padStart(1,'0')}:${(s % 60).toFixed(1).padStart(4,'0')}`;

  return (
    <div style={{
      background: '#080808',
      color: '#E8E8E0',
      minHeight: '100vh',
      fontFamily: 'var(--font-data)',
      padding: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

        :root {
          --font-display: 'Barlow Condensed', sans-serif;
          --font-data: 'Barlow Condensed', monospace;
          --red: #FF1801;
          --yellow: #FFD700;
          --green: #39FF14;
          --carbon: #0d0d0d;
          --carbon-light: #141414;
          --border: #1e1e1e;
          --text-dim: #444;
          --text-mid: #888;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes drs-flash { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes sector-in { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1)} }
        @keyframes slide-up { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes flag-wave {
          0%{transform:skewX(0deg)} 25%{transform:skewX(-3deg)} 75%{transform:skewX(3deg)} 100%{transform:skewX(0deg)}
        }
        @keyframes alert-in { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes pit-blink { 0%,100%{background:#FF1801} 50%{background:#111} }

        .drs-active { animation: drs-flash 0.4s infinite; }
        .new-alert { animation: slide-up 0.25s ease; }
        .flag-anim { animation: flag-wave 2s ease-in-out infinite; }

        /* Carbon fiber texture */
        .carbon-bg {
          background-color: var(--carbon);
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.015) 2px,
              rgba(255,255,255,0.015) 4px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.01) 2px,
              rgba(255,255,255,0.01) 4px
            );
        }

        .tel-card {
          background: var(--carbon);
          background-image:
            repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px),
            repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px);
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        .tel-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #FF1801, transparent);
          opacity: 0.3;
        }

        .stat-pill {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 14px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .stat-pill::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
        }
        .stat-pill:nth-child(1)::before { background: #FF1801; }
        .stat-pill:nth-child(2)::before { background: #FFD700; }
        .stat-pill:nth-child(3)::before { background: #39FF14; }
        .stat-pill:nth-child(4)::before { background: #00C8FF; }
        .stat-pill:nth-child(5)::before { background: #FF6B35; }

        .sector-dot {
          width: 10px; height: 10px; border-radius: 50%;
          transition: all 0.3s;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #FF1801; }

        .f1-btn {
          background: transparent;
          border: 1px solid #222;
          color: #555;
          padding: 5px 14px;
          font-size: 9px;
          letter-spacing: 3px;
          cursor: pointer;
          font-family: var(--font-data);
          font-weight: 700;
          text-transform: uppercase;
          transition: all 0.15s;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
        }
        .f1-btn:hover { border-color: #FF1801; color: #FF1801; background: rgba(255,24,1,0.05); }

        .timing-row {
          display: grid;
          grid-template-columns: 28px 1fr 80px 70px 60px;
          align-items: center;
          padding: 7px 12px;
          border-bottom: 1px solid #0f0f0f;
          font-size: 11px;
          font-family: var(--font-data);
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: background 0.15s;
        }
        .timing-row:hover { background: #0f0f0f; }
      `}</style>

      {/* SAFETY CAR / DRS ALERT OVERLAY */}
      {isWhale && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: '#FF1801',
          padding: '6px 28px',
          display: 'flex', alignItems: 'center', gap: '20px',
          animation: 'alert-in 0.2s ease',
        }}>
          <div style={{
            display: 'flex', gap: '3px',
            animation: 'flag-wave 1s ease-in-out infinite',
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: '8px', height: '12px',
                background: i % 2 === 0 ? '#000' : '#FF1801',
                border: '1px solid rgba(0,0,0,0.3)',
              }} />
            ))}
          </div>
          <span style={{ fontSize: '11px', letterSpacing: '5px', fontFamily: 'var(--font-data)', fontWeight: 900, color: '#fff' }}>
            ANOMALY DETECTED — LARGE ORDER FLOW
          </span>
          <span style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-data)' }}>
            SCORE {latestTrade.score.toFixed(4)} · VOL {latestTrade.volume.toFixed(3)} BTC · {latestTrade.time}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: '10px', height: '10px',
                background: '#fff',
                animation: `pit-blink ${0.3 + i * 0.1}s infinite`,
                animationDelay: `${i * 0.06}s`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* HEADER — Pit Wall Display */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 28px',
        marginTop: isWhale ? '36px' : '0',
        borderBottom: '1px solid #1a1a1a',
        background: '#060606',
        transition: 'margin-top 0.2s',
      }}>
        {/* Team / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <div style={{
            background: '#FF1801',
            padding: '8px 16px',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            marginRight: '2px',
          }}>
            <span style={{
              fontSize: '15px', fontWeight: 900, letterSpacing: '3px',
              fontFamily: 'var(--font-display)', color: '#fff',
            }}>
              CHRONOS
            </span>
          </div>
          <div style={{
            background: '#111',
            padding: '8px 18px 8px 22px',
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          }}>
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '4px',
              fontFamily: 'var(--font-data)', color: '#555',
            }}>
              ANOMALY DETECTION ENGINE
            </span>
          </div>
        </div>

        {/* Center: Sector indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{ fontSize: '7px', color: '#333', letterSpacing: '1px', fontFamily: 'var(--font-data)' }}>S{s}</div>
              <div style={{
                width: '32px', height: '6px',
                background: sector === s ? (s === 1 ? '#39FF14' : s === 2 ? '#FFD700' : '#FF1801') : '#1a1a1a',
                transition: 'background 0.3s',
                boxShadow: sector === s ? `0 0 8px ${s === 1 ? '#39FF14' : s === 2 ? '#FFD700' : '#FF180180'}` : 'none',
              }} />
            </div>
          ))}
          <div style={{
            marginLeft: '12px', fontSize: '16px', fontWeight: 800,
            fontFamily: 'var(--font-display)', color: '#E8E8E0', letterSpacing: '2px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatLap(lapTime)}
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <DRSIndicator active={isWhale} />
          <div style={{
            fontSize: '9px', letterSpacing: '2px', fontFamily: 'var(--font-data)', fontWeight: 700,
            color: useWS ? (connected ? '#39FF14' : '#FF1801') : '#FFD700',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'currentColor',
              boxShadow: '0 0 6px currentColor',
            }} />
            {useWS ? (connected ? 'LIVE TIMING' : 'NO SIGNAL') : 'SIM MODE'}
          </div>
          <button className="f1-btn" onClick={() => setUseWS(v => !v)}>
            {useWS ? 'DISCONNECT' : 'CONNECT'}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: '16px 28px' }}>

        {/* TOP STATS — Timing Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: 'BTC / USD', value: latestTrade.price, prefix: '$', decimals: 2, color: priceColor, large: true, sub: 'CURRENT POSITION' },
            { label: 'SESSION HIGH', value: sessionHigh, prefix: '$', decimals: 2, color: '#E8E8E0', sub: 'FASTEST LAP' },
            { label: 'SESSION LOW', value: sessionLow, prefix: '$', decimals: 2, color: '#E8E8E0', sub: 'SECTOR BEST' },
            { label: 'INFERENCE', value: latestTrade.latency, prefix: '', decimals: 0, suffix: ' µs', color: '#00C8FF', sub: 'PIT STOP TIME' },
            { label: 'AVG SCORE', value: avgScore, prefix: '', decimals: 4, color: avgScore > 0.8 ? '#FF1801' : '#E8E8E0', sub: 'LAST 10 TICKS' },
          ].map((stat, i) => (
            <div key={i} className="stat-pill">
              <div style={{ fontSize: '8px', color: '#333', letterSpacing: '3px', fontFamily: 'var(--font-data)', fontWeight: 700, marginBottom: '6px' }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: stat.large ? '28px' : '20px',
                fontWeight: 800,
                lineHeight: 1,
                fontFamily: 'var(--font-display)',
              }}>
                <Ticker value={stat.value} prefix={stat.prefix} suffix={stat.suffix || ''} decimals={stat.decimals} color={stat.color} />
              </div>
              <div style={{ fontSize: '7px', color: '#222', letterSpacing: '2px', marginTop: '5px', fontFamily: 'var(--font-data)' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '12px' }}>

          {/* LEFT: Chart + Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* CHART */}
            <div className="tel-card" style={{ padding: '18px 20px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#333', letterSpacing: '4px', fontFamily: 'var(--font-data)', fontWeight: 700 }}>
                    TELEMETRY · TRADE STREAM
                  </div>
                  <div style={{ fontSize: '8px', color: '#222', marginTop: '3px', letterSpacing: '2px', fontFamily: 'var(--font-data)' }}>
                    LAST 50 DATA POINTS · LAP {Math.floor(tick / 10) + 1} · {tick} TICKS
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <TyreCompound score={latestTrade.score} />
                  <div style={{ display: 'flex', gap: '10px', fontSize: '8px', letterSpacing: '2px', fontFamily: 'var(--font-data)', fontWeight: 700 }}>
                    <span style={{ color: '#39FF1460' }}>■ NORMAL</span>
                    <span style={{ color: '#FFD70080' }}>■ WARNING</span>
                    <span style={{ color: '#FF180180' }}>■ ANOMALY</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <YAxis domain={['dataMin - 200', 'dataMax + 200']} hide />
                  <ReferenceLine y={sessionHigh} stroke="#FFD700" strokeDasharray="3 3" strokeOpacity={0.2} />
                  <ReferenceLine y={sessionLow} stroke="#39FF14" strokeDasharray="3 3" strokeOpacity={0.2} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isWhale ? '#FF1801' : '#ffffff15'}
                    strokeWidth={isWhale ? 2 : 1.5}
                    isAnimationActive={false}
                    dot={<CustomDot />}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Anomaly score bar (like DRS/ERS bar) */}
              <div style={{ marginTop: '14px', borderTop: '1px solid #0f0f0f', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#333', letterSpacing: '3px', fontFamily: 'var(--font-data)', fontWeight: 700 }}>
                    ERS · ANOMALY SCORE
                  </div>
                  <div style={{ fontSize: '10px', color: priceColor, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '1px' }}>
                    {latestTrade.score.toFixed(4)}
                  </div>
                </div>
                <ScoreBar score={latestTrade.score} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '7px', color: '#222', fontFamily: 'var(--font-data)', letterSpacing: '2px' }}>
                  <span>S1</span><span>S2</span><span>S3</span><span>FL</span>
                </div>
              </div>
            </div>

            {/* BOTTOM STRIP: Mini gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { label: 'ENGINE MODE', value: latestTrade.score > 0.8 ? 'PARTY' : 'STD', color: latestTrade.score > 0.8 ? '#FF1801' : '#39FF14' },
                { label: 'FUEL LOAD', value: `${(100 - (tick % 100)).toFixed(0)}%`, color: '#00C8FF' },
                { label: 'BRAKE BIAS', value: '57.4F', color: '#FFD700' },
                { label: 'DIFF ENTRY', value: '8%', color: '#888' },
              ].map((g, i) => (
                <div key={i} className="tel-card" style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: '7px', color: '#2a2a2a', letterSpacing: '3px', fontFamily: 'var(--font-data)', fontWeight: 700, marginBottom: '6px' }}>
                    {g.label}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-display)', color: g.color, letterSpacing: '1px' }}>
                    {g.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* RPM gauge + current score */}
            <div className="tel-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <RPMGauge score={latestTrade.score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', color: '#333', letterSpacing: '3px', fontFamily: 'var(--font-data)', fontWeight: 700, marginBottom: '8px' }}>
                  ANOMALY GAUGE
                </div>
                <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'var(--font-display)', color: priceColor, lineHeight: 1, letterSpacing: '-1px' }}>
                  <Ticker value={latestTrade.score} decimals={4} color={priceColor} />
                </div>
                <div style={{ fontSize: '8px', marginTop: '6px', color: '#333', fontFamily: 'var(--font-data)', letterSpacing: '2px' }}>
                  THRESHOLD: 0.8000 · {latestTrade.score > 0.8 ? '⚠ EXCEEDED' : 'WITHIN LIMITS'}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <ScoreBar score={latestTrade.score} />
                </div>
              </div>
            </div>

            {/* Timing Tower / Alert History */}
            <div className="tel-card" style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                padding: '10px 12px',
                borderBottom: '1px solid #111',
                background: '#060606',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '9px', color: '#333', letterSpacing: '3px', fontFamily: 'var(--font-data)', fontWeight: 700 }}>
                    TIMING TOWER
                  </div>
                  <div style={{
                    background: '#FF1801', color: '#fff',
                    fontSize: '8px', padding: '1px 6px', letterSpacing: '1px',
                    fontFamily: 'var(--font-data)', fontWeight: 700,
                  }}>
                    {whaleHistory.length}
                  </div>
                </div>
                <div style={{ fontSize: '8px', color: '#222', fontFamily: 'var(--font-data)', letterSpacing: '2px' }}>
                  ALERTS LOGGED
                </div>
              </div>

              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 80px 70px 60px',
                padding: '5px 12px',
                borderBottom: '1px solid #0f0f0f',
              }}>
                {['P', 'TIME', 'PRICE', 'VOL', 'SCORE'].map(h => (
                  <div key={h} style={{ fontSize: '7px', color: '#2a2a2a', letterSpacing: '2px', fontFamily: 'var(--font-data)', fontWeight: 700 }}>{h}</div>
                ))}
              </div>

              {whaleHistory.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '40px 20px', gap: '10px',
                }}>
                  <div style={{
                    width: '40px', height: '40px',
                    border: '2px solid #1a1a1a',
                    borderTop: '2px solid #FF1801',
                    borderRadius: '50%',
                    animation: 'spin 1.5s linear infinite',
                  }} />
                  <div style={{ fontSize: '9px', color: '#222', letterSpacing: '4px', fontFamily: 'var(--font-data)' }}>
                    FORMATION LAP...
                  </div>
                </div>
              ) : (
                <div>
                  {whaleHistory.map((w, i) => {
                    const sc = w.score > 0.80 ? '#FF1801' : w.score > 0.60 ? '#FFD700' : '#39FF14';
                    return (
                      <div key={i} className={`timing-row ${i === 0 ? 'new-alert' : ''}`} style={{
                        background: i === 0 ? 'rgba(255,24,1,0.05)' : 'transparent',
                        borderLeft: i === 0 ? '2px solid #FF1801' : '2px solid transparent',
                      }}>
                        <div style={{
                          width: '20px', height: '20px',
                          background: i === 0 ? '#FF1801' : '#111',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', fontWeight: 800, color: i === 0 ? '#fff' : '#333',
                          fontFamily: 'var(--font-display)',
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ color: '#444', fontSize: '10px', letterSpacing: '1px' }}>{w.time}</div>
                        <div style={{ color: '#E8E8E0', fontWeight: 700, fontSize: '11px' }}>${w.price.toFixed(0)}</div>
                        <div style={{ color: sc, fontWeight: 700, fontSize: '11px' }}>{w.volume.toFixed(2)}₿</div>
                        <div style={{ color: sc, fontWeight: 800, fontSize: '11px' }}>{w.score.toFixed(3)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Status — Pit Wall */}
            <div className="tel-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '8px', color: '#222', letterSpacing: '3px', fontFamily: 'var(--font-data)', fontWeight: 700, marginBottom: '10px' }}>
                PIT WALL STATUS
              </div>
              {[
                { label: 'MODEL', value: 'CHRONOS-7B', ok: true },
                { label: 'STREAM', value: useWS ? 'WS://8765' : 'SIM FEED', ok: true },
                { label: 'THRESHOLD', value: '0.8000', ok: true },
                { label: 'COMPOUND', value: latestTrade.score > 0.8 ? 'SOFT' : 'HARD', ok: latestTrade.score <= 0.8 },
                { label: 'ALERTS', value: `${whaleHistory.length} FLAGS`, ok: whaleHistory.length <= 3 },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 0', borderBottom: '1px solid #0c0c0c',
                }}>
                  <span style={{ fontSize: '8px', color: '#2a2a2a', letterSpacing: '2px', fontFamily: 'var(--font-data)', fontWeight: 700 }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: '10px', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '1px',
                    color: row.ok ? '#39FF14' : '#FF1801',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}