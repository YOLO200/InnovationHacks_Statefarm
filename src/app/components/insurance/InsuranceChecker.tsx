import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FileCheck, Upload, AlertTriangle, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckResult {
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string;
}

export function InsuranceChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setResults([
        {
          type: 'error',
          title: 'Incorrect Billing Code',
          description: 'Service code 99214 was billed but procedure notes indicate 99215 should be used. This could result in $85 underpayment.',
        },
        {
          type: 'warning',
          title: 'Missing Pre-Authorization Reference',
          description: 'Claim lacks pre-authorization number. While service was approved, this may delay processing by 7-10 days.',
        },
        {
          type: 'error',
          title: 'Out-of-Network Rate Applied',
          description: 'Provider is listed as in-network but was billed at out-of-network rates. You may be overcharged by $320.',
        },
        {
          type: 'success',
          title: 'Deductible Correctly Applied',
          description: 'Your deductible calculation is accurate. $1,250 of $2,500 remaining for this plan year.',
        },
        {
          type: 'warning',
          title: 'Potential Duplicate Charge',
          description: 'Similar service on same date appears on line items 3 and 7. Verify these are distinct services.',
        },
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const getResultStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <FileCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Insurance Document Checker</h2>
          <p className="text-sm text-gray-600">AI-powered EOB and denial letter analysis</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">What We Check:</p>
            <ul className="space-y-1 text-xs">
              <li>• Billing code accuracy and medical necessity</li>
              <li>• Coverage denials and appeals opportunities</li>
              <li>• Duplicate charges and billing errors</li>
              <li>• Out-of-network vs in-network pricing discrepancies</li>
              <li>• Deductible and co-insurance calculations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className={`block p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            file
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          <div className="text-center">
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(1)} KB • Click to change
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Upload EOB or Denial Letter
                </p>
                <p className="text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
              </>
            )}
          </div>
        </label>

        {file && !results && (
          <Button
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Analysis Results</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setResults(null);
                }}
              >
                Check Another Document
              </Button>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Issues Found</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm font-medium text-gray-900">
                        {results.filter((r) => r.type === 'error').length} Errors
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-sm font-medium text-gray-900">
                        {results.filter((r) => r.type === 'warning').length} Warnings
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Potential Savings</p>
                  <p className="text-2xl font-bold text-green-600">$405</p>
                </div>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${getResultStyle(result.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getResultIcon(result.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{result.title}</h4>
                      <p className="text-sm text-gray-700">{result.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button variant="outline" className="w-full">
                Download Report
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                File Appeal
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
