import React from 'react';
import { LeafAnalysisResult, ViewType } from '../types';
import LeafCanvas from './LeafCanvas';
import { AlertCircle, CheckCircle2, Sprout, Leaf, Fingerprint, Activity, Scan, Layers } from 'lucide-react';

interface AnalysisViewProps {
  result: LeafAnalysisResult;
  imageSrc: string;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, imageSrc, onReset }) => {
  if (!result.isLeaf) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-red-100 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Not a Leaf Detected</h2>
        <p className="text-slate-600 mb-8">
            {result.reason || "We couldn't identify a leaf in this image. Please try uploading a clear photo of a single leaf."}
        </p>
        <button
          onClick={onReset}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
        >
          Try Another Image
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header Info Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-nature-100 overflow-hidden">
        <div className="bg-gradient-to-r from-nature-600 to-nature-500 p-6 md:p-10 text-white relative overflow-hidden">
             {/* Decorative circles */}
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-nature-400/30 backdrop-blur-sm border border-nature-300/30 text-xs font-semibold tracking-wide uppercase">
                            Identified
                        </span>
                        <span className="text-nature-100 text-sm">
                            Confidence: {Math.round((result.confidence || 0) * 100)}%
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                        {result.species}
                    </h1>
                    <p className="text-xl text-nature-100 italic font-serif">
                        {result.scientificName}
                    </p>
                </div>
                <button 
                    onClick={onReset}
                    className="shrink-0 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white rounded-lg text-sm font-medium transition-all"
                >
                    Analyze New Leaf
                </button>
            </div>
        </div>

        <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-nature-600" />
                        Analysis Summary
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                        {result.description}
                    </p>
                </div>
                <div className="md:w-1/3 bg-slate-50 rounded-xl p-5 border border-slate-100">
                     <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Details
                    </h4>
                    <ul className="space-y-3">
                        <li className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Classification</span>
                            <span className="font-medium text-slate-700">Plantae</span>
                        </li>
                        <li className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Scan Quality</span>
                            <span className="font-medium text-slate-700">High Definition</span>
                        </li>
                        <li className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Date</span>
                            <span className="font-medium text-slate-700">{new Date().toLocaleDateString()}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>

      {/* Visual Analysis Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Spectral Views</h2>
                <p className="text-slate-500">Multi-spectrum visual analysis of structural composition.</p>
            </div>
            <div className="flex gap-2 text-slate-400">
                <Activity className="w-5 h-5" />
                <Scan className="w-5 h-5" />
                <Layers className="w-5 h-5" />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 row-span-2 relative group">
                <LeafCanvas 
                    imageSrc={imageSrc} 
                    type={ViewType.ORIGINAL} 
                    hideLabel={true}
                    className="h-full w-full min-h-[300px] aspect-square lg:aspect-auto" 
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full border border-white/20">
                    Master Reference
                </div>
            </div>
            
            {/* Standard Analytical Views */}
            <LeafCanvas imageSrc={imageSrc} type={ViewType.SKELETON} className="aspect-square" />
            <LeafCanvas imageSrc={imageSrc} type={ViewType.HEATMAP} className="aspect-square" />
            
            {/* New Requested Views */}
            <LeafCanvas imageSrc={imageSrc} type={ViewType.BINARY} className="aspect-square" />
            <LeafCanvas imageSrc={imageSrc} type={ViewType.HSV} className="aspect-square" />
            
            <LeafCanvas imageSrc={imageSrc} type={ViewType.GRADIENT_MAGNITUDE} className="aspect-square" />
            <LeafCanvas imageSrc={imageSrc} type={ViewType.GRADIENT_DIRECTION} className="aspect-square" />
            
            <LeafCanvas imageSrc={imageSrc} type={ViewType.ZERO_CROSSING} className="aspect-square" />
            <LeafCanvas imageSrc={imageSrc} type={ViewType.WAVELET} className="aspect-square" />
            
            <LeafCanvas imageSrc={imageSrc} type={ViewType.FEATURE_MAP} className="aspect-square" />
            <LeafCanvas imageSrc={imageSrc} type={ViewType.BLUEPRINT} className="aspect-square" />
        </div>
      </div>

    </div>
  );
};

export default AnalysisView;