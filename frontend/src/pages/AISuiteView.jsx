import React, { useState } from 'react';
import api from '../services/api';
import { Cpu, Stethoscope, Activity, FileText, Scan, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

const AISuiteView = () => {
  const [activeTab, setActiveTab] = useState('SYMPTOM');

  // Symptom Checker State
  const [selectedSymptoms, setSelectedSymptoms] = useState(['fever', 'cough']);
  const [symptomResult, setSymptomResult] = useState(null);
  const [symptomLoading, setSymptomLoading] = useState(false);

  // Health Risk Calculator State
  const [riskForm, setRiskForm] = useState({ age: 52, bmi: 28.4, systolicBp: 142, glucose: 115, smoker: false, familyHistory: true });
  const [riskResult, setRiskResult] = useState(null);

  // NLP Report Classifier State
  const [reportText, setReportText] = useState(
    'PATIENT EXAMINATION: Complete Blood Count (CBC). Hemoglobin 14.5 g/dL, Leukocyte (WBC) count 8,200 /uL, Platelet count 260,000 /uL. No abnormal blast cells observed.'
  );
  const [nlpResult, setNlpResult] = useState(null);

  // Prescription OCR Parser State
  const [ocrResult, setOcrResult] = useState(null);

  const availableSymptoms = [
    'fever', 'cough', 'fatigue', 'chest pain', 'shortness of breath',
    'headache', 'nausea', 'dizziness', 'sore throat', 'joint pain'
  ];

  const handleSymptomToggle = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleRunSymptomChecker = async () => {
    try {
      setSymptomLoading(true);
      const res = await api.post('/ai/symptom-checker', { symptoms: selectedSymptoms });
      if (res.data.success) {
        setSymptomResult(res.data.aiAnalysis);
      }
    } catch (err) {
      alert('Symptom analysis failed.');
    } finally {
      setSymptomLoading(false);
    }
  };

  const handleCalculateRisk = async () => {
    try {
      const res = await api.post('/ai/health-risk-score', riskForm);
      if (res.data.success) {
        setRiskResult(res.data.healthScore);
      }
    } catch (err) {
      alert('Risk calculation failed.');
    }
  };

  const handleClassifyReport = async () => {
    try {
      const res = await api.post('/ai/classify-report', { reportText });
      if (res.data.success) {
        setNlpResult(res.data.nlpClassification);
      }
    } catch (err) {
      alert('NLP Classification failed.');
    }
  };

  const handleRunOcr = async () => {
    try {
      const res = await api.post('/ai/prescription-ocr', { imageUrl: 'sample_rx.png' });
      if (res.data.success) {
        setOcrResult(res.data.ocrOutput);
      }
    } catch (err) {
      alert('OCR parsing failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">AI & DATA SCIENCE INNOVATION ENGINE</span>
          </div>
          <h2 className="text-2xl font-black text-white">UHIS Clinical AI & Predictive Analytics</h2>
          <p className="text-xs text-slate-400">Machine Learning Symptom Triage, Risk Scoring, Medical NLP & OCR Extractor</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('SYMPTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'SYMPTOM' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
          >
            Symptom Checker
          </button>
          <button
            onClick={() => setActiveTab('RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'RISK' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
          >
            Health Risk Engine
          </button>
          <button
            onClick={() => setActiveTab('NLP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'NLP' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
          >
            Report NLP
          </button>
          <button
            onClick={() => setActiveTab('OCR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'OCR' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
          >
            Prescription OCR
          </button>
        </div>
      </div>

      {/* 1. SYMPTOM CHECKER WIZARD */}
      {activeTab === 'SYMPTOM' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" /> Select Patient Symptoms
            </h3>
            <p className="text-xs text-slate-400">Choose all symptoms currently experienced by the patient:</p>

            <div className="flex flex-wrap gap-2">
              {availableSymptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {symptom} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleRunSymptomChecker}
              disabled={symptomLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
            >
              <Zap className="w-4 h-4" /> Run Predictive Triage Model
            </button>
          </div>

          {/* Results Display */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Diagnostic Recommendation</h3>
            {symptomResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400">Risk Severity Level</p>
                    <p className="text-base font-extrabold text-cyan-400">{symptomResult.riskLevel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Risk Index</p>
                    <p className="text-xl font-black text-rose-400">{symptomResult.riskScore}/100</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-300 mb-2">Predicted Medical Conditions:</p>
                  <div className="space-y-2">
                    {symptomResult.possibleConditions?.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="font-bold text-white">{c.disease}</span>
                        <span className="text-cyan-400 font-mono font-semibold">{c.probability}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <p className="font-bold mb-1">Clinical Triage Advice:</p>
                  <p>{symptomResult.triageAdvice}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Select symptoms and click 'Run Predictive Triage Model'.</p>
            )}
          </div>
        </div>
      )}

      {/* 2. HEALTH RISK CALCULATOR */}
      {activeTab === 'RISK' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Patient Vitals & Risk Input
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={riskForm.age}
                  onChange={(e) => setRiskForm({ ...riskForm, age: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">BMI (kg/m²)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskForm.bmi}
                  onChange={(e) => setRiskForm({ ...riskForm, bmi: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={riskForm.systolicBp}
                  onChange={(e) => setRiskForm({ ...riskForm, systolicBp: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Fasting Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={riskForm.glucose}
                  onChange={(e) => setRiskForm({ ...riskForm, glucose: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateRisk}
              className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Calculate AI Health Risk Index
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Risk Radar Breakdown</h3>
            {riskResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Overall Health Risk Index</span>
                  <span className="text-2xl font-black text-rose-400">{riskResult.overallRiskIndex}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <p className="text-slate-400">Cardiovascular Risk</p>
                    <p className="font-bold text-cyan-300 text-base">{riskResult.breakdown?.cardiovascularRisk}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <p className="text-slate-400">Diabetes Risk</p>
                    <p className="font-bold text-amber-300 text-base">{riskResult.breakdown?.diabetesRisk}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Click 'Calculate AI Health Risk Index'.</p>
            )}
          </div>
        </div>
      )}

      {/* 3. REPORT NLP CLASSIFIER */}
      {activeTab === 'NLP' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Medical Report Document Snippet
            </h3>
            <textarea
              rows="5"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
            ></textarea>
            <button onClick={handleClassifyReport} className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs">
              Run NLP Document Classifier
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">NLP Extraction Output</h3>
            {nlpResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-slate-400">Predicted Category</p>
                  <p className="font-bold text-cyan-400 text-base">{nlpResult.predictedCategory}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-slate-400 mb-1">Extracted Clinical Entities:</p>
                  <div className="flex flex-wrap gap-1">
                    {nlpResult.extractedEntities?.map((ent, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Click 'Run NLP Document Classifier'.</p>
            )}
          </div>
        </div>
      )}

      {/* 4. PRESCRIPTION OCR PARSER */}
      {activeTab === 'OCR' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Scan className="w-4 h-4 text-cyan-400" /> Digital Prescription OCR Scanner
          </h3>
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 text-center space-y-2">
            <Scan className="w-10 h-10 text-cyan-400 mx-auto" />
            <p className="text-xs font-semibold text-white">Upload Handwritten or Printed Prescription Image</p>
            <p className="text-[11px] text-slate-500">Supports PNG, JPG, JPEG for automatic medicine & dosage extraction</p>
          </div>

          <button onClick={handleRunOcr} className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs">
            Scan & Parse Prescription Text
          </button>

          {ocrResult && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <p className="font-bold text-cyan-400">Extracted Prescription Data:</p>
              <p className="font-mono text-slate-300 bg-slate-950 p-2 rounded">{ocrResult.rawText}</p>
              <div className="space-y-1">
                {ocrResult.extractedMedicines?.map((m, i) => (
                  <p key={i} className="text-emerald-300 font-semibold">• {m.name} ({m.dosage}) - {m.frequency}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISuiteView;
