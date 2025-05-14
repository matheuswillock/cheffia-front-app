export class MenuLiveItemOutput {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  MediaId: string;
  MediaUrl: string
  MediaImgixUrl: string;

  constructor(
    id: string | null,
    name: string | null,
    description: string | null,
    ingredients: string[] | null,
    price: number | null,
    MediaId: string | null,
    MediaUrl: string | null,
    MediaImgixUrl: string | null
  ) {
    this.id = id || '';
    this.name = name || '';
    this.description = description || '';
    this.ingredients = ingredients || [];
    this.price = price || 0;
    this.MediaId = MediaId || '';
    this.MediaUrl = MediaUrl || '';
    this.MediaImgixUrl = MediaImgixUrl || '';
  }
};