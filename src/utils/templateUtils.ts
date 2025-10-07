// Template utility functions for applying logo and color palette to generated images

export interface TemplateSettings {
  logoPreview?: string;
  selectedPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  selectedColor?: string;
  companyText?: string;
  textColor?: string;
  textSize?: number;
  textPosition?: 'above' | 'below' | 'left' | 'right';
  textAlignment?: 'left' | 'center' | 'right';
}

export const getTemplateSettings = (): TemplateSettings | null => {
  try {
    const saved = localStorage.getItem('brewpost-template');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const enhanceImagePromptWithTemplate = (originalPrompt: string): string => {
  const template = getTemplateSettings();
  if (!template) return originalPrompt;

  let enhancedPrompt = originalPrompt;

  // Add color palette instruction
  if (template.selectedColor && template.selectedColor !== 'transparent') {
    enhancedPrompt += ` Use ${template.selectedColor} as the primary color theme and accent color throughout the image.`;
  }

  // Add logo space instruction
  if (template.logoPreview && template.selectedPosition) {
    const positionMap = {
      'top-left': 'top-left corner',
      'top-center': 'top center',
      'top-right': 'top-right corner',
      'bottom-left': 'bottom-left corner',
      'bottom-center': 'bottom center',
      'bottom-right': 'bottom-right corner'
    };
    
    enhancedPrompt += ` Leave space in the ${positionMap[template.selectedPosition]} for a logo overlay.`;
  }

  return enhancedPrompt;
};

export const applyTemplateToImage = async (imageUrl: string): Promise<string> => {
  const template = getTemplateSettings();
  if (!template || (!template.logoPreview && !template.companyText && (!template.selectedColor || template.selectedColor === 'transparent'))) return imageUrl;

  try {
    // Fetch image as blob to bypass CORS
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        resolve(imageUrl);
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Apply color overlay if specified
      if (template.selectedColor && template.selectedColor !== 'transparent') {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = template.selectedColor + '30';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Add logo and text if available
      if (template.logoPreview && template.selectedPosition) {
        const logo = new Image();
        
        logo.onload = () => {
          const logoSize = Math.min(canvas.width, canvas.height) * 0.12;
          const logoWidth = logoSize;
          const logoHeight = (logo.height / logo.width) * logoSize;
          
          let logoX = 0, logoY = 0;
          const padding = Math.max(20, canvas.width * 0.02);
          
          // Calculate logo position
          switch (template.selectedPosition) {
            case 'top-left':
              logoX = padding;
              logoY = padding;
              break;
            case 'top-center':
              logoX = (canvas.width - logoWidth) / 2;
              logoY = padding;
              break;
            case 'top-right':
              logoX = canvas.width - logoWidth - padding;
              logoY = padding;
              break;
            case 'bottom-left':
              logoX = padding;
              logoY = canvas.height - logoHeight - padding;
              break;
            case 'bottom-center':
              logoX = (canvas.width - logoWidth) / 2;
              logoY = canvas.height - logoHeight - padding;
              break;
            case 'bottom-right':
              logoX = canvas.width - logoWidth - padding;
              logoY = canvas.height - logoHeight - padding;
              break;
          }
          
          // Draw logo with shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Add company text if available
          if (template.companyText) {
            const fontSize = (template.textSize || 24) * (canvas.width / 1000);
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.fillStyle = template.textColor || '#000000';
            ctx.textAlign = template.textAlignment || 'center';
            
            const textMetrics = ctx.measureText(template.companyText);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            
            let textX = logoX + logoWidth / 2;
            let textY = logoY + logoHeight / 2;
            
            // Position text relative to logo
            switch (template.textPosition) {
              case 'above':
                textY = logoY - 10;
                break;
              case 'below':
                textY = logoY + logoHeight + textHeight + 10;
                break;
              case 'left':
                textX = logoX - 2;
                ctx.textAlign = 'right';
                textY = logoY + logoHeight / 2 + textHeight / 3;
                break;
              case 'right':
                textX = logoX + logoWidth + 2;
                ctx.textAlign = 'left';
                textY = logoY + logoHeight / 2 + textHeight / 3;
                break;
            }
            
            // Add text shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillText(template.companyText, textX, textY);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          
          try {
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            console.warn('Canvas tainted, returning original image');
            resolve(imageUrl);
          }
        };
        
        logo.onerror = () => {
          console.warn('Logo failed to load');
          try {
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            console.warn('Canvas tainted, returning original image');
            resolve(imageUrl);
          }
        };
        logo.src = template.logoPreview;
      } else if (template.companyText) {
        // Only text, no logo
        const fontSize = (template.textSize || 24) * (canvas.width / 1000);
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = template.textColor || '#000000';
        ctx.textAlign = 'center';
        
        const padding = Math.max(20, canvas.width * 0.02);
        let textX = canvas.width / 2;
        let textY = padding + fontSize;
        
        // Position text based on selected position
        switch (template.selectedPosition) {
          case 'top-left':
            ctx.textAlign = 'left';
            textX = padding;
            textY = padding + fontSize;
            break;
          case 'top-center':
            textX = canvas.width / 2;
            textY = padding + fontSize;
            break;
          case 'top-right':
            ctx.textAlign = 'right';
            textX = canvas.width - padding;
            textY = padding + fontSize;
            break;
          case 'bottom-left':
            ctx.textAlign = 'left';
            textX = padding;
            textY = canvas.height - padding;
            break;
          case 'bottom-center':
            textX = canvas.width / 2;
            textY = canvas.height - padding;
            break;
          case 'bottom-right':
            ctx.textAlign = 'right';
            textX = canvas.width - padding;
            textY = canvas.height - padding;
            break;
        }
        
        // Add text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(template.companyText, textX, textY);
        
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          console.warn('Canvas tainted, returning original image');
          resolve(imageUrl);
        }
      } else {
        // No logo or text, but apply color overlay if specified
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          console.warn('Canvas tainted, returning original image');
          resolve(imageUrl);
        }
      }
    };
    
      img.onerror = () => {
        console.warn('Base image failed to load');
        URL.revokeObjectURL(blobUrl);
        resolve(imageUrl);
      };
      img.src = blobUrl;
    });
  } catch (error) {
    console.warn('Failed to fetch image:', error);
    return imageUrl;
  }
};