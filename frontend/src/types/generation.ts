export type GenerationStyle = 'Realistic' | 'Artistic' | 'Minimalist' | 'Vintage';

export interface Generation {
  id: string;
  userId: string;
  prompt: string;
  style: GenerationStyle;
  imageUrl: string;
  status: string;
  createdAt: string;
}

export interface GenerationFormData {
  image: File;
  prompt: string;
  style: GenerationStyle;
}

