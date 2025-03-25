import { FaLocationArrow } from "react-icons/fa";
import { renderToString } from 'react-dom/server';
export const getCoordinates = async (address) => {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();
    if (data.status === "OK") {
        console.log('Addess: ', address);
        console.log('Geocodes: ', data.results[0].geometry.location)
        return data.results[0].geometry.location; // Returns { lat, lng }
    } else {
        throw new Error("Failed to get coordinates");
    }
};

export const getManeuverIcon = (maneuver) => {
    const icons = {
        "TURN_LEFT": "⬅️",
        "TURN_RIGHT": "➡️",
        "DEPART": "🚗",
        "MERGE": "🔀",
        "ROUNDABOUT_LEFT": "↩️",
        "ROUNDABOUT_RIGHT": "↪️",
        "STRAIGHT": "⬆️"
    };
    return icons[maneuver] || "➡️"; // Default to right arrow if unknown
};



export const formatDuration = (durationStr) => {
    if (!durationStr) return "N/A";
  
    // Extract the number of seconds )
    const seconds = parseInt(durationStr.replace("s", ""), 10);
  
    if (isNaN(seconds)) return "N/A";
  
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    let formattedDuration = "";
    if (hours > 0) formattedDuration += `${hours} hour${hours > 1 ? "s" : ""} `;
    if (minutes > 0) formattedDuration += `${minutes} minute${minutes > 1 ? "s" : ""} `;
    if (remainingSeconds > 0 || formattedDuration === "") {
      formattedDuration += `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
    }
    return formattedDuration.trim();
  };

// export const ARROW_ICON = {
// path: "M12 2L4 12 10 12 10 22 14 22 14 12 20 12z", // Arrow shape
// fillColor: "#4285F4",
// fillOpacity: 1,
// strokeWeight: 0,
// scale: 1,

// };

// export const getDirectionIcon = (heading = 0, google) => {
//     const iconSvg = renderToString(
//       <div style={{ color: '#4285F4', fontSize: '30px' }}>
//         <FaLocationArrow style={{ transform: `rotate(${heading}deg)` }} />
//       </div>
//     );
    
//     return {
//       url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`,
//       scaledSize: new google.maps.Size(30, 30),
//       anchor: new google.maps.Point(15, 15),
//       rotation: heading
//     };
//   };