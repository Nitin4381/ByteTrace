/**
 * PortScanSection Component
 * -------------------------
 * Visualizes asynchronous TCP connection attempts across 15 common service ports.
 * Displays real-time status of each port (open vs closed/filtered), service identification,
 * and scanning progression.
 */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function PortScanSection({ events }) {
  const [isScanning, setIsScanning] = useState(true);

  const allPortsMap = new Map();
  if (events) {
    events.forEach(evt => {
      if (evt.step === "portscan_result" || evt.step === "portscan_trying") {
        const existing = allPortsMap.get(evt.port);
        const isOpen = evt.status === "open" || (existing && existing.open);
        allPortsMap.set(evt.port, {
          port: evt.port,
          service: evt.service,
          open: Boolean(isOpen)
        });
      } else if (evt.open_ports) {
        evt.open_ports.forEach(p => {
          allPortsMap.set(p.port, { port: p.port, service: p.service, open: true });
        });
      }
    });
  }

  const ports = Array.from(allPortsMap.values()).sort((a, b) => a.port - b.port);

  useEffect(() => {
    if (ports.length > 0) {
      setIsScanning(false);
    } else {
      const timer = setTimeout(() => {
        setIsScanning(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [ports.length]);

  return (
    <motion.div
      className="section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <span className="section-number">04 &mdash;</span> Port Scan
      </div>

      <div className="portscan-context card-3d" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface-light)' }}>
        <div style={{ textAlign: 'center', width: '25%' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>Your Machine</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Scanner</div>
        </div>
        
        <div style={{ textAlign: 'center', width: '50%', position: 'relative' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.2rem' }}>TCP SYN &rarr;</div>
          <div style={{ width: '100%', height: '2px', background: 'var(--border)', margin: '0.5rem 0' }}></div>
          <div style={{ fontSize: '0.8rem', color: '#00A896', fontWeight: 600, marginTop: '0.2rem' }}>&larr; TCP SYN-ACK (if open)</div>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginTop: '1rem', lineHeight: '1.4' }}>
            Checking 15 common ports to discover active services.
            <br/>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>(RST received for closed ports)</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', width: '25%' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>Target Server</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Destination</div>
        </div>
      </div>

      {isScanning ? (
        <div className="scanning-simulation card-3d" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)' }}>
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--wire)', borderRadius: '50%', margin: '0 auto 1.5rem auto' }}
          />
          <div style={{ fontFamily: 'var(--font-data)', color: 'var(--wire)', fontSize: '1.1rem', fontWeight: 600 }}>
            Probing Target Ports...
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Sending 15 TCP SYN packets and awaiting responses
          </div>
        </div>
      ) : (
        <div className="port-grid perspective-container">
          {ports.length > 0 ? (
            ports.map((p, i) => (
              <motion.div
                key={i}
                className={`port-tile ${p.open ? 'open' : 'closed'}`}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, type: "spring" }}
              >
                <div className="port-number">{p.port}</div>
                <div className="port-service" style={{ marginBottom: '0.65rem' }}>{p.service}</div>
                <div 
                  className="port-status-badge"
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.05em',
                    backgroundColor: p.open ? 'rgba(0, 168, 150, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                    color: p.open ? '#00A896' : 'var(--text-dim)',
                    border: `1px solid ${p.open ? 'rgba(0, 168, 150, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`
                  }}
                >
                  {p.open ? "● OPEN" : "CLOSED"}
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem', gridColumn: '1 / -1' }}>
              No open ports detected.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
