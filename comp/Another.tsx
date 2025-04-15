import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Holistic, Results, HAND_CONNECTIONS } from "@mediapipe/holistic";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";
import DogGif from "./dog.gif";
import Kit from "./Kit.gif";

type Circle = {
  x: number;
  y: number;
  radius: number;
  color: "gray" | "red" | "blue" | "greenyellow" | "orange";
  activeTime: number | null;
  timeoutId: NodeJS.Timeout | null;
};

const App: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const circlesRef = useRef<Circle[]>([
    {
      x: 100,
      y: 450,
      radius: 50,
      color: "gray",
      activeTime: null,
      timeoutId: null,
    },
    {
      x: 300,
      y: 500,
      radius: 50,
      color: "gray",
      activeTime: null,
      timeoutId: null,
    },
    {
      x: 500,
      y: 500,
      radius: 50,
      color: "gray",
      activeTime: null,
      timeoutId: null,
    },
    {
      x: 700,
      y: 450,
      radius: 50,
      color: "gray",
      activeTime: null,
      timeoutId: null,
    },
  ]);
  const [isGameWon, setGameWon] = useState<boolean>(false);
  const [isGameLose, setGameLose] = useState<boolean>(false);

  const runHolistic = useCallback(async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video !== null
    ) {
      const holistic = new Holistic({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      holistic.onResults((results) => {
        drawCanvas(results);
      });

      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await holistic.send({ image: webcamRef.current!.video! });
        },
        width: 800,
        height: 600,
      });
      camera.start();
    }
  }, []);

  useEffect(() => {
    runHolistic();
  }, [runHolistic]);

  const activateCircle = (index: number) => {
    const randomColor = Math.random() > 0.5 ? "red" : "blue";
    circlesRef.current[index] = {
      ...circlesRef.current[index],
      color: randomColor,
      activeTime: Date.now(),
    };
  };

  const resetCircle = (index: number) => {
    circlesRef.current[index] = {
      ...circlesRef.current[index],
      color: "gray",
      activeTime: null,
    };
  };

  const startCircleCycle = (index: number) => {
    const timeoutId = setTimeout(() => {
      activateCircle(index);
      const resetTimeoutId = setTimeout(() => {
        resetCircle(index);
        const newTimeoutId = setTimeout(() => {
          startCircleCycle(index);
        }, Math.random() * 5000);

        circlesRef.current[index] = {
          ...circlesRef.current[index],
          timeoutId: newTimeoutId,
        };
      }, 2000);
      circlesRef.current[index] = {
        ...circlesRef.current[index],
        timeoutId: resetTimeoutId,
      };
    }, Math.random() * 5000);

    circlesRef.current[index] = {
      ...circlesRef.current[index],
      timeoutId: timeoutId,
    };
  };

  useEffect(() => {
    circlesRef.current.forEach((_, index) => {
      startCircleCycle(index);
    });

    return () => {
      circlesRef.current.forEach((circle) => {
        if (circle.timeoutId) {
          clearTimeout(circle.timeoutId);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (score >= 1000) {
      setGameWon(true);
    } else if (score <= -500) {
      setGameLose(true);
    }
  }, [score]);

  const detectCollision = (handLandmarks: any, circle: Circle) => {
    if (!handLandmarks) return false;

    for (let i = 0; i < handLandmarks.length; i++) {
      const landmark = handLandmarks[i];
      const distance = Math.sqrt(
        Math.pow(landmark.x * 800 - circle.x, 2) +
          Math.pow(landmark.y * 600 - circle.y, 2),
      );
      if (distance < circle.radius) {
        return true;
      }
    }
    return false;
  };

  const drawCanvas = (results: Results) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height,
    );

    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "grey",
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "rgb(70, 70, 255)",
      fillColor: "#0000FF",
    });

    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "grey",
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "rgb(255, 70, 70)",
      fillColor: "#FF0000",
    });

    circlesRef.current.forEach((circle, index) => {
      canvasCtx.beginPath();
      canvasCtx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
      canvasCtx.fillStyle = circle.color;
      canvasCtx.fill();
      canvasCtx.closePath();

      if (circle.color !== "gray") {
        const leftHandCollision = detectCollision(
          results.leftHandLandmarks,
          circle,
        );
        const rightHandCollision = detectCollision(
          results.rightHandLandmarks,
          circle,
        );

        if (
          (circle.color === "blue" && leftHandCollision) ||
          (circle.color === "red" && rightHandCollision)
        ) {
          circlesRef.current[index].color = "greenyellow";
          setScore((prevScore) => prevScore + 100);

          setTimeout(() => {
            circlesRef.current[index] = {
              ...circlesRef.current[index],
              color: "gray",
              activeTime: null,
            };
          }, 1000);
        } else if (
          (circle.color === "red" && leftHandCollision) ||
          (circle.color === "blue" && rightHandCollision)
        ) {
          circlesRef.current[index].color = "orange";
          setScore((prevScore) => prevScore - 100);

          setTimeout(() => {
            circlesRef.current[index] = {
              ...circlesRef.current[index],
              color: "gray",
              activeTime: null,
            };
          }, 1000);
        }
      }
    });

    canvasCtx.restore();
  };

  const resetGame = () => {
    setScore(0);
    setGameWon(false);
    setGameLose(false);
    circlesRef.current = [
      {
        x: 100,
        y: 450,
        radius: 50,
        color: "gray",
        activeTime: null,
        timeoutId: null,
      },
      {
        x: 300,
        y: 500,
        radius: 50,
        color: "gray",
        activeTime: null,
        timeoutId: null,
      },
      {
        x: 500,
        y: 500,
        radius: 50,
        color: "gray",
        activeTime: null,
        timeoutId: null,
      },
      {
        x: 700,
        y: 450,
        radius: 50,
        color: "gray",
        activeTime: null,
        timeoutId: null,
      },
    ];
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100",
        height: "100",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          fontSize: "24px",
          color: "white",
          backgroundColor: "darkgreen",
          borderRadius: "20%",
        }}
      >
        Score: {score}
      </div>
      {isGameWon && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "48px",
            color: "white",
            backgroundColor: "darkgreen",
            borderRadius: "20%",
            textAlign: "center",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          You Won!
          <button
            className="b"
            onClick={resetGame}
            style={{
              fontSize: "24px",
              zIndex: 1,
              backgroundColor: "greenyellow",
              color: "black",
            }}
          >
            Play Again
          </button>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              className="kit"
              src={Kit}
              alt="KitGif"
              style={{
                maxWidth: 100,
              }}
            />
            <img
              className="dog"
              src={DogGif}
              alt="DogGif"
              style={{
                maxWidth: 100,
              }}
            />
            <img
              className="kit"
              src={Kit}
              alt="KitGif"
              style={{
                maxWidth: 100,
              }}
            />
          </div>
        </div>
      )}
      {isGameLose && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "48px",
            color: "white",
            backgroundColor: "darkgreen",
            borderRadius: "20%",
            textAlign: "center",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          You Lose!
          <button
            className="b"
            onClick={resetGame}
            style={{
              fontSize: "24px",
              zIndex: 1,
              backgroundColor: "greenyellow",
              color: "black",
            }}
          >
            Play Again
          </button>
        </div>
      )}
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          width: 800,
          height: 600,
          borderRadius: "20%",
        }}
        mirrored={true}
      />
      <canvas
        ref={canvasRef}
        width="800px"
        height="600px"
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          width: 800,
          height: 600,
          transform: "scaleX(-1)",
          zIndex: 0,
          borderRadius: "20%",
        }}
      />
    </div>
  );
};

export default App;
