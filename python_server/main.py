import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp
import cv2
import numpy as np
import base64
import io
from PIL import Image

# Initialize FastAPI
app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    model_complexity=2, # Heavy model for better accuracy
    static_image_mode=False
)

# Pushup Logic Variables per session
# Store state for each connected client: { sid: { count: 0, stage: "UP" } }
client_states = {}

def calculate_angle(a, b, c):
    """
    Calculates the angle between three points a, b, c.
    a, b, c are tuples/lists of (x, y).
    """
    a = np.array(a) # First
    b = np.array(b) # Mid
    c = np.array(c) # End
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    client_states[sid] = {"count": 0, "stage": "UP"}

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    if sid in client_states:
        del client_states[sid]

@sio.event
async def process_frame(sid, data):
    if sid not in client_states:
        return

    try:
        # Decode image
        # data is header + base64 string "data:image/jpeg;base64,....."
        if ',' in data:
            data = data.split(',')[1]
            
        image_bytes = base64.b64decode(data)
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return

        # Process with MediaPipe
        # MediaPipe needs RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Draw logic (optional, we can send back coordinates or the drawn frame)
        # Let's send back the drawn frame for easy debugging/viewing on client
        
        annotated_frame = frame.copy()
        
        feedback = "Fix Form"
        angle = 0
        
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                annotated_frame, 
                results.pose_landmarks, 
                mp_pose.POSE_CONNECTIONS
            )

            # Get Coordinates
            landmarks = results.pose_landmarks.landmark
            
            # Left arm indices: Shoulder 11, Elbow 13, Wrist 15
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            
            # Calculate Angle (using 1280x720 assume typical aspect, but relative coords are normalized 0-1)
            # Angle calc doesn't strictly depend on aspect ratio if valid geometric Euclidean, but for normalized coords it's slightly distorted if non-square pixels. 
            # However standard practice is often just using normalized x,y.
            
            angle = calculate_angle(shoulder, elbow, wrist)
            
            # Pushup Logic
            state = client_states[sid]
            
            if angle > 160:
                if state["stage"] == "DOWN":
                     state["count"] += 1
                     print(f"Client {sid} rep complete. Count: {state['count']}")
                state["stage"] = "UP"
                feedback = "UP"
            if angle < 90:
                state["stage"] = "DOWN"
                feedback = "DOWN"
                
            cv2.putText(annotated_frame, str(int(angle)), 
                           tuple(np.multiply(elbow, [frame.shape[1], frame.shape[0]]).astype(int)), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA
                                )
                                
            # Send back data
            await sio.emit('pose_data', {
                'count': state["count"],
                'stage': state["stage"],
                'angle': angle,
                'feedback': feedback
            }, room=sid)

        # Encode frame back to base64 to display on client (optional, consumes bandwidth)
        # For now, let's just send data and let client draw, OR send processed frame. 
        # Sending processed frame ensures we see exactly what server sees.
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        b64_frame = base64.b64encode(buffer).decode('utf-8')
        
        await sio.emit('processed_frame', f"data:image/jpeg;base64,{b64_frame}", room=sid)

    except Exception as e:
        print(f"Error processing frame: {e}")

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8001)
