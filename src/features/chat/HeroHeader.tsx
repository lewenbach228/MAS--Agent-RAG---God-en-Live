/**
 * HeroHeader
 *
 * Banniere avec identite visuelle : image + message de bienvenue.
 */

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
}

export function HeroHeader({ title, subtitle }: HeroHeaderProps) {
  return (
    <header className="hero-header">
      <div className="hero-header__image-wrapper">
        <img
          className="hero-header__image"
          src="/god-icon.jpg"
          alt="La Creation d'Adam — Michel-Ange"
        />
      </div>
      <h1 className="hero-header__title">{title}</h1>
      {subtitle && <p className="hero-header__subtitle">{subtitle}</p>}
    </header>
  );
}
