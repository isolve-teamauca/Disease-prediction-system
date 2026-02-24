import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import api from '../api/axios';
import TopNav from '../components/TopNav';
import RiskBadge from '../components/RiskBadge';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { recommendations } from '../data/recommendations';

const PDF_PRIMARY_RED = [185, 28, 28];
const PDF_GRAY = [107, 114, 128];
const PDF_DARK = [31, 41, 55];

const DISEASE_LABELS = {
  heart: 'Heart Disease Risk Assessment',
  diabetes: 'Diabetes Risk Assessment',
  hypertension: 'Hypertension Risk Assessment',
  stroke: 'Stroke Risk Assessment',
};

const FIELD_CONFIG = {
  heart: [
    { name: 'age', label: 'Age', type: 'number', min: 0, max: 120 },
    { name: 'sex', label: 'Sex (0=F, 1=M)', type: 'number', min: 0, max: 1 },
    { name: 'cp', label: 'Chest pain type (0-3)', type: 'number', min: 0, max: 3 },
    { name: 'trestbps', label: 'Resting BP (mm Hg)', type: 'number', min: 0 },
    { name: 'chol', label: 'Cholesterol (mg/dl)', type: 'number', min: 0 },
    { name: 'fbs', label: 'Fasting blood sugar > 120 (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'restecg', label: 'Rest ECG (0-2)', type: 'number', min: 0, max: 2 },
    { name: 'thalach', label: 'Max heart rate', type: 'number', min: 0 },
    { name: 'exang', label: 'Exercise angina (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'oldpeak', label: 'ST depression', type: 'number', min: 0, step: 0.1 },
    { name: 'slope', label: 'Slope (0-2)', type: 'number', min: 0, max: 2 },
    { name: 'ca', label: 'Major vessels (0-3)', type: 'number', min: 0, max: 3 },
    { name: 'thal', label: 'Thal (0-3)', type: 'number', min: 0, max: 3 },
  ],
  diabetes: [
    { name: 'pregnancies', label: 'Pregnancies', type: 'number', min: 0 },
    { name: 'glucose', label: 'Glucose', type: 'number', min: 0 },
    { name: 'blood_pressure', label: 'Blood pressure', type: 'number', min: 0 },
    { name: 'skin_thickness', label: 'Skin thickness', type: 'number', min: 0 },
    { name: 'insulin', label: 'Insulin', type: 'number', min: 0 },
    { name: 'bmi', label: 'BMI', type: 'number', min: 0, step: 0.1 },
    { name: 'diabetes_pedigree_function', label: 'Diabetes pedigree function', type: 'number', min: 0, step: 0.001 },
    { name: 'age', label: 'Age', type: 'number', min: 0 },
  ],
  hypertension: [
    { name: 'age', label: 'Age', type: 'number', min: 0 },
    { name: 'sex', label: 'Sex (0=F, 1=M)', type: 'number', min: 0, max: 1 },
    { name: 'cp', label: 'Chest pain (0-3)', type: 'number', min: 0, max: 3 },
    { name: 'trestbps', label: 'Resting BP', type: 'number', min: 0 },
    { name: 'chol', label: 'Cholesterol', type: 'number', min: 0 },
    { name: 'fbs', label: 'FBS > 120 (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'restecg', label: 'Rest ECG (0-2)', type: 'number', min: 0, max: 2 },
    { name: 'thalach', label: 'Max heart rate', type: 'number', min: 0 },
    { name: 'exang', label: 'Exercise angina (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'oldpeak', label: 'ST depression', type: 'number', min: 0, step: 0.1 },
    { name: 'slope', label: 'Slope (0-2)', type: 'number', min: 0, max: 2 },
    { name: 'ca', label: 'Major vessels (0-3)', type: 'number', min: 0, max: 3 },
    { name: 'thal', label: 'Thal (0-3)', type: 'number', min: 0, max: 3 },
  ],
  stroke: [
    { name: 'gender', label: 'Gender (0=F, 1=M)', type: 'number', min: 0, max: 1 },
    { name: 'age', label: 'Age', type: 'number', min: 0 },
    { name: 'hypertension', label: 'Hypertension (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'heart_disease', label: 'Heart disease (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'ever_married', label: 'Ever married (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'work_type', label: 'Work type (0-4)', type: 'number', min: 0, max: 4 },
    { name: 'residence_type', label: 'Residence type (0/1)', type: 'number', min: 0, max: 1 },
    { name: 'avg_glucose_level', label: 'Avg glucose level', type: 'number', min: 0 },
    { name: 'bmi', label: 'BMI', type: 'number', min: 0, step: 0.1 },
    { name: 'smoking_status', label: 'Smoking status (0-3)', type: 'number', min: 0, max: 3 },
  ],
};

const RISK_BORDER_COLORS = {
  green: 'border-l-emerald-500 bg-emerald-50',
  orange: 'border-l-amber-500 bg-amber-50',
  red: 'border-l-red-500 bg-red-50',
  darkred: 'border-l-red-800 bg-red-100',
};

const RISK_PERCENTAGE_COLORS = {
  green: 'text-emerald-600',
  orange: 'text-amber-600',
  red: 'text-red-600',
  darkred: 'text-red-800',
};

export default function PredictPage() {
  const { disease } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const normalized = disease?.toLowerCase() || '';
  const config = FIELD_CONFIG[normalized];
  const title = DISEASE_LABELS[normalized] || `${normalized} Risk`;

  const initialFeatures = useMemo(() => {
    if (!config) return {};
    return config.reduce((acc, f) => ({ ...acc, [f.name]: 0 }), {});
  }, [config]);

  const [features, setFeatures] = useState(initialFeatures);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [verifiedPatient, setVerifiedPatient] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const updateFeature = (name, value) => setFeatures((f) => ({ ...f, [name]: value === '' ? 0 : Number(value) }));

  const handleVerifyPatient = async (e) => {
    e.preventDefault();
    const id = patientId.trim();
    if (!id) {
      toast.error('Please enter a patient ID');
      return;
    }
    setVerifying(true);
    setVerifiedPatient(null);
    try {
      const { data } = await api.get(`/api/patients/${id}/`);
      setVerifiedPatient({
        id: data.id,
        full_name: data.user?.full_name || 'Patient',
      });
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('No patient found with that ID');
      } else {
        toast.error(err.response?.data?.detail || 'Failed to verify patient');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!config) {
      toast.error('Invalid disease.');
      return;
    }
    if (user?.role === 'provider' && !verifiedPatient) {
      toast.error('Please verify a patient before submitting');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const body = user?.role === 'provider'
        ? { features, patient_id: verifiedPatient.id }
        : { features };
      const { data } = await api.post(`/api/predict/${normalized}/`, body);
      setResult(data);
    } catch (err) {
      const data = err.response?.data;
      let message = 'Prediction failed.';
      if (data) {
        const d = data.error ?? data.detail;
        if (typeof d === 'string') message = d;
        else if (Array.isArray(d) && d.length) message = d[0]?.message || String(d[0]);
        else if (d && typeof d === 'object') message = d.message || JSON.stringify(d);
        if (data.hint && typeof data.hint === 'string') message += ' ' + data.hint;
      }
      if (err.response?.status === 500 || err.response?.status === 503) {
        message = message || 'Prediction failed.';
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen relative">
        <TopNav />
        <main className="p-6 max-w-6xl mx-auto">
          <p className="text-gray-500">Unknown disease. Choose: heart, diabetes, hypertension, stroke.</p>
        </main>
      </div>
    );
  }

  const diseaseDisplayName = DISEASE_LABELS[normalized] || normalized.replace(/_/g, ' ');
  const riskLevelKey = result?.risk_level === 'Medium' ? 'Moderate' : result?.risk_level;
  const preventiveBullets = (result && recommendations[normalized]?.[riskLevelKey]) ? recommendations[normalized][riskLevelKey] : [];

  const downloadReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    doc.setFillColor(...PDF_PRIMARY_RED);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MedPredict — Disease Risk Report', margin, 18);

    doc.setTextColor(...PDF_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 20;
    const patientName = verifiedPatient?.full_name ?? user?.full_name ?? 'Patient';
    const patientIdStr = verifiedPatient?.id != null ? String(verifiedPatient.id) : (user?.id != null ? String(user.id) : '—');
    doc.text(`Patient: ${patientName}`, margin, y);
    y += 6;
    doc.text(`Patient ID: ${patientIdStr}`, margin, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Disease tested: ${diseaseDisplayName}`, margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const riskPct = (Number(result.probability) * 100).toFixed(1);
    doc.text(`Risk Probability: ${riskPct}%`, margin, y);
    y += 8;
    doc.setTextColor(...PDF_PRIMARY_RED);
    doc.setFont('helvetica', 'bold');
    doc.text(`Risk Level: ${result.risk_level}`, margin, y);
    y += 10;
    doc.setTextColor(...PDF_DARK);
    doc.setFont('helvetica', 'normal');
    if (result.risk_advice) {
      doc.setFontSize(10);
      const adviceLines = doc.splitTextToSize(`Clinical advice: ${result.risk_advice}`, pageW - 2 * margin);
      doc.text(adviceLines, margin, y);
      y += adviceLines.length * 6 + 12;
    } else {
      y += 8;
    }

    const recKey = result.risk_level === 'Medium' ? 'Moderate' : result.risk_level;
    const pdfBullets = recommendations[normalized]?.[recKey];
    if (pdfBullets?.length) {
      if (y > 240) doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...PDF_PRIMARY_RED);
      doc.text('Preventive Recommendations', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_DARK);
      pdfBullets.forEach((bullet) => {
        const lines = doc.splitTextToSize(`• ${bullet}`, pageW - 2 * margin - 4);
        if (y + lines.length * 5 > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, margin + 2, y);
        y += lines.length * 5 + 2;
      });
      y += 8;
    }

    doc.setFontSize(8);
    doc.setTextColor(...PDF_GRAY);
    const footerLines = doc.splitTextToSize(
      'This report is for clinical reference only. Consult a licensed healthcare professional before making medical decisions.',
      pageW - 2 * margin
    );
    const pageH = doc.internal.pageSize.getHeight();
    const footerY = pageH - 20;
    doc.text(footerLines, margin, footerY);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `MedPredict_Report_${normalized}_${dateStr}.pdf`;
    doc.save(filename);
    toast.success('Report downloaded');
  };

  return (
    <div className="min-h-screen relative">
      <TopNav />
      <main className="p-6 max-w-6xl mx-auto overflow-auto">
        <h1 className="font-heading text-2xl font-bold text-white mb-6">{title}</h1>

        {user?.role === 'provider' && verifiedPatient && (
          <p className="mb-4 text-sm font-medium text-gray-300">
            Predicting for: <span className="text-primary">{verifiedPatient.full_name}</span> (Patient ID: {verifiedPatient.id})
          </p>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 space-y-4">
            {user?.role === 'provider' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-content mb-1">Patient ID (patient code)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter patient code"
                    value={patientId}
                    onChange={(e) => { setPatientId(e.target.value); setVerifiedPatient(null); }}
                    className="flex-1 bg-input rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPatient}
                    disabled={verifying || !patientId.trim()}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                  >
                    {verifying ? <><Spinner className="h-4 w-4 border-2 border-white border-t-transparent" /> Verify</> : 'Verify'}
                  </button>
                </div>
                {verifiedPatient && (
                  <p className="text-sm text-content">
                    Verified: <span className="font-medium text-content">{verifiedPatient.full_name}</span> (ID: {verifiedPatient.id})
                  </p>
                )}
              </div>
            )}
            {config.map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-content mb-1">{f.label}</label>
                <input
                  type={f.type}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={features[f.name] ?? ''}
                  onChange={(e) => updateFeature(f.name, e.target.value)}
                  className="w-full bg-input rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={submitting || (user?.role === 'provider' && !verifiedPatient)} className="mt-6 w-full max-w-2xl bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Spinner className="h-5 w-5 border-2 border-white border-t-transparent" /> Running prediction...</> : 'Run Prediction'}
          </button>
        </form>

        {result && (
          <div className="mt-8 max-w-2xl">
            <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">Result</p>
              <h2 className="font-heading font-semibold text-lg text-content mb-4">{diseaseDisplayName}</h2>
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <span className={`font-heading font-bold text-4xl ${RISK_PERCENTAGE_COLORS[result.risk_color] || 'text-content'}`}>
                  {(Number(result.probability) * 100).toFixed(1)}%
                </span>
                <RiskBadge level={result.risk_level} color={result.risk_color} />
              </div>
              <p className="text-sm text-gray-500 mb-4">Risk probability</p>
              {result.risk_advice && (
                <div className={`rounded-xl border-l-4 p-4 text-sm mb-6 ${RISK_BORDER_COLORS[result.risk_color] || 'border-l-gray-400 bg-gray-50'}`}>
                  <p className="font-medium text-content mb-1">Recommendation</p>
                  <p className="text-content">{result.risk_advice}</p>
                </div>
              )}
              {preventiveBullets.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 mb-6">
                  <h3 className="font-heading font-semibold text-content mb-3 text-red-800">Preventive Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-content">
                    {preventiveBullets.map((bullet, i) => (
                      <li key={i} className="pl-1">{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={downloadReport}
                  className="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-xl font-medium hover:bg-primary hover:text-white transition-colors"
                >
                  Download Report
                </button>
                <button
                  type="button"
                  onClick={() => navigate(user?.role === 'patient' ? '/dashboard/patient' : '/dashboard/provider')}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90"
                >
                  Save & View History
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
