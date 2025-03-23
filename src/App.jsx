import Map from "./components/map";
import ELDLogs from "./components/eldlog";
import { useState } from "react";


const App = () => {
  const [viewELDLog, setViewELDLog] = useState(false);

  if(viewELDLog){
    return (
      <ELDLogs viewELDLog={viewELDLog} setViewELDLog={setViewELDLog} />
    )
  }else{
    return (
      <Map viewELDLog={viewELDLog} setViewELDLog={setViewELDLog} />
    )
  }

}

export default  App;