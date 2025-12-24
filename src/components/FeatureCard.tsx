import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  iconColor?: string;
}

const FeatureCard = ({ icon, title, description, buttonText, onClick, iconColor = 'text-fitness-red' }: FeatureCardProps) => {
  return (
    <div 
      className="feature-card-hover bg-background/90 border-[3px] border-primary rounded-2xl p-5 flex flex-col gap-4 cursor-pointer relative overflow-hidden transition-all duration-300 backdrop-blur-lg hover:-translate-y-1 hover:shadow-[0_18px_40px_hsla(0,100%,50%,0.4)] hover:border-fitness-red-glow animate-slideUp"
      onClick={onClick}
    >
      <div className="flex items-start gap-4 relative z-10">
        <div className={`text-4xl drop-shadow-[0_0_10px_hsla(0,100%,50%,0.6)] ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-primary mb-1">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <button 
        className="self-end bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_18px_hsla(0,100%,50%,0.4)] relative z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default FeatureCard;
