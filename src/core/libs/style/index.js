import store from 'store';
import { app_config } from 'config';
import verbosity from 'core/libs/verbosity'
import * as errorHandlers from 'core/libs/errorhandler'

const { appTheme_desiredContrast, appTheme_container } = app_config

export const theme = {
  get: (key) => {
    const raw = store.get(appTheme_container)
    if(!raw) return false
    let container = []
    try {
      raw.forEach((e)=>{container[e.key] = e.value})
    } catch (error) {
      return errorHandlers.onError.invalid_data(error, "ThemeScheme")
    }
    return container
  },
  set: (data) => {
    if (!data || data.length > 2) return false
    try {
        let mix = []
        const obj = Object.entries(data)
        obj.forEach((e) => {
            mix.push({key: e[0], value: e[1]})
        })
        return store.set(appTheme_container, mix)
    } catch (error) {
        console.log(error)
        return false
    }
  },
  raw: () =>  {
    return store.get(appTheme_container)
  }
} 

export function get_style_rule_value(selector, style)
{
 const selector_lowercase = selector.toLowerCase();
 const selector_parsed = selector_lowercase.substr(0,1)==='.' ?  selector_lowercase.substr(1) : '.'+selector_lowercase;

 for (let i = 0; i < document.styleSheets.length; i++)
 {
  let styleSheet = document.styleSheets[i];
  let rules = styleSheet.cssRules ? styleSheet.cssRules : styleSheet.rules;
 
  for (var j = 0; j < rules.length; j++)
  {
    if (rules[j].selectorText)
    {
     var check = rules[j].selectorText.toLowerCase();
     switch (check)
     {
      case selector_lowercase  :
      case selector_parsed : return rules[j].style[style];
     }
    }
   }
  }
 }

export function getOptimalOpacityFromIMG(payload, callback) {
  const { textColor, overlayColor, img } = payload;

  verbosity(payload)
  let canvas = document.createElement('canvas');
  let image = new Image();

  image.src = img
  image.setAttribute('crossOrigin', '');
  image.onload = () =>{
    const imagePixelColors = getImagePixelColorsUsingCanvas(canvas, image);
    if(imagePixelColors){
      const worstContrastColorInImage = getWorstContrastColorInImage(textColor, imagePixelColors);
      const optimalOpacity = findOptimalOverlayOpacity(textColor, overlayColor, worstContrastColorInImage, appTheme_desiredContrast);
      return callback(optimalOpacity)
    }else{
      return false
    }

  }
  
}

export function getImagePixelColorsUsingCanvas(canvas, image) {
  let imagePixelColors = null;
  const ctx = canvas.getContext('2d');

  canvas.height = getCanvasHeightToMatchImageProportions(canvas, image);

  const sourceImageCoordinates = [0, 0, image.width, image.height];
  const destinationCanvasCoordinates = [0, 0, canvas.width, canvas.height];

  ctx.drawImage(
    image,
    ...sourceImageCoordinates,
    ...destinationCanvasCoordinates
  );

  // Remember getImageData only works for same-origin or cross-origin-enabled images.
  // See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more info.
  try {
    imagePixelColors = ctx.getImageData(...destinationCanvasCoordinates);
  } catch (error) {
    return errorHandlers.onError.internal_proccess(error)
  }

  if (imagePixelColors) {
    return imagePixelColors
  }
}

export function getCanvasHeightToMatchImageProportions(canvas, image) {
  return (image.height / image.width) * canvas.width;
}

export function getWorstContrastColorInImage(textColor, imagePixelColors) {
  let worstContrastColorInImage;
  let worstContrast = Infinity;

  for (let i = 0; i < imagePixelColors.data.length; i += 4) {
    let pixelColor = {
      r: imagePixelColors.data[i],
      g: imagePixelColors.data[i + 1],
      b: imagePixelColors.data[i + 2],
    };

    let contrast = getContrast(textColor, pixelColor);
    if(contrast < worstContrast) {
      worstContrast = contrast;
      worstContrastColorInImage = pixelColor;
    }
  }
  return worstContrastColorInImage;
}

export function getContrast(color1, color2) {
  const color1_luminance = getLuminance(color1);
  const color2_luminance = getLuminance(color2);

  const lighterColorLuminance = Math.max(color1_luminance, color2_luminance);
  const darkerColorLuminance = Math.min(color1_luminance, color2_luminance);

  const contrast = (lighterColorLuminance + 0.05) / (darkerColorLuminance + 0.05);
  return contrast;
}

export function getLuminance({r,g,b}) {
  return (0.2126 * getLinearRGB(r) + 0.7152 * getLinearRGB(g) + 0.0722 * getLinearRGB(b));
}

export function getLinearRGB(primaryColor_8bit) {
  // First convert from 8-bit rbg (0-255) to standard RGB (0-1)
  const primaryColor_sRGB = convert_8bit_RGB_to_standard_RGB(primaryColor_8bit);

  // Then convert from sRGB to linear RGB so we can use it to calculate luminance
  const primaryColor_RGB_linear = convert_standard_RGB_to_linear_RGB(primaryColor_sRGB);

  return primaryColor_RGB_linear;
}

export function convert_8bit_RGB_to_standard_RGB(primaryColor_8bit) {
  return primaryColor_8bit / 255;
}

export function convert_standard_RGB_to_linear_RGB(primaryColor_sRGB) {
  const primaryColor_linear = primaryColor_sRGB < 0.03928 ?
    primaryColor_sRGB/12.92 :
    Math.pow((primaryColor_sRGB + 0.055) / 1.055, 2.4);
  return primaryColor_linear;
}

export function getTextContrastWithImagePlusOverlay({textColor, overlayColor, imagePixelColor, overlayOpacity}) {
  const colorOfImagePixelPlusOverlay = mixColors(imagePixelColor, overlayColor, overlayOpacity);
  const contrast = getContrast(textColor, colorOfImagePixelPlusOverlay);
  return contrast;
}

export function mixColors(baseColor, overlayColor, overlayOpacity) {
  const mixedColor = {
    r: baseColor.r + (overlayColor.r - baseColor.r) * overlayOpacity,
    g: baseColor.g + (overlayColor.g - baseColor.g) * overlayOpacity,
    b: baseColor.b + (overlayColor.b - baseColor.b) * overlayOpacity,
  }
  return mixedColor;
}

export function findOptimalOverlayOpacity(textColor, overlayColor, worstContrastColorInImage, appTheme_desiredContrast) {
  const opacityGuessRange = {
    lowerBound: 0,
    midpoint: 0.5,
    upperBound: 1,
  };

  let numberOfGuesses = 0;
  const maxGuesses = 8;
  const opacityLimit = 0.99;

  while (numberOfGuesses < maxGuesses) {
    numberOfGuesses++;
    const currentGuess = opacityGuessRange.midpoint;

    const contrastOfGuess = getTextContrastWithImagePlusOverlay({
      textColor,
      overlayColor,
      imagePixelColor: worstContrastColorInImage,
      overlayOpacity: currentGuess,
    });

    const isGuessTooLow = contrastOfGuess < appTheme_desiredContrast;
    const isGuessTooHigh = contrastOfGuess > appTheme_desiredContrast;

    if (isGuessTooLow) {
      opacityGuessRange.lowerBound = currentGuess;
    }
    else if (isGuessTooHigh) {
      opacityGuessRange.upperBound = currentGuess;
    }

    const newMidpoint = ((opacityGuessRange.upperBound - opacityGuessRange.lowerBound) / 2) + opacityGuessRange.lowerBound;
    opacityGuessRange.midpoint = newMidpoint;
  }

  const optimalOpacity = opacityGuessRange.midpoint;

  if (optimalOpacity > opacityLimit) {
    return opacityLimit;
  }

  return optimalOpacity;
}

  