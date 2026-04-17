import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MAX_PHOTOS, useApp } from '../context/AppContext';

// Before/After showcase images from Unsplash
const showcaseItems = [
  {
    before: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
    label: 'Living Room',
  },
  {
    before: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    label: 'Bedroom',
  },
  {
    before: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
    label: 'Kitchen',
  },
];

// Hero before/after images
const heroImages = {
  before: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  after: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
};

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function ShowcaseCard({ before, after, label }: { before: string; after: string; label: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Before image */}
      <img
        src={before}
        alt={`${label} before`}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {/* After image */}
      <img
        src={after}
        alt={`${label} after`}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="text-white/70 text-sm font-medium mb-1">
          {isHovered ? 'After' : 'Before'}
        </p>
        <p className="text-white text-xl font-semibold">{label}</p>
      </div>
      {/* Hover hint */}
      <div className={`absolute top-4 right-4 px-3 py-1.5 bg-white/90 rounded-full text-xs font-medium text-ink transition-opacity ${
        isHovered ? 'opacity-0' : 'opacity-100'
      }`}>
        Hover to reveal
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function LandingPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedPhotos, setStagedPhotos] = useState<string[]>([]);

  const showcase = useScrollReveal();
  const howItWorks = useScrollReveal();
  const upload = useScrollReveal();

  const addFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      alert('Please select an image file');
      return;
    }

    const remaining = MAX_PHOTOS - stagedPhotos.length;
    const toRead = images.slice(0, remaining);
    try {
      const dataUrls = await Promise.all(toRead.map(readFileAsDataUrl));
      setStagedPhotos((prev) => [...prev, ...dataUrls].slice(0, MAX_PHOTOS));
      // Make sure the staging UI is visible after upload
      requestAnimationFrame(() => {
        document
          .getElementById('upload-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch {
      alert('Could not read one of the selected images.');
    }
  };

  const openPicker = () => {
    if (stagedPhotos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) void addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeStaged = (index: number) => {
    setStagedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const startDesigning = () => {
    if (stagedPhotos.length === 0) {
      openPicker();
      return;
    }
    dispatch({ type: 'SET_PHOTOS', payload: stagedPhotos });
    navigate('/analyze');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tight">
            Pick<span className="text-teal">Design</span>
          </span>
          <button
            onClick={openPicker}
            className="btn-primary text-sm py-2.5 px-5"
          >
            Start Designing
          </button>
        </div>
      </nav>

      {/* Hero Section - Split Layout */}
      <section className="min-h-screen pt-20 flex flex-col lg:flex-row">
        {/* Left side - Typography */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-0">
          <div className="max-w-xl">
            <p className="text-gold font-semibold text-sm tracking-wide uppercase mb-4 animate-fade-up">
              The future of interior design
            </p>
            <h1 className="text-display-hero text-ink mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Transform any space into your
              <span className="text-teal"> dream home</span>
            </h1>
            <p className="text-lg text-gray-dark leading-relaxed mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Upload a photo of your room and watch as our design engine creates a stunning makeover — complete with shoppable furniture picks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={openPicker}
                className="btn-primary text-lg px-8 py-4"
              >
                Design Your Space
              </button>
              <button
                onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary"
              >
                See Examples
              </button>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-teal-light border-2 border-white flex items-center justify-center text-teal text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-dark">
                <span className="font-semibold text-ink">500+</span> homeowners redesigning their spaces
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Hero Image */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-screen">
          {/* Before/After comparison */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="relative h-full">
              {/* After image (background) */}
              <img
                src={heroImages.after}
                alt="Redesigned room"
                className="absolute inset-0 w-full h-full object-cover animate-fade-in"
              />
              {/* Before image (overlay with clip) */}
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <img
                  src={heroImages.before}
                  alt="Original room"
                  className="absolute inset-0 w-[200%] h-full object-cover"
                />
              </div>
              {/* Divider line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-lg">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
              {/* Labels */}
              <div className="absolute top-8 left-8 px-4 py-2 bg-ink/80 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                Before
              </div>
              <div className="absolute top-8 right-8 px-4 py-2 bg-teal text-white text-sm font-medium rounded-full shadow-lg">
                After
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimal Strip */}
      <section
        ref={howItWorks.ref}
        className={`py-16 bg-teal transition-all duration-1000 ${howItWorks.isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center">
            {[
              { icon: '📸', step: 'Snap', desc: 'Take a photo of your space' },
              { icon: '✨', step: 'Style', desc: 'Get a personalized design' },
              { icon: '🛒', step: 'Shop', desc: 'Buy everything you see' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
                <span className="text-4xl">{item.icon}</span>
                <div className="text-center md:text-left">
                  <p className="text-white font-bold text-xl">{item.step}</p>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block text-white/30 text-2xl ml-4">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section
        id="showcase"
        ref={showcase.ref}
        className={`py-24 px-6 transition-all duration-1000 ${showcase.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold font-semibold text-sm tracking-wide uppercase mb-3">
              Transformations
            </p>
            <h2 className="text-display-lg text-ink mb-4">
              See what's possible
            </h2>
            <p className="text-gray-dark text-lg max-w-2xl mx-auto">
              Real rooms, real transformations. Hover over each card to see the stunning results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcaseItems.map((item, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 0.15}s` }}
                className={showcase.isVisible ? 'animate-fade-up' : 'opacity-0'}
              >
                <ShowcaseCard {...item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Section with Background */}
      <section
        id="upload-section"
        ref={upload.ref}
        className={`relative py-32 transition-all duration-1000 ${upload.isVisible || stagedPhotos.length > 0 ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-display-lg text-white mb-6">
            Ready to transform your space?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Upload a photo and get your personalized design in minutes. One photo works great — add up to {MAX_PHOTOS} angles for richer results.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
          />

          {stagedPhotos.length === 0 ? (
            /* Empty-state upload area */
            <div
              onClick={openPicker}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 rounded-2xl p-12 cursor-pointer hover:bg-white/20 hover:border-white/50 transition-all group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-teal flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-xl font-semibold mb-1">
                    Upload your room photo
                  </p>
                  <p className="text-white/60 text-sm">
                    or drag and drop here · up to {MAX_PHOTOS} angles
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Staging: thumbnail strip + continue */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {stagedPhotos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={photo} alt={`Angle ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                      <p className="text-white text-xs font-semibold">
                        Angle {i + 1}{i === 0 ? ' · Hero' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeStaged(i); }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                      aria-label={`Remove Angle ${i + 1}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {stagedPhotos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={openPicker}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/40 hover:border-white/70 hover:bg-white/5 text-white/80 hover:text-white transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-medium">Add angle</span>
                  </button>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-white/70 text-sm">
                  {stagedPhotos.length === 1
                    ? 'One photo is enough — or add more angles for better coverage.'
                    : `${stagedPhotos.length} angles ready. Angle 1 will be used for the before/after render.`}
                </p>
                <button
                  type="button"
                  onClick={startDesigning}
                  className="btn-primary px-6 py-3 text-base whitespace-nowrap"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl font-bold tracking-tight">
            Pick<span className="text-teal">Design</span>
          </span>
          <p className="text-gray-dark text-sm">
            © 2026 PickDesign. Transform your space.
          </p>
        </div>
      </footer>
    </div>
  );
}
