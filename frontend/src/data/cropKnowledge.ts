/**
 * Crop-specific reference data for local diagnosis (used until AI API is connected).
 * Results are matched to the farmer's actual registered crops — not random.
 */
export interface CropKnowledgeEntry {
  commonDiseases: { name: string; treatment: string; confidence: number }[];
  healthyTreatment: string;
}

export const CROP_KNOWLEDGE: Record<string, CropKnowledgeEntry> = {
  Rice: {
    commonDiseases: [
      {
        name: 'Bacterial Leaf Blight',
        treatment: 'Use resistant varieties. Avoid excess nitrogen. Improve field drainage.',
        confidence: 0.79,
      },
    ],
    healthyTreatment: 'Maintain 2–5 cm flood depth. Scout for planthopper after rains.',
  },
  Tomato: {
    commonDiseases: [
      {
        name: 'Early Blight',
        treatment: 'Apply copper fungicide. Remove lower infected leaves. Improve air flow.',
        confidence: 0.87,
      },
    ],
    healthyTreatment: 'Water at base. Stake plants. Monitor for blossom end rot.',
  },
  Corn: {
    commonDiseases: [
      {
        name: 'Northern Corn Leaf Blight',
        treatment: 'Rotate crops. Use tolerant hybrids. Fungicide if severe.',
        confidence: 0.81,
      },
    ],
    healthyTreatment: 'Maintain moisture during silking. Scout for armyworm.',
  },
  Eggplant: {
    commonDiseases: [
      {
        name: 'Fruit Rot',
        treatment: 'Improve drainage. Avoid wetting fruit. Remove affected fruits.',
        confidence: 0.83,
      },
    ],
    healthyTreatment: 'Prune for airflow. Mulch to retain soil moisture.',
  },
  Cassava: {
    commonDiseases: [
      {
        name: 'Cassava Mosaic Disease',
        treatment: 'Remove infected plants. Use certified virus-free cuttings.',
        confidence: 0.76,
      },
    ],
    healthyTreatment: 'Weed regularly. Harvest at 8–12 months depending on variety.',
  },
  Onion: {
    commonDiseases: [
      {
        name: 'Purple Blotch',
        treatment: 'Avoid overhead irrigation. Apply fungicide at first signs.',
        confidence: 0.78,
      },
    ],
    healthyTreatment: 'Keep bulbs dry before storage. Rotate with non-allium crops.',
  },
};

export const DEFAULT_CROP_KNOWLEDGE: CropKnowledgeEntry = {
  commonDiseases: [],
  healthyTreatment: 'Continue regular monitoring and record observations in your calendar.',
};
