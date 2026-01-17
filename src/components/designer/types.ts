export interface DesignElement {
  id: string;
  type: "text" | "image";
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  imageUrl?: string;
}

export interface ProductMockup {
  id: string;
  name: string;
  image: string;
  designArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}
