import { React, useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, InputGroup, Spinner } from "react-bootstrap";
import { FaLocationArrow, FaTimes } from "react-icons/fa";
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { decode } from "@googlemaps/polyline-codec"; // Install this library

function App() {
  const [centerLocation, setCenterLocation] = useState({ lat: -1.286389, lng: 36.817223 });
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  /** @type {import("@types/google.maps").Map | null} */
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [routePath, setRoutePath] = useState(null); // To store the polyline

  const originRef = useRef();
  const destinationRef = useRef();

  const onMapLoad = (localMap) => {
    setMap(localMap);
  };

  const handleRecenterMapClick = () => {
    map.panTo(centerLocation);
  };

  const calculateRoute = async () => {
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return;
    }

    try {
      const response = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify({
            origin: {
              address: originRef.current.value,
            },
            destination: {
              address: destinationRef.current.value,
            },
            travelMode: "DRIVE",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Routes API Response:", data);

      // Update state with the response data
      setDirectionsResponse(data);
      setDistance(data.routes[0].distanceMeters + " meters");
      setDuration(data.routes[0].duration);

      // Decode the polyline
      const decodedPath = decode(data.routes[0].polyline.encodedPolyline);
      const pathCoordinates = decodedPath.map(([lat, lng]) => ({ lat, lng }));
      console.log("Decoded Path Coordinates:", decodedPath);


      // Render the polyline on the map
      if (routePath) {
        routePath.setMap(null); // Clear previous route
      }
      const newRoutePath = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      newRoutePath.setMap(map);
      setRoutePath(newRoutePath);
    } catch (error) {
      console.error("Routes API Error:", error);
    }
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    originRef.current.value = '';
    destinationRef.current.value = '';
    if (routePath) {
      routePath.setMap(null); // Clear the polyline from the map
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  if (!isLoaded) {
    return (
      <Container
        fluid
        className="d-flex flex-column justify-content-center align-items-center vh-100 vw-100 text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1647117181799-0ac3e50a548a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "bottom",
          backdropFilter: "blur(5px)",
        }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="light" role="status" />
          <h3 className="mt-3">Loading Maps...</h3>
          <p className="opacity-75">Please wait while we set things up for you.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="d-flex flex-column align-items-center vh-100 vw-100"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1647117181799-0ac3e50a548a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
      }}
    >
      <Container className="p-4 rounded shadow bg-white mt-4" style={{ zIndex: 10 }}>
        <InputGroup className="mb-3">
          <Autocomplete>
            <Form.Control type="text" placeholder="Origin" ref={originRef} />
          </Autocomplete>
          <Autocomplete>
            <Form.Control type="text" placeholder="Destination" ref={destinationRef} />
          </Autocomplete>
          <Button variant="danger" onClick={calculateRoute}>
            Calculate Route
          </Button>
          <Button variant="secondary" onClick={clearRoute}>
            <FaTimes />
          </Button>
        </InputGroup>

        <div className="d-flex justify-content-between align-items-center">
          <p className="m-0">Distance: {distance}</p>
          <p className="m-0">Duration: {duration}</p>
          <Button variant="primary" className="rounded-circle" onClick={handleRecenterMapClick}>
            <FaLocationArrow />
          </Button>
        </div>
        <div className="google-map">
          <GoogleMap
            center={centerLocation}
            zoom={15}
            mapContainerStyle={{ width: '100%', height: '800px' }}
            options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
            onLoad={onMapLoad}
          >
            <Marker position={centerLocation} />
          </GoogleMap>
        </div>
      </Container>
    </Container>
  );
}

export default App;