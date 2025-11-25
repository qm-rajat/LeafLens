import React, { useState, useCallback } from 'react';
import { Upload, Loader2, Leaf } from 'lucide-react';
import { analyzeImage } from './services/geminiService';
import { LeafAnalysisResult } from './types';
import AnalysisView from './components/AnalysisView';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const App: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<LeafAnalysisResult | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImageSrc(base64String);

      // Extract only the base64 data part
      const base64Data = base64String.split(',')[1];
      
      try {
        const result = await analyzeImage(base64Data, file.type);
        setAnalysisResult(result);
      } catch (err) {
        setError("Failed to analyze image. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setImageSrc(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-nature-200">
      
      {/* Navigation / Header */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetAnalysis}>
            <div className="w-8 h-8 bg-gradient-to-br from-nature-500 to-nature-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-nature-500/30">
              <Leaf size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">LeafLens</span>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
            Powered by Gemini 2.5
          </div>
        </div>
      </nav>

      <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)]">
        
        {!analysisResult && !isLoading && (
          <div className="max-w-4xl mx-auto mt-12 animate-fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Instantly identify <span className="text-transparent bg-clip-text bg-gradient-to-r from-nature-600 to-nature-400">any leaf</span> species.
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Upload a photo to detect species, get detailed botanical insights, and view advanced structural analysis visualizations.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative group cursor-pointer
                border-3 border-dashed rounded-3xl p-12
                transition-all duration-300 ease-in-out
                flex flex-col items-center justify-center text-center
                min-h-[400px] bg-white
                ${isDragging 
                  ? 'border-nature-500 bg-nature-50 scale-[1.02] shadow-xl' 
                  : 'border-slate-200 hover:border-nature-400 hover:bg-slate-50 hover:shadow-lg'
                }
              `}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                accept="image/*"
              />
              
              <div className={`
                w-24 h-24 mb-6 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isDragging ? 'bg-nature-100 text-nature-600' : 'bg-slate-100 text-slate-400 group-hover:bg-nature-100 group-hover:text-nature-600'}
              `}>
                <Upload size={40} />
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Drag and drop your leaf here
              </h3>
              <p className="text-slate-500 mb-6">
                or click to browse from your device
              </p>
              
              <div className="text-xs text-slate-400 font-medium px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                Supports JPG, PNG, WEBP (Max 5MB)
              </div>
            </div>

            {error && (
               <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center text-sm font-medium animate-pulse">
                  {error}
               </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-nature-100 border-t-nature-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-nature-600 animate-pulse" />
                </div>
             </div>
             <h2 className="mt-8 text-2xl font-bold text-slate-800">Analyzing Specimen</h2>
             <p className="text-slate-500 mt-2">Identifying species and generating spectral views...</p>
          </div>
        )}

        {analysisResult && imageSrc && (
          <AnalysisView 
            result={analysisResult} 
            imageSrc={imageSrc} 
            onReset={resetAnalysis} 
          />
        )}

      </main>
      
      {/* CSS for animations since we aren't using an external CSS file */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
