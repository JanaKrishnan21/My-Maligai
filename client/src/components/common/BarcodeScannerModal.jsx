import React, { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, Volume2, VolumeX, Barcode, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onScan,
  title = 'Barcode Scanner',
  subtitle = 'Point camera at product barcode or type manually',
}) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');

  // Audio feedback synthesis using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1.2kHz grocery scanner beep
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext fallback ignored
    }
  };

  // Start Camera
  const startCamera = async (cameraId) => {
    setErrorMsg('');
    setScannedCode('');

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }

      const scannerId = 'mymaligai-barcode-reader';
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 160 },
        aspectRatio: 1.0,
      };

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          // Success Callback
          playBeep();
          setScannedCode(decodedText);
          html5QrCode.pause(true);

          setTimeout(() => {
            if (onScan) onScan(decodedText);
            onClose();
          }, 350);
        },
        () => {
          // Ignore frame decode misses
        }
      );

      setScanning(true);
    } catch (err) {
      console.warn('Camera start issue:', err);
      setErrorMsg(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : 'Unable to start camera. You can type or scan with a USB barcode reader below.'
      );
      setScanning(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Stop camera error:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to rear camera if available (facingMode 'environment' or name contains back/rear)
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            const defaultId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(defaultId);
            startCamera(defaultId);
          } else {
            setErrorMsg('No camera device detected on this system. You can enter the barcode manually.');
          }
        })
        .catch(() => {
          // Fallback start with default environment camera
          startCamera(null);
        });
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startCamera(newId);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      playBeep();
      if (onScan) onScan(clean);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Camera Viewfinder Box */}
        <div className="relative w-full aspect-square max-h-[290px] bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800 shadow-inner">
          <div id="mymaligai-barcode-reader" className="w-full h-full object-cover" />

          {/* Aiming Reticle Overlay when scanning */}
          {scanning && !scannedCode && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="w-[240px] h-[150px] border-2 border-dashed border-emerald-400/80 rounded-xl relative flex items-center justify-center">
                {/* Laser animation bar */}
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
                {/* Corner reticles */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
              <span className="text-[11px] text-white/80 bg-slate-900/80 px-2.5 py-1 rounded-full mt-3 font-medium">
                Align barcode inside frame
              </span>
            </div>
          )}

          {/* Success Overlay */}
          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-white p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">Barcode Detected</span>
              <span className="text-lg font-mono font-bold text-white mt-1 bg-black/40 px-3 py-1 rounded-lg border border-emerald-400/40">
                {scannedCode}
              </span>
            </div>
          )}

          {/* Error / Fallback State */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-slate-300 p-5 text-center space-y-2">
              <AlertCircle className="w-9 h-9 text-amber-400" />
              <p className="text-xs leading-relaxed max-w-xs">{errorMsg}</p>
              <Button size="xs" variant="secondary" onClick={() => startCamera(selectedCameraId)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Camera
              </Button>
            </div>
          )}
        </div>

        {/* Controls Bar: Camera Selector & Beep Toggle */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Camera className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 truncate focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title="Toggle Scan Beep Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-semibold">{soundEnabled ? 'Beep On' : 'Beep Off'}</span>
          </button>
        </div>

        {/* Manual Barcode / USB Scanner Input Fallback */}
        <div className="pt-3 border-t border-slate-100">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or type/scan barcode number..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus={!scanning}
              />
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={!manualCode.trim()}>
              Apply
            </Button>
          </form>
          <p className="text-[10px] text-slate-400 mt-1">
            Tip: Physical USB barcode scanners work automatically when plugged in.
          </p>
        </div>
      </div>
    </Modal>
  );
};
