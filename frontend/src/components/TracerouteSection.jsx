/**
 * TracerouteSection Component
 * ---------------------------
 * Visualizes network routing path discovery by tracking incremental TTL values.
 * Displays each intermediate router hop, round-trip time (RTT), IP address,
 * and real-time geographical location (GeoIP lookup).
 */
import React from "react";
import { motion } from "framer-motion";

export function TracerouteSection({ events }) {
  console.log("TracerouteSection events prop:", events);
  if (!events || events.length === 0) return null;

  const hopEvents = events.filter(evt => evt.step === "traceroute_hop");
  console.log("Filtered hop events:", hopEvents);
  if (hopEvents.length === 0) return null;

  return (
    <motion.div
      className="section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <span className="section-number">03 &mdash;</span> Traceroute
      </div>

      <div className="traceroute-chain perspective-container">
        <div className="hop-line"></div>
        {hopEvents.map((evt, i) => {
          const isTimeout = evt.hop_ip === "*" || evt.hop_ip === null || evt.hop_ip === undefined;
          const isFinal = evt.message?.toLowerCase().includes("reached") || evt.icmp_type === 0;

          return (
            <motion.div
              key={i}
              className={`traceroute-hop ${isTimeout ? 'timeout' : ''} ${isFinal ? 'success' : ''}`}
              initial={{ opacity: 0, x: -30, rotateX: 45 }}
              animate={{ opacity: 1, x: 0, rotateX: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="hop-number">{evt.ttl || i + 1}</div>
              
              <div className="hop-details card-3d" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', width: '100%' }}>
                  <div className="hop-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span className="hop-ip" style={{ fontSize: '1.15rem', fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--text)' }}>
                      {isTimeout ? "* * *" : evt.hop_ip}
                    </span>
                    
                    {evt.hostname && evt.hostname !== null && evt.hostname !== evt.hop_ip && (
                      <span className="hop-geo" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {evt.hostname}
                      </span>
                    )}
                    
                    {evt.city && evt.city !== null && evt.country && evt.country !== null && 
                     evt.city !== "Unknown" && evt.city !== "Private Network" && 
                     evt.country !== "Unknown" && evt.country !== "Local" && (
                      <span className="hop-geo" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {evt.city}, {evt.country}
                      </span>
                    )}
                    
                    {evt.isp && evt.isp !== null && evt.isp !== "Unknown" && evt.isp !== "Internal" && (
                      <span className="hop-geo" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', opacity: 0.85 }}>
                        {evt.isp}
                      </span>
                    )}
                    
                    {isTimeout && <span className="hop-geo" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Request timed out</span>}
                  </div>
                  
                  {!isTimeout && evt.rtt_ms !== null && evt.rtt_ms !== undefined && (
                    <div className="hop-rtt" style={{ fontFamily: 'var(--font-data)', color: 'var(--wire)', fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                      {evt.rtt_ms}ms
                    </div>
                  )}
                </div>
                
                <div className="hop-context" style={{ fontSize: '0.85rem', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', lineHeight: '1.4' }}>
                  {i === 0 ? "This is your home router \u2014 the first stop for every packet you send." 
                    : isFinal ? `Destination reached! This is ${evt.hostname || evt.hop_ip}, the actual server hosting the website.`
                    : isTimeout ? "This router didn't reply \u2014 many networks hide this information for security, but your packet still passed through here."
                    : (evt.city && evt.city !== "Unknown" && evt.city !== "Private Network") ? `Packet passed through a router in ${evt.city}, ${evt.country}${evt.isp && evt.isp !== "Unknown" && evt.isp !== "Internal" ? `, operated by ${evt.isp}` : ''}.`
                    : "An internal ISP router \u2014 its exact location isn't published."}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
