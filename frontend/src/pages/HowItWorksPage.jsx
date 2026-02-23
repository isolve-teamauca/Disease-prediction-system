import { Link } from 'react-router-dom';
import { Heart, Activity, Shield, AlertCircle, Lock } from 'lucide-react';
import TopNav from '../components/TopNav';

const DISEASES = [
  {
    slug: 'heart',
    name: 'Heart Disease',
    description: 'Estimates risk of cardiovascular disease using factors such as age, blood pressure, cholesterol, chest pain type, and exercise-related metrics.',
    icon: Heart,
  },
  {
    slug: 'diabetes',
    name: 'Diabetes',
    description: 'Assesses diabetes risk based on pregnancies, glucose, blood pressure, skin thickness, insulin, BMI, family history, and age.',
    icon: Activity,
  },
  {
    slug: 'hypertension',
    name: 'Hypertension',
    description: 'Evaluates high blood pressure risk using clinical and lifestyle indicators similar to heart disease assessment.',
    icon: Activity,
  },
  {
    slug: 'stroke',
    name: 'Stroke',
    description: 'Estimates stroke risk using gender, age, hypertension and heart disease history, lifestyle, glucose levels, BMI, and smoking status.',
    icon: Shield,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen page-gradient-bg">
      <TopNav />
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-bold text-content mb-2">How MedPredict Works</h1>
        <p className="text-content/80 text-sm mb-8">Understanding our disease risk assessment tool</p>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-content mb-3">What MedPredict Does</h2>
          <div className="bg-light/95 rounded-2xl shadow-card p-6 border border-secondary/40">
            <p className="text-content leading-relaxed">
              MedPredict is a data-driven disease risk assessment system that helps patients and healthcare providers
              understand the likelihood of developing certain conditions. You enter clinical and lifestyle information
              — such as age, blood pressure, glucose levels, and other health metrics — and MedPredict returns a risk
              probability score along with general lifestyle recommendations. It is designed to support clinical
              judgment, not replace it.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-content mb-3">The Four Diseases We Assess</h2>
          <div className="space-y-4">
            {DISEASES.map(({ slug, name, description, icon: Icon }) => (
              <div
                key={slug}
                className="bg-light/95 rounded-2xl shadow-card p-5 border border-secondary/40 flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-content mb-1">{name}</h3>
                  <p className="text-sm text-content/80 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-content mb-3">How the ML Model Works</h2>
          <div className="bg-light/95 rounded-2xl shadow-card p-6 border border-secondary/40">
            <p className="text-gray-700 leading-relaxed mb-4">
              MedPredict uses machine learning models trained on real medical datasets. Each disease has its own
              model built with a <strong>Random Forest classifier</strong>—an approach that combines many
              decision trees to produce stable, interpretable risk estimates. Your inputs (e.g., age, blood
              pressure, glucose) are scaled and fed into the model, which outputs a <strong>probability
              score</strong> between 0% and 100%. That score is mapped to a risk level (Low, Moderate, High,
              or Critical) and paired with general preventive recommendations. The models are not a substitute
              for medical testing or diagnosis; they are screening tools to support conversations with your
              health provider.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-content mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Disclaimer
          </h2>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
            <p className="text-content font-medium">
              This tool assists healthcare professionals and does not replace medical diagnosis.
            </p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              MedPredict provides risk estimates for informational and screening purposes only. Always consult
              a licensed healthcare professional for diagnosis, treatment, and medical decisions.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-content mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Data Privacy
          </h2>
          <div className="bg-light/95 rounded-2xl shadow-card p-6 border border-secondary/40">
            <p className="text-content leading-relaxed">
              Patient data is stored securely and only accessible by authorized health providers. Predictions and
              patient information are used solely to support care within the MedPredict system and are not
              shared with third parties for marketing or other purposes.
            </p>
          </div>
        </section>

        <div className="flex justify-center pt-4">
          <Link
            to="/login"
            className="bg-primary text-light px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Sign in to MedPredict
          </Link>
        </div>
      </main>
    </div>
  );
}
