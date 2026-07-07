/**
 * HttpSection Component
 * ---------------------
 * Visualizes raw HTTP/1.0 request construction and response parsing over TCP sockets.
 * Shows formatted request headers, response status codes, server latency,
 * and expandable response body preview.
 */
import React, { useState } from "react";
import { motion } from "framer-motion";

export function HttpSection({ events }) {
  const [showAllHeaders, setShowAllHeaders] = useState(false);

  if (!events || events.length === 0) return null;

  const sendingEvents = events.filter(e => e.step === "http_sending");
  const responseEvents = events.filter(e => e.step === "http_response");
  
  const reqEvent = sendingEvents[0];
  const resEvent = responseEvents[responseEvents.length - 1];

  // Parse headers string into [key, value] pairs
  let parsedHeaders = [];
  if (typeof resEvent?.headers === 'string') {
    const lines = resEvent.headers.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        parsedHeaders.push([key, val]);
      } else if (!line.startsWith("HTTP/")) {
        parsedHeaders.push([line, ""]);
      }
    });
  } else if (resEvent?.headers && typeof resEvent.headers === 'object') {
    parsedHeaders = Object.entries(resEvent.headers);
  }

  const getStatusColor = (status) => {
    if (!status) return 'var(--text-dim)';
    if (status.includes("200")) return '#10b981'; // Green
    if (status.includes("30") || status.includes("40")) return '#f59e0b'; // Warning orange
    if (status.includes("50")) return 'var(--error)';
    return 'var(--text-dim)';
  };

  const statusColor = getStatusColor(resEvent?.status_line);

  // Filter for key headers
  const keyHeaderNames = ['location', 'content-type', 'server', 'content-length'];
  const summaryHeaders = parsedHeaders.filter(([k]) => keyHeaderNames.includes(k.toLowerCase()));
  const displayHeaders = showAllHeaders ? parsedHeaders : (summaryHeaders.length > 0 ? summaryHeaders : parsedHeaders.slice(0, 4));

  const rawRequest = reqEvent?.request || reqEvent?.message || "";

  const bodyPreview = resEvent?.body_preview || "";

  const getSummaryMessage = () => {
    const statusStr = (resEvent?.status_line || "").toString().trim();
    const codeMatch = statusStr.match(/\b([1-5]\d{2})\b/);
    const code = codeMatch ? codeMatch[1] : statusStr;

    const locationEntry = parsedHeaders.find(([k]) => k.toLowerCase() === 'location');
    const locationVal = locationEntry ? locationEntry[1] : 'another URL';

    if (code.startsWith("200") || statusStr.includes("200")) {
      return "Server returned the page successfully with full HTML content.";
    } else if (code.startsWith("301") || code.startsWith("302") || statusStr.includes("301") || statusStr.includes("302")) {
      return `Server replied with a redirect \u2014 sending your browser to ${locationVal} instead.`;
    } else if (code.startsWith("4")) {
      return "Server rejected the request with a client error.";
    } else if (code.startsWith("5")) {
      return "Server encountered an internal error.";
    }
    return "Server processed the request and replied with an HTTP status response.";
  };

  return (
    <motion.div
      className="section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <span className="section-number">05 &mdash;</span> HTTP Client
      </div>

      <div className="http-container" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'stretch' }}>
        {reqEvent && (
          <div className="http-request card-3d" style={{ padding: '1rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Request</div>
            <pre className="http-body" style={{ background: 'var(--surface-light)', padding: '0.75rem', borderRadius: '6px', fontFamily: 'var(--font-data)', fontSize: '0.85rem', flex: '1', whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.4', overflowX: 'auto' }}>
              {rawRequest.replace(/\r\n/g, '\n')}
            </pre>
          </div>
        )}

        {reqEvent && resEvent && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wire)' }}>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 40, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ height: '2px', background: 'var(--border)', position: 'relative' }}
            >
              <div style={{ position: 'absolute', right: '-8px', top: '-11px', fontSize: '1.2rem', color: 'var(--border)' }}>&rarr;</div>
            </motion.div>
          </div>
        )}

        {resEvent && (
          <motion.div
            className="http-response card-3d"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ padding: '1.25rem', flex: '2', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Response</div>
              <div style={{ 
                background: `${statusColor}15`, 
                color: statusColor, 
                padding: '0.4rem 0.75rem', 
                borderRadius: '20px', 
                fontFamily: 'var(--font-display)', 
                fontWeight: 700,
                fontSize: '1.1rem',
                border: `1px solid ${statusColor}40`
              }}>
                {resEvent.status_line || "HTTP/1.1 200 OK"}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <table className="http-headers-table" style={{ margin: 0, width: '100%' }}>
                <tbody>
                  {displayHeaders.map(([key, val], i) => (
                    <tr key={i}>
                      <td className="header-key" style={{ padding: '0.3rem 0', width: '35%', fontWeight: 600 }}>{key}</td>
                      <td className="header-value" style={{ padding: '0.3rem 0', fontFamily: 'var(--font-data)', wordBreak: 'break-all' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {parsedHeaders.length > displayHeaders.length && (
                <button 
                  onClick={() => setShowAllHeaders(!showAllHeaders)}
                  style={{ background: 'none', border: 'none', color: 'var(--wire)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.5rem 0', marginTop: '0.25rem', fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  {showAllHeaders ? "Collapse headers" : `View all ${parsedHeaders.length} headers`}
                </button>
              )}
            </div>

            {bodyPreview && (
              <div style={{ position: 'relative', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Body Preview</div>
                <div className="http-body" style={{ 
                  background: 'var(--surface-light)', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  fontFamily: 'var(--font-data)', 
                  fontSize: '0.8rem',
                  maxHeight: '4.5em',
                  lineHeight: '1.5em',
                  overflow: 'hidden',
                  position: 'relative',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap'
                }}>
                  {bodyPreview}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2.5em',
                    background: 'linear-gradient(transparent, var(--surface-light))',
                    borderRadius: '0 0 6px 6px'
                  }}></div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {resEvent && (
        <div className="http-context" style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text)', marginTop: '2rem', lineHeight: '1.6' }}>
          Your browser initiated an HTTP GET request to download the webpage content. The server processed the request and replied with a <strong style={{ color: statusColor }}>{resEvent.status_line || '200 OK'}</strong> status code &mdash; <span style={{ color: 'var(--text)', fontWeight: 500 }}>{getSummaryMessage()}</span>
        </div>
      )}
    </motion.div>
  );
}
