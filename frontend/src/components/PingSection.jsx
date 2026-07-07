/**
 * PingSection Component
 * ---------------------
 * Visualizes ICMP Echo Request and Reply packets.
 * Shows round-trip time (RTT), sequence numbers, TTL, and manual checksum verification
 * along with animated numerical counters.
 */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ByteTile } from "./ByteTile";

// Animated number counter for smooth RTT and metric transitions
function Counter({ from, to }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let start = null;
    const duration = 1000;
    
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * (to - from) + from));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [from, to]);

  return <span>{count}</span>;
}

export function PingSection({ events }) {
  if (!events || events.length === 0) return null;

  const sendingEvents = events.filter(e => e.step === "ping_sending");
  const responseEvents = events.filter(e => e.step === "ping_response");
  const resolvedEvent = events.find(e => e.step === "ping_resolved");
  const packetEvent = events.find(e => e.step === "ping_packet_built");
  const errorEvent = events.find(e => e.step.includes("error") || e.step.includes("failed"));
  
  const lastResponse = responseEvents[responseEvents.length - 1];
  const rtt = lastResponse?.rtt_ms || 0;
  
  // Attempt to find IP across multiple event types just in case
  const targetIp = resolvedEvent?.ip || responseEvents[0]?.ip || responseEvents[0]?.hop_ip || events.find(e => e.ip)?.ip;

  const targetDomainMatch = resolvedEvent?.message?.match(/Resolved (.+) to /);
  const targetDomain = targetDomainMatch ? targetDomainMatch[1] : "Target Server";

  return (
    <motion.div
      className="section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <span className="section-number">02 &mdash;</span> Ping
      </div>

      {errorEvent ? (
        <div className="ping-error card-3d" style={{ borderColor: 'var(--error)', backgroundColor: 'rgba(255, 84, 112, 0.05)' }}>
          <strong style={{ color: 'var(--error)', display: 'block', marginBottom: '0.5rem' }}>Ping Failed</strong>
          <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            Your computer tried to send a tiny "are you there?" message, but the connection failed. 
            ({errorEvent.message})
          </span>
        </div>
      ) : (
        <>
          <div className="ping-container">
            <div className="ping-node" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', minWidth: '160px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>Your Machine</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Source</div>
              <div style={{ 
                background: 'var(--surface)', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid var(--border)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-data)',
                color: 'var(--wire)'
              }}>
                Local Network
              </div>
            </div>
            
            <div className="ping-line-container" style={{ flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ping-line"></div>
                
                {sendingEvents.length > 0 && (
                  <div style={{ position: 'absolute', top: '-25px', fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600, textAlign: 'center' }}>
                    <div>ECHO REQUEST &rarr;</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>(Type 8, Code 0)</div>
                  </div>
                )}

                {responseEvents.length > 0 && (
                  <div style={{ position: 'absolute', bottom: '-25px', fontSize: '0.75rem', color: '#00A896', fontWeight: 600, textAlign: 'center' }}>
                    <div>&larr; ECHO REPLY</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 'normal' }}>(Type 0, Code 0)</div>
                  </div>
                )}
                
                {/* Outbound pulse */}
                {sendingEvents.map((_, i) => (
                  <motion.div
                    key={`send-${i}`}
                    className="ping-pulse"
                    initial={{ left: "0%", opacity: 1 }}
                    animate={{ left: "100%", opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                ))}

                {/* Inbound pulse */}
                {responseEvents.map((_, i) => (
                  <motion.div
                    key={`resp-${i}`}
                    className="ping-pulse"
                    style={{ background: '#00A896', boxShadow: '0 0 10px #00A896' }}
                    initial={{ left: "100%", opacity: 1 }}
                    animate={{ left: "0%", opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                ))}

                {rtt > 0 && (
                  <div className="ping-rtt" style={{ top: '-35px' }}>
                    <Counter from={0} to={rtt} /> ms
                  </div>
                )}
              </div>
              
              {packetEvent?.bytes && (
                <div style={{ marginTop: '0.5rem', transform: 'scale(0.8)' }}>
                  <ByteTile hex={packetEvent.bytes} />
                </div>
              )}
            </div>

            <div className="ping-node" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', minWidth: '160px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{targetDomain}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Target Server</div>
              <div style={{ 
                background: 'var(--surface)', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid var(--border)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-data)',
                color: 'var(--wire)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>{targetIp || "Unknown IP"}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>ICMP Target</span>
              </div>
            </div>
          </div>
          
          {rtt > 0 && (
            <div className="ping-context" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text)', marginTop: '1.5rem', lineHeight: '1.5' }}>
              Your computer sent a tiny "are you there?" message (ICMP echo request) and {targetDomain} replied in {rtt}ms &mdash; that's the round-trip time across the internet.
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
