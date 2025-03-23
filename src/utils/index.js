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
