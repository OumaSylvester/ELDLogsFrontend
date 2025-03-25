import ReactSpeedometer from "react-d3-speedometer";

const Speedometer = ({ speed = 0 }) => (
  <ReactSpeedometer
    maxValue={180}
    value={speed}
    segments={3}
    segmentColors={['#16C046', '#FFA800', '#F21212']}
    currentValueText="${value} km/h"
    customSegmentStops={[0, 80, 120, 180]}
    needleColor="#333"
    needleTransitionDuration={1000}
    width={300}
    height={200}
    className="speedometer"
  />
);

export default Speedometer;