/**
 * ByteTile Component
 * ------------------
 * Renders raw hexadecimal network packet payloads as an interactive, animated strip of byte tiles.
 * Useful for visually inspecting raw UDP, TCP, and ICMP headers and payloads.
 */
import React from "react";
import { motion } from "framer-motion";

export function ByteTile({ hex, delay = 0 }) {
  const bytePairs = hex ? hex.match(/.{1,2}/g) || [] : [];
  
  return (
    <div className="byte-strip">
      {bytePairs.slice(0, 32).map((byte, i) => (
        <motion.span
          key={i}
          className="byte-tile"
          initial={{ opacity: 0, rotateX: -90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ delay: delay + i * 0.015, duration: 0.3, type: "spring", stiffness: 100 }}
        >
          {byte}
        </motion.span>
      ))}
      {bytePairs.length > 32 && (
        <span className="byte-more">+{bytePairs.length - 32} more</span>
      )}
    </div>
  );
}
