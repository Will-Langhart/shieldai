import React, { useState } from 'react';
import { 
  MapPin, 
  MapPinOff, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader,
  Sparkles
} from 'lucide-react';

interface LocationServicesTriggerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationEnabled: () => void;
  theme?: 'light' | 'dark';
}

const LocationServicesTrigger: React.FC<LocationServicesTriggerProps> = ({
  isOpen,
  onClose,
  onLocationEnabled,
  theme = 'dark'
}) => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Location services are not supported by your browser.');
      return;
    }

    setStatus('requesting');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      setStatus('success');
      setTimeout(() => {
        onLocationEnabled();
        onClose();
      }, 1500);
    } catch (error: any) {
      setStatus('error');
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setErrorMessage('Location access was denied. Please enable location services in your browser settings.');
          break;
        case error.POSITION_UNAVAILABLE:
          setErrorMessage('Location information is unavailable. Please try again.');
          break;
        case error.TIMEOUT:
          setErrorMessage('Location request timed out. Please try again.');
          break;
        default:
          setErrorMessage('Unable to get your location. Please check your browser settings.');
      }
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Enable Location Services</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Find churches near you</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className={`text-lg font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Find Churches Near You</h4>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Shield AI needs access to your location to find churches in your area. 
                  This helps us provide you with the most relevant church recommendations.
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className={`text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Privacy & Security</h5>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Your location is only used to find nearby churches and is never stored or shared.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleEnableLocation}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enable Location</span>
                </button>
              </div>
            </div>
          )}

          {status === 'requesting' && (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h4 className={`text-lg font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Getting Your Location</h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Please allow location access when prompted by your browser...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
              }`}>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h4 className={`text-lg font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Location Enabled!</h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Finding churches near you...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-red-900' : 'bg-red-100'
                }`}>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h4 className={`text-lg font-medium mt-4 mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Location Access Denied</h4>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {errorMessage}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-yellow-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className={`text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>How to Enable Location</h5>
                    <ul className={`text-xs space-y-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <li>• Click the location icon in your browser's address bar</li>
                      <li>• Select "Allow" when prompted</li>
                      <li>• Refresh the page and try again</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationServicesTrigger; 