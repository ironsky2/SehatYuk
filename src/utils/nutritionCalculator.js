/**
 * Kalkulator Kalori & Nutrisi Medis Sehat Yuk!
 * Berdasarkan formula standar emas klinis:
 * 1. Mifflin-St Jeor Equation (BMR Wanita)
 * 2. TDEE dengan Physical Activity Level (PAL)
 * 3. Defisit Sehat Bertahap (0.4 - 0.6 kg/minggu)
 * 4. Safety floor medis WHO (min. 1.200 kkal wanita, min. 1.500 kkal ibu menyusui)
 * 5. Standar Lingkar Pinggang Kemenkes RI / WHO Asia-Pasifik (<= 80 cm)
 */

export function calculateNutritionMetrics({
  age,
  height,
  currentWeight,
  startWeight,
  targetWeight,
  waistCircumference,
  isNursing = false
}) {
  const w = Number(currentWeight) || Number(startWeight) || 0;
  const h = Number(height) || 0;
  const a = Number(age) || 0;
  const startW = Number(startWeight) || w;
  const targetW = Number(targetWeight) || 0;
  const waist = Number(waistCircumference) || 0;

  if (w <= 0 || h <= 0 || a <= 0) {
    return {
      isValid: false,
      bmr: 0,
      tdee: 0,
      recommendedCalories: 1400,
      deficit: 0,
      bmi: 0,
      bmiCategory: 'Belum Lengkap',
      waistStatus: '',
      formulaName: 'Mifflin-St Jeor',
      description: 'Lengkapi Usia, TB, dan BB untuk perhitungan target kalori yang akurat.'
    };
  }

  // 1. Hitung Indeks Massa Tubuh (BMI Standar Asia-Pasifik WHO)
  const heightInMeters = h / 100;
  const bmi = Number((w / (heightInMeters * heightInMeters)).toFixed(1));
  let bmiCategory = 'Normal';
  if (bmi < 18.5) {
    bmiCategory = 'Berat Kurang';
  } else if (bmi < 23) {
    bmiCategory = 'Ideal / Normal';
  } else if (bmi < 25) {
    bmiCategory = 'Kelebihan Berat (Overweight)';
  } else {
    bmiCategory = 'Obesitas';
  }

  // 2. BMR Mifflin-St Jeor (Standar Klinis untuk Wanita)
  // BMR = 10 * BB(kg) + 6.25 * TB(cm) - 5 * Usia(tahun) - 161
  const bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);

  // 3. TDEE (Total Daily Energy Expenditure) - Faktor aktivitas ringan (1.25)
  const tdee = Math.round(bmr * 1.25);

  // 4. Perhitungan Target Kalori Berdasarkan Sasaran Berat Badan
  let deficit = 0;
  let targetCalories = tdee;

  if (targetW > 0 && targetW < w) {
    // Target Fat Loss Sehat: Defisit kalori bertahap 400 - 500 kkal/hari
    deficit = 450;
    targetCalories = tdee - deficit;
  } else if (targetW > 0 && targetW > w) {
    // Target Kenaikan Berat Badan Sehat
    deficit = -300;
    targetCalories = tdee + 300;
  } else {
    // Pemeliharaan (Maintenance)
    deficit = 0;
    targetCalories = tdee;
  }

  // 5. Tambahan Kalori Ibu Menyusui (Laktasi - Standar Kemenkes RI +350 kkal)
  if (isNursing) {
    targetCalories += 350;
  }

  // 6. Safety Floor Medis (Batas Aman Minimal)
  // Minimal 1.200 kkal untuk wanita agar tidak terjadi malnutrisi / starvation response
  // Minimal 1.500 kkal jika sedang menyusui agar produksi ASI tetap terjaga
  const safetyFloor = isNursing ? 1500 : 1200;
  if (targetCalories < safetyFloor) {
    targetCalories = safetyFloor;
  }

  // Pembulatan rapi ke kelipatan 25 kkal terdekat
  targetCalories = Math.round(targetCalories / 25) * 25;

  // 7. Evaluasi Lingkar Pinggang (Standar Kemenkes RI untuk Wanita Asia: maks 80 cm)
  let waistStatus = '';
  if (waist > 0) {
    if (waist <= 80) {
      waistStatus = `Ideal (${waist} cm ≤ 80 cm)`;
    } else {
      waistStatus = `Perhatian (${waist} cm > 80 cm, potensi lemak viseral)`;
    }
  }

  return {
    isValid: true,
    bmr,
    tdee,
    recommendedCalories: targetCalories,
    deficit: tdee - targetCalories,
    bmi,
    bmiCategory,
    waistStatus,
    formulaName: 'Mifflin-St Jeor + TDEE 1.25',
    description: isNursing
      ? 'Dihitung dengan rumus medis Mifflin-St Jeor + buffer laktasi (+350 kkal).'
      : targetW < w
      ? 'Dihitung untuk fat loss aman (~0.5 kg/minggu) tanpa rasa lapar berlebih.'
      : 'Dihitung untuk mempertahankan berat badan ideal (maintenance).'
  };
}
