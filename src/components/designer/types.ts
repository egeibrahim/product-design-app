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
  // Text styling
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  // Transform
  rotation?: number;
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

export interface DesignState {
  elements: DesignElement[];
  productId: string;
}
