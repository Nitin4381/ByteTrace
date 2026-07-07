/**
 * AboutSection Component
 * ----------------------
 * Displays project overview, architecture details, supported networking protocols,
 * technology stack badges, and author information for ByteTrace.
 */
import React from "react";
import { motion } from "framer-motion";

// Core technologies, libraries, and networking protocols used in ByteTrace
const TECH_STACK = [
  "Python",
  "Raw Sockets",
  "FastAPI",
  "WebSockets",
  "React",
  "Framer Motion",
  "GeoIP",
  "ICMP",
  "DNS",
  "TCP/UDP"
];

// Feature cards explaining how each protocol is built manually using raw Python sockets
const FEATURES = [
  {
    icon: "🌐",
    title: "DNS Resolution",
    badge: "UDP Sockets • Zero Libs",
    description: "Traces the full DNS hierarchy from Root servers → TLD servers → Authoritative servers, or direct Google server resolution (8.8.8.8). Built from raw UDP sockets with zero DNS libraries."
  },
  {
    icon: "🏓",
    title: "Ping",
    badge: "ICMP Echo • Manual Checksum",
    description: "Crafts ICMP echo request packets manually, calculates checksums from scratch, and measures round-trip time to any host."
  },
  {
    icon: "🛣️",
    title: "Traceroute",
    badge: "TTL Manipulation • GeoIP",
    description: "Manipulates TTL field on raw ICMP packets to reveal every router between you and your destination, with real-time GeoIP lookup."
  },
  {
    icon: "🔍",
    title: "Port Scanner",
    badge: "TCP Handshake • 15 Ports",
    description: "Attempts TCP connections to 15 common ports to discover which services a server is running."
  },
  {
    icon: "⚡",
    title: "HTTP Client",
    badge: "HTTP/1.0 over TCP",
    description: "Builds raw HTTP/1.0 requests over TCP sockets and parses the response — no HTTP libraries used."
  }
];

// Framer Motion animation variants for staggered entrance animations across cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export function AboutSection({ onStartTrace }) {
  return (
    <motion.div
      className="about-wrapper"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      {/* 1. PROJECT OVERVIEW */}
      <motion.div className="section-container about-hero-card" variants={itemVariants}>
        <div className="section-header">
          <span className="section-number">01 &mdash;</span> PROJECT OVERVIEW
        </div>
        <div className="about-hero-content">
          <div className="about-badge-top">
            <span className="about-pulse-dot"></span>
            <span>Open Source Educational Visualizer</span>
          </div>
          <h2 className="about-hero-title">
            ByteTrace<span className="about-hero-cursor">_</span>
          </h2>
          <p className="about-hero-subtitle">A live network protocol visualizer</p>
          <p className="about-hero-desc">
            ByteTrace makes the invisible internet visible. Every DNS query, ICMP ping, traceroute hop, port scan, and HTTP request is traced at the byte level and visualized in real time — so you can see exactly what happens when you type a domain name and press Enter.
          </p>
        </div>
      </motion.div>

      {/* 2. HOW IT WORKS */}
      <motion.div className="section-container" variants={itemVariants}>
        <div className="section-header">
          <span className="section-number">02 &mdash;</span> HOW IT WORKS
        </div>
        <div className="about-features-grid">
          {FEATURES.map((feat, idx) => (
            <motion.div
              key={idx}
              className="about-feature-card"
              whileHover={{ translateY: -5, borderColor: "var(--wire)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="about-feature-header">
                <span className="about-feature-icon">{feat.icon}</span>
                <span className="about-feature-badge">{feat.badge}</span>
              </div>
              <h3 className="about-feature-title">{feat.title}</h3>
              <p className="about-feature-desc">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 3. TECH STACK */}
      <motion.div className="section-container" variants={itemVariants}>
        <div className="section-header">
          <span className="section-number">03 &mdash;</span> TECH STACK
        </div>
        <div className="about-tech-container">
          {TECH_STACK.map((tech, idx) => (
            <motion.span
              key={idx}
              className="about-tech-badge"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="tech-bullet">•</span> {tech}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* 4. BUILT BY */}
      <motion.div className="section-container about-author-card" variants={itemVariants}>
        <div className="section-header">
          <span className="section-number">04 &mdash;</span> BUILT BY
        </div>
        <div className="about-author-content">
          <div className="about-author-header">
            <div className="about-author-avatar">
              <span>👨‍💻</span>
            </div>
            <div>
              <h3 className="about-author-name">Nitin Dwivedi</h3>
              <p className="about-author-college">
                <span>🎓</span> IIIT Sonepat (B.Tech Computer Science, 2028)
              </p>
            </div>
          </div>
          <div className="about-author-quote">
            <p>
              Open Source project. Every networking feature implemented from scratch using raw Python sockets — no networking libraries.
            </p>
          </div>
          <div className="about-author-buttons">
            <a
              href="https://github.com/Nitin4381"
              target="_blank"
              rel="noopener noreferrer"
              className="about-btn github-btn"
            >
              <span>⭐</span> View on GitHub ↗
            </a>
            {onStartTrace && (
              <button onClick={onStartTrace} className="about-btn trace-cta-btn">
                <span>⚡</span> Start Tracing →
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 5. OPEN SOURCE NOTE */}
      <motion.div className="about-footer-note" variants={itemVariants}>
        <div className="about-footer-icon">💚</div>
        <p>
          <strong>ByteTrace is fully open source.</strong> Every line of code is documented and explained — built as a learning tool for CS students studying networking.
        </p>
      </motion.div>
    </motion.div>
  );
}
