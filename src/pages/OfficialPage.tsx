import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Issue } from '../types';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Shield, Camera, ChevronDown, ChevronUp, FileText, X, Loader2 } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import Markdown from 'react-markdown';

export default function OfficialPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    // In a real app, query by assigned department or region
    const q = query(collection(db, 'issues'), orderBy('priorityScore', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIssues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Issue[];
      setIssues(fetchedIssues);
    });
    return () => unsubscribe();
  }, []);

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleGenerateSummary = async () => {
    setShowSummaryModal(true);
    if (summary) return; // already generated
    setIsGeneratingSummary(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentIssues = issues.filter(issue => {
        if (!issue.reportedAt) return false;
        // Handle Firestore Timestamp or Date
        const reportedDate = (issue.reportedAt as any).toDate ? (issue.reportedAt as any).toDate() : new Date(issue.reportedAt);
        return reportedDate >= thirtyDaysAgo;
      });

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issues: recentIssues,
          officialDetails: {
            role: 'City Official',
            region: 'Central District',
            department: 'Public Works'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate summary');
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error(error);
      setSummary('Failed to generate summary. Please try again later.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const updateStatus = async (issueId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status: newStatus
      });
    } catch (error) {
      console.warn(error);
      alert('Failed to update status.');
    }
  };

  const handleResolveCapture = async (base64Image: string) => {
    setShowCamera(false);
    if (!selectedIssue) return;
    
    setIsVerifying(true);
    try {
      const response = await fetch('/api/analyze-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          issueDescription: selectedIssue.description
        })
      });

      if (!response.ok) throw new Error('Analysis failed');
      const analysis = await response.json();

      if (analysis.isResolved) {
        await updateDoc(doc(db, 'issues', selectedIssue.id), {
          status: 'resolved',
          resolvedImageUrl: 'https://placehold.co/600x400?text=Resolved', // Mock url for stability
        });
        alert('Fix approved by AI! Issue marked as resolved.');
      } else {
        alert(`AI rejected the fix. Reason: ${analysis.reason}`);
      }
    } catch (error) {
      console.warn(error);
      alert('Failed to verify fix.');
    } finally {
      setIsVerifying(false);
      setSelectedIssue(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-olive font-serif flex items-center gap-2">
            <Shield className="w-6 h-6 text-sage" />
            Official Dashboard
          </h1>
          <p className="text-ink/60 text-sm mt-1">Manage, track, and resolve community issues.</p>
        </div>
        <button 
          onClick={handleGenerateSummary}
          className="flex items-center gap-2 bg-olive text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-olive/90 transition-colors uppercase tracking-tight"
        >
          <FileText className="w-4 h-4" />
          Monthly Summary
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {issues.map(issue => {
            const isExpanded = expandedIssueId === issue.id;
            return (
            <div 
              key={issue.id} 
              className={`bg-white rounded-[2rem] shadow-sm border overflow-hidden flex flex-col transition-all ${issue.isLifeThreatening ? 'border-red-200 ring-1 ring-red-100' : 'border-sand'}`}
            >
              <div 
                className="flex flex-col sm:flex-row cursor-pointer"
                onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
              >
                <div className="sm:w-48 h-48 sm:h-auto shrink-0 relative bg-cream">
                  <img src={issue.imageUrl} alt={issue.category} className="w-full h-full object-cover" />
                  {issue.isLifeThreatening && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Critical
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-olive uppercase tracking-wider">{issue.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink/50 bg-cream px-2 py-1 rounded-md uppercase tracking-wider">
                        Priority: {issue.priorityScore}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-ink/50" /> : <ChevronDown className="w-4 h-4 text-ink/50" />}
                    </div>
                  </div>
                  
                  <h3 className={`text-ink font-bold leading-snug mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>{issue.description}</h3>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-2 text-sm text-ink bg-canvas p-2 rounded-xl border border-sand">
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
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={issue.status}
                        onChange={(e) => updateStatus(issue.id, e.target.value)}
                        className="text-sm bg-white border border-sand rounded-xl py-1.5 px-3 text-ink shadow-sm focus:ring-olive focus:border-olive flex-1"
                      >
                        <option value="reported">Reported</option>
                        <option value="verified">Verified</option>
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        {issue.status === 'resolved' && <option value="resolved">Resolved</option>}
                      </select>
                      
                      {issue.status !== 'resolved' && (
                        <button 
                          onClick={() => { setSelectedIssue(issue); setShowCamera(true); }}
                          className="flex items-center justify-center gap-2 bg-sage text-white px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-sage/90 transition-colors shadow-sm whitespace-nowrap"
                        >
                          <Camera className="w-4 h-4" />
                          Verify Fix
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-5 border-t border-sand bg-cream/30 text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-ink/60 font-semibold mb-1 uppercase tracking-wider text-xs">Reported On</p>
                      <p className="text-ink">{(issue.reportedAt as any)?.toDate?.()?.toLocaleString() || new Date(issue.reportedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-ink/60 font-semibold mb-1 uppercase tracking-wider text-xs">Reported By</p>
                      <p className="text-ink truncate">{issue.reportedBy}</p>
                    </div>
                  </div>
                  
                  {issue.status === 'resolved' && issue.resolvedImageUrl && (
                    <div className="mt-4 border-t border-sand pt-4">
                      <p className="text-ink/60 font-semibold mb-2 uppercase tracking-wider text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-sage" /> Resolution Proof
                      </p>
                      <img src={issue.resolvedImageUrl} alt="Resolution" className="w-48 h-32 object-cover rounded-xl border border-sand" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}

          {issues.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-sand text-ink/50">
              No issues assigned to your department.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-olive text-white rounded-[2rem] p-6 shadow-sm border border-sand">
            <h2 className="font-serif text-2xl mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Critical Alerts
            </h2>
            <div className="space-y-3">
              {issues.filter(i => i.isLifeThreatening && i.status !== 'resolved').length === 0 ? (
                <p className="text-white/70 text-sm">No critical alerts at the moment.</p>
              ) : (
                issues.filter(i => i.isLifeThreatening && i.status !== 'resolved').map(issue => (
                  <div key={issue.id} className="bg-white/10 rounded-2xl p-3 text-sm border border-white/20">
                    <div className="font-bold text-amber-200 mb-1">{issue.category}</div>
                    <div className="text-white/90 line-clamp-2">{issue.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={handleResolveCapture} 
          onClose={() => { setShowCamera(false); setSelectedIssue(null); }} 
        />
      )}

      {isVerifying && (
        <div className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl flex flex-col items-center gap-4">
            <CheckCircle className="w-10 h-10 text-sage animate-pulse" />
            <div className="text-center">
              <h3 className="font-bold font-serif text-ink text-2xl">AI Verification in Progress</h3>
              <p className="text-ink/60 text-sm">Analyzing the fix against the original issue...</p>
            </div>
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-sand">
            <button 
              onClick={() => setShowSummaryModal(false)}
              className="absolute top-4 right-4 p-2 text-ink/50 hover:text-ink bg-canvas rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold font-serif text-olive mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Monthly Performance Summary
            </h2>
            
            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-olive animate-spin" />
                <p className="text-ink/60 font-medium">SAHAAY AI is analyzing 30-day records...</p>
              </div>
            ) : (
              <div className="markdown-body prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-olive prose-a:text-sage">
                {summary ? (
                  <Markdown>{summary}</Markdown>
                ) : (
                  <p>Summary not available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
