declare module "imagetracerjs" {
  interface Options {
    numberofcolors?: number;
    scale?: number;
    simplify?: number;
    pathomit?: number;
    ltres?: number;
    qtres?: number;
    [key: string]: unknown;
  }

  const ImageTracer: {
    imageToSVG: (url: string, callback: (svgString: string) => void, options?: Options | string) => void;
    imagedataToSVG: (imageData: ImageData, options?: Options | string) => string;
    optionpresets: Record<string, Options>;
  };

  export = ImageTracer;
}
