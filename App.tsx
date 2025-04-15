import Another from "./comp/Another";
import Video from "./comp/Zoom.mp4";

function App() {
  return (
    <div className="App">
      <title>Т\NeBeatSaber</title>
      <header
        style={{
          backgroundColor: "green",
          color: "white",
          fontSize: 50,
          borderRadius: "20%",
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translate(-50%, 0)",
          margin: "1px",
          zIndex: 10,
        }}
      >
        !!!Собери 1000 очков!!!
      </header>
      <video
        src={Video}
        autoPlay
        loop
        muted
        style={{
          zIndex: -100,
          position: "fixed",
          top: 0,
          left: 0,
          minHeight: "100%",
          minWidth: "100%",
          objectFit: "cover",
        }}
      ></video>
      <Another />
    </div>
  );
}

export default App;
