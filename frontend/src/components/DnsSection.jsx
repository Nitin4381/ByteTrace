/**
 * DnsSection Component
 * --------------------
 * Visualizes the Domain Name System (DNS) resolution hierarchy.
 * Displays step-by-step UDP queries from Root -> TLD -> Authoritative servers,
 * along with interactive raw binary packet strips.
 */
import React from "react";
import { motion } from "framer-motion";
import { ByteTile } from "./ByteTile";

// Returns human-readable educational context for each step in DNS resolution
function getDnsContext(evt) {
  if (evt.step === "dns_start" || evt.step === "started") {
    return "ByteTrace is about to trace the full DNS hierarchy from scratch \u2014 starting at the internet's root servers.";
  }
  if (evt.step.includes("querying")) {
    if (evt.server_type === "Root") {
      return "Asking one of the 13 root servers that form the backbone of the entire internet's DNS system.";
    }
    if (evt.server_type === "TLD") {
      return "The root server referred us here \u2014 this TLD server manages all .com/.net/.org domains.";
    }
    if (evt.server_type === "Authoritative") {
      return "This is the actual nameserver responsible for this specific domain \u2014 it knows the real IP.";
    }
    return "Your computer asks a DNS server where to find the domain.";
  }
  if (evt.step.includes("referral")) {
    return "This server doesn't have the final answer but knows who does \u2014 it passes us to the next server in the chain.";
  }
  if (evt.step.includes("resolved")) {
    return "Final answer found! The authoritative nameserver confirmed the real IP address for this domain.";
  }
  if (evt.step.includes("packet_built")) {
    return "Constructing the raw UDP query packet according to RFC 1035 standards.";
  }
  if (evt.step.includes("sending")) {
    return "Transmitting the DNS query packet over UDP port 53.";
  }
  if (evt.step.includes("response")) {
    return "Received binary response packet from the DNS server.";
  }
  if (evt.step.includes("error") || evt.step.includes("failed")) {
    return "An error or timeout occurred while trying to contact this DNS server.";
  }
  return "Processing DNS resolution step.";
}

export function DnsSection({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <motion.div
      className="section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <span className="section-number">01 &mdash;</span> DNS Resolution
      </div>
      
      <div className="perspective-container">
        <div className="dns-graph">
          {/* Animated background connecting line */}
          <svg className="dns-connecting-line" preserveAspectRatio="none">
            <motion.line
              x1="0" y1="50%" x2="100%" y2="50%"
              stroke="var(--border)" strokeWidth="2"
              strokeDasharray="10 10"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>

          {events.map((evt, i) => {
            let label = "Unknown";
            if (evt.step === "dns_start" || evt.step === "started") label = "Initializing";
            else if (evt.step.includes("querying")) label = "Querying";
            else if (evt.step.includes("referral")) label = "Referral";
            else if (evt.step.includes("resolved")) label = "Resolved";
            else if (evt.step.includes("packet_built")) label = "Packet Built";
            else if (evt.step.includes("sending")) label = "Sending";
            else if (evt.step.includes("response")) label = "Response";
            else if (evt.step.includes("error")) label = "Error";
            else if (evt.step.includes("failed")) label = "Failed";
            
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2, duration: 0.3 }}
                    style={{ fontSize: '1.5rem', color: 'var(--wire)', zIndex: 2, padding: '0 0.25rem', display: 'flex', alignItems: 'center' }}
                  >
                    &rarr;
                  </motion.div>
                )}
                <motion.div
                  className="dns-node"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ delay: i * 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                >
                  <div className="card-3d" style={{ padding: '1rem', height: '100%' }}>
                    <div className="dns-type">{label}</div>
                    <div className="dns-ip" style={{ marginBottom: '0.75rem' }}>{evt.ip || evt.message}</div>
                    
                    <div className="dns-context" style={{ fontSize: '0.75rem', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', lineHeight: '1.4' }}>
                      {getDnsContext(evt)}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Show the last available bytes for the DNS response */}
      {events[events.length - 1]?.bytes && (
        <div style={{ marginTop: '2rem' }}>
          <div className="section-number" style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>RAW PACKET</div>
          <ByteTile hex={events[events.length - 1].bytes} delay={events.length * 0.2} />
        </div>
      )}
    </motion.div>
  );
}
