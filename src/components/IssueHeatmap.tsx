import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import { Issue } from '../types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface IssueHeatmapProps {
  issues: Issue[];
  center: { latitude: number; longitude: number } | null;
}

export default function IssueHeatmap({ issues, center }: IssueHeatmapProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  if (!hasValidKey) {
    return (
      <div className="bg-cream rounded-[2rem] p-8 text-center border border-sand">
        <h3 className="text-xl font-bold text-olive mb-2">Google Maps API Key Required</h3>
        <p className="text-ink/70 mb-4">Add your API key in the AI Studio Secrets panel as <code>GOOGLE_MAPS_PLATFORM_KEY</code> to view the map.</p>
      </div>
    );
  }

  const mapCenter = center ? { lat: center.latitude, lng: center.longitude } : { lat: 20.5937, lng: 78.9629 }; // Default to India or nearby

  return (
    <div className="w-full h-[400px] rounded-[2rem] overflow-hidden border border-sand shadow-sm relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={center ? 12 : 5}
          mapId="ISSUE_HEATMAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        >
          {issues.map(issue => {
            const isResolved = issue.status === 'resolved';
            const isSelected = selectedIssueId === issue.id;

            return (
              <React.Fragment key={issue.id}>
                <AdvancedMarker
                  position={{ lat: issue.location.latitude, lng: issue.location.longitude }}
                  onClick={() => setSelectedIssueId(issue.id)}
                >
                  <Pin 
                    background={isResolved ? '#556B2F' : '#D32F2F'} 
                    borderColor={isResolved ? '#3e4f22' : '#B71C1C'} 
                    glyphColor="#fff" 
                  />
                </AdvancedMarker>

                {isSelected && (
                  <InfoWindow
                    position={{ lat: issue.location.latitude, lng: issue.location.longitude }}
                    onCloseClick={() => setSelectedIssueId(null)}
                  >
                    <div className="p-2 max-w-[200px] text-ink font-sans">
                      <p className="font-bold text-sm mb-1">{issue.category}</p>
                      <p className="text-xs opacity-80 mb-2 line-clamp-2">{issue.description}</p>
                      <p className="text-xs font-semibold">
                        Status: <span className={isResolved ? 'text-olive' : 'text-red-600'}>{issue.status}</span>
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}
