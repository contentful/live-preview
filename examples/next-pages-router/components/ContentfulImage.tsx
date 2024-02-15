import Image, { ImageProps } from 'next/image';

const contentfulLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  return `https://${src}?w=${width}&q=${quality || 75}`;
};

export const ContentfulImage = (props: ImageProps) => {
  return <Image loader={contentfulLoader} {...props} />;
};
