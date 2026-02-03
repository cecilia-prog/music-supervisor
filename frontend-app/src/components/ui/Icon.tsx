import sparkyMark from '../../assets/sparky/sparky-mark.png';
import sparkyIdle from '../../assets/sparky/sparky-idle.gif';
import sparkyListening from '../../assets/sparky/sparky-listening.gif';

export type IconName =
  | 'sparkyMark'
  | 'sparkyIdle'
  | 'sparkyListening';

type Props = {
  name: IconName;
  size?: number | string;
  className?: string;
  title?: string;
  decorative?: boolean;
};

const iconMap: Record<IconName, string> = {
  sparkyMark,
  sparkyIdle,
  sparkyListening,
};

/**
 * Sparky icon component with accessibility support
 */
export default function Icon({
  name,
  size = 24,
  className = '',
  title,
  decorative = false,
}: Props) {
  const src = iconMap[name];
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={src}
      alt={decorative ? '' : title || name}
      title={title}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? 'true' : undefined}
      className={`${className} object-contain`}
      style={{
        width: sizeValue,
        height: sizeValue,
        display: 'block',
        background: 'transparent',
      }}
    />
  );
}
