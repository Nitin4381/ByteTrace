/**
 * ByteTrace — Live Network Protocol Visualizer
 * -------------------------------------------
 * Main application component managing real-time WebSocket connection to the backend,
 * multi-stage interactive trace wizard (DNS -> Ping -> Traceroute -> Port Scan -> HTTP),
 * and header tab navigation.
 */
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";

// Section Components
import { DnsSection } from "./components/DnsSection";
import { PingSection } from "./components/PingSection";
import { TracerouteSection } from "./components/TracerouteSection";
import { PortScanSection } from "./components/PortScanSection";
import { HttpSection } from "./components/HttpSection";
import { OverviewSection } from "./components/OverviewSection";
import { AboutSection } from "./components/AboutSection";

/**
 * Filters and groups raw WebSocket trace events by protocol stage
 * to render them into their respective section components.
 */
function categorizeEvents(events) {
  const categorized = {
    dns: [],
    ping: [],
    traceroute: [],
    portscan: [],
    http: [],
  };

  events.forEach(evt => {
    if (evt.step.startsWith("dns_") && !evt.step.endsWith("_complete") && !evt.step.endsWith("_done")) categorized.dns.push(evt);
    else if (evt.step.startsWith("ping_") && !evt.step.endsWith("_complete") && !evt.step.endsWith("_done")) categorized.ping.push(evt);
    else if (evt.step.startsWith("traceroute_") && !evt.step.endsWith("_complete") && !evt.step.endsWith("_done")) categorized.traceroute.push(evt);
    else if (evt.step.startsWith("portscan_") && !evt.step.endsWith("_complete") && !evt.step.endsWith("_done")) categorized.portscan.push(evt);
    else if (evt.step.startsWith("http_") && !evt.step.endsWith("_complete") && !evt.step.endsWith("_done")) categorized.http.push(evt);
  });

  return categorized;
}

function getNextButtonLabel(stageIndex) {
  switch (stageIndex) {
    case 0:
      return "Run Ping \u2192";
    case 1:
      return "Run Traceroute \u2192";
    case 2:
      return "Run Port Scan \u2192";
    case 3:
      return "Run HTTP Probe \u2192";
    default:
      return "Continue \u2192";
  }
}

const STAGES = ["dns", "ping", "traceroute", "portscan", "http", "overview"];
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8888/trace';

function App() {
  const [activeTab, setActiveTab] = useState("trace");
  const [target, setTarget] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [dnsMode, setDnsMode] = useState("recursive");
  
  // Real-Time Wizard State
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [stageComplete, setStageComplete] = useState(false);
  const [backendError, setBackendError] = useState(false);
  
  const wsRef = useRef(null);

  /**
   * Establishes or reuses a persistent WebSocket connection to the backend trace engine.
   * Handles incoming binary/JSON packet logs and progression signals.
   */
  const getOrConnectWs = useCallback((onConnected) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (onConnected) onConnected(wsRef.current);
      return;
    }

    setBackendError(false);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setBackendError(false);
      if (onConnected) onConnected(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.step === "complete") {
        setCurrentStageIndex(5);
        setStageComplete(false);
        setVisibleEvents((prev) => [...prev, data]);
      } else if (data.step.endsWith("_done") || data.step.endsWith("_complete")) {
        if (data.step !== "http_done" && data.step !== "http_complete") {
          setStageComplete(true);
        }
      } else {
        setVisibleEvents((prev) => [...prev, data]);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        setIsRunning(false);
        setBackendError(true);
      }
    };
    ws.onerror = () => {
      if (wsRef.current === ws) {
        setIsRunning(false);
        setBackendError(true);
      }
    };
  }, []);

  useEffect(() => {
    getOrConnectWs();
    return () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [getOrConnectWs]);

  /**
   * Initiates the protocol trace wizard starting with Stage 1: DNS Resolution.
   */
  const startTrace = () => {
    const targetDomain = target.trim() || "google.com";
    if (!target.trim()) setTarget(targetDomain);

    setVisibleEvents([]);
    setCurrentStageIndex(0);
    setStageComplete(false);
    setIsRunning(true);
    setBackendError(false);

    getOrConnectWs((ws) => {
      ws.send(JSON.stringify({ command: "start_dns", target: targetDomain, dns_mode: dnsMode }));
    });
  };

  /**
   * Advances the trace wizard to the next networking stage (Ping, Traceroute, Port Scan, HTTP).
   */
  const handleNext = () => {
    const nextStageIndex = currentStageIndex + 1;
    setCurrentStageIndex(nextStageIndex);
    setStageComplete(false); // Hide the next button while backend works
    setBackendError(false);

    const nextStage = STAGES[nextStageIndex];
    if (nextStage !== "overview") {
      getOrConnectWs((ws) => {
        ws.send(JSON.stringify({ command: `start_${nextStage}`, target: target.trim() || "google.com" }));
      });
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close();
    }
    wsRef.current = null;
    setIsRunning(false);
    setCurrentStageIndex(-1);
    setVisibleEvents([]);
    setStageComplete(false);
  };

  const categorized = useMemo(() => categorizeEvents(visibleEvents), [visibleEvents]);
  const showSelector = currentStageIndex === -1;

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">ByteTrace</h1>
        <p className="tagline">Interactive Educational Network Trace</p>

        <div className="tab-nav-container">
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === "trace" ? "active" : ""}`}
              onClick={() => setActiveTab("trace")}
            >
              <span className="tab-icon">⚡</span>
              <span>Trace</span>
              {activeTab === "trace" && (
                <motion.div className="tab-indicator" layoutId="tab-indicator" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              <span className="tab-icon">ℹ️</span>
              <span>About</span>
              {activeTab === "about" && (
                <motion.div className="tab-indicator" layoutId="tab-indicator" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === "trace" ? (
          <motion.div
            key="trace-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <AnimatePresence>
              {backendError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="backend-notice-banner"
                >
                  <div className="backend-notice-icon">⚠️</div>
                  <div className="backend-notice-content">
                    <h4>Backend Server Offline</h4>
                    <p>ByteTrace requires its FastAPI backend engine running on port 8000 to execute raw network sockets. Please open a terminal and run:</p>
                    <div className="backend-cmd-box">
                      <code>cd backend && uvicorn main:app --reload --port 8000</code>
                      <button
                        className="copy-cmd-btn"
                        onClick={() => {
                          navigator.clipboard.writeText("cd backend && uvicorn main:app --reload --port 8000");
                        }}
                        title="Copy command"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <button className="backend-notice-close" onClick={() => setBackendError(false)} title="Dismiss">✕</button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`input-section ${showSelector ? "stacked" : "compact"}`}>
        <input
          className="target-input"
          placeholder="google.com"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startTrace()}
          disabled={isRunning && currentStageIndex === -1}
        />

        {showSelector && (
          <div className="dns-mode-cards">
            <div
              className={`dns-mode-card ${dnsMode === "simple" ? "selected" : ""}`}
              onClick={() => setDnsMode("simple")}
            >
              <div className="dns-mode-card-header">
                <span className="dns-mode-label">Simple DNS</span>
                <span className="dns-mode-badge">~50ms</span>
              </div>
              <p className="dns-mode-desc">
                Asks Google&apos;s DNS server (8.8.8.8) directly &mdash; fast, one-hop resolution
              </p>
            </div>

            <div
              className={`dns-mode-card ${dnsMode === "recursive" ? "selected" : ""}`}
              onClick={() => setDnsMode("recursive")}
            >
              <div className="dns-mode-card-header">
                <span className="dns-mode-label">Recursive DNS</span>
                <span className="dns-mode-badge">~3 hops</span>
              </div>
              <p className="dns-mode-desc">
                Traces the full DNS hierarchy: Root &rarr; TLD &rarr; Authoritative server &mdash; shows exactly how DNS really works
              </p>
            </div>
          </div>
        )}

        {showSelector ? (
          <button
            className="trace-button"
            onClick={startTrace}
            disabled={isRunning && currentStageIndex === -1}
          >
            {isRunning && currentStageIndex === -1
              ? "Starting..."
              : "Start DNS Resolution"}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="trace-button"
              onClick={startTrace}
              title="Restart trace from DNS"
            >
              Restart Trace
            </button>
            <button
              onClick={handleDisconnect}
              title="Close WebSocket connection and reset wizard"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-light)',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                height: '42px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--error)';
                e.currentTarget.style.color = 'var(--error)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text)';
              }}
            >
              <span>✕</span> Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="timeline">
        <AnimatePresence>
          {currentStageIndex >= 0 && categorized.dns.length > 0 && <DnsSection events={categorized.dns} key="dns" />}
          {currentStageIndex >= 1 && categorized.ping.length > 0 && <PingSection events={categorized.ping} key="ping" />}
          {currentStageIndex >= 2 && categorized.traceroute.length > 0 && <TracerouteSection events={categorized.traceroute} key="traceroute" />}
          {currentStageIndex >= 3 && <PortScanSection events={categorized.portscan} key="portscan" />}
          {currentStageIndex >= 4 && categorized.http.length > 0 && <HttpSection events={categorized.http} key="http" />}
          
          {visibleEvents.some(e => e.step === "complete") && <OverviewSection events={visibleEvents} categorized={categorized} key="overview" />}
        </AnimatePresence>

        {stageComplete && currentStageIndex < STAGES.length - 1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="next-step-container"
            style={{ textAlign: 'center', margin: '3rem 0', paddingBottom: '2rem' }}
          >
            <button 
              className="trace-button"
              onClick={handleNext}
              style={{ padding: '1rem 3rem', fontSize: '1.1rem', backgroundColor: '#1A1D23' }}
            >
              {getNextButtonLabel(currentStageIndex)}
            </button>
          </motion.div>
        )}

        {visibleEvents.some(e => e.step === "complete") && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', margin: '3rem 0', paddingBottom: '3rem' }}
          >
            <button 
              onClick={handleDisconnect}
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                backgroundColor: '#00A896',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                boxShadow: '0 4px 15px rgba(0, 168, 150, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '1.2rem' }}>✕</span> Close Connection & Start New Trace
            </button>
          </motion.div>
        )}
      </div>
          </motion.div>
        ) : (
          <motion.div
            key="about-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <AboutSection onStartTrace={() => setActiveTab("trace")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
