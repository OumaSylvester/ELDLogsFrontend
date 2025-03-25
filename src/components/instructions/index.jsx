import { getManeuverIcon } from "../../utils";

const Instructions = ({ instructions }) =>{
    if(instructions.length){
        return(
            <ol className="list-group">
                {instructions.map((step, index) => (
                    <li key={index} className="list-group-item d-flex align-items-center">
                    <span className="me-2">
                        {getManeuverIcon(step.navigationInstruction?.maneuver)}
                    </span>
                    <div>
                        <strong>Step {index + 1}:</strong> {step.navigationInstruction?.instructions}
                        <br />
                        <small className="text-muted">
                        Distance: {step.distanceMeters} meters | Duration: {step.staticDuration}
                        </small>
                    </div>
                    </li>
                ))}
            </ol>
        )
    }else{
        return <p>No route instructions available.</p>
    }     
}

export default Instructions;