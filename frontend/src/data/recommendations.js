/**
 * Preventive lifestyle recommendations by disease and risk level.
 * General advice only — not clinical prescriptions.
 */
export const recommendations = {
  heart: {
    Low: [
      'Maintain a heart-healthy diet rich in vegetables, fruits, and whole grains.',
      'Aim for at least 150 minutes of moderate aerobic activity per week.',
      'Keep cholesterol and blood pressure within healthy ranges with routine checks.',
      'Avoid smoking and limit alcohol to moderate levels.',
    ],
    Moderate: [
      'Reduce saturated fat and sodium; focus on fiber and lean protein.',
      'Engage in 30 minutes of moderate cardio most days of the week.',
      'Schedule a follow-up with your doctor to review heart health markers.',
      'Monitor blood pressure regularly at home if advised.',
      'Limit alcohol and avoid smoking.',
    ],
    High: [
      'Reduce daily sodium intake to under 1,500 mg.',
      'Engage in 30 minutes of moderate cardio 5x per week.',
      'Schedule a cardiology consultation within 2 weeks.',
      'Monitor blood pressure daily.',
      'Avoid smoking and limit alcohol consumption.',
    ],
    Critical: [
      'Seek prompt medical evaluation; do not delay care.',
      'Reduce sodium to under 1,500 mg and follow a strict heart-healthy diet.',
      'Only exercise as cleared by your cardiologist.',
      'Monitor blood pressure and symptoms daily; report any worsening.',
      'Avoid smoking entirely and eliminate or strictly limit alcohol.',
    ],
  },
  diabetes: {
    Low: [
      'Choose whole grains and limit added sugars and refined carbs.',
      'Stay active with at least 150 minutes of moderate activity per week.',
      'Maintain a healthy weight and get routine blood glucose checks.',
      'Stay hydrated and prioritize consistent meal timing.',
    ],
    Moderate: [
      'Follow a balanced diet with controlled carbohydrate portions.',
      'Aim for 30 minutes of physical activity most days.',
      'Check blood sugar as advised by your care team.',
      'Schedule a diabetes care visit to review targets and lifestyle.',
      'Limit sugary drinks and processed snacks.',
    ],
    High: [
      'Work with a dietitian on a personalized meal plan and carb management.',
      'Engage in regular physical activity as approved by your doctor.',
      'Monitor blood glucose as recommended; keep a log.',
      'Schedule a diabetes specialist visit within 2 weeks.',
      'Avoid smoking and limit alcohol; both affect glucose control.',
    ],
    Critical: [
      'Seek immediate medical guidance for blood sugar and medication review.',
      'Strictly follow your prescribed diet and medication plan.',
      'Do not start or change exercise without medical clearance.',
      'Monitor glucose and symptoms closely; report dizziness or confusion.',
      'Ensure someone close knows your condition and emergency steps.',
    ],
  },
  hypertension: {
    Low: [
      'Limit sodium and eat plenty of potassium-rich fruits and vegetables.',
      'Stay active with at least 150 minutes of moderate activity weekly.',
      'Have blood pressure checked at least once a year.',
      'Limit alcohol and avoid smoking.',
    ],
    Moderate: [
      'Reduce sodium to under 2,300 mg per day; aim for under 1,500 mg if advised.',
      'Get 30 minutes of moderate activity most days.',
      'Monitor blood pressure at home if your doctor recommends it.',
      'Schedule a follow-up to review lifestyle and medication needs.',
      'Limit caffeine and alcohol; avoid smoking.',
    ],
    High: [
      'Reduce daily sodium intake to under 1,500 mg.',
      'Engage in 30 minutes of moderate cardio 5x per week.',
      'Schedule a cardiology or hypertension consultation within 2 weeks.',
      'Monitor blood pressure daily and keep a log.',
      'Avoid smoking and limit alcohol consumption.',
    ],
    Critical: [
      'Seek prompt medical care; do not delay evaluation.',
      'Restrict sodium strictly and take medications as prescribed.',
      'Only exercise as cleared by your doctor.',
      'Monitor blood pressure and symptoms daily; report chest pain or severe headache.',
      'Avoid smoking entirely and eliminate alcohol until medically cleared.',
    ],
  },
  stroke: {
    Low: [
      'Maintain healthy blood pressure and blood sugar through diet and activity.',
      'Aim for 150 minutes of moderate aerobic activity per week.',
      'Avoid smoking and limit alcohol.',
      'Have routine check-ups to monitor vascular risk factors.',
    ],
    Moderate: [
      'Control blood pressure and blood sugar with lifestyle and any prescribed care.',
      'Get regular physical activity most days of the week.',
      'Schedule a follow-up to review stroke risk and prevention.',
      'Limit sodium and alcohol; avoid smoking.',
      'Know the signs of stroke (e.g. FAST) and when to call emergency services.',
    ],
    High: [
      'Reduce sodium to under 1,500 mg and follow a heart- and brain-healthy diet.',
      'Engage in 30 minutes of moderate activity 5x per week if medically cleared.',
      'Schedule a neurology or vascular consultation within 2 weeks.',
      'Monitor blood pressure daily; take medications as prescribed.',
      'Avoid smoking and limit alcohol; know stroke warning signs.',
    ],
    Critical: [
      'Seek immediate medical evaluation; time is critical for stroke prevention and care.',
      'Strictly follow prescribed medications and diet for blood pressure and clotting.',
      'Do not start or change exercise without medical approval.',
      'Monitor blood pressure and report any sudden weakness, speech change, or vision loss.',
      'Ensure family or caregivers know stroke signs and your emergency plan.',
    ],
  },
};
