import Lottie from 'lottie-react';
import loadingAnimation from '../../loading.json';
import './Loading.css';

export default function Loading({ text, className = '' }) {
  return (
    <div className={`lottie-loading ${className}`.trim()}>
      <Lottie
        animationData={loadingAnimation}
        loop
        className="lottie-loading__animation"
      />
      {text && <p className="lottie-loading__text">{text}</p>}
    </div>
  );
}
