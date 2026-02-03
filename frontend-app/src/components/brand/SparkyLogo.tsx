import sparkyMarkImg from '../../assets/sparky/sparky-mark.png';

/**
 * Sparky logo mark for header/branding
 */
export default function SparkyLogo() {
  return (
    <div className="flex items-center gap-1 h-full">
      <img
        src={sparkyMarkImg}
        alt="Sparky"
        className="h-10 w-auto md:h-12 object-contain"
      />
      <span className="text-[22px] md:text-[24px] font-bold tracking-wide text-white leading-none">
        Sparky
      </span>
    </div>
  );
}
