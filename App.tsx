import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Listing, Amenity, User, HotelStyle } from './types';
import { generateListings } from './services/geminiService';
import ListingCard from './components/ListingCard';
import BottomNav from './components/BottomNav';
import LoginModal from './components/LoginModal';
import { LogoIcon, ChevronDownIcon } from './constants';
import SearchBar from './components/SearchBar';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  const [destination, setDestination] = useState<string>('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtering State
  const [activeAmenities, setActiveAmenities] = useState<Amenity[]>([]);
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number>(0);
  const [activeStyles, setActiveStyles] = useState<HotelStyle[]>([]);
  const [showOffersOnly, setShowOffersOnly] = useState<boolean>(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState<boolean>(true);
  
  // Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [initialAuthView, setInitialAuthView] = useState<'signIn' | 'signUp'>('signIn');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentUser: User = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email,
          email: session.user.email!,
          avatarUrl: session.user.user_metadata.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(session.user.user_metadata.full_name || session.user.email!)}`,
        };
        setUser(currentUser);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const currentUser: User = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email,
          email: session.user.email!,
          avatarUrl: session.user.user_metadata.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(session.user.user_metadata.full_name || session.user.email!)}`,
        };
        setUser(currentUser);
        setIsLoginModalOpen(false);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const handleResetFilters = useCallback(() => {
    setActiveAmenities([]);
    setPriceRange(1000);
    setMinRating(0);
    setActiveStyles([]);
    setShowOffersOnly(false);
  }, []);

  const searchForDestination = useCallback(async (searchDest: string, searchCheckIn: Date | null, searchCheckOut: Date | null) => {
    setIsLoading(true);
    setError(null);
    setListings([]);
    handleResetFilters();
    
    try {
      const result = await generateListings(searchDest, searchCheckIn, searchCheckOut);
      setListings(result.hotels);
    } catch (e) {
      console.error(e);
      setError('Sorry, we couldn\'t fetch listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [handleResetFilters]);
  
  const handleSearch = useCallback(() => {
    if (!destination.trim()) {
      setError('Please enter a destination.');
      return;
    }
    searchForDestination(destination, checkIn, checkOut);
  }, [destination, checkIn, checkOut, searchForDestination]);

  const handleAmenityToggle = (amenity: Amenity) => {
    setActiveAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleStyleToggle = (style: HotelStyle) => {
    setActiveStyles(prev =>
        prev.includes(style)
            ? prev.filter(s => s !== style)
            : [...prev, style]
    );
  };

  const sortedAndFilteredListings = useMemo(() => {
    const filtered = listings.filter(listing => {
        const priceMatch = listing.pricePerNight <= priceRange;
        const amenitiesMatch = activeAmenities.length === 0 || activeAmenities.every(amenity => listing.amenities.includes(amenity));
        const ratingMatch = listing.rating >= minRating;
        const styleMatch = activeStyles.length === 0 || activeStyles.includes(listing.style);
        const offersMatch = !showOffersOnly || (showOffersOnly && !!listing.specialOffer);
        return priceMatch && amenitiesMatch && ratingMatch && styleMatch && offersMatch;
    });

    return filtered.sort((a, b) => {
        if (a.isAiSuggested && !b.isAiSuggested) return -1;
        if (!a.isAiSuggested && b.isAiSuggested) return 1;
        return 0;
    });
  }, [listings, activeAmenities, priceRange, minRating, activeStyles, showOffersOnly]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  
  const handleHomeClick = () => {
    setDestination('');
    setCheckIn(null);
    setCheckOut(null);
    setListings([]);
    setError(null);
    handleResetFilters();
  };
  
  const openLoginModal = (view: 'signIn' | 'signUp') => {
    setInitialAuthView(view);
    setIsLoginModalOpen(true);
  };

  const ratingLevels = [
      { label: 'Any', value: 0 },
      { label: '3.5+', value: 3.5 },
      { label: '4.0+', value: 4 },
      { label: '4.5+', value: 4.5 },
  ];
  
  const hasActiveFilters = activeAmenities.length > 0 || priceRange < 1000 || minRating > 0 || activeStyles.length > 0 || showOffersOnly;

  return (
    <>
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialView={initialAuthView}
      />
      <div className="min-h-screen font-sans text-gray-800">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <header className="pt-6 pb-4 sticky top-0 z-30 bg-white/30 backdrop-blur-lg rounded-b-xl shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-4">
            <div className="flex justify-between items-center">
              <div onClick={handleHomeClick} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center shadow-md">
                      <LogoIcon />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors">AI Stays</h1>
              </div>
              
              {user ? (
                 <div className="flex items-center gap-3">
                   <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                   <div>
                      <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                      <button onClick={handleSignOut} className="text-xs text-rose-500 hover:underline">Sign Out</button>
                   </div>
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                    <button onClick={() => openLoginModal('signIn')} className="px-4 py-2 text-sm font-semibold text-rose-500 bg-white/70 backdrop-blur-sm rounded-full border border-rose-200 hover:bg-rose-100 transition-colors">
                        Sign In
                    </button>
                     <button onClick={() => openLoginModal('signUp')} className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 rounded-full hover:bg-rose-600 transition-colors">
                        Sign Up
                    </button>
                </div>
              )}
            </div>
          </header>

          <SearchBar
            destination={destination}
            setDestination={setDestination}
            checkIn={checkIn}
            setCheckIn={setCheckIn}
            checkOut={checkOut}
            setCheckOut={setCheckOut}
            handleSearch={handleSearch}
            isLoading={isLoading}
          />

          <div className="flex flex-col md:flex-row md:gap-8">
            <aside className="md:w-72 md:flex-shrink-0 md:sticky md:top-24 self-start">
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-bold text-gray-800 text-lg">Filters</h2>
                        {hasActiveFilters && (
                             <button
                                onClick={handleResetFilters}
                                className="text-xs font-semibold text-rose-500 hover:underline"
                             >
                                Reset All
                             </button>
                        )}
                    </div>

                    <div className="p-4 bg-white/60 backdrop-blur-md rounded-lg border border-white/30 shadow-md">
                        <label htmlFor="price-range" className="block text-sm font-semibold text-gray-700 mb-2">
                            Max Price per Night: <span className="font-bold text-rose-500">£{priceRange}</span>
                        </label>
                        <input
                            id="price-range"
                            type="range"
                            min="50"
                            max="1000"
                            step="10"
                            value={priceRange}
                            onChange={(e) => setPriceRange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                    </div>

                    <div className="p-4 bg-white/60 backdrop-blur-md rounded-lg border border-white/30 shadow-md">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel Style</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(HotelStyle).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => handleStyleToggle(style)}
                                    className={`text-xs font-semibold py-2 rounded-md transition-colors border text-center ${
                                        activeStyles.includes(style)
                                            ? 'bg-rose-500 text-white border-rose-500'
                                            : 'bg-white/70 text-gray-700 border-gray-300 hover:bg-rose-100 hover:border-rose-300'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-white/60 backdrop-blur-md rounded-lg border border-white/30 shadow-md">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Guest Rating</h3>
                        <div className="flex items-center gap-1">
                            {ratingLevels.map(({ label, value }) => (
                                <button
                                    key={value}
                                    onClick={() => setMinRating(value)}
                                    className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors border ${
                                        minRating === value
                                            ? 'bg-rose-500 text-white border-rose-500'
                                            : 'bg-white/70 text-gray-700 border-gray-300 hover:bg-rose-100 hover:border-rose-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                     <div className="p-4 bg-white/60 backdrop-blur-md rounded-lg border border-white/30 shadow-md">
                        <button
                            onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
                            className="w-full flex justify-between items-center text-sm font-semibold text-gray-700"
                            aria-expanded={isAmenitiesExpanded}
                        >
                            <span>Filter by Amenities</span>
                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isAmenitiesExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isAmenitiesExpanded && (
                            <div className="mt-4 space-y-3">
                                {Object.values(Amenity).map(amenity => (
                                    <label key={amenity} className="flex items-center space-x-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={activeAmenities.includes(amenity)}
                                            onChange={() => handleAmenityToggle(amenity)}
                                            className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{amenity}</span>
                                    </label>
                                ))}
                                {activeAmenities.length > 0 && (
                                     <button
                                        onClick={() => setActiveAmenities([])}
                                        className="text-xs font-semibold text-rose-500 hover:underline pt-2"
                                     >
                                        Clear amenities
                                     </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-white/60 backdrop-blur-md rounded-lg border border-white/30 shadow-md">
                        <label className="flex items-center justify-between cursor-pointer group">
                             <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Special Offers Only</span>
                             <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={showOffersOnly}
                                    onChange={(e) => setShowOffersOnly(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="block w-10 h-6 rounded-full bg-gray-300 peer-checked:bg-rose-500 transition"></div>
                                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                            </div>
                        </label>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-w-0">
                <div className="py-4 md:pt-0">
                    {error && <div className="text-center py-10 text-red-600 font-semibold bg-red-100/80 backdrop-blur-md rounded-lg" role="alert">{error}</div>}
                    
                    {isLoading && (
                    <div className="text-center py-10">
                        <div className="flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-4 h-4 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-4 h-4 rounded-full bg-rose-500 animate-bounce"></div>
                        </div>
                        <p className="mt-4 text-gray-800 font-semibold">Finding the best stays in {destination || 'your destination'}...</p>
                    </div>
                    )}
                    
                    {!isLoading && listings.length > 0 && sortedAndFilteredListings.length === 0 && (
                    <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/30">
                        <h2 className="text-xl font-semibold text-gray-700">No Matches Found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting your filters to see more results.</p>
                    </div>
                    )}

                    {!isLoading && listings.length === 0 && !error && (
                    <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/30">
                        <h2 className="text-xl font-semibold text-gray-700">Your perfect stay, discovered.</h2>
                        <p className="text-gray-500 mt-2">Enter a destination to find hotels tailored to your trip.</p>
                    </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedAndFilteredListings.map((listing, index) => (
                        <ListingCard key={`${listing.name}-${index}`} listing={listing} />
                    ))}
                    </div>
                </div>
            </main>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default App;