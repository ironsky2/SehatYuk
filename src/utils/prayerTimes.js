import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

// Daftar kota di Indonesia untuk fallback manual
export const INDONESIAN_CITIES = [
  { name: 'Jakarta Selatan', lat: -6.2615, lng: 106.8106 },
  { name: 'Jakarta Pusat', lat: -6.1805, lng: 106.8284 },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Semarang', lat: -6.9667, lng: 110.4167 },
  { name: 'Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
  { name: 'Palembang', lat: -2.9761, lng: 104.7754 },
  { name: 'Denpasar (Bali)', lat: -8.6705, lng: 115.2126 },
  { name: 'Banjarmasin', lat: -3.3167, lng: 114.5901 }
];

export function getPrayerTimesForDate(date = new Date(), lat = -6.2615, lng = 106.8106) {
  try {
    const coordinates = new Coordinates(lat, lng);
    // Kemenag / MABIMS params: Subuh 20°, Isya 18°
    const params = CalculationMethod.Singapore(); // Sesuai standar MABIMS (Kemenag RI)
    const prayers = new PrayerTimes(coordinates, date, params);

    // Imsak adalah 10 menit sebelum Subuh sesuai tradisi Kemenag RI
    const imsakTime = new Date(prayers.fajr.getTime() - 10 * 60 * 1000);

    const formatTime = (d) => {
      if (!d) return '--:--';
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    };

    return {
      imsak: formatTime(imsakTime),
      subuh: formatTime(prayers.fajr),
      terbit: formatTime(prayers.sunrise),
      dzuhur: formatTime(prayers.dhuhr),
      ashar: formatTime(prayers.asr),
      maghrib: formatTime(prayers.maghrib),
      isya: formatTime(prayers.isha),
      raw: {
        imsak: imsakTime,
        subuh: prayers.fajr,
        maghrib: prayers.maghrib
      }
    };
  } catch (err) {
    console.error('Error calculating prayer times:', err);
    // Fallback default
    return {
      imsak: '04:18',
      subuh: '04:28',
      terbit: '05:42',
      dzuhur: '11:49',
      ashar: '14:58',
      maghrib: '17:52',
      isya: '19:01',
      raw: {
        imsak: new Date(new Date().setHours(4, 18, 0, 0)),
        subuh: new Date(new Date().setHours(4, 28, 0, 0)),
        maghrib: new Date(new Date().setHours(17, 52, 0, 0))
      }
    };
  }
}
