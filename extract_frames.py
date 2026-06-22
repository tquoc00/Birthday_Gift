import cv2
import os

def extract_frames(video_path, out_dir):
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video file.")
        return
        
    length = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames: {length}")
    
    # Extract frames at 10%, 50%, 90%
    for pct in [10, 50, 90]:
        frame_idx = int(length * pct / 100)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            out_path = os.path.join(out_dir, f"frame_{pct}.jpg")
            cv2.imwrite(out_path, frame)
            print(f"Saved {out_path}")
        else:
            print(f"Failed to extract frame at {pct}%")
            
    cap.release()

if __name__ == "__main__":
    extract_frames("video.mp4", "extracted_frames")
