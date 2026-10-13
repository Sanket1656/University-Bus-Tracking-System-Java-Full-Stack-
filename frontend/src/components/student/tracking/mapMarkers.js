/**
 * mapMarkers.js
 * 
 * Professional transit marker icons and popups for the Student Tracking Map.
 * 
 * Visual Hierarchy:
 *  1. Live Bus (Most Important - zIndex 1000)
 *  2. Your Stop (Second Most Important - zIndex 800)
 *  3. Start / End Stops (Secondary - zIndex 600)
 *  4. Normal Stops (Tertiary / Compact Transit Dots - zIndex 400)
 */

import L from 'leaflet';

// ─── 1. LIVE BUS ICON ─────────────────────────────────────────────────────────
// Modern purple/indigo circular container with crisp white bus SVG & optional label pill
export const createLiveBusIcon = (label = 'BUS', heading = null) => {
  const hasHeading = heading != null && !isNaN(Number(heading));
  const headingStyle = hasHeading
    ? `transform: rotate(${Number(heading)}deg); transition: transform 0.3s ease;`
    : '';

  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <!-- Circular UniTrack Indigo Container -->
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          border-radius: 50%;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        ">
          <!-- White Bus Icon SVG (rotates if heading is provided, otherwise faces upward) -->
          <div style="${headingStyle} display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6 2 7"/>
              <path d="M10 6h4"/>
              <path d="m22 7-2-1"/>
              <rect width="16" height="16" x="4" y="3" rx="2"/>
              <path d="M4 11h16"/>
              <path d="M8 15h.01"/>
              <path d="M16 15h.01"/>
              <path d="M6 19v2"/>
              <path d="M18 21v-2"/>
            </svg>
          </div>
        </div>

        <!-- Optional Bus Label Floating Pill -->
        ${
          label
            ? `<div style="
                position: absolute;
                bottom: -9px;
                left: 50%;
                transform: translateX(-50%);
                background: #1e1b4b;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 1px 6px;
                border-radius: 9999px;
                white-space: nowrap;
                border: 1.5px solid #ffffff;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
                letter-spacing: 0.02em;
              ">${label}</div>`
            : ''
        }
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
};

// ─── 2. NORMAL TRANSIT STOP ICON ──────────────────────────────────────────────
// Small circular transit-style stop marker (white center, purple/indigo border, compact)
export const normalStopIcon = L.divIcon({
  className: 'custom-stop-marker',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background: #ffffff;
      border: 3px solid #6366f1;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 3px; height: 3px; background: #6366f1; border-radius: 50%;"></div>
    </div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

// ─── 3. MY / SELECTED STOP ICON ───────────────────────────────────────────────
// Stands out immediately: UniTrack purple/indigo with gold star & "YOUR STOP" pill
export const myStopIcon = L.divIcon({
  className: 'custom-my-stop-marker',
  html: `
    <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
      <!-- Glowing Inner Container -->
      <div style="
        width: 26px;
        height: 26px;
        background: linear-gradient(135deg, #4f46e5, #4338ca);
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 3.5px rgba(99, 102, 241, 0.35), 0 3px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Crisp Gold Star -->
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>

      <!-- "YOUR STOP" Attached Label -->
      <div style="
        position: absolute;
        bottom: -13px;
        left: 50%;
        transform: translateX(-50%);
        background: #4338ca;
        color: #ffffff;
        font-size: 8px;
        font-weight: 800;
        font-family: system-ui, -apple-system, sans-serif;
        letter-spacing: 0.05em;
        padding: 1px 5px;
        border-radius: 4px;
        white-space: nowrap;
        border: 1px solid #ffffff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      ">
        YOUR STOP
      </div>
    </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -16],
});

// ─── 4. START STOP ICON ───────────────────────────────────────────────────────
// Emerald green circular marker with small play/start icon
export const startStopIcon = L.divIcon({
  className: 'custom-start-stop-marker',
  html: `
    <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
      <div style="
        width: 18px;
        height: 18px;
        background: #10b981;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff" stroke="none" style="margin-left: 1px;">
          <polygon points="6 3 20 12 6 21 6 3"/>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -11px;
        left: 50%;
        transform: translateX(-50%);
        background: #065f46;
        color: #ffffff;
        font-size: 7.5px;
        font-weight: 800;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 0.5px 3.5px;
        border-radius: 3px;
        white-space: nowrap;
        border: 1px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      ">
        START
      </div>
    </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

// ─── 5. END STOP ICON ─────────────────────────────────────────────────────────
// Crimson red circular marker with destination flag icon
export const endStopIcon = L.divIcon({
  className: 'custom-end-stop-marker',
  html: `
    <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
      <div style="
        width: 18px;
        height: 18px;
        background: #ef4444;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15" stroke="#ffffff" stroke-width="2"/>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -11px;
        left: 50%;
        transform: translateX(-50%);
        background: #991b1b;
        color: #ffffff;
        font-size: 7.5px;
        font-weight: 800;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 0.5px 3.5px;
        border-radius: 3px;
        white-space: nowrap;
        border: 1px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      ">
        END
      </div>
    </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

// ─── 6. DIRECTION ARROW ICON ──────────────────────────────────────────────────
// Crisp SVG arrowhead rotated to road segment bearing to clearly show travel lane
export const createDirectionArrowIcon = (bearing = 0, color = '#2563eb') => {
  const normBearing = Number(bearing) || 0;
  return L.divIcon({
    className: 'custom-direction-arrow-marker',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${normBearing}deg);
        pointer-events: none;
      ">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1.5L10.5 9.5L6 7.5L1.5 9.5L6 1.5Z" fill="${color}" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

