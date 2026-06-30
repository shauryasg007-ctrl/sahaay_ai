import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera access denied or unavailable. Please grant permissions.');
        console.warn('Camera setup error:', err);
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      let width = video.videoWidth;
      let height = video.videoHeight;
      const MAX_DIMENSION = 600;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        // Get base64 string, compress heavily to ensure small payload
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        const base64Data = dataUrl.split(',')[1];
        onCapture(base64Data);
        
        // Stop stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    }
  }, [onCapture, stream]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="p-4 flex justify-between items-center text-white absolute top-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent">
        <span className="font-medium">Capture Issue</span>
        <button onClick={onClose} className="p-2 bg-black/50 rounded-full hover:bg-black/70">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white p-6 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-h-full max-w-full object-contain"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {!error && (
        <div className="p-8 pb-12 flex justify-center items-center bg-black">
          <button
            onClick={takePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full"></div>
          </button>
        </div>
      )}
    </div>
  );
}
