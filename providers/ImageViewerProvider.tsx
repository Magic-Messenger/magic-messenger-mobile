import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
} from "react";
import { InteractionManager } from "react-native";
import ImageView from "react-native-image-viewing";

type ImageItem = { uri: string };

interface ContextType {
  open: (images: ImageItem[], index?: number) => void;
  close: () => void;
}

const ImageViewerContext = createContext<ContextType | null>(null);

export const ImageViewerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [index, setIndex] = useState(0);
  const [, startTransition] = useTransition();

  const open = useCallback((imgs: ImageItem[], idx = 0) => {
    startTransition(() => {
      InteractionManager.runAfterInteractions(() => {
        setImages(imgs);
        setIndex(idx);
        setVisible(true);
      });
    });
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setImages([]);
    setIndex(0);
  }, []);

  return (
    <ImageViewerContext.Provider value={{ open, close }}>
      {children}

      {visible && images.length > 0 && (
        <ImageView
          images={images}
          imageIndex={index}
          visible
          onRequestClose={close}
          presentationStyle="overFullScreen"
        />
      )}
    </ImageViewerContext.Provider>
  );
};

export const useImageViewer = () => {
  const ctx = useContext(ImageViewerContext);
  if (!ctx) {
    throw new Error("useImageViewer must be used inside ImageViewerProvider");
  }
  return ctx;
};
