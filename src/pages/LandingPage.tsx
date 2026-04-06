import { useNavigate } from 'react-router-dom';
import { PhotoUpload } from '../components/PhotoUpload';
import { useApp } from '../context/AppContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const handlePhotoSelected = (dataUrl: string) => {
    dispatch({ type: 'SET_PHOTO', payload: dataUrl });
    navigate('/analyze');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative flex flex-col">
        {/* Header area with branding and headline */}
        <div className="pt-12 pb-8 px-4 text-center">
          {/* Logo/Brand */}
          <p className="font-display text-2xl font-bold text-ink mb-8">
            PickDesign
          </p>

          {/* Heading */}
          <h1 className="text-display-lg max-w-lg mx-auto mb-4">
            Design your space.
            <br />
            <span className="text-accent">Shop the look.</span>
          </h1>

          {/* Minimal subtitle */}
          <p className="text-ink/60 max-w-md mx-auto">
            Take a photo, get a design, buy everything in it.
          </p>
        </div>

        {/* Full-width photo upload */}
        <PhotoUpload onPhotoSelected={handlePhotoSelected} />
      </section>

      {/* Minimal footer */}
      <footer className="py-6 px-4 text-center text-xs text-ink/40">
        © 2026 PickDesign
      </footer>
    </div>
  );
}
