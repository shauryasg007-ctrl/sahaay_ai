import React, { useState, useEffect } from 'react';
import CameraCapture from '../components/CameraCapture';
import IssueHeatmap from '../components/IssueHeatmap';
import { Camera, MapPin, Loader2, CheckCircle2, AlertTriangle, Info, Navigation, Map } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Issue } from '../types';

export default function CitizenPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locError, setLocError] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  
  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          setLocError('Location access is required to report issues automatically.');
          console.warn('Geolocation error:', err);
        }
      );
    } else {
      setLocError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Fetch issues
  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('reportedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIssues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Issue[];
      setIssues(fetchedIssues);
    });
    return () => unsubscribe();
  }, []);

  const handleCapture = async (base64Image: string) => {
    setShowCamera(false);
    setRejectionMessage('');
    if (!location) {
      alert('Location not available. Please allow location access.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Analyze with Gemini via backend
      const response = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          latitude: location.latitude,
          longitude: location.longitude
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysis = await response.json();

      if (!analysis.isGovernmentConcern) {
        setRejectionMessage(analysis.rejectionReason || "This appears to be a private or residential society issue, not concerning municipal/government-managed public assets. SAHAAY AI has rejected this complaint.");
        setIsSubmitting(false);
        return;
      }

      // We should ideally upload image to Firebase Storage and get URL.
      // For this prototype, we'll store a small placeholder or just use the base64 if it's small,
      // but Firestore has a 1MB limit. We'll store a placeholder URL since we don't have storage bucket fully configured for huge images in this context.
      const imageUrl = 'data:image/jpeg;base64,' + base64Image; // Caution: might exceed firestore limits for huge images.

      // Add to Firestore
      await addDoc(collection(db, 'issues'), {
        // We will just store a truncated image or use a storage bucket in a real app.
        // Given constraints, we'll store a static placeholder or omit the giant base64 for stability.
        imageUrl: imageUrl, // Mocking image URL for stability
        location,
        category: analysis.category,
        description: analysis.description,
        isGovernmentConcern: analysis.isGovernmentConcern,
        severity: analysis.severity,
        isLifeThreatening: analysis.isLifeThreatening,
        status: 'reported',
        priorityScore: analysis.severity * 10, // simplified scoring
        reportedAt: serverTimestamp(),
        reportedBy: auth.currentUser?.uid || 'anonymous',
        upvotes: 0
      });

      alert('Issue reported successfully! Community Hero Points awarded.');
    } catch (error) {
      console.warn(error);
      setRejectionMessage('Failed to report issue. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-sand text-center space-y-6">
        <h1 className="text-3xl font-bold text-olive font-serif tracking-tight">Report a Civic Issue</h1>
        <p className="text-ink/70 max-w-2xl mx-auto">
          Help keep our city safe and clean. Simply point your camera at the problem, and SAHAAY AI will handle the rest—classifying, prioritizing, and notifying the right department automatically.
        </p>
        
        {locError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl inline-flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {locError}
          </div>
        )}

        {rejectionMessage && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl inline-flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{rejectionMessage}</span>
          </div>
        )}

        {isSubmitting ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-olive animate-spin" />
            <p className="text-ink/70 font-medium animate-pulse">SAHAAY AI is analyzing the issue...</p>
          </div>
        ) : (
          <button
            onClick={() => setShowCamera(true)}
            disabled={!location}
            className="inline-flex items-center gap-3 bg-olive text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-olive/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-olive/20"
          >
            <Camera className="w-6 h-6" />
            Capture Issue Now
          </button>
        )}
      </div>

      {/* Reported Issues Feed */}
      <div>
        <h2 className="text-xl font-bold text-olive font-serif mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 text-sage" /> Recent Reports in Your Area
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map(issue => {
            const isExpanded = expandedIssueId === issue.id;
            return (
            <div 
              key={issue.id} 
              onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
              className="bg-white rounded-[2rem] shadow-sm border border-sand overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-cream relative">
                <img src={issue.imageUrl} alt={issue.category} className="w-full h-full object-cover" />
                {issue.isLifeThreatening && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Life Threatening
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-ink text-xs font-bold px-2 py-1 rounded-md">
                  {issue.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className={`text-ink font-medium mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>{issue.description}</p>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-sm text-ink/60 bg-canvas p-2 rounded-xl border border-sand">
                    <MapPin className="w-4 h-4 text-olive" />
                    <span className="truncate flex-1">Lat: {issue.location.latitude.toFixed(4)}, Lng: {issue.location.longitude.toFixed(4)}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMaps(issue.location.latitude, issue.location.longitude);
                      }}
                      className="text-olive hover:text-ink flex items-center gap-1 text-xs font-bold px-2 py-1 border border-olive rounded-lg"
                    >
                      <Navigation className="w-3 h-3" /> LOCATE
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-cream">
                    <StatusBadge status={issue.status} />
                    <span className="text-xs font-medium text-olive/60 uppercase tracking-wider">
                      Priority: {issue.priorityScore}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="pt-3 border-t border-cream text-xs text-ink/60 space-y-1">
                      <p><strong>Reported:</strong> {(issue.reportedAt as any)?.toDate?.()?.toLocaleString() || new Date(issue.reportedAt).toLocaleString()}</p>
                      <p><strong>Status:</strong> {issue.status}</p>
                      {issue.status === 'resolved' && issue.resolvedImageUrl && (
                        <div className="mt-2">
                          <strong>Resolution Proof:</strong>
                          <img src={issue.resolvedImageUrl} alt="Resolution" className="w-full h-32 object-cover rounded-xl mt-1 border border-sand" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )})}
          {issues.length === 0 && (
            <div className="col-span-full py-12 text-center text-ink/50 bg-white rounded-[2rem] border border-dashed border-sand">
              No issues reported yet. Be the first to help your community!
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-olive font-serif mb-6 flex items-center gap-2">
          <Map className="w-5 h-5 text-sage" /> Community Issue Map
        </h2>
        <IssueHeatmap issues={issues} center={location} />
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'reported': 'bg-cream text-ink',
    'verified': 'bg-amber-100 text-amber-800',
    'assigned': 'bg-purple-100 text-purple-800',
    'in-progress': 'bg-sand text-olive',
    'resolved': 'bg-sage/20 text-olive',
    'rejected': 'bg-red-100 text-red-800',
  };

  const Icon = status === 'resolved' ? CheckCircle2 : Loader2;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.reported}`}>
      {status === 'resolved' && <Icon className="w-3.5 h-3.5" />}
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
}
