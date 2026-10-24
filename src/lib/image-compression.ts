export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalSizeKb: number;
  compressedSizeKb: number;
}

const MAX_DIMENSION = 1080;
const MAX_RAW_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function compressAndResizeImage(
  file: File,
  quality = 0.85
): Promise<CompressedImageResult> {
  // 1. Validate max 5MB raw upload size
  if (file.size > MAX_RAW_SIZE_BYTES) {
    throw new Error("File size exceeds 5MB limit. Please choose a smaller photo.");
  }

  // 2. Validate image MIME type
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files (JPEG, PNG, WEBP) are supported.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to load image for processing."));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale down to max 1080px
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        // Render to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Canvas context could not be initialized."));
        }

        // Smoothest image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to compress image blob."));
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanFileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: compressedFile,
              previewUrl,
              width,
              height,
              originalSizeKb: Math.round(file.size / 1024),
              compressedSizeKb: Math.round(blob.size / 1024),
            });
          },
          "image/jpeg",
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
