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
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 py-20">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-light rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sage-light rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-warm px-4 py-2 rounded-full text-sm font-medium text-accent mb-8 animate-fade-up">
            <span>✦</span>
            <span>AI-Powered Interior Design</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Redesign any space.
            <br />
            Buy <em className="text-accent italic">everything</em> in it.
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-ink/70 mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Snap a photo of a corner, a wall, or a whole room. Get AI design suggestions with real products you can purchase instantly.
          </p>

          {/* Upload Section */}
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <PhotoUpload onPhotoSelected={handlePhotoSelected} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
            How it works
          </p>
          <h2 className="font-display text-3xl font-semibold mb-12">
            From photo to furnished in minutes
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: 1,
                title: 'Snap a photo',
                desc: 'Take a picture of any space — an awkward corner, an empty wall, or a full room ready for a refresh.',
              },
              {
                num: 2,
                title: 'Add dimensions',
                desc: 'Our AI highlights exactly what to measure. Enter a few numbers and we understand your space perfectly.',
              },
              {
                num: 3,
                title: 'Get your design',
                desc: 'AI creates a tailored design concept — furniture, decor, even wall colors — matched to your style and budget.',
              },
              {
                num: 4,
                title: 'Shop it all',
                desc: 'Every item links to real products you can buy. One tap from inspiration to your doorstep.',
              },
            ].map((step) => (
              <div key={step.num} className="bg-cream rounded-2xl p-6 hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 bg-accent-light text-accent rounded-xl flex items-center justify-center font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-ink mb-2">{step.title}</h3>
                <p className="text-sm text-ink/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Space Types */}
      <section className="py-20 px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
          Works for everything
        </p>
        <h2 className="font-display text-3xl font-semibold mb-4">
          Big projects. Small fixes. Everything in between.
        </h2>
        <p className="text-ink/70 mb-8">
          From "I need to redesign my living room" to "what do I put in that weird corner?"
        </p>

        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {[
            'Empty corners',
            'Living rooms',
            'Kids rooms',
            'Home offices',
            'Bedrooms',
            'Balconies',
            'Hallways',
            'Kitchens',
            'Bathrooms',
            'Pet spaces',
            'Shelving',
            'Wall art layouts',
          ].map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 bg-white border border-warm rounded-full text-sm font-medium hover:border-accent hover:bg-accent-light/20 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-ink/50 border-t border-warm">
        © 2026 PickDesign. All rights reserved.
      </footer>
    </div>
  );
}
