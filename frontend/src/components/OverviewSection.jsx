/**
 * OverviewSection Component
 * -------------------------
 * Renders the final summary report once all network trace stages are complete.
 * Aggregates statistics such as total DNS queries, hop counts, open ports found,
 * and HTTP response times into clean metric cards.
 */
import React from "react";
import { motion } from "framer-motion";

export function OverviewSection({ events, categorized }) {
  // Only show if we have a complete event
  const isComplete = events.some(e => e.step === "complete");
  if (!isComplete) return null;

  const dnsCount = categorized.dns.length;
  const traceCount = categorized.traceroute.filter(e => e.step === "traceroute_hop").length;
  
  let portCount = 0;
  categorized.portscan.forEach(e => {
    if (e.open_ports) portCount += e.open_ports.length;
  });

  const httpRes = categorized.http.find(e => e.step === "http_response");
  const httpStatus = httpRes?.status_line || "received response";

  const countries = new Set();
  categorized.traceroute.forEach(e => {
    if (e.country && e.country !== "Unknown") {
      countries.add(e.country);
    }
  });

  return (
    <motion.div
      className="overview-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="section-header" style={{ justifyContent: 'center' }}>
        <span className="section-number">06 &mdash;</span> Journey Complete
      </div>

      <div className="overview-diagram">
        <div className="overview-step">
          <div className="overview-icon">💻</div>
          <span className="overview-label">Local</span>
        </div>
        <div className="overview-arrow">→</div>
        <div className="overview-step">
          <div className="overview-icon">🌐</div>
          <span className="overview-label">DNS ({dnsCount} steps)</span>
        </div>
        <div className="overview-arrow">→</div>
        <div className="overview-step">
          <div className="overview-icon">🛣️</div>
          <span className="overview-label">{traceCount} Hops</span>
        </div>
        <div className="overview-arrow">→</div>
        <div className="overview-step">
          <div className="overview-icon">🎯</div>
          <span className="overview-label">Target</span>
        </div>
      </div>

      <p className="overview-summary">
        Resolved in <span className="highlight">{dnsCount}</span> steps, 
        reached destination in <span className="highlight">{traceCount}</span> traceroute hops
        {countries.size > 0 && <span> across <span className="highlight">{Array.from(countries).join(', ')}</span></span>}, 
        found <span className="highlight">{portCount}</span> open ports, 
        and received HTTP <span className="highlight">{httpStatus}</span>.
      </p>
    </motion.div>
  );
}
