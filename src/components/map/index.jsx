import { React, useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, InputGroup, Spinner, Offcanvas, Row, Col } from "react-bootstrap";
import { FaLocationArrow, FaTimes, FaList } from "react-icons/fa";
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { decode } from "@googlemaps/polyline-codec";
import {getCoordinates, formatDuration } from "../../utils";
import Tracker from "../speedometer";
import Instructions from "../instructions";

const Map = ({ viewELDLog, setViewELDLog }) => {
  const [viewELDLogBtnText, setViewELDLogBtnText] = useState('');
  const [destinationLocation, setDestinationLocation] = useState({ lat: -1.286389, lng: 36.817223 });
  const [currentLocation, setCurrentLocation] = useState({ lat: -1.286389, lng: 36.817223 });
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [routePath, setRoutePath] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [formattedDuration, setFormattedDuration] = useState('');


  const originRef = useRef();
  const destinationRef = useRef();

  const onMapLoad = (localMap) => {
    setMap(localMap);
  };

  const recenterMap = (loc) => {
    console.log('location:', loc);
    map.panTo(loc);
  };

  const calculateRoute = async () => {
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return;
    }

    try {
      const destinationLoc = await getCoordinates(destinationRef.current.value);
      setDestinationLocation(destinationLoc);

      const response = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps",
          },
          body: JSON.stringify({
            origin: {
              address: originRef.current.value,
            },
            destination: {
              address: destinationRef.current.value,
            },
            travelMode: "DRIVE",
            computeAlternativeRoutes: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Routes API Response:", data);

      setDirectionsResponse(data);
      setDistance(data.routes[0].distanceMeters + " meters");
      setDuration(data.routes[0].duration);
      setFormattedDuration(formatDuration(data.routes[0].duration));

      const decodedPath = decode(data.routes[0].polyline.encodedPolyline);
      const pathCoordinates = decodedPath.map(([lat, lng]) => ({ lat, lng }));

      if (routePath) {
        routePath.setMap(null);
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

      const steps = data.routes[0].legs[0].steps;
      setInstructions(steps);
    } catch (error) {
      console.error("Routes API Error:", error);
    }
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    setFormattedDuration('');
    originRef.current.value = '';
    destinationRef.current.value = '';
    if (routePath) {
      routePath.setMap(null);
    }
  };

  useEffect(() => {
    console.log('State: ', viewELDLog);
    viewELDLog ? setViewELDLogBtnText("View Map") : setViewELDLogBtnText("View ELD Log");
  }, [viewELDLog]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setDestinationLocation({
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
      <Container className="p-4 rounded shadow bg-white mt-md-4" style={{ zIndex: 10 }}>
        {/* Responsive Form and Buttons */}
        <Row className="mb-3">
          <Col xs={12} md={3} className="mb-2">
            <Autocomplete>
              <Form.Control type="text" placeholder="Origin" ref={originRef} />
            </Autocomplete>
          </Col>
          <Col xs={12} md={3} className="mb-2">
            <Autocomplete>
              <Form.Control type="text" placeholder="Destination" ref={destinationRef} />
            </Autocomplete>
          </Col>
          <Col xs={12} md={5} className="d-flex flex-colum">
            <Button variant="danger" className="mb-2 me-2" onClick={calculateRoute}>
              Calculate Route
            </Button>
            <Button variant="secondary" className="mb-2 me-2" onClick={clearRoute}>
              <FaTimes />
            </Button>
            <Button className="mb-2" onClick={() => setViewELDLog(!viewELDLog)}>
              {viewELDLogBtnText}
            </Button>
          </Col>
          <Col xs={12} md={1} className="d-flex justify-content-start">
            <Button variant="primary" onClick={() => recenterMap(currentLocation)}>
              <FaLocationArrow />
            </Button>
          </Col>
        </Row>
        <div className="d-flex flex-column  flex-md-row justify-content-around align-items-center  mb-2">
          <div className="speedometer mb-3">
            <Tracker isLoaded={isLoaded} setCurrentLocation={setCurrentLocation}  google={google}/>
          </div>
          <Button variant="info" className="mb-3" onClick={() => setShowInstructions(true)}>
            <FaList /> 
            <span  className="d-inline-block ps-2 mt-1">View Instructions</span>
          </Button>
        </div>
        {/* <div className="d-flex justify-content-between align-items-center mb-3"> */}
          {/* <p className="m-0">Total Distance(from start location): {distance}</p>
          <p className="m-0">Duration: {formattedDuration}</p> */}
         
        {/* </div> */}

        {/* Button to toggle instructions offcanvas */}
        

        {/* Offcanvas for instructions */}
        <Offcanvas show={showInstructions} onHide={() => setShowInstructions(false)} placement="end">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Route Instructions</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Instructions instructions={instructions} />
          </Offcanvas.Body>
        </Offcanvas>

        <div className="google-map">
          <GoogleMap
            center={currentLocation}
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
             {currentLocation &&<Marker 
                position={currentLocation}
                icon={{
                  url: `${window.location.origin}/icon-send.svg`,
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(15, 15),
                  rotation: currentLocation.heading
                }}       
              />
              }
            {destinationLocation && <Marker position={destinationLocation} /> }
          </GoogleMap>
        </div>
      </Container>
    </Container>
  );
};

export default Map;