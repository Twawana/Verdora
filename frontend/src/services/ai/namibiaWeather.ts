import type { PlantingRecommendation } from '../api/types';
import { assessPlantingMonth, getCropByName, monthNameToIndex } from '../api/cropLibraryService';
import { findPlantingGuide, isGoodTimeToPlant } from '../calendar/plantingGuideService';
import { currentMonthName, isNamibiaDrySeason } from './farmerContext';

/** Build OpenWeather query strings — tries Namibia-disambiguated forms. */
export function buildWeatherQueryVariants(location: string | undefined): string[] {
  if (!location?.trim()) return [];

  const raw = location.trim();
  const firstPart = raw.split(',')[0]?.trim() ?? raw;
  const variants = new Set<string>();

  variants.add(`${firstPart}, NA`);
  variants.add(`${firstPart}, Namibia`);
  if (firstPart !== raw) variants.add(`${raw}, Namibia`);
  variants.add(firstPart);

  return [...variants];
}

function statusFromGuide(cropName: string, monthIndex: number): {
  status: PlantingRecommendation['status'];
  reason: string;
} | null {
  const guide = findPlantingGuide(cropName);
  if (guide) {
    const inSeason = isGoodTimeToPlant(guide);
    if (inSeason) {
      return {
        status: 'ideal',
        reason: `${cropName} is typically planted around ${guide.bestPlantingMonths} — ${currentMonthName()} fits your regional guide.`,
      };
    }
    return {
      status: 'avoid',
      reason: `${cropName} is usually planted ${guide.bestPlantingMonths}. ${currentMonthName()} is outside the main window — wait or use irrigation if transplanting.`,
    };
  }
  return null;
}

/** Season- and crop-aware planting cards (Namibia dry season + planting guides). */
export async function buildSeasonalCropRecommendations(
  crops: string[],
  temp: number,
  humidity: number,
): Promise<PlantingRecommendation[]> {
  const monthIndex = monthNameToIndex(currentMonthName());
  const drySeason = isNamibiaDrySeason();

  return Promise.all(
    crops.map(async (cropName) => {
      const fromGuide = statusFromGuide(cropName, monthIndex);
      if (fromGuide) {
        let { status, reason } = fromGuide;

        if (drySeason && status === 'ideal') {
          const entry = await getCropByName(cropName);
          const needsWater =
            entry?.water_requirement?.toLowerCase().includes('high') ||
            entry?.water_requirement?.toLowerCase().includes('flooded');
          if (needsWater) {
            status = 'caution';
            reason = `${cropName} can plant now but dry season means reliable irrigation or water is essential.`;
          }
        }

        if (temp > 35) {
          status = 'avoid';
          reason = `Heat stress at ${temp}°C — delay transplanting ${cropName}; irrigate early morning if already in ground.`;
        } else if (humidity > 80 && status === 'ideal') {
          status = 'caution';
          reason = `High humidity (${humidity}%) — watch ${cropName} for fungal issues; improve airflow.`;
        }

        return { cropName, status, reason };
      }

      const entry = await getCropByName(cropName);
      if (entry && monthIndex > 0) {
        let status = assessPlantingMonth(entry, monthIndex);
        let reason =
          status === 'ideal'
            ? `${currentMonthName()} is in the planting window for ${cropName}.`
            : status === 'caution'
              ? `${currentMonthName()} is near the edge of the planting window for ${cropName}.`
              : `${currentMonthName()} is outside the usual planting months for ${cropName} (${entry.planting_window.join(', ')}).`;

        if (drySeason && entry.water_requirement?.toLowerCase().includes('high')) {
          status = status === 'ideal' ? 'caution' : status;
          reason += ' Dry season — ensure water before planting.';
        }

        return { cropName, status, reason };
      }

      let status: PlantingRecommendation['status'] = 'caution';
      let reason = `Current ${temp}°C, ${humidity}% humidity — check the Crop Library for ${cropName} planting months.`;

      if (temp >= 18 && temp <= 32 && humidity < 75) status = 'ideal';
      if (temp > 35) status = 'avoid';
      if (humidity > 85) status = 'caution';

      return { cropName, status, reason };
    }),
  );
}

export function drySeasonFarmingTip(temp: number, humidity: number): string {
  if (!isNamibiaDrySeason()) {
    if (temp >= 28 && humidity > 75) {
      return 'Humid conditions — delay spraying; good for transplanting if fields are ready.';
    }
    if (temp >= 20 && temp <= 30 && humidity < 70) {
      return 'Favourable for transplanting vegetables and direct-seeding.';
    }
    return 'Monitor forecast daily; protect seedlings from midday heat.';
  }

  if (temp < 10) {
    return 'Cool mornings — protect sensitive seedlings from frost; water mid-morning.';
  }
  if (humidity < 40) {
    return 'Dry season: irrigate early morning or evening; mulch to retain soil moisture.';
  }
  return 'Dry season — plan irrigation, conserve moisture, and favour drought-tolerant crops.';
}
