export class MenuLiveItemOutput {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  mediaId: string;
  mediaUrl: string | null;
  mediaImgixUrl: string | null;

  constructor(
    id: string | null,
    name: string | null,
    description: string | null,
    ingredients: string[] | null,
    price: number | null,
    mediaId: string | null,
    mediaUrl: string | null,
    mediaImgixUrl: string | null
  ) {
    this.id = id || '';
    this.name = name || '';
    this.description = description || '';
    this.ingredients = ingredients || [];
    this.price = price || 0;
    this.mediaId = mediaId || '';
    this.mediaUrl = mediaUrl || '';
    this.mediaImgixUrl = mediaImgixUrl || '';
  }
};